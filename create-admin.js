require("dotenv").config();
const bcrypt = require("bcryptjs");
const { connectDB } = require("./config/sequelize");
const { AdminUser } = require("./models/sequelize");

async function createAdmin() {
  try {
    await connectDB();
    console.log("✅ Connected to database");

    // Default admin credentials
    const username = process.env.ADMIN_USERNAME || "admin";
    const email = process.env.ADMIN_EMAIL || "admin@batik.com";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const name = process.env.ADMIN_NAME || "Administrator";

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({
      where: { username },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin user '${username}' already exists`);
      console.log("\nExisting admin details:");
      console.log("- Username:", existingAdmin.username);
      console.log("- Email:", existingAdmin.email);
      console.log("- Name:", existingAdmin.name);
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Create admin user
    const admin = await AdminUser.create({
      username,
      email,
      password_hash,
      name,
    });

    console.log("\n✅ Admin user created successfully!");
    console.log("\n=================================");
    console.log("Admin Login Credentials:");
    console.log("=================================");
    console.log("Username:", username);
    console.log("Password:", password);
    console.log("Email:", email);
    console.log("Name:", name);
    console.log("=================================");
    console.log("\n⚠️  Please change the password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
}

createAdmin();
