import json
import requests

from services.summarizer import OLLAMA_URL, MODEL_NAME


# =========================================================
# OLLAMA JSON GENERATOR
# =========================================================

def generate_json(prompt):
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

    raw_response = data.get("response", "").strip()

    if not raw_response:
        raise ValueError("AI returned an empty response.")

    try:
        return json.loads(raw_response)
    except json.JSONDecodeError as e:
        raise ValueError(
            f"AI returned invalid JSON: {str(e)}"
        )


# =========================================================
# NOTES
# =========================================================

def generate_notes(context):

    prompt = f"""
You are an AI study assistant for a college student.

Create structured study notes using ONLY the lecture
content provided below.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "title": "Lecture Notes",
    "sections": [
        {{
            "heading": "Section heading",
            "points": [
                "Important point",
                "Important point"
            ]
        }}
    ]
}}

RULES:

1. Use only information from the lecture.
2. Do not invent information.
3. Do not use outside knowledge.
4. Include the most important concepts.
5. Preserve important definitions.
6. Preserve important processes and relationships.
7. Keep the notes concise.
8. Make the notes useful for exam revision.
9. Create multiple logical sections.
10. Each section should contain 2-6 points.
11. Do not use Markdown.
12. Return JSON only.

LECTURE CONTENT:

{context}
"""

    result = generate_json(prompt)

    if "sections" not in result:
        raise ValueError("Invalid notes response.")

    return result


# =========================================================
# FLASHCARDS
# =========================================================

def generate_flashcards(context):

    prompt = f"""
You are an AI study assistant for a college student.

Create useful revision flashcards from the lecture.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "flashcards": [
        {{
            "question": "Question",
            "answer": "Answer"
        }}
    ]
}}

RULES:

1. Create 10 flashcards.
2. Use ONLY information from the lecture.
3. Do not use outside knowledge.
4. Do not invent facts.
5. Questions should test important concepts.
6. Answers should be concise but complete.
7. Include definitions, concepts, processes and relationships.
8. Avoid duplicate questions.
9. Do not use Markdown.
10. Return JSON only.

LECTURE CONTENT:

{context}
"""

    result = generate_json(prompt)

    if "flashcards" not in result:
        raise ValueError("Invalid flashcard response.")

    return result


# =========================================================
# QUIZ
# =========================================================

def generate_quiz(context):

    prompt = f"""
You are an AI study assistant for a college student.

Create a multiple-choice quiz based ONLY on the lecture.

Return ONLY valid JSON.

Use exactly this structure:

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

RULES:

1. Create 10 questions.
2. Every question must have exactly 4 options.
3. Exactly one option must be correct.
4. The "answer" must exactly match one option.
5. Use only information from the lecture.
6. Do not use outside knowledge.
7. Do not invent facts.
8. Test important concepts.
9. Avoid duplicate questions.
10. Keep explanations concise.
11. Do not use Markdown.
12. Return JSON only.

LECTURE CONTENT:

{context}
"""

    result = generate_json(prompt)

    if "quiz" not in result:
        raise ValueError("Invalid quiz response.")

    return result


# =========================================================
# MINDMAP
# =========================================================

def generate_mindmap(context):

    prompt = f"""
You are an AI study assistant.

Create a hierarchical concept map from the lecture.

Return ONLY valid JSON.

Use exactly this structure:

{{
    "title": "Lecture Mindmap",
    "nodes": [
        {{
            "id": "1",
            "label": "Main concept",
            "level": 0
        }}
    ],
    "edges": [
        {{
            "from": "1",
            "to": "2"
        }}
    ]
}}

RULES:

1. Create 1 main root concept.
2. Create 4-7 major concepts.
3. Create useful sub-concepts.
4. Every node must have a unique ID.
5. Level 0 = root.
6. Level 1 = major concept.
7. Level 2 = sub-concept.
8. Edges must connect existing node IDs.
9. Use only lecture information.
10. Do not use outside knowledge.
11. Do not invent facts.
12. Keep labels short.
13. Return JSON only.

LECTURE CONTENT:

{context}
"""

    result = generate_json(prompt)

    if "nodes" not in result or "edges" not in result:
        raise ValueError("Invalid mindmap response.")

    return result