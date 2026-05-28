<template>
  <div class="container">
    <h2>我的发布</h2>
    
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="items.length === 0" class="empty">
      <p>暂无发布的物品</p>
      <button @click="goToPublish" class="publish-btn">去发布</button>
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
          <p class="status" :class="item.status">{{ item.status === 'available' ? '在售' : '已售出' }}</p>
        </div>
        <div class="item-actions">
          <button @click.stop="toggleStatus(item._id, item.status)" class="status-btn" :class="item.status">
            {{ item.status === 'available' ? '设为已售出' : '设为在售' }}
          </button>
          <button @click.stop="goToEdit(item._id)" class="edit-btn">编辑</button>
          <button @click.stop="deleteItem(item._id)" class="delete-btn">删除</button>
        </div>
      </div>
      <div class="item-card publish-card" @click="goToPublish">
        <div class="publish-content">
          <span class="plus-icon">+</span>
          <span class="publish-text">发布新物品</span>
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

const fetchMyItems = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/items/user/my-items', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    items.value = response.data
  } catch (err) {
    console.error('获取我的物品失败:', err)
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

const toggleStatus = async (id, currentStatus) => {
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
</style>
