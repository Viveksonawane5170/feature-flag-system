
from fastapi import APIRouter, Depends

from app.database.auth_dependencies import require_admin
from app.models import User

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


@router.get("/test")
def admin_test(
    current_user: User = Depends(require_admin),
):
    return {
        "message": "Admin access granted",
        "user": current_user.name,
        "role": current_user.role,
    }
