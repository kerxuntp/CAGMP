import express from 'express';
import Collection from '../models/collectiondb.mjs';
import GlobalSettings from "../models/globalSettingsdb.mjs";
import Player from "../models/playerdb.mjs";
import AutoClearConfig from "../models/autoCleardb.mjs";
import AutoClearLog from "../models/autoClearLogsdb.mjs";


const router = express.Router();

// Get all collections (shared-question model: use questionOrder for count)
router.get('/', async (req, res) => {
  try {
    const collections = await Collection.find({}).lean();
    for (const col of collections) {
      col.questionCount = Array.isArray(col.questionOrder) ? col.questionOrder.length : 0;
    }
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all collections with their questions (shared-question model)
router.get('/with-questions', async (req, res) => {
  try {
    const collections = await Collection.find({}).populate('questionOrder').lean();
    for (const col of collections) {
      col.questions = Array.isArray(col.questionOrder) ? col.questionOrder : [];
      col.questionCount = col.questions.length;
    }
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ message: "Aggregation failed", error: error.message });
  }
});

// Get the number of questions in a collection (only those in questionOrder and with collectionIds including this collection)
// Return the number of questions in the collection's questionOrder array (shared-question model)
router.get('/:id/question-count', async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id).lean();
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    const count = Array.isArray(collection.questionOrder) ? collection.questionOrder.length : 0;
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
    // Always use questionOrder for shared-question model
    const questions = Array.isArray(collection.questionOrder) ? collection.questionOrder : [];
    res.status(200).json(questions);
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
  let { name, code, questionOrder = [], gameMode = 'default', isPublic = false, isOnline = false, welcomeMessage = "", gotRewards } = req.body;
  // Ensure gotRewards is always boolean (true or false), never undefined
  gotRewards = typeof gotRewards === 'boolean' ? gotRewards : true;

    // Only check for code uniqueness if the collection is not public
    if (!isPublic && code) {
      const existing = await Collection.findOne({ code });
      if (existing) {
        return res.status(400).json({ message: "Collection code must be unique" });
      }
    }

    // If isOnline is true, must have at least 1 question
    if (isOnline && (!Array.isArray(questionOrder) || questionOrder.length === 0)) {
      return res.status(400).json({ message: "A collection must have at least 1 question to be set online." });
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
      gotRewards,
    });
    res.status(201).json(newCollection);
  } catch (error) {
    res.status(400).json({ message: "Failed to create collection", error: error.message });
  }
});

// Update an existing collection
router.patch('/:id', async (req, res) => {
  try {
  const { name, code, questionOrder, gameMode, isPublic, isOnline, welcomeMessage, gotRewards } = req.body;

    const updateData = {};
    // Fetch current collection to compare code
    const currentCollection = await Collection.findById(req.params.id);
    if (!currentCollection) {
      return res.status(404).json({ message: "Collection not found" });
    }
    if (name) updateData.name = name;
    if (questionOrder) updateData.questionOrder = questionOrder;
    if (gameMode) updateData.gameMode = gameMode;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (isOnline !== undefined) updateData.isOnline = isOnline;
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage; 
  if (gotRewards !== undefined) updateData.gotRewards = gotRewards;

    // Only update code if provided and different from current value
    if (!isPublic && typeof code === 'string' && code.trim() && code !== currentCollection.code) {
      // Duplicate code check
      const existing = await Collection.findOne({ code, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ message: "Collection code must be unique" });
      }
      updateData.code = code;
    }

    // If isOnline is true, must have at least 1 question
    if (isOnline) {
      // Use the new questionOrder if provided, else use the current one
      let questionsToCheck = questionOrder;
      if (!questionsToCheck) {
        questionsToCheck = currentCollection.questionOrder;
      }
      if (!Array.isArray(questionsToCheck) || questionsToCheck.length === 0) {
        return res.status(400).json({ message: "A collection must have at least 1 question to be set online." });
      }
    }

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
    // Check for MongoDB duplicate key error
    if (error.code === 11000 || (error.message && error.message.toLowerCase().includes('duplicate key'))) {
      return res.status(400).json({ message: "Collection code must be unique" });
    }
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

// Delete collection and associated players, auto clear configs, and logs
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

    // Delete all auto clear configs for this collection
    const autoClearConfigDeleteResult = await AutoClearConfig.deleteMany({ collectionId: collection._id });

    // Delete all auto clear logs for this collection
    const autoClearLogDeleteResult = await AutoClearLog.deleteMany({ collectionId: collection._id });

    // Delete the collection
    await Collection.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Collection, associated players, auto clear configs, and logs deleted successfully.",
      deletedPlayersCount: playerDeleteResult.deletedCount,
      deletedAutoClearConfigs: autoClearConfigDeleteResult.deletedCount,
      deletedAutoClearLogs: autoClearLogDeleteResult.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete collection and related data", error: error.message });
  }
});

export default router;