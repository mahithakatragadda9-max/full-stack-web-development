function SummaryCards({ assignments }) {
  const total = assignments.length;
  const pending = assignments.filter((a) => a.status === "Pending").length;
  const inProgress = assignments.filter((a) => a.status === "In Progress").length;
  const completed = assignments.filter((a) => a.status === "Completed").length;

  const cards = [
    { label: "Total Assignments", value: total, icon: "📚", tone: "purple" },
    { label: "Pending Assignments", value: pending, icon: "⏳", tone: "amber" },
    { label: "In Progress", value: inProgress, icon: "🛠", tone: "blue" },
    { label: "Completed Assignments", value: completed, icon: "✅", tone: "green" },
  ];

  return (
    <section className="cards">
      {cards.map((card) => (
        <div key={card.label} className="card summary-card">
          <div className={`summary-icon tone-${card.tone}`}>{card.icon}</div>
          <div>
            <p className="summary-value">{card.value}</p>
            <p className="summary-label">{card.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export default SummaryCards;
