from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header
from app.services.csv_importer import CsvContentProcessor, CsvImportResult
from app.models.schemas import CertificateDataPrepRequest, CertificateDataPrepResponse
from app.services.certificate_helper import CertificateHelper
from app.config import settings

router = APIRouter(prefix="/utilities", tags=["Utilities & Importers"])

def verify_internal_auth(x_internal_key: str = Header(None)):
    if x_internal_key and x_internal_key != settings.INTERNAL_SERVICE_KEY:
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
