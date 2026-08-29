"""FastAPI router for LAKSHYA Strategy & Priorities API."""

from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentContext, RequestContext, get_db
from app.modules.strategy.schemas import (
    MilestoneStepUpdate,
    QuarterlyPriorityCreate,
    QuarterlyPriorityResponse,
    QuarterlyPriorityUpdate,
)
from app.modules.strategy.service import StrategyService

router = APIRouter(prefix="/strategy", tags=["strategy"])


@router.get("/quarterly-priorities", response_model=list[QuarterlyPriorityResponse])
def list_quarterly_priorities(
    year: int | None = Query(default=None),
    quarter: str | None = Query(default=None),
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> list[QuarterlyPriorityResponse]:
    """List quarterly priorities for authenticated user's organization."""
    return StrategyService.list_quarterly_priorities(
        session=db,
        current_user=ctx.authenticated.user,
        year=year,
        quarter=quarter,
    )


@router.get("/quarterly-priorities/{priority_id}", response_model=QuarterlyPriorityResponse)
def get_quarterly_priority(
    priority_id: uuid.UUID,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> QuarterlyPriorityResponse:
    """Get a specific quarterly priority by ID."""
    return StrategyService.get_quarterly_priority(
        session=db,
        current_user=ctx.authenticated.user,
        priority_id=priority_id,
    )


@router.post(
    "/quarterly-priorities",
    response_model=QuarterlyPriorityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_quarterly_priority(
    payload: QuarterlyPriorityCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> QuarterlyPriorityResponse:
    """Create a new Quarterly Priority with initialized 10-milestone stepper."""
    return StrategyService.create_quarterly_priority(
        session=db,
        current_user=ctx.authenticated.user,
        payload=payload,
    )


@router.patch(
    "/quarterly-priorities/{priority_id}/milestones/{step_number}",
    response_model=QuarterlyPriorityResponse,
)
def update_milestone_step(
    priority_id: uuid.UUID,
    step_number: int,
    payload: MilestoneStepUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = CurrentContext,
) -> QuarterlyPriorityResponse:
    """Update status, verification notes, and progress of a specific milestone step."""
    return StrategyService.update_milestone_step(
        session=db,
        current_user=ctx.authenticated.user,
        priority_id=priority_id,
        step_number=step_number,
        payload=payload,
    )
