import express from 'express';
import AutoClearConfig from '../models/autoCleardb.mjs';
import AutoClearLog from '../models/autoClearLogsdb.mjs'; 

const router = express.Router();

// Get config for a collection
router.get('/:collectionId', async (req, res) => {
  try {
    const config = await AutoClearConfig.findOne({ collectionId: req.params.collectionId });
    if (!config) return res.status(404).send("No config found");
    res.status(200).json(config);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch config', error: err.message });
  }
});

// Add configs for a collection
router.post('/:collectionId', async (req, res) => {
  const { collectionId } = req.params;
  const { interval, target, clearTime, startDate, endDate, customIntervalValue, customIntervalUnit } = req.body;

  // Validation
  const validIntervals = ['day', 'week', 'month', 'custom'];
  const validTargets = ['today', 'week', 'month', 'custom', 'all'];
  if (!validIntervals.includes(interval)) {
    return res.status(400).send('Invalid interval');
  }
  if (!validTargets.includes(target)) {
    return res.status(400).send('Invalid target');
  }

  // For day/week/month, target must match interval
  if (interval === 'day' && target !== 'today') {
    return res.status(400).send('For daily clears, target must be "today"');
  }
  if (interval === 'week' && target !== 'week') {
    return res.status(400).send('For weekly clears, target must be "week"');
  }
  if (interval === 'month' && target !== 'month') {
    return res.status(400).send('For monthly clears, target must be "month"');
  }

  // For custom interval, allow any target
  if (interval === 'custom') {
    if (!customIntervalValue || !customIntervalUnit) {
      return res.status(400).send('Custom interval value and unit required');
    }
    if (target === 'custom' && (!startDate || !endDate)) {
      return res.status(400).send('Start and end dates required for custom target');
    }
  }

  // Build update object
  const update = {
    interval,
    target,
    clearTime: clearTime || '00:00',
    startDate: target === 'custom' ? startDate : null,
    endDate: target === 'custom' ? endDate : null,
    customIntervalValue: interval === 'custom' ? Number(customIntervalValue) : null,
    customIntervalUnit: interval === 'custom' ? customIntervalUnit : null,
  };

  try {
    const config = await AutoClearConfig.findOneAndUpdate(
      { collectionId },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ message: 'Config saved', config });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save config', error: err.message });
  }
});

// Delete config for a collection
router.delete('/:collectionId', async (req, res) => {
  try {
    const result = await AutoClearConfig.deleteOne({ collectionId: req.params.collectionId });
    if (result.deletedCount === 0) {
      return res.status(404).send("No config found to delete");
    }
    res.status(200).json({ message: "Auto-clear config deleted" });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete config', error: err.message });
  }
});

// Get logs for a collection
router.get('/:collectionId/logs', async (req, res) => {
  try {
    const logs = await AutoClearLog.find({ collectionId: req.params.collectionId })
      .sort({ clearedAt: -1 }) // Newest first
      .limit(30); // Limit to 30 logs
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
  }
});

export default router;

