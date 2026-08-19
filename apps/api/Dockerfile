# LAKSHYA API image.
# Minimal base, non-root runtime user, no build toolchain in the final layer.

FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /srv/lakshya-api

# ---------------------------------------------------------------------------
# Dependencies
# ---------------------------------------------------------------------------
FROM base AS deps

COPY pyproject.toml requirements.lock ./
# Install the exact locked versions. `--no-deps` stops pip re-resolving, so the
# image contains precisely what was reviewed — two builds of the same commit
# produce the same dependency set. `psycopg[binary]` ships wheels, so no
# libpq or compiler is needed here.
RUN python -m pip install --upgrade pip \
    && python -m pip install --no-deps -r requirements.lock

# ---------------------------------------------------------------------------
# Runtime
# ---------------------------------------------------------------------------
FROM base AS runtime

RUN groupadd --system --gid 10001 lakshya \
    && useradd --system --uid 10001 --gid lakshya --no-create-home lakshya

COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin

COPY --chown=lakshya:lakshya alembic.ini ./alembic.ini
COPY --chown=lakshya:lakshya alembic ./alembic
COPY --chown=lakshya:lakshya app ./app

USER lakshya

EXPOSE 8000

# Migrations are NOT run here. They are a controlled release step
# (docs/architecture/DATABASE.md §9, ARCHITECTURE.md §14).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
