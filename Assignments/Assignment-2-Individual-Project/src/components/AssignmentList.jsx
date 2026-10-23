const STATUSES = ["Pending", "In Progress", "Completed"];

function statusClass(status) {
  return "badge status-" + status.toLowerCase().replace(" ", "-");
}

function formatDate(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function AssignmentList({ assignments, onEdit, onDelete, onStatusChange, onClearFilters }) {
  const today = new Date().toISOString().slice(0, 10);

  if (assignments.length === 0) {
    return (
      <div className="card empty-state">
        <div className="empty-icon">📭</div>
        <h3>No assignments found</h3>
        <p>Nothing matches your search or filters right now.</p>
        <button className="btn btn-primary" onClick={onClearFilters}>
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="card list-card">
      <div className="task-row task-head">
        <span>Title</span>
        <span>Subject</span>
        <span>Due Date</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {assignments.map((a) => {
        const overdue = a.status !== "Completed" && a.dueDate < today;
        return (
          <div key={a.id} className="task-row">
            <span className="task-title" data-label="Title">{a.title}</span>
            <span data-label="Subject">{a.subject}</span>
            <span data-label="Due" className={overdue ? "overdue" : ""}>
              {formatDate(a.dueDate)}
              {overdue && <em> (Overdue)</em>}
            </span>
            <span data-label="Priority">
              <span className={`badge priority-${a.priority.toLowerCase()}`}>{a.priority}</span>
            </span>
            <span data-label="Status">
              <select
                className={`status-select ${statusClass(a.status)}`}
                value={a.status}
                onChange={(e) => onStatusChange(a.id, e.target.value)}
                aria-label={`Change status of ${a.title}`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </span>
            <span className="row-actions">
              <button className="btn btn-small" onClick={() => onEdit(a)}>Edit</button>
              <button className="btn btn-small btn-danger" onClick={() => onDelete(a)}>Delete</button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default AssignmentList;
