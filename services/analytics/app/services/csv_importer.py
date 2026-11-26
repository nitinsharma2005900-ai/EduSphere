import csv
import io
import re
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel, field_validator, ValidationError

class CsvLearnerRecord(BaseModel):
    email: str
    first_name: str
    last_name: str
    external_id: str

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(pattern, v):
            raise ValueError(f"Invalid email format: {v}")
        return v.lower().strip()

class CsvImportResult(BaseModel):
    total_rows: int
    valid_count: int
    invalid_count: int
    valid_records: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]

class CsvContentProcessor:
    """
    CSV batch import and validation utility.
    Validates learner rosters, grade sheets, and course metadata imports.
    """

    REQUIRED_HEADERS = {"email", "first_name", "last_name", "external_id"}

    @classmethod
    def process_learner_csv(cls, file_content: str) -> CsvImportResult:
        stream = io.StringIO(file_content.strip())
        reader = csv.DictReader(stream)
        
        # Header validation
        if not reader.fieldnames:
            return CsvImportResult(
                total_rows=0, valid_count=0, invalid_count=0,
                valid_records=[],
                errors=[{"row": 0, "error": "CSV file is empty or missing headers"}]
            )

        headers = {h.strip().lower() for h in reader.fieldnames if h}
        missing_headers = cls.REQUIRED_HEADERS.difference(headers)
        if missing_headers:
            return CsvImportResult(
                total_rows=0, valid_count=0, invalid_count=0,
                valid_records=[],
                errors=[{"row": 0, "error": f"Missing required headers: {list(missing_headers)}"}]
            )

        valid_records = []
        errors = []
        row_idx = 1

        for row in reader:
            row_idx += 1
            cleaned_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
            
            try:
                record = CsvLearnerRecord(
                    email=cleaned_row.get("email", ""),
                    first_name=cleaned_row.get("first_name", ""),
                    last_name=cleaned_row.get("last_name", ""),
                    external_id=cleaned_row.get("external_id", "")
                )
                valid_records.append(record.model_dump())
            except ValidationError as ve:
                errors.append({
                    "row": row_idx,
                    "data": cleaned_row,
                    "error": [f"{e['loc'][0]}: {e['msg']}" for e in ve.errors()]
                })
            except Exception as e:
                errors.append({
                    "row": row_idx,
                    "data": cleaned_row,
                    "error": str(e)
                })

        return CsvImportResult(
            total_rows=row_idx - 1,
            valid_count=len(valid_records),
            invalid_count=len(errors),
            valid_records=valid_records,
            errors=errors
        )
