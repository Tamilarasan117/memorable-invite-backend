import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blessings (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Connected to Neon PostgreSQL & ensured blessings table exists");
  } catch (err) {
    console.error("Database initialization failed:", err.message);
    process.exit(1);
  }
})();

app.get("/api/blessings", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM blessings ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/blessings", async (req, res, next) => {
  try {
    const { username, message } = req.body;
    if (!username || !message) {
      return res.status(400).json({ error: "Name and message are required" });
    }

    const result = await pool.query(
      "INSERT INTO blessings (username, message) VALUES ($1, $2) RETURNING *",
      [username, message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
