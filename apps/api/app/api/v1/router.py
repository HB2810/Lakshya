"""Aggregate ``/api/v1`` router."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, departments, organizations, roles, users

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(organizations.router)
api_router.include_router(departments.router)
api_router.include_router(users.router)
# Roles, permissions and role assignments share one module: they are one
# access-administration surface with interdependent rules.
api_router.include_router(roles.router)
