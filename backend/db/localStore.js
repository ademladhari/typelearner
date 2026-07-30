const fs = require("fs");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "words.json");

const ensureFile = () => {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, "[]", "utf8");
  }
};

const readWords = () => {
  ensureFile();
  return JSON.parse(fs.readFileSync(dataPath, "utf8"));
};

const writeWords = (words) => {
  ensureFile();
  fs.writeFileSync(dataPath, JSON.stringify(words, null, 2), "utf8");
};

const find = async () => readWords();

const updateOne = async (filter, update) => {
  const words = readWords();
  const index = words.findIndex((entry) => entry.word === filter.word);
  if (index === -1) {
    return { matchedCount: 0, modifiedCount: 0 };
  }

  if (update.$inc?.score != null) {
    words[index].score = (words[index].score || 0) + update.$inc.score;
  }

  writeWords(words);
  return { matchedCount: 1, modifiedCount: 1 };
};

const findOneAndDelete = async (filter) => {
  const words = readWords();
  const index = words.findIndex((entry) => entry.word === filter.word);
  if (index === -1) {
    return null;
  }

  const [deleted] = words.splice(index, 1);
  writeWords(words);
  return deleted;
};

const insertMany = async (entries) => {
  const words = readWords();
  const existing = new Set(words.map((entry) => entry.word));
  let added = 0;

  for (const entry of entries) {
    if (existing.has(entry.word)) continue;
    words.push({ word: entry.word, score: entry.score ?? 1 });
    existing.add(entry.word);
    added += 1;
  }

  writeWords(words);
  return added;
};

module.exports = {
  find,
  updateOne,
  findOneAndDelete,
  insertMany,
  dataPath,
};
