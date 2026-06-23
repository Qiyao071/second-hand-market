import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Profile from './views/Profile.vue'
import Publish from './views/Publish.vue'
import ItemList from './views/ItemList.vue'
import ItemDetail from './views/ItemDetail.vue'
import Edit from './views/Edit.vue'
import FavoriteList from './views/FavoriteList.vue'
import EditProfile from './views/EditProfile.vue'
import MyItems from './views/MyItems.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import AdminUsers from './views/AdminUsers.vue'
import AdminItems from './views/AdminItems.vue'
import AdminAppeals from './views/AdminAppeals.vue'
import Appeal from './views/Appeal.vue'
import Messages from './views/Messages.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/profile/:id?',
    name: 'Profile',
    component: Profile,
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/publish',
    name: 'Publish',
    component: Publish,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/items',
    name: 'ItemList',
    component: ItemList
  },
  {
    path: '/item/:id',
    name: 'ItemDetail',
    component: ItemDetail
  },
  {
    path: '/edit/:id',
    name: 'Edit',
    component: Edit,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/favorites',
    name: 'FavoriteList',
    component: FavoriteList,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/edit-profile',
    name: 'EditProfile',
    component: EditProfile,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/my-items/:id?',
    name: 'MyItems',
    component: MyItems,
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/appeal',
    name: 'Appeal',
    component: Appeal,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: Messages,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsers,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/admin/items',
    name: 'AdminItems',
    component: AdminItems,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/admin/appeals',
    name: 'AdminAppeals',
    component: AdminAppeals,
    meta: {
      requiresAuth: true,
      requiresAdmin: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  const isLoggedIn = !!localStorage.getItem('token')

  if (requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (requiresAdmin) {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') {
      next('/')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router