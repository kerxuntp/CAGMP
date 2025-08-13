import express from 'express';
import Question from '../models/questionsdb.mjs';
import Collection from '../models/collectiondb.mjs';
import mongoose from 'mongoose';
import multer from 'multer';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'));
  },
});

const router = express.Router();

// Get all questions (optionally filtered by collectionId)
router.get('/', async (req, res) => {
  try {
    const { collectionId } = req.query;
    if (collectionId && !mongoose.Types.ObjectId.isValid(collectionId)) {
      return res.status(400).json({ message: 'Invalid collectionId' });
    }
    const filter = collectionId ? { collectionId } : {};
    const questions = await Question.find(filter);
    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific question by number (scoped by collectionId)
router.get('/:number/:collectionId', async (req, res) => {
  try {
    const number = parseInt(req.params.number);
    const { collectionId } = req.params;
    if (isNaN(number) || !mongoose.Types.ObjectId.isValid(collectionId)) {
      return res.status(400).json({ message: 'Invalid number or collectionId' });
    }
    const result = await Question.findOne({ number, collectionId });
    if (!result) {
      return res.status(404).json({ message: 'Question not found in this collection.' });
    }
    res.status(200).json({ message: 'Record found', data: result });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new question
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { number, collectionId, question, hint, answer, funFact, type, options } = req.body;

    if (!mongoose.Types.ObjectId.isValid(collectionId)) {
      return res.status(400).json({ message: 'Invalid collectionId' });
    }

    const existing = await Question.findOne({ number, collectionId });
    if (existing) {
      return res.status(400).json({ message: `Question ${number} already exists in this collection.` });
    }

    let parsedAnswers = [];
    let parsedOptions = [];

    try {
      parsedAnswers = Array.isArray(answer) ? answer : JSON.parse(answer);
    } catch {
      return res.status(400).json({ message: 'Invalid answer format' });
    }

    if ((type === 'mcq' || type === 'multiple-choice') && options) {
      try {
        parsedOptions = Array.isArray(options) ? options : JSON.parse(options);
      } catch {
        return res.status(400).json({ message: 'Invalid options format' });
      }
    }

    const newQuestion = {
      number,
      collectionId,
      question,
      hint,
      answer: parsedAnswers,
      funFact,
      type,
      ...(parsedOptions.length ? { options: parsedOptions } : {}),
      ...(req.file ? { image: req.file.path } : {}),
    };

    const result = await Question.create(newQuestion);
    await Collection.findByIdAndUpdate(collectionId, { $addToSet: { questionOrder: result._id } }, { runValidators: true });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Server error while creating question', error: error.message });
  }
});

// Update question
router.patch('/:number/:collectionId', upload.single('image'), async (req, res) => {
  try {
    const number = parseInt(req.params.number);
    const { collectionId } = req.params;
    const { newCollectionId } = req.body;

    if (isNaN(number) || !mongoose.Types.ObjectId.isValid(collectionId)) {
      return res.status(400).json({ message: 'Invalid number or collectionId' });
    }

    const questionDoc = await Question.findOne({ number, collectionId });
    if (!questionDoc) {
      return res.status(404).json({ message: 'Question not found in this collection.' });
    }

    if (newCollectionId && newCollectionId !== collectionId) {
      if (!mongoose.Types.ObjectId.isValid(newCollectionId)) {
        return res.status(400).json({ message: 'Invalid newCollectionId' });
      }

      await Collection.findByIdAndUpdate(collectionId, { $pull: { questionOrder: questionDoc._id } }, { runValidators: true });
      await Collection.findByIdAndUpdate(newCollectionId, { $addToSet: { questionOrder: questionDoc._id } }, { runValidators: true });
      questionDoc.collectionId = newCollectionId;
    }

    if (req.body.question) questionDoc.question = req.body.question.trim();
    if (req.body.hint) questionDoc.hint = req.body.hint.trim();
    if (req.body.funFact) questionDoc.funFact = req.body.funFact.trim();
    if (req.body.type) questionDoc.type = req.body.type;

    if (req.body.answer) {
      try {
        questionDoc.answer = JSON.parse(req.body.answer);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON in "answer"' });
      }
    }

    if (req.body.options) {
      try {
        questionDoc.options = JSON.parse(req.body.options);
      } catch {
        return res.status(400).json({ message: 'Invalid JSON in "options"' });
      }
    }

    if (req.file) {
      questionDoc.image = req.file.path;
    } else if (req.body.deleteImage === 'true') {
      questionDoc.image = null;
    }

    await questionDoc.save();
    res.status(200).json({ message: 'Question updated successfully.' });
  } catch (err) {
    console.error('Error in PATCH /:number/:collectionId:', err);
    res.status(500).json({ message: 'Error updating question', error: err.message });
  }
});

// Delete question
router.delete('/:number/:collectionId', async (req, res) => {
  try {
    const number = parseInt(req.params.number);
    const { collectionId } = req.params;

    if (isNaN(number) || !mongoose.Types.ObjectId.isValid(collectionId)) {
      return res.status(400).json({ message: 'Invalid number or collectionId' });
    }

    const question = await Question.findOne({ number, collectionId });
    if (!question) {
      return res.status(404).json({ message: 'Question not found in this collection.' });
    }

    await Collection.findByIdAndUpdate(collectionId, { $pull: { questionOrder: question._id } }, { runValidators: true });
    await Question.deleteOne({ _id: question._id });

    res.status(200).json({ message: 'Question deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting question', error: error.message });
  }
});

export default router;
