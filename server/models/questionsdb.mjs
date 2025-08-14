// models/questionsdb.mjs
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  // Removed number field; question order is managed per collection
  // Removed collectionId: questions are now shared and referenced by collections
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


// No compound index needed; questions are shared and referenced by collections

const Question = mongoose.model('Question', questionSchema);
export default Question;
