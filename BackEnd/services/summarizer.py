import requests
import json


# =========================================================
# OLLAMA
# =========================================================

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

MODEL_NAME = "llama3.2:3b"


# =========================================================
# SUMMARY
# =========================================================

def summarize_text(text):

    prompt = f"""
You are an AI study assistant for college students.

Summarize the lecture text provided below.

Return ONLY valid JSON using EXACTLY this structure:

{{
  "summary": "A clear and concise summary of the lecture."
}}

RULES:

1. Generate ONLY the summary.
2. Do NOT generate key concepts.
3. Do NOT generate important points.
4. Do NOT generate questions.
5. Do NOT generate quizzes.
6. Do NOT generate flashcards.
7. Use ONLY information present in the lecture.
8. Do NOT use outside knowledge.
9. Do NOT invent facts.
10. Keep the summary concise but useful for studying.
11. Preserve important definitions, concepts, processes, and relationships.
12. Do NOT use Markdown.
13. Do NOT add explanations outside the JSON.
14. Return valid JSON only.

LECTURE TEXT:

{text}
"""


    response = requests.post(

        OLLAMA_URL,

        json={

            "model": MODEL_NAME,

            "prompt": prompt,

            "stream": False,

            "format": "json",

            "options": {

                "temperature": 0.2

            }

        },

        timeout=300
    )


    response.raise_for_status()


    data = response.json()

    ai_response = data["response"]


    result = json.loads(
        ai_response
    )


    if "summary" not in result:

        raise ValueError(
            "AI response did not contain a summary."
        )


    return result