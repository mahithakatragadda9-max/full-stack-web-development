import { useState, useEffect } from "react";

const EMPTY_FORM = { title: "", subject: "", dueDate: "", priority: "Medium", status: "Pending" };

function AssignmentModal({ assignment, onSave, onClose }) {
  const isEditing = assignment !== null;
  const [form, setForm] = useState(isEditing ? { ...assignment } : EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  }

  function validate() {
    const found = {};
    if (!form.title.trim()) found.title = "Assignment title is required.";
    else if (form.title.trim().length < 3) found.title = "Title must be at least 3 characters.";
    if (!form.subject.trim()) found.subject = "Subject is required.";
    if (!form.dueDate) found.dueDate = "Please choose a due date.";
    return found;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    onSave({ ...form, title: form.title.trim(), subject: form.subject.trim() });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2>{isEditing ? "Edit Assignment" : "Add Assignment"}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Assignment Title *</span>
            <input name="title" type="text" value={form.title} onChange={handleChange} placeholder="e.g. Graph Algorithms Lab" />
            {errors.title && <small className="error">{errors.title}</small>}
          </label>
          <label className="field">
            <span>Subject *</span>
            <input name="subject" type="text" value={form.subject} onChange={handleChange} placeholder="e.g. Data Structures" />
            {errors.subject && <small className="error">{errors.subject}</small>}
          </label>
          <label className="field">
            <span>Due Date *</span>
            <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} />
            {errors.dueDate && <small className="error">{errors.dueDate}</small>}
          </label>
          <div className="field-row">
            <label className="field">
              <span>Priority</span>
              <select name="priority" value={form.priority} onChange={handleChange}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select name="status" value={form.status} onChange={handleChange}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? "Save Changes" : "Add Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignmentModal;
