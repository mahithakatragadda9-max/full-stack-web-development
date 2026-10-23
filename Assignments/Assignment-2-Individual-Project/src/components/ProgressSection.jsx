function ProgressSection({ assignments }) {
  const total = assignments.length;
  const completed = assignments.filter((a) => a.status === "Completed").length;
  const remaining = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <section className="card progress-card">
      <div className="progress-top">
        <h3>Overall Progress</h3>
        <span className="progress-percent">{percent}%</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
        <div className="progress-fill" style={{ width: `${percent}%` }}></div>
      </div>
      <p className="progress-note">
        <strong>{completed}</strong> completed · <strong>{remaining}</strong> remaining
        {total === 0 && " · Add an assignment to start tracking"}
      </p>
    </section>
  );
}

export default ProgressSection;
