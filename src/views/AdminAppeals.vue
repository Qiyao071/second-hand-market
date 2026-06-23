<template>
  <div class="admin-appeals">
    <h1>申诉管理</h1>
    
    <div class="filters">
      <select v-model="filterStatus" @change="loadAppeals">
        <option value="">全部状态</option>
        <option value="pending">待处理</option>
        <option value="approved">已通过</option>
        <option value="rejected">已拒绝</option>
      </select>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="appeals.length === 0" class="empty">
      <p>暂无申诉</p>
    </div>

    <div v-else class="appeals-list">
      <div v-for="appeal in appeals" :key="appeal._id" class="appeal-card">
        <div class="appeal-header">
          <div class="user-info">
            <img 
              :src="appeal.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${appeal.user?.name || 'user'}`" 
              :alt="appeal.user?.name"
              class="user-avatar"
            >
            <div>
              <div class="user-name">{{ appeal.user?.name || '未知' }}</div>
              <div class="user-email">{{ appeal.user?.email || '' }}</div>
            </div>
          </div>
          <span :class="['status-badge', appeal.status]">
            {{ getStatusText(appeal.status) }}
          </span>
        </div>
        
        <div class="appeal-content">
          <h3>申诉理由</h3>
          <p>{{ appeal.reason }}</p>
        </div>

        <!-- 物品信息 -->
        <div v-if="appeal.item" class="appeal-item">
          <h3>申诉物品</h3>
          <div class="item-preview">
            <img 
              v-if="appeal.item.images && appeal.item.images.length > 0" 
              :src="appeal.item.images[0]" 
              :alt="appeal.item.title"
              class="item-image"
            >
            <div class="item-info">
              <div class="item-title">{{ appeal.item.title }}</div>
              <div class="item-status">状态: {{ getItemStatusText(appeal.item.status) }}</div>
              <div class="item-reason">下架原因: {{ appeal.item.removeReason || '未说明' }}</div>
            </div>
          </div>
        </div>

        <div class="appeal-meta">
          <span>提交时间: {{ formatDate(appeal.createdAt) }}</span>
          <span v-if="appeal.processedAt">处理时间: {{ formatDate(appeal.processedAt) }}</span>
        </div>

        <div v-if="appeal.adminResponse" class="admin-response">
          <h3>管理员回复</h3>
          <p>{{ appeal.adminResponse }}</p>
        </div>

        <div v-if="appeal.status === 'pending'" class="appeal-actions">
          <button @click="showProcessDialog(appeal)" class="action-btn process-btn">处理申诉</button>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="loadAppeals(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="page-btn"
      >
        上一页
      </button>
      <span class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
      <button 
        @click="loadAppeals(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        下一页
      </button>
    </div>

    <!-- 处理申诉对话框 -->
    <div v-if="showProcessModal" class="modal-overlay" @click="closeProcessDialog">
      <div class="modal" @click.stop>
        <h2>处理申诉</h2>
        <div class="appeal-summary">
          <p><strong>用户:</strong> {{ selectedAppeal?.user?.name }}</p>
          <p><strong>申诉理由:</strong> {{ selectedAppeal?.reason }}</p>
        </div>
        <div class="form-group">
          <label>处理结果</label>
          <select v-model="processForm.status">
            <option value="approved">通过申诉</option>
            <option value="rejected">拒绝申诉</option>
          </select>
        </div>
        <div class="form-group">
          <label>管理员回复</label>
          <textarea v-model="processForm.adminResponse" placeholder="请输入回复内容" rows="3"></textarea>
        </div>
        <div class="modal-actions">
          <button @click="closeProcessDialog" class="btn cancel-btn">取消</button>
          <button @click="confirmProcess" class="btn confirm-btn">确认处理</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const appeals = ref([])
const loading = ref(true)
const filterStatus = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const showProcessModal = ref(false)
const selectedAppeal = ref(null)
const processForm = ref({
  status: 'approved',
  adminResponse: ''
})

const loadAppeals = async (page = 1) => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/admin/appeals', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        page,
        limit: 10,
        status: filterStatus.value
      }
    })
    appeals.value = response.data.appeals
    currentPage.value = response.data.page
    totalPages.value = response.data.pages
  } catch (err) {
    console.error('加载申诉列表失败:', err)
    alert('加载申诉列表失败')
  } finally {
    loading.value = false
  }
}

const showProcessDialog = (appeal) => {
  selectedAppeal.value = appeal
  processForm.value = {
    status: 'approved',
    adminResponse: ''
  }
  showProcessModal.value = true
}

const closeProcessDialog = () => {
  showProcessModal.value = false
  selectedAppeal.value = null
}

const confirmProcess = async () => {
  if (!processForm.value.adminResponse.trim()) {
    alert('请输入管理员回复')
    return
  }

  try {
    const token = localStorage.getItem('token')
    await axios.post(`/api/admin/appeals/${selectedAppeal.value._id}/process`, {
      status: processForm.value.status,
      adminResponse: processForm.value.adminResponse
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('处理成功')
    closeProcessDialog()
    loadAppeals(currentPage.value)
  } catch (err) {
    console.error('处理申诉失败:', err)
    alert('处理申诉失败')
  }
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return statusMap[status] || status
}

const getItemStatusText = (status) => {
  const statusMap = {
    available: '在售',
    sold: '已售出',
    removed: '已下架',
    reserved: '已预约'
  }
  return statusMap[status] || status
}

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  loadAppeals()
})
</script>

<style scoped>
.admin-appeals {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 2rem;
  color: #4CAF50;
}

.filters {
  margin-bottom: 2rem;
}

.filters select {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 150px;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.appeals-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.appeal-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.appeal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-email {
  font-size: 0.9rem;
  color: #666;
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

.appeal-content {
  margin-bottom: 1rem;
}

.appeal-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.appeal-content p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.appeal-item {
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.appeal-item h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #333;
}

.item-preview {
  display: flex;
  gap: 1rem;
}

.item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-title {
  font-weight: 600;
  color: #333;
}

.item-status {
  font-size: 0.9rem;
  color: #666;
}

.item-reason {
  font-size: 0.9rem;
  color: #999;
}

.appeal-meta {
  display: flex;
  gap: 2rem;
  font-size: 0.85rem;
  color: #999;
  margin-bottom: 1rem;
}

.admin-response {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.admin-response h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #333;
}

.admin-response p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.appeal-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 0.6rem 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.action-btn:hover {
  background: #45a049;
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
  max-width: 600px;
  width: 90%;
}

.modal h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.appeal-summary {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.appeal-summary p {
  margin: 0.5rem 0;
  color: #666;
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

.form-group select,
.form-group textarea {
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
  background: #4CAF50;
  color: white;
}

.confirm-btn:hover {
  background: #45a049;
}
</style>