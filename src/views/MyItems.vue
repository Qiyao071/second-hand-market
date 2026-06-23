<template>
  <div class="container">
    <h2>{{ isOwnProfile ? '我的发布' : `${sellerName || '卖家'}的发布` }}</h2>
    
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="items.length === 0" class="empty">
      <p>暂无发布的物品</p>
      <button v-if="isOwnProfile" @click="goToPublish" class="publish-btn">去发布</button>
    </div>
    
    <div v-else class="items-grid">
      <div 
        v-for="item in items" 
        :key="item._id" 
        class="item-card"
        @click="goToDetail(item._id)"
      >
        <div class="item-image">
          <img :src="item.images[0] || 'https://via.placeholder.com/200'" alt="物品图片">
        </div>
        <div class="item-info">
          <h3>{{ item.title }}</h3>
          <p class="price">¥{{ item.price }}</p>
          <p class="category">{{ item.category }}</p>
          <p class="status" :class="item.status">{{ getStatusText(item.status) }}</p>
        </div>
        <div v-if="isOwnProfile" class="item-actions">
          <button 
            v-if="item.status !== 'removed'"
            @click.stop="toggleStatus(item._id, item.status)" 
            class="status-btn" 
            :class="item.status"
          >
            {{ item.status === 'available' ? '设为已售出' : '设为在售' }}
          </button>
          <button 
            v-if="item.status === 'removed'"
            @click.stop="openAppealModal(item)" 
            class="appeal-btn"
          >
            申诉
          </button>
          <button @click.stop="goToEdit(item._id)" class="edit-btn" :class="{ disabled: item.status === 'removed' }">编辑</button>
          <button @click.stop="deleteItem(item._id)" class="delete-btn">删除</button>
        </div>
      </div>
      <div v-if="isOwnProfile" class="item-card publish-card" @click="goToPublish">
        <div class="publish-content">
          <span class="plus-icon">+</span>
          <span class="publish-text">发布新物品</span>
        </div>
      </div>
    </div>

    <!-- 申诉模态框 -->
    <div v-if="showAppealModal" class="modal-overlay" @click="closeAppealModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>申诉 - {{ appealItem?.title }}</h3>
          <button @click="closeAppealModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <p class="appeal-item-info">物品名称：{{ appealItem?.title }}</p>
          <p class="appeal-item-info">下架原因：{{ appealItem?.removeReason || '未说明' }}</p>
          <div class="appeal-form">
            <label for="appeal-reason">申诉理由：</label>
            <textarea 
              id="appeal-reason"
              v-model="appealReason" 
              rows="4" 
              placeholder="请输入您的申诉理由..."
              class="appeal-textarea"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeAppealModal" class="cancel-btn">取消</button>
          <button @click="submitAppeal" class="submit-btn">提交申诉</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const items = ref([])
const loading = ref(true)
const sellerName = ref('')

// 申诉相关状态
const showAppealModal = ref(false)
const appealItem = ref(null)
const appealReason = ref('')

const isOwnProfile = computed(() => {
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}')
  const targetUserId = route.params.id || loggedInUser.id
  return targetUserId === loggedInUser.id
})

const fetchMyItems = async () => {
  loading.value = true
  try {
    const targetUserId = route.params.id
    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (targetUserId && targetUserId !== loggedInUser.id) {
      // 查看其他用户的发布
      const response = await axios.get(`/api/items/user/${targetUserId}`)
      items.value = response.data
      if (response.data.length > 0 && response.data[0].seller) {
        sellerName.value = response.data[0].seller.name
      }
    } else {
      // 查看自己的发布
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/items/user/my-items', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      items.value = response.data
    }
  } catch (err) {
    console.error('获取物品失败:', err)
    items.value = []
  } finally {
    loading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/item/${id}`)
}

const goToEdit = (id) => {
  router.push(`/edit/${id}`)
}

const goToPublish = () => {
  router.push('/publish')
}

const getStatusText = (status) => {
  const statusMap = {
    available: '在售',
    sold: '已售出',
    removed: '已下架',
    reserved: '已预约'
  }
  return statusMap[status] || status
}

const toggleStatus = async (id, currentStatus) => {
  // 已下架的物品不能直接改状态
  if (currentStatus === 'removed') {
    alert('已下架的物品需要通过申诉恢复')
    return
  }
  const newStatus = currentStatus === 'available' ? 'sold' : 'available'
  const statusText = newStatus === 'available' ? '在售' : '已售出'
  
  try {
    const token = localStorage.getItem('token')
    await axios.put(`/api/items/${id}`, { status: newStatus }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const item = items.value.find(item => item._id === id)
    if (item) {
      item.status = newStatus
    }
    alert(`已设为${statusText}`)
  } catch (err) {
    console.error('修改状态失败:', err)
    alert('修改状态失败，请稍后重试')
  }
}

const deleteItem = async (id) => {
  if (!confirm('确定要删除这个物品吗？')) {
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`/api/items/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    items.value = items.value.filter(item => item._id !== id)
    alert('删除成功')
  } catch (err) {
    console.error('删除物品失败:', err)
    alert('删除失败，请稍后重试')
  }
}

