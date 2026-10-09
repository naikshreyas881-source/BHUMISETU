from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.ai.farmvoice import process_farmvoice_interaction
from app.ai.tools import execute_confirm_booking, BOOKING_DRAFTS

router = APIRouter()

class VoiceInteractRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    language: str = Field(default="en")
    active_draft_id: Optional[str] = None

class VoiceConfirmRequest(BaseModel):
    draft_id: str = Field(..., min_length=3)
    confirmation_phrase: str = Field(default="confirm")

@router.post("/interact", response_model=Dict[str, Any])
def interact_with_farmvoice(
    payload: VoiceInteractRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Multilingual voice & text interaction with FarmVoice AI.
    Executes real database queries and prepares safe booking drafts.
    """
    return process_farmvoice_interaction(
        db=db,
        user_id=current_user.id,
        user_message=payload.message,
        language=payload.language,
        active_draft_id=payload.active_draft_id
    )

@router.post("/confirm", response_model=Dict[str, Any])
def confirm_booking_draft(
    payload: VoiceConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Explicit user confirmation of a previously prepared booking draft.
    Binds spoken or clicked confirmation to the exact draft summary.
    """
    res = execute_confirm_booking(
        db=db,
        user_id=current_user.id,
        draft_id=payload.draft_id,
        confirmation_phrase=payload.confirmation_phrase
    )
    if "error" in res:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res["error"])
    return res

@router.get("/draft/{draft_id}", response_model=Dict[str, Any])
def get_booking_draft(
    draft_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves the exact summary of an active booking draft for verification.
    """
    draft = BOOKING_DRAFTS.get(draft_id)
    if not draft or draft.get("user_id") != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Draft not found or expired.")
    return draft
