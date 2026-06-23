import express from 'express'
import Message from '../models/message.js'
import User from '../models/user.js'
import Item from '../models/item.js'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const messageUploadDir = path.join(__dirname, '../uploads/messages')
if (!fs.existsSync(messageUploadDir)) {
  fs.mkdirSync(messageUploadDir, { recursive: true })
}

const messageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, messageUploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'message-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const messageUpload = multer({ 
  storage: messageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error('只支持图片格式'))
    }
  }
})

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: '未授权' })
  }
  
  try {
    const decoded = jwt.verify(token, 'secret_key')
    const user = await User.findById(decoded.id)
    if (!user) {
      return res.status(401).json({ message: '用户不存在' })
    }
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ message: '无效的token' })
  }
}

router.use(authenticate)

router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user._id
    
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId },
            { receiverId: userId, isSystem: true }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$isSystem', true] },
              then: 'system',
              else: {
                $cond: {
                  if: { $eq: ['$senderId', userId] },
                  then: '$receiverId',
                  else: '$senderId'
                }
              }
            }
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $ne: ['$senderId', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          userName: { 
            $cond: {
              if: { $eq: ['$_id', 'system'] },
              then: '系统通知',
              else: { $arrayElemAt: ['$user.name', 0] }
            }
          },
          userAvatar: { 
            $cond: {
              if: { $eq: ['$_id', 'system'] },
              then: null,
              else: { $arrayElemAt: ['$user.avatar', 0] }
            }
          },
          isSystem: { 
            $cond: {
              if: { $eq: ['$_id', 'system'] },
              then: true,
              else: { $ifNull: ['$lastMessage.isSystem', false] }
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ])

    res.json({ success: true, data: messages })
  } catch (err) {
    console.error('获取会话列表失败:', err)
    res.status(500).json({ success: false, message: '获取会话列表失败' })
  }
})

router.get('/conversation/:userId', async (req, res) => {
  try {
    const currentUserId = req.user._id
    const targetUserId = req.params.userId

    let messages
    let query
    
    if (targetUserId === 'system') {
      // 系统消息会话
      await Message.updateMany(
        {
          receiverId: currentUserId,
          isSystem: true,
          isRead: false,
          deletedForReceiver: { $ne: true }
        },
        { isRead: true }
      )

      messages = await Message.find({
        receiverId: currentUserId,
        isSystem: true,
        deletedForReceiver: { $ne: true }
      })
      .sort({ createdAt: 1 })
      .populate('receiverId', 'name avatar')
    } else {
      // 普通用户会话
      await Message.updateMany(
        {
          senderId: targetUserId,
          receiverId: currentUserId,
          isRead: false,
          isSystem: false,
          deletedForReceiver: { $ne: true }
        },
        { isRead: true }
      )

      messages = await Message.find({
        $and: [
          {
            $or: [
              { senderId: currentUserId, receiverId: targetUserId, isSystem: false, deletedForSender: { $ne: true } },
              { senderId: targetUserId, receiverId: currentUserId, isSystem: false, deletedForReceiver: { $ne: true } }
            ]
          }
        ]
      })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar')
      .populate('receiverId', 'name avatar')
    }

    res.json({ success: true, data: messages })
  } catch (err) {
    console.error('获取消息失败:', err)
    res.status(500).json({ success: false, message: '获取消息失败' })
  }
})

router.post('/send/:userId', async (req, res) => {
  try {
    const senderId = req.user._id
    const receiverId = req.params.userId
    const { content, image, isTradeRequest, tradeItemId } = req.body

    console.log('收到消息请求:', { content, image, isTradeRequest, tradeItemId, body: req.body })

    if (receiverId === 'system') {
      return res.status(403).json({ success: false, message: '不能向系统发送消息' })
    }

    // 消息内容或图片至少有一个
    const hasContent = content && content.trim() && content.trim().length > 0
    const hasImage = image && image.trim() && image.trim().length > 0
    
    console.log('hasContent:', hasContent, 'hasImage:', hasImage)
    
    if (!hasContent && !hasImage) {
      return res.status(400).json({ success: false, message: '消息内容不能为空' })
    }

    const message = new Message({
      senderId,
      receiverId,
      content: content?.trim() || '',
      image: image || '',
      isTradeRequest: isTradeRequest || false,
      tradeItemId: tradeItemId || null
    })

    await message.save()
    await message.populate('senderId', 'name avatar')
    await message.populate('receiverId', 'name avatar')

    res.json({ success: true, data: message })
  } catch (err) {
    console.error('发送消息失败:', err)
    res.status(500).json({ success: false, message: '发送消息失败' })
  }
})

router.post('/upload-image', messageUpload.array('images', 9), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '请选择图片' })
    }

    const imageUrls = req.files.map(file => `/uploads/messages/${file.filename}`)
    res.json({ success: true, data: { imageUrls } })
  } catch (err) {
    console.error('上传图片失败:', err)
    res.status(500).json({ success: false, message: '上传图片失败' })
  }
})

router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user._id

    const count = await Message.countDocuments({
      receiverId: userId,
      isRead: false
    })

    res.json({ success: true, data: { count } })
  } catch (err) {
    console.error('获取未读消息数失败:', err)
    res.status(500).json({ success: false, message: '获取未读消息数失败' })
  }
})

