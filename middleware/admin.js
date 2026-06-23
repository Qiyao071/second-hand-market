import jwt from 'jsonwebtoken'
import User from '../models/user.js'

export const isAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ message: '未授权' })
    }

    const decoded = jwt.verify(token, 'secret_key')
    const user = await User.findById(decoded.id)

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: '需要管理员权限' })
    }

    req.user = user
    next()
  } catch (err) {
    console.error('管理员权限验证失败:', err)
    res.status(401).json({ message: '未授权' })
  }
}

export const checkBanStatus = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, 'secret_key')
    const user = await User.findById(decoded.id)

    if (user && user.isBanned) {
      // 检查封禁是否已过期
      if (user.banExpiry && new Date() > user.banExpiry) {
        // 封禁已过期，自动解封
        user.isBanned = false
        user.banReason = ''
        user.banExpiry = null
        await user.save()
        return next()
      }

      return res.status(403).json({
        message: '您的账号已被封禁',
        reason: user.banReason,
        expiry: user.banExpiry
      })
    }

    next()
  } catch (err) {
    console.error('检查封禁状态失败:', err)
    next()
  }
}