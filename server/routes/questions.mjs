import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import Question from '../models/questionsdb.mjs';
import Collection from '../models/collectiondb.mjs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * GET all questions
 * Optional: /questions?collectionId=xxx
 */
router.get('/', async (req, res) => {
  try {
    const { collectionId } = req.query;
    let filter = {};

    if (collectionId) {
      const trimmedId = collectionId.trim();
      if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
        return res.status(400).json({ message: `Invalid collectionId: ${trimmedId}` });
      }
      filter = { collectionId: new mongoose.Types.ObjectId(trimmedId) };
    }

    const questions = await Question.find(filter);
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * GET specific question by number and collectionId
 */
router.get('/:number/:collectionId', async (req, res) => {
  try {
    const { number, collectionId } = req.params;
    const trimmedId = collectionId.trim();

    if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
      return res.status(400).json({ message: `Invalid collectionId: ${trimmedId}` });
    }

    const question = await Question.findOne({
      number: parseInt(number),
      collectionId: new mongoose.Types.ObjectId(trimmedId),
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found in this collection.' });
    }

    res.status(200).json({ message: 'Record found', data: question });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



/**
 * POST create question — create a new doc per collection/number
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Remove any number field from req.body to prevent accidental use
    if (req.body.number !== undefined) {
      delete req.body.number;
    }
    const { question, hint, answer, funFact, type, options, collectionIds, collectionId } = req.body;
    // Accept either collectionIds (array) or collectionId (string)
    let colId = collectionId || (Array.isArray(collectionIds) ? collectionIds[0] : collectionIds);
    if (!question || !hint || !funFact || !type || !colId) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (!mongoose.Types.ObjectId.isValid(colId)) {
      return res.status(400).json({ message: `Invalid collectionId: ${colId}` });
    }

    // Find all numbers in this collection
    const questions = await Question.find({ collectionId: colId }).select('number');
    const usedNumbers = new Set(questions.map(q => q.number));
    // Find the lowest available number (starting from 1)
    let nextNumber = 1;
    while (usedNumbers.has(nextNumber)) {
      nextNumber++;
    }

    // Normalize options & answer
    let parsedOptions = options;
    if (typeof parsedOptions === 'string') {
      try { parsedOptions = JSON.parse(parsedOptions); } catch { parsedOptions = [parsedOptions]; }
    }
    if (type === 'mcq' && (!Array.isArray(parsedOptions) || parsedOptions.length < 2)) {
      return res.status(400).json({ message: 'MCQ requires at least 2 options.' });
    }

    let parsedAnswer = answer;
    if (typeof parsedAnswer === 'string') {
      try { parsedAnswer = JSON.parse(parsedAnswer); } catch { parsedAnswer = [parsedAnswer]; }
    }
    if (!Array.isArray(parsedAnswer) || parsedAnswer.length === 0) {
      return res.status(400).json({ message: 'Answer is required.' });
    }

    const imgPath = req.file ? req.file.path : undefined;

    // Always use nextNumber, ignore any provided number from frontend
    const doc = await Question.create({
      number: nextNumber,
      collectionId: new mongoose.Types.ObjectId(colId),
      question,
      hint,
      funFact,
      type,
      ...(type === 'mcq' ? { options: parsedOptions } : {}),
      answer: parsedAnswer,
      ...(imgPath ? { image: imgPath } : {}),
    });

    // Keep questionOrder in the collection synced
    await Collection.findByIdAndUpdate(colId, { $addToSet: { questionOrder: doc._id } }, { runValidators: true });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error while creating question', error: err.message });
  }
});



/**
 * PATCH update question (legacy path by number + collectionId) — kept
 */
// PATCH update question by number and collectionId
router.patch('/:number/:collectionId', upload.single('image'), async (req, res) => {
  try {
    const { number, collectionId } = req.params;
    const trimmedId = collectionId.trim();
    const { question, hint, funFact, type, answer, options, deleteImage } = req.body;

    if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
      return res.status(400).json({ message: `Invalid collectionId: ${trimmedId}` });
    }

    const questionDoc = await Question.findOne({
      number: parseInt(number),
      collectionId: new mongoose.Types.ObjectId(trimmedId),
    });

    if (!questionDoc) {
      return res.status(404).json({ message: 'Question not found in this collection.' });
    }

    if (question) questionDoc.question = question.trim();
    if (hint) questionDoc.hint = hint.trim();
    if (funFact) questionDoc.funFact = funFact.trim();
    if (type) questionDoc.type = type;
    if (answer) {
      try { questionDoc.answer = JSON.parse(answer); }
      catch { return res.status(400).json({ message: 'Invalid JSON in "answer"' }); }
    }
    if (options) {
      try { questionDoc.options = JSON.parse(options); }
      catch { return res.status(400).json({ message: 'Invalid JSON in "options"' }); }
    }

    if (req.file) {
      questionDoc.image = req.file.path;
    } else if (deleteImage === 'true') {
      questionDoc.image = null;
    }

    await questionDoc.save();
    res.status(200).json({ message: 'Question updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating question', error: err.message });
  }
});

/**
 * DELETE question from one collection
 * - removes mapping from that collection
 * - deletes the doc only if no collections remain
 */
// DELETE question by number and collectionId
router.delete('/:number/:collectionId', async (req, res) => {
  try {
    const { number, collectionId } = req.params;
    const trimmedId = collectionId.trim();

    if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
      return res.status(400).json({ message: `Invalid collectionId: ${trimmedId}` });
    }
    const collObjId = new mongoose.Types.ObjectId(trimmedId);

    const question = await Question.findOne({
      number: parseInt(number),
      collectionId: collObjId,
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found in this collection.' });
    }

    // Pull the question from this collection's questionOrder
    await Collection.findByIdAndUpdate(collObjId, { $pull: { questionOrder: question._id } }, { runValidators: true });

    // Delete the question
    await Question.deleteOne({ _id: question._id });
    return res.status(200).json({ message: 'Question deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting question', error: err.message });
  }
});

export default router;