// 申诉相关方法
const openAppealModal = (item) => {
  appealItem.value = item
  appealReason.value = ''
  showAppealModal.value = true
}

const closeAppealModal = () => {
  showAppealModal.value = false
  appealItem.value = null
  appealReason.value = ''
}

const submitAppeal = async () => {
  if (!appealReason.value.trim()) {
    alert('请输入申诉理由')
    return
  }
  
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post('/api/appeals', {
      item: appealItem.value._id,
      type: 'item',
      reason: appealReason.value.trim()
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data.success) {
      alert('申诉提交成功，等待管理员处理')
      closeAppealModal()
    } else {
      alert(response.data.message || '申诉提交失败')
    }
  } catch (err) {
    console.error('提交申诉失败:', err)
    alert(err.response?.data?.message || '申诉提交失败，请稍后重试')
  }
}

onMounted(() => {
  fetchMyItems()
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

h2 {
  margin-bottom: 2rem;
  color: #4CAF50;
  text-align: center;
  font-size: 2rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty {
  text-align: center;
  padding: 4rem;
}

.empty p {
  color: #666;
  margin-bottom: 1rem;
}

.publish-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.publish-btn:hover {
  background-color: #45a049;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  padding-bottom: 2rem;
}

.item-card {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.item-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.publish-card {
  background-color: rgba(76, 175, 80, 0.05);
  border: 2px dashed #4CAF50;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 340px;
  transition: all 0.3s ease;
}

.publish-card:hover {
  transform: translateY(-6px);
  background-color: rgba(76, 175, 80, 0.1);
  border-color: #45a049;
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15);
}

.publish-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.plus-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.publish-card:hover .plus-icon {
  transform: scale(1.1);
  background-color: #45a049;
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.publish-text {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
  transition: color 0.3s ease;
}

.publish-card:hover .publish-text {
  color: #4CAF50;
}

.item-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  padding: 1rem;
}

.item-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price {
  margin: 0 0 0.3rem 0;
  color: #e74c3c;
  font-weight: bold;
  font-size: 1.3rem;
}

.category {
  margin: 0 0 0.3rem 0;
  color: #666;
  font-size: 0.9rem;
}

.status {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin: 0;
}

.status.available {
  background-color: #d4edda;
  color: #155724;
}

.status.sold {
  background-color: #f8d7da;
  color: #721c24;
}

.status.removed {
  background-color: #e0e0e0;
  color: #666;
}

.status-badge.removed {
  flex: 1;
  text-align: center;
  padding: 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  background-color: #e0e0e0;
  color: #666;
}

.edit-btn.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.edit-btn.disabled:hover {
  background-color: #ccc;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.status-btn {
  flex: 1;
  border: none;
  padding: 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.status-btn.available {
  background-color: #ff9800;
  color: white;
}

.status-btn.available:hover {
  background-color: #f57c00;
}

.status-btn.sold {
  background-color: #4CAF50;
  color: white;
}

.status-btn.sold:hover {
  background-color: #45a049;
}

.edit-btn {
  flex: 1;
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.delete-btn {
  flex: 1;
  background-color: #f44336;
  color: white;
  border: none;
  padding: 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

.appeal-btn {
  flex: 1;
  background-color: #9c27b0;
  color: white;
  border: none;
  padding: 0.6rem;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.appeal-btn:hover {
  background-color: #7b1fa2;
}

/* 模态框样式 */
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
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
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
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 1rem;
}

.appeal-item-info {
  margin: 0.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.appeal-form {
  margin-top: 1rem;
}

.appeal-form label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.appeal-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  resize: vertical;
  box-sizing: border-box;
}

.appeal-textarea:focus {
  outline: none;
  border-color: #9c27b0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.cancel-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-btn:hover {
  background-color: #f5f5f5;
}

.submit-btn {
  padding: 0.5rem 1rem;
  background-color: #9c27b0;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover {
  background-color: #7b1fa2;
}
</style>
