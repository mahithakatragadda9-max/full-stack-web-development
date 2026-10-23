const mongoose = require("mongoose");

const STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];
const CATEGORIES = ["General", "Plastic", "Paper", "Glass", "Metal", "Organic", "E-Waste", "Hazardous"];

const reportSchema = new mongoose.Schema(
  {
    referenceId: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    category: { type: String, enum: CATEGORIES, required: true },
    location: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    status: { type: String, enum: STATUSES, default: "Pending" },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resolutionNotes: { type: String, trim: true, maxlength: 1000, default: "" },
    statusHistory: [
      {
        status: { type: String, enum: STATUSES },
        note: { type: String, maxlength: 1000, default: "" },
        changedAt: { type: Date, default: Date.now },
        _id: false
      }
    ]
  },
  { timestamps: true }
);
reportSchema.index({ reporter: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);
Report.STATUSES = STATUSES;
Report.CATEGORIES = CATEGORIES;
module.exports = Report;
