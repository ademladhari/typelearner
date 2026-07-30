require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Word = require("./models/wordModel");

const app = express();
const port = process.env.PORT || 5000;
const mongoUri =
  process.env.MONGODB_URI || process.env.REACT_APP_MONGODB_LOGIN_URL;

if (!mongoUri) {
  console.error("Missing MONGODB_URI in backend/.env");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

app.get("/words", async (req, res) => {
  try {
    const words = await Word.find().sort({ score: -1, word: 1 });
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: "Error fetching words" });
  }
});

app.post("/words", async (req, res) => {
  const word = String(req.body.word || "").trim();
  const score = Number(req.body.score);
  if (!word) {
    return res.status(400).json({ error: "Word is required" });
  }

  try {
    const existing = await Word.findOne({
      word: { $regex: `^${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
    if (existing) {
      return res.status(409).json({ error: "Word already exists", word: existing });
    }

    const created = await Word.create({
      word,
      score: Number.isFinite(score) ? Math.max(1, Math.round(score)) : 1,
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: "Error adding word" });
  }
});

app.post("/words/check", async (req, res) => {
  const { word, scoreAdjustment } = req.body;
  try {
    const updated = await Word.findOneAndUpdate(
      { word },
      { $inc: { score: scoreAdjustment } },
      { new: true },
    );
    if (!updated) {
      return res.status(404).json({ error: "Word not found" });
    }
    res.json({ message: "Word score updated", word: updated });
  } catch (error) {
    res.status(500).json({ error: "Error updating word score" });
  }
});

app.patch("/words/:word", async (req, res) => {
  const word = decodeURIComponent(req.params.word);
  const score = Number(req.body.score);
  if (!Number.isFinite(score)) {
    return res.status(400).json({ error: "Score must be a number" });
  }

  try {
    const updated = await Word.findOneAndUpdate(
      { word },
      { $set: { score: Math.max(1, Math.round(score)) } },
      { new: true },
    );
    if (!updated) {
      return res.status(404).json({ error: "Word not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error updating word score" });
  }
});

app.delete("/words/:word", async (req, res) => {
  const word = decodeURIComponent(req.params.word);
  try {
    const deletedWord = await Word.findOneAndDelete({ word });
    if (deletedWord) {
      res.json({ message: "Word deleted successfully" });
    } else {
      res.status(404).json({ error: "Word not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
