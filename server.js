import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5000

// 中间件
app.use(cors())
app.use(express.json())

// 路由
app.use('/api/auth', authRoutes)

// 数据库连接
mongoose.connect('mongodb://localhost:27017/campus-market', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('数据库连接成功'))
.catch(err => console.error('数据库连接失败:', err))

// 测试路由
app.get('/', (req, res) => {
  res.json({ message: '校园二手物品发布平台后端服务' })
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})
