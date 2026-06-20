import Login          from './pages/Login.js?v=1.0.26'
import Home            from './pages/Home.js?v=1.0.26'
import Dashboard       from './pages/Dashboard.js?v=1.0.26'
import Part            from './pages/Part.js?v=1.0.26'
import Kategori        from './pages/Kategori.js?v=1.0.26'
import Brand           from './pages/Brand.js?v=1.0.26'
import Supplier        from './pages/Supplier.js?v=1.0.26'
import TransaksiMasuk  from './pages/TransaksiMasuk.js?v=1.0.26'
import TransaksiKeluar from './pages/TransaksiKeluar.js?v=1.0.26'


const { createRouter, createWebHashHistory } = VueRouter

const routes = [
  { path: '/',                  redirect: '/home' },
  { path: '/login',             component: Login },
  { path: '/home',              component: Home },
  { path: '/dashboard',         component: Dashboard,       meta: { requiresAuth: true } },
  { path: '/part',              component: Part,            meta: { requiresAuth: true } },
  { path: '/kategori',          component: Kategori,        meta: { requiresAuth: true } },
  { path: '/brand',             component: Brand,           meta: { requiresAuth: true } },
  { path: '/supplier',          component: Supplier,        meta: { requiresAuth: true } },
  { path: '/transaksi-masuk',   component: TransaksiMasuk,  meta: { requiresAuth: true } },
  { path: '/transaksi-keluar',  component: TransaksiKeluar, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*',   redirect: '/login' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('token')
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
