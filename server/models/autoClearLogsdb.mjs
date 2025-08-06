import mongoose from 'mongoose';

const AutoClearLogSchema = new mongoose.Schema({
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    required: true,
  },
  clearedAt: {
    type: Date,
    default: Date.now,
  },
  interval: {
    type: String,
    enum: ['day', 'week', 'month', 'custom'],
    required: true,
  },
  target: {
    type: String,
    enum: ['today', 'week', 'month', 'custom', 'all'],
    required: true,
  },
  range: {
    start: Date,
    end: Date,
  },
  clearedCount: Number,
  clearedIds: [mongoose.Schema.Types.ObjectId],
}, {
  timestamps: true,
});

const AutoClearLog = mongoose.model('AutoClearLog', AutoClearLogSchema);
export default AutoClearLog;
