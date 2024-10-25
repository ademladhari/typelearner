// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Word = require("./models/wordModel");

const app = express();
const port = 5000;

// Enable CORS for all routes e and origins
app.use(cors());

// Enable parsing of JSON request bodies
app.use(express.json());
const url = process.env.REACT_APP_MONGODB_LOGIN_URL;
console.log(url);
// Connect to MongoDB
mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Fetch words
app.get("/words", async (req, res) => {
  try {
    const words = await Word.find();
    res.json(words);
  } catch (error) {
    res.status(500).json({ error: "Error fetching words" });
  }
});

// server.js

app.post("/words/check", async (req, res) => {
  const { word, scoreAdjustment } = req.body;
  try {
    // Update the word's score in the database
    await Word.updateOne({ word }, { $inc: { score: scoreAdjustment } });
    res.json({ message: "Word score updated" });
  } catch (error) {
    res.status(500).json({ error: "Error updating word score" });
  }
});

app.delete("/words/:word", async (req, res) => {
  const { word } = req.params;
  try {
    const deletedWord = await Word.findOneAndDelete({ word });
    if (deletedWord) {
      res.json({ message: "Word deleted successfully" });
    } else {
      res.status(404).send("Word not found");
    }
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
