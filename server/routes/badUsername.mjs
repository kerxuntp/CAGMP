import express from "express";
import BadUsername from "../models/badUsernamedb.mjs";

const router = express.Router();

// All bad usernames
router.get("/", async (req, res) => {
  try {
    let badUsernameDoc = await BadUsername.findOne();
    if (!badUsernameDoc) {
      badUsernameDoc = new BadUsername({ usernames: [] });
      await badUsernameDoc.save();
    }
    res.status(200).json(badUsernameDoc.usernames);
  } catch (error) {
    console.error("Error fetching bad usernames:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add new bad username
router.post("/", async (req, res) => {
  try {
    const { username } = req.body;
    
    let badUsernameDoc = await BadUsername.findOne();
    if (!badUsernameDoc) {
      badUsernameDoc = new BadUsername({ usernames: [] });
    }

    badUsernameDoc.usernames.push(username.trim().toLowerCase());
    await badUsernameDoc.save();
    
    res.status(201).json({ message: "Username added to bad list" });
  } catch (error) {
    console.error("Error adding bad username:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update entire usernames array
router.patch("/", async (req, res) => {
  try {
    const { usernames } = req.body;
    
    if (!Array.isArray(usernames)) {
      return res.status(400).json({ message: "Usernames must be an array" });
    }

    let badUsernameDoc = await BadUsername.findOne();
    if (!badUsernameDoc) {
      badUsernameDoc = new BadUsername({ usernames: [] });
    }

    // Clean and normalise usernames
    badUsernameDoc.usernames = usernames.map(username => username.trim().toLowerCase());
    await badUsernameDoc.save();
    
    res.status(200).json({ message: "Usernames list updated successfully" });
  } catch (error) {
    console.error("Error updating bad usernames:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove bad username
router.delete("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    
    let badUsernameDoc = await BadUsername.findOne();
    if (!badUsernameDoc) {
      return res.status(404).json({ message: "Username not found" });
    }

    badUsernameDoc.usernames = badUsernameDoc.usernames.filter(u => u !== username.toLowerCase());
    await badUsernameDoc.save();
    
    res.status(200).json({ message: "Username removed from bad list" });
  } catch (error) {
    console.error("Error removing bad username:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// Check if username is bad
router.get("/check/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.toLowerCase();
    
    let badUsernameDoc = await BadUsername.findOne();
    if (!badUsernameDoc) {
      return res.status(200).json({ isBad: false });
    }
    
    // Check for partial matches (contains prohibited words)
    const isBad = badUsernameDoc.usernames.some(prohibitedWord => 
      cleanUsername.includes(prohibitedWord.toLowerCase())
    );
    
    res.status(200).json({ isBad });
  } catch (error) {
    console.error("Error checking bad username:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;