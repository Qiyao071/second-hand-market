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
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      requiresAuth: true
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
    path: '/my-items',
    name: 'MyItems',
    component: MyItems,
    meta: {
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isLoggedIn = !!localStorage.getItem('token')

  if (requiresAuth && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router