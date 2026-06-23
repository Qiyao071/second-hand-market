<template>
  <div class="admin-items">
    <h1>物品管理</h1>
    
    <div class="filters">
      <select v-model="filterStatus" @change="loadItems">
        <option value="">全部状态</option>
        <option value="available">在售</option>
        <option value="sold">已售出</option>
      </select>
      <select v-model="filterCategory" @change="loadItems">
        <option value="">全部分类</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="搜索物品..." 
        @keyup.enter="loadItems"
      >
      <button @click="loadItems" class="search-btn">搜索</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="items.length === 0" class="empty">
      <p>暂无物品</p>
    </div>

    <div v-else class="items-grid">
      <div v-for="item in items" :key="item._id" class="item-card">
        <div class="item-image">
          <img :src="item.images[0] || 'https://via.placeholder.com/200'" :alt="item.title">
          <span :class="['status-badge', item.status]">
            {{ getStatusText(item.status) }}
          </span>
        </div>
        <div class="item-info">
          <h3>{{ item.title }}</h3>
          <p class="price">¥{{ item.price }}</p>
          <p class="category">{{ item.category }}</p>
          <p class="seller">卖家: {{ item.seller?.name || '未知' }}</p>
          <p class="date">{{ formatDate(item.createdAt) }}</p>
        </div>
        <div class="item-actions">
          <button @click="viewItem(item._id)" class="action-btn view-btn">查看</button>
          <button v-if="item.status === 'available'" @click="showRemoveModal(item)" class="action-btn remove-btn">下架</button>
          <button @click="deleteItem(item._id)" class="action-btn delete-btn">删除</button>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="loadItems(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="page-btn"
      >
        上一页
      </button>
      <span class="page-info">第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
      <button 
        @click="loadItems(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        下一页
      </button>
    </div>

    <!-- 下架确认弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <h3>下架商品</h3>
        <p>确定要下架商品「{{ selectedItem?.title }}」吗？</p>
        <div class="reason-section">
          <label>下架原因：</label>
          <div class="reason-options">
            <button 
              v-for="opt in reasonOptions" 
              :key="opt.value"
              @click="selectedReason = opt.value"
              :class="['reason-btn', { active: selectedReason === opt.value }]"
            >
              {{ opt.label }}
            </button>
          </div>
          <textarea 
            v-model="customReason" 
            placeholder="请输入详细原因（可选）"
            rows="3"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="closeModal" class="modal-btn cancel-btn">取消</button>
          <button @click="confirmRemove" class="modal-btn confirm-btn">确认下架</button>
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
const items = ref([])
const loading = ref(true)
const searchQuery = ref('')
const filterStatus = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const categories = ['电子产品', '书籍教材', '生活用品', '运动器材', '衣物鞋帽', '其他']

// 下架弹窗相关
const showModal = ref(false)
const selectedItem = ref(null)
const selectedReason = ref('')
const customReason = ref('')
const reasonOptions = [
  { label: '商品信息不实', value: '商品信息不实' },
  { label: '涉嫌违规内容', value: '涉嫌违规内容' },
  { label: '重复发布', value: '重复发布' },
  { label: '其他原因', value: '其他原因' }
]

const loadItems = async (page = 1) => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/admin/items', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        page,
        limit: 12,
        status: filterStatus.value,
        category: filterCategory.value,
        search: searchQuery.value
      }
    })
    items.value = response.data.items
    currentPage.value = response.data.page
    totalPages.value = response.data.pages
  } catch (err) {
    console.error('加载物品列表失败:', err)
    alert('加载物品列表失败')
  } finally {
    loading.value = false
  }
}

const viewItem = (itemId) => {
  router.push(`/item/${itemId}`)
}

const deleteItem = async (itemId) => {
  if (!confirm('确定要删除该物品吗？此操作不可恢复！')) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete(`/api/admin/items/${itemId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('删除成功')
    loadItems(currentPage.value)
  } catch (err) {
    console.error('删除物品失败:', err)
    alert('删除物品失败')
  }
}

const showRemoveModal = (item) => {
  selectedItem.value = item
  selectedReason.value = ''
  customReason.value = ''
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedItem.value = null
  selectedReason.value = ''
  customReason.value = ''
}

const confirmRemove = async () => {
  if (!selectedReason.value) {
    alert('请选择下架原因')
    return
  }

  try {
    const token = localStorage.getItem('token')
    const reason = selectedReason.value + (customReason.value ? ` - ${customReason.value}` : '')
    await axios.put(`/api/admin/items/${selectedItem.value._id}/remove`, { reason }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('下架成功，已通知卖家')
    closeModal()
    loadItems(currentPage.value)
  } catch (err) {
    console.error('下架物品失败:', err)
    alert(err.response?.data?.message || '下架物品失败')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
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

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.admin-items {
  max-width: 1400px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 2rem;
  color: #4CAF50;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filters select,
.filters input {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.filters select {
  min-width: 150px;
}

.filters input {
  flex: 1;
  min-width: 200px;
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

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.item-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s;
}

.item-card:hover {
  transform: translateY(-5px);
}

.item-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.available {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.sold {
  background: #ffebee;
  color: #d32f2f;
}

.status-badge.removed {
  background: #e0e0e0;
  color: #666;
}

.item-info {
  padding: 1rem;
}

.item-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price {
  color: #d32f2f;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

.category,
.seller,
.date {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.action-btn {
  flex: 1;
  padding: 0.6rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.view-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.view-btn:hover {
  background: #bbdefb;
}

.remove-btn {
  background: #fff3e0;
  color: #f57c00;
}

.remove-btn:hover {
  background: #ffe0b2;
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

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.modal-content p {
  color: #666;
  margin: 0 0 1.5rem 0;
}

.reason-section {
  margin-bottom: 1.5rem;
}

.reason-section label {
  display: block;
  margin-bottom: 0.75rem;
  color: #333;
  font-weight: 500;
}

.reason-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.reason-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #999;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  color: #666;
}

.reason-btn:hover {
  border-color: #4CAF50;
  color: #4CAF50;
  background: #f1f8e9;
}

.reason-btn.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.reason-section textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.modal-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background-color 0.3s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  background: #f57c00;
  color: white;
}

.confirm-btn:hover {
  background: #ef6c00;
}
</style>