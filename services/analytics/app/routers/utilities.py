from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from app.services.csv_importer import CsvContentProcessor, CsvImportResult
from app.models.schemas import CertificateDataPrepRequest, CertificateDataPrepResponse
from app.services.certificate_helper import CertificateHelper
from app.config import settings
from fastapi.responses import Response
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from io import BytesIO
from xml.sax.saxutils import escape
from pydantic import BaseModel, Field
import textwrap

router = APIRouter(prefix="/utilities", tags=["Utilities & Importers"])

def verify_internal_auth(x_internal_key: str = Header(None)):
    if not x_internal_key or x_internal_key != settings.INTERNAL_SERVICE_KEY:
        raise HTTPException(status_code=403, detail="Invalid internal service credentials")
    return True

@router.post("/import-csv", response_model=CsvImportResult)
async def import_learner_csv(file: UploadFile = File(...), auth: bool = Depends(verify_internal_auth)):
    """
    Parses and validates learner roster CSV files.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported")
    
    contents = await file.read()
    try:
        text = contents.decode("utf-8")
    except UnicodeDecodeError:
        text = contents.decode("latin-1")

    return CsvContentProcessor.process_learner_csv(text)

@router.post("/prepare-certificate", response_model=CertificateDataPrepResponse)
def prepare_certificate(request: CertificateDataPrepRequest, auth: bool = Depends(verify_internal_auth)):
    """
    Prepares cryptographic hash, QR payload, and verification metadata for certificates.
    """
    return CertificateHelper.prepare_certificate_data(request)

@router.post("/render-certificate")
def render_certificate(request: CertificateDataPrepRequest, auth: bool = Depends(verify_internal_auth)):
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=landscape(A4))
    width, height = landscape(A4)
    pdf.setTitle("EduSphere Certificate " + request.certificate_number)
    pdf.setStrokeColorRGB(0.31, 0.27, 0.90)
    pdf.rect(25, 25, width - 50, height - 50)
    for text, size, y in [("EduSphere Certificate of Completion", 26, 450),
                           (request.learner_name, 25, 355),
                           (request.course_title, 15, 295),
                           ("Completed: " + request.completion_date[:10], 12, 235),
                           (request.issuer_name, 12, 200),
                           (request.certificate_number, 11, 150)]:
        pdf.setFont("Helvetica", size)
        pdf.drawCentredString(width / 2, y, text[:110])
    import os
    verification = os.getenv("APP_URL", "http://localhost:3000") + "/verify/" + request.certificate_number
    pdf.setFont("Helvetica", 9)
    pdf.drawCentredString(width / 2, 105, verification)
    pdf.linkURL(verification, (40, 90, width - 40, 120))
    pdf.save()
    return Response(output.getvalue(), media_type="application/pdf")

class LessonNotes(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(max_length=100000)

@router.post("/render-lesson-notes")
def render_lesson_notes(request: LessonNotes, auth: bool = Depends(verify_internal_auth)):
    output = BytesIO()
    pdf = canvas.Canvas(output, pagesize=A4)
    pdf.setFont("Helvetica-Bold", 15)
    pdf.drawString(40, 790, request.title[:75])
    pdf.setFont("Helvetica", 11)
    y = 750
    for line in textwrap.wrap(request.content, 85):
        if y < 50:
            pdf.showPage()
            pdf.setFont("Helvetica", 11)
            y = 790
        pdf.drawString(40, y, line)
        y -= 16
    pdf.save()
    return Response(output.getvalue(), media_type="application/pdf")
