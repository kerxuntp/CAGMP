import mongoose from 'mongoose';

const AutoClearSchema = new mongoose.Schema({
  interval: {
    type: String,
    enum: ['day', 'week', 'month', 'custom'],
    required: true,
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Collection",
    required: true,
  },
  target: {
    type: String,
    enum: ['today', 'week', 'month', 'custom', 'all'],
    required: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  customIntervalValue: {
    type: Number,
    min: 1,
  },
  customIntervalUnit: {
    type: String,
    enum: ['minute', 'hour', 'day'],
  },
  lastClearedAt: {
    type: Date,
    default: null,
  },
  clearTime: {
    type: String,
    default: "00:00",
  },
}, {
  timestamps: true,
});

AutoClearSchema.index({ collectionId: 1 }, { unique: true }); 
const AutoClearConfig = mongoose.model('AutoClearConfig', AutoClearSchema);
export default AutoClearConfig;