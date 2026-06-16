<template>
  <main class="app-page-shell space-y-5">
    <ConfirmDialog />

    <!-- ── Hero ──────────────────────────────────────────────────────── -->
    <section
      class="app-hero-banner"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">General Settings</div>
          <p class="max-w-3xl text-sm text-[rgb(var(--app-fg))]/70">
            Your account overview and quick access to all setup sections.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-[rgb(var(--app-fg))]/65">
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Signed in as: {{ currentUser?.name || "Unknown" }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/60 px-3 py-1">
              Role: {{ currentUser?.role_name || "Unknown role" }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <Message v-if="loadError" severity="error" :closable="false">{{ loadError }}</Message>

    <section v-if="canClearAppointmentsAndBillings" class="app-section-card-comfy space-y-4 border-red-200/80 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 class="app-section-title text-red-700 dark:text-red-300">Danger Zone</h3>
          <p class="max-w-3xl text-sm text-red-700/80 dark:text-red-200/80">
            Clear all appointment and billing records, including claim documents, receipts, SOAs, encounter tickets, and package credit usage. Patients, staff, services, and settings are kept.
          </p>
        </div>

        <Button
          label="Clear Appointments and Billings"
          icon="pi pi-trash"
          severity="danger"
          :loading="clearingAppointmentsAndBillings"
          :disabled="clearingAppointmentsAndBillings"
          @click="confirmClearAppointmentsAndBillings"
        />
      </div>
    </section>

    <!-- ── Your Account ───────────────────────────────────────────────── -->
    <section class="app-section-card-comfy space-y-4">
      <h3 class="app-section-title">Your Account</h3>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Name</div>
          <div class="mt-2 font-semibold break-words">{{ currentUser?.name || "—" }}</div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Email</div>
          <div class="mt-2 font-semibold break-all">{{ currentUser?.email || "—" }}</div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Job Title</div>
          <div class="mt-2 font-semibold">{{ currentUser?.role_name || "—" }}</div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Account Status</div>
          <div class="mt-2">
            <Tag :value="currentUser?.is_active ? 'Active' : 'Inactive'" :severity="currentUser?.is_active ? 'success' : 'secondary'" />
          </div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Provider Type</div>
          <div class="mt-2 font-semibold capitalize">
            {{ formatProviderType(currentUser?.appointment_provider_type) }}
          </div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Permissions</div>
          <div class="mt-2 font-semibold">{{ currentUser?.permissions?.length ?? 0 }} granted</div>
          <div class="mt-1 text-xs opacity-60">Managed through job title access rules.</div>
        </article>
      </div>
    </section>

    <!-- ── Setup Sections ─────────────────────────────────────────────── -->
    <section class="app-section-card-comfy space-y-4">
      <div>
        <h3 class="app-section-title">Setup Sections</h3>
        <p class="text-sm opacity-70">
          The clinic setup is split into two focused areas. Use the links below to navigate to the right section.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <!-- Admin Setup card -->
        <div
          class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-5 flex flex-col gap-3"
        >
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#242757] via-[#5E1869] to-[#A91D8B] text-white">
              <i class="pi pi-users text-[16px]" />
            </div>
            <div>
              <div class="font-semibold">Admin Setup</div>
              <div class="text-xs opacity-60">Owner-only section</div>
            </div>
          </div>

          <p class="text-sm opacity-70">
            Manage admin job titles, permissions, and admin staff accounts — clinic owners, managers, billing staff, and receptionists.
          </p>

          <div class="flex flex-wrap gap-2 text-xs">
            <span class="rounded-full border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-3 py-1">Admin Job Titles</span>
            <span class="rounded-full border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-3 py-1">Access Permissions</span>
            <span class="rounded-full border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-3 py-1">Admin Staff Directory</span>
          </div>

          <Button
            label="Go to Admin Setup"
            icon="pi pi-arrow-right"
            iconPos="right"
            :pt="ptPrimaryBtn"
            @click="$router.push({ name: 'admin-setup' })"
          />
        </div>

        <!-- PT Team Setup card -->
        <div
          class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-5 flex flex-col gap-3"
        >
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#10b981] text-white">
              <i class="pi pi-heart text-[16px]" />
            </div>
            <div>
              <div class="font-semibold">PT Team Setup</div>
              <div class="text-xs opacity-60">PT operations section</div>
            </div>
          </div>

          <p class="text-sm opacity-70">
            Set up PT job titles, specialties, and the PT staff directory. This is where physical therapists, assistants, and interns are managed.
          </p>

          <div class="flex flex-wrap gap-2 text-xs">
            <span class="rounded-full border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-3 py-1">PT Job Titles</span>
            <span class="rounded-full border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-3 py-1">Specialties</span>
            <span class="rounded-full border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-3 py-1">PT Staff Directory</span>
            <span class="rounded-full border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-3 py-1">Clinic Rooms</span>
          </div>

          <Button
            label="Go to PT Team Setup"
            icon="pi pi-arrow-right"
            iconPos="right"
            outlined
            :pt="ptOutlinedBtn"
            @click="$router.push({ name: 'pt-team-setup' })"
          />
        </div>
      </div>
    </section>

    <!-- ── System Information ─────────────────────────────────────────── -->
    <section class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="app-section-title">Patient Referrals</h3>
          <p class="text-sm opacity-70">Manage the referral sources shown in the patient form.</p>
        </div>

        <Button
          label="Manage Referral Sources"
          icon="pi pi-sliders-h"
          :pt="ptPrimaryBtn"
          @click="modeOfReferralManager?.open()"
        />
      </div>

      <ModeOfReferralManagerDialog ref="modeOfReferralManager" />
    </section>

    <section class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="app-section-title">Patient Clinical Dropdowns</h3>
          <p class="text-sm opacity-70">Manage the options shown in Patients Evaluation Visit Log.</p>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-3">
        <Button
          label="Medical Categories"
          icon="pi pi-list"
          severity="secondary"
          outlined
          @click="medicalCategoryManager?.open()"
        />
        <Button
          label="Doctor Diagnoses"
          icon="pi pi-stethoscope"
          severity="secondary"
          outlined
          @click="medicalDiagnosisManager?.open()"
        />
        <Button
          label="PT Case Impressions"
          icon="pi pi-clipboard"
          severity="secondary"
          outlined
          @click="ptCaseImpressionManager?.open()"
        />
      </div>

      <MedicalReferenceManagerDialog
        ref="medicalCategoryManager"
        title="Medical Categories"
        item-label="Medical category"
        endpoint="/references/medical-categories"
        description="These options appear in the Medical Category dropdown."
      />
      <MedicalReferenceManagerDialog
        ref="medicalDiagnosisManager"
        title="Doctor Diagnoses"
        item-label="Doctor diagnosis"
        endpoint="/references/medical-diagnoses"
        description="These options appear in the Doctor Diagnosis dropdown."
      />
      <MedicalReferenceManagerDialog
        ref="ptCaseImpressionManager"
        title="PT Case Impressions"
        item-label="PT case impression"
        endpoint="/references/pt-case-impressions"
        description="These options appear in the PT Case Impression dropdown."
      />
    </section>

    <section class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="app-section-title">Expense Items</h3>
          <p class="text-sm opacity-70">Manage the dropdown options shown when adding expenses in Reports.</p>
        </div>

        <Button
          label="Manage Expense Items"
          icon="pi pi-sliders-h"
          :pt="ptPrimaryBtn"
          @click="expenseItemManager?.open()"
        />
      </div>

      <ExpenseItemManagerDialog ref="expenseItemManager" />
    </section>

    <section class="app-section-card-comfy space-y-4">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="app-section-title">Evaluation Visit Dropdowns</h3>
          <p class="text-sm opacity-70">Manage the dropdown choices used by the Evaluation Visit Log.</p>
        </div>

        <Button
          label="Manage Evaluation Dropdowns"
          icon="pi pi-sliders-h"
          :pt="ptPrimaryBtn"
          @click="evaluationDropdownManager?.open()"
        />
      </div>

      <EvaluationDropdownManagerDialog ref="evaluationDropdownManager" />
    </section>

    <section class="app-section-card-comfy space-y-4">
      <h3 class="app-section-title">System Information</h3>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Application</div>
          <div class="mt-2 font-semibold">Physioave EMR</div>
          <div class="mt-1 text-xs opacity-60">Physical Therapy Management System</div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">Admin Setup</div>
          <div class="mt-2 font-semibold">
            <router-link :to="{ name: 'admin-setup' }" class="text-[#A91D8B] hover:underline">
              Open Admin Setup →
            </router-link>
          </div>
          <div class="mt-1 text-xs opacity-60">Job titles, permissions, and admin staff.</div>
        </article>

        <article class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-55">PT Team Setup</div>
          <div class="mt-2 font-semibold">
            <router-link :to="{ name: 'pt-team-setup' }" class="text-[#0ea5e9] hover:underline">
              Open PT Team Setup →
            </router-link>
          </div>
          <div class="mt-1 text-xs opacity-60">PT roles, specialties, and clinic rooms.</div>
        </article>
      </div>
    </section>

  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { storeToRefs } from "pinia"
import Button from "primevue/button"
import ConfirmDialog from "primevue/confirmdialog"
import Message from "primevue/message"
import Tag from "primevue/tag"
import { useConfirm } from "primevue/useconfirm"
import { useToast } from "primevue/usetoast"

import { ptOutlinedBtn, ptPrimaryBtn } from "@/features/shared/table-header.styles"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import ModeOfReferralManagerDialog from "@/features/general-settings/components/ModeOfReferralManagerDialog.vue"
import ExpenseItemManagerDialog from "@/features/general-settings/components/ExpenseItemManagerDialog.vue"
import MedicalReferenceManagerDialog from "@/features/general-settings/components/MedicalReferenceManagerDialog.vue"
import EvaluationDropdownManagerDialog from "@/features/general-settings/components/EvaluationDropdownManagerDialog.vue"

const authSession = useAuthSessionStore()
const { currentUser } = storeToRefs(authSession)
const confirm = useConfirm()
const toast = useToast()

const loadError = ref("")
const clearingAppointmentsAndBillings = ref(false)
const modeOfReferralManager = ref<InstanceType<typeof ModeOfReferralManagerDialog> | null>(null)
const expenseItemManager = ref<InstanceType<typeof ExpenseItemManagerDialog> | null>(null)
const medicalCategoryManager = ref<InstanceType<typeof MedicalReferenceManagerDialog> | null>(null)
const medicalDiagnosisManager = ref<InstanceType<typeof MedicalReferenceManagerDialog> | null>(null)
const ptCaseImpressionManager = ref<InstanceType<typeof MedicalReferenceManagerDialog> | null>(null)
const evaluationDropdownManager = ref<InstanceType<typeof EvaluationDropdownManagerDialog> | null>(null)
const clearConfirmationPhrase = "CLEAR_APPOINTMENTS_AND_BILLINGS"

const canClearAppointmentsAndBillings = computed(() => {
  const permissions = currentUser.value?.permissions ?? []
  return permissions.includes("AccessMatrix::DELETE") || permissions.includes("Appointment::DELETE")
})

const formatProviderType = (type?: string): string => {
  if (!type) return "—"
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    invalidInputHint: "The confirmation phrase did not match."
  })

const clearAppointmentsAndBillings = async (): Promise<void> => {
  clearingAppointmentsAndBillings.value = true
  try {
    const { data } = await pamsAPI.post<{ counts?: Record<string, number> }>(
      "/maintenance/clear-appointments-billings",
      { confirmation: clearConfirmationPhrase }
    )

    const clearedCount = Object.values(data.counts ?? {}).reduce((sum, value) => sum + Number(value ?? 0), 0)
    toast.add({
      severity: "success",
      summary: "Appointments and billings cleared",
      detail: `${clearedCount} related records were cleared.`,
      life: 5000
    })
  } catch (error: unknown) {
    toast.add({
      severity: "error",
      summary: "Clear failed",
      detail: extractApiErrorMessage(error, "Failed to clear appointments and billings"),
      life: 6000
    })
  } finally {
    clearingAppointmentsAndBillings.value = false
  }
}

const confirmClearAppointmentsAndBillings = (): void => {
  confirm.require({
    header: "Clear appointments and billings?",
    message: `This permanently clears appointment and billing records. Type ${clearConfirmationPhrase} in the next prompt to continue.`,
    icon: "pi pi-exclamation-triangle",
    rejectLabel: "Cancel",
    acceptLabel: "Continue",
    acceptClass: "p-button-danger",
    accept: () => {
      const typed = window.prompt(`Type ${clearConfirmationPhrase} to clear appointments and billings.`)
      if (typed !== clearConfirmationPhrase) {
        toast.add({
          severity: "warn",
          summary: "Clear cancelled",
          detail: "The confirmation phrase did not match.",
          life: 3500
        })
        return
      }

      void clearAppointmentsAndBillings()
    }
  })
}

onMounted(async () => {
  try {
    await authSession.ensureLoaded()
  } catch {
    loadError.value = "Could not load account information."
  }
})
</script>
