import express from 'express'
import User from '../models/user.js'
import Item from '../models/item.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalItems = await Item.countDocuments({ status: 'available' })
    const totalSoldItems = await Item.countDocuments({ status: 'sold' })

    res.json({
      success: true,
      data: {
        totalItems,
        totalUsers,
        totalSoldItems
      }
    })
  } catch (err) {
    console.error('获取统计数据失败:', err)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

export default router