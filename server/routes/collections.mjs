import express from 'express';
import Collection from '../models/collectiondb.mjs';
import Question from "../models/questionsdb.mjs";
import GlobalSettings from "../models/globalSettingsdb.mjs";
import Player from "../models/playerdb.mjs";


const router = express.Router();

// Get all collections
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({}).lean();
    for (const col of collections) {
      col.questionCount = await Question.countDocuments({ collectionId: col._id });
    }
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all collections with their questions
router.get('/with-questions', async (req, res) => {
  try {
    const collections = await Collection.aggregate([
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "collectionId",
          as: "questions"
        }
      }
    ]);
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: "Aggregation failed", error: error.message });
  }
});

// Get the number of questions in a collection (only those in questionOrder and with collectionIds including this collection)
router.get('/:id/question-count', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id).lean();
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    let count = 0;
    if (collection.questionOrder?.length) {
      count = await Question.countDocuments({
        _id: { $in: collection.questionOrder },
        collectionIds: collection._id
      });
    }
    res.status(200).json({ questionCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch question count', error: error.message });
  }
});

// Get public collection
router.get('/public', async (req, res) => {
  try {
    const publicCollection = await Collection.findOne({ isPublic: true, isOnline: true });
    if (!publicCollection) {
      return res.status(404).json({ message: "No public collection is currently available" });
    }
    res.status(200).json(publicCollection);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch public collection", error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }
    res.status(200).json(collection);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch collection", error: error.message });
  }
});

router.get('/:id/questions', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id).populate('questionOrder');

    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }

    let questions;
    if (collection.questionOrder?.length) {
      questions = collection.questionOrder;
    } else {
      questions = await Question.find({ collectionId: collection._id });
    }

    res.status(200).json({
      collection: collection.name,
      code: collection.code,
      questions
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch questions', error: error.message });
  }
});


// Get collection by code (used in EnterCollCode)
router.get('/code/:code', async (req, res) => {
  try {
    const collection = await Collection.findOne({
      code: new RegExp(`^${req.params.code.trim()}$`, "i"),
      isOnline: true
    });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found or is offline" });
    }

    res.status(200).json(collection);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch collection", error: error.message });
  }
});

// Get effective settings
router.get('/:id/effective-settings', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    let globalSettings = await GlobalSettings.findOne();
    if (!globalSettings) {
      globalSettings = await GlobalSettings.create({
        defaultGameMode: 'default',
        defaultWrongAnswerPenalty: 300,
        defaultHintPenalty: 120,
        defaultSkipPenalty: 600
      });
    }

    const effectiveSettings = collection.useGlobalSettings !== false
      ? {
          gameMode: globalSettings.defaultGameMode,
          wrongAnswerPenalty: globalSettings.defaultWrongAnswerPenalty,
          hintPenalty: globalSettings.defaultHintPenalty,
          skipPenalty: globalSettings.defaultSkipPenalty,
          usingGlobalSettings: true
        }
      : {
          gameMode: collection.customSettings?.gameMode || globalSettings.defaultGameMode,
          wrongAnswerPenalty: collection.customSettings?.wrongAnswerPenalty || globalSettings.defaultWrongAnswerPenalty,
          hintPenalty: collection.customSettings?.hintPenalty || globalSettings.defaultHintPenalty,
          skipPenalty: collection.customSettings?.skipPenalty || globalSettings.defaultSkipPenalty,
          usingGlobalSettings: false
        };

    res.status(200).json(effectiveSettings);
  } catch (error) {
    res.status(500).json({ message: "Failed to get effective settings", error: error.message });
  }
});


// Create a new collection
router.post('/', async (req, res) => {
  try {
    const { name, code, questionOrder = [], gameMode = 'default', isPublic = false, isOnline = true, welcomeMessage = "" } = req.body;

    // Only check for code uniqueness if the collection is not public
    if (!isPublic && code) {
      const existing = await Collection.findOne({ code });
      if (existing) {
        return res.status(400).json({ message: "Collection code must be unique" });
      }
    }

    // Validate that only one public collection is online
    if (isPublic && isOnline) {
      const onlinePublic = await Collection.findOne({ isPublic: true, isOnline: true });
      if (onlinePublic) {
        return res.status(400).json({ message: "Another public collection is already online." });
      }
    }

    // Create the collection, omitting code if public
    const newCollection = await Collection.create({
      name,
      code: isPublic ? undefined : code,
      questionOrder,
      gameMode,
      isPublic,
      isOnline,
      welcomeMessage,
    });
    res.status(201).json(newCollection);
  } catch (error) {
    res.status(400).json({ message: "Failed to create collection", error: error.message });
  }
});

// Update an existing collection
router.patch('/:id', async (req, res) => {
  try {
    const { name, code, questionOrder, gameMode, isPublic, isOnline, welcomeMessage } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (questionOrder) updateData.questionOrder = questionOrder;
    if (gameMode) updateData.gameMode = gameMode;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isOnline !== undefined) updateData.isOnline = isOnline;
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage; 


    if (isPublic && isOnline) {
      const onlinePublic = await Collection.findOne({
        isPublic: true,
        isOnline: true,
        _id: { $ne: req.params.id },
      });
      if (onlinePublic) {
        return res.status(400).json({ message: "Another public collection is already online." });
      }
    }

    const updated = await Collection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Failed to update collection", error: error.message });
  }
});

// Update question order
router.patch('/:id/question-order', async (req, res) => {
  try {
    const { questionOrder } = req.body;

    if (!Array.isArray(questionOrder)) {
      return res.status(400).json({ message: "questionOrder must be an array" });
    }

    const updated = await Collection.findByIdAndUpdate(
      req.params.id,
      { questionOrder },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.status(200).json({ message: "Question order updated successfully", collection: updated });
  } catch (error) {
    res.status(400).json({ message: "Failed to update question order", error: error.message });
  }
});

// Update game settings
router.patch('/:id/game-settings', async (req, res) => {
  try {
    const { useGlobalSettings, customSettings } = req.body;

    if (customSettings) {
      const validModes = ['default', 'random', 'rotating', 'rotating-reverse'];
      if (customSettings.gameMode && !validModes.includes(customSettings.gameMode)) {
        return res.status(400).json({ message: "Invalid game mode" });
      }
      if (customSettings.wrongAnswerPenalty < 0 || customSettings.hintPenalty < 0 || customSettings.skipPenalty < 0) {
        return res.status(400).json({ message: "Penalties must be positive numbers" });
      }
    }

    const updateData = {
      useGlobalSettings: useGlobalSettings !== undefined ? useGlobalSettings : true,
      customSettings: useGlobalSettings ? null : customSettings
    };

    const updated = await Collection.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.status(200).json({ message: "Game settings updated successfully", collection: updated });
  } catch (error) {
    res.status(400).json({ message: "Failed to update game settings", error: error.message });
  }
});

// Delete collection and associated players
router.delete("/:id", async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.isPublic && collection.isOnline) {
      return res.status(403).json({
        message: "Cannot delete an online public collection. Set it offline first.",
      });
    }

    // Delete all players associated with this collection
    const playerDeleteResult = await Player.deleteMany({ collectionId: collection._id });

    // Delete the collection
    await Collection.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Collection and associated players deleted successfully.",
      deletedPlayersCount: playerDeleteResult.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete collection and players", error: error.message });
  }
});

export default router;