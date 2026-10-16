
from fastapi import APIRouter, Depends

from app.database.auth_dependencies import get_current_user
from app.models import User

router = APIRouter(
    prefix="/api",
    tags=["Protected APIs"],
)


@router.get("/auth/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }
