
````markdown
# 🎓 Smart Lecture AI

> An AI-powered study assistant that transforms lecture PDFs into interactive learning material.

Smart Lecture AI is a full-stack educational application designed to help students understand, revise, and interact with their lecture material using Artificial Intelligence.

Instead of simply reading a long lecture PDF, students can upload their lecture and use an interactive workspace to summarize content, ask questions, generate study material, and explore the lecture visually.

---

## ✨ Features

### 📄 Lecture Processing
- Upload lecture PDFs
- Extract text from lecture pages
- Store lecture information for the current workspace
- View uploaded PDFs directly inside the application

### 📝 AI Lecture Summarization
- Automatically summarize uploaded lectures
- Generate concise, study-friendly summaries
- Uses a locally running LLM through Ollama

### 💬 AI Lecture Chat
- Ask questions about the uploaded lecture
- Answers are grounded in the lecture content
- Uses Retrieval-Augmented Generation (RAG)
- Retrieves relevant lecture chunks before generating an answer
- Provides source/page references for retrieved information

### 🧠 Study Studio

The workspace includes multiple study tools:

- 📑 Summary
- 📝 Notes
- ❓ Quiz
- 🃏 Flashcards
- 🌳 Mind Map

These tools are designed to turn passive lecture reading into interactive studying.

### 🧩 Interactive Quiz
- Generate questions from lecture material
- Select answers interactively
- Receive feedback after answering
- Supports another attempt when an answer is incorrect

### 🌳 Mind Map
- Converts lecture concepts into a visual structure
- Organizes concepts hierarchically
- Connects related concepts visually

### 📚 Lecture Workspace
Each uploaded lecture gets its own workspace where students can:

- View the lecture
- Read the generated summary
- Ask questions
- Access study tools
- Navigate back to saved lectures

---

# 🏗️ Project Architecture

```text
                    ┌──────────────────────┐
                    │      Lecture PDF     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   React Frontend     │
                    │      Workspace       │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴───────────┐
                    │                      │
                    ▼                      ▼
          ┌──────────────────┐   ┌──────────────────┐
          │   PDF Extraction │   │  Lecture Storage │
          │      PyPDF       │   │                  │
          └────────┬─────────┘   └──────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │  Text Chunking   │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │       RAG        │
          │ Retrieval Layer  │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │      Ollama      │
          │  Llama 3.2 3B    │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ AI Response /    │
          │ Study Material   │
          └────────┬─────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ React Workspace  │
          └──────────────────┘
````

---

# 🛠️ Tech Stack

## Frontend

* React
* Vite
* JavaScript
* CSS

## Backend

* Python
* FastAPI
* Pydantic
* Requests

## AI

* Ollama
* Llama 3.2 3B

## PDF Processing

* PyPDF

## Retrieval

* Custom text chunking
* Keyword-based relevance retrieval
* Retrieval-Augmented Generation (RAG)

## Development Tools

* Visual Studio Code
* Git
* GitHub

---

# 📁 Project Structure

```text
Smart-Lecture-Summariser/
│
├── BackEnd/
│   │
│   ├── main.py
│   │
│   ├── services/
│   │   ├── summarizer.py
│   │   └── rag.py
│   │
│   └── requirements.txt
│
├── FrontEnd/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── Data/
│   └── uploads/
│
├── .gitignore
└── README.md
```

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/Surabhi-mule/Smart-Lecture-Summariser.git
```

Move into the project directory:

```bash
cd Smart-Lecture-Summariser
```

---

# 🤖 2. Install Ollama

Smart Lecture AI uses Ollama to run the LLM locally.

Download and install Ollama from:

