"""Aggregate ``/api/v1`` router."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    analytics,
    auth,
    calendar,
    departments,
    organizations,
    roles,
    strategy,
    users,
    work_items,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(calendar.router)
api_router.include_router(organizations.router)
api_router.include_router(departments.router)
api_router.include_router(users.router)
api_router.include_router(work_items.router)
api_router.include_router(strategy.router)
api_router.include_router(analytics.router)
# Roles, permissions and role assignments share one module: they are one
# access-administration surface with interdependent rules.
api_router.include_router(roles.router)
