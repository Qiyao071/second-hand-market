import jwt from 'jsonwebtoken'

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ message: '未授权访问' })
  }
  
  try {
    const decoded = jwt.verify(token, 'secret_key')
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: '无效的token' })
  }
}

export default verifyToken