[https://ollama.com/](https://ollama.com/)

Then download the model:

```bash
ollama pull llama3.2:3b
```

Start Ollama if it is not already running:

```bash
ollama serve
```

> If Ollama is already running in the background, you do not need to run `ollama serve` again.

The application expects Ollama at:

```text
http://127.0.0.1:11434
```

---

# 🐍 3. Backend Setup

Open a terminal and move into the backend:

```bash
cd BackEnd
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

---

# ⚛️ 4. Frontend Setup

Open another terminal.

Move into the frontend:

```bash
cd FrontEnd
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# 🔄 Running the Complete Application

You need three components running:

### Terminal 1 — Ollama

```bash
ollama serve
```

### Terminal 2 — FastAPI

```bash
cd BackEnd
venv\Scripts\activate
uvicorn main:app --reload
```

### Terminal 3 — React

```bash
cd FrontEnd
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 🧠 How RAG Works

Smart Lecture AI uses a lightweight Retrieval-Augmented Generation approach.

### Step 1 — Extract

The PDF is processed and text is extracted page by page.

### Step 2 — Chunk

The extracted lecture text is divided into smaller chunks.

```text
Lecture
   ↓
Pages
   ↓
Text
   ↓
Chunks
```

### Step 3 — Retrieve

When the student asks a question, the system identifies lecture chunks that are most relevant to the question.

```text
Student Question
       ↓
Relevant Keywords
       ↓
Lecture Chunks
       ↓
Top Relevant Chunks
```

### Step 4 — Generate

The retrieved chunks are provided to the local LLM.

```text
Question
    +
Relevant Lecture Context
    ↓
Llama 3.2 3B
    ↓
Answer
```

### Step 5 — Sources

The retrieved chunks retain their original page numbers, allowing the workspace to associate answers with their lecture sources.

---

# 🎨 Workspace

The main workspace provides a centralized environment for studying a lecture.

```text
┌─────────────────────────────────────────┐
│           Smart Lecture AI              │
├─────────────────────────────────────────┤
│                                         │
│            Lecture Workspace             │
│                                         │
│     📄 Lecture Summary                   │
│                                         │
│     💬 Ask about your lecture            │
│                                         │
│     📚 Study Studio                      │
│                                         │
│     📑 Summary   📝 Notes                │
│     ❓ Quiz      🃏 Flashcards           │
│     🌳 Mind Map                          │
│                                         │
└─────────────────────────────────────────┘
```

---

# 📌 Current Development Status

| Feature                | Status       |
| ---------------------- | ------------ |
| React Frontend         | ✅            |
| FastAPI Backend        | ✅            |
| PDF Upload             | ✅            |
| PDF Text Extraction    | ✅            |
| Ollama Integration     | ✅            |
| Local LLM              | ✅            |
| Lecture Summarization  | ✅            |
| Lecture Workspace      | ✅            |
| PDF Viewer             | ✅            |
| RAG Retrieval          | 🔄 Improving |
| Source/Page Navigation | 🔄 Improving |
| Quiz                   | 🔄 Improving |
| Flashcards             | 🔄 Improving |
| Notes                  | 🔄 Improving |
| Mind Map               | 🔄 Improving |
| Database               | ⬜ Planned    |
| Deployment             | ⬜ Planned    |

---

# 🗺️ Development Roadmap

### Phase 1 — Project Foundation

* Project idea
* Architecture
* Technology selection
* Initial repository

### Phase 2 — Frontend

* React application
* Landing page
* Navigation
* Upload interface
* UI design

### Phase 3 — Backend

* FastAPI setup
* PDF upload
* PDF text extraction
* API communication

### Phase 4 — AI Integration

* Ollama setup
* Llama 3.2 3B
* Local summarization
* AI response generation

### Phase 5 — Lecture Workspace

* Lecture workspace
* PDF viewer
* Lecture summary
* Chat interface
* Study Studio

### Phase 6 — Interactive Learning

* Quiz
* Flashcards
* Notes
* Mind Map

### Phase 7 — RAG & Sources

* Lecture chunking
* Relevant chunk retrieval
* Source references
* Page navigation
* Grounded answers

### Phase 8 — Improvements

* Better retrieval
* Improved AI prompts
* Better study generation
* UI/UX improvements
* Performance optimization

### Phase 9 — Persistence

* Database integration
* Persistent lectures
* User data
* Lecture history

### Phase 10 — Deployment

* Production frontend
* Production backend
* Cloud deployment
* Final testing

---

# 🔐 Privacy

Smart Lecture AI is designed around local AI inference.

The project currently uses Ollama to run the language model locally rather than relying on a paid external LLM API.

This makes the project suitable for experimentation and learning without requiring an external AI API key.

---

# 🎯 Project Goal

The goal of Smart Lecture AI is to create a single intelligent workspace where students can transform lecture material into useful study resources.

Instead of switching between different applications for:

* Reading PDFs
* Summarizing
* Asking questions
* Making notes
* Creating quizzes
* Revising with flashcards
* Building mind maps

Smart Lecture AI aims to bring these activities together into one study environment.

---

# 👩‍💻 Author

**Surabhi Mule**

Smart Lecture AI — Academic / Personal Project

---

# ⭐ Future Vision

The long-term goal is to evolve Smart Lecture AI into a complete AI-powered learning platform that can understand lecture material, help students interact with it, and automatically create personalized study resources.

```text
                Smart Lecture AI
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Understand      Interact       Revise
        │              │              │
     Summary          Chat          Quiz
     Notes            RAG         Flashcards
     Mind Map         Sources        Notes
        │              │              │
        └──────────────┼──────────────┘
                       │
                  Better Learning
```

---

## 📜 License

This project is currently developed as an educational/personal project.

```

### One small change I'd make before you paste it

Your GitHub repo is currently named **`Smart-Lecture-Summariser`**, while your app branding is **Smart Lecture AI**. That's totally fine.

For the GitHub **About/Description**, I'd use:

> **AI-powered lecture assistant for PDF summarization, RAG-based Q&A, quizzes, flashcards, notes, and mind maps.**

And topics:

`ai` `rag` `llm` `ollama` `fastapi` `react` `python` `education` `study-assistant` `pdf` `generative-ai`

That will make the repository look **much more like a proper project** rather than just a college code repository.
```
