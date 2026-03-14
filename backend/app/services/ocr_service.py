import os
import logging
from pathlib import Path
from PIL import Image
import pytesseract

logger = logging.getLogger(__name__)


def extract_text_from_image(file_path: str) -> str:
    """Extract text from an image file using Tesseract OCR."""
    try:
        image = Image.open(file_path)
        # Improve OCR accuracy with preprocessing
        image = image.convert("L")  # Grayscale
        text = pytesseract.image_to_string(image, config="--psm 6")
        logger.info(f"OCR completed for image: {file_path}")
        return text.strip()
    except Exception as e:
        logger.error(f"OCR failed for {file_path}: {e}")
        raise RuntimeError(f"OCR extraction failed: {str(e)}")


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using poppler + Tesseract for scanned PDFs."""
    try:
        import subprocess
        import tempfile

        text_parts = []

        # First try pdftotext (fast, works for text-based PDFs)
        result = subprocess.run(
            ["pdftotext", "-layout", file_path, "-"],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode == 0 and result.stdout.strip():
            logger.info(f"pdftotext extraction successful for {file_path}")
            return result.stdout.strip()

        # Fallback: convert PDF pages to images, then OCR each page
        with tempfile.TemporaryDirectory() as tmpdir:
            subprocess.run(
                ["pdftoppm", "-png", "-r", "200", file_path, os.path.join(tmpdir, "page")],
                check=True,
                timeout=120,
            )
            page_images = sorted(Path(tmpdir).glob("page-*.png"))
            for page_img in page_images:
                text = extract_text_from_image(str(page_img))
                text_parts.append(text)

        full_text = "\n\n".join(text_parts)
        logger.info(f"PDF OCR completed for {file_path}, extracted {len(full_text)} chars")
        return full_text
    except Exception as e:
        logger.error(f"PDF extraction failed for {file_path}: {e}")
        raise RuntimeError(f"PDF text extraction failed: {str(e)}")


def perform_ocr(file_path: str, file_type: str) -> str:
    """Route OCR based on file type."""
    if file_type.lower() == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type.lower() in ("jpg", "jpeg", "png", "tiff", "bmp"):
        return extract_text_from_image(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
