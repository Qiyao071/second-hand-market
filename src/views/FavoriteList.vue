<template>
  <div class="favorite-list">
    <h2>我的收藏</h2>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="favorites.length === 0" class="empty">
      <p>暂无收藏的物品</p>
    </div>

    <div v-else class="items-grid">
      <div v-for="favorite in favorites" :key="favorite._id" class="item-card">
        <div class="item-image" @click="goToDetail(favorite.itemId._id)">
          <img v-if="favorite.itemId.images && favorite.itemId.images.length > 0" 
               :src="favorite.itemId.images[0]" 
               :alt="favorite.itemId.title">
          <div v-else class="no-image">暂无图片</div>
        </div>
        <div class="item-info">
          <div class="item-header">
            <h3 @click="goToDetail(favorite.itemId._id)">{{ favorite.itemId.title }}</h3>
            <button 
              class="favorite-btn favorited"
              @click.stop="toggleFavorite(favorite.itemId._id)"
            >
              <span class="star-icon">★</span>
            </button>
          </div>
          <p class="price">¥{{ favorite.itemId.price }}</p>
          <p class="category">{{ favorite.itemId.category }}</p>
          <p class="condition">{{ favorite.itemId.condition }}</p>
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
const favorites = ref([])
const loading = ref(false)

const fetchFavorites = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/favorites', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    if (response.data.success && response.data.data) {
      favorites.value = response.data.data
    } else {
      favorites.value = []
    }
  } catch (err) {
    console.error('获取收藏列表失败:', err)
    favorites.value = []
  } finally {
    loading.value = false
  }
}

const toggleFavorite = async (itemId) => {
  try {
    const token = localStorage.getItem('token')
    const headers = {
      Authorization: `Bearer ${token}`
    }
    const response = await axios.delete(`/api/favorites/${itemId}`, { headers })
    if (response.data.success) {
      favorites.value = favorites.value.filter(f => f.itemId._id !== itemId)
    } else {
      alert(response.data.message || '取消收藏失败')
    }
  } catch (err) {
    console.error('取消收藏失败:', err)
    alert(err.response?.data?.message || '操作失败')
  }
}

const goToDetail = (id) => {
  router.push(`/item/${id}`)
}

onMounted(() => {
  fetchFavorites()
})
</script>

<style scoped>
.favorite-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.favorite-list h2 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty {
  text-align: center;
  padding: 4rem;
  color: #999;
}

.empty p {
  font-size: 1.2rem;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.item-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.item-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  cursor: pointer;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
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

.price {
  font-size: 1.3rem;
  font-weight: bold;
  color: #e74c3c;
  margin: 0.5rem 0;
}

.category, .condition {
  font-size: 0.9rem;
  color: #666;
  margin: 0.3rem 0;
}

.favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0;
  transition: transform 0.2s;
}

.favorite-btn:hover {
  transform: scale(1.2);
}

.star-icon {
  color: #FFD700;
}
</style>