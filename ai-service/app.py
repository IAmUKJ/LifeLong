from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class SymptomRequest(BaseModel):
    text: str

@app.post("/extract-symptoms")
def extract_symptoms(req: SymptomRequest):
    # TEMP dummy output (replace with MedCAT later)
    return {
        "symptoms": ["Fever", "Headache"],
        "specializations": ["General Physician"]
    }
