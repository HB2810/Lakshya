"""FastAPI router for LAKSHYA Needs MD Attention Executive Cockpit API."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentContext, RequestContext, get_db
from app.modules.md_attention.schemas import (
    CockpitActionResponse,
    ExecutiveOverrideRequest,
    GrantExtensionRequest,
    MDAttentionSummary,
    ReassignRaciRequest,
    ResolveEscalationRequest,
    VerifyEvidenceRequest,
)
from app.modules.md_attention.service import MDAttentionService

router = APIRouter(prefix="/md-attention", tags=["md-attention"])


@router.get("", response_model=MDAttentionSummary)
def get_md_attention_summary(
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> MDAttentionSummary:
    """Get server-derived executive items requiring MD/MD Office attention.

    Strictly gated to MD and MD Office leadership. Employees are rejected with HTTP 403.
    """
    effective_roles = list(ctx.authorization.effective_roles)
    return MDAttentionService.get_attention_summary(
        session=db,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
    )


@router.post("/resolve-escalation", response_model=CockpitActionResponse)
def resolve_escalation(
    payload: ResolveEscalationRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CockpitActionResponse:
    """Resolves an L3 escalation with authoritative MD decision and unblock directive."""
    effective_roles = list(ctx.authorization.effective_roles)
    return MDAttentionService.resolve_escalation(
        session=db,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        payload=payload,
    )


@router.post("/verify-evidence", response_model=CockpitActionResponse)
def verify_evidence(
    payload: VerifyEvidenceRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CockpitActionResponse:
    """Formally verifies Definition of Done evidence or reopens task to in_progress."""
    effective_roles = list(ctx.authorization.effective_roles)
    return MDAttentionService.verify_evidence(
        session=db,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        payload=payload,
    )


@router.post("/executive-override", response_model=CockpitActionResponse)
def executive_override(
    payload: ExecutiveOverrideRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CockpitActionResponse:
    """Issues an authoritative Executive Override clearing a blocker or adjusting timeline."""
    effective_roles = list(ctx.authorization.effective_roles)
    return MDAttentionService.executive_override(
        session=db,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        payload=payload,
    )


@router.post("/grant-extension", response_model=CockpitActionResponse)
def grant_extension(
    payload: GrantExtensionRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CockpitActionResponse:
    """Authorizes an executive deadline extension with formal rationale."""
    effective_roles = list(ctx.authorization.effective_roles)
    return MDAttentionService.grant_extension(
        session=db,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        payload=payload,
    )


@router.post("/reassign-raci", response_model=CockpitActionResponse)
def reassign_raci(
    payload: ReassignRaciRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> CockpitActionResponse:
    """Authoritatively reassigns RACI ownership and accountability."""
    effective_roles = list(ctx.authorization.effective_roles)
    return MDAttentionService.reassign_raci(
        session=db,
        current_user=ctx.authenticated.user,
        effective_roles=effective_roles,
        payload=payload,
    )
