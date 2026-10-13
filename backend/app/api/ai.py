import os
import uuid
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from app.ai.detector import ai_service
from app.core.config import settings
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/analyze")
async def analyze_image_endpoint(
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    category_hint: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Dedicated AI Image Analysis Endpoint.
    Returns predicted category, confidence score, severity rating, bounding boxes, and inference time.
    Explicitly flags if fallback demo mode is used per project requirements.
    """
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    target_path = image_url

    if image and image.filename:
        ext = os.path.splitext(image.filename)[1] or ".jpg"
        filename = f"ai_temp_{uuid.uuid4().hex[:8]}{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        contents = await image.read()
        with open(filepath, "wb") as f:
            f.write(contents)
        target_path = f"/uploads/{filename}"

    if not target_path:
        target_path = "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800"

    result = ai_service.analyze_image(image_path=target_path, hint_category=category_hint)
    return {
        "success": True,
        "image_url": target_path,
        "ai_result": result
    }
