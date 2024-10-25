const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  word: {
    type: String,
    unique: true,
    required: true
  },
  score: {
    type: Number,
    default: 1 // Initial score for all words
  }
});

const Word = mongoose.model('Word', wordSchema);
module.exports = Word;
