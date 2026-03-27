import {createRouter, createWebHistory} from 'vue-router'
import LoginView from '../../features/auth/pages/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '',
      name: 'login',
      component: LoginView,
      meta: {
        requiresAuth: false
      }
    },
    {
      path: '/error',
      name: 'error',
      component: () => import('@/app/pages/ErrorView.vue'),
      meta: {
        requiresAuth: false
      }
    },
    {
      path: "/:catchAll(.*)",
      name: 'not-found',
      component: () => import('@/app/pages/ErrorView.vue'),
      meta: {
        requiresAuth: false
      }
    },
    {
      path: '/home',
      name: 'home',
      component: () => import('../layouts/HomeLayout.vue'),
      meta: {requiresAuth: true},
      children: [
        {
          path: '',
          redirect: {name: 'dashboard'}
        },
        {
          path: '/dashboard',
          name: 'dashboard',
          component: () => import('@/features/dashboard/pages/DashboardView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/settings',
          name: 'settings',
          component: () => import('@/features/settings/pages/SettingsView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/clinics',
          name: 'clinics',
          component: () => import('@/features/clinics/pages/ClinicView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/refresh-tokens',
          name: 'refresh-tokens',
          component: () => import('@/features/refresh-tokens/pages/RefreshTokenView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/staffs',
          name: 'staffs',
          component: () => import('@/features/staff/pages/StaffView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/patients',
          name: 'patients',
          component: () => import('@/features/patients/pages/PatientView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/promos-offers',
          name: 'promos-offers',
          component: () => import('@/features/promos-offers/pages/PromosOffersView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/promos-offers/self-pay-single-service',
          name: 'promos-offers-single-service',
          component: () => import('@/features/promos-offers/pages/PromosOffersSingleServiceView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/promos-offers/self-pay-package-service',
          name: 'promos-offers-package-service',
          component: () => import('@/features/promos-offers/pages/PromosOffersPackageServiceView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/promos-offers/hmo',
          name: 'promos-offers-hmo',
          component: () => import('@/features/promos-offers/pages/PromosOffersHmoView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/promos-offers/lgu',
          name: 'promos-offers-lgu',
          component: () => import('@/features/promos-offers/pages/PromosOffersLguView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/hmos',
          name: 'hmos',
          component: () => import('@/features/hmos/pages/HMOView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/machines',
          name: 'machines',
          component: () => import('@/features/machines/pages/MachineView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/techniques',
          name: 'techniques',
          component: () => import('@/features/techniques/pages/TechniqueView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/evaluations',
          name: 'evaluations',
          component: () => import('@/features/evaluations/pages/EvaluationView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/appointments',
          name: 'appointments',
          component: () => import('@/features/appointments/pages/AppointmentView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/billing',
          name: 'billing',
          component: () => import('@/features/billing/pages/BillingView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/reports',
          name: 'reports',
          component: () => import('@/features/reports/pages/ReportView.vue'),
          meta: {requireAuth: true}
        },
      ]
    },
  ],
})

export default router
