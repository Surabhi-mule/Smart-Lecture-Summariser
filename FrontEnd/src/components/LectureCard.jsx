import "./LectureCard.css";

function LectureCard({ lecture, onClick }) {
  return (
    <div className="lecture-card" onClick={onClick}>
      <div className="lecture-icon">📚</div>

      <div className="lecture-info">
        <h3>{lecture.title}</h3>

        <p>
          {lecture.date
            ? new Date(lecture.date).toLocaleDateString()
            : "Recently added"}
        </p>
      </div>

      <div className="lecture-arrow">→</div>
    </div>
  );
}

export default LectureCard;