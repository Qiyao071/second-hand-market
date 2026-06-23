import express from 'express'
import Appeal from '../models/appeal.js'
import jwt from 'jsonwebtoken'

const router = express.Router()

// 提交申诉
router.post('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }

    const decoded = jwt.verify(token, 'secret_key')
    const { reason } = req.body

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: '请填写申诉理由' })
    }

    const appeal = new Appeal({
      user: decoded.id,
      reason: reason.trim()
    })

    await appeal.save()

    res.status(201).json({ message: '申诉提交成功，请等待管理员审核' })
  } catch (err) {
    console.error('提交申诉失败:', err)
    res.status(500).json({ message: '提交申诉失败，请稍后重试' })
  }
})

// 获取当前用户的申诉列表
router.get('/my-appeals', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }

    const decoded = jwt.verify(token, 'secret_key')

    const appeals = await Appeal.find({ user: decoded.id })
      .sort({ createdAt: -1 })

    res.json(appeals)
  } catch (err) {
    console.error('获取申诉列表失败:', err)
    res.status(500).json({ message: '获取申诉列表失败' })
  }
})

export default router