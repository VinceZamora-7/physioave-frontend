import {createRouter, createWebHistory} from 'vue-router'
import { ROUTE_ACCESS_RULES, type RouteAccessRule } from '@/shared/permissions'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '',
      name: 'login',
      component: () => import('../../features/auth/pages/LoginView.vue'),
      meta: {
        requiresAuth: false
      }
    },
    {
      path: "/setup",
      name: "setup",
      component: () => import("@/features/setup/pages/SetupView.vue"),
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
          path: '/general-settings',
          name: 'general-settings',
          component: () => import('@/features/general-settings/pages/GeneralSettingsView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/pt-team-setup',
          name: 'pt-team-setup',
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
          path: '/admin-setup',
          name: 'admin-setup',
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
          path: '/appointments',
          name: 'appointments',
          component: () => import('@/features/appointments/pages/AppointmentView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/patient-daily-log',
          name: 'patient-daily-log',
          component: () => import('@/features/patient-daily-log/pages/PatientDailyLogView.vue'),
          meta: {requireAuth: true}
        },
        {
          path: '/my-schedule',
          name: 'pt-schedule',
          component: () => import('@/features/pt-schedule/pages/PtScheduleView.vue'),
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
          component: () => import('@/features/reports/pages/FinanceReportsView.vue'),
          meta: {requireAuth: true}
        },
      ]
    },
  ],
})

let userPermissions: string[] = []
let userRole: string = ''

const loadUserPermissions = async (): Promise<boolean> => {
  try {
    const {authMeService} = await import('@/services/auth-me.service')
    const user = await authMeService.get()
    if (!user) {
      userPermissions = []
      userRole = ''
      return false
    }

    userPermissions = user?.permissions ?? []
    userRole = user?.role_name ?? ''
    return true
  } catch {
    userPermissions = []
    userRole = ''
    return false
  }
}

const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some(permission => userPermissions.includes(permission))
}

const resolveFallbackRouteName = (blockedRouteName: string): string => {
  if (hasAnyPermission(ROUTE_ACCESS_RULES.dashboard?.anyOf ?? [])) {
    return 'dashboard'
  }

  const allowedEntry = Object.entries(ROUTE_ACCESS_RULES)
    .find(([routeName, rule]) => routeName !== blockedRouteName && hasAnyPermission(rule.anyOf))

  if (allowedEntry) {
    return allowedEntry[0]
  }

  return 'pt-schedule'
}

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth === false) {
    return next()
  }

  const hasAuthContext = await loadUserPermissions()
  if (!hasAuthContext) {
    return next({name: 'login'})
  }

  const routeName = String(to.name ?? "")

  const rule = ROUTE_ACCESS_RULES[routeName]
  if (rule) {
    if (!hasAnyPermission(rule.anyOf)) {
      return next({name: resolveFallbackRouteName(routeName)})
    }
  }

  next()
})

export default router
