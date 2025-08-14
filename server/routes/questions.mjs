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
      filter = { collectionIds: new mongoose.Types.ObjectId(trimmedId) };
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
      collectionIds: { $in: [new mongoose.Types.ObjectId(trimmedId)] },
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
 * GET specific question by number (unambiguous)
 */
router.get('/:number', async (req, res) => {
  try {
    const { number } = req.params;

    const question = await Question.findOne({ number: parseInt(number) });

    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }

    res.status(200).json({ message: 'Record found', data: question });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// POST create question — per-collection question numbers
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

    // For each collection, create a separate question with the next available number
    const createdQuestions = [];
    for (const collectionId of validCollectionIds) {
      // Find all numbers used in this collection
      const usedNumbers = new Set(
        (await Question.find({ collectionId }).select('number')).map(q => q.number)
      );
      let nextNumber = 1;
      while (usedNumbers.has(nextNumber)) nextNumber++;

      const doc = await Question.create({
        number: nextNumber,
        collectionId,
        question,
        hint,
        funFact,
        type,
        ...(type === 'mcq' ? { options: parsedOptions } : {}),
        answer: parsedAnswer,
        ...(imgPath ? { image: imgPath } : {}),
      });

      // Add to collection's questionOrder
      await Collection.findByIdAndUpdate(collectionId, { $addToSet: { questionOrder: doc._id } }, { runValidators: true });

      createdQuestions.push(doc);
    }

    res.status(201).json({ message: 'Questions created', questions: createdQuestions });
  } catch (err) {
    res.status(500).json({ message: 'Server error while creating question', error: err.message });
  }
});

/**
 * NEW: PATCH update by number (no collectionId in URL)
 */
router.patch('/:number', upload.single('image'), async (req, res) => {
  try {
    const { number } = req.params;
    const { question, hint, funFact, type, answer, options, deleteImage, collectionIds } = req.body;

    const questionDoc = await Question.findOne({ number: parseInt(number) });
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

      const prev = questionDoc.collectionIds.map(String);
      const next = validIds.map(String);

      const removed = prev.filter(id => !next.includes(id));
      const added   = next.filter(id => !prev.includes(id));

      await Promise.all([
        ...removed.map(id => Collection.findByIdAndUpdate(id, { $pull: { questionOrder: questionDoc._id } })),
        ...added.map(id   => Collection.findByIdAndUpdate(id, { $addToSet: { questionOrder: questionDoc._id } })),
      ]);

      questionDoc.collectionIds = validIds;
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

/**
 * PATCH update question (legacy path by number + collectionId) — kept
 */
router.patch('/:number/:collectionId', upload.single('image'), async (req, res) => {
  try {
    const { number, collectionId } = req.params;
    const trimmedId = collectionId.trim();
    const { question, hint, funFact, type, answer, options, deleteImage, collectionIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(trimmedId)) {
      return res.status(400).json({ message: `Invalid collectionId: ${trimmedId}` });
    }

    const questionDoc = await Question.findOne({
      number: parseInt(number),
      collectionIds: { $in: [new mongoose.Types.ObjectId(trimmedId)] },
    });

    if (!questionDoc) {
      return res.status(404).json({ message: 'Question not found in this collection.' });
    }

    // Update collections if provided
    if (collectionIds) {
      let parsedIds = [];
      try { parsedIds = JSON.parse(collectionIds); }
      catch { parsedIds = [collectionIds]; }

      const validIds = parsedIds.map((id) => {
        const clean = id.trim();
        if (!mongoose.Types.ObjectId.isValid(clean)) {
          throw new Error(`Invalid collection ID: ${clean}`);
        }
        return new mongoose.Types.ObjectId(clean);
      });

      const removed = questionDoc.collectionIds.filter(id => !validIds.map(String).includes(id.toString()));
      const added = validIds.filter(id => !questionDoc.collectionIds.map(String).includes(id.toString()));

      await Promise.all([
        ...removed.map(id => Collection.findByIdAndUpdate(id, { $pull: { questionOrder: questionDoc._id } })),
        ...added.map(id => Collection.findByIdAndUpdate(id, { $addToSet: { questionOrder: questionDoc._id } })),
      ]);

      questionDoc.collectionIds = validIds;
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
      collectionIds: collObjId,
    });

    if (!question) {
      return res.status(404).json({ message: 'Question not found in this collection.' });
    }

    // Pull the question from this collection's questionOrder
    await Collection.findByIdAndUpdate(collObjId, { $pull: { questionOrder: question._id } }, { runValidators: true });

    // Remove the collection from the question's collectionIds
    question.collectionIds = question.collectionIds.filter(id => id.toString() !== collObjId.toString());

    if (question.collectionIds.length === 0) {
      // No collections left → delete the whole question
      await Question.deleteOne({ _id: question._id });
      return res.status(200).json({ message: 'Question deleted (no collections left).' });
    }

    await question.save();
    res.status(200).json({ message: 'Question removed from collection.' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting question', error: err.message });
  }
});

export default router;
