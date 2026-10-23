const NAV_ITEMS = [
  { label: "All Assignments", icon: "▦" },
  { label: "Pending", icon: "◔" },
  { label: "In Progress", icon: "◑" },
  { label: "Completed", icon: "✔" },
];

function Sidebar({ activeFilter, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon">🎓</span>
        <span className="brand-name">StudyBoard</span>
      </div>
      <nav className="nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`nav-item ${activeFilter === item.label ? "active" : ""}`}
            onClick={() => onSelect(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
