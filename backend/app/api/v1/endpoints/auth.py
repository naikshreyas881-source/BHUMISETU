from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.audit import log_audit_event
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.token import Token
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    """Register a new user in the BHUMISETU platform."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    # Hash password securely
    hashed_pwd = get_password_hash(user_in.password)

    new_user = User(
        email=user_in.email,
        phone_number=user_in.phone_number,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd,
        role=user_in.role,
        preferred_language=user_in.preferred_language,
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    client_ip = request.client.host if request.client else None
    log_audit_event(
        db=db,
        action="USER_REGISTER",
        user_id=new_user.id,
        resource_type="USER",
        resource_id=str(new_user.id),
        details=f"User registered with role {new_user.role.value}",
        ip_address=client_ip,
    )

    return new_user


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticate a user using email and password and return a JWT access token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        client_ip = request.client.host if request.client else None
        log_audit_event(
            db=db,
            action="LOGIN_FAILED",
            user_id=user.id if user else None,
            resource_type="USER",
            details=f"Failed login attempt for email {login_data.email}",
            ip_address=client_ip,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive.",
        )

    client_ip = request.client.host if request.client else None
    log_audit_event(
        db=db,
        action="USER_LOGIN",
        user_id=user.id,
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Successful login for role {user.role.value}",
        ip_address=client_ip,
    )

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/oauth2-login", response_model=Token, include_in_schema=False)
def oauth2_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Swagger UI compatible OAuth2 form login."""
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get profile information for the currently authenticated user."""
    return current_user
