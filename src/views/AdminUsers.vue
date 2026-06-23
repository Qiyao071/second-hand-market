<template>
  <div class="admin-users">
    <h1>用户管理</h1>
    
    <div class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="搜索用户名或邮箱..." 
        @keyup.enter="loadUsers"
      >
      <button @click="loadUsers" class="search-btn">搜索</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="users.length === 0" class="empty">
      <p>暂无用户</p>
    </div>

    <div v-else class="users-table">
      <table>
        <thead>
          <tr>
            <th>用户</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>状态</th>
            <th>注册时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user._id">
            <td>
              <div class="user-info">
                <img 
                  :src="user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'user'}`" 
                  :alt="user.name"
                  class="user-avatar"
                >
                <span>{{ user.name }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>
              <div class="role-selector">
                <select 
                  v-if="user._id !== currentUserId" 
                  :value="user.role" 
                  @change="changeRole(user._id, $event.target.value)"
                  :class="['role-select', user.role]"
                >
                  <option value="user">用户</option>
                  <option value="admin">管理员</option>
                </select>
                <span v-else :class="['role-badge', user.role]">
                  {{ user.role === 'admin' ? '管理员' : '用户' }}
                </span>
              </div>
            </td>
            <td>
              <span :class="['status-badge', user.isBanned ? 'banned' : 'active']">
                {{ user.isBanned ? '已封禁' : '正常' }}
              </span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button 
                  v-if="user.role !== 'admin'" 
                  @click="showBanDialog(user)" 
                  class="action-btn ban-btn"
                  :disabled="user.isBanned"
                >
                  {{ user.isBanned ? '已封禁' : '封禁' }}
                </button>
                <button 
                  v-if="user.isBanned" 
                  @click="unbanUser(user._id)" 
                  class="action-btn unban-btn"
                >
                  解封
                </button>
                <button 
                  v-if="user.role !== 'admin'" 
                  @click="deleteUser(user._id)" 
                  class="action-btn delete-btn"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="loadUsers(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="page-btn"
      >
        上一页
      </button>
      <span class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
      <button 
        @click="loadUsers(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        下一页
      </button>
    </div>

    <!-- 封禁对话框 -->
    <div v-if="showBanModal" class="modal-overlay" @click="closeBanDialog">
      <div class="modal" @click.stop>
        <h2>封禁用户</h2>
        <div class="form-group">
          <label>封禁理由</label>
          <textarea v-model="banForm.reason" placeholder="请输入封禁理由" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>封禁时长</label>
          <select v-model="banForm.duration">
            <option value="3">3天</option>
            <option value="7">7天</option>
            <option value="30">30天</option>
            <option value="90">90天</option>
            <option value="null">永久</option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="closeBanDialog" class="btn cancel-btn">取消</button>
          <button @click="confirmBan" class="btn confirm-btn">确认封禁</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const users = ref([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const showBanModal = ref(false)
const selectedUser = ref(null)
const banForm = ref({
  reason: '',
  duration: 7
})
const currentUserId = ref('')

const getCurrentUser = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  currentUserId.value = user.id || ''
}

const loadUsers = async (page = 1) => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/admin/users', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        page,
        limit: 10,
        search: searchQuery.value
      }
    })
    users.value = response.data.users
    currentPage.value = response.data.page
    totalPages.value = response.data.pages
  } catch (err) {
    console.error('加载用户列表失败:', err)
    alert('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const showBanDialog = (user) => {
  selectedUser.value = user
  banForm.value = {
    reason: '',
    duration: 7
  }
  showBanModal.value = true
}

const closeBanDialog = () => {
  showBanModal.value = false
  selectedUser.value = null
}

const confirmBan = async () => {
  if (!banForm.value.reason.trim()) {
    alert('请输入封禁理由')
    return
  }

  try {
    const token = localStorage.getItem('token')
    await axios.post(`/api/admin/users/${selectedUser.value._id}/ban`, {
      reason: banForm.value.reason,
      duration: banForm.value.duration === 'null' ? null : parseInt(banForm.value.duration)
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('封禁成功')
    closeBanDialog()
    loadUsers(currentPage.value)
  } catch (err) {
    console.error('封禁用户失败:', err)
    alert(err.response?.data?.message || '封禁用户失败')
  }
}

const unbanUser = async (userId) => {
  if (!confirm('确定要解封该用户吗？')) return

  try {
    const token = localStorage.getItem('token')
    await axios.post(`/api/admin/users/${userId}/unban`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('解封成功')
    loadUsers(currentPage.value)
  } catch (err) {
    console.error('解封用户失败:', err)
    alert('解封用户失败')
  }
}

const changeRole = async (userId, role) => {
  const roleText = role === 'admin' ? '管理员' : '用户'
  if (!confirm(`确定要将该用户设为${roleText}吗？`)) return

  try {
    const token = localStorage.getItem('token')
    await axios.put(`/api/admin/users/${userId}/role`, { role }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('角色修改成功')
    loadUsers(currentPage.value)
  } catch (err) {
    console.error('修改角色失败:', err)
    alert(err.response?.data?.message || '修改角色失败')
  }
}

const deleteUser = async (userId) => {
  if (!confirm('确定要删除该用户吗？此操作不可恢复！')) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete(`/api/admin/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('删除成功')
    loadUsers(currentPage.value)
  } catch (err) {
    console.error('删除用户失败:', err)
    alert('删除用户失败')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

onMounted(() => {
  getCurrentUser()
  loadUsers()
})
</script>

<style scoped>
.admin-users {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 2rem;
  color: #4CAF50;
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-bar input {
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-btn {
  padding: 0.8rem 2rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.search-btn:hover {
  background: #45a049;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.users-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.role-selector {
  display: inline-flex;
  align-items: center;
}

.role-select {
  padding: 0.25rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  background: white;
  min-width: 80px;
  text-align: center;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 12px;
}

.role-select:hover {
  border-color: #4CAF50;
  background-color: #f5f5f5;
}

.role-select.admin {
  border-color: #1976d2;
  background-color: #e3f2fd;
  color: #1976d2;
}

.role-select.admin:hover {
  background-color: #bbdefb;
  border-color: #1565c0;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.role-badge.admin {
  background: #e3f2fd;
  color: #1976d2;
}

.role-badge.user {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.banned {
  background: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background-color 0.3s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ban-btn {
  background: #ffebee;
  color: #d32f2f;
}

.ban-btn:hover:not(:disabled) {
  background: #ffcdd2;
}

.unban-btn {
  background: #e8f5e9;
  color: #388e3c;
}

.unban-btn:hover {
  background: #c8e6c9;
}

.delete-btn {
  background: #ffebee;
  color: #d32f2f;
}

.delete-btn:hover {
  background: #ffcdd2;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.page-btn {
  padding: 0.6rem 1.2rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.modal h2 {
  margin-bottom: 1.5rem;
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

.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.cancel-btn {
  background: #f0f0f0;
  color: #333;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  background: #d32f2f;
  color: white;
}

.confirm-btn:hover {
  background: #c62828;
}
</style>