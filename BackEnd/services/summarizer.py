import requests
import json

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL_NAME = "llama3.2:3b"


def summarize_text(text):

    prompt = f"""
You are an AI study assistant for college students.

Analyze ONLY the lecture text provided below.

Return ONLY valid JSON with EXACTLY this structure:

{{
  "summary": "Concise summary of the lecture.",

  "key_concepts": [
    "Concept 1",
    "Concept 2",
    "Concept 3",
    "Concept 4",
    "Concept 5"
  ],

  "important_points": [
    "Important point 1",
    "Important point 2",
    "Important point 3",
    "Important point 4",
    "Important point 5"
  ],

  "questions": [
    "Practice question 1",
    "Practice question 2",
    "Practice question 3",
    "Practice question 4",
    "Practice question 5"
  ],

  "quiz": [
    {{
      "question": "Quiz question 1",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option A",
      "explanation": "One short sentence."
    }},
    {{
      "question": "Quiz question 2",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option B",
      "explanation": "One short sentence."
    }},
    {{
      "question": "Quiz question 3",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option C",
      "explanation": "One short sentence."
    }},
    {{
      "question": "Quiz question 4",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option D",
      "explanation": "One short sentence."
    }},
    {{
      "question": "Quiz question 5",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option A",
      "explanation": "One short sentence."
    }}
  ],

  "flashcards": [
    {{
      "question": "Flashcard question 1",
      "answer": "Short answer."
    }},
    {{
      "question": "Flashcard question 2",
      "answer": "Short answer."
    }},
    {{
      "question": "Flashcard question 3",
      "answer": "Short answer."
    }},
    {{
      "question": "Flashcard question 4",
      "answer": "Short answer."
    }},
    {{
      "question": "Flashcard question 5",
      "answer": "Short answer."
    }}
  ]
}}

RULES:

1. Generate exactly 5 key concepts.
2. Generate exactly 5 important points.
3. Generate exactly 5 practice questions.
4. Generate exactly 5 quiz questions.
5. Generate exactly 5 flashcards.

6. Practice questions must be descriptive/exam-style questions.
7. Practice questions must NOT contain multiple-choice options.
8. Quiz questions must be different from practice questions.
9. Quiz questions must test different concepts where possible.
10. Each quiz must have exactly 4 unique options.
11. Only one option must be correct.
12. correct_answer must exactly match one option.
13. Quiz explanation must be ONE short sentence.
14. Flashcard answers must be 25 words or fewer.
15. Keep all answers concise.
16. Avoid repeating the same information across sections.
17. Use ONLY information present in the lecture.
18. Do NOT use outside knowledge.
19. Do NOT invent facts.
20. Do NOT use Markdown.
21. Do NOT add explanations outside the JSON.
22. Return valid JSON only.

LECTURE TEXT:

{text}
"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        },
        timeout=300
    )

    response.raise_for_status()

    data = response.json()

    ai_response = data["response"]

    result = json.loads(ai_response)

    return result