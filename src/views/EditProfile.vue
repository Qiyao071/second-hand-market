<template>
  <div class="container">
    <h2>修改个人信息</h2>
    
    <div class="profile-preview">
      <img 
        :src="user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'user'}`" 
        alt="头像" 
        class="avatar"
      >
      <p>{{ user.name }}</p>
      <p>{{ user.email }}</p>
    </div>

    <form @submit.prevent="updateProfile">
      <div class="form-group">
        <label for="name">姓名</label>
        <input type="text" id="name" v-model="form.name" required>
      </div>
      <div class="form-group">
        <label for="avatar">头像</label>
        <input type="file" id="avatar" @change="handleAvatarUpload" accept="image/*">
      </div>
      <div class="form-actions">
        <button type="button" @click="goBack" class="back-btn">返回</button>
        <button type="submit" class="submit-btn">保存修改</button>
      </div>
      <p class="error" v-if="error">{{ error }}</p>
      <p class="success" v-if="success">{{ success }}</p>
    </form>

    <div class="password-section">
      <h3>修改密码</h3>
      <form @submit.prevent="changePassword">
        <div class="form-group">
          <label for="currentPassword">当前密码</label>
          <input type="password" id="currentPassword" v-model="passwordForm.currentPassword" required>
        </div>
        <div class="form-group">
          <label for="newPassword">新密码</label>
          <input type="password" id="newPassword" v-model="passwordForm.newPassword" required>
        </div>
        <div class="form-group">
          <label for="confirmPassword">确认新密码</label>
          <input type="password" id="confirmPassword" v-model="passwordForm.confirmPassword" required>
        </div>
        <div class="form-actions">
          <button type="submit" class="submit-btn password-btn">修改密码</button>
        </div>
        <p class="error" v-if="passwordError">{{ passwordError }}</p>
        <p class="success" v-if="passwordSuccess">{{ passwordSuccess }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const user = ref({
  name: '',
  email: '',
  avatar: ''
})

const form = ref({
  name: '',
  avatar: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const error = ref('')
const success = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')

const goBack = () => {
  router.go(-1)
}

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

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const formData = new FormData()
  formData.append('avatar', file)
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post('/api/auth/upload-avatar', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })
    form.value.avatar = response.data.avatar
    success.value = '头像上传成功！'
    error.value = ''
    loadUserInfo()
  } catch (err) {
    error.value = err.response?.data?.message || '头像上传失败，请稍后重试'
    success.value = ''
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
    loadUserInfo()
  } catch (err) {
    error.value = err.response?.data?.message || '更新失败，请稍后重试'
    success.value = ''
  }
}

const changePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''
  try {
    const token = localStorage.getItem('token')
    await axios.put('/api/auth/change-password', passwordForm.value, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    passwordSuccess.value = '密码修改成功！'
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (err) {
    passwordError.value = err.response?.data?.message || '修改密码失败，请稍后重试'
    passwordSuccess.value = ''
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

.profile-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
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

.profile-preview p {
  margin: 0;
  color: #666;
}

.profile-preview p:first-of-type {
  font-weight: bold;
  color: #333;
  font-size: 1.2rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.back-btn {
  flex: 1;
  background-color: #f0f0f0;
  color: #333;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-btn:hover {
  background-color: #e0e0e0;
}

.submit-btn {
  flex: 2;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #45a049;
}

.error {
  color: red;
  margin-top: 1rem;
  text-align: center;
}

.success {
  color: green;
  margin-top: 1rem;
  text-align: center;
}

.password-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.password-section h3 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.2rem;
}

.password-btn {
  width: 100%;
  flex: none;
  background-color: #f44336;
}

.password-btn:hover {
  background-color: #d32f2f;
}

</style>
