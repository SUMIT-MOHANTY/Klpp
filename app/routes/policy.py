"""Policy routes."""
from fastapi import APIRouter, HTTPException
from typing import List
from app.models.policy import Policy, PolicyCreate

policy_bp = APIRouter(prefix="/policies")

@policy_bp.get("/", response_model=List[Policy])
async def get_policies():
    """Get all policies."""
    return []

@policy_bp.post("/", response_model=Policy)
async def create_policy(policy: PolicyCreate):
    """Create a new policy."""
    try:
        policy_obj = Policy(
            id=1,
            **policy.dict()
        )
        return policy_obj
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
