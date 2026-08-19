"""Session and CSRF cookie handling.

ADR-002 / SECURITY.md §3: "Issue random opaque session tokens in ``Secure``,
``HttpOnly``, ``SameSite=Lax``, path-scoped cookies."

Why two cookies:

* the **session** cookie is ``HttpOnly`` — script cannot read it, so an XSS bug
  cannot exfiltrate the session identifier;
* the **CSRF** cookie is deliberately readable by script, because the browser
  client must copy its value into the ``X-CSRF-Token`` header. That value is not
  an authenticator on its own: without the ``HttpOnly`` session cookie it grants
  nothing, and the server checks it against the hash stored on the session row,
  so a token minted for another session fails.

No token is ever placed in ``localStorage`` (ADR-002 rejects browser bearer
tokens).
"""

from __future__ import annotations

from typing import Literal

from fastapi import Response

from app.core.config import Settings
from app.modules.identity.service import IssuedSession

_SAMESITE: Literal["lax"] = "lax"


def set_session_cookies(response: Response, issued: IssuedSession, settings: Settings) -> None:
    """Attach the session and CSRF cookies for a newly issued session."""
    max_age = settings.session_absolute_lifetime_minutes * 60

    response.set_cookie(
        key=settings.session_cookie_name,
        value=issued.session_token,
        max_age=max_age,
        path=settings.session_cookie_path,
        secure=settings.session_cookie_secure,
        httponly=True,
        samesite=_SAMESITE,
    )
    response.set_cookie(
        key=settings.csrf_cookie_name,
        value=issued.csrf_token,
        max_age=max_age,
        path=settings.session_cookie_path,
        secure=settings.session_cookie_secure,
        # Readable by the browser client on purpose — see the module docstring.
        httponly=False,
        samesite=_SAMESITE,
    )


def clear_session_cookies(response: Response, settings: Settings) -> None:
    """Remove both cookies on logout.

    The server-side revocation is what actually ends the session; clearing the
    cookies is housekeeping so the browser stops sending a dead token.
    """
    for name in (settings.session_cookie_name, settings.csrf_cookie_name):
        response.delete_cookie(
            key=name,
            path=settings.session_cookie_path,
            secure=settings.session_cookie_secure,
            httponly=name == settings.session_cookie_name,
            samesite=_SAMESITE,
        )
