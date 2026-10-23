import { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";

const CATEGORIES = ["General", "Plastic", "Paper", "Glass", "Metal", "Organic", "E-Waste", "Hazardous"];
const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
const GUIDE = [
  ["🧴", "Plastic", ["Rinse bottles and containers before disposal.", "Flatten bottles to save space.", "Keep plastic bags and soiled plastic separate."]],
  ["📄", "Paper", ["Keep paper and cardboard dry.", "Flatten boxes before disposal.", "Greasy or food-soiled paper cannot be recycled."]],
  ["🍾", "Glass", ["Rinse bottles and jars.", "Do not mix with ceramics or window glass.", "Wrap broken glass safely before disposal."]],
  ["🥫", "Metal", ["Rinse food cans.", "Aluminium and steel cans are widely recyclable.", "Crush cans to save space."]],
  ["🍃", "Organic", ["Compost vegetable and fruit scraps.", "Keep wet waste separate from dry waste.", "Avoid meat and dairy in home compost."]],
  ["🔌", "E-Waste", ["Never put batteries or electronics in normal bins.", "Use an authorised e-waste collection point.", "Erase personal data from old devices."]],
  ["⚠️", "Hazardous", ["Keep paint, chemicals and bulbs in sealed containers.", "Never pour chemicals down drains.", "Hand them to a hazardous-waste collection point."]]
];

const useHash = () => {
  const [h, setH] = useState(location.hash.slice(1) || "home");
  useEffect(() => {
    const f = () => setH(location.hash.slice(1) || "home");
    addEventListener("hashchange", f);
    return () => removeEventListener("hashchange", f);
  }, []);
  return h;
};

const qs = (o) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => v && p.set(k, v));
  const s = p.toString();
  return s ? "?" + s : "";
};
const fmt = (d) => new Date(d).toLocaleDateString();

