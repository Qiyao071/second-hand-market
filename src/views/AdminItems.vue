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
            {{ item.status === 'available' ? '在售' : '已售出' }}
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

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
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
</style>