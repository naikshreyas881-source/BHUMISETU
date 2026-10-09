from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.api.deps import require_roles
from app.models.user import User, UserRole
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter()


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles([UserRole.ADMINISTRATOR])),
):
    """Retrieve audit logs. Accessible exclusively to Administrator role."""
    logs = (
        db.query(AuditLog)
        .order_by(desc(AuditLog.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return logs
