import mongoose from 'mongoose'

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  images: [{
    type: String
  }],
  category: {
    type: String,
    required: true,
    enum: ['书籍', '电子产品', '生活用品', '服装', '家具', '运动器材', '其他']
  },
  condition: {
    type: String,
    required: true,
    enum: ['全新', '几乎全新', '轻微使用痕迹', '有明显使用痕迹', '待修复']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contact: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    default: 'available',
    enum: ['available', 'reserved', 'sold']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const Item = mongoose.model('Item', itemSchema)

export default Item