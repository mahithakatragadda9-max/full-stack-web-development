function Header({ search, onSearchChange, onAddClick }) {
  return (
    <header className="header">
      <h1 className="header-title">Student Task & Assignment Manager</h1>
      <div className="header-actions">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title or subject..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search assignments"
          />
        </div>
        <button className="btn btn-primary" onClick={onAddClick}>
          + Add Assignment
        </button>
      </div>
    </header>
  );
}

export default Header;
