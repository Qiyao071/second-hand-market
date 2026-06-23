<template>
  <div class="container">
    <h2>{{ isOwnProfile ? '个人中心' : '卖家信息' }}</h2>
    <div class="profile-info">
      <img :src="user.avatar || 'https://via.placeholder.com/100'" alt="头像" class="avatar">
      <div>
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>
      </div>
    </div>

    <div class="actions">
      <button v-if="isOwnProfile" @click="goToEditProfile" class="action-btn edit-btn">修改个人信息</button>
      <button @click="goToMyItems" class="action-btn items-btn">
        {{ isOwnProfile ? '我的发布' : '查看发布' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const user = ref({
  name: '',
  email: '',
  avatar: ''
})

const isOwnProfile = computed(() => {
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}')
  const targetUserId = route.params.id || loggedInUser.id
  return targetUserId === loggedInUser.id
})

const goToEditProfile = () => {
  router.push('/edit-profile')
}

const goToMyItems = () => {
  const userId = route.params.id || JSON.parse(localStorage.getItem('user') || '{}').id
  router.push(`/my-items/${userId}`)
}

const loadUserInfo = async () => {
  try {
    const targetUserId = route.params.id
    if (targetUserId) {
      const response = await axios.get(`/api/auth/users/${targetUserId}`)
      user.value = response.data
    } else {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      user.value = response.data
    }
  } catch (err) {
    console.error('加载用户信息失败:', err)
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 2rem;
  color: #4CAF50;
  text-align: center;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4CAF50;
}

.profile-info h3 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.profile-info p {
  margin: 0.5rem 0 0 0;
  color: #666;
}

.actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  flex: 1;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.items-btn {
  background-color: #4CAF50;
  color: white;
}

.items-btn:hover {
  background-color: #45a049;
}
</style>
