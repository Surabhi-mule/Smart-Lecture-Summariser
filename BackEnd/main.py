from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pypdf import PdfReader

from services.summarizer import summarize_text, OLLAMA_URL, MODEL_NAME
from services.rag import create_chunks, find_relevant_chunks

import os
import shutil
import requests
import io
import json


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Smart Lecture AI",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

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


# =========================================================
# PATHS
# =========================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

UPLOAD_DIRECTORY = os.path.abspath(
    os.path.join(
        BASE_DIR,
        "..",
        "Data",
        "uploads"
    )
)

os.makedirs(
    UPLOAD_DIRECTORY,
    exist_ok=True
)


# =========================================================
# TEMPORARY LECTURE STORE
# =========================================================

lecture_store = {}


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "success": True,
        "message": "Smart Lecture AI Backend is running!"
    }


# =========================================================
# PDF TEXT EXTRACTION
# =========================================================

def extract_pdf_pages(file_path):

    reader = PdfReader(file_path)

    pages = []

    for page_number, page in enumerate(
        reader.pages,
        start=1
    ):

        try:
            text = page.extract_text()
        except Exception:
            text = ""

        if text and text.strip():

            pages.append({
                "page": page_number,
                "text": text.strip()
            })

    return pages


# =========================================================
# OLLAMA JSON GENERATOR
# =========================================================

def generate_json_with_ollama(
    prompt,
    temperature=0.2
):

    response = requests.post(

        OLLAMA_URL,

        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": temperature
            }
        },

        timeout=300
    )

    response.raise_for_status()

    data = response.json()

    if "response" not in data:
        raise ValueError(
            "Ollama returned an invalid response."
        )

    raw_response = data["response"].strip()

    if not raw_response:
        raise ValueError(
            "Ollama returned an empty response."
        )

    try:

        return json.loads(
            raw_response
        )

    except json.JSONDecodeError as e:

        raise ValueError(
            f"Ollama returned invalid JSON: {str(e)}"
        )


# =========================================================
# BUILD LECTURE CONTEXT
# =========================================================

def build_lecture_context(lecture):

    pages = lecture.get(
        "pages",
        []
    )

    if not pages:
        return ""

    context_parts = []

    total_characters = 0

    max_characters = 18000

    for page in pages:

        page_text = page.get(
            "text",
            ""
        ).strip()

        if not page_text:
            continue

        remaining = (
            max_characters -
            total_characters
        )

        if remaining <= 0:
            break

        page_text = page_text[
            :remaining
        ]

        context_parts.append(
            f"PAGE {page['page']}:\n"
            f"{page_text}"
        )

        total_characters += len(
            page_text
        )

    return "\n\n".join(
        context_parts
    )


# =========================================================
# UPLOAD PDF
# =========================================================

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...)
):

    if not file.filename:

        return {
            "success": False,
            "message": "No file selected."
        }


    if not file.filename.lower().endswith(".pdf"):

        return {
            "success": False,
            "message": (
                "Only PDF files are supported "
                "right now."
            )
        }


    filename = os.path.basename(
        file.filename
    )


    file_path = os.path.join(
        UPLOAD_DIRECTORY,
        filename
    )


    # -----------------------------------------------------
    # SAVE FILE
    # -----------------------------------------------------

    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

    except Exception as e:

        return {
            "success": False,
            "message": (
                f"Could not save PDF: {str(e)}"
            )
        }


    # -----------------------------------------------------
    # EXTRACT PDF
    # -----------------------------------------------------

    try:

        pages = extract_pdf_pages(
            file_path
        )

    except Exception as e:

        return {
            "success": False,
            "message": (
                f"Could not extract PDF text: {str(e)}"
            )
        }


    if not pages:

        return {
            "success": False,
            "message": (
                "Could not extract any text "
                "from this PDF."
            )
        }


    # -----------------------------------------------------
    # CREATE RAG CHUNKS
    # -----------------------------------------------------

    try:

        chunks = create_chunks(
            pages
        )

    except Exception as e:

        return {
            "success": False,
            "message": (
                f"Could not create lecture chunks: {str(e)}"
            )
        }


    # -----------------------------------------------------
    # STORE LECTURE
    # -----------------------------------------------------

    lecture_store[filename] = {

        "filename": filename,

        "file_path": file_path,

        "pages": pages,

        "chunks": chunks

    }


    # -----------------------------------------------------
    # EXTRACTED TEXT
    # -----------------------------------------------------

    extracted_text = "\n\n".join(

        page["text"]

        for page in pages

    )


    # -----------------------------------------------------
    # SUMMARY
    # -----------------------------------------------------

    try:

        summary = summarize_text(
            extracted_text
        )

    except Exception as e:

        return {
            "success": False,
            "message": (
                f"AI summarization failed: {str(e)}"
            )
        }


    return {

        "success": True,

        "filename": filename,

        "message": (
            "Lecture processed successfully!"
        ),

        "summary": summary

    }


