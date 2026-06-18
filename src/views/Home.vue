<template>
  <div class="home">
    <div class="hero">
      <h2>欢迎来到校园二手物品发布平台</h2>
      <p>这是一个专为校园学生设计的二手物品交易平台，您可以在这里发布和购买各种二手物品。</p>
    </div>

    <div class="features">
      <div class="feature-card" @click="goToPublish">
        <h3>物品发布</h3>
        <p>轻松发布您的二手物品，上传图片和详细描述</p>
      </div>
      <div class="feature-card" @click="goToItems">
        <h3>浏览物品</h3>
        <p>浏览各种二手物品，找到您需要的宝贝</p>
      </div>
      <div class="feature-card" @click="goToFavorites">
        <h3>物品收藏</h3>
        <p>收藏您感兴趣的物品，方便后续查看</p>
      </div>
    </div>

    <div class="items-section">
      <div class="section-header">
        <h3>热门物品</h3>
        <button @click="goToItems" class="view-more">查看更多</button>
      </div>
      
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="items.length === 0" class="empty-state">
        <p>暂无物品，快来发布第一个吧！</p>
        <button @click="goToPublish" class="empty-btn">去发布</button>
      </div>

      <div v-else class="items-grid">
        <div 
          v-for="item in items" 
          :key="item._id" 
          class="item-card"
          @click="goToItemDetail(item._id)"
        >
          <div class="item-image">
            <img :src="item.images && item.images[0] ? item.images[0] : '/default-image.jpg'" :alt="item.title" />
          </div>
          <div class="item-info">
            <h4>{{ item.title }}</h4>
            <p class="price">¥{{ item.price }}</p>
            <p class="category">{{ item.category }}</p>
            <div class="item-footer">
              <p class="status" :class="item.status">{{ item.status === 'available' ? '在售' : '已售出' }}</p>
              <span class="favorite-count">☆ {{ item.favoriteCount || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <div class="stat-item">
        <div class="stat-number">{{ stats.totalItems }}</div>
        <div class="stat-label">在售物品</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.totalUsers }}</div>
        <div class="stat-label">注册用户</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.totalSoldItems }}</div>
        <div class="stat-label">已售出物品</div>
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
const stats = ref({
  totalItems: 0,
  totalUsers: 0,
  totalSoldItems: 0
})

const goToPublish = () => {
  const token = localStorage.getItem('token')
  if (token) {
    router.push('/publish')
  } else {
    router.push('/login')
  }
}

const goToItems = () => {
  router.push('/items')
}

const goToFavorites = () => {
  const token = localStorage.getItem('token')
  if (token) {
    router.push('/favorites')
  } else {
    router.push('/login')
  }
}

const goToItemDetail = (itemId) => {
  router.push(`/item/${itemId}`)
}

const fetchItems = async () => {
  try {
    const response = await axios.get('/api/items', {
      params: {
        limit: 4,
        sort: 'favoriteCount',
        order: 'desc',
        status: 'available'
      }
    })
    if (response.data && response.data.items) {
      items.value = response.data.items
    }
  } catch (err) {
    console.error('获取物品列表失败:', err)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const response = await axios.get('/api/stats')
    if (response.data.success && response.data.data) {
      stats.value = response.data.data
    }
  } catch (err) {
    console.error('获取统计数据失败:', err)
  }
}

onMounted(() => {
  fetchItems()
  fetchStats()
})
</script>

<style scoped>
.home {
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 3rem 0;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border-radius: 12px;
  margin-bottom: 2rem;
  color: white;
}

.hero h2 {
  margin-bottom: 1rem;
  font-size: 2rem;
  color: white !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.feature-card {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  cursor: pointer;
  text-align: center;
}

.feature-card:hover {
  transform: translateY(-5px);
  background-color: #4CAF50;
}

.feature-card:hover h3,
.feature-card:hover p {
  color: white;
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: #4CAF50;
}

.feature-card p {
  color: #666;
  margin: 0;
}

.items-section {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.view-more {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.view-more:hover {
  background-color: #45a049;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.empty-btn:hover {
  background-color: #45a049;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.item-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.item-card:hover {
  transform: translateY(-6px);
  border-color: #4CAF50;
  box-shadow: 0 8px 20px rgba(76, 175, 80, 0.15);
}

.item-image {
  height: 160px;
  overflow: hidden;
  background-color: #eee;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  padding: 1rem;
}

.item-info h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price {
  margin: 0 0 0.25rem;
  font-size: 1.25rem;
  font-weight: bold;
  color: #e74c3c;
}

.category {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: #666;
}

.status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.status.available {
  background-color: #d4edda;
  color: #155724;
}

.status.sold {
  background-color: #f8d7da;
  color: #721c24;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-footer .favorite-count {
  font-size: 0.8rem;
  color: #999;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}
</style>