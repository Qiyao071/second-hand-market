<template>
  <div class="app">
    <header class="header">
      <router-link to="/" class="logo">
        <h1>校园二手物品发布平台</h1>
      </router-link>
      <nav class="nav">
        <router-link to="/">首页</router-link>
        <router-link to="/items">浏览物品</router-link>
        <router-link v-if="!isLoggedIn" to="/login">登录</router-link>
        <router-link v-if="!isLoggedIn" to="/register">注册</router-link>
        <router-link v-if="isLoggedIn" to="/my-items">我的发布</router-link>
        <router-link v-if="isLoggedIn" to="/favorites">我的收藏</router-link>
        <router-link v-if="isLoggedIn" to="/messages">消息</router-link>
        <router-link v-if="isLoggedIn && isBanned" to="/appeal">申诉</router-link>
        <router-link v-if="isLoggedIn && isAdmin" to="/admin">管理后台</router-link>
        <router-link v-if="isLoggedIn" to="/profile">个人中心</router-link>
        <button v-if="isLoggedIn" @click="logout">退出登录</button>
      </nav>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const isLoggedIn = ref(false)
const isAdmin = ref(false)
const isBanned = ref(false)

const checkLoginStatus = () => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = !!token
  
  if (token) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    isAdmin.value = user.role === 'admin'
    isBanned.value = user.isBanned
  } else {
    isAdmin.value = false
    isBanned.value = false
  }
}

const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  isLoggedIn.value = false
  isAdmin.value = false
  isBanned.value = false
  router.push('/login')
}

onMounted(() => {
  checkLoginStatus()
})

watch(() => route.path, () => {
  checkLoginStatus()
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #4CAF50;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  color: white;
  text-decoration: none;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.logo:hover {
  opacity: 0.8;
}

.nav {
  display: flex;
  gap: 1rem;
}

.nav a {
  color: white;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav a:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav button {
  background-color: transparent;
  color: white;
  border: 1px solid white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.nav button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>