# =========================================================
# PDF VIEWER
# =========================================================

@app.get("/pdf/{filename}")
async def get_pdf(
    filename: str
):

    safe_filename = os.path.basename(
        filename
    )

    file_path = os.path.join(
        UPLOAD_DIRECTORY,
        safe_filename
    )


    if not os.path.exists(file_path):

        return {
            "success": False,
            "message": "PDF not found."
        }


    try:

        with open(
            file_path,
            "rb"
        ) as pdf_file:

            pdf_bytes = pdf_file.read()


        return StreamingResponse(

            io.BytesIO(pdf_bytes),

            media_type="application/pdf",

            headers={
                "Content-Disposition": (
                    "inline; "
                    f'filename="{safe_filename}"'
                )
            }

        )

    except Exception as e:

        return {
            "success": False,
            "message": (
                f"Could not open PDF: {str(e)}"
            )
        }


# =========================================================
# DIRECT SUMMARIZE
# =========================================================

@app.post("/summarize")
async def summarize_lecture(
    text: str
):

    try:

        summary = summarize_text(
            text
        )

        return {

            "success": True,

            "summary": summary

        }

    except Exception as e:

        return {

            "success": False,

            "message": str(e)

        }


# =========================================================
# CHAT REQUEST
# =========================================================

class ChatRequest(BaseModel):

    filename: str

    question: str


# =========================================================
# CHAT
# =========================================================

@app.post("/chat")
async def chat(
    request: ChatRequest
):

    question = request.question.strip()


    if not question:

        return {

            "success": False,

            "message": (
                "Please enter a question."
            )

        }


    lecture = lecture_store.get(
        request.filename
    )


    if not lecture:

        return {

            "success": False,

            "message": (
                "Lecture not found. "
                "Please upload the PDF again."
            )

        }


    # -----------------------------------------------------
    # FIND RELEVANT CHUNKS
    # -----------------------------------------------------

    relevant_chunks = find_relevant_chunks(

        question,

        lecture["chunks"],

        max_chunks=3

    )


    if not relevant_chunks:

        return {

            "success": True,

            "answer": (
                "I could not find relevant "
                "information in your lecture."
            ),

            "sources": []

        }


    # -----------------------------------------------------
    # BUILD CONTEXT
    # -----------------------------------------------------

    context_parts = []


    for chunk in relevant_chunks:

        context_parts.append(

            f"SOURCE PAGE: {chunk['page']}\n\n"
            f"{chunk['text']}"

        )


    context = "\n\n".join(
        context_parts
    )


    # -----------------------------------------------------
    # PROMPT
    # -----------------------------------------------------

    prompt = f"""
You are Smart Lecture AI, an AI study assistant.

Answer the student's question using ONLY
the provided lecture sources.

Do not use outside knowledge.

If the answer cannot be found in the
lecture sources, clearly say:

"The information is not available
in this lecture."

QUESTION:

{question}

LECTURE SOURCES:

{context}

Give a clear, concise and useful answer.

Do not mention information that is not
supported by the lecture sources.
"""


    # -----------------------------------------------------
    # OLLAMA
    # -----------------------------------------------------

    try:

        response = requests.post(

            OLLAMA_URL,

            json={

                "model": MODEL_NAME,

                "prompt": prompt,

                "stream": False,

                "options": {
                    "temperature": 0.2
                }

            },

            timeout=300

        )

        response.raise_for_status()

        data = response.json()

        answer = data[
            "response"
        ].strip()


    except Exception as e:

        return {

            "success": False,

            "message": (
                f"AI chat failed: {str(e)}"
            )

        }


    # -----------------------------------------------------
    # SOURCES
    # -----------------------------------------------------

    sources = []

    seen_pages = set()


    for chunk in relevant_chunks:

        page = chunk["page"]


        if page in seen_pages:
            continue


        seen_pages.add(page)


        sources.append({

            "page": page,

            "text": chunk["text"],

            "filename": request.filename

        })


    return {

        "success": True,

        "answer": answer,

        "sources": sources

    }


# =========================================================
# STUDIO REQUEST
# =========================================================

class StudioRequest(BaseModel):

    filename: str

    generation_type: str


# =========================================================
# STUDIO GENERATION
# =========================================================

