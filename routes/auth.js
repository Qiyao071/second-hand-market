import express from 'express'
import User from '../models/user.js'
import Appeal from '../models/appeal.js'
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
    
    // 验证用户名
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: '请输入用户名' })
    }
    if (name.length < 2) {
      return res.status(400).json({ message: '用户名长度不能少于2个字符' })
    }
    if (name.length > 50) {
      return res.status(400).json({ message: '用户名长度不能超过50个字符' })
    }
    
    // 验证邮箱格式
    if (!email || email.trim() === '') {
      return res.status(400).json({ message: '请输入邮箱地址' })
    }
    const emailRegex = /^\S+@\S+\.\S+/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '请输入有效的邮箱地址' })
    }
    if (email.length > 255) {
      return res.status(400).json({ message: '邮箱地址长度不能超过255个字符' })
    }
    
    // 验证密码
    if (!password) {
      return res.status(400).json({ message: '请输入密码' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: '密码长度不能少于6个字符' })
    }
    if (password.length > 128) {
      return res.status(400).json({ message: '密码长度不能超过128个字符' })
    }
    
    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' })
    }
    
    // 哈希密码
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    // 创建新用户
    const isAdmin = email.trim().toLowerCase() === 'root@admin.com'
    const user = new User({
      name: name.trim(),
      email: email.trim(),
      password: hashedPassword,
      role: isAdmin ? 'admin' : 'user'
    })
    
    await user.save()
    res.status(201).json({ message: isAdmin ? '管理员账号注册成功' : '注册成功' })
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
    
    // 检查用户是否被封禁
    if (user.isBanned) {
      return res.status(403).json({ 
        message: '您的账户已被封禁',
        isBanned: true,
        banReason: user.banReason,
        banExpiry: user.banExpiry ? user.banExpiry.toISOString() : null,
        detail: `您的账户已被封禁。\n\n封禁原因：${user.banReason || '未说明'}\n${user.banExpiry ? `解封时间：${user.banExpiry.toLocaleString()}` : '封禁类型：永久封禁'}\n\n如需解除封禁，请联系管理员进行申诉。`
      })
    }
    
    // 生成token
    const token = jwt.sign({ id: user._id }, 'secret_key', { expiresIn: '7d' })
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isBanned: user.isBanned
      }
    })
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({ message: '登录失败，请稍后重试' })
  }
})

// 用户申诉
router.post('/appeal', async (req, res) => {
  try {
    const { email, password, reason } = req.body
    
    // 查找用户
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ success: false, message: '邮箱或密码错误' })
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '邮箱或密码错误' })
    }
    
    // 检查用户是否被封禁
    if (!user.isBanned) {
      return res.status(400).json({ success: false, message: '您的账号未被封禁，无需申诉' })
    }
    
    // 检查是否已经有未处理的账号申诉
    const existingAppeal = await Appeal.findOne({ user: user._id, type: 'account', status: 'pending' })
    if (existingAppeal) {
      return res.status(400).json({ success: false, message: '您已有待处理的申诉，请耐心等待管理员处理' })
    }
    
    // 创建申诉记录
    const appeal = new Appeal({
      user: user._id,
      type: 'account',
      reason: reason,
      status: 'pending'
    })
    await appeal.save()
    
    res.json({ success: true, message: '申诉提交成功！管理员将在24小时内处理您的申请。' })
  } catch (err) {
    console.error('申诉提交失败:', err)
    res.status(500).json({ success: false, message: '申诉提交失败: ' + err.message })
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

// 修改密码
router.put('/change-password', async (req, res) => {
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
    
    const { currentPassword, newPassword, confirmPassword } = req.body
    
    // 验证当前密码
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: '当前密码不正确' })
    }
    
    // 验证新密码
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: '新密码长度不能少于6个字符' })
    }
    
    if (newPassword.length > 128) {
      return res.status(400).json({ message: '新密码长度不能超过128个字符' })
    }
    
    // 验证新密码不能与旧密码相同
    const isSameAsOld = await bcrypt.compare(newPassword, user.password)
    if (isSameAsOld) {
      return res.status(400).json({ message: '新密码不可与旧密码一致' })
    }
    
    // 验证确认密码
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: '两次输入的密码不一致' })
    }
    
    // 更新密码
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    await user.save()
    
    res.json({ message: '密码修改成功' })
  } catch (err) {
    console.error('修改密码失败:', err)
    res.status(500).json({ message: '修改密码失败，请稍后重试' })
  }
})

// 获取指定用户信息（公开）
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' })
    }
    
    res.json(user)
  } catch (err) {
    console.error('获取用户信息失败:', err)
    res.status(500).json({ message: '获取用户信息失败' })
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
