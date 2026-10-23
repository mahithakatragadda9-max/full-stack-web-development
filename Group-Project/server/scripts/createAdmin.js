require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

(async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.");
    process.exit(1);
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error("ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    const email = ADMIN_EMAIL.trim().toLowerCase();
    if (await User.findOne({ role: "admin" })) {
      console.log("An admin already exists. Nothing changed.");
    } else if (await User.findOne({ email })) {
      console.log("That e-mail belongs to a resident account. Use a different ADMIN_EMAIL.");
    } else {
      await User.create({
        name: ADMIN_NAME || "Administrator",
        email,
        passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
        role: "admin"
      });
      console.log("Admin created:", email);
    }
  } catch (e) {
    console.error("Failed:", e.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