@app.post("/generate")
async def generate_study_material(
    request: StudioRequest
):

    generation_type = (
        request.generation_type
        .strip()
        .lower()
    )


    allowed_types = {
        "notes",
        "flashcards",
        "quiz",
        "mindmap"
    }


    if generation_type not in allowed_types:

        return {

            "success": False,

            "message": (
                "Invalid generation type."
            )

        }


    # -----------------------------------------------------
    # FIND LECTURE
    # -----------------------------------------------------

    lecture = lecture_store.get(
        request.filename
    )


    if not lecture:

        return {

            "success": False,

            "message": (
                "Lecture not found. "
                "Please upload the PDF again."
            )

        }


    context = build_lecture_context(
        lecture
    )


    if not context:

        return {

            "success": False,

            "message": (
                "No lecture content is available."
            )

        }


    # =====================================================
    # NOTES
    # =====================================================

    if generation_type == "notes":

        prompt = f"""
You are an AI study assistant.

Create structured study notes from the
lecture below.

Use ONLY information from the lecture.

Return ONLY valid JSON in exactly
this structure:

{{
  "notes": [
    {{
      "heading": "Topic heading",
      "points": [
        "Important point",
        "Important point"
      ]
    }}
  ]
}}

Rules:

- Create 4 to 8 useful topic sections.
- Keep points concise.
- Include important definitions,
  concepts, processes and relationships.
- Do not invent information.
- Do not use outside knowledge.
- No Markdown.
- JSON only.

LECTURE:

{context}
"""


    # =====================================================
    # FLASHCARDS
    # =====================================================

    elif generation_type == "flashcards":

        prompt = f"""
You are an AI study assistant.

Create useful revision flashcards
from the lecture below.

Use ONLY information from the lecture.

Return ONLY valid JSON in exactly
this structure:

{{
  "flashcards": [
    {{
      "question": "Question",
      "answer": "Answer"
    }}
  ]
}}

Rules:

- Create 8 to 12 flashcards.
- Questions should test important concepts.
- Answers must be concise.
- Do not invent information.
- Do not use outside knowledge.
- No Markdown.
- JSON only.

LECTURE:

{context}
"""


    # =====================================================
    # QUIZ
    # =====================================================

    elif generation_type == "quiz":

        prompt = f"""
You are an AI study assistant.

Create a multiple-choice quiz from
the lecture below.

Use ONLY information from the lecture.

Return ONLY valid JSON in exactly
this structure:

{{
  "quiz": [
    {{
      "question": "Question",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": "Option A",
      "explanation": "Short explanation"
    }}
  ]
}}

Rules:

- Create 8 questions.
- Every question must have exactly
  4 options.
- Only one option should be correct.
- The answer must exactly match
  one of the options.
- Keep explanations short.
- Do not invent information.
- Do not use outside knowledge.
- No Markdown.
- JSON only.

LECTURE:

{context}
"""


    # =====================================================
    # MINDMAP
    # =====================================================

    else:

        prompt = f"""
You are an AI study assistant.

Create a hierarchical mindmap from
the lecture below.

Use ONLY information from the lecture.

Return ONLY valid JSON in exactly
this structure:

{{
  "mindmap": {{
    "title": "Main lecture topic",
    "branches": [
      {{
        "title": "Main concept",
        "children": [
          {{
            "title": "Sub concept",
            "children": []
          }}
        ]
      }}
    ]
  }}
}}

Rules:

- Create 5 to 8 main branches.
- Each branch can have useful sub-concepts.
- Keep node titles short.
- Focus on relationships between concepts.
- Do not invent information.
- Do not use outside knowledge.
- No Markdown.
- JSON only.

LECTURE:

{context}
"""


    # =====================================================
    # CALL OLLAMA
    # =====================================================

    try:

        result = generate_json_with_ollama(
            prompt,
            temperature=0.2
        )

    except Exception as e:

        return {

            "success": False,

            "message": (
                f"Study material generation failed: {str(e)}"
            )

        }


    # =====================================================
    # VALIDATE RESULT
    # =====================================================

    if generation_type == "notes":

        if not isinstance(
            result.get("notes"),
            list
        ):

            return {
                "success": False,
                "message": (
                    "AI returned invalid notes data."
                )
            }


    elif generation_type == "flashcards":

        if not isinstance(
            result.get("flashcards"),
            list
        ):

            return {
                "success": False,
                "message": (
                    "AI returned invalid flashcard data."
                )
            }


    elif generation_type == "quiz":

        if not isinstance(
            result.get("quiz"),
            list
        ):

            return {
                "success": False,
                "message": (
                    "AI returned invalid quiz data."
                )
            }


    elif generation_type == "mindmap":

        if not isinstance(
            result.get("mindmap"),
            dict
        ):

            return {
                "success": False,
                "message": (
                    "AI returned invalid mindmap data."
                )
            }


    # =====================================================
    # RETURN
    # =====================================================

    return {

        "success": True,

        "type": generation_type,

        "filename": request.filename,

        "data": result

    }