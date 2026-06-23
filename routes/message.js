import express from 'express'
import Message from '../models/message.js'
import User from '../models/user.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

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
            { receiverId: userId }
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
              if: { $eq: ['$senderId', userId] },
              then: '$receiverId',
              else: '$senderId'
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
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1,
          userName: '$user.name',
          userAvatar: '$user.avatar'
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

    await Message.updateMany(
      {
        senderId: targetUserId,
        receiverId: currentUserId,
        isRead: false
      },
      { isRead: true }
    )

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('senderId', 'name avatar')
    .populate('receiverId', 'name avatar')

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
    const { content } = req.body

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: '消息内容不能为空' })
    }

    const message = new Message({
      senderId,
      receiverId,
      content: content.trim()
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

    await Message.deleteMany({
      $or: [
        { senderId: userId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: userId }
      ]
    })

    res.json({ success: true, message: '聊天记录已删除' })
  } catch (err) {
    console.error('删除聊天记录失败:', err)
    res.status(500).json({ success: false, message: '删除聊天记录失败' })
  }
})

export default router