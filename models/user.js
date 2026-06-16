import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 20,
    match: /^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 128
  },
  avatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

const User = mongoose.model('User', userSchema)

export default User
