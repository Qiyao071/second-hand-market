import express from 'express'
import User from '../models/user.js'
import Item from '../models/item.js'
import Appeal from '../models/appeal.js'
import Message from '../models/message.js'
import { isAdmin } from '../middleware/admin.js'

const router = express.Router()

// 获取统计数据
router.get('/stats', isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalItems = await Item.countDocuments()
    const bannedUsers = await User.countDocuments({ isBanned: true })
    const pendingAppeals = await Appeal.countDocuments({ status: 'pending' })

    res.json({
      totalUsers,
      totalItems,
      bannedUsers,
      pendingAppeals
    })
  } catch (err) {
    console.error('获取统计数据失败:', err)
    res.status(500).json({ message: '获取统计数据失败' })
  }
})

// 获取待处理申诉数量
router.get('/appeals/pending-count', isAdmin, async (req, res) => {
  try {
    const count = await Appeal.countDocuments({ status: 'pending' })
    res.json({ success: true, data: { count } })
  } catch (err) {
    console.error('获取待处理申诉数量失败:', err)
    res.status(500).json({ success: false, message: '获取待处理申诉数量失败' })
  }
})

// 获取所有用户列表
router.get('/users', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const skip = (page - 1) * limit

    const query = search ? {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {}

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    })
  } catch (err) {
    console.error('获取用户列表失败:', err)
    res.status(500).json({ message: '获取用户列表失败' })
  }
})

// 封禁用户
router.post('/users/:id/ban', isAdmin, async (req, res) => {
  try {
    const { reason, duration } = req.body
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: '无法封禁管理员' })
    }

    const banExpiry = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null

    user.isBanned = true
    user.banReason = reason
    user.banExpiry = banExpiry
    await user.save()

    res.json({ message: '用户封禁成功' })
  } catch (err) {
    console.error('封禁用户失败:', err)
    res.status(500).json({ message: '封禁用户失败' })
  }
})

// 解封用户
router.post('/users/:id/unban', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    user.isBanned = false
    user.banReason = ''
    user.banExpiry = null
    await user.save()

    res.json({ message: '用户解封成功' })
  } catch (err) {
    console.error('解封用户失败:', err)
    res.status(500).json({ message: '解封用户失败' })
  }
})

// 修改用户角色
router.put('/users/:id/role', isAdmin, async (req, res) => {
  try {
    const { role } = req.body
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: '无效的角色' })
    }

    // 不能修改自己的角色
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: '无法修改自己的角色' })
    }

    user.role = role
    await user.save()

    res.json({ message: '用户角色修改成功' })
  } catch (err) {
    console.error('修改用户角色失败:', err)
    res.status(500).json({ message: '修改用户角色失败' })
  }
})

// 删除用户
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: '无法删除管理员' })
    }

    // 删除用户发布的所有物品
    await Item.deleteMany({ seller: req.params.id })

    // 删除用户
    await User.findByIdAndDelete(req.params.id)

    res.json({ message: '用户删除成功' })
  } catch (err) {
    console.error('删除用户失败:', err)
    res.status(500).json({ message: '删除用户失败' })
  }
})

// 获取所有物品列表
router.get('/items', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search = '' } = req.query
    const skip = (page - 1) * limit

    const query = {}
    if (status) {
      query.status = status
    }
    if (category && category !== '全部') {
      query.category = category
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const items = await Item.find(query)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Item.countDocuments(query)

    res.json({
      items,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    })
  } catch (err) {
    console.error('获取物品列表失败:', err)
    res.status(500).json({ message: '获取物品列表失败' })
  }
})

// 删除物品
router.delete('/items/:id', isAdmin, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)

    if (!item) {
      return res.status(404).json({ message: '物品不存在' })
    }

    await Item.findByIdAndDelete(req.params.id)

    res.json({ message: '物品删除成功' })
  } catch (err) {
    console.error('删除物品失败:', err)
    res.status(500).json({ message: '删除物品失败' })
  }
})

// 下架物品并通知卖家
router.put('/items/:id/remove', isAdmin, async (req, res) => {
  try {
    const { reason } = req.body
    const item = await Item.findById(req.params.id).populate('seller')

    if (!item) {
      return res.status(404).json({ message: '物品不存在' })
    }

    if (item.status === 'removed') {
      return res.status(400).json({ message: '物品已下架' })
    }

    // 下架商品（状态改为已下架）
    item.status = 'removed'
    item.removeReason = reason
    await item.save()

    // 向卖家发送系统通知消息
    const systemMessage = {
      senderId: null,
      receiverId: item.seller._id,
      content: `【系统通知】您发布的商品「${item.title}」已被管理员下架。\n\n原因：${reason}\n\n请检查商品信息是否符合平台规范，如需申诉请联系管理员。`,
      isRead: false,
      isRevoked: false,
      isSystem: true
    }

    await Message.create(systemMessage)

    res.json({ message: '物品下架成功，已通知卖家' })
  } catch (err) {
    console.error('下架物品失败:', err)
    res.status(500).json({ message: '下架物品失败' })
  }
})

// 获取所有申诉列表
router.get('/appeals', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query
    const skip = (page - 1) * limit

    const query = status ? { status } : {}

    const appeals = await Appeal.find(query)
      .populate('user', 'name email avatar')
      .populate('item', 'title images status removeReason')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await Appeal.countDocuments(query)

    res.json({
      appeals,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    })
  } catch (err) {
    console.error('获取申诉列表失败:', err)
    res.status(500).json({ message: '获取申诉列表失败' })
  }
})

// 处理申诉
router.post('/appeals/:id/process', isAdmin, async (req, res) => {
  try {
    const { status, adminResponse } = req.body

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: '无效的状态' })
    }

    const appeal = await Appeal.findById(req.params.id)

    if (!appeal) {
      return res.status(404).json({ message: '申诉不存在' })
    }

    if (appeal.status !== 'pending') {
      return res.status(400).json({ message: '申诉已被处理' })
    }

    appeal.status = status
    appeal.adminResponse = adminResponse
    appeal.processedAt = new Date()
    await appeal.save()

    // 如果申诉通过
    if (status === 'approved') {
      // 如果是账号申诉，自动解封用户
      if (appeal.type === 'account') {
        const user = await User.findById(appeal.user)
        if (user) {
          user.isBanned = false
          user.banReason = ''
          user.banExpiry = null
          await user.save()
        }
      }
      // 如果是物品申诉，恢复物品状态
      if (appeal.type === 'item' && appeal.item) {
        const item = await Item.findById(appeal.item)
        if (item) {
          item.status = 'available'
          item.removeReason = ''
          await item.save()
        }
      }
    }

    // 发送申诉结果系统通知
    const appealResultText = status === 'approved' ? '通过' : '拒绝'
    const appealTypeText = appeal.type === 'account' ? '账号' : '物品'
    const systemMessage = {
      senderId: null,
      receiverId: appeal.user,
      content: `【系统通知】您的${appealTypeText}申诉已被${appealResultText}。\n\n${adminResponse}`,
      isRead: false,
      isRevoked: false,
      isSystem: true
    }
    await Message.create(systemMessage)

    res.json({ message: '申诉处理成功' })
  } catch (err) {
    console.error('处理申诉失败:', err)
    res.status(500).json({ message: '处理申诉失败' })
  }
})

export default router