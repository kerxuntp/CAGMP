import express from 'express';
import Player from '../models/playerdb.mjs';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Get all players
router.get("/", async (req, res) => {
  const results = await Player.find({});
  res.status(200).send(results);
});

// Get a player by id
router.get("/:id", async (req, res) => {
  const query = { _id: new ObjectId(req.params.id) };
  const result = await Player.findOne(query);

  if (!result) res.status(404).send("Not found");
  else res.status(200).send(result);
});

// Create a new player
router.post("/", async (req, res) => {
  const { username, totalTimeInSeconds, startedAt, finishedAt, hintsUsed, questionsSkipped, wrongAnswers, collectionId } = req.body;

  if (!collectionId || !ObjectId.isValid(collectionId)) {
    return res.status(400).send("Invalid or missing collection ID");
  }

  // Count existing players in this collection to assign playerIndex
  const playerCount = await Player.countDocuments({ collectionId });

  const newPlayer = {
    username,
    totalTimeInSeconds: totalTimeInSeconds || 0,
    startedAt: startedAt || null,
    finishedAt: finishedAt || null,
    hintsUsed: hintsUsed || 0,
    questionsSkipped: questionsSkipped || 0,
    wrongAnswers: wrongAnswers || 0,
    redeemed: false,
    redeemedAt: null,
    collectionId,
    playerIndex: playerCount
  };

  const result = await Player.create(newPlayer);
  res.status(201).send(result);
});

// Update a player by id
router.patch("/:id", async (req, res) => {
  const collectionId = req.body.collectionId;

  if (!collectionId || !ObjectId.isValid(collectionId)) {
    return res.status(400).send("Invalid or missing collection ID");
  }

  const query = { _id: new ObjectId(req.params.id) };
  const updates = {
    $set: {
      username: req.body.username,
      totalTimeInSeconds: req.body.totalTimeInSeconds,
      startedAt: req.body.startedAt,
      finishedAt: req.body.finishedAt,
      hintsUsed: req.body.hintsUsed,
      questionsSkipped: req.body.questionsSkipped,
      wrongAnswers: req.body.wrongAnswers,
      redeemed: req.body.redeemed || false,
      redeemedAt: req.body.redeemed ? new Date() : null,
      collectionId
    }
  };

  const result = await Player.updateOne(query, updates);
  if (result.matchedCount === 0) res.status(404).send("Not found");
  else res.status(200).send(result);
});

// DELETE all players
router.delete("/clear", async (req, res) => {
  try {
    await Player.deleteMany({});
    res.status(200).send({ message: "All player data cleared." });
  } catch (err) {
    res.status(500).send({ error: "Failed to clear leaderboard." });
  }
});

router.post("/manual-clear/:duration", async (req, res) => {
  const { duration } = req.params;
  const { collectionId, mode } = req.body;

  let threshold = new Date();
  if (duration === "day") {
    threshold.setHours(0, 0, 0, 0);
  } else if (duration === "week") {
    threshold.setDate(threshold.getDate() - threshold.getDay());
    threshold.setHours(0, 0, 0, 0);
  } else if (duration === "month") {
    threshold.setDate(1);
    threshold.setHours(0, 0, 0, 0);
  } else {
    return res.status(400).send("Invalid duration");
  }

  const filter = {};

  if (mode === "older") {
    filter.finishedAt = { $lte: threshold };
  } else {
    filter.finishedAt = { $gte: threshold };
  }

  if (collectionId && collectionId !== "all") {
    try {
      filter.collectionId = new ObjectId(collectionId);
    } catch {
      return res.status(400).send("Invalid collectionId");
    }
  }

  try {
    const result = await Player.deleteMany(filter);
    res.status(200).send({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).send({ error: "Manual-clear failed." });
  }
});


// Check if username exists for a specific collectionId
router.get("/check-username/:username/:collectionId", async (req, res) => {
  const { username, collectionId } = req.params;

  if (!ObjectId.isValid(collectionId)) {
    return res.status(400).send("Invalid collection ID");
  }

  try {
    const existingPlayer = await Player.findOne({
      username: username.trim(),
      collectionId: new ObjectId(collectionId),
    });

    if (existingPlayer) {
      return res.status(200).json({ exists: true });
    }
    return res.status(200).json({ exists: false });
  } catch (err) {
    console.error("Error checking username:", err);
    res.status(500).send("Server error while checking username");
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const result = await Player.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).send("Not found");
    res.status(200).send({ message: "Player deleted" });
  } catch (err) {
    res.status(500).send({ error: "Failed to delete player." });
  }
});

export default router;
