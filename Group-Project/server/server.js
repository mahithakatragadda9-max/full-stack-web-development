require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const User = require("./models/User");
const Report = require("./models/Report");

const { PORT = 5000, MONGO_URI, JWT_SECRET, CLIENT_ORIGIN = "http://localhost:5173", NODE_ENV } = process.env;
if (!MONGO_URI || !JWT_SECRET || JWT_SECRET.length < 16) {
  console.error("Set MONGO_URI and a JWT_SECRET (16+ characters) in server/.env (see .env.example).");
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

/* ---------- helpers ---------- */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const str = (v) => (typeof v === "string" ? v.trim() : "");
const isId = (v) => typeof v === "string" && /^[a-f\d]{24}$/i.test(v);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const newRef = () => `ECO-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

const cookieOpts = { httpOnly: true, sameSite: "lax", secure: NODE_ENV === "production", maxAge: 7 * 24 * 3600 * 1000 };
const sign = (u) => jwt.sign({ id: u._id }, JWT_SECRET, { expiresIn: "7d" });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

// Public view: no reporter, no history
const pub = (r) => ({
  id: r._id, referenceId: r.referenceId, title: r.title, description: r.description,
  category: r.category, location: r.location, status: r.status,
  resolutionNotes: r.resolutionNotes, createdAt: r.createdAt, updatedAt: r.updatedAt
});
const own = (r) => ({ ...pub(r), statusHistory: r.statusHistory });
const adminView = (r) => ({ ...own(r), reporter: r.reporter ? { name: r.reporter.name, email: r.reporter.email } : null });

const filterFrom = (q) => {
  const f = {};
  if (Report.STATUSES.includes(q.status)) f.status = q.status;
  if (Report.CATEGORIES.includes(q.category)) f.category = q.category;
  return f;
};

const reportInput = (b) => {
  const d = { title: str(b.title), description: str(b.description), category: str(b.category), location: str(b.location) };
  if (d.title.length < 3 || d.title.length > 100) return { error: "Title must be 3-100 characters." };
  if (d.description.length < 10 || d.description.length > 1000) return { error: "Description must be 10-1000 characters." };
  if (!Report.CATEGORIES.includes(d.category)) return { error: "Invalid category." };
  if (d.location.length < 3 || d.location.length > 150) return { error: "Location must be 3-150 characters." };
  return { data: d };
};

/* ---------- auth middleware ---------- */
const getUser = async (req) => {
  const t = req.cookies.token;
  if (!t) return null;
  try { return await User.findById(jwt.verify(t, JWT_SECRET).id); } catch { return null; }
};
const auth = wrap(async (req, res, next) => {
  const u = await getUser(req);
  if (!u) return bad(res, "Please log in.", 401);
  req.user = u;
  next();
});
const adminOnly = (req, res, next) => (req.user.role === "admin" ? next() : bad(res, "Administrator access required.", 403));
const resident = (req, res, next) => (req.user.role === "resident" ? next() : bad(res, "Residents only.", 403));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, skipSuccessfulRequests: true,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." }
});

/* ---------- auth routes ---------- */
app.post("/api/auth/register", authLimiter, wrap(async (req, res) => {
  const name = str(req.body.name);
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (name.length < 2 || name.length > 60) return bad(res, "Name must be 2-60 characters.");
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 100) return bad(res, "Enter a valid e-mail address.");
  if (password.length < 8 || password.length > 72) return bad(res, "Password must be 8-72 characters.");
  if (await User.findOne({ email })) return bad(res, "Email already registered.", 409);
  const u = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  res.cookie("token", sign(u), cookieOpts).status(201).json({ user: publicUser(u) });
}));

app.post("/api/auth/login", authLimiter, wrap(async (req, res) => {
  const email = str(req.body.email).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const u = email ? await User.findOne({ email }) : null;
  if (!u || !(await bcrypt.compare(password, u.passwordHash))) return bad(res, "Invalid email or password.", 401);
  res.cookie("token", sign(u), cookieOpts).json({ user: publicUser(u) });
}));

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: cookieOpts.secure });
  res.json({ ok: true });
});

app.get("/api/auth/me", wrap(async (req, res) => {
  const u = await getUser(req);
  res.json({ user: u ? publicUser(u) : null });
}));

/* ---------- public routes ---------- */
app.get("/api/public/reports", wrap(async (req, res) => {
  const rs = await Report.find(filterFrom(req.query)).select("-reporter -statusHistory").sort({ createdAt: -1 }).limit(100);
  res.json({ reports: rs.map(pub) });
}));

app.get("/api/public/stats", wrap(async (req, res) => {
  const [s, c] = await Promise.all([
    Report.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Report.aggregate([{ $group: { _id: "$category", n: { $sum: 1 } } }, { $sort: { n: -1 } }])
  ]);
  const byStatus = Object.fromEntries(Report.STATUSES.map((x) => [x, 0]));
  s.forEach((x) => { byStatus[x._id] = x.n; });
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  res.json({
    total, byStatus,
    byCategory: c.map((x) => ({ category: x._id, count: x.n })),
    resolutionRate: total ? Math.round((byStatus.Resolved / total) * 100) : 0
  });
}));

/* ---------- resident routes ---------- */
app.post("/api/reports", auth, resident, wrap(async (req, res) => {
  const { error, data } = reportInput(req.body);
  if (error) return bad(res, error);
  const r = await Report.create({
    ...data, referenceId: newRef(), reporter: req.user._id,
    statusHistory: [{ status: "Pending", note: "Report submitted" }]
  });
  res.status(201).json({ report: own(r) });
}));

app.get("/api/reports/mine", auth, resident, wrap(async (req, res) => {
  const rs = await Report.find({ reporter: req.user._id }).sort({ createdAt: -1 });
  res.json({ reports: rs.map(own) });
}));

const ownReport = wrap(async (req, res, next) => {
  if (!isId(req.params.id)) return bad(res, "Invalid report ID.");
  const r = await Report.findById(req.params.id);
  if (!r) return bad(res, "Report not found.", 404);
  if (String(r.reporter) !== String(req.user._id)) return bad(res, "You can only change your own reports.", 403);
  if (r.status !== "Pending") return bad(res, "Only Pending reports can be changed.", 409);
  req.report = r;
  next();
});

app.put("/api/reports/:id", auth, resident, ownReport, wrap(async (req, res) => {
  const { error, data } = reportInput(req.body);
  if (error) return bad(res, error);
  const r = await Report.findOneAndUpdate({ _id: req.report._id, status: "Pending" }, data, { new: true, runValidators: true });
  if (!r) return bad(res, "Only Pending reports can be changed.", 409);
  res.json({ report: own(r) });
}));

app.delete("/api/reports/:id", auth, resident, ownReport, wrap(async (req, res) => {
  const out = await Report.deleteOne({ _id: req.report._id, status: "Pending" });
  if (!out.deletedCount) return bad(res, "Only Pending reports can be deleted.", 409);
  res.json({ ok: true });
}));

/* ---------- admin routes ---------- */
app.get("/api/admin/reports", auth, adminOnly, wrap(async (req, res) => {
  const f = filterFrom(req.query);
  const s = str(req.query.search).slice(0, 60);
  if (s) {
    const rx = new RegExp(esc(s), "i");
    f.$or = [{ title: rx }, { referenceId: rx }, { location: rx }, { description: rx }];
  }
  const rs = await Report.find(f).sort({ createdAt: -1 }).limit(200).populate("reporter", "name email");
  res.json({ reports: rs.map(adminView) });
}));

app.patch("/api/admin/reports/:id/status", auth, adminOnly, wrap(async (req, res) => {
  if (!isId(req.params.id)) return bad(res, "Invalid report ID.");
  const status = str(req.body.status);
  const notes = str(req.body.resolutionNotes);
  if (!Report.STATUSES.includes(status)) return bad(res, "Invalid status.");
  if (notes.length > 1000) return bad(res, "Notes must be at most 1000 characters.");
  const r = await Report.findById(req.params.id).populate("reporter", "name email");
  if (!r) return bad(res, "Report not found.", 404);
  r.status = status;
  r.resolutionNotes = notes;
  r.statusHistory.push({ status, note: notes });
  await r.save();
  res.json({ report: adminView(r) });
}));

/* ---------- errors ---------- */
app.use("/api", (req, res) => bad(res, "Not found.", 404));
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  if (err.type === "entity.parse.failed") return bad(res, "Invalid JSON.");
  if (err.code === 11000) return bad(res, "Duplicate value. Please try again.", 409);
  if (err.name === "ValidationError") return bad(res, Object.values(err.errors)[0].message);
  console.error(err);
  bad(res, "Server error.", 500);
});

/* ---------- start ---------- */
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => app.listen(PORT, () => console.log(`EcoTrack API running on http://localhost:${PORT}`)))
  .catch((e) => {
    console.error("MongoDB connection failed:", e.message);
    console.error("Check that MongoDB is running (local) or that MONGO_URI and Atlas network access are correct.");
    process.exit(1);
  });
