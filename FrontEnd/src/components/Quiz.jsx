import { useEffect, useState } from "react";
import "./Quiz.css";

function Quiz({ questions }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const totalQuestions = questions?.length || 0;

  useEffect(() => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setCompleted(false);
  }, [questions]);

  if (!totalQuestions) {
    return (
      <div className="quiz-empty">
        No quiz questions available.
      </div>
    );
  }

  if (completed) {
    const percentage = Math.round(
      (score / totalQuestions) * 100
    );

    return (
      <div className="quiz-complete">

        <div className="quiz-complete-icon">
          🎉
        </div>

        <h3>
          Quiz Complete!
        </h3>

        <p>
          You scored
        </p>

        <div className="quiz-score">
          {score} / {totalQuestions}
        </div>

        <p className="quiz-percentage">
          {percentage}% accuracy
        </p>

        <button
          className="quiz-retry-button"
          onClick={() => {
            setCurrentQuestion(0);
            setSelectedAnswer(null);
            setShowResult(false);
            setScore(0);
            setCompleted(false);
          }}
        >
          🔄 Try Again
        </button>

      </div>
    );
  }

  const question = questions[currentQuestion];

  const handleAnswer = (option) => {
    if (showResult) return;

    setSelectedAnswer(option);
    setShowResult(true);

    if (option === question.correct_answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion === totalQuestions - 1) {
      setCompleted(true);
      return;
    }

    setCurrentQuestion((prev) => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const getOptionClass = (option) => {
    if (!showResult) {
      return selectedAnswer === option
        ? "quiz-option selected"
        : "quiz-option";
    }

    if (option === question.correct_answer) {
      return "quiz-option correct";
    }

    if (
      option === selectedAnswer &&
      option !== question.correct_answer
    ) {
      return "quiz-option wrong";
    }

    return "quiz-option";
  };

  return (
    <div className="quiz-container">

      <div className="quiz-top">

        <span>
          Question {currentQuestion + 1} of {totalQuestions}
        </span>

        <span>
          Score: {score}
        </span>

      </div>


      <div className="quiz-progress">

        <div
          className="quiz-progress-fill"
          style={{
            width: `${
              ((currentQuestion + 1) /
                totalQuestions) *
              100
            }%`,
          }}
        />

      </div>


      <div className="quiz-question-card">

        <span className="quiz-label">
          QUESTION
        </span>

        <h3>
          {question.question}
        </h3>


        <div className="quiz-options">

          {question.options?.map(
            (option, index) => (

              <button
                key={index}
                className={getOptionClass(option)}
                onClick={() =>
                  handleAnswer(option)
                }
                disabled={showResult}
              >

                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>

                <span>
                  {option}
                </span>

              </button>

            )
          )}

        </div>


        {showResult && (

          <div
            className={`quiz-feedback ${
              selectedAnswer ===
              question.correct_answer
                ? "correct-feedback"
                : "wrong-feedback"
            }`}
          >

            <strong>
              {selectedAnswer ===
              question.correct_answer
                ? "✅ Correct!"
                : "❌ Not quite!"}
            </strong>

            <p>
              {question.explanation}
            </p>

          </div>

        )}


        {showResult && (

          <button
            className="quiz-next-button"
            onClick={handleNext}
          >
            {currentQuestion ===
            totalQuestions - 1
              ? "Finish Quiz 🎉"
              : "Next Question →"}
          </button>

        )}

      </div>

    </div>
  );
}

export default Quiz;