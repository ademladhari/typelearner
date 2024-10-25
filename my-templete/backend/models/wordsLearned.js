// models/WordLearned.js
const mongoose = require('mongoose');

const wordLearnedSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('WordLearned', wordLearnedSchema);
