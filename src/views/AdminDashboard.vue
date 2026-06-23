<template>
  <div class="admin-dashboard">
    <h1>管理员仪表盘</h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users">👥</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalUsers }}</div>
          <div class="stat-label">总用户数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon items">📦</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.totalItems }}</div>
          <div class="stat-label">总物品数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon banned">🚫</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.bannedUsers }}</div>
          <div class="stat-label">被封禁用户</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon appeals">📝</div>
        <div class="stat-info">
          <div class="stat-number">{{ stats.pendingAppeals }}</div>
          <div class="stat-label">待处理申诉</div>
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <h2>快捷操作</h2>
      <div class="action-buttons">
        <router-link to="/admin/users" class="action-btn">
          <span>👥</span>
          <span>用户管理</span>
        </router-link>
        <router-link to="/admin/items" class="action-btn">
          <span>📦</span>
          <span>物品管理</span>
        </router-link>
        <router-link to="/admin/appeals" class="action-btn">
          <span>📝</span>
          <span>申诉管理</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const stats = ref({
  totalUsers: 0,
  totalItems: 0,
  bannedUsers: 0,
  pendingAppeals: 0
})

const loadStats = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/admin/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    stats.value = response.data
  } catch (err) {
    console.error('加载统计数据失败:', err)
    alert('加载统计数据失败')
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 2rem;
  color: #4CAF50;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.stat-icon.users {
  background-color: #e3f2fd;
}

.stat-icon.items {
  background-color: #e8f5e9;
}

.stat-icon.banned {
  background-color: #ffebee;
}

.stat-icon.appeals {
  background-color: #fff3e0;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.quick-actions {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.quick-actions h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-btn {
  background: #4CAF50;
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background: #45a049;
}

.action-btn span:first-child {
  font-size: 2rem;
}

.action-btn span:last-child {
  font-size: 1rem;
  font-weight: 500;
}
</style>