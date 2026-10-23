import { useState, useEffect } from "react";
import initialData from "./data/assignments.json";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import SummaryCards from "./components/SummaryCards.jsx";
import ProgressSection from "./components/ProgressSection.jsx";
import AssignmentList from "./components/AssignmentList.jsx";
import AssignmentModal from "./components/AssignmentModal.jsx";

function App() {
  const [assignments, setAssignments] = useState(initialData);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Assignments");
  const [priorityFilter, setPriorityFilter] = useState("All Priorities");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const query = search.trim().toLowerCase();
  const visibleAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(query) || a.subject.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "All Assignments" || a.status === statusFilter;
    const matchesPriority = priorityFilter === "All Priorities" || a.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  function openAddModal() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEditModal(assignment) {
    setEditing(assignment);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleSave(formData) {
    if (editing) {
      setAssignments(assignments.map((a) => (a.id === editing.id ? { ...a, ...formData, id: a.id } : a)));
      setToast("Assignment updated successfully.");
    } else {
      const nextId = assignments.reduce((max, a) => Math.max(max, a.id), 0) + 1;
      setAssignments([{ ...formData, id: nextId }, ...assignments]);
      setToast("Assignment added successfully.");
    }
    closeModal();
  }

  function handleStatusChange(id, newStatus) {
    setAssignments(assignments.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
  }

  function confirmDelete() {
    setAssignments(assignments.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
    setToast("Assignment deleted successfully.");
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("All Assignments");
    setPriorityFilter("All Priorities");
  }

  return (
    <div className="app-layout">
      <Sidebar activeFilter={statusFilter} onSelect={setStatusFilter} />

      <div className="main-area">
        <Header search={search} onSearchChange={setSearch} onAddClick={openAddModal} />

        <main className="content">
          <SummaryCards assignments={assignments} />
          <ProgressSection assignments={assignments} />

          <div className="toolbar">
            <h2 className="section-title">
              Assignments <span className="count-pill">{visibleAssignments.length}</span>
            </h2>
            <div className="filters">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option>All Assignments</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                aria-label="Filter by priority"
              >
                <option>All Priorities</option>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>
          </div>

          <AssignmentList
            assignments={visibleAssignments}
            onEdit={openEditModal}
            onDelete={setDeleteTarget}
            onStatusChange={handleStatusChange}
            onClearFilters={clearFilters}
          />
        </main>
      </div>

      {modalOpen && (
        <AssignmentModal assignment={editing} onSave={handleSave} onClose={closeModal} />
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2>Delete assignment?</h2>
            <p className="confirm-text">
              "<strong>{deleteTarget.title}</strong>" will be removed. This cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger-solid" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">✔ {toast}</div>}
    </div>
  );
}

export default App;
