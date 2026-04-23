import express from 'express'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import itemRoutes from './routes/item.js'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const app = express()
const PORT = process.env.PORT || 5000

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, 'uploads')
const itemsUploadDir = path.join(__dirname, 'uploads/items')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

if (!fs.existsSync(itemsUploadDir)) {
  fs.mkdirSync(itemsUploadDir, { recursive: true })
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

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadDir))

app.use('/api/auth', authRoutes)
app.use('/api/items', itemRoutes)

mongoose.connect('mongodb://localhost:27017/campus-market', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('数据库连接成功'))
.catch(err => console.error('数据库连接失败:', err))

app.get('/', (req, res) => {
  res.json({ message: '校园二手物品发布平台后端服务' })
})

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`)
})