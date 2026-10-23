const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
      maxlength: 100, match: [/^\S+@\S+\.\S+$/, "Invalid e-mail address."]
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["resident", "admin"], default: "resident" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
