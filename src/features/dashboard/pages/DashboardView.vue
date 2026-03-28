<template>
  <DashboardModule />
</template>

<script setup lang="ts">
import {onMounted} from "vue"
import {useRouter} from "vue-router"
import {authMeService} from "@/services/auth-me.service"
import DashboardModule from "@/features/dashboard/components/DashboardModule.vue"

const router = useRouter()

onMounted(async () => {
  const me = await authMeService.get()
  if (me?.appointment_provider_type === "PHYSICAL_THERAPIST") {
    await router.replace({name: "pt-schedule"})
  }
})
</script>
