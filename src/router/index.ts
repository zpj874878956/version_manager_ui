import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 声明路由元数据类型
declare module 'vue-router' {
  interface RouteMeta {
    title: string
    requiresAuth: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '404', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/default/index.vue'),
    redirect: '/products',
    children: [
      {
        path: 'products',
        name: 'ProductList',
        component: () => import('@/views/products/index.vue'),
        meta: { title: '产品列表', requiresAuth: true }
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: () => import('@/views/products/detail.vue'),
        meta: { title: '产品详情', requiresAuth: true }
      },
      {
        path: 'versions/create',
        name: 'VersionCreate',
        component: () => import('@/views/versions/create.vue'),
        meta: { title: '创建版本', requiresAuth: true }
      },
      {
        path: 'versions/:id',
        name: 'VersionDetail',
        component: () => import('@/views/versions/detail.vue'),
        meta: { title: '版本详情', requiresAuth: true }
      },
      {
        path: 'versions',
        name: 'VersionList',
        component: () => import('@/views/versions/index.vue'),
        meta: { title: '版本列表', requiresAuth: true }
      },
      {
        path: 'permissions',
        name: 'Permissions',
        component: () => import('@/views/permissions/index.vue'),
        meta: { title: '权限管理', requiresAuth: true }
      },
      {
        path: 'logs',
        name: 'OperationLogs',
        component: () => import('@/views/logs/index.vue'),
        meta: { title: '操作日志', requiresAuth: true }
      },
      {
        path: 'analysis',
        name: 'DataAnalysis',
        component: () => import('@/views/analysis/index.vue'),
        meta: { title: '数据分析', requiresAuth: true }
      }
    ]
  },
  // 将匹配所有路径
  { path: '/:pathMatch(.*)*', redirect: '/404' }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 版本管理系统`
  }

  // 检查是否需要登录认证
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      next({ name: 'Login' })
      return
    }
  }
  next()
})

export default router