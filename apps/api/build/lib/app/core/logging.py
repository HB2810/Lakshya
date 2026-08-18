"""Structured JSON logging with correlation IDs and secret redaction.

SECURITY.md §6: "Credentials, reset/session tokens and provider secrets never
appear in logs, audit payloads or analytics."

The redaction filter here is defence in depth. The primary control is that no
call site passes secret material into a log record.
"""

from __future__ import annotations

import json
import logging
import logging.config
import re
from typing import Any

from app.core.config import Settings
from app.core.correlation import get_correlation_id

# Patterns that must never reach a log sink even if a call site is careless.
#
# The value pattern consumes everything up to a structural delimiter rather than
# a single token, so a multi-word secret such as ``authorization: Bearer <jwt>``
# is redacted whole. Over-redacting is the correct direction for a backstop: the
# primary control is that no call site logs secret material in the first place.
_SECRET_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(
        r"(?i)(password|passwd|secret|token|credential|cookie|authorization)"
        r"\s*[=:]\s*[^,;\n\r\"'}\]]*"
    ),
    re.compile(r"(?i)\b(postgres(?:ql)?\+?\w*://[^:\s]+):[^@\s]+@"),
)

_REDACTED = "[redacted]"

_RESERVED_RECORD_KEYS = frozenset(
    {
        "args",
        "asctime",
        "created",
        "exc_info",
        "exc_text",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "module",
        "msecs",
        "message",
        "msg",
        "name",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "taskName",
        "thread",
        "threadName",
    }
)


def scrub(text: str) -> str:
    """Remove obvious secret material from a string."""
    scrubbed = _SECRET_PATTERNS[0].sub(lambda m: f"{m.group(1)}={_REDACTED}", text)
    return _SECRET_PATTERNS[1].sub(r"\1:" + _REDACTED + "@", scrubbed)


class CorrelationFilter(logging.Filter):
    """Attach the current correlation ID to every record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.correlation_id = get_correlation_id()
        return True


class JsonFormatter(logging.Formatter):
    """Emit one JSON object per line, with secrets scrubbed."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": self.formatTime(record, datefmt="%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": scrub(record.getMessage()),
            "correlation_id": getattr(record, "correlation_id", None),
        }

        for key, value in record.__dict__.items():
            if key in _RESERVED_RECORD_KEYS or key in payload or key.startswith("_"):
                continue
            payload[key] = scrub(value) if isinstance(value, str) else value

        if record.exc_info:
            # Exception type and message only. Full tracebacks stay out of the
            # structured field; they are still visible via the message when the
            # application logs them deliberately.
            exc_type, exc_value, _ = record.exc_info
            payload["exception"] = {
                "type": getattr(exc_type, "__name__", str(exc_type)),
                "message": scrub(str(exc_value)),
            }

        return json.dumps(payload, default=str, separators=(",", ":"))


def configure_logging(settings: Settings) -> None:
    """Install the structured logging configuration."""
    level = settings.log_level.upper()
    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "filters": {"correlation": {"()": CorrelationFilter}},
            "formatters": {"json": {"()": JsonFormatter}},
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                    "filters": ["correlation"],
                    "stream": "ext://sys.stdout",
                }
            },
            "root": {"handlers": ["console"], "level": level},
            "loggers": {
                "uvicorn": {"handlers": ["console"], "level": level, "propagate": False},
                "uvicorn.access": {"handlers": ["console"], "level": level, "propagate": False},
                "uvicorn.error": {"handlers": ["console"], "level": level, "propagate": False},
                # SQL statements can embed parameter values; keep them off by
                # default so credential updates never surface in logs.
                "sqlalchemy.engine": {"level": "WARNING", "propagate": True},
            },
        }
    )
