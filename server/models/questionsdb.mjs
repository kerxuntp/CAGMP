// models/questionsdb.mjs
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true,              // ONE document per question number (key change)
  },
  collectionIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    }
  ],
  question: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'open'],
    required: true,
  },
  options: {
    type: [String], // Only for MCQ type
    default: undefined,
  },
  answer: {
    type: [String],            
    required: true,
  },
  hint: {
    type: String,
    required: true,
  },
  funFact: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: null,
  },
});

// ⚠️ Remove the per-collection unique index (it caused dup docs per collection).
// questionSchema.index({ number: 1, collectionIds: 1 }, { unique: true });

const Question = mongoose.model('Question', questionSchema);
export default Question;
