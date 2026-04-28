<template>
  <main class="app-page-shell space-y-5">

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
          <h3 class="app-section-title">Monthly Expense Templates</h3>
          <p class="text-sm opacity-70">Set recurring monthly expenses once, then apply them each month in Reports.</p>
        </div>

        <Button
          label="Manage Monthly Templates"
          icon="pi pi-sliders-h"
          :pt="ptPrimaryBtn"
          @click="monthlyExpenseTemplateManager?.open()"
        />
      </div>

      <MonthlyExpenseTemplateManagerDialog ref="monthlyExpenseTemplateManager" />
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
import { onMounted, ref } from "vue"
import Button from "primevue/button"
import Message from "primevue/message"
import Tag from "primevue/tag"
import { useRouter } from "vue-router"

import { authMeService, type AuthMe } from "@/services/auth-me.service"
import { ptOutlinedBtn, ptPrimaryBtn } from "@/features/shared/table-header.styles"
import ModeOfReferralManagerDialog from "@/features/general-settings/components/ModeOfReferralManagerDialog.vue"
import ExpenseItemManagerDialog from "@/features/general-settings/components/ExpenseItemManagerDialog.vue"
import MonthlyExpenseTemplateManagerDialog from "@/features/general-settings/components/MonthlyExpenseTemplateManagerDialog.vue"

const router = useRouter()

const currentUser = ref<AuthMe>()
const loadError = ref("")
const modeOfReferralManager = ref<InstanceType<typeof ModeOfReferralManagerDialog> | null>(null)
const expenseItemManager = ref<InstanceType<typeof ExpenseItemManagerDialog> | null>(null)
const monthlyExpenseTemplateManager = ref<InstanceType<typeof MonthlyExpenseTemplateManagerDialog> | null>(null)

const formatProviderType = (type?: string): string => {
  if (!type) return "—"
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

onMounted(async () => {
  try {
    currentUser.value = await authMeService.get()
  } catch {
    loadError.value = "Could not load account information."
  }
})
</script>
