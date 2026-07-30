require("dotenv").config();

const mongoose = require("mongoose");
const Word = require("./models/wordModel");

const mongoUri =
  process.env.MONGODB_URI || process.env.REACT_APP_MONGODB_LOGIN_URL;

if (!mongoUri) {
  console.error("Missing MONGODB_URI in backend/.env");
  process.exit(1);
}

const words = [
  "Accommodation",
  "Advertisement",
  "Analysis",
  "Appointment",
  "Assessment",
  "Bureaucracy",
  "Category",
  "Colleague",
  "Committee",
  "Comparison",
  "Competition",
  "Compromise",
  "Concentration",
  "Conclusion",
  "Conference",
  "Consequence",
  "Consistency",
  "Contribution",
  "Coordination",
  "Criticism",
  "Decision",
  "Definition",
  "Description",
  "Development",
  "Discipline",
  "Discrimination",
  "Distribution",
  "Economics",
  "Efficiency",
  "Environment",
  "Equipment",
  "Establishment",
  "Evaluation",
  "Examination",
  "Experience",
  "Experiment",
  "Explanation",
  "Foundation",
  "Frequency",
  "Government",
  "Implementation",
  "Independence",
  "Information",
  "Initiative",
  "Institution",
  "Instruction",
  "Interaction",
  "Interpretation",
  "Investment",
  "Investigation",
  "Management",
  "Measurement",
  "Membership",
  "Motivation",
  "Observation",
  "Opportunity",
  "Organization",
  "Partnership",
  "Performance",
  "Permission",
  "Perspective",
  "Population",
  "Possession",
  "Preference",
  "Preparation",
  "Presentation",
  "Principle",
  "Probability",
  "Procedure",
  "Proportion",
  "Qualification",
  "Recommendation",
  "Recognition",
  "Recreation",
  "Reflection",
  "Regulation",
  "Relationship",
  "Representation",
  "Requirement",
  "Research",
  "Resolution",
  "Resource",
  "Responsibility",
  "Restriction",
  "Revision",
  "Satisfaction",
  "Scholarship",
  "Selection",
  "Significance",
  "Similarity",
  "Solution",
  "Specification",
  "Strategy",
  "Structure",
  "Suggestion",
  "Supervision",
  "Technology",
  "Transition",
  "Translation",
  "Understanding",
  "Variation",
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
  "on the other hand",
];

const seed = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    console.log("Database:", mongoose.connection.name);

    let added = 0;
    for (const word of words) {
      const result = await Word.updateOne(
        { word },
        { $setOnInsert: { word, score: 1 } },
        { upsert: true },
      );
      if (result.upsertedCount) added += 1;
    }

    const total = await Word.countDocuments();
    console.log(`Seeded ${added} new words (${words.length - added} already existed)`);
    console.log(`Total words in database: ${total}`);
  } catch (err) {
    console.error("Error seeding words:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seed();
