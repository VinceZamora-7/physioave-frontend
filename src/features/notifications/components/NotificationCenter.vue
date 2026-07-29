<template>
  <div>
    <button type="button" class="app-header-icon-btn relative" aria-label="Notifications" @click="toggle">
      <i class="pi pi-bell text-[17px]" />
      <span v-if="unreadCount" class="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white">
        {{ unreadCount > 99 ? "99+" : unreadCount }}
      </span>
    </button>

    <Popover ref="popover" @show="loadNotifications">
      <section class="w-[min(92vw,390px)]">
        <div class="flex items-center justify-between border-b border-surface-200 pb-3">
          <div>
            <h3 class="font-semibold text-surface-900">Notifications</h3>
            <p class="text-xs text-surface-500">{{ unreadCount }} unread</p>
          </div>
          <button v-if="unreadCount" class="text-xs font-medium text-primary-600" @click="markAllRead">Mark all read</button>
        </div>

        <div class="max-h-[420px] overflow-y-auto">
          <p v-if="loading" class="py-8 text-center text-sm text-surface-500">Loading notifications…</p>
          <p v-else-if="!notifications.length" class="py-8 text-center text-sm text-surface-500">No notifications yet.</p>
          <button
            v-for="item in notifications"
            v-else
            :key="item.id"
            type="button"
            class="block w-full border-b border-surface-100 px-1 py-3 text-left hover:bg-surface-50"
            :class="{ 'bg-primary-50/50': !item.read_at }"
            @click="openNotification(item)"
          >
            <div class="flex gap-3">
              <span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-700">
                <i class="pi pi-wallet text-sm" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-surface-900">{{ item.title }}</span>
                <span class="mt-1 block text-sm text-surface-600">{{ item.message }}</span>
                <span class="mt-1 block text-xs text-surface-400">
                  {{ item.created_by_name }} · {{ formatDate(item.created_at) }}
                </span>
              </span>
              <span v-if="!item.read_at" class="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
            </div>
          </button>
        </div>

        <button
          v-if="canSend"
          type="button"
          class="mt-3 w-full rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          @click="showCompose = true"
        >
          Notify billing managers
        </button>
      </section>
    </Popover>

    <Dialog v-model:visible="showCompose" modal header="Notify billing managers" :style="{ width: 'min(92vw, 480px)' }">
      <div class="space-y-4">
        <p class="text-sm text-surface-600">Send a direct reminder to active staff who can manage HMO billing status.</p>
        <div class="flex gap-5">
          <label class="flex items-center gap-2"><Checkbox v-model="payerTypes" input-id="notify-hmo" value="HMO" /><span>HMO</span></label>
          <label class="flex items-center gap-2"><Checkbox v-model="payerTypes" input-id="notify-lgu" value="LGU" /><span>LGU</span></label>
        </div>
        <div>
          <label for="notification-message" class="mb-1 block text-sm font-medium">Message (optional)</label>
          <Textarea id="notification-message" v-model="message" rows="4" maxlength="1000" fluid placeholder="Add details about what needs to be checked…" />
          <p class="mt-1 text-right text-xs text-surface-400">{{ message.length }}/1000</p>
        </div>
        <p v-if="sendError" class="text-sm text-red-600">{{ sendError }}</p>
      </div>
      <template #footer>
        <Button label="Cancel" severity="secondary" text @click="showCompose = false" />
        <Button label="Send notification" icon="pi pi-send" :loading="sending" :disabled="!payerTypes.length" @click="sendNotification" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import { useRouter } from "vue-router"
import Button from "primevue/button"
import Checkbox from "primevue/checkbox"
import Dialog from "primevue/dialog"
import Popover from "primevue/popover"
import Textarea from "primevue/textarea"
import { useToast } from "primevue/usetoast"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import { notificationService, type StaffNotification } from "@/features/notifications/api/notification.service"

const router = useRouter()
const auth = useAuthSessionStore()
const toast = useToast()
const popover = ref<InstanceType<typeof Popover> | null>(null)
const notifications = ref<StaffNotification[]>([])
const unreadCount = ref(0)
const loading = ref(false)
const showCompose = ref(false)
const payerTypes = ref<string[]>(["HMO", "LGU"])
const message = ref("")
const sending = ref(false)
const sendError = ref("")
let pollTimer: number | undefined

const canSend = computed(() => auth.isOwnerEquivalent)
const toggle = (event: Event) => popover.value?.toggle(event)

const refreshCount = async () => {
  try { unreadCount.value = await notificationService.unreadCount() } catch { /* regular auth flow handles errors */ }
}
const loadNotifications = async () => {
  loading.value = true
  try {
    notifications.value = await notificationService.list()
    unreadCount.value = notifications.value.filter(item => !item.read_at).length
  } finally {
    loading.value = false
  }
}
const markAllRead = async () => {
  await notificationService.markAllRead()
  notifications.value = notifications.value.map(item => ({ ...item, read_at: item.read_at || new Date().toISOString() }))
  unreadCount.value = 0
}
const openNotification = async (item: StaffNotification) => {
  if (!item.read_at) {
    await notificationService.markRead(item.id)
    item.read_at = new Date().toISOString()
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  popover.value?.hide()
  if (item.action_path) await router.push(item.action_path)
}
const sendNotification = async () => {
  sending.value = true
  sendError.value = ""
  try {
    const result = await notificationService.sendBillingReview({ payer_types: payerTypes.value, message: message.value.trim() || undefined })
    showCompose.value = false
    message.value = ""
    payerTypes.value = ["HMO", "LGU"]
    toast.add({
      severity: "success",
      summary: "Notification sent",
      detail: `Notified ${result.recipients} billing manager(s).`,
      life: 3500
    })
  } catch (error) {
    sendError.value = error instanceof Error ? error.message : "Unable to send notification"
  } finally {
    sending.value = false
  }
}
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))

onMounted(() => {
  void refreshCount()
  pollTimer = window.setInterval(() => void refreshCount(), 30_000)
})
onUnmounted(() => {
  if (pollTimer !== undefined) window.clearInterval(pollTimer)
})
</script>
