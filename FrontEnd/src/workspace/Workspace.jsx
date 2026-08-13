import { useEffect, useRef, useState } from "react";
import "./Workspace.css";

const BACKEND_URL = "http://127.0.0.1:8000";

function Workspace({
  lecture,
  onBack,
  onNewLecture,
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pdfPage, setPdfPage] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [generating, setGenerating] = useState(null);
  const [studioError, setStudioError] = useState("");

  // =====================================================
  // FLASHCARD STATE
  // =====================================================

  const [flippedCards, setFlippedCards] = useState({});

  // =====================================================
  // QUIZ STATE
  // =====================================================

  /*
    Each quiz question stores:

    {
      selected: "selected option",
      correct: true/false,
      attempts: 1 or 2,
      locked: true/false
    }

    Behaviour:

    First wrong answer:
      - Tell user it is wrong
      - Allow another attempt
      - Don't reveal answer yet

    Second wrong answer:
      - Reveal correct answer
      - Lock question

    Correct answer:
      - Mark correct
      - Lock question
  */

  const [quizAnswers, setQuizAnswers] = useState({});

  const chatEndRef = useRef(null);

  // =====================================================
  // AUTO SCROLL CHAT
  // =====================================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // =====================================================
  // SUMMARY
  // =====================================================

  const summaryText =
    lecture?.summary?.summary ||
    lecture?.summary ||
    "";

  // =====================================================
  // OPEN PDF
  // =====================================================

  const openSource = (source) => {
    if (!source) {
      return;
    }

    setPdfLoading(true);

    setPdfPage({
      filename: source.filename,
      page: source.page || 1,
    });
  };

  // =====================================================
  // CLOSE PDF
  // =====================================================

  const closePdf = () => {
    setPdfPage(null);
    setPdfLoading(false);
  };

  // =====================================================
  // SEND CHAT
  // =====================================================

  const handleSendMessage = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    if (!lecture?.filename) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      text: trimmedQuestion,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/chat`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            filename: lecture.filename,
            question: trimmedQuestion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Chat request failed."
        );
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        text: data.answer,
        sources: data.sources || [],
      };

      setMessages((previous) => [
        ...previous,
        aiMessage,
      ]);
    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          type: "error",
          text:
            "Sorry, I couldn't get an answer. " +
            error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ENTER TO SEND
  // =====================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // =====================================================
  // STUDIO GENERATION
  // =====================================================

  const generateMaterial = async (
    generationType
  ) => {
    if (
      !lecture?.filename ||
      generating
    ) {
      return;
    }

    setGenerating(generationType);
    setStudioError("");

    try {
      const response = await fetch(
        `${BACKEND_URL}/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            filename: lecture.filename,
            generation_type:
              generationType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Generation failed."
        );
      }

      if (generationType === "flashcards") {
        setFlippedCards({});
      }

      if (generationType === "quiz") {
        setQuizAnswers({});
      }

      const studioMessage = {
        id: Date.now(),
        type: "studio",
        generationType,
        data: data.data,
      };

      setMessages((previous) => [
        ...previous,
        studioMessage,
      ]);
    } catch (error) {
      console.error(
        "Studio generation error:",
        error
      );

      setStudioError(
        error.message ||
          "Study material generation failed."
      );
    } finally {
      setGenerating(null);
    }
  };

  // =====================================================
  // STUDIO BUTTON
  // =====================================================

  const renderStudioButton = (
    type,
    label
  ) => {
    const isGenerating =
      generating === type;

    return (
      <button
        onClick={() =>
          generateMaterial(type)
        }
        disabled={Boolean(generating)}
      >
        {isGenerating
          ? "Generating..."
          : label}
      </button>
    );
  };

  // =====================================================
  // NOTES
  // =====================================================

  const renderNotes = (data) => {
    const notes = data?.notes || [];

    return (
      <div className="generated-content">
        <div className="generated-title">
          📝 Structured Notes
        </div>

        {notes.map(
          (section, index) => (
            <div
              className="notes-section"
              key={index}
            >
              <h3>
                {section.heading}
              </h3>

              <ul>
                {(section.points || []).map(
                  (point, pointIndex) => (
                    <li key={pointIndex}>
                      {point}
                    </li>
                  )
                )}
              </ul>
            </div>
          )
        )}
      </div>
    );
  };

  // =====================================================
  // FLASHCARD CLICK
  // =====================================================

  const handleFlashcardClick = (
    cardId
  ) => {
    setFlippedCards((previous) => ({
      ...previous,
      [cardId]: !previous[cardId],
    }));
  };

  // =====================================================
  // FLASHCARDS
  // =====================================================

  const renderFlashcards = (
    data,
    messageId
  ) => {
    const flashcards =
      data?.flashcards || [];

    return (
      <div className="generated-content">
        <div className="generated-title">
          🧠 Revision Flashcards
        </div>

        <p className="flashcard-hint">
          Click a card to flip it and reveal the answer.
        </p>

        <div className="generated-grid flashcard-grid">
          {flashcards.map(
            (card, index) => {
              const cardId =
                `${messageId}-flashcard-${index}`;

              const isFlipped =
                Boolean(
                  flippedCards[cardId]
                );

              return (
                <button
                  type="button"
                  className={
                    "flashcard-wrapper " +
                    (isFlipped
                      ? "is-flipped"
                      : "")
                  }
                  key={cardId}
                  onClick={() =>
                    handleFlashcardClick(
                      cardId
                    )
                  }
                  aria-label={
                    isFlipped
                      ? "Show question"
                      : "Show answer"
                  }
                >
                  <div className="flashcard-inner">

                    <div className="flashcard-face flashcard-front">

                      <div className="flashcard-top">
                        <span className="flashcard-number">
                          {index + 1}
                        </span>

                        <span className="flashcard-side-label">
                          QUESTION
                        </span>
                      </div>

                      <div className="flashcard-question">
                        {card.question}
                      </div>

                      <div className="flashcard-flip-hint">
                        🔄 Click to reveal answer
                      </div>

                    </div>

                    <div className="flashcard-face flashcard-back">

                      <div className="flashcard-top">
                        <span className="flashcard-number">
                          {index + 1}
                        </span>

                        <span className="flashcard-side-label">
                          ANSWER
                        </span>
                      </div>

                      <div className="flashcard-answer">
                        {card.answer}
                      </div>

                      <div className="flashcard-flip-hint">
                        🔄 Click to see question
                      </div>

                    </div>

                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>
    );
  };

  // =====================================================
  // QUIZ OPTION CLICK
  // =====================================================

  const handleQuizAnswer = (
    quizId,
    option,
    correctAnswer
  ) => {
    const previousResult =
      quizAnswers[quizId];

    // Don't allow interaction after
    // the question has been completed.
    if (previousResult?.locked) {
      return;
    }

    const currentAttempts =
      previousResult?.attempts || 0;

    const newAttempts =
      currentAttempts + 1;

    const isCorrect =
      option === correctAnswer;

    /*
      CORRECT
      -----------------------------
      Immediately finish question.
    */

    if (isCorrect) {
      setQuizAnswers((previous) => ({
        ...previous,
        [quizId]: {
          selected: option,
          correct: true,
          attempts: newAttempts,
          locked: true,
          revealed: false,
        },
      }));

      return;
    }

    /*
      WRONG - FIRST ATTEMPT
      -----------------------------
      Give the student another chance.
    */

    if (newAttempts === 1) {
      setQuizAnswers((previous) => ({
        ...previous,
        [quizId]: {
          selected: option,
          correct: false,
          attempts: 1,
          locked: false,
          revealed: false,
        },
      }));

      return;
    }

    /*
      WRONG - SECOND ATTEMPT
      -----------------------------
      Now reveal the correct answer.
    */

    setQuizAnswers((previous) => ({
      ...previous,
      [quizId]: {
        selected: option,
        correct: false,
        attempts: 2,
        locked: true,
        revealed: true,
        correctAnswer,
      },
    }));
  };

  // =====================================================
  // QUIZ
  // =====================================================

  const renderQuiz = (
    data,
    messageId
  ) => {
    const quiz = data?.quiz || [];

    return (
      <div className="generated-content">

        <div className="generated-title">
          🧪 Practice Quiz
        </div>

        <p className="quiz-hint">
          You get two attempts for each question.
        </p>

        <div className="quiz-generated-list">

          {quiz.map(
            (item, index) => {
              const quizId =
                `${messageId}-quiz-${index}`;

              const result =
                quizAnswers[quizId];

              const attempts =
                result?.attempts || 0;

              const isLocked =
                Boolean(result?.locked);

              return (
                <div
                  className={
                    "generated-quiz-item " +
                    (result?.correct
                      ? "quiz-completed-correct"
                      : "") +
                    (result?.revealed
                      ? "quiz-completed-wrong"
                      : "")
                  }
                  key={quizId}
                >

                  {/* QUESTION */}

                  <div className="quiz-question">

                    <span>
                      {index + 1}
                    </span>

                    <strong>
                      {item.question}
                    </strong>

                  </div>


                  {/* ATTEMPT COUNTER */}

                  {!isLocked && (
                    <div className="quiz-attempt-counter">
                      Attempt {attempts + 1} of 2
                    </div>
                  )}


                  {/* OPTIONS */}

                  <div className="quiz-options">

                    {(item.options || []).map(
                      (
                        option,
                        optionIndex
                      ) => {

                        const isSelected =
                          result?.selected ===
                          option;

                        const isCorrectOption =
                          result?.correctAnswer ===
                          option;

                        let optionClass =
                          "quiz-option";

                        /*
                          Correct answer after
                          second failed attempt.
                        */

                        if (
                          result?.revealed &&
                          isCorrectOption
                        ) {
                          optionClass +=
                            " revealed-correct";
                        }

                        /*
                          Selected wrong answer.
                        */

                        if (
                          result &&
                          isSelected &&
                          !result.correct
                        ) {
                          optionClass +=
                            " selected-wrong";
                        }

                        /*
                          Correct selected answer.
                        */

                        if (
                          result &&
                          isSelected &&
                          result.correct
                        ) {
                          optionClass +=
                            " selected-correct";
                        }

                        /*
                          Once question is completed,
                          disable all options.
                        */

                        if (isLocked) {
                          optionClass +=
                            " quiz-disabled";
                        }

                        return (
                          <button
                            type="button"
                            className={
                              optionClass
                            }
                            key={
                              optionIndex
                            }
                            disabled={
                              isLocked
                            }
                            onClick={() =>
                              handleQuizAnswer(
                                quizId,
                                option,
                                item.answer
                              )
                            }
                          >

                            <span>
                              {String.fromCharCode(
                                65 +
                                  optionIndex
                              )}
                            </span>

                            <span className="quiz-option-text">
                              {option}
                            </span>

                            {result?.revealed &&
                              isCorrectOption && (
                                <span className="correct-answer-check">
                                  ✓ Correct Answer
                                </span>
                            )}

                          </button>
                        );
                      }
                    )}

                  </div>


                  {/* FIRST WRONG ATTEMPT */}

                  {result &&
                    !result.correct &&
                    !result.revealed &&
                    !result.locked && (
                      <div className="quiz-feedback feedback-wrong retry-feedback">

                        <span>
                          ✕
                        </span>

                        <div>
                          <strong>
                            Not quite!
                          </strong>

                          <small>
                            You have one more chance. Try again!
                          </small>
                        </div>

                      </div>
                  )}


                  {/* CORRECT */}

                  {result?.correct && (
                    <div className="quiz-feedback feedback-correct">

                      <span>
                        ✓
                      </span>

                      <div>
                        <strong>
                          Correct!
                        </strong>

                        <small>
                          Great job! You got it in{" "}
                          {attempts}{" "}
                          {attempts === 1
                            ? "attempt."
                            : "attempts."}
                        </small>
                      </div>

                    </div>
                  )}


                  {/* SECOND WRONG */}

                  {result?.revealed && (
                    <div className="quiz-feedback feedback-wrong">

                      <span>
                        ✕
                      </span>

                      <div>
                        <strong>
                          Not quite!
                        </strong>

                        <small>
                          The correct answer is:{" "}
                          <b>
                            {result.correctAnswer}
                          </b>
                        </small>
                      </div>

                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>
      </div>
    );
  };

  // =====================================================
  // MINDMAP NODE
  // =====================================================

  const renderMindmapNode = (
    node,
    level = 0
  ) => {
    if (!node) {
      return null;
    }

    return (
      <div
        className={`mindmap-tree-node level-${Math.min(
          level,
          4
        )}`}
      >

        <div className="mindmap-node-card">

          <span className="mindmap-node-dot">
            {level === 0 ? "◆" : "●"}
          </span>

          <span className="mindmap-node-title">
            {node.title}
          </span>

        </div>


        {node.children?.length > 0 && (
          <div className="mindmap-children">

            {node.children.map(
              (child, index) => (
                <div
                  className="mindmap-child"
                  key={index}
                >

                  <div className="mindmap-horizontal-line" />

                  {renderMindmapNode(
                    child,
                    level + 1
                  )}

                </div>
              )
            )}

          </div>
        )}

      </div>
    );
  };

  // =====================================================
  // MINDMAP
  // =====================================================

  const renderMindmap = (
    data
  ) => {
    const mindmap =
      data?.mindmap;

    return (
      <div className="generated-content">

        <div className="generated-title">
          🗺️ Lecture Mindmap
        </div>

        <p className="mindmap-hint">
          Visual overview of the key concepts in your lecture.
        </p>

        <div className="mindmap-scroll">

          <div className="mindmap-tree">

            {/* ROOT */}

            <div className="mindmap-root-wrapper">

              <div className="mindmap-root-card">
                <span>🧠</span>

                <strong>
                  {mindmap?.title ||
                    "Lecture Mindmap"}
                </strong>
              </div>

            </div>


            {/* VERTICAL LINE FROM ROOT */}

            {mindmap?.branches?.length > 0 && (
              <div className="mindmap-root-line" />
            )}


            {/* MAIN BRANCHES */}

            <div className="mindmap-branches">

              {mindmap?.branches?.map(
                (branch, index) => (
                  <div
                    className="mindmap-main-branch"
                    key={index}
                  >

                    {/* LINE TO BRANCH */}

                    <div className="mindmap-branch-line" />

                    {renderMindmapNode(
                      branch,
                      0
                    )}

                  </div>
                )
              )}

            </div>

          </div>

        </div>

      </div>
    );
  };

  // =====================================================
  // STUDIO MESSAGE
  // =====================================================

  const renderStudioMessage = (
    message
  ) => {
    const type =
      message.generationType;

    return (
      <div className="chat-message studio-message">

        <div className="ai-message studio-result-card">

          <div className="ai-message-header">

            <span>✨</span>

            <strong>
              Smart Lecture AI
            </strong>

            <span className="generated-badge">
              Generated
            </span>

          </div>

          {type === "notes" &&
            renderNotes(
              message.data
            )}

          {type === "flashcards" &&
            renderFlashcards(
              message.data,
              message.id
            )}

          {type === "quiz" &&
            renderQuiz(
              message.data,
              message.id
            )}

          {type === "mindmap" &&
            renderMindmap(
              message.data
            )}

        </div>

      </div>
    );
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="workspace">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="workspace-header">

        <div className="workspace-brand">

          <span className="brand-icon">
            🎓
          </span>

          <span>
            Smart Lecture AI
          </span>

        </div>

        <div className="workspace-lecture">
          📘{" "}
          {lecture?.filename ||
            "Lecture Workspace"}
        </div>

        <div className="workspace-actions">

          <button
            onClick={onBack}
          >
            ← My Lectures
          </button>

          <button
            onClick={onNewLecture}
          >
            ＋ New Lecture
          </button>

        </div>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="workspace-grid">

        {/* =================================================
            SOURCES
        ================================================= */}

        <aside className="sources-panel">

          <div className="panel-heading">

            <div>

              <span className="panel-icon">
                📚
              </span>

              <h2>
                Sources
              </h2>

            </div>

            <button
              className="add-source-button"
              type="button"
            >
              +
            </button>

          </div>

          <p className="panel-subtitle">
            Your lecture sources
          </p>

          <div className="source-list">

            <button
              className="source-item active-source"
              onClick={() =>
                openSource({
                  filename:
                    lecture?.filename,
                  page: 1,
                })
              }
            >

              <span className="source-file-icon">
                📄
              </span>

              <div>

                <p>
                  {lecture?.filename ||
                    "Current Lecture"}
                </p>

                <span>
                  PDF source
                </span>

              </div>

            </button>

          </div>

          <div className="sources-empty">

            <span>＋</span>

            <p>
              Add more sources later
            </p>

          </div>

        </aside>


        {/* =================================================
            CHAT
        ================================================= */}

        <section className="chat-panel">

          <div className="chat-header">

            <div>

              <span className="panel-icon">
                💬
              </span>

              <h2>
                Chat
              </h2>

            </div>

            <span className="chat-status">
              AI Study Assistant
            </span>

          </div>


          <div className="chat-content">

            {messages.length === 0 && (

              <div className="chat-welcome">

                <div className="chat-welcome-icon">
                  ✨
                </div>

                <h1 className="workspace-chat-title">
                  Ask about your lecture
                </h1>

                <p className="chat-welcome-description">
                  Ask questions and get answers
                  grounded in your lecture sources.
                </p>

                {summaryText && (

                  <div className="summary-message">

                    <div className="summary-label">
                      📄 Lecture Summary
                    </div>

                    <p>
                      {summaryText}
                    </p>

                  </div>

                )}

              </div>

            )}


            {messages.map(
              (message) => {

                if (
                  message.type ===
                  "studio"
                ) {
                  return (
                    <div
                      key={message.id}
                    >
                      {renderStudioMessage(
                        message
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={`chat-message ${message.type}`}
                  >

                    {message.type ===
                      "user" && (

                      <div className="message-bubble user-bubble">
                        {message.text}
                      </div>

                    )}


                    {message.type ===
                      "ai" && (

                      <div className="ai-message">

                        <div className="ai-message-header">

                          <span>
                            ✨
                          </span>

                          <strong>
                            Smart Lecture AI
                          </strong>

                        </div>

                        <p className="ai-answer">
                          {message.text}
                        </p>

                        {message.sources?.length >
                          0 && (

                          <div className="answer-sources">

                            <div className="sources-title">
                              📚 Sources from your PDF
                            </div>

                            <div className="source-links">

                              {message.sources.map(
                                (
                                  source,
                                  index
                                ) => (

                                  <button
                                    key={`${source.page}-${index}`}
                                    className="source-link"
                                    onClick={() =>
                                      openSource(
                                        source
                                      )
                                    }
                                  >
                                    📄 Page{" "}
                                    {source.page}
                                  </button>

                                )
                              )}

                            </div>

                          </div>

                        )}

                      </div>

                    )}


                    {message.type ===
                      "error" && (

                      <div className="error-message">
                        ⚠️{" "}
                        {message.text}
                      </div>

                    )}

                  </div>
                );
              }
            )}


            {loading && (

              <div className="chat-message ai">

                <div className="ai-message loading-message">

                  <div className="ai-message-header">

                    <span>
                      ✨
                    </span>

                    <strong>
                      Smart Lecture AI
                    </strong>

                  </div>

                  <p>
                    Looking through your lecture...
                  </p>

                </div>

              </div>

            )}

            <div
              ref={chatEndRef}
            />

          </div>


          <div className="chat-input-area">

            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder="Ask anything about your lecture..."
              rows={1}
              disabled={loading}
            />

            <button
              className="send-button"
              onClick={
                handleSendMessage
              }
              disabled={
                loading ||
                !question.trim()
              }
            >
              ↑
            </button>

          </div>

          <p className="chat-disclaimer">
            Answers are grounded in your lecture sources.
          </p>

        </section>


        {/* =================================================
            STUDIO
        ================================================= */}

        <aside className="studio-panel">

          <div className="panel-heading">

            <div>

              <span className="panel-icon">
                ✨
              </span>

              <h2>
                Studio
              </h2>

            </div>

          </div>

          <p className="panel-subtitle">
            Generate study materials
            whenever you need them.
          </p>


          {studioError && (

            <div className="studio-error">
              ⚠️ {studioError}
            </div>

          )}


          <div className="studio-card generated">

            <div className="studio-card-icon">
              📄
            </div>

            <div className="studio-card-content">

              <h3>
                Summary
              </h3>

              <p>
                Already generated
              </p>

            </div>

            <span className="studio-ready">
              ✓
            </span>

          </div>


          <div
            className={
              "studio-card " +
              (generating ===
              "notes"
                ? "generating"
                : "")
            }
          >

            <div className="studio-card-icon">
              📝
            </div>

            <div className="studio-card-content">

              <h3>
                Notes
              </h3>

              <p>
                Generate structured notes
              </p>

            </div>

            {renderStudioButton(
              "notes",
              "Generate"
            )}

          </div>


          <div
            className={
              "studio-card " +
              (generating ===
              "flashcards"
                ? "generating"
                : "")
            }
          >

            <div className="studio-card-icon">
              🧠
            </div>

            <div className="studio-card-content">

              <h3>
                Flashcards
              </h3>

              <p>
                Create revision cards
              </p>

            </div>

            {renderStudioButton(
              "flashcards",
              "Generate"
            )}

          </div>


          <div
            className={
              "studio-card " +
              (generating ===
              "quiz"
                ? "generating"
                : "")
            }
          >

            <div className="studio-card-icon">
              🧪
            </div>

            <div className="studio-card-content">

              <h3>
                Quiz
              </h3>

              <p>
                Test your understanding
              </p>

            </div>

            {renderStudioButton(
              "quiz",
              "Generate"
            )}

          </div>


          <div
            className={
              "studio-card " +
              (generating ===
              "mindmap"
                ? "generating"
                : "")
            }
          >

            <div className="studio-card-icon">
              🗺️
            </div>

            <div className="studio-card-content">

              <h3>
                Mindmap
              </h3>

              <p>
                Visualize key concepts
              </p>

            </div>

            {renderStudioButton(
              "mindmap",
              "Generate"
            )}

          </div>

        </aside>

      </main>


      {/* =================================================
          PDF VIEWER
      ================================================= */}

      {pdfPage && (

        <div
          className="pdf-overlay"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePdf();
            }
          }}
        >

          <div className="pdf-viewer">

            <div className="pdf-viewer-header">

              <div className="pdf-title">

                <span>
                  📄
                </span>

                <div>

                  <strong>
                    {pdfPage.filename}
                  </strong>

                  <span>
                    Page{" "}
                    {pdfPage.page}
                  </span>

                </div>

              </div>

              <button
                className="pdf-close"
                onClick={closePdf}
              >
                ✕
              </button>

            </div>


            <div className="pdf-viewer-body">

              {pdfLoading && (

                <div className="pdf-loading">
                  Opening PDF...
                </div>

              )}

              <iframe
                title="Lecture PDF"
                src={
                  `${BACKEND_URL}/pdf/` +
                  `${encodeURIComponent(
                    pdfPage.filename
                  )}` +
                  `#page=${pdfPage.page}`
                }
                className="pdf-frame"
                onLoad={() =>
                  setPdfLoading(
                    false
                  )
                }
              />

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Workspace;