import express from 'express'
import User from '../models/user.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

// 获取__dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 创建上传目录
import fs from 'fs'
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置multer
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

// 注册
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' })
    }
    
    // 哈希密码
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    // 创建新用户
    const user = new User({
      name,
      email,
      password: hashedPassword
    })
    
    await user.save()
    res.status(201).json({ message: '注册成功' })
  } catch (err) {
    console.error('注册失败:', err)
    res.status(500).json({ message: '注册失败，请稍后重试' })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    // 查找用户
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: '邮箱或密码错误' })
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: '邮箱或密码错误' })
    }
    
    // 生成token
    const token = jwt.sign({ id: user._id }, 'secret_key', { expiresIn: '7d' })
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    })
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({ message: '登录失败，请稍后重试' })
  }
})

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }
    
    const decoded = jwt.verify(token, 'secret_key')
    const user = await User.findById(decoded.id).select('-password')
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    res.json(user)
  } catch (err) {
    console.error('获取用户信息失败:', err)
    res.status(500).json({ message: '获取用户信息失败' })
  }
})

// 更新用户信息
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }
    
    const decoded = jwt.verify(token, 'secret_key')
    const user = await User.findById(decoded.id)
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    // 更新用户信息
    if (req.body.name) user.name = req.body.name
    if (req.body.avatar) user.avatar = req.body.avatar
    
    await user.save()
    res.json({ message: '个人信息更新成功' })
  } catch (err) {
    console.error('更新用户信息失败:', err)
    res.status(500).json({ message: '更新用户信息失败' })
  }
})

// 上传头像
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }
    
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的文件' })
    }
    
    const decoded = jwt.verify(token, 'secret_key')
    const user = await User.findById(decoded.id)
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    // 生成头像URL
    const avatarUrl = `/uploads/${req.file.filename}`
    user.avatar = avatarUrl
    await user.save()
    
    res.json({ avatar: avatarUrl, message: '头像上传成功' })
  } catch (err) {
    console.error('上传头像失败:', err)
    res.status(500).json({ message: '上传头像失败' })
  }
})

export default router
