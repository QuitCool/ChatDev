const mongoose = require('mongoose');

const balanceSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  },
  // 1000 tokenCredits = 1 mill ($0.001 USD)
  tokenCredits: {
    type: mongoose.Schema.Types.Mixed,
    default: 0,
  },
  expireAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + (24 * 60 * 60 * 1000)), // Adds 24 hours to the current date
    index: { expires: '1s' }, // This will create a TTL index that expires the document 1 second after the expireAt time
  },
  createdAt: {
    type: Date,
    default: () => new Date(), // Sets the default value to the current date and time
  },
});

module.exports = balanceSchema;
