<template>
  <main class="min-h-screen bg-[rgb(var(--app-bg))] text-[rgb(var(--app-fg))]">
    <div class="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <header class="mb-6">
        <h1 class="text-2xl font-semibold tracking-tight">First-Run Setup</h1>
        <p class="mt-2 text-sm opacity-70">
          Create the first system administrator account and choose the top-level title used in the UI.
        </p>
      </header>

      <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-5">
        <Message v-if="errorMessage" severity="error" class="mb-4">{{ errorMessage }}</Message>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <IftaLabel>
            <InputText
              v-model="email"
              readonly
              class="opacity-70 cursor-not-allowed"
              fluid
            />
            <label>Verified Google Email</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="adminTitle"
              :options="adminTitleOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select title"
              :disabled="busy"
              fluid
            />
            <label>Your Professional Title</label>
          </IftaLabel>

          <div class="flex justify-end gap-2 pt-2">
            <Button
              type="submit"
              label="Create Admin Account"
              icon="pi pi-check"
              :loading="busy"
            />
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRouter, useRoute } from "vue-router"
import Button from "primevue/button"
import IftaLabel from "primevue/iftalabel"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
import { getSetupStatus, markSetupInitialized } from "@/app/setup-status"
import { pamsAPI } from "@/utils/axios-interceptor"

const router = useRouter()
const route = useRoute()

const email = ref("")
const adminTitleOptions = [{ label: "Owner", value: "Owner" }]
const adminTitle = ref("Owner")
const googleId = ref("")
const busy = ref(false)
const errorMessage = ref<string | null>(null)

const handleToken = () => {
  const tokenFromUrl = route.query.onboardingToken as string
  if (tokenFromUrl) {
    sessionStorage.setItem("onboardingToken", tokenFromUrl)
    return tokenFromUrl
  }
  return sessionStorage.getItem("onboardingToken") || ""
}

const onboardingToken = handleToken()

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const payloadSegment = token.split(".")[1]
  if (!payloadSegment) return null

  const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/")
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=")
  return JSON.parse(window.atob(paddedBase64)) as Record<string, unknown>
}

if (onboardingToken) {
  try {
    const payload = decodeJwtPayload(onboardingToken)
    if (typeof payload?.email === "string") email.value = payload.email
    if (typeof payload?.google_id === "string") googleId.value = payload.google_id
  } catch {
    sessionStorage.removeItem("onboardingToken")
  }
}

const loadStatus = async () => {
  try {
    const initialized = await getSetupStatus(true)
    if (initialized === null) {
      throw new Error("backend_unreachable")
    }

    if (initialized) {
      sessionStorage.removeItem("onboardingToken")
      await router.replace({ name: "login" })
      return
    }

    if (!onboardingToken || !email.value || !googleId.value) {
      sessionStorage.removeItem("onboardingToken")
      await router.replace({ name: "login" })
    }
  } catch {
    if (!onboardingToken) {
      await router.replace({
        name: "error",
        query: { error: "backend_unreachable" }
      })
      return
    }

    errorMessage.value = "We could not verify setup status because the backend server is unavailable. Please start the backend, then try again."
  }
}

const onSubmit = async () => {
  if (!onboardingToken) {
    errorMessage.value = "Session expired. Please log in with Google again."
    return
  }

  const title = adminTitle.value.trim()
  if (!title) {
    errorMessage.value = "Professional title is required."
    return
  }

  if (!email.value || !googleId.value) {
    sessionStorage.removeItem("onboardingToken")
    errorMessage.value = "Session expired. Please log in with Google again."
    return
  }

  errorMessage.value = null
  busy.value = true

  try {
    await pamsAPI.post(
      "/setup",
      {
        email: email.value,
        admin_title: title,
        google_id: googleId.value
      },
      {
        headers: { Authorization: `Bearer ${onboardingToken}` }
      }
    )

    markSetupInitialized()
    sessionStorage.removeItem("onboardingToken")
    await router.replace({ name: "dashboard" })
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message ?? "Setup failed. Please try again."
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  void loadStatus()
})
</script>
