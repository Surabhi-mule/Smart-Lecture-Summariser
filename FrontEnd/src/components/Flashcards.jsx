import { useEffect, useState } from "react";
import "./Flashcards.css";

function Flashcards({ flashcards }) {
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [ratings, setRatings] = useState({});

  const totalCards = flashcards?.length || 0;

  useEffect(() => {
    setCurrentCard(0);
    setShowAnswer(false);
    setRatings({});
  }, [flashcards]);

  if (!totalCards) {
    return (
      <div className="flashcards-empty">
        <p>No flashcards were generated.</p>
      </div>
    );
  }

  const card = flashcards[currentCard];

  const isFirstCard = currentCard === 0;
  const isLastCard = currentCard === totalCards - 1;

  const reviewedCards = Object.keys(ratings).length;

  const progress = Math.round(
    (reviewedCards / totalCards) * 100
  );

  // --------------------------------
  // NEXT CARD
  // --------------------------------

  const handleNext = () => {
    if (!isLastCard) {
      setCurrentCard((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  // --------------------------------
  // PREVIOUS CARD
  // --------------------------------

  const handlePrevious = () => {
    if (!isFirstCard) {
      setCurrentCard((prev) => prev - 1);
      setShowAnswer(false);
    }
  };

  // --------------------------------
  // RATE CARD
  // --------------------------------

  const handleRating = (rating) => {
    setRatings((prev) => ({
      ...prev,
      [currentCard]: rating,
    }));

    /*
      Move to the next card only if
      this isn't the final card.
    */

    if (!isLastCard) {
      setTimeout(() => {
        setCurrentCard((prev) => prev + 1);
        setShowAnswer(false);
      }, 250);
    }
  };

  // --------------------------------
  // REVIEW AGAIN
  // --------------------------------

  const handleReviewAgain = () => {
    setCurrentCard(0);
    setShowAnswer(false);
    setRatings({});
  };

  // --------------------------------
  // COMPLETION
  // --------------------------------

  if (reviewedCards === totalCards) {
    const hardCount = Object.values(ratings).filter(
      (rating) => rating === "hard"
    ).length;

    const goodCount = Object.values(ratings).filter(
      (rating) => rating === "good"
    ).length;

    const easyCount = Object.values(ratings).filter(
      (rating) => rating === "easy"
    ).length;

    return (
      <div className="flashcard-complete">

        <div className="completion-icon">
          🎉
        </div>

        <h3>
          Great job!
        </h3>

        <p className="completion-message">
          You've reviewed all {totalCards} flashcards.
        </p>

        <div className="rating-summary">

          <div className="rating-stat">
            <span>😕</span>
            <strong>{hardCount}</strong>
            <small>Hard</small>
          </div>

          <div className="rating-stat">
            <span>😐</span>
            <strong>{goodCount}</strong>
            <small>Good</small>
          </div>

          <div className="rating-stat">
            <span>😊</span>
            <strong>{easyCount}</strong>
            <small>Easy</small>
          </div>

        </div>

        <button
          className="review-again-button"
          onClick={handleReviewAgain}
        >
          🔄 Review Again
        </button>

      </div>
    );
  }

  return (
    <div className="flashcard-study">

      {/* TOP */}

      <div className="flashcard-top">

        <span className="card-counter">
          Card {currentCard + 1} of {totalCards}
        </span>

        <span className="review-counter">
          {reviewedCards}/{totalCards} reviewed
        </span>

      </div>


      {/* PROGRESS */}

      <div className="flashcard-progress">

        <div
          className="flashcard-progress-fill"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>


      {/* CARD */}

      <div
        className={`interactive-flashcard ${
          showAnswer ? "show-answer" : ""
        }`}
        onClick={() => setShowAnswer((prev) => !prev)}
      >

        {!showAnswer ? (

          <div className="card-content">

            <span className="card-label">
              QUESTION
            </span>

            <h3>
              {card.question}
            </h3>

            <div className="flip-hint">
              👆 Click to reveal answer
            </div>

          </div>

        ) : (

          <div className="card-content">

            <span className="card-label answer-label">
              ANSWER
            </span>

            <p className="card-answer">
              {card.answer}
            </p>

            <div className="flip-hint">
              👆 Click to hide answer
            </div>

          </div>

        )}

      </div>


      {/* RATING */}

      {showAnswer && (

        <div className="flashcard-rating">

          <p>
            How well did you know this?
          </p>

          <div className="rating-buttons">

            <button
              className="rating-button hard"
              onClick={(event) => {
                event.stopPropagation();
                handleRating("hard");
              }}
            >
              😕
              <span>Hard</span>
            </button>

            <button
              className="rating-button good"
              onClick={(event) => {
                event.stopPropagation();
                handleRating("good");
              }}
            >
              😐
              <span>Good</span>
            </button>

            <button
              className="rating-button easy"
              onClick={(event) => {
                event.stopPropagation();
                handleRating("easy");
              }}
            >
              😊
              <span>Easy</span>
            </button>

          </div>

        </div>

      )}


      {/* NAVIGATION */}

      <div className="flashcard-controls">

        <button
          className="card-nav-button"
          onClick={handlePrevious}
          disabled={isFirstCard}
        >
          ← Previous
        </button>

        <button
          className="card-nav-button next"
          onClick={handleNext}
          disabled={isLastCard}
        >
          {isLastCard ? "Last Card" : "Next →"}
        </button>

      </div>

    </div>
  );
}

export default Flashcards;