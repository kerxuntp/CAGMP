// models/questionsdb.mjs
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    required: true,
  },
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


questionSchema.index({ number: 1, collectionId: 1 }, { unique: true });

const Question = mongoose.model('Question', questionSchema);
export default Question;
