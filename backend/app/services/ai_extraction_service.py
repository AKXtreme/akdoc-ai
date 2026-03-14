import json
import logging
from google import genai
from ..config import settings

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """You are a document data extraction specialist. Extract the following fields from the document text below.

Document text:
{ocr_text}

Extract these fields and return ONLY a valid JSON object (no markdown, no explanation):
{{
  "invoice_number": "string or null",
  "company_name": "string or null",
  "invoice_date": "string in YYYY-MM-DD format or null",
  "total_amount": float or null,
  "confidence_score": float between 0.0 and 1.0
}}

Rules:
- If a field is not found, use null
- For total_amount, extract only the numeric value (e.g., 1234.56)
- confidence_score reflects overall extraction confidence
- Return ONLY the JSON object, nothing else"""


def extract_invoice_data(ocr_text: str) -> dict:
    """Use Gemini AI to extract structured invoice data from OCR text."""
    if not settings.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model="models/gemini-flash-latest",
            contents=EXTRACTION_PROMPT.format(ocr_text=ocr_text[:4000]),
        )
        response_text = response.text.strip()
        # Strip markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        extracted = json.loads(response_text)
        logger.info(f"AI extraction successful, confidence={extracted.get('confidence_score')}")
        return extracted
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        return _empty_extraction()
    except Exception as e:
        logger.error(f"AI extraction failed: {e}")
        raise RuntimeError(f"AI extraction failed: {str(e)}")


def _empty_extraction() -> dict:
    return {
        "invoice_number": None,
        "company_name": None,
        "invoice_date": None,
        "total_amount": None,
        "confidence_score": 0.0,
    }
