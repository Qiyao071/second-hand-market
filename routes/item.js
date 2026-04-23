import express from 'express'
import Item from '../models/item.js'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '../uploads/items')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

router.post('/', upload.array('images', 9), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }

    const decoded = jwt.verify(token, 'secret_key')
    const { title, description, price, category, condition, contact } = req.body

    if (!title || !description || !price || !category || !condition) {
      return res.status(400).json({ message: '请填写所有必填项' })
    }

    const imageUrls = req.files ? req.files.map(file => `/uploads/items/${file.filename}`) : []

    const item = new Item({
      title,
      description,
      price: Number(price),
      images: imageUrls,
      category,
      condition,
      contact: contact || '',
      seller: decoded.id
    })

    await item.save()
    res.status(201).json({ message: '物品发布成功', item })
  } catch (err) {
    console.error('发布物品失败:', err)
    res.status(500).json({ message: '发布物品失败，请稍后重试' })
  }
})

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, sort = 'createdAt', order = 'desc' } = req.query

    const query = {}
    if (category && category !== '全部') {
      query.category = category
    }

    const items = await Item.find(query)
      .populate('seller', 'name avatar')
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const total = await Item.countDocuments(query)

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    })
  } catch (err) {
    console.error('获取物品列表失败:', err)
    res.status(500).json({ message: '获取物品列表失败' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('seller', 'name avatar email')
    if (!item) {
      return res.status(404).json({ message: '物品不存在' })
    }
    res.json(item)
  } catch (err) {
    console.error('获取物品详情失败:', err)
    res.status(500).json({ message: '获取物品详情失败' })
  }
})

router.put('/:id', upload.array('images', 9), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }

    const decoded = jwt.verify(token, 'secret_key')
    const item = await Item.findById(req.params.id)

    if (!item) {
      return res.status(404).json({ message: '物品不存在' })
    }

    if (item.seller.toString() !== decoded.id) {
      return res.status(403).json({ message: '无权限修改此物品' })
    }

    const { title, description, price, category, condition, contact, status } = req.body

    if (title) item.title = title
    if (description) item.description = description
    if (price) item.price = Number(price)
    if (category) item.category = category
    if (condition) item.condition = condition
    if (contact) item.contact = contact
    if (status) item.status = status

    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => `/uploads/items/${file.filename}`)
      item.images = [...item.images, ...newImageUrls]
    }

    await item.save()
    res.json({ message: '物品更新成功', item })
  } catch (err) {
    console.error('更新物品失败:', err)
    res.status(500).json({ message: '更新物品失败' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }

    const decoded = jwt.verify(token, 'secret_key')
    const item = await Item.findById(req.params.id)

    if (!item) {
      return res.status(404).json({ message: '物品不存在' })
    }

    if (item.seller.toString() !== decoded.id) {
      return res.status(403).json({ message: '无权限删除此物品' })
    }

    await Item.findByIdAndDelete(req.params.id)
    res.json({ message: '物品删除成功' })
  } catch (err) {
    console.error('删除物品失败:', err)
    res.status(500).json({ message: '删除物品失败' })
  }
})

router.get('/user/my-items', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }

    const decoded = jwt.verify(token, 'secret_key')
    const items = await Item.find({ seller: decoded.id }).sort({ createdAt: -1 })
    res.json(items)
  } catch (err) {
    console.error('获取我的物品失败:', err)
    res.status(500).json({ message: '获取我的物品失败' })
  }
})

export default router