<template>
  <div class="container">
    <h2>个人中心</h2>
    <div class="profile-info">
      <img :src="user.avatar || 'https://via.placeholder.com/100'" alt="头像" class="avatar">
      <div>
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
      </div>
    </div>
    
    <h3>修改个人信息</h3>
    <form @submit.prevent="updateProfile">
      <div class="form-group">
        <label for="name">姓名</label>
        <input type="text" id="name" v-model="form.name" required>
      </div>
      <div class="form-group">
        <label for="avatar">头像URL</label>
        <input type="text" id="avatar" v-model="form.avatar">
      </div>
      <button type="submit">保存修改</button>
      <p class="error" v-if="error">{{ error }}</p>
      <p class="success" v-if="success">{{ success }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const user = ref({
  name: '',
  email: '',
  avatar: ''
})

const form = ref({
  name: '',
  avatar: ''
})

const error = ref('')
const success = ref('')

const loadUserInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    user.value = response.data
    form.value.name = response.data.name
    form.value.avatar = response.data.avatar || ''
  } catch (err) {
    console.error('加载用户信息失败:', err)
  }
}

const updateProfile = async () => {
  error.value = ''
  success.value = ''
  try {
    const token = localStorage.getItem('token')
    await axios.put('/api/auth/profile', form.value, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    success.value = '个人信息更新成功！'
    // 重新加载用户信息
    loadUserInfo()
  } catch (err) {
    error.value = err.response?.data?.message || '更新失败，请稍后重试'
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 2rem;
  color: #4CAF50;
  text-align: center;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4CAF50;
}

.profile-info h3 {
  margin: 0;
  color: #333;
}

.profile-info p {
  margin: 0.5rem 0 0 0;
  color: #666;
}

h3 {
  margin: 2rem 0 1rem 0;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-top: 1rem;
}

button:hover {
  background-color: #45a049;
}

.error {
  color: red;
  margin-top: 1rem;
}

.success {
  color: green;
  margin-top: 1rem;
}
</style>
