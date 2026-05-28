import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

favoriteSchema.index({ userId: 1, itemId: 1 }, { unique: true })

export default mongoose.model('Favorite', favoriteSchema)