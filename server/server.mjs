import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import players from './routes/players.mjs';
import admins from './routes/admins.mjs';
import questions from './routes/questions.mjs';
import collections from './routes/collections.mjs';
import photoUpload from './routes/photoUpload.mjs';
import autoClearRoutes from './routes/autoClear.mjs'; 
import AutoClearConfig from './models/autoCleardb.mjs'; 
import Player from './models/playerdb.mjs'; 
import BadUsername from './routes/badUsername.mjs';
import globalSettingsRoutes from "./routes/globalSettings.mjs";
import landingCustomisationRoutes from './routes/landingCustomisation.mjs';
import AutoClearLog from './models/autoClearLogsdb.mjs';

dotenv.config();

const PORT = process.env.PORT || 2000;
const DB_CONNECT = process.env.DB_CONNECT;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/players", players);
app.use("/admins", admins);
app.use("/questions", questions);
app.use("/collections", collections);
app.use("/upload-photo", photoUpload);
app.use("/auto-clear-config", autoClearRoutes);
app.use("/bad-usernames", BadUsername);
app.use("/global-settings", globalSettingsRoutes);
app.use("/landing-customisation", landingCustomisationRoutes);
app.use('/uploads', express.static('uploads'));


// MongoDB connection
mongoose.set('strictQuery', true);
mongoose.connect(DB_CONNECT)
  .then(() => {
    console.log('MongoDB connected...');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Test route
app.get('/', (req, res) => {
  res.status(200).send('Hello World!');
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port: http://localhost:${PORT}`);
});


setInterval(async () => {
  try {
    const configs = await AutoClearConfig.find();
    if (!configs || configs.length === 0) return;

    const now = new Date();
    const nowTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

    for (const config of configs) {
        const last = config.lastClearedAt || new Date(0);
        let due = false;

        // For custom interval, ignore clearTime and run based on elapsed time
        if (config.interval === "custom") {
          if (config.customIntervalValue && config.customIntervalUnit) {
            const msMap = {
              minute: 60 * 1000,
              hour: 60 * 60 * 1000,
              day: 24 * 60 * 60 * 1000,
            };
            const intervalMs = config.customIntervalValue * msMap[config.customIntervalUnit];
            due = now - last >= intervalMs;
          }
        } else {
          // For non-custom intervals, only run if current time matches clearTime
          if (config.clearTime && nowTime !== config.clearTime) continue;
          if (config.interval === "day") {
            due = now - last >= 24 * 60 * 60 * 1000; // 1 day
          } else if (config.interval === "week") {
            due = now - last >= 7 * 24 * 60 * 60 * 1000;
          } else if (config.interval === "month") {
            due = now - last >= 30 * 24 * 60 * 60 * 1000;
          }
        }

        if (!due) continue;

      let filter = { collectionId: config.collectionId };
      if (config.target === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        filter.finishedAt = { $gte: start, $lte: end };
      } else if (config.target === "week") {
        const start = new Date();
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        filter.finishedAt = { $gte: start, $lte: end };
      } else if (config.target === "month") {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        filter.finishedAt = { $gte: start, $lte: end };
      } else if (config.target === "custom") {
        if (!config.startDate || !config.endDate) continue;
        const start = new Date(config.startDate);
        const end = new Date(config.endDate);
        end.setHours(23, 59, 59, 999);
        if (now < start) continue;
        filter.finishedAt = { $gte: start, $lte: end };
        if (now > end) {
          config.target = "all";
          await config.save();
        }
      } else if (config.target === "all") {
        filter.finishedAt = { $lte: now };
      }

      const result = await Player.deleteMany(filter);
      config.lastClearedAt = now;
      await config.save();

      // Log the clear action
      await AutoClearLog.create({
        collectionId: config.collectionId,
        clearedAt: now,
        interval: config.interval,
        target: config.target,
        range: config.target === "custom" ? { start: config.startDate, end: config.endDate } : undefined,
        clearedCount: result.deletedCount,
        clearedIds: result.deletedIds || [],
      });

      // Delete logs beyond the 30 most recent for this collection
      const logs = await AutoClearLog.find({ collectionId: config.collectionId })
        .sort({ clearedAt: -1 }) // Sort by newest first
        .skip(30); // Skip the 30 most recent logs
      if (logs.length > 0) {
        await AutoClearLog.deleteMany({
          collectionId: config.collectionId,
          _id: { $in: logs.map(log => log._id) },
        });
      }

      console.log(
        `[AUTO CLEAR] Collection ${config.collectionId}: Deleted ${result.deletedCount} players (Target: ${config.target})`
      );
    }
  } catch (err) {
    console.error("[AUTO CLEAR ERROR]", err);
  }
}, 10 * 1000); // Every 10 seconds