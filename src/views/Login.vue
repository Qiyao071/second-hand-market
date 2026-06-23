<template>
  <div class="container">
    <h2>登录</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="email">邮箱</label>
        <input type="email" id="email" v-model="form.email" required>
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input type="password" id="password" v-model="form.password" required>
      </div>
      <button type="submit">登录</button>
      <p class="error" v-if="error">{{ error }}</p>
      <div v-if="bannedDetail" class="banned-notice">
        <div class="banned-header">
          <span class="banned-icon">⚠️</span>
          <span>账户被封禁</span>
        </div>
        <p class="banned-content">{{ bannedDetail }}</p>
        <div class="banned-action">
          <button @click="showAppealModal = true" class="appeal-btn">申请申诉</button>
        </div>
      </div>
      <p class="success" v-if="success">{{ success }}</p>
      <p class="register-link">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </form>

    <!-- 申诉弹窗 -->
    <div v-if="showAppealModal" class="modal-overlay" @click.self="closeAppealModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>申请账号解封</h3>
          <button @click="closeAppealModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <p class="appeal-intro">请填写您的申诉理由，管理员将在24小时内处理您的申请。</p>
          <textarea 
            v-model="appealForm.reason" 
            placeholder="请详细说明您的情况，包括您认为账号不应被封禁的理由..."
            class="appeal-textarea"
            rows="5"
          ></textarea>
          <p v-if="appealSuccess" class="appeal-success-text">{{ appealSuccess }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeAppealModal" class="cancel-btn">取消</button>
          <button @click="submitAppeal" class="submit-appeal-btn" :disabled="!appealForm.reason.trim()">提交申诉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const form = ref({
  email: '',
  password: ''
})
const error = ref('')
const success = ref('')
const bannedDetail = ref('')
const showAppealModal = ref(false)
const appealForm = ref({
  reason: ''
})
const appealSuccess = ref('')

const handleLogin = async () => {
  error.value = ''
  success.value = ''
  bannedDetail.value = ''
  try {
    const response = await axios.post('/api/auth/login', form.value)
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    success.value = '登录成功！'
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch (err) {
    // 检查是否是封禁错误
    if (err.response?.data?.isBanned) {
      error.value = err.response.data.message
      bannedDetail.value = err.response.data.detail
    } else {
      error.value = err.response?.data?.message || '登录失败，请检查邮箱和密码'
    }
  }
}

const closeAppealModal = () => {
  showAppealModal.value = false
  appealForm.value.reason = ''
  appealSuccess.value = ''
}

const submitAppeal = async () => {
  if (!appealForm.value.reason.trim()) return
  
  try {
    const response = await axios.post('/api/auth/appeal', {
      email: form.value.email,
      password: form.value.password,
      reason: appealForm.value.reason
    })
    
    if (response.data.success) {
      appealSuccess.value = '申诉提交成功！管理员将在24小时内处理您的申请。'
      appealForm.value.reason = ''
      setTimeout(() => {
        closeAppealModal()
      }, 2000)
    } else {
      alert(response.data.message || '申诉提交失败')
    }
  } catch (err) {
    alert(err.response?.data?.message || '申诉提交失败')
  }
}
</script>

<style scoped>
.container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 1.5rem;
  color: #4CAF50;
  text-align: center;
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
  width: 100%;
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

button:hover {
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

.banned-notice {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fff3e0;
  border-left: 4px solid #ff9800;
  border-radius: 4px;
}

.banned-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #e65100;
  margin-bottom: 0.5rem;
  font-size: 16px;
}

.banned-icon {
  font-size: 20px;
}

.banned-content {
  color: #5d4037;
  line-height: 1.6;
  white-space: pre-line;
  margin: 0 0 0.5rem 0;
}

.banned-action {
  padding-top: 0.5rem;
  border-top: 1px dashed #ffcc80;
  text-align: center;
}

.appeal-btn {
  background-color: #ff9800;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.appeal-btn:hover {
  background-color: #f57c00;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1rem;
}

.appeal-intro {
  color: #666;
  margin-bottom: 0.75rem;
  font-size: 14px;
}

.appeal-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-size: 14px;
  box-sizing: border-box;
}

.appeal-textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.appeal-success-text {
  color: #4CAF50;
  margin-top: 0.5rem;
  font-size: 14px;
}

.modal-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background-color: #f5f5f5;
}

.submit-appeal-btn {
  padding: 8px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.submit-appeal-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.submit-appeal-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.register-link {
  margin-top: 1rem;
  text-align: center;
}

.register-link a {
  color: #4CAF50;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
}
</style>