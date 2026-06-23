import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: '',
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isRevoked: {
    type: Boolean,
    default: false
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  isTradeRequest: {
    type: Boolean,
    default: false
  },
  tradeItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    default: null
  },
  tradeStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  tradeFeedback: {
    type: Boolean,
    default: false
  },
  originalMessageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  deletedForSender: {
    type: Boolean,
    default: false
  },
  deletedForReceiver: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 })

export default mongoose.model('Message', messageSchema)