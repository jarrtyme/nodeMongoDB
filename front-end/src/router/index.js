// 自动导入：createRouter, createWebHistory 等 API 已自动导入
// 注意：在 .js 配置文件中，建议保留手动导入以确保稳定性
import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Auth.vue'),
      meta: {
        keepAlive: false,
        title: '登录',
        requiresAuth: false
      }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Auth.vue'),
      meta: {
        keepAlive: false,
        title: '注册',
        requiresAuth: false
      }
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/home/Home.vue'),
      meta: {
        keepAlive: true,
        title: '首页',
        requiresAuth: false // 首页不需要登录
      }
    },
    {
      path: '/about',
      name: 'About',
      component: () => import('@/views/About.vue'),
      meta: {
        keepAlive: true,
        title: '关于我们',
        requiresAuth: false
      }
    }
  ]
})

// 路由守卫：处理需要登录的页面
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ${import.meta.env.VITE_APP_TITLE || 'Vue3 官网'}`
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 保存要访问的页面，登录后跳转回来
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else {
    // 允许访问所有页面（包括已登录时访问登录页，用于切换账号等场景）
    next()
  }
})

export default router