function useLoad(fn, deps) {
  const [s, setS] = useState({ loading: true, error: "", data: null });
  const reload = useCallback(() => {
    setS((x) => ({ ...x, loading: true, error: "" }));
    fn().then((data) => setS({ loading: false, error: "", data }))
        .catch((e) => setS({ loading: false, error: e.message, data: null }));
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return [s, reload];
}

function Async({ s, retry, isEmpty, empty, children }) {
  if (s.loading) return <p className="state">Loading…</p>;
  if (s.error) return <p className="state error">{s.error} <button className="btn small" onClick={retry}>Retry</button></p>;
  if (isEmpty(s.data)) return <p className="state">{empty}</p>;
  return children(s.data);
}

const Badge = ({ s }) => <span className={"badge " + s.toLowerCase().replace(/\s/g, "-")}>{s}</span>;

const Sel = ({ label, value, onChange, options, all }) => (
  <label>{label}
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {all && <option value="">All</option>}
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  </label>
);

function Stats({ refresh = 0 }) {
  const [s, retry] = useLoad(api.stats, [refresh]);
  return (
    <Async s={s} retry={retry} isEmpty={() => false}>
      {(d) => {
        const max = Math.max(1, ...d.byCategory.map((c) => c.count));
        return (
          <>
            <div className="grid">
              <div className="stat"><b>{d.total}</b><span>Total reports</span></div>
              {STATUSES.map((x) => <div className="stat" key={x}><b>{d.byStatus[x]}</b><span>{x}</span></div>)}
              <div className="stat"><b>{d.resolutionRate}%</b><span>Resolution rate</span></div>
            </div>
            {d.byCategory.length > 0 && (
              <div className="card">
                <h3>Reports by category</h3>
                {d.byCategory.map((c) => (
                  <div className="bar" key={c.category}>
                    <span style={{ width: 80 }}>{c.category}</span>
                    <div style={{ flex: 1 }}><i style={{ width: (c.count / max) * 100 + "%" }} /></div>
                    <span>{c.count}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      }}
    </Async>
  );
}

function ReportCard({ r, children }) {
  return (
    <div className="card">
      <div className="row"><span className="muted">{r.referenceId}</span><Badge s={r.status} /></div>
      <h3>{r.title}</h3>
      <p className="muted">📍 {r.location} · {r.category} · {fmt(r.createdAt)}{r.reporter ? ` · by ${r.reporter.name} (${r.reporter.email})` : ""}</p>
      <p>{r.description}</p>
      {r.resolutionNotes && <div className="notes"><b>Resolution notes:</b> {r.resolutionNotes}</div>}
      {r.statusHistory && (
        <details>
          <summary>Status history</summary>
          <ul>{r.statusHistory.map((h, i) => <li key={i}>{h.status} — {fmt(h.changedAt)}{h.note ? `: ${h.note}` : ""}</li>)}</ul>
        </details>
      )}
      {children}
    </div>
  );
}

function Home() {
  return (
    <>
      <div className="hero">
        <h1>🌿 EcoTrack</h1>
        <p>Smart Waste Management and Recycling Platform. Report waste problems in your area, track their resolution and learn how to recycle better.</p>
        <a className="btn light" href="#new">Report waste</a>{" "}
        <a className="btn light" href="#public">View public reports</a>
      </div>
      <Stats />
      <h2>How it works</h2>
      <div className="cards">
        {[["1. Report", "Residents submit a waste problem with its location."],
          ["2. Review", "Administrators review reports and update their status."],
          ["3. Track", "Everyone can follow progress until it is resolved."]].map(([t, d]) => (
          <div className="card" key={t}><h3>{t}</h3><p>{d}</p></div>
        ))}
      </div>
    </>
  );
}

function PublicReports() {
  const [f, setF] = useState({ category: "", status: "" });
  const q = qs(f);
  const [s, retry] = useLoad(() => api.publicReports(q), [q]);
  return (
    <>
      <h1>Public reports</h1>
      <div className="filters">
        <Sel label="Category" all value={f.category} onChange={(v) => setF({ ...f, category: v })} options={CATEGORIES} />
        <Sel label="Status" all value={f.status} onChange={(v) => setF({ ...f, status: v })} options={STATUSES} />
      </div>
      <Async s={s} retry={retry} isEmpty={(d) => !d.reports.length} empty="No reports match your filters.">
        {(d) => <div className="cards">{d.reports.map((r) => <ReportCard key={r.id} r={r} />)}</div>}
      </Async>
    </>
  );
}

function Guide() {
  return (
    <>
      <h1>Recycling guide</h1>
      <div className="cards">
        {GUIDE.map(([i, n, tips]) => (
          <div className="card" key={n}><h3>{i} {n}</h3><ul>{tips.map((t) => <li key={t}>{t}</li>)}</ul></div>
        ))}
      </div>
    </>
  );
}

function AuthForm({ mode, onAuth }) {
  const reg = mode === "register";
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const d = reg ? await api.register(f) : await api.login({ email: f.email, password: f.password });
      onAuth(d.user);
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <>
      <h1>{reg ? "Create account" : "Log in"}</h1>
      <form className="box" onSubmit={submit}>
        {err && <p className="error">{err}</p>}
        {reg && <label>Name<input value={f.name} onChange={set("name")} required minLength={2} maxLength={60} /></label>}
        <label>Email<input type="email" value={f.email} onChange={set("email")} required /></label>
        <label>Password<input type="password" value={f.password} onChange={set("password")} required minLength={reg ? 8 : 1} /></label>
        <button className="btn" disabled={busy}>{busy ? "Please wait…" : reg ? "Register" : "Log in"}</button>
        <p className="muted">{reg ? <>Already registered? <a href="#login">Log in</a></> : <>New here? <a href="#register">Register</a></>}</p>
      </form>
    </>
  );
}

function ReportForm({ editing, onDone }) {
  const [f, setF] = useState({
    title: editing?.title || "", description: editing?.description || "",
    category: editing?.category || "General", location: editing?.location || ""
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      if (editing) await api.updateReport(editing.id, f); else await api.createReport(f);
      onDone();
    } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <>
      <h1>{editing ? "Edit report" : "New report"}</h1>
      <form className="box" onSubmit={submit}>
        {err && <p className="error">{err}</p>}
        <label>Title<input value={f.title} onChange={set("title")} required minLength={3} maxLength={100} /></label>
        <label>Description<textarea value={f.description} onChange={set("description")} required minLength={10} maxLength={1000} /></label>
        <Sel label="Category" value={f.category} onChange={(v) => setF({ ...f, category: v })} options={CATEGORIES} />
        <label>Location<input value={f.location} onChange={set("location")} required minLength={3} maxLength={150} placeholder="Street, area or landmark" /></label>
        <p className="muted">Reports are public. Do not include phone numbers, e-mails or other personal details.</p>
        <div className="row" style={{ justifyContent: "flex-start" }}>
          <button className="btn" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Submit report"}</button>
          {editing && <button type="button" className="btn light" onClick={onDone}>Cancel</button>}
        </div>
      </form>
    </>
  );
}

function MyReports({ onEdit }) {
  const [s, retry] = useLoad(api.myReports, []);
  const [err, setErr] = useState("");
  const del = async (r) => {
    if (!window.confirm("Delete this report?")) return;
    try { await api.deleteReport(r.id); setErr(""); retry(); } catch (e) { setErr(e.message); }
  };
  return (
    <>
      <div className="row"><h1>My reports</h1><a className="btn" href="#new">+ New report</a></div>
      {err && <p className="error">{err}</p>}
      <Async s={s} retry={retry} isEmpty={(d) => !d.reports.length} empty="You have not submitted any reports yet.">
        {(d) => (
          <div className="cards">
            {d.reports.map((r) => (
              <ReportCard key={r.id} r={r}>
                {r.status === "Pending" && (
                  <div className="row" style={{ justifyContent: "flex-start", marginTop: 10 }}>
                    <button className="btn small light" onClick={() => onEdit(r)}>Edit</button>
                    <button className="btn small danger" onClick={() => del(r)}>Delete</button>
                  </div>
                )}
              </ReportCard>
            ))}
          </div>
        )}
      </Async>
    </>
  );
}

function AdminRow({ r, onSaved }) {
  const [status, setStatus] = useState(r.status);
  const [notes, setNotes] = useState(r.resolutionNotes || "");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true); setMsg("");
    try { await api.setStatus(r.id, { status, resolutionNotes: notes }); onSaved(); }
    catch (e) { setMsg(e.message); setBusy(false); }
  };
  return (
    <ReportCard r={r}>
      <Sel label="Status" value={status} onChange={setStatus} options={STATUSES} />
      <label>Resolution notes<textarea value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} /></label>
      {msg && <p className="error">{msg}</p>}
      <button className="btn small" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>
    </ReportCard>
  );
}

function Admin() {
  const blank = { search: "", status: "", category: "" };
  const [draft, setDraft] = useState(blank);
  const [f, setF] = useState(blank);
  const [tick, setTick] = useState(0);
  const q = qs(f);
  const [s, retry] = useLoad(() => api.adminReports(q), [q]);
  const saved = () => { setTick((t) => t + 1); retry(); };
  return (
    <>
      <h1>Admin panel</h1>
      <Stats refresh={tick} />
      <form className="filters" onSubmit={(e) => { e.preventDefault(); setF(draft); }}>
        <label>Search<input value={draft.search} placeholder="Title, ID, location…" onChange={(e) => setDraft({ ...draft, search: e.target.value })} /></label>
        <Sel label="Status" all value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} options={STATUSES} />
        <Sel label="Category" all value={draft.category} onChange={(v) => setDraft({ ...draft, category: v })} options={CATEGORIES} />
        <button className="btn">Apply</button>
        <button type="button" className="btn light" onClick={() => { setDraft(blank); setF(blank); }}>Reset</button>
      </form>
      <Async s={s} retry={retry} isEmpty={(d) => !d.reports.length} empty="No reports found.">
        {(d) => <div className="cards">{d.reports.map((r) => <AdminRow key={r.id} r={r} onSaved={saved} />)}</div>}
      </Async>
    </>
  );
}

export default function App() {
  const page = useHash();
  const [user, setUser] = useState(undefined);
  const [editing, setEditing] = useState(null);

  useEffect(() => { api.me().then((d) => setUser(d.user)).catch(() => setUser(null)); }, []);
  useEffect(() => { if (page !== "new") setEditing(null); }, [page]);

  const go = (h) => { location.hash = h; };
  const onAuth = (u) => { setUser(u); go(u.role === "admin" ? "admin" : "my"); };
  const logout = () => api.logout().catch(() => {}).finally(() => { setUser(null); go("home"); });

  const role = user?.role;
  const nav = [
    ["home", "🏠", "Home"], ["public", "🌍", "Public Reports"], ["guide", "♻️", "Recycling Guide"],
    ...(role === "resident" ? [["my", "📋", "My Reports"], ["new", "📝", "New Report"]] : []),
    ...(role === "admin" ? [["admin", "🛠️", "Admin Panel"]] : []),
    ...(!user ? [["login", "🔑", "Log in"], ["register", "✍️", "Register"]] : [])
  ];
  const need = { my: "resident", new: "resident", admin: "admin" }[page];

  let view;
  if (user === undefined) view = <p className="state">Loading…</p>;
  else if (need && role !== need) view = <div className="state">Please <a href="#login">log in</a> with a {need} account to view this page.</div>;
  else view = ({
    home: <Home />,
    public: <PublicReports />,
    guide: <Guide />,
    login: <AuthForm key="l" mode="login" onAuth={onAuth} />,
    register: <AuthForm key="r" mode="register" onAuth={onAuth} />,
    my: <MyReports onEdit={(r) => { setEditing(r); go("new"); }} />,
    new: <ReportForm key={editing?.id || "new"} editing={editing} onDone={() => go("my")} />,
    admin: <Admin />
  })[page] || <Home />;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">🌿 EcoTrack</div>
        {nav.map(([h, i, t]) => <a key={h} href={"#" + h} className={page === h ? "active" : ""}>{i} {t}</a>)}
        {user && (<><div className="user">{user.name} ({user.role})</div><button onClick={logout}>🚪 Log out</button></>)}
      </aside>
      <main>{view}</main>
    </div>
  );
}
