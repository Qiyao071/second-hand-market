<template>
  <div class="item-detail" v-if="item">
    <div class="detail-header">
      <button @click="goBack" class="back-btn">← 返回</button>
    </div>

    <div class="detail-content">
      <div class="image-section">
        <div class="main-image">
          <img v-if="currentImage" :src="currentImage" :alt="item.title">
          <div v-else class="no-image">暂无图片</div>
        </div>
        <div class="thumbnail-list" v-if="item.images && item.images.length > 1">
          <img
            v-for="(img, index) in item.images"
            :key="index"
            :src="img"
            :alt="'图片' + (index + 1)"
            :class="{ active: currentImage === img }"
            @click="currentImage = img"
          >
        </div>
      </div>

      <div class="info-section">
        <h1>{{ item.title }}</h1>
        <p class="price">¥{{ item.price }}</p>

        <div class="info-grid">
          <div class="info-item">
            <span class="label">分类：</span>
            <span class="value">{{ item.category }}</span>
          </div>
          <div class="info-item">
            <span class="label">新旧程度：</span>
            <span class="value">{{ item.condition }}</span>
          </div>
          <div class="info-item">
            <span class="label">发布时间：</span>
            <span class="value">{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">卖家：</span>
            <span class="value">{{ item.seller?.name || '未知' }}</span>
          </div>
        </div>

        <div class="description">
          <h3>物品描述</h3>
          <p>{{ item.description }}</p>
        </div>

        <div class="contact" v-if="item.contact">
          <h3>联系方式</h3>
          <p>{{ item.contact }}</p>
        </div>

        <div class="actions">
          <button v-if="isOwner" @click="handleEdit" class="edit-btn">编辑物品</button>
          <button v-if="isOwner" @click="handleDelete" class="delete-btn">删除物品</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="loading">加载中...</div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const item = ref(null)
const currentImage = ref('')

const isOwner = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return item.value?.seller?._id === user.id || item.value?.seller === user.id
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const fetchItemDetail = async () => {
  try {
    const response = await axios.get(`/api/items/${route.params.id}`)
    item.value = response.data
    if (response.data.images && response.data.images.length > 0) {
      currentImage.value = response.data.images[0]
    }
  } catch (err) {
    console.error('获取物品详情失败:', err)
    alert('物品不存在或已被删除')
    router.push('/items')
  }
}

const goBack = () => {
  router.back()
}

const handleEdit = () => {
  router.push(`/edit/${item.value._id}`)
}

const handleDelete = async () => {
  if (!confirm('确定要删除这个物品吗？')) return

  try {
    const token = localStorage.getItem('token')
    await axios.delete(`/api/items/${item.value._id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    alert('删除成功')
    router.push('/items')
  } catch (err) {
    alert(err.response?.data?.message || '删除失败')
  }
}

onMounted(() => {
  fetchItemDetail()
})
</script>

<style scoped>
.item-detail {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  margin-bottom: 1rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.back-btn:hover {
  background-color: #45a049;
}

.detail-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
}

.image-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-image {
  width: 100%;
  height: 400px;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 1.2rem;
}

.thumbnail-list {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
}

.thumbnail-list img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.3s;
}

.thumbnail-list img:hover {
  border-color: #ddd;
}

.thumbnail-list img.active {
  border-color: #4CAF50;
}

.info-section h1 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.8rem;
}

.price {
  font-size: 2rem;
  font-weight: bold;
  color: #4CAF50;
  margin: 1rem 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  font-weight: bold;
  color: #666;
}

.info-item .value {
  color: #333;
}

.description,
.contact {
  margin: 1.5rem 0;
}

.description h3,
.contact h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.description p,
.contact p {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.edit-btn,
.delete-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.edit-btn {
  background-color: #4CAF50;
  color: white;
}

.edit-btn:hover {
  background-color: #45a049;
}

.delete-btn {
  background-color: #ff4d4f;
  color: white;
}

.delete-btn:hover {
  background-color: #ff7875;
}

.loading {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
  color: #666;
}
</style>