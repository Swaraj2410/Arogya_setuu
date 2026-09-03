import logging
from io import BytesIO

from fastapi import HTTPException, UploadFile, status


logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 5 * 1024 * 1024
SUPPORTED_IMAGE_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
}


class OcrService:
    async def extract_text(self, file: UploadFile) -> str:
        if file.content_type not in SUPPORTED_IMAGE_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported image type. Upload a PNG or JPG prescription image.",
            )

        content = await file.read()
        if not content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prescription image is empty.")
        if len(content) > MAX_IMAGE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Prescription image must be 5 MB or smaller.",
            )

        try:
            from PIL import Image, UnidentifiedImageError
            import pytesseract
        except Exception as exception:
            logger.exception("OCR dependencies are not available")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Local OCR engine is not available. Install Pillow, pytesseract, and the Tesseract binary.",
            ) from exception

        try:
            image = Image.open(BytesIO(content))
            image.verify()
            image = Image.open(BytesIO(content))
        except UnidentifiedImageError as exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is not a readable prescription image.",
            ) from exception
        except Exception as exception:
            logger.exception("Prescription image validation failed")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Prescription image appears to be corrupted.",
            ) from exception

        try:
            raw_text = pytesseract.image_to_string(image)
        except pytesseract.TesseractNotFoundError as exception:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Tesseract OCR binary is not installed or not on PATH.",
            ) from exception
        except Exception as exception:
            logger.exception("Prescription OCR failed")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Prescription OCR failed. Please try a clearer image.",
            ) from exception

        cleaned = self._clean_text(raw_text)
        if not cleaned:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No readable prescription text was found in the image.",
            )
        return cleaned

    @staticmethod
    def _clean_text(value: str) -> str:
        lines = [" ".join(line.split()) for line in value.splitlines()]
        return "\n".join(line for line in lines if line)
