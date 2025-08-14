import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import Question from '../models/questionsdb.mjs';
import Collection from '../models/collectiondb.mjs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * GET all questions or questions for a collection
 * /questions?collectionId=xxx
 */
router.get('/', async (req, res) => {
  try {
    const { collectionId } = req.query;
    if (collectionId) {
      const trimmedId = collectionId.trim();
      if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
        return res.status(400).json({ message: `Invalid collectionId: ${trimmedId}` });
      }
      const collection = await Collection.findById(trimmedId).populate('questionOrder');
      if (!collection) {
        return res.status(404).json({ message: 'Collection not found.' });
      }
      return res.status(200).json(collection.questionOrder);
    }
    // No collectionId: return all questions
    const questions = await Question.find();
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


/**
 * GET specific question by _id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid question id: ${id}` });
    }
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }
    res.status(200).json({ message: 'Record found', data: question });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// POST create question — shared-question model
router.post('/', upload.single('image'), async (req, res) => {
  try {
    let { question, hint, answer, funFact, type, options } = req.body;
    let collectionIds = req.body.collectionIds;

    if (!question || !hint || !funFact || !type) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!collectionIds || collectionIds.length === 0) {
      return res.status(400).json({ message: 'At least one collection must be selected.' });
    }

    // Normalize collectionIds
    if (!Array.isArray(collectionIds)) {
      try { collectionIds = JSON.parse(collectionIds); }
      catch { collectionIds = [collectionIds]; }
    }

    const validCollectionIds = collectionIds.map((id) => {
      const cleanId = String(id).trim();
      if (!mongoose.Types.ObjectId.isValid(cleanId)) {
        throw new Error(`Invalid collection ID: ${cleanId}`);
      }
      return new mongoose.Types.ObjectId(cleanId);
    });

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

    // Create a single question document
    const doc = await Question.create({
      question,
      hint,
      funFact,
      type,
      ...(type === 'mcq' ? { options: parsedOptions } : {}),
      answer: parsedAnswer,
      ...(imgPath ? { image: imgPath } : {}),
    });

    // Add to each collection's questionOrder
    await Promise.all(validCollectionIds.map(collectionId =>
      Collection.findByIdAndUpdate(collectionId, { $addToSet: { questionOrder: doc._id } }, { runValidators: true })
    ));

    res.status(201).json({ message: 'Question created and added to collections', question: doc });
  } catch (err) {
    res.status(500).json({ message: 'Server error while creating question', error: err.message });
  }
});


/**
 * PATCH update question by _id
 */
router.patch('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { question, hint, funFact, type, answer, options, deleteImage, collectionIds } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid question id: ${id}` });
    }
    const questionDoc = await Question.findById(id);
    if (!questionDoc) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    // Optional: update collections
    if (collectionIds !== undefined) {
      let parsedIds = collectionIds;
      if (!Array.isArray(parsedIds)) {
        try { parsedIds = JSON.parse(parsedIds); }
        catch { parsedIds = [collectionIds]; }
      }
      const validIds = parsedIds.map((id) => {
        const clean = String(id).trim();
        if (!mongoose.Types.ObjectId.isValid(clean)) {
          throw new Error(`Invalid collection ID: ${clean}`);
        }
        return new mongoose.Types.ObjectId(clean);
      });
      // Remove from all collections first
      await Collection.updateMany({}, { $pull: { questionOrder: questionDoc._id } });
      // Add to selected collections
      await Promise.all(validIds.map(id => Collection.findByIdAndUpdate(id, { $addToSet: { questionOrder: questionDoc._id } }))); 
      // Do NOT update any collectionIds field on the question itself (shared-question model)
    }

    if (question) questionDoc.question = question.trim();
    if (hint)     questionDoc.hint     = hint.trim();
    if (funFact)  questionDoc.funFact  = funFact.trim();
    if (type)     questionDoc.type     = type;

    if (answer !== undefined) {
      try {
        const a = (typeof answer === 'string') ? JSON.parse(answer) : answer;
        if (!Array.isArray(a) || a.length === 0) {
          return res.status(400).json({ message: 'Answer cannot be empty.' });
        }
        questionDoc.answer = a;
      } catch {
        return res.status(400).json({ message: 'Invalid JSON in "answer"' });
      }
    }

    if (options !== undefined) {
      try {
        const o = (typeof options === 'string') ? JSON.parse(options) : options;
        if ((questionDoc.type === 'mcq' || type === 'mcq') && (!Array.isArray(o) || o.length < 2)) {
          return res.status(400).json({ message: 'MCQ requires at least 2 options.' });
        }
        questionDoc.options = (questionDoc.type === 'mcq' || type === 'mcq') ? o : undefined;
      } catch {
        return res.status(400).json({ message: 'Invalid JSON in "options"' });
      }
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


// Legacy PATCH by number/collectionId removed for shared-question model


/**
 * DELETE question by _id
 * - removes the question from all collections' questionOrder
 * - deletes the question document
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: `Invalid question id: ${id}` });
    }
    // Remove from all collections
    await Collection.updateMany({}, { $pull: { questionOrder: new mongoose.Types.ObjectId(id) } });
    // Delete the question
    await Question.findByIdAndDelete(id);
    res.status(200).json({ message: 'Question deleted from all collections.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting question', error: err.message });
  }
});

export default router;
