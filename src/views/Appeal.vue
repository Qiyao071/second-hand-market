<template>
  <div class="appeal-page">
    <h1>提交申诉</h1>
    
    <div v-if="user.isBanned" class="ban-info">
      <div class="ban-icon">⚠️</div>
      <h2>您的账号已被封禁</h2>
      <p><strong>封禁理由:</strong> {{ user.banReason }}</p>
      <p v-if="user.banExpiry">
        <strong>封禁到期时间:</strong> {{ formatDate(user.banExpiry) }}
      </p>
      <p v-else>
        <strong>封禁类型:</strong> 永久封禁
      </p>
    </div>

    <div class="appeal-form">
      <h2>申诉表单</h2>
      <form @submit.prevent="submitAppeal">
        <div class="form-group">
          <label for="reason">申诉理由 *</label>
          <textarea 
            id="reason" 
            v-model="form.reason" 
            placeholder="请详细说明您的申诉理由..."
            rows="6"
            required
          ></textarea>
          <p class="hint">请详细说明申诉理由，管理员会尽快审核您的申诉</p>
        </div>
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn cancel-btn">返回</button>
          <button type="submit" class="btn submit-btn" :disabled="loading">
            {{ loading ? '提交中...' : '提交申诉' }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="myAppeals.length > 0" class="my-appeals">
      <h2>我的申诉记录</h2>
      <div class="appeals-list">
        <div v-for="appeal in myAppeals" :key="appeal._id" class="appeal-card">
          <div class="appeal-header">
            <span :class="['status-badge', appeal.status]">
              {{ getStatusText(appeal.status) }}
            </span>
            <span class="appeal-date">{{ formatDate(appeal.createdAt) }}</span>
          </div>
          <div class="appeal-content">
            <p>{{ appeal.reason }}</p>
          </div>
          <div v-if="appeal.adminResponse" class="admin-response">
            <h4>管理员回复:</h4>
            <p>{{ appeal.adminResponse }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const user = ref({
  isBanned: false,
  banReason: '',
  banExpiry: null
})
const form = ref({
  reason: ''
})
const loading = ref(false)
const myAppeals = ref([])

const loadUserInfo = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    user.value = response.data
  } catch (err) {
    console.error('加载用户信息失败:', err)
  }
}

const loadMyAppeals = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/appeals/my-appeals', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    myAppeals.value = response.data
  } catch (err) {
    console.error('加载申诉记录失败:', err)
  }
}

const submitAppeal = async () => {
  if (!form.value.reason.trim()) {
    alert('请填写申诉理由')
    return
  }

  loading.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.post('/api/appeals', {
      reason: form.value.reason
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('申诉提交成功，请等待管理员审核')
    form.value.reason = ''
    loadMyAppeals()
  } catch (err) {
    console.error('提交申诉失败:', err)
    alert(err.response?.data?.message || '提交申诉失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadUserInfo()
  loadMyAppeals()
})
</script>

<style scoped>
.appeal-page {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 2rem;
  color: #4CAF50;
}

.ban-info {
  background: #ffebee;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 2rem;
}

.ban-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.ban-info h2 {
  margin: 0 0 1rem 0;
  color: #d32f2f;
}

.ban-info p {
  margin: 0.5rem 0;
  color: #666;
}

.appeal-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.appeal-form h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.hint {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  color: #999;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f0f0f0;
  color: #333;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.submit-btn {
  background: #4CAF50;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #45a049;
}

.my-appeals h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.appeals-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.appeal-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.appeal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.approved {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.rejected {
  background: #ffebee;
  color: #d32f2f;
}

.appeal-date {
  font-size: 0.85rem;
  color: #999;
}

.appeal-content p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.admin-response {
  margin-top: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.admin-response h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.admin-response p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}
</style>