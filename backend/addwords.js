const mongoose = require('mongoose');
const Word = require('./models/wordModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/taskStuff', );

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  addWords();
});

// Array of words to add
const words = [
  "increase",
  "decrease",
  "rise",
  "fall",
  "fluctuate",
  "peak",
  "drop",
  "climb",
  "decline",
  "remain steady",
  "remain constant",
  "stabilize",
  "surge",
  "plummet",
  "grow",
  "shrink",
  "level off",
  "plateau",
  "double",
  "halve",
  "upward trend",
  "downward trend",
  "dramatically",
  "significantly",
  "slightly",
  "gradually",
  "sharply",
  "steadily",
  "rapidly",
  "moderately",
  "marginally",
  "substantially",
  "consistently",
  "approximately",
  "roughly",
  "around",
  "nearly",
  "comparatively",
  "proportion",
  "percentage",
  "majority",
  "minority",
  "over the period",
  "time span",
  "highest",
  "lowest",
  "respectively",
  "in contrast",
  "similarly",
  "on the other hand"
]





const addWords = async () => {
  try {
    for (const word of words) {
      const newWord = new Word({ word });
      await newWord.save();
    }
    console.log('Words added successfully');
    mongoose.connection.close();
  } catch (err) {
    console.error('Error adding words:', err);
    mongoose.connection.close();
  }
};
