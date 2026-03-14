import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import logging

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@akdoc.ai")
APP_NAME = "AKDoc AI"


def _build_html(title: str, body_html: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background: #f1f5f9; }}
  .wrapper {{ max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }}
  .header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 28px 32px; }}
  .header h1 {{ margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; }}
  .header p {{ margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 13px; }}
  .body {{ padding: 32px; }}
  .body p {{ color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }}
  .status-box {{ border-radius: 8px; padding: 16px 20px; margin: 20px 0; }}
  .status-success {{ background: #f0fdf4; border: 1px solid #bbf7d0; }}
  .status-failed {{ background: #fef2f2; border: 1px solid #fecaca; }}
  .status-success .label {{ color: #16a34a; font-weight: 700; font-size: 14px; }}
  .status-failed .label {{ color: #dc2626; font-weight: 700; font-size: 14px; }}
  .filename {{ font-weight: 600; color: #0f172a; font-size: 15px; }}
  .footer {{ background: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }}
</style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>{APP_NAME}</h1>
      <p>Document Processing Notification</p>
    </div>
    <div class="body">
      {body_html}
    </div>
    <div class="footer">
      You received this email because you have email notifications enabled.<br>
      You can disable them in your profile settings.
    </div>
  </div>
</body>
</html>
"""


def send_email(to: str, subject: str, html_body: str) -> bool:
    """Send an email. Returns True on success, False on failure."""
    if not SMTP_HOST or not SMTP_USER:
        logger.info("SMTP not configured — skipping email to %s", to)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{APP_NAME} <{SMTP_FROM}>"
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [to], msg.as_string())
        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", to, e)
        return False


def notify_document_completed(user_email: str, username: str, filename: str, doc_id: int) -> None:
    body = f"""
    <p>Hi <strong>{username}</strong>,</p>
    <p>Your document has been successfully processed and data has been extracted.</p>
    <div class="status-box status-success">
      <div class="label">&#10003; Processing Complete</div>
      <div style="margin-top:6px" class="filename">{filename}</div>
    </div>
    <p>Log in to AKDoc AI to view the extracted data, download the CSV export, or review the full document details.</p>
    """
    send_email(
        to=user_email,
        subject=f"Document processed: {filename}",
        html_body=_build_html("Processing Complete", body),
    )


def notify_document_failed(user_email: str, username: str, filename: str, doc_id: int) -> None:
    body = f"""
    <p>Hi <strong>{username}</strong>,</p>
    <p>Unfortunately, we were unable to process your document. This may be due to the file format, image quality, or an unsupported document type.</p>
    <div class="status-box status-failed">
      <div class="label">&#10007; Processing Failed</div>
      <div style="margin-top:6px" class="filename">{filename}</div>
    </div>
    <p>You can try reprocessing the document from the document detail page, or upload a clearer version of the file.</p>
    """
    send_email(
        to=user_email,
        subject=f"Document processing failed: {filename}",
        html_body=_build_html("Processing Failed", body),
    )
