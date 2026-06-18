<template>
  <div class="item-list">
    <h2>物品列表</h2>

    <div class="filters">
      <div class="filter-group">
        <label>物品分类：</label>
        <select v-model="filters.category" @change="handleFilterChange">
          <option value="">全部</option>
          <option value="书籍">书籍</option>
          <option value="电子产品">电子产品</option>
          <option value="生活用品">生活用品</option>
          <option value="服装">服装</option>
          <option value="家具">家具</option>
          <option value="运动器材">运动器材</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div class="filter-group">
        <label>排序方式：</label>
        <select v-model="filters.sort" @change="handleFilterChange">
          <option value="createdAt">按发布时间</option>
          <option value="price">按价格</option>
          <option value="favoriteCount">按收藏数</option>
        </select>
      </div>

      <div class="filter-group">
        <label>排序：</label>
        <select v-model="filters.order" @change="handleFilterChange">
          <option value="desc">降序</option>
          <option value="asc">升序</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="items.length === 0" class="empty">
      <p>暂无物品</p>
    </div>

    <div v-else class="items-grid">
      <div v-for="item in items" :key="item._id" class="item-card">
        <div class="item-image" @click="goToDetail(item._id)">
          <img v-if="item.images && item.images.length > 0" :src="item.images[0]" :alt="item.title">
          <div v-else class="no-image">暂无图片</div>
        </div>
        <div class="item-info">
          <div class="item-header">
            <h3 @click="goToDetail(item._id)">{{ item.title }}</h3>
            <div class="favorite-section">
              <button 
                v-if="isLoggedIn"
                class="favorite-btn" 
                :class="{ favorited: favorites.has(item._id) }"
                @click.stop="toggleFavorite(item._id)"
              >
                <span class="star-icon">{{ favorites.has(item._id) ? '★' : '☆' }}</span>
              </button>
              <span class="favorite-count">{{ item.favoriteCount || 0 }}</span>
            </div>
          </div>
          <p class="price">¥{{ item.price }}</p>
          <p class="category">{{ item.category }}</p>
          <p class="condition">{{ item.condition }}</p>
          <p class="seller">卖家：{{ item.seller?.name || '未知' }}</p>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const items = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const favorites = ref(new Set())

const filters = ref({
  category: '',
  sort: 'createdAt',
  order: 'desc'
})

const isLoggedIn = () => {
  return localStorage.getItem('token') !== null
}

const fetchItems = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: 12,
      sort: filters.value.sort,
      order: filters.value.order
    }

    if (filters.value.category) {
      params.category = filters.value.category
    }

    const response = await axios.get('/api/items', { params })
    items.value = response.data.items
    total.value = response.data.total
    totalPages.value = response.data.pages
    
    if (isLoggedIn()) {
      await fetchFavorites()
    }
  } catch (err) {
    console.error('获取物品列表失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchFavorites = async () => {
  try {
    favorites.value.clear()
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/favorites', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (response.data.success && response.data.data) {
      response.data.data.forEach(fav => {
        if (fav.itemId) {
          favorites.value.add(fav.itemId._id.toString())
        }
      })
    }
  } catch (err) {
    console.error('获取收藏列表失败:', err)
  }
}

const toggleFavorite = async (itemId) => {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: `Bearer ${token}`
    }
    
    if (favorites.value.has(itemId)) {
      const response = await axios.delete(`/api/favorites/${itemId}`, { headers })
      if (response.data.success) {
        favorites.value.delete(itemId)
      } else {
        alert(response.data.message || '取消收藏失败')
      }
    } else {
      const response = await axios.post(`/api/favorites/${itemId}`, {}, { headers })
      if (response.data.success) {
        favorites.value.add(itemId)
      } else {
        alert(response.data.message || '收藏失败')
      }
    }
  } catch (err) {
    console.error('收藏操作失败:', err)
    alert(err.response?.data?.message || '操作失败')
  }
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchItems()
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchItems()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchItems()
  }
}

const goToDetail = (id) => {
  router.push(`/item/${id}`)
}

onMounted(() => {
  fetchItems()
})
</script>

<style scoped>
.item-list {
  padding: 1rem;
}

h2 {
  margin-bottom: 1.5rem;
  color: #4CAF50;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: bold;
  color: #333;
}

.filter-group select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.filter-group select:focus {
  outline: none;
  border-color: #4CAF50;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.item-card {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.item-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 0.9rem;
}

.item-info {
  padding: 1rem;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.item-info h3:hover {
  color: #4CAF50;
}

.favorite-section {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.3rem;
  padding: 0;
  transition: transform 0.2s;
}

.favorite-btn:hover {
  transform: scale(1.2);
}

.star-icon {
  color: #ddd;
}

.favorite-btn.favorited .star-icon {
  color: #FFD700;
}

.favorite-count {
  font-size: 0.85rem;
  color: #999;
  min-width: 1.5rem;
  text-align: center;
}

.item-info .price {
  font-size: 1.3rem;
  font-weight: bold;
  color: #4CAF50;
  margin: 0.5rem 0;
}

.item-info .category,
.item-info .condition,
.item-info .seller {
  font-size: 0.9rem;
  color: #666;
  margin: 0.3rem 0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.6rem 1.2rem;
  border: 1px solid #4CAF50;
  background-color: white;
  color: #4CAF50;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination button:hover:not(:disabled) {
  background-color: #4CAF50;
  color: white;
}

.pagination button:disabled {
  border-color: #ccc;
  color: #ccc;
  cursor: not-allowed;
}

.pagination span {
  color: #666;
  font-size: 1rem;
}
</style>