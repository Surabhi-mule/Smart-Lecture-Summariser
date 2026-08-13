import { useState } from "react";
import "./App.css";

import Flashcards from "./components/Flashcards";
import Quiz from "./components/Quiz";
import LectureCard from "./components/LectureCard";
import Workspace from "./workspace/Workspace";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [result, setResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [activeTab, setActiveTab] = useState("home");

  const [lectures, setLectures] = useState(() => {
    const savedLectures = localStorage.getItem("smartLectures");

    if (savedLectures) {
      return JSON.parse(savedLectures);
    }

    return [];
  });

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
      setUploadStatus("");
      setResult(null);
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please choose a PDF first.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setUploadStatus("Please select a PDF file.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploadStatus("");
    setResult(null);
    setIsProcessing(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
  setIsProcessing(false);
  setUploadStatus("Lecture processed successfully!");
  setResult(data);
  setActiveTab("workspace");

        const newLecture = {
          id: Date.now(),
          title: data.filename || selectedFile.name,
          date: new Date().toISOString(),
          data: data,
        };

        const updatedLectures = [newLecture, ...lectures];

        setLectures(updatedLectures);

        localStorage.setItem(
          "smartLectures",
          JSON.stringify(updatedLectures)
        );
      } else {
        setIsProcessing(false);
        setUploadStatus(
          data.message || "Something went wrong while processing the lecture."
        );
      }
    } catch (error) {
      console.error(error);

      setIsProcessing(false);
      setUploadStatus("Could not connect to the backend.");
    }
  };

  const handleNewLecture = () => {
    setSelectedFile(null);
    setUploadStatus("");
    setResult(null);
    setIsProcessing(false);
    setActiveTab("home");
  };

  const handleOpenLecture = (lecture) => {
    setResult(lecture.data);
    setActiveTab("lecture");
  };

  const handleHomeClick = (event) => {
    event.preventDefault();

    setActiveTab("home");
    setResult(null);
  };

  const handleLecturesClick = (event) => {
    event.preventDefault();

    setActiveTab("lectures");
    setResult(null);
  };

  return (
    <div>
      <header>
        <div className="logo">🎓 Smart Lecture AI</div>

        <nav>
          <a href="#" onClick={handleHomeClick}>
            Home
          </a>

          <a href="#" onClick={handleLecturesClick}>
            My Lectures
          </a>

          <a href="#">
            About
          </a>
        </nav>
      </header>

      <main className="hero">
        <section className="hero-content">

          {activeTab === "lectures" && (
            <div className="results">
              <p className="tagline">
                YOUR LECTURE LIBRARY
              </p>

              <h1>
                📚 My Lectures
              </h1>

              <p className="description">
                Your generated study material is saved here.
              </p>

              {lectures.length === 0 ? (
                <div className="result-card">
                  <h2>
                    📭 No lectures yet
                  </h2>

                  <p>
                    Upload your first lecture and your generated
                    study material will appear here.
                  </p>

                  <button
                    className="upload-button"
                    onClick={() => setActiveTab("home")}
                  >
                    📄 Upload a Lecture
                  </button>
                </div>
              ) : (
                <div className="lectures-list">
                  {lectures.map((lecture) => (
                    <LectureCard
                      key={lecture.id}
                      lecture={lecture}
                      onClick={() => handleOpenLecture(lecture)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "home" && isProcessing && (
            <div className="processing-screen">
              <div className="processing-icon">
                🧠
              </div>

              <p className="tagline">
                AI-POWERED STUDY ASSISTANT
              </p>

              <h1>
                Analyzing your
                <span> lecture.</span>
              </h1>

              <p className="processing-description">
                Turning your lecture into smart study material.
              </p>

              <div className="processing-loader">
                <div className="processing-bar"></div>
              </div>

              <div className="processing-steps">
                <div className="processing-step completed">
                  <span>✓</span>
                  Reading lecture
                </div>

                <div className="processing-step completed">
                  <span>✓</span>
                  Extracting key concepts
                </div>

                <div className="processing-step active">
                  <span>⏳</span>
                  Creating study material
                </div>

                <div className="processing-step">
                  <span>○</span>
                  Preparing quiz
                </div>

                <div className="processing-step">
                  <span>○</span>
                  Preparing flashcards
                </div>
              </div>

              <p className="processing-note">
                This may take a few moments...
              </p>
            </div>
          )}

          {activeTab === "home" && !isProcessing && !result && (
            <>
              <p className="tagline">
                AI-POWERED STUDY ASSISTANT
              </p>

              <h1>
                Turn your lectures into
                <span> smart study notes.</span>
              </h1>

              <p className="description">
                Upload a lecture and let AI transform it into
                concise summaries, key concepts, questions,
                and flashcards.
              </p>

              <div className="upload-box">
                <div className="upload-icon">
                  📄
                </div>

                <h2>
                  Upload your lecture
                </h2>

                <p>
                  PDF files supported
                </p>

                <label className="file-button">
                  Choose File

                  <input
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={handleFileChange}
                  />
                </label>

                {selectedFile && (
                  <>
                    <p>
                      📎 {selectedFile.name}
                    </p>

                    <button
                      className="upload-button"
                      onClick={handleUpload}
                    >
                      🧠 Generate Study Notes
                    </button>
                  </>
                )}

                {uploadStatus && (
                  <p>
                    {uploadStatus}
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === "workspace" && result && (
  <Workspace
    lecture={result}
    onBack={() => {
      setActiveTab("lectures");
      setResult(null);
    }}
    onNewLecture={handleNewLecture}
  />
)}

          {activeTab === "lecture" && result && (
            <div className="results">

              <p className="tagline">
                YOUR AI-GENERATED STUDY NOTES
              </p>

              <h1>
                📚 {result.filename}
              </h1>

              <div className="result-card">
                <h2>
                  📝 Summary
                </h2>

                <p>
                  {result.summary.summary}
                </p>
              </div>

              <div className="result-card">
                <h2>
                  🔑 Key Concepts
                </h2>

                <ul>
                  {result.summary.key_concepts &&
                    result.summary.key_concepts.map(
                      (concept, index) => (
                        <li key={index}>
                          {concept}
                        </li>
                      )
                    )}
                </ul>
              </div>

              <div className="result-card">
                <h2>
                  ⭐ Important Points
                </h2>

                <ul>
                  {result.summary.important_points &&
                    result.summary.important_points.map(
                      (point, index) => (
                        <li key={index}>
                          {point}
                        </li>
                      )
                    )}
                </ul>
              </div>

              <div className="result-card">
                <h2>
                  ❓ Practice Questions
                </h2>

                <div className="questions-list">
                  {result.summary.questions &&
                    result.summary.questions.map(
                      (question, index) => (
                        <div
                          className="question-item"
                          key={index}
                        >
                          <span className="question-number">
                            {index + 1}
                          </span>

                          <p>
                            {question}
                          </p>
                        </div>
                      )
                    )}
                </div>
              </div>

              <div className="result-card quiz-section">
                <h2>
                  🧠 Smart Quiz
                </h2>

                <p className="section-description">
                  Test your understanding with
                  lecture-based multiple-choice questions.
                </p>

                <Quiz
                  questions={result.summary.quiz}
                />
              </div>

              <div className="result-card flashcard-section">
                <h2>
                  🃏 Flashcards
                </h2>

                <Flashcards
                  flashcards={result.summary.flashcards}
                />
              </div>

              <button
                className="upload-button"
                onClick={() => {
                  setActiveTab("lectures");
                  setResult(null);
                }}
              >
                📚 Back to My Lectures
              </button>

              <button
                className="upload-button"
                onClick={handleNewLecture}
              >
                📄 Summarize Another Lecture
              </button>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default App;
