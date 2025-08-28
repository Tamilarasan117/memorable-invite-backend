import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(express.json());

let db;
(async () => {
  db = await open({
    filename: "./db.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS blessings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

app.get("/api/blessings", async (req, res) => {
  try {
    const blessings = await db.all("SELECT * FROM blessings ORDER BY created_at DESC");
    res.json(blessings);
  } catch (err) {
    console.error("Error fetching blessings:", err);
    res.status(500).json({ error: "Failed to fetch blessings" });
  }
});

app.post("/api/blessings", async (req, res) => {
  try {
    const { username, message } = req.body;
    if (!username || !message) {
      return res.status(400).json({ error: "Name and message are required" });
    }

    const result = await db.run(
      "INSERT INTO blessings (username, message) VALUES (?, ?)",
      [username, message]
    );

    const newBlessing = await db.get("SELECT * FROM blessings WHERE id = ?", [result.lastID]);
    res.json(newBlessing);
  } catch (err) {
    console.error("Error saving blessing:", err);
    res.status(500).json({ error: "Failed to save blessing" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
