import os
import uuid
from typing import Optional
from fastapi import UploadFile, HTTPException
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB limit

async def validate_and_save_upload(
    upload_file: Optional[UploadFile],
    prefix: str = "upload"
) -> Optional[str]:
    """
    Validates uploaded file size, extension whitelist, and MIME content type.
    Saves securely using a sanitized UUID filename to prevent path traversal
    and stored script execution.
    """
    if not upload_file or not upload_file.filename:
        return None

    # Check extension
    orig_ext = os.path.splitext(upload_file.filename)[1].lower()
    if orig_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{orig_ext}'. Allowed image extensions: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Check MIME content type if provided
    content_type = (upload_file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{content_type}'. Only images (JPEG, PNG, WebP) are allowed."
        )

    contents = await upload_file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB."
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{prefix}_{uuid.uuid4().hex[:12]}{orig_ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    return f"/uploads/{filename}"
