from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from services.summarizer import summarize_text

import os
import shutil


# =========================
# CREATE FASTAPI APP
# =========================

app = FastAPI()


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# HOME ROUTE
# =========================

@app.get("/")
def home():
    return {
        "message": "Smart Lecture Summariser Backend is running!"
    }


# =========================
# UPLOAD PDF + SUMMARIZE
# =========================

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):

    # Check file type
    if not file.filename.lower().endswith(".pdf"):
        return {
            "success": False,
            "message": "Only PDF files are supported right now."
        }

    # Create upload directory
    upload_directory = "../Data/uploads"
    os.makedirs(upload_directory, exist_ok=True)

    # Create file path
    file_path = os.path.join(
        upload_directory,
        file.filename
    )

    # Save uploaded PDF
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text from PDF
    try:
        reader = PdfReader(file_path)

        extracted_text = ""

        for page in reader.pages:
            text = page.extract_text()

            if text:
                extracted_text += text + "\n"

    except Exception as e:
        return {
            "success": False,
            "message": f"Could not extract PDF text: {str(e)}"
        }

    # Check whether text was extracted
    if not extracted_text.strip():
        return {
            "success": False,
            "message": "Could not extract any text from this PDF."
        }

    # Send text to Ollama / Llama
    try:
        summary = summarize_text(extracted_text)

    except Exception as e:
        return {
            "success": False,
            "message": f"AI summarization failed: {str(e)}"
        }

    # Return everything to React
    return {
        "success": True,
        "filename": file.filename,
        "message": "Lecture processed successfully!",
        "text": extracted_text,
        "summary": summary
    }


# =========================
# DIRECT SUMMARIZE ROUTE
# =========================

@app.post("/summarize")
async def summarize_lecture(text: str):

    try:

        summary = summarize_text(text)

        return {
            "success": True,
            "summary": summary
        }

    except Exception as e:

        return {
            "success": False,
            "message": str(e)
        }