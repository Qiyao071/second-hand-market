import express from 'express'
const router = express.Router()
import Favorite from '../models/favorite.js'
import verifyToken from '../middleware/auth/index.js'
import mongoose from 'mongoose'
const ObjectId = mongoose.Types.ObjectId

// 添加收藏
router.post('/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params
    const userId = new ObjectId(req.user.id)

    const existingFavorite = await Favorite.findOne({ userId, itemId })
    if (existingFavorite) {
      return res.status(400).json({ success: false, message: '已收藏该物品' })
    }

    const favorite = new Favorite({ userId, itemId })
    await favorite.save()

    res.status(201).json({ success: true, message: '收藏成功' })
  } catch (err) {
    console.error('收藏失败:', err)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// 取消收藏
router.delete('/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params
    const userId = new ObjectId(req.user.id)

    const result = await Favorite.deleteOne({ userId, itemId })
    
    if (result.deletedCount === 0) {
      return res.status(400).json({ success: false, message: '未收藏该物品' })
    }

    res.json({ success: true, message: '取消收藏成功' })
  } catch (err) {
    console.error('取消收藏失败:', err)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// 检查单个物品是否已收藏
router.get('/check/:itemId', verifyToken, async (req, res) => {
  try {
    const { itemId } = req.params
    const userId = new ObjectId(req.user.id)

    const favorite = await Favorite.findOne({ userId, itemId })
    
    res.json({ success: true, isFavorited: !!favorite })
  } catch (err) {
    console.error('检查收藏状态失败:', err)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// 获取用户所有收藏
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.user.id)
    console.log('获取收藏列表 - userId:', userId)

    const favorites = await Favorite.find({ userId })
      .populate('itemId')
      .sort({ createdAt: -1 })
    
    console.log('获取收藏列表 - 结果数量:', favorites.length)
    console.log('获取收藏列表 - 结果:', JSON.stringify(favorites, null, 2))
    
    res.json({ success: true, data: favorites })
  } catch (err) {
    console.error('获取收藏列表失败:', err)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

export default router
