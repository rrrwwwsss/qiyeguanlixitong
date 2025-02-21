import Vue from 'vue'
import VueRouter from 'vue-router'
import NavigationStore from '@/store/NavigationStore'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Main',
    component: () => import('@/views/Main.vue'),
    redirect: '/home',
    children: []
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 路由守卫
let isFirstLoad = true
router.beforeEach((to, from, next) => {

  const isAuthenticated = !!localStorage.getItem('user')
  const publicPages = ['Login', 'Register']

  /*
    1. 变量
      isFirstLoad，为全局变量，用于判断页面是否为初次加载。初次加载：用户在刷新页面等情境下，动态路由被清除且尚未生成。
      isAuthenticated，用于判断用户是否已登录。如果未登录，则没有权限访问非公共页面，任何去往非公共页面的跳转都会被导航至登录页面。
      publicPages，公共页面的定义。当前只有登录页面和注册页面为公共页面。
    2. 逻辑
      (1) 当用户访问公共页面时，直接跳转，不进行登录检测和初次加载检测。因为公共页面为静态路由，不根据权限动态生成。
      (2) 当用户访问在未登录状态下访问非公共页面时，将会被强制跳转到登录页面，不进行初次加载检测。
      (3) 当用户在登录状态下访问公共页面时，将会进行初次加载检测。若当前为初次加载，则从动态菜单中重新生成动态路由；若不为初次加载，则直接导航至对应页面。
   */

  if (publicPages.includes(to.name)) {
      next()
  } else if (!isAuthenticated) {
    next({name: 'Login'})
  } else {
    NavigationStore.commit('setCurrentPage', to.name)
    if (isFirstLoad) {
      isFirstLoad = false
      NavigationStore.commit('generateRoutes')
      next({...to, replace: true})
    } else {
      next()
    }
  }
})

export default router
