import hashlib
import json
from app.models.schemas import CertificateDataPrepRequest, CertificateDataPrepResponse

class CertificateHelper:
    """
    Certificate Cryptographic Data Preparation
    Calculates tamper-evident SHA-256 integrity hash, QR verification payload,
    and public verification URL.
    """

    @staticmethod
    def prepare_certificate_data(
        request: CertificateDataPrepRequest,
        base_url: str = "http://localhost:3000"
    ) -> CertificateDataPrepResponse:
        verification_url = f"{base_url}/verify/{request.certificate_number}"
        
        # Deterministic payload for integrity hashing
        payload = {
            "cert_id": request.certificate_id,
            "cert_number": request.certificate_number,
            "learner_id": request.learner_id,
            "learner_name": request.learner_name,
            "course_id": request.course_id,
            "course_title": request.course_title,
            "completion_date": request.completion_date,
            "issuer": request.issuer_name
        }
        
        canonical_json = json.dumps(payload, sort_keys=True)
        integrity_hash = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()
        
        qr_payload = f"EDUSPHERE|CERT:{request.certificate_number}|HASH:{integrity_hash[:16]}|URL:{verification_url}"

        return CertificateDataPrepResponse(
            certificate_number=request.certificate_number,
            verification_url=verification_url,
            qr_payload=qr_payload,
            integrity_hash=integrity_hash,
            metadata={
                "algorithm": "SHA-256",
                "issued_by": request.issuer_name,
                "verification_endpoint": verification_url,
                "payload_snapshot": payload
            }
        )
