from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, admin, farms, resources, bookings, coordination, weather, voice

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
api_router.include_router(farms.router, prefix="/farms", tags=["Farms & Crops"])
api_router.include_router(resources.router, prefix="/resources", tags=["Marketplace Resources"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["Bookings & Management"])
api_router.include_router(coordination.router, prefix="/coordination", tags=["Smart Coordination Engine"])
api_router.include_router(weather.router, prefix="/weather", tags=["Live Weather Engine"])
api_router.include_router(voice.router, prefix="/voice", tags=["FarmVoice AI Voice Assistant"])