router.put('/revoke/:messageId', async (req, res) => {
  try {
    const userId = req.user._id
    const messageId = req.params.messageId

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ success: false, message: '消息不存在' })
    }

    if (String(message.senderId) !== String(userId)) {
      return res.status(403).json({ success: false, message: '只能撤回自己发送的消息' })
    }

    const now = new Date()
    const diff = now - message.createdAt
    const fiveMinutes = 5 * 60 * 1000

    if (diff > fiveMinutes) {
      return res.status(400).json({ success: false, message: '只能撤回5分钟内发送的消息' })
    }

    message.isRevoked = true
    await message.save()

    res.json({ success: true, data: message })
  } catch (err) {
    console.error('撤回消息失败:', err)
    res.status(500).json({ success: false, message: '撤回消息失败' })
  }
})

router.delete('/conversation/:userId', async (req, res) => {
  try {
    const userId = req.user._id
    const targetUserId = req.params.userId

    // 只标记对当前用户删除，不真正删除消息
    // 对于当前用户发送的消息，标记为对发送方删除
    // 对于当前用户接收的消息，标记为对接收方删除
    await Message.updateMany(
      { senderId: userId, receiverId: targetUserId },
      { deletedForSender: true }
    )

    await Message.updateMany(
      { senderId: targetUserId, receiverId: userId },
      { deletedForReceiver: true }
    )

    res.json({ success: true, message: '聊天记录已删除' })
  } catch (err) {
    console.error('删除聊天记录失败:', err)
    res.status(500).json({ success: false, message: '删除聊天记录失败' })
  }
})

// 同意交易请求
router.put('/trade-request/:messageId/accept', async (req, res) => {
  try {
    const userId = req.user._id
    const messageId = req.params.messageId

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ success: false, message: '消息不存在' })
    }

    // 只有消息接收者才能处理交易请求
    if (String(message.receiverId) !== String(userId)) {
      return res.status(403).json({ success: false, message: '只能处理发送给您的交易请求' })
    }

    if (!message.isTradeRequest) {
      return res.status(400).json({ success: false, message: '这不是交易请求消息' })
    }

    if (message.tradeStatus !== 'pending') {
      return res.status(400).json({ success: false, message: '交易请求状态已变更' })
    }

    // 如果有关联的商品，先检查商品是否存在且状态正确
    if (message.tradeItemId) {
      const item = await Item.findById(message.tradeItemId)
      if (!item) {
        return res.status(404).json({ success: false, message: '关联商品不存在' })
      }
      if (item.status !== 'available') {
        return res.status(400).json({ success: false, message: '商品状态不是在售，无法交易' })
      }
    }

    // 将交易请求标记为已同意
    message.tradeStatus = 'accepted'
    await message.save()

    // 如果有关联的商品，将商品状态改为已售出
    if (message.tradeItemId) {
      const item = await Item.findById(message.tradeItemId)
      if (item) {
        item.status = 'sold'
        await item.save()
        console.log(`商品 ${item.title} 已标记为已售出`)
      }
    }

    // 向发起方（原消息发送者）发送反馈消息
    const feedbackMessage = new Message({
      senderId: userId,
      receiverId: message.senderId,
      content: '',
      isTradeRequest: true,
      tradeItemId: message.tradeItemId,
      tradeStatus: 'accepted',
      tradeFeedback: true,
      originalMessageId: messageId
    })
    await feedbackMessage.save()

    res.json({ success: true, data: message })
  } catch (err) {
    console.error('同意交易请求失败:', err)
    // 更详细的错误信息
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: '数据验证失败: ' + err.message })
    }
    res.status(500).json({ success: false, message: '同意交易请求失败: ' + err.message })
  }
})

// 拒绝交易请求
router.put('/trade-request/:messageId/reject', async (req, res) => {
  try {
    const userId = req.user._id
    const messageId = req.params.messageId

    const message = await Message.findById(messageId)
    if (!message) {
      return res.status(404).json({ success: false, message: '消息不存在' })
    }

    // 只有消息接收者才能处理交易请求
    if (String(message.receiverId) !== String(userId)) {
      return res.status(403).json({ success: false, message: '只能处理发送给您的交易请求' })
    }

    if (!message.isTradeRequest) {
      return res.status(400).json({ success: false, message: '这不是交易请求消息' })
    }

    if (message.tradeStatus !== 'pending') {
      return res.status(400).json({ success: false, message: '交易请求状态已变更' })
    }

    message.tradeStatus = 'rejected'
    await message.save()

    // 向发起方（原消息发送者）发送反馈消息
    const feedbackMessage = new Message({
      senderId: userId,
      receiverId: message.senderId,
      content: '',
      isTradeRequest: true,
      tradeItemId: message.tradeItemId,
      tradeStatus: 'rejected',
      tradeFeedback: true,
      originalMessageId: messageId
    })
    await feedbackMessage.save()

    res.json({ success: true, data: message })
  } catch (err) {
    console.error('拒绝交易请求失败:', err)
    res.status(500).json({ success: false, message: '拒绝交易请求失败' })
  }
})

export default router