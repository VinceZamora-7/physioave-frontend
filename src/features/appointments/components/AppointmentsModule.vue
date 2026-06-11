<template>
  <main class="app-page-shell space-y-5">
    <section class="app-appointment-card app-appointment-card-accent p-4 sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <h2 class="app-appointment-title text-xl">Appointments Overview</h2>
          <p class="app-appointment-muted max-w-2xl text-sm leading-6">
            Manage clinic appointments, filter schedules, and review booking status from one view.
          </p>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="app-appointment-chip">Date: {{ selectedDateLabel }}</span>
            <span class="app-appointment-chip">Clinic Branch: {{ selectedClinic?.label || "All branches" }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-4 lg:items-end">
          <Button
            v-if="canCreateAppointment"
            label="Add Appointment"
            icon="pi pi-plus"
            :pt="ptPrimaryBtn"
            class="w-full sm:w-auto"
            @click="openCreateDialog"
          />
          <div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <article class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">Total Appointments</p>
              <p class="app-appointment-value mt-1 text-2xl font-semibold">{{ totalAppointmentsCount }}</p>
            </article>
            <article class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">Rescheduled / Canceled</p>
              <p class="app-appointment-value mt-1 text-2xl font-semibold">{{ rescheduledOrCanceledAppointmentsCount }}</p>
            </article>
            <article class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">Unbilled Appointments</p>
              <p class="app-appointment-value mt-1 text-2xl font-semibold">{{ unbilledAppointmentsCount }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <AppointmentScheduleCalendar
      :appointments="calendarAppointments"
      :loading="isCalendarLoading"
      :can-add-appointment="canCreateAppointment"
      :can-view-appointment="canViewAppointmentDetails"
      @addAppointment="openCreateDialog"
      @selectAppointment="openDetailsDialog"
      @selectDate="selectCalendarDate"
      @visible-range-change="loadCalendarAppointmentsForRange"
    />

    <section class="app-appointment-card space-y-4 p-4 sm:p-5">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 class="app-appointment-title text-lg">Appointment Records</h3>
          <p class="app-appointment-muted text-sm">Search, filter, and manage appointment rows.</p>
        </div>
        <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined :loading="isLoading || isCalendarLoading" @click="refreshAppointmentViews" />
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <InputText v-model="filters.search" placeholder="Search patient" />
        <Select
          v-model="filters.ptId"
          :options="ptFilterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="PT"
          showClear
          filter
        />
        <Select v-model="filters.payerType" :options="payerOptionsWithAll" optionLabel="label" optionValue="value" placeholder="Billing Type" showClear />
        <Select v-model="filters.billingStatus" :options="billingStatusOptions" optionLabel="label" optionValue="value" placeholder="Billing Status" showClear />
        <Select v-model="filters.attendanceStatus" :options="attendanceStatusOptions" optionLabel="label" optionValue="value" placeholder="Attendance Status" showClear />
      </div>

      <DataTable
        class="app-data-table"
        :value="appointments"
        :loading="isLoading"
        size="small"
        paginator
        :rows="pageSize"
        :totalRecords="totalRecords"
        lazy
        @page="onPage"
      >
        <template #empty>
          <div class="py-10 text-center text-sm opacity-70">No appointments found.</div>
        </template>

        <Column field="patient_name" header="Patient Details" style="min-width: 240px">
          <template #body="{ data }">
            <button
              v-if="canViewAppointmentDetails"
              type="button"
              class="text-left"
              @click="openDetailsDialog(data)"
            >
              <div class="font-semibold text-[rgb(var(--app-fg))] hover:underline">{{ data.patient_name || "Unnamed patient" }}</div>
              <div class="mt-0.5 text-xs opacity-60">Details include planned services</div>
            </button>
            <div v-else>
              <div class="font-semibold text-[rgb(var(--app-fg))]">{{ data.patient_name || "Unnamed patient" }}</div>
              <div class="mt-0.5 text-xs opacity-60">Details restricted</div>
            </div>
          </template>
        </Column>
        <Column field="starts_at" header="Schedule" style="min-width: 210px">
          <template #body="{ data }">
            <div class="space-y-1">
              <div class="font-medium">{{ formatDate(data.starts_at) }}</div>
              <div class="text-xs opacity-60">{{ formatTime(data.starts_at) }} - {{ formatTime(data.ends_at) }}</div>
            </div>
          </template>
        </Column>
        <Column header="Session" style="width: 110px">
          <template #body="{ data }">
            <Tag
              :value="`${data.session_sequence || 1}/${data.total_sessions || 1}`"
              severity="secondary"
            />
          </template>
        </Column>
        <Column field="provider_name" header="PT" style="min-width: 180px">
          <template #body="{ data }">{{ data.provider_name || "Unassigned" }}</template>
        </Column>
        <Column field="clinic_name" header="Clinic" style="min-width: 160px" />
        <Column field="payer_type" header="Billing Type" style="min-width: 150px">
          <template #body="{ data }">
            <Tag :value="formatPayer(data.payer_type)" severity="info" />
          </template>
        </Column>
        <Column header="Billing Status" style="min-width: 150px">
          <template #body="{ data }">
            <Tag :value="displayBillingStatus(data)" :severity="billingStatusSeverity(data)" />
          </template>
        </Column>
        <Column header="Attendance Status" style="min-width: 180px">
          <template #body="{ data }">
            <div class="flex flex-col items-start gap-1">
              <Tag :value="displayAttendanceStatus(data)" :severity="attendanceStatusSeverity(data)" />
              <Tag
                v-if="isRescheduledAppointment(data)"
                value="Rescheduled"
                severity="warn"
                class="text-[10px]"
              />
            </div>
          </template>
        </Column>
        <Column header="Actions" style="min-width: 190px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button v-if="canViewAppointmentDetails" icon="pi pi-eye" text rounded severity="secondary" aria-label="Details" @click="openDetailsDialog(data)" />
              <Button v-if="canMarkAttendance" icon="pi pi-check-square" text rounded severity="success" aria-label="Attendance" @click="openAttendanceDialog(data)" />
              <Button v-if="canEditAppointment" icon="pi pi-pencil" text rounded severity="secondary" aria-label="Edit" @click="openEditDialog(data)" />
              <Button
                v-if="canCancelAppointment"
                icon="pi pi-ban"
                text
                rounded
                severity="danger"
                aria-label="Cancel Appointment"
                :disabled="normalizeAttendanceStatus(data) === 'CANCELED'"
                @click="cancelAppointment(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

<AppointmentDetailsModal
  v-model:visible="detailsVisible"
  :appointment="detailAppointment"
  :planned-services="detailPlannedServices"
  :consumed-services="detailFlowSummary?.consumed_services ?? []"
  :billing-preparation="detailBillingPreparation"
  :billing-document="detailFlowSummary?.billing_document ?? null"
  :format-date="formatDate"
  :format-time="formatTime"
  :format-payer="formatPayer"
  :status-severity="statusSeverity"
  :display-appointment-phase="displayAppointmentPhase"
  :display-location-context="displayLocationContext"
  :display-laterality="displayLaterality"
  :format-optional-number="formatOptionalNumber"
  :can-edit="canEditAppointment"
  :can-mark-attendance="canMarkAttendance"
  :is-billing-action-loading="isBillingActionLoading"
  @edit="editFromDetails"
  @attendance="openAttendanceFromDetails"
  @open-billing="openAppointmentBillingDialog"
  @create-self-pay-appointment-bill="createSelfPayAppointmentBillFromDetails"
  @create-self-pay-package-bill="createSelfPayPackageBillFromDetails"
  @create-session-documentation-invoice="createSessionDocumentationInvoiceFromDetails"
/>

    <Dialog
      v-model:visible="appointmentBillingVisible"
      modal
      header="Appointment Billing"
      :style="{ width: '48rem', maxWidth: '96vw' }"
      :draggable="false"
    >
      <div v-if="detailBillingPreparation" class="space-y-4">
        <section class="app-appointment-card app-appointment-card-accent space-y-3">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Billing Path</p>
              <h4 class="app-appointment-title mt-1 text-base">
                {{ formatBillingPreparationStatus(detailBillingPreparation.billing_path.next_document_type) }}
              </h4>
              <p class="app-appointment-muted mt-1 text-sm">
                {{ detailBillingPreparation.billing_path.message }}
              </p>
            </div>
            <Tag
              :value="formatBillingPreparationStatus(detailBillingPreparation.billing_path.status)"
              :severity="billingPreparationSeverity"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs uppercase tracking-wide">Charge Scope</p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">{{ formatBillingPreparationStatus(detailBillingPreparation.billing_path.charge_scope) }}</p>
            </div>
            <div class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs uppercase tracking-wide">Tendering</p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">{{ detailBillingPreparation.billing_path.requires_tendering ? "Required" : "Not required" }}</p>
            </div>
            <div class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs uppercase tracking-wide">Consumed</p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">{{ detailBillingPreparation.consumed_services.count }}</p>
            </div>
            <div class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs uppercase tracking-wide">Prepared Amount</p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">{{ formatCurrency(detailBillingPreparation.consumed_services.subtotal) }}</p>
            </div>
          </div>
        </section>

        <section class="app-appointment-card space-y-3">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 class="app-appointment-title text-base">Billing Actions</h4>
              <p class="app-appointment-muted mt-1 text-sm">Create, tender, or print the appointment invoice.</p>
            </div>
          </div>

          <div
            v-if="detailBillingPreparation.billing_path.action === 'CREATE_HMO_CLAIM'"
            class="grid grid-cols-1 gap-3 rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3 sm:grid-cols-2"
          >
            <div class="space-y-1">
              <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">LOA Number</label>
              <InputText v-model="hmoClaimForm.loa_number" class="w-full" placeholder="Enter LOA number" />
            </div>
            <div class="space-y-1">
              <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Approval Code</label>
              <InputText v-model="hmoClaimForm.approval_code" class="w-full" placeholder="Optional approval code" />
            </div>
            <div class="space-y-1 sm:col-span-2">
              <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Claim Notes</label>
              <Textarea v-model="hmoClaimForm.notes" class="w-full" rows="2" autoResize placeholder="Optional HMO claim notes" />
            </div>
          </div>

          <div
            v-if="detailBillingPreparation.billing_path.action === 'CREATE_LGU_CLAIM'"
            class="grid grid-cols-1 gap-3 rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3 sm:grid-cols-2"
          >
            <div class="space-y-1">
              <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Approval Code</label>
              <InputText v-model="lguClaimForm.approval_code" class="w-full" placeholder="Optional approval code" />
            </div>
            <div class="space-y-1 sm:col-span-2">
              <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Claim Notes</label>
              <Textarea v-model="lguClaimForm.notes" class="w-full" rows="2" autoResize placeholder="Optional LGU claim notes" />
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              v-if="tenderableBillingDocument"
              label="Tender Payment"
              icon="pi pi-credit-card"
              size="small"
              severity="success"
              :loading="isBillingActionLoading"
              @click="openTenderFromBillingDialog"
            />
            <Button
              v-if="detailBillingPreparation.billing_path.action === 'CREATE_SELF_PAY_APPOINTMENT_BILL'"
              label="Create Bill / Tender"
              icon="pi pi-wallet"
              size="small"
              :loading="isBillingActionLoading"
              :pt="ptPrimaryBtn"
              @click="createSelfPayAppointmentBillFromDetails"
            />
            <Button
              v-if="detailBillingPreparation.billing_path.action === 'CREATE_SELF_PAY_PACKAGE_BILL'"
              label="Create Package Bill"
              icon="pi pi-box"
              size="small"
              :loading="isBillingActionLoading"
              :pt="ptPrimaryBtn"
              @click="createSelfPayPackageBillFromDetails"
            />
            <Button
              v-if="detailBillingPreparation.billing_path.action === 'CREATE_DOCUMENTATION_INVOICE'"
              label="Create Session Invoice"
              icon="pi pi-file"
              size="small"
              :loading="isBillingActionLoading"
              :pt="ptPrimaryBtn"
              @click="createSessionDocumentationInvoiceFromDetails"
            />
            <Button
              v-if="detailBillingPreparation.billing_path.action === 'CREATE_HMO_CLAIM'"
              label="Create HMO Claim"
              icon="pi pi-file-check"
              size="small"
              :loading="isBillingActionLoading"
              :disabled="!canCreateSponsorClaimFromDetails('HMO')"
              :pt="ptPrimaryBtn"
              @click="createHmoClaimFromDetails"
            />
            <Button
              v-if="detailBillingPreparation.billing_path.action === 'CREATE_LGU_CLAIM'"
              label="Create LGU Claim"
              icon="pi pi-file-check"
              size="small"
              :loading="isBillingActionLoading"
              :disabled="!canCreateSponsorClaimFromDetails('LGU')"
              :pt="ptPrimaryBtn"
              @click="createLguClaimFromDetails"
            />
            <Button
              label="Print Invoice"
              icon="pi pi-print"
              size="small"
              severity="secondary"
              outlined
              :loading="isBillingActionLoading"
              @click="printAppointmentInvoiceFromBillingDialog"
            />
          </div>

          <div
            v-if="tenderableBillingDocument"
            class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-3 py-2 text-sm"
          >
            <span class="app-appointment-muted">Open balance:</span>
            <strong class="ml-1">{{ formatCurrency(tenderableBillingDocument.totals.balance) }}</strong>
            <span class="ml-2 text-[rgb(var(--app-fg))]/50">
              {{ tenderableBillingDocument.document_number || `Document #${tenderableBillingDocument.id}` }}
            </span>
          </div>
        </section>
      </div>

      <div v-else class="app-appointment-card py-8 text-center text-sm text-[rgb(var(--app-fg))]/60">
        Billing preparation is not available for this appointment yet.
      </div>

      <template #footer>
        <Button label="Close" severity="secondary" outlined @click="appointmentBillingVisible = false" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="tenderVisible"
      modal
      header="Tender Payment"
      :style="{ width: '34rem', maxWidth: '94vw' }"
      :draggable="false"
    >
      <div v-if="tenderBillingDocument" class="space-y-4">
        <section class="app-appointment-card app-appointment-card-accent space-y-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Billing Document</p>
              <h4 class="app-appointment-title mt-1 text-base">
                {{ tenderBillingDocument.document_number || `Document #${tenderBillingDocument.id}` }}
              </h4>
            </div>
            <Tag :value="tenderBillingDocument.document_status" severity="warn" />
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">Total</p>
              <p class="app-appointment-value font-semibold">{{ formatCurrency(tenderBillingDocument.totals.total) }}</p>
            </div>
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">Balance</p>
              <p class="app-appointment-value font-semibold">{{ formatCurrency(tenderBillingDocument.totals.balance) }}</p>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Amount Tendered</label>
            <InputNumber
              v-model="tenderForm.amount_tendered"
              mode="currency"
              currency="PHP"
              locale="en-PH"
              class="w-full"
              :min="0"
            />
          </div>
          <div class="space-y-1">
            <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Payment Method</label>
            <Select
              v-model="tenderForm.payment_method_id"
              :options="paymentMethodOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select method"
              class="w-full"
              :loading="isPaymentMethodsLoading"
            />
          </div>
        </div>

        <section class="app-appointment-card space-y-3">
          <div class="flex items-start gap-2">
            <input
              id="tender-senior-pwd"
              v-model="tenderForm.senior_pwd_id_presented"
              type="checkbox"
              class="mt-1"
            />
            <label for="tender-senior-pwd" class="text-sm font-semibold text-[rgb(var(--app-fg))]">
              Senior / PWD ID presented
              <span class="block text-xs font-normal text-[rgb(var(--app-fg))]/60">Applies 20% privilege discount before custom discount.</span>
            </label>
          </div>

          <InputText
            v-if="tenderForm.senior_pwd_id_presented"
            v-model="tenderForm.senior_pwd_id_reference"
            class="w-full"
            placeholder="Senior/PWD ID reference"
          />

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Custom Discount</label>
              <Select
                v-model="tenderForm.custom_discount_type"
                :options="discountTypeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="No custom discount"
                showClear
                class="w-full"
              />
            </div>
            <div class="space-y-1">
              <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Discount Value</label>
              <InputNumber
                v-model="tenderForm.custom_discount_value"
                class="w-full"
                :min="0"
                :suffix="tenderForm.custom_discount_type === 'PERCENTAGE' ? '%' : undefined"
                mode="decimal"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">Estimated Discount</p>
              <p class="font-semibold text-orange-500">{{ formatCurrency(tenderDiscountSummary.discount) }}</p>
            </div>
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">Amount Due</p>
              <p class="app-appointment-value font-semibold">{{ formatCurrency(tenderDiscountSummary.amountDue) }}</p>
            </div>
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">Change</p>
              <p class="font-semibold text-green-600">{{ formatCurrency(tenderDiscountSummary.change) }}</p>
            </div>
          </div>
        </section>

        <div class="space-y-1">
          <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Reference</label>
          <InputText v-model="tenderForm.payment_reference" class="w-full" placeholder="Optional reference number" />
        </div>

        <div class="space-y-1">
          <label class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">Notes</label>
          <Textarea v-model="tenderForm.notes" class="w-full" rows="3" autoResize />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" severity="secondary" outlined :disabled="isTenderSaving" @click="tenderVisible = false" />
        <Button
          label="Save Payment"
          icon="pi pi-check"
          :loading="isTenderSaving"
          :pt="ptPrimaryBtn"
          @click="submitTenderPayment"
        />
      </template>
    </Dialog>

    <AppointmentForm
      v-model:visible="formVisible"
      :editing-id="editingId"
      :is-saving="isSaving"
      :form="form"
      :session-count="sessionCountPreview"
      :selected-clinic="selectedClinic"
      :selected-clinic-schedule="selectedClinicSchedule"
      :selected-services="selectedServices"
      :patient-options="patientOptionsForClinic"
      :clinic-options="clinicOptions"
      :active-branch-id="activeBranchId"
      :pt-options="ptOptions"
      :doctor-options="doctorOptions"
      :payer-options="appointmentPayerOptions"
      :sponsor-eligibility="sponsorBillingEligibility"
      :appointment-type-options="appointmentTypeOptions"
      :appointment-status-label="appointmentStatusLabel"
      :phase-options="phaseOptions"
      :specialty-options="specialtyOptions"
      :clinic-area-options="clinicAreaOptions"
      :medical-diagnose-options="medicalDiagnoseOptions"
      :laterality-options="lateralityOptions"
      :service-type-options="serviceTypeOptions"
      :service-picker="servicePicker"
      :current-service-options="currentServiceOptions"
      :schedule-appointments="availabilityAppointments"
      :is-availability-loading="isAvailabilityLoading"
      @generate-session-dates="generateSessionDates"
      @add-picked-service="addPickedService"
      @remove-selected-service="removeSelectedService"
      @save="saveAppointment"
    />

    <PlannedServicesModal
      v-model:visible="servicesVisible"
      :appointment="activeAppointment"
      :selected-services="selectedServices"
      :planned-services="servicesModalPlannedServices"
      :service-type-options="serviceTypeOptions"
      :service-picker="servicePicker"
      :current-service-options="currentServiceOptions"
      :is-saving="isSavingServices"
      :format-date="formatDate"
      :format-time="formatTime"
      :format-currency="formatCurrency"
      @add-picked-service="addPickedService"
      @remove-selected-service="removeSelectedService"
      @save="saveServices"
    />

    <AttendanceModal
      v-model:visible="attendanceVisible"
      :appointment="activeAppointment"
      :attendance-items="attendanceItems"
      :is-saving="isSavingAttendance"
      :is-dropping-out="isDroppingOut"
      :can-drop-out-lgu="canDropOutActiveAppointment"
      :dropout-status="activeAppointment?.dropout_status ?? null"
      :format-date="formatDate"
      :format-time="formatTime"
      @drop-out="dropOutActiveAppointment"
      @undo-drop-out="undoDropOutActiveAppointment"
      @save="saveAttendance"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable, { type DataTablePageEvent } from "primevue/datatable"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Select from "primevue/select"
import Tag from "primevue/tag"
import Textarea from "primevue/textarea"
import { useToast } from "primevue/usetoast"
import { useRouter } from "vue-router"
import AppointmentScheduleCalendar from "@/features/appointments/components/AppointmentScheduleCalendar.vue"
import AppointmentDetailsModal from "@/features/appointments/components/AppointmentDetailsModal.vue"
import AppointmentForm from "@/features/appointments/components/AppointmentForm.vue"
import PlannedServicesModal from "@/features/appointments/components/PlannedServicesModal.vue"
import AttendanceModal from "@/features/appointments/components/AttendanceModal.vue"
import {
  appointmentBillingService,
  type AppointmentBillingDocument,
  type PaymentMethodLookup,
  type AppointmentBillingPreparation
} from "@/features/appointments/api/appointment-billing.service"
import {
  appointmentPhase1Service,
  type AppointmentListItem,
  type AppointmentPlannedService,
  type AppointmentLocationContext,
  type AppointmentPhase,
  type AppointmentServiceSelectionType,
  type AppointmentCreatePayload,
  type AppointmentSessionSchedulePayload,
  type AppointmentFlowSummary
} from "@/features/appointments/api/appointment-phase1.service"
import { clinicService } from "@/features/clinics/api/clinic.service"
import { patientService } from "@/features/patients/api/patient.service"
import type { PatientContext } from "@/features/patients/types/patient"
import type { PatientHMOInformation } from "@/models/hmo-information"
import { staffService } from "@/features/staff/api/staff.service"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"
import { useAuthSessionStore } from "@/stores/auth-session.store"
import { clinicStore } from "@/stores/clinic.store"
import { pamsAPI } from "@/utils/axios-interceptor"
import { errorHandler } from "@/utils/error-handler"
import { Status } from "@/utils/global.type"
import { errorToast, successToast } from "@/utils/toast.util"

type SelectOption = { label: string; value: number | string | null }
type PayerType = "SELF_PAY_SINGLE" | "SELF_PAY_PACKAGE" | "HMO" | "LGU"
type Laterality = "LEFT" | "RIGHT" | "BOTH" | "BILATERAL" | "NA"
type IncludedServicePreview = {
  name: string
  quantity: number
  type?: string
}

type ServiceOption = {
  label: string
  value: number
  price: number
  type: AppointmentServiceSelectionType
  inheritedQuantity: number
  includedServices: IncludedServicePreview[]
}
type ClinicSelectOption = SelectOption & { startDay: number; endDay: number; startTime: string; endTime: string }
type PatientSelectOption = SelectOption & { clinicId: number | null }
type SelectedService = ServiceOption & { name: string; quantity: number; typeLabel: string }
type AttendanceItem = AppointmentPlannedService & { selected: boolean; quantity: number; remaining: number; appointmentConsumed: number }
type TreatmentAreaOption = SelectOption & { clinicId: number | null; color?: string | null }
type CalendarVisibleRange = { from: Date; to: Date }
type SponsorEligibilityStatus = "available" | "active" | "missing" | "blocked" | "loading"
type SponsorEligibilityItem = {
  payerType: PayerType
  label: string
  status: SponsorEligibilityStatus
  detail: string
}

const toast = useToast()
const router = useRouter()
const branchStore = clinicStore()
const authSession = useAuthSessionStore()

const normalizeDateOnly = (value: Date): Date => {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

const initialSelectedDate = normalizeDateOnly(new Date())

const addDays = (value: Date, days: number): Date => {
  const date = normalizeDateOnly(value)
  date.setDate(date.getDate() + days)
  return date
}

const startOfMonth = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth(), 1)

const endOfMonth = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth() + 1, 0)

const defaultCalendarRange = (value: Date): CalendarVisibleRange => ({
  from: addDays(startOfMonth(value), -7),
  to: addDays(endOfMonth(value), 7)
})

const activeCalendarRange = ref<CalendarVisibleRange>(defaultCalendarRange(initialSelectedDate))
const DEFAULT_APPOINTMENT_DURATION_MS = 60 * 60 * 1000

const appointments = ref<AppointmentListItem[]>([])
const tableAppointmentSource = ref<AppointmentListItem[]>([])
const calendarAppointments = ref<AppointmentListItem[]>([])
const availabilityAppointments = ref<AppointmentListItem[]>([])
const totalRecords = ref(0)
const page = ref(1)
const pageSize = ref(20)

const isLoading = ref(false)
const isCalendarLoading = ref(false)
const isAvailabilityLoading = ref(false)
const isSaving = ref(false)
const isSavingServices = ref(false)
const isSavingAttendance = ref(false)
const isDroppingOut = ref(false)
const isBillingActionLoading = ref(false)
const isTenderSaving = ref(false)
const isPaymentMethodsLoading = ref(false)

const formVisible = ref(false)
const detailsVisible = ref(false)
const servicesVisible = ref(false)
const attendanceVisible = ref(false)
const appointmentBillingVisible = ref(false)
const tenderVisible = ref(false)

const editingId = ref<number | null>(null)
const activeAppointment = ref<AppointmentListItem | null>(null)
const detailAppointment = ref<AppointmentListItem | null>(null)

const patientOptions = ref<PatientSelectOption[]>([])
const clinicOptions = ref<ClinicSelectOption[]>([])
const staffOptions = ref<Array<SelectOption & {
  clinicId?: number | null
  providerType?: string
  secondaryProviderType?: string | null
  specialtyTagId?: number | null
}>>([])
const appointmentTypeOptions = ref<SelectOption[]>([])
const appointmentStatusOptions = ref<SelectOption[]>([])
const specialtyOptions = ref<SelectOption[]>([])
const treatmentAreaOptions = ref<TreatmentAreaOption[]>([])
const medicalDiagnoseOptions = ref<SelectOption[]>([])

type AppointmentServiceCatalog = Record<AppointmentServiceSelectionType, ServiceOption[]>

const emptyServiceCatalog = (): AppointmentServiceCatalog => ({
  PACKAGE: [],
  BUNDLE: [],
  MACHINE: [],
  TECHNIQUE: [],
  EVALUATION: [],
  ADD_ON_MACHINE: [],
  ADD_ON_TECHNIQUE: [],
  ADD_ON_HOME_SERVICE: []
})

const globalServiceCatalog = ref<AppointmentServiceCatalog>(emptyServiceCatalog())
const lguServiceCatalog = ref<AppointmentServiceCatalog>(emptyServiceCatalog())

const selectedServices = ref<SelectedService[]>([])
const detailFlowSummary = ref<AppointmentFlowSummary | null>(null)
const detailPlannedServices = ref<AppointmentPlannedService[]>([])
const detailBillingPreparation = ref<AppointmentBillingPreparation | null>(null)
const tenderBillingDocument = ref<AppointmentBillingDocument | null>(null)
const paymentMethods = ref<PaymentMethodLookup[]>([])
const servicesModalPlannedServices = ref<AppointmentPlannedService[]>([])
const attendancePlannedServices = ref<AppointmentPlannedService[]>([])
const attendanceItems = ref<AttendanceItem[]>([])
const sessionCountPreview = ref(1)
const selectedPatientContext = ref<PatientContext | null>(null)
const isLoadingPatientContext = ref(false)

type AttendanceStatusFilter = "PENDING" | "COMPLETED" | "CANCELED"

type BillingStatusFilter = "UNBILLED" | "BILLED" | "PAID" | "PARTIALLY_PAID"

const filters = reactive({
  search: "",
  fromDate: initialSelectedDate,
  toDate: initialSelectedDate,
  ptId: null as number | null,
  payerType: null as PayerType | null,
  billingStatus: null as BillingStatusFilter | null,
  attendanceStatus: null as AttendanceStatusFilter | null
})

const form = reactive({
  patient_id: null as number | null,
  clinic_id: null as number | null,
  primary_provider_staff_id: null as number | null,
  referring_staff_id: null as number | null,
  appointment_type_id: null as number | null,
  appointment_status_id: null as number | null,
  starts_at: null as Date | null,
  ends_at: null as Date | null,
  appointment_phase: "SESSION" as AppointmentPhase,
  location_context: "IN_CLINIC" as AppointmentLocationContext,
  specialty_tag_id: null as number | null,
  treatment_area_id: null as number | null,
  medical_diagnose_id: null as number | null,
  diagnosis_laterality: null as Laterality | null,
  payer_type: null as PayerType | null,
  notes: "",
  create_all_sessions: true,
  session_dates: [] as Date[]
})

const tenderForm = reactive({
  amount_tendered: null as number | null,
  payment_method_id: null as number | null,
  payment_reference: "",
  notes: "",
  senior_pwd_id_presented: false,
  senior_pwd_id_reference: "",
  custom_discount_type: null as "PERCENTAGE" | "FIXED" | null,
  custom_discount_value: null as number | null
})

const hmoClaimForm = reactive({
  loa_number: "",
  approval_code: "",
  notes: ""
})

const lguClaimForm = reactive({
  approval_code: "",
  notes: ""
})

const servicePicker = reactive({
  type: "TECHNIQUE" as AppointmentServiceSelectionType,
  id: null as number | null,
  quantity: 1
})

const phaseOptions: Array<{ label: string; value: AppointmentPhase }> = [
  { label: "Evaluation", value: "EVAL" },
  { label: "Session", value: "SESSION" },
  { label: "Re-evaluation", value: "RE_EVAL" }
]

const locationOptions: Array<{ label: string; value: AppointmentLocationContext }> = [
  { label: "Clinic Branch", value: "IN_CLINIC" },
  { label: "Home Care", value: "HOME_CARE" }
]

const payerOptions: Array<{ label: string; value: PayerType }> = [
  { label: "Self Pay: Single", value: "SELF_PAY_SINGLE" },
  { label: "Self Pay: Package", value: "SELF_PAY_PACKAGE" },
  { label: "HMO", value: "HMO" },
  { label: "LGU", value: "LGU" }
]

const discountTypeOptions: Array<{ label: string; value: "PERCENTAGE" | "FIXED" }> = [
  { label: "Percentage", value: "PERCENTAGE" },
  { label: "Fixed Amount", value: "FIXED" }
]

const lateralityOptions: Array<{ label: string; value: Laterality }> = [
  { label: "Left", value: "LEFT" },
  { label: "Right", value: "RIGHT" },
  { label: "Both", value: "BOTH" },
  { label: "N/A", value: "NA" }
]

const allServiceTypeOptions: Array<{ label: string; value: AppointmentServiceSelectionType }> = [
  { label: "Package", value: "PACKAGE" },
  { label: "Bundle", value: "BUNDLE" },
  { label: "Single Service: Machine", value: "MACHINE" },
  { label: "Single Service: Technique", value: "TECHNIQUE" },
  { label: "Single Service: Evaluation", value: "EVALUATION" },
  { label: "Service Add-on: Machine", value: "ADD_ON_MACHINE" },
  { label: "Service Add-on: Technique", value: "ADD_ON_TECHNIQUE" },
  { label: "Home Care Add-on", value: "ADD_ON_HOME_SERVICE" }
]

const allowedServiceTypesByBillingType: Record<PayerType, AppointmentServiceSelectionType[]> = {
  SELF_PAY_SINGLE: ["BUNDLE", "MACHINE", "TECHNIQUE", "EVALUATION", "ADD_ON_MACHINE", "ADD_ON_TECHNIQUE", "ADD_ON_HOME_SERVICE"],
  SELF_PAY_PACKAGE: ["PACKAGE", "BUNDLE", "MACHINE", "TECHNIQUE", "EVALUATION", "ADD_ON_MACHINE", "ADD_ON_TECHNIQUE", "ADD_ON_HOME_SERVICE"],
  HMO: ["MACHINE", "TECHNIQUE", "EVALUATION", "ADD_ON_MACHINE", "ADD_ON_TECHNIQUE", "ADD_ON_HOME_SERVICE"],
  LGU: ["PACKAGE", "ADD_ON_MACHINE", "ADD_ON_TECHNIQUE", "ADD_ON_HOME_SERVICE"]
}

const homeCareAddOnTypes = new Set<AppointmentServiceSelectionType>(["ADD_ON_HOME_SERVICE"])

const getAllowedServiceTypes = (billingType?: PayerType | null): AppointmentServiceSelectionType[] =>
  billingType
    ? allowedServiceTypesByBillingType[billingType]
    : ["MACHINE", "TECHNIQUE", "EVALUATION", "ADD_ON_MACHINE", "ADD_ON_TECHNIQUE", "ADD_ON_HOME_SERVICE"]

const payerOptionsWithAll = computed(() => [{ label: "All Billing Types", value: null }, ...payerOptions])

const parseDateOnlyValue = (value?: string | null): Date | null => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

const isActiveSponsorInfo = (info: PatientHMOInformation): boolean => {
  const today = normalizeDateOnly(new Date())
  const start = parseDateOnlyValue(info.validity_start_date)
  const end = parseDateOnlyValue(info.validity_end_date)
  return (!start || start.getTime() <= today.getTime())
    && (!end || end.getTime() >= today.getTime())
}

const activeSponsorInfos = computed(() =>
  (selectedPatientContext.value?.sponsor_information ?? []).filter(isActiveSponsorInfo)
)

const hasActiveHmoSponsor = computed(() =>
  activeSponsorInfos.value.some(info => String(info.sponsor_context ?? "").toUpperCase() === "HMO")
)

const hasActiveLguSponsor = computed(() =>
  activeSponsorInfos.value.some(info => String(info.sponsor_context ?? "").toUpperCase() === "LGU")
)

const selectedPatientLguStatus = computed(() =>
  String(selectedPatientContext.value?.patient?.lgu_patient_status ?? "").trim().toUpperCase()
)

const isSelectedPatientLguDroppedOut = computed(() =>
  selectedPatientLguStatus.value === "DROPPED_OUT" || selectedPatientLguStatus.value === "CROSS_MONTH_DROPPED_OUT"
)

const isAppointmentPayerTypeAllowed = (payerType: PayerType | null | undefined): boolean => {
  if (!payerType) return true
  if (payerType === "SELF_PAY_SINGLE" || payerType === "SELF_PAY_PACKAGE") return true
  if (isLoadingPatientContext.value) return false
  if (!selectedPatientContext.value) return false
  if (payerType === "HMO") return hasActiveHmoSponsor.value
  if (payerType === "LGU") return hasActiveLguSponsor.value && !isSelectedPatientLguDroppedOut.value
  return false
}

const appointmentPayerOptions = computed(() =>
  payerOptions.filter(option => isAppointmentPayerTypeAllowed(option.value))
)

const sponsorBillingEligibility = computed<SponsorEligibilityItem[]>(() => {
  if (!form.patient_id) {
    return [
      { payerType: "SELF_PAY_SINGLE", label: "Self Pay", status: "available", detail: "Available without sponsor information" },
      { payerType: "HMO", label: "HMO", status: "missing", detail: "Select a patient to check sponsor information" },
      { payerType: "LGU", label: "LGU", status: "missing", detail: "Select a patient to check sponsor information" }
    ]
  }

  if (isLoadingPatientContext.value) {
    return [
      { payerType: "SELF_PAY_SINGLE", label: "Self Pay", status: "available", detail: "Available without sponsor information" },
      { payerType: "HMO", label: "HMO", status: "loading", detail: "Checking HMO sponsor information" },
      { payerType: "LGU", label: "LGU", status: "loading", detail: "Checking LGU sponsor information" }
    ]
  }

  const lguStatus = isSelectedPatientLguDroppedOut.value
    ? "Patient LGU profile is dropped out. New LGU availments are blocked."
    : hasActiveLguSponsor.value
      ? "Active LGU sponsor information found"
      : "No active LGU sponsor information"

  return [
    { payerType: "SELF_PAY_SINGLE", label: "Self Pay", status: "available", detail: "Available without sponsor information" },
    {
      payerType: "HMO",
      label: "HMO",
      status: hasActiveHmoSponsor.value ? "active" : "missing",
      detail: hasActiveHmoSponsor.value ? "Active HMO sponsor information found" : "No active HMO sponsor information"
    },
    {
      payerType: "LGU",
      label: "LGU",
      status: isSelectedPatientLguDroppedOut.value ? "blocked" : hasActiveLguSponsor.value ? "active" : "missing",
      detail: lguStatus
    }
  ]
})

const billingStatusOptions: Array<{ label: string; value: BillingStatusFilter | null }> = [
  { label: "All Billing Status", value: null },
  { label: "Unbilled", value: "UNBILLED" },
  { label: "Billed", value: "BILLED" },
  { label: "Paid", value: "PAID" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" }
]

const attendanceStatusOptions: Array<{ label: string; value: AttendanceStatusFilter | null }> = [
  { label: "All Attendance Status", value: null },
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Canceled", value: "CANCELED" }
]

const activeBranchId = computed(() => branchStore.selectedClinicId ?? null)

const formBranchId = computed(() => form.clinic_id ?? activeBranchId.value ?? null)

const patientOptionsForClinic = computed(() =>
  formBranchId.value
    ? patientOptions.value.filter(option => option.clinicId === null || option.clinicId === Number(formBranchId.value))
    : patientOptions.value
)

const isOptionInFormBranch = (option: { clinicId?: number | null }): boolean =>
  !formBranchId.value || option.clinicId === null || option.clinicId === undefined || option.clinicId === Number(formBranchId.value)

const ptOptions = computed(() =>
  staffOptions.value.filter(option =>
    isOptionInFormBranch(option)
    && (
      option.providerType === "PHYSICAL_THERAPIST"
      || option.providerType === "PT_ASSISTANT"
      || option.providerType === "INTERN"
      || option.secondaryProviderType === "PHYSICAL_THERAPIST"
      || option.secondaryProviderType === "PT_ASSISTANT"
      || option.secondaryProviderType === "INTERN"
    )
  )
)

const doctorOptions = computed(() =>
  staffOptions.value.filter(option =>
    isOptionInFormBranch(option)
    && (option.providerType === "DOCTOR_CONSULTANT" || option.secondaryProviderType === "DOCTOR_CONSULTANT")
  )
)

const ptFilterOptions = computed<Array<SelectOption>>(() => [
  { label: "All PT", value: null },
  ...ptOptions.value
])

const currentServiceBillingType = computed(() =>
  servicesVisible.value ? activeAppointment.value?.payer_type as PayerType | null : form.payer_type
)

const serviceTypeOptions = computed(() => {
  const allowed = new Set(getAllowedServiceTypes(currentServiceBillingType.value))
  return allServiceTypeOptions.filter(option => allowed.has(option.value))
})

const currentServiceCatalog = computed(() =>
  currentServiceBillingType.value === "LGU" ? lguServiceCatalog.value : globalServiceCatalog.value
)

const currentServiceOptions = computed(() => currentServiceCatalog.value[servicePicker.type] ?? [])

const clinicAreaOptions = computed(() =>
  treatmentAreaOptions.value.filter(option => !form.clinic_id || option.clinicId === form.clinic_id)
)

const selectedClinic = computed(() =>
  clinicOptions.value.find(option => option.value === form.clinic_id)
  ?? clinicOptions.value.find(option => option.value === activeBranchId.value)
  ?? clinicOptions.value.find(option => option.value === appointments.value[0]?.clinic_id)
  ?? clinicOptions.value.find(option => option.value === calendarAppointments.value[0]?.clinic_id)
  ?? null
)

const selectedClinicSchedule = computed(() =>
  clinicOptions.value.find(option => option.value === form.clinic_id)
  ?? clinicOptions.value.find(option => option.value === activeBranchId.value)
  ?? null
)

const paymentMethodOptions = computed<SelectOption[]>(() =>
  paymentMethods.value.map(method => ({ label: method.name, value: method.id }))
)

const largestTenderLineTotal = (lines: AppointmentBillingDocument["lines"] = []): number =>
  lines.reduce((max, line) => Math.max(max, Number(line.line_total ?? 0), largestTenderLineTotal(line.children)), 0)

const tenderDiscountSummary = computed(() => {
  const document = tenderBillingDocument.value
  const subtotal = Number(document?.totals.subtotal ?? document?.totals.total ?? 0)
  const paid = Number(document?.totals.paid ?? 0)
  const existingDiscount = Number(document?.totals.discount ?? 0)
  const seniorTargetAmount = largestTenderLineTotal(document?.lines) || subtotal
  const seniorDiscount = tenderForm.senior_pwd_id_presented ? Math.max(0, seniorTargetAmount * 0.2) : 0
  const remainingAfterSenior = Math.max(0, subtotal - seniorDiscount)
  const customValue = Number(tenderForm.custom_discount_value ?? 0)
  const customDiscount = tenderForm.custom_discount_type && customValue > 0
    ? tenderForm.custom_discount_type === "PERCENTAGE"
      ? remainingAfterSenior * (customValue / 100)
      : customValue
    : 0
  const requestedDiscount = Math.min(subtotal, seniorDiscount + customDiscount)
  const discount = requestedDiscount > 0 ? requestedDiscount : existingDiscount
  const totalAfterDiscount = Math.max(0, subtotal - discount + Number(document?.totals.tax ?? 0))
  return {
    discount,
    amountDue: Math.max(0, totalAfterDiscount - paid),
    change: Math.max(0, Number(tenderForm.amount_tendered ?? 0) - Math.max(0, totalAfterDiscount - paid))
  }
})

const pendingStatusOption = computed(() =>
  appointmentStatusOptions.value.find(option => String(option.label).toLowerCase() === "pending")
  ?? appointmentStatusOptions.value.find(option => String(option.label).toLowerCase().includes("pending"))
  ?? appointmentStatusOptions.value[0]
  ?? null
)

const appointmentStatusLabel = computed(() =>
  editingId.value
    ? appointmentStatusOptions.value.find(option => option.value === form.appointment_status_id)?.label ?? "Updated by attendance"
    : pendingStatusOption.value?.label ?? "Pending"
)

const selectedDateLabel = computed(() => {
  const date = filters.fromDate ?? form.starts_at ?? new Date()
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
})

const totalAppointmentsCount = computed(() => totalRecords.value)

const rescheduledOrCanceledAppointmentsCount = computed(() =>
  tableAppointmentSource.value.filter(appointment =>
    normalizeAttendanceStatus(appointment) === "CANCELED" || isRescheduledAppointment(appointment)
  ).length
)

const unbilledAppointmentsCount = computed(() =>
  tableAppointmentSource.value.filter(appointment => normalizeBillingStatus(appointment) === "UNBILLED").length
)

const canUseAppointmentPermission = (...permissions: string[]): boolean =>
  authSession.isOwnerEquivalent || authSession.hasAnyPermission(...permissions)

const canViewAppointmentDetails = computed(() =>
  canUseAppointmentPermission("Appointment::READ", "Appointment::LOOKUP")
)

const canCreateAppointment = computed(() =>
  canUseAppointmentPermission("Appointment::CREATE")
)

const canEditAppointment = computed(() =>
  canUseAppointmentPermission("Appointment::UPDATE")
)

const canCancelAppointment = computed(() =>
  canUseAppointmentPermission("Appointment::DELETE", "Appointment::MANAGE_STATUS")
)

const canMarkAttendance = computed(() =>
  canUseAppointmentPermission("Appointment::UPDATE", "Appointment::MANAGE_STATUS")
)

const canManageAppointmentBilling = computed(() =>
  canUseAppointmentPermission("Appointment::MANAGE_BILL", "Patient::MANAGE_BILLS")
)

const normalizePayerType = (value: unknown): string =>
  String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_")

const isLguAppointment = (appointment: AppointmentListItem | null | undefined): boolean => {
  if (!appointment) return false

  const valuesToCheck = [
    appointment.payer_type,
    (appointment as any).billing_type,
    (appointment as any).source_type,
    (appointment as any).payment_source,
    (appointment as any).contract_type,
    (appointment as any).sponsor_context
  ]

  return valuesToCheck.some(value => {
    const normalized = normalizePayerType(value)
    return normalized === "LGU" || normalized === "LGU_BILLING"
  })
    || Boolean((appointment as any).lgu_patient_id)
    || Boolean((appointment as any).lgu_contract_id)
}

const canDropOutActiveAppointment = computed(() => {
  const appointment = activeAppointment.value
  if (!appointment) return false

  return isLguAppointment(appointment)
    && canManageAppointmentBilling.value
})

const toDateParam = (date: Date | null): string | undefined => {
  if (!date) return undefined
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const toDateTimePayload = (date: Date | null): string | undefined => {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}:00`
}

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })

const formatPayer = (value?: string | null): string => value ? value.split("_").join(" ") : "Unassigned"

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value ?? 0))

const formatBillingPreparationStatus = (value?: string | null): string =>
  String(value ?? "N/A")
    .split("_")
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")

const billingPreparationSeverity = computed<"success" | "warn" | "danger" | "info">(() => {
  const preparation = detailBillingPreparation.value
  if (!preparation) return "info"
  if (preparation.billing_path.documentation_only) return "info"
  if (preparation.billing_path.requires_tendering || preparation.billing_path.requires_loa) return "warn"
  return "success"
})

const tenderableBillingDocument = computed<AppointmentBillingDocument | null>(() => {
  const preparation = detailBillingPreparation.value
  if (!preparation) return null
  if (preparation.billing_path.payer_type !== "SELF_PAY_SINGLE" && preparation.billing_path.payer_type !== "SELF_PAY_PACKAGE") return null

  const document = preparation.existing_documents.find(existing =>
    ["APPOINTMENT_INVOICE", "PACKAGE_INVOICE"].includes(existing.document_type)
    && !["PAID", "VOID", "CANCELLED"].includes(String(existing.document_status).toUpperCase())
    && Number(existing.totals?.balance ?? 0) > 0
  )

  return document
    ? {
        id: document.id,
        document_number: document.document_number,
        document_type: document.document_type,
        document_status: document.document_status,
        payer_type: preparation.billing_path.payer_type,
        document_date: document.document_date,
        totals: document.totals
      }
    : null
})

const formatOptionalNumber = (value?: number | null): string | undefined =>
  value === undefined || value === null ? undefined : String(value)

const serviceTypeLabel = (value: AppointmentServiceSelectionType): string =>
  allServiceTypeOptions.find(option => option.value === value)?.label ?? value

const displayAppointmentPhase = (value?: AppointmentPhase | string): string =>
  phaseOptions.find(option => option.value === value)?.label ?? String(value ?? "Unassigned")

const displayLocationContext = (value?: AppointmentLocationContext | string): string =>
  locationOptions.find(option => option.value === value)?.label ?? String(value ?? "Unassigned")

const displayLaterality = (value?: string | null): string => {
  if (!value) return "Not recorded"
  if (value === "BILATERAL") return "Both"
  return lateralityOptions.find(option => option.value === value)?.label ?? value
}

const normalizeTextToken = (value?: string | null): string =>
  String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_")

const normalizeBillingStatus = (appointment: AppointmentListItem): BillingStatusFilter | string => {
  const normalized = normalizeTextToken((appointment as any).billing_status)
  if (normalized.includes("PARTIAL")) return "PARTIALLY_PAID"
  if (normalized.includes("UNBILLED") || normalized.includes("NEEDS_BILLING")) return "UNBILLED"
  if (normalized.includes("PAID")) return "PAID"
  if (normalized.includes("BILLED")) return "BILLED"
  return normalized || "UNBILLED"
}

const displayBillingStatus = (appointment: AppointmentListItem): string => {
  const status = normalizeBillingStatus(appointment)
  if (status === "PARTIALLY_PAID") return "Partially Paid"
  return String(status).split("_").map(part => part.charAt(0) + part.slice(1).toLowerCase()).join(" ")
}

const billingStatusSeverity = (appointment: AppointmentListItem): "success" | "warn" | "danger" | "info" => {
  const status = normalizeBillingStatus(appointment)
  if (status === "PAID") return "success"
  if (status === "UNBILLED") return "danger"
  if (status === "PARTIALLY_PAID") return "warn"
  return "info"
}

const getAppointmentNumberField = (appointment: AppointmentListItem, keys: string[]): number | null => {
  for (const key of keys) {
    const value = Number((appointment as any)[key])
    if (Number.isFinite(value)) return value
  }
  return null
}

const hasAllCreditsConsumed = (appointment: AppointmentListItem): boolean => {
  const consumed = getAppointmentNumberField(appointment, [
    "consumed_credits",
    "consumed_credit_count",
    "consumed_quantity",
    "finished_services_count",
    "completed_services_count"
  ])
  const total = getAppointmentNumberField(appointment, [
    "total_credits",
    "total_credit_count",
    "planned_quantity",
    "planned_services_count",
    "total_services_count"
  ])
  return consumed !== null && total !== null && total > 0 && consumed >= total
}

const normalizeAttendanceStatus = (appointment: AppointmentListItem): AttendanceStatusFilter => {
  const rawStatus = normalizeTextToken(
    (appointment as any).attendance_status
    ?? (appointment as any).attendanceStatus
    ?? (appointment as any).appointment_status
  )

  if (rawStatus.includes("CANCEL") || rawStatus.includes("NO_SHOW")) return "CANCELED"
  if (rawStatus.includes("COMPLETE") || rawStatus.includes("ATTENDED") || rawStatus.includes("PRESENT")) return "COMPLETED"
  if (hasAllCreditsConsumed(appointment)) return "COMPLETED"
  return "PENDING"
}

const displayAttendanceStatus = (appointment: AppointmentListItem): string => {
  const status = normalizeAttendanceStatus(appointment)
  if (status === "COMPLETED") return "Completed"
  if (status === "CANCELED") return "Canceled"
  return "Pending"
}

const attendanceStatusSeverity = (appointment: AppointmentListItem): "success" | "warn" | "danger" | "info" => {
  const status = normalizeAttendanceStatus(appointment)
  if (status === "COMPLETED") return "success"
  if (status === "CANCELED") return "danger"
  return "warn"
}

const statusSeverity = (value?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = normalizeTextToken(value)
  if (normalized.includes("CANCEL") || normalized.includes("NO_SHOW")) return "danger"
  if (normalized.includes("COMPLETE") || normalized.includes("ATTENDED") || normalized.includes("PRESENT")) return "success"
  return "warn"
}

const isRescheduledAppointment = (appointment: AppointmentListItem): boolean => {
  const rawStatus = normalizeTextToken((appointment as any).appointment_status)
  return rawStatus.includes("RESCHEDULE")
    || Boolean((appointment as any).reschedule_flag)
    || Number((appointment as any).reschedule_count ?? 0) > 0
}

const getAppointmentDurationMs = (): number => {
  if (!form.starts_at || !form.ends_at) return DEFAULT_APPOINTMENT_DURATION_MS
  return Math.max(15 * 60 * 1000, form.ends_at.getTime() - form.starts_at.getTime())
}

const getDefaultAppointmentEnd = (start: Date): Date =>
  new Date(start.getTime() + DEFAULT_APPOINTMENT_DURATION_MS)

const isWithinOneMinute = (left: Date, right: Date): boolean =>
  Math.abs(left.getTime() - right.getTime()) < 60 * 1000

const getDayNumber = (date: Date): number => {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

const isClinicOpenOnDate = (date: Date): boolean => {
  const schedule = selectedClinicSchedule.value
  if (!schedule) return true

  const day = getDayNumber(date)
  const startDay = Number(schedule.startDay)
  const endDay = Number(schedule.endDay)

  if (!Number.isFinite(startDay) || !Number.isFinite(endDay)) return true
  if (startDay <= endDay) return day >= startDay && day <= endDay

  return day >= startDay || day <= endDay
}

const moveToNextClinicOpenDate = (date: Date): Date => {
  const next = new Date(date)

  for (let attempt = 0; attempt < 14; attempt += 1) {
    if (isClinicOpenOnDate(next)) return next
    next.setDate(next.getDate() + 1)
  }

  return next
}

const copyTime = (targetDate: Date, sourceTime: Date): Date => {
  const result = new Date(targetDate)
  result.setHours(
    sourceTime.getHours(),
    sourceTime.getMinutes(),
    sourceTime.getSeconds(),
    sourceTime.getMilliseconds()
  )
  return result
}

const serviceSessionQuantity = (service: SelectedService): number => {
  const inherited = Number(service.inheritedQuantity ?? 0)
  const selected = Number(service.quantity ?? 0)
  const includedMax = Math.max(
    0,
    ...(service.includedServices ?? []).map(item => Number(item.quantity ?? 0))
  )

  return Math.max(1, inherited, selected, includedMax)
}

const servicePayloadQuantity = (service: SelectedService): number =>
  service.type === "PACKAGE" ? 1 : Math.max(1, Number(service.quantity ?? 1))

const fallbackSessionCountFromSelectedServices = (): number => {
  const packageOrBundleServices = selectedServices.value.filter(service => service.type === "PACKAGE" || service.type === "BUNDLE")
  if (packageOrBundleServices.length) {
    return Math.max(1, ...packageOrBundleServices.map(serviceSessionQuantity))
  }

  return Math.max(1, ...selectedServices.value.map(serviceSessionQuantity))
}

const estimateSessionCountFromSelectedServices = (): number =>
  Math.max(1, Number(sessionCountPreview.value || fallbackSessionCountFromSelectedServices()))

const refreshSessionPreview = async (): Promise<void> => {
  if (!selectedServices.value.length) {
    sessionCountPreview.value = 1
    syncSessionDateCountFromSelectedServices()
    return
  }

  try {
    const preview = await appointmentPhase1Service.previewSessions({
      payer_type: form.payer_type,
      services: selectedServices.value.map(service => ({
        type: service.type,
        id: service.value,
        quantity: servicePayloadQuantity(service)
      }))
    })
    sessionCountPreview.value = Math.max(1, Number(preview.total_sessions ?? 1))
  } catch {
    sessionCountPreview.value = fallbackSessionCountFromSelectedServices()
  }

  syncSessionDateCountFromSelectedServices()
}

const syncSessionDateCountFromSelectedServices = (): void => {
  const targetCount = estimateSessionCountFromSelectedServices()
  if (!form.starts_at) return

  const durationMs = getAppointmentDurationMs()
  const firstStart = copyTime(moveToNextClinicOpenDate(new Date(form.starts_at)), form.starts_at)
  const current = form.session_dates
    .slice(0, targetCount)
    .map(date => copyTime(moveToNextClinicOpenDate(new Date(date)), form.starts_at as Date))

  if (!current.length) current.push(firstStart)

  while (current.length < targetCount) {
    const previous = current[current.length - 1]
    const next = new Date(previous)
    next.setDate(next.getDate() + 7)
    current.push(copyTime(moveToNextClinicOpenDate(next), form.starts_at))
  }

  form.session_dates = current
  form.starts_at = new Date(form.session_dates[0])
  form.ends_at = new Date(form.starts_at.getTime() + durationMs)
}

const generateSessionDates = (mode: "DAILY" | "EVERY_OTHER_DAY" | "WEEKLY"): void => {
  if (!form.starts_at) {
    errorToast(toast, "Set the first appointment start time first")
    return
  }

  const count = estimateSessionCountFromSelectedServices()
  const durationMs = getAppointmentDurationMs()
  const dayStep = mode === "DAILY" ? 1 : mode === "EVERY_OTHER_DAY" ? 2 : 7
  const firstStart = copyTime(moveToNextClinicOpenDate(new Date(form.starts_at)), form.starts_at)

  form.session_dates = Array.from({ length: count }, (_, index) => {
    if (index === 0) return firstStart

    const date = new Date(firstStart)
    date.setDate(date.getDate() + index * dayStep)
    return copyTime(moveToNextClinicOpenDate(date), form.starts_at as Date)
  })

  form.starts_at = new Date(form.session_dates[0])
  form.ends_at = new Date(form.starts_at.getTime() + durationMs)
}

const buildSessionSchedules = (): AppointmentSessionSchedulePayload[] => {
  const durationMs = getAppointmentDurationMs()
  const targetCount = estimateSessionCountFromSelectedServices()

  if (!form.starts_at || !form.ends_at) return []
  if (form.session_dates.length < targetCount) syncSessionDateCountFromSelectedServices()

  return form.session_dates.slice(0, targetCount).map(date => {
    const endDate = new Date(date.getTime() + durationMs)
    return {
      starts_at: toDateTimePayload(date) as string,
      ends_at: toDateTimePayload(endDate) as string
    }
  })
}

const buildAppointmentPayload = (date: Date): AppointmentCreatePayload => {
  const endDate = new Date(date.getTime() + getAppointmentDurationMs())
  const clinicId = activeBranchId.value ?? form.clinic_id

  return {
    patient_id: form.patient_id,
    clinic_id: clinicId,
    primary_provider_staff_id: form.primary_provider_staff_id,
    referring_staff_id: form.referring_staff_id,
    appointment_type_id: form.appointment_type_id,
    appointment_status_id: form.appointment_status_id ?? pendingStatusOption.value?.value,
    specialty_tag_id: form.specialty_tag_id,
    treatment_area_id: form.treatment_area_id,
    medical_category_id: null,
    medical_diagnose_id: form.medical_diagnose_id,
    diagnosis_laterality: form.diagnosis_laterality,
    pt_case_impression_id: null,
    pt_case_laterality: null,
    starts_at: toDateTimePayload(date),
    ends_at: toDateTimePayload(endDate),
    appointment_phase: form.appointment_phase,
    location_context: form.location_context,
    payer_type: form.payer_type,
    notes: form.notes.trim() || undefined,
    services: selectedServices.value.map(service => ({
      type: service.type,
      id: service.value,
      quantity: servicePayloadQuantity(service)
    })),
    session_schedules: buildSessionSchedules()
  }
}

const resetServicePicker = (billingType: PayerType | string | null = form.payer_type): void => {
  const allowedTypes = getAllowedServiceTypes(billingType as PayerType | null)
  servicePicker.type = allowedTypes.includes(servicePicker.type) ? servicePicker.type : allowedTypes[0] ?? "TECHNIQUE"
  servicePicker.id = null
  servicePicker.quantity = 1
}

const clearDisallowedBillingSelection = (): void => {
  if (isAppointmentPayerTypeAllowed(form.payer_type)) return

  form.payer_type = null
  selectedServices.value = []
  resetServicePicker(null)
}

const loadSelectedPatientContext = async (patientId: number | null): Promise<void> => {
  selectedPatientContext.value = null
  if (!patientId) {
    clearDisallowedBillingSelection()
    return
  }

  try {
    isLoadingPatientContext.value = true
    selectedPatientContext.value = await patientService.getContext(patientId) ?? null
  } catch {
    selectedPatientContext.value = null
    errorToast(toast, "Unable to check sponsor billing eligibility.")
  } finally {
    isLoadingPatientContext.value = false
    clearDisallowedBillingSelection()
  }
}

const resetForm = (): void => {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  const end = getDefaultAppointmentEnd(start)

  editingId.value = null
  form.patient_id = null
  form.clinic_id = activeBranchId.value ?? (clinicOptions.value[0]?.value as number | null) ?? null
  form.primary_provider_staff_id = null
  form.referring_staff_id = null
  form.appointment_type_id = appointmentTypeOptions.value[0]?.value as number | null ?? null
  form.appointment_status_id = (pendingStatusOption.value?.value as number | null) ?? null
  form.starts_at = start
  form.ends_at = end
  form.appointment_phase = "SESSION"
  form.location_context = "IN_CLINIC"
  form.specialty_tag_id = null
  form.treatment_area_id = null
  form.medical_diagnose_id = null
  form.diagnosis_laterality = null
  form.payer_type = null
  form.notes = ""
  form.create_all_sessions = true
  form.session_dates = [start]
  sessionCountPreview.value = 1
  selectedPatientContext.value = null

  selectedServices.value = []
  resetServicePicker()
}

const loadLookups = async (): Promise<void> => {
  const [patients, clinics, staff, appointmentTypes, appointmentStatuses, specialties, treatmentAreas, medicalDiagnoses] = await Promise.all([
    patientService.getAll({
      clinic_id: undefined,
      pageable_request: { page: 1, size: 500, name: undefined, status: Status.ACTIVE }
    }),
    clinicService.getAll({ page: 1, size: 200, name: undefined, status: Status.ACTIVE }),
    staffService.getAll({
      clinic_id: undefined,
      pageable_request: { page: 1, size: 500, name: undefined, status: Status.ACTIVE },
      staff_scope: "ALL"
    }),
    pamsAPI.get("/references/appointment-types", { params: { page: 1, size: 100, status: "ACTIVE" } }),
    pamsAPI.get("/references/appointment-statuses", { params: { page: 1, size: 100, status: "ACTIVE" } }),
    pamsAPI.get("/references/specialty-tags", { params: { page: 1, size: 500, status: "ACTIVE" } }),
    pamsAPI.get("/references/treatment-areas", { params: { page: 1, size: 500, status: "ACTIVE" } }),
    pamsAPI.get("/references/medical-diagnoses", { params: { page: 1, size: 500, status: "ACTIVE" } })
  ])

  patientOptions.value = (patients?.content ?? []).map(patient => ({
    label: patient.full_name,
    value: patient.id,
    clinicId: patient.clinic_id == null ? null : Number(patient.clinic_id)
  }))
  clinicOptions.value = (clinics?.content ?? []).map(clinic => ({
    label: clinic.name,
    value: clinic.id,
    startDay: Number(clinic.start_day),
    endDay: Number(clinic.end_day),
    startTime: String(clinic.start_time),
    endTime: String(clinic.end_time)
  }))
  staffOptions.value = (staff?.content ?? []).map(row => ({
    label: row.name,
    value: row.id,
    clinicId: row.clinic_id == null ? null : Number(row.clinic_id),
    providerType: row.appointment_provider_type,
    secondaryProviderType: row.secondary_appointment_provider_type,
    specialtyTagId: row.specialty_tag_id == null ? null : Number(row.specialty_tag_id)
  }))
  appointmentTypeOptions.value = (appointmentTypes.data?.content ?? []).map((row: { id: number; name: string }) => ({ label: row.name, value: row.id }))
  appointmentStatusOptions.value = (appointmentStatuses.data?.content ?? []).map((row: { id: number; name: string }) => ({ label: row.name, value: row.id }))
  specialtyOptions.value = (specialties.data?.content ?? []).map((row: { id: number; name: string }) => ({ label: row.name, value: row.id }))
  treatmentAreaOptions.value = (treatmentAreas.data?.content ?? []).map((row: { id: number; name: string; clinic_id?: number | null; color?: string | null }) => ({
    label: row.name,
    value: row.id,
    clinicId: row.clinic_id == null ? null : Number(row.clinic_id),
    color: row.color
  }))
  medicalDiagnoseOptions.value = (medicalDiagnoses.data?.content ?? []).map((row: { id: number; name: string }) => ({ label: row.name, value: row.id }))

  await loadServiceCatalog()
}

const numberFromKeys = (row: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    const value = Number(row[key])
    if (Number.isFinite(value) && value > 0) return value
  }

  return 0
}

const recordFromUnknown = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null

const arrayFromUnknown = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value) ? value.map(recordFromUnknown).filter(Boolean) as Array<Record<string, unknown>> : []

const serviceNameFromRow = (row: Record<string, unknown>, fallback = "Included service"): string => {
  const direct = row.name
    ?? row.service_name
    ?? row.machine_name
    ?? row.technique_name
    ?? row.evaluation_name
    ?? row.add_on_name
    ?? row.package_name
    ?? row.bundle_name

  if (direct) return String(direct)

  for (const key of ["service", "machine", "technique", "evaluation", "item", "credit_item"]) {
    const nested = recordFromUnknown(row[key])
    if (nested) return serviceNameFromRow(nested, fallback)
  }

  return fallback
}

const serviceTypeFromRow = (row: Record<string, unknown>): string | undefined => {
  const value = row.type ?? row.service_type ?? row.selection_type ?? row.item_type ?? row.category
  return value ? String(value) : undefined
}

const includedQuantityFromRow = (row: Record<string, unknown>): number =>
  Math.max(
    1,
    numberFromKeys(row, [
      "quantity",
      "qty",
      "sessions",
      "session_count",
      "number_of_sessions",
      "service_quantity",
      "included_quantity",
      "total_sessions"
    ])
  )

const extractIncludedServices = (row: Record<string, unknown>): IncludedServicePreview[] => {
  const includedKeys = [
    "included_services",
    "includedServices",
    "services",
    "items",
    "bundle_items",
    "bundleItems",
    "session_items",
    "sessionItems",
    "invoice_sub_items",
    "invoiceSubItems",
    "package_items",
    "packageItems",
    "package_services",
    "packageServices",
    "service_items",
    "serviceItems",
    "children",
    "inclusions"
  ]

  const includedRows = includedKeys.flatMap(key => arrayFromUnknown(row[key]))

  return includedRows
    .map(item => ({
      name: serviceNameFromRow(item),
      quantity: includedQuantityFromRow(item),
      type: serviceTypeFromRow(item)
    }))
    .filter(item => item.name.trim().length > 0)
}

const inheritedQuantityFromServiceRow = (
  row: Record<string, unknown>,
  type: AppointmentServiceSelectionType,
  includedServices: IncludedServicePreview[]
): number => {
  const explicitQuantity = numberFromKeys(row, [
    "total_sessions",
    "sessions",
    "session_count",
    "number_of_sessions",
    "bundle_qty",
    "bundleQty",
    "session_qty",
    "sessionQty",
    "quantity",
    "qty",
    "service_quantity",
    "package_quantity",
    "bundle_quantity"
  ])

  const includedMax = Math.max(0, ...includedServices.map(item => Number(item.quantity ?? 0)))

  if (type === "PACKAGE" || type === "BUNDLE") {
    return Math.max(1, explicitQuantity, includedMax)
  }

  return Math.max(1, explicitQuantity || 1)
}

const normalizeServiceRows = (
  rows: Array<Record<string, unknown>>,
  type: AppointmentServiceSelectionType,
  priceKeys: string[]
): ServiceOption[] =>
  rows
    .map(row => {
      const includedServices = extractIncludedServices(row)

      return {
        label: serviceNameFromRow(row, `Service ${row.id}`),
        value: Number(row.id),
        price: Number(priceKeys.map(key => row[key]).find(value => value !== undefined && value !== null) ?? 0),
        type,
        inheritedQuantity: inheritedQuantityFromServiceRow(row, type, includedServices),
        includedServices
      }
    })
    .filter(row => Number.isFinite(row.value) && row.value > 0)

const loadCatalogPage = async (url: string, params: Record<string, unknown> = {}): Promise<Array<Record<string, unknown>>> => {
  const { data } = await pamsAPI.get(url, { params: { page: 1, size: 500, status: "ACTIVE", ...params } })
  return data?.content ?? []
}

const loadServiceCatalog = async (): Promise<void> => {
  const [
    packages,
    bundles,
    machines,
    techniques,
    evaluations,
    addOnMachines,
    addOnTechniques,
    addOnHome,
    lguPackages,
    lguBundles,
    lguMachines,
    lguTechniques,
    lguEvaluations,
    lguAddOnMachines,
    lguAddOnTechniques,
    lguAddOnHome
  ] = await Promise.all([
    loadCatalogPage("/package-service-offers", { scope: "GLOBAL" }),
    loadCatalogPage("/service-bundles"),
    loadCatalogPage("/machines"),
    loadCatalogPage("/techniques"),
    loadCatalogPage("/evaluations"),
    loadCatalogPage("/add-on-machines"),
    loadCatalogPage("/add-on-techniques"),
    loadCatalogPage("/add-on-home-services"),
    loadCatalogPage("/package-service-offers", { scope: "LGU" }),
    loadCatalogPage("/lgu-service-bundles"),
    loadCatalogPage("/lgu-machines"),
    loadCatalogPage("/lgu-techniques"),
    loadCatalogPage("/lgu-evaluations"),
    loadCatalogPage("/lgu-add-on-machines"),
    loadCatalogPage("/lgu-add-on-techniques"),
    loadCatalogPage("/lgu-add-on-home-services")
  ])

  globalServiceCatalog.value = {
    PACKAGE: normalizeServiceRows(packages, "PACKAGE", ["package_price", "price"]),
    BUNDLE: normalizeServiceRows(bundles, "BUNDLE", ["bundled_price", "price"]),
    MACHINE: normalizeServiceRows(machines, "MACHINE", ["price"]),
    TECHNIQUE: normalizeServiceRows(techniques, "TECHNIQUE", ["price"]),
    EVALUATION: normalizeServiceRows(evaluations, "EVALUATION", ["price"]),
    ADD_ON_MACHINE: normalizeServiceRows(addOnMachines, "ADD_ON_MACHINE", ["add_on_price", "price"]),
    ADD_ON_TECHNIQUE: normalizeServiceRows(addOnTechniques, "ADD_ON_TECHNIQUE", ["add_on_price", "price"]),
    ADD_ON_HOME_SERVICE: normalizeServiceRows(addOnHome, "ADD_ON_HOME_SERVICE", ["add_on_price", "price"])
  }

  lguServiceCatalog.value = {
    PACKAGE: normalizeServiceRows(lguPackages, "PACKAGE", ["package_price", "price"]),
    BUNDLE: normalizeServiceRows(lguBundles, "BUNDLE", ["bundled_price", "price"]),
    MACHINE: normalizeServiceRows(lguMachines, "MACHINE", ["price"]),
    TECHNIQUE: normalizeServiceRows(lguTechniques, "TECHNIQUE", ["price"]),
    EVALUATION: normalizeServiceRows(lguEvaluations, "EVALUATION", ["price"]),
    ADD_ON_MACHINE: normalizeServiceRows(lguAddOnMachines, "ADD_ON_MACHINE", ["add_on_price", "price"]),
    ADD_ON_TECHNIQUE: normalizeServiceRows(lguAddOnTechniques, "ADD_ON_TECHNIQUE", ["add_on_price", "price"]),
    ADD_ON_HOME_SERVICE: normalizeServiceRows(lguAddOnHome, "ADD_ON_HOME_SERVICE", ["add_on_price", "price"])
  }
}

let liveFilterTimer: number | undefined

const queueLiveFilterLoad = (): void => {
  if (liveFilterTimer) window.clearTimeout(liveFilterTimer)

  liveFilterTimer = window.setTimeout(() => {
    void loadAppointments()
  }, 350)
}

const appointmentProviderIdForFilter = (appointment: AppointmentListItem): number | null => {
  const value = (appointment as any).primary_provider_staff_id ?? (appointment as any).provider_staff_id ?? (appointment as any).doctor_id
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const appointmentMatchesSearch = (appointment: AppointmentListItem, query: string): boolean => {
  if (!query) return true
  const haystack = [
    (appointment as any).patient_name,
    (appointment as any).provider_name,
    (appointment as any).doctor_name,
    (appointment as any).clinic_name,
    (appointment as any).payer_type,
    (appointment as any).billing_status,
    (appointment as any).attendance_status,
    (appointment as any).appointment_status
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}

const applyTableFilters = (items: AppointmentListItem[]): AppointmentListItem[] => {
  const query = filters.search.trim()
  return items.filter(appointment => {
    if (!appointmentMatchesSearch(appointment, query)) return false
    if (filters.ptId && appointmentProviderIdForFilter(appointment) !== Number(filters.ptId)) return false
    if (filters.payerType && (appointment as any).payer_type !== filters.payerType) return false
    if (filters.billingStatus && normalizeBillingStatus(appointment) !== filters.billingStatus) return false
    if (filters.attendanceStatus && normalizeAttendanceStatus(appointment) !== filters.attendanceStatus) return false
    return true
  })
}

const refreshDisplayedAppointmentRows = (): void => {
  const filtered = applyTableFilters(tableAppointmentSource.value)
  totalRecords.value = filtered.length

  const start = (page.value - 1) * pageSize.value
  appointments.value = filtered.slice(start, start + pageSize.value)
}

const loadAppointments = async (): Promise<void> => {
  try {
    isLoading.value = true
    const result = await appointmentPhase1Service.getAll({
      page: 1,
      size: 1000,
      from_date: toDateParam(filters.fromDate),
      to_date: toDateParam(filters.toDate),
      clinic_id: activeBranchId.value ?? undefined
    })

    tableAppointmentSource.value = result.content
    refreshDisplayedAppointmentRows()
  } catch {
    tableAppointmentSource.value = []
    appointments.value = []
    totalRecords.value = 0
    errorToast(toast, "Failed to load appointments")
  } finally {
    isLoading.value = false
  }
}

const loadCalendarAppointmentsForRange = async (range?: CalendarVisibleRange): Promise<void> => {
  if (range) {
    activeCalendarRange.value = {
      from: normalizeDateOnly(range.from),
      to: normalizeDateOnly(range.to)
    }
  }

  try {
    isCalendarLoading.value = true
    const result = await appointmentPhase1Service.getAll({
      page: 1,
      size: 1000,
      from_date: toDateParam(activeCalendarRange.value.from),
      to_date: toDateParam(activeCalendarRange.value.to),
      clinic_id: activeBranchId.value ?? undefined
    })

    calendarAppointments.value = result.content
  } catch {
    calendarAppointments.value = []
    errorToast(toast, "Failed to load calendar appointments")
  } finally {
    isCalendarLoading.value = false
  }
}

const getFormScheduleRange = (): CalendarVisibleRange => {
  const dates = [form.starts_at, ...form.session_dates]
    .map(value => value ? normalizeDateOnly(new Date(value)) : null)
    .filter((value): value is Date => Boolean(value))

  if (!dates.length) return { from: initialSelectedDate, to: initialSelectedDate }

  const from = dates.reduce((earliest, date) => date.getTime() < earliest.getTime() ? date : earliest, dates[0])
  const to = dates.reduce((latest, date) => date.getTime() > latest.getTime() ? date : latest, dates[0])

  return {
    from: addDays(from, -1),
    to: addDays(to, 1)
  }
}

const loadAvailabilityAppointmentsForRange = async (range: CalendarVisibleRange = getFormScheduleRange()): Promise<void> => {
  try {
    isAvailabilityLoading.value = true
    const result = await appointmentPhase1Service.getAll({
      page: 1,
      size: 1000,
      from_date: toDateParam(range.from),
      to_date: toDateParam(range.to),
      clinic_id: form.clinic_id ?? activeBranchId.value ?? undefined
    })

    availabilityAppointments.value = result.content
  } catch {
    errorToast(toast, "Failed to load schedule availability")
  } finally {
    isAvailabilityLoading.value = false
  }
}

let availabilityTimer: number | undefined

const queueAvailabilityLoad = (): void => {
  if (!formVisible.value) return
  if (availabilityTimer) window.clearTimeout(availabilityTimer)

  availabilityTimer = window.setTimeout(() => {
    void loadAvailabilityAppointmentsForRange()
  }, 250)
}

const refreshAppointmentViews = async (): Promise<void> => {
  const jobs: Promise<void>[] = [
    loadAppointments(),
    loadCalendarAppointmentsForRange()
  ]

  if (formVisible.value) jobs.push(loadAvailabilityAppointmentsForRange())

  await Promise.all(jobs)
}

const onPage = (event: DataTablePageEvent): void => {
  page.value = Number(event.page ?? 0) + 1
  pageSize.value = Number(event.rows ?? 20)
  refreshDisplayedAppointmentRows()
}

const selectCalendarDate = (date: Date): void => {
  const selectedDate = normalizeDateOnly(date)
  filters.fromDate = selectedDate
  filters.toDate = selectedDate
  page.value = 1
}

const openCreateDialog = (): void => {
  if (!canCreateAppointment.value) {
    errorToast(toast, "You do not have permission to create appointments")
    return
  }

  resetForm()
  formVisible.value = true
  void loadAvailabilityAppointmentsForRange()
}

const applyAppointmentToForm = (appointment: AppointmentListItem): void => {
  editingId.value = appointment.id
  form.patient_id = appointment.patient_id
  form.clinic_id = appointment.clinic_id
  form.primary_provider_staff_id = appointment.primary_provider_staff_id ?? appointment.doctor_id ?? null
  form.referring_staff_id = appointment.referring_staff_id ?? null
  form.appointment_type_id = appointment.appointment_type_id
  form.appointment_status_id = appointment.appointment_status_id
  form.starts_at = new Date(appointment.starts_at)
  form.ends_at = new Date(appointment.ends_at)
  form.appointment_phase = appointment.appointment_phase
  form.location_context = appointment.location_context
  form.specialty_tag_id = appointment.specialty_tag_id ?? null
  form.treatment_area_id = appointment.treatment_area_id ?? null
  form.medical_diagnose_id = appointment.medical_diagnose_id ?? null
  form.diagnosis_laterality = appointment.diagnosis_laterality as Laterality | null
  form.payer_type = appointment.payer_type as PayerType | null
  form.notes = appointment.notes ?? ""
  form.create_all_sessions = false
  form.session_dates = [new Date(appointment.starts_at)]
  selectedServices.value = []
}

const openEditDialog = (appointment: AppointmentListItem): void => {
  if (!canEditAppointment.value) {
    errorToast(toast, "You do not have permission to edit appointments")
    return
  }

  applyAppointmentToForm(appointment)
  formVisible.value = true
  void loadAvailabilityAppointmentsForRange()
}

const applyAppointmentFlowSummary = (summary: AppointmentFlowSummary): void => {
  detailFlowSummary.value = summary
  detailAppointment.value = summary.appointment
  activeAppointment.value = summary.appointment
  detailPlannedServices.value = summary.planned_services ?? []
  detailBillingPreparation.value = summary.billing_preparation as AppointmentBillingPreparation | null
}

const buildAttendanceItems = (planned: AppointmentPlannedService[]): AttendanceItem[] =>
  planned.map(item => {
    const appointmentConsumed = Math.max(0, Number(item.appointment_consumed_quantity ?? 0))
    const remaining = Math.max(
      0,
      Number(item.remaining_quantity ?? (Number(item.planned_quantity ?? 0) - Number(item.consumed_quantity ?? 0)))
    )
    return {
      ...item,
      remaining,
      appointmentConsumed,
      selected: false,
      quantity: remaining > 0 && appointmentConsumed <= 0 ? 1 : 0
    }
  })

const loadAppointmentFlowSummary = async (appointmentId: number): Promise<AppointmentFlowSummary> => {
  const summary = await appointmentPhase1Service.getFlowSummary(appointmentId)
  applyAppointmentFlowSummary(summary)
  return summary
}

const openDetailsDialog = async (appointment: AppointmentListItem): Promise<void> => {
  if (!canViewAppointmentDetails.value) {
    errorToast(toast, "You do not have permission to view appointment details")
    return
  }

  detailAppointment.value = appointment
  activeAppointment.value = appointment
  detailFlowSummary.value = null
  detailPlannedServices.value = []
  detailBillingPreparation.value = null
  detailsVisible.value = true

  try {
    await loadAppointmentFlowSummary(appointment.id)
  } catch {
    const plannedServicesPromise = appointmentPhase1Service
      .getPlannedServices(appointment.id)
      .then((plannedServices) => {
        detailPlannedServices.value = plannedServices
      })
      .catch(() => {
        detailPlannedServices.value = []
      })

    const billingPreparationPromise = canManageAppointmentBilling.value
      ? appointmentBillingService
        .getPreparation(appointment.id)
        .then((preparation) => {
          detailBillingPreparation.value = preparation
        })
        .catch(() => {
          detailBillingPreparation.value = null
        })
      : Promise.resolve()

    await Promise.all([plannedServicesPromise, billingPreparationPromise])
  }
}

const editFromDetails = (): void => {
  if (!detailAppointment.value) return
  detailsVisible.value = false
  openEditDialog(detailAppointment.value)
}

const openAttendanceFromDetails = (): void => {
  if (!detailAppointment.value) return

  const appointment = detailAppointment.value
  detailsVisible.value = false

  void openAttendanceDialog(appointment)
}

const refreshDetailBillingPreparation = async (): Promise<void> => {
  if (!detailAppointment.value || !canManageAppointmentBilling.value) return

  try {
    await loadAppointmentFlowSummary(detailAppointment.value.id)
  } catch {
    try {
      detailBillingPreparation.value = await appointmentBillingService.getPreparation(detailAppointment.value.id)
    } catch {
      detailBillingPreparation.value = null
    }
  }
}

const openAppointmentBillingDialog = async (): Promise<void> => {
  if (!detailAppointment.value || !canManageAppointmentBilling.value) return
  appointmentBillingVisible.value = true
  await refreshDetailBillingPreparation()
}

const openTenderFromBillingDialog = async (): Promise<void> => {
  const document = tenderableBillingDocument.value
  if (!document) {
    errorToast(toast, "Create a Self Pay bill before tendering.")
    return
  }
  await openTenderDialog(document)
}

const openInvoicePrintWindow = (document: AppointmentBillingDocument): void => {
  const patientId = detailAppointment.value?.patient_id ?? detailBillingPreparation.value?.appointment.patient_id
  const appointmentId = detailAppointment.value?.id ?? detailBillingPreparation.value?.appointment.id
  const routeName = document.payer_type === "HMO"
    ? "hmo-patient-billing-summary-print"
    : document.payer_type === "LGU"
      ? "lgu-patient-billing-summary-print"
      : "self-pay-patient-billing-summary-print"
  const routeLocation = router.resolve({
    name: routeName,
    query: {
      billing_id: String(document.id),
      ...(patientId ? { patient_id: String(patientId) } : {}),
      ...(appointmentId ? { appointment_id: String(appointmentId) } : {}),
      autoprint: "1"
    }
  })
  window.open(routeLocation.href, "_blank", "noopener,noreferrer")
}

const buildHmoClaimPayload = () => {
  const loaNumber = hmoClaimForm.loa_number.trim()
  if (!loaNumber) {
    errorToast(toast, "Enter the HMO LOA number before creating the claim.")
    return null
  }

  return {
    loa_number: loaNumber,
    approval_code: hmoClaimForm.approval_code.trim() || null,
    notes: hmoClaimForm.notes.trim() || null
  }
}

const buildLguClaimPayload = () => ({
  approval_code: lguClaimForm.approval_code.trim() || null,
  notes: lguClaimForm.notes.trim() || null
})

const canCreateSponsorClaimFromDetails = (payerType: "HMO" | "LGU"): boolean => {
  const appointment = detailAppointment.value
  const preparation = detailBillingPreparation.value

  if (!appointment || !preparation) return false

  if (payerType === "HMO") {
    return (
      preparation.billing_path.action === "CREATE_HMO_CLAIM" &&
      preparation.billing_path.payer_type === "HMO" &&
      (
        Number((appointment as any).hmo_id ?? 0) > 0 ||
        Number((preparation.appointment as any)?.hmo_id ?? 0) > 0 ||
        preparation.consumed_services.count > 0
      )
    )
  }

  return (
    preparation.billing_path.action === "CREATE_LGU_CLAIM" &&
    preparation.billing_path.payer_type === "LGU" &&
    Number((appointment as any).credit_account_id ?? 0) > 0 &&
    preparation.consumed_services.count > 0
  )
}

const createInvoiceDocumentForCurrentBillingPath = async (): Promise<AppointmentBillingDocument | null> => {
  if (!detailAppointment.value || !detailBillingPreparation.value) return null

  const action = detailBillingPreparation.value.billing_path.action
  if (action === "CREATE_SELF_PAY_APPOINTMENT_BILL") {
    return appointmentBillingService.createSelfPayAppointmentBill(detailAppointment.value.id)
  }
  if (action === "CREATE_SELF_PAY_PACKAGE_BILL") {
    return appointmentBillingService.createSelfPayPackageBill(detailAppointment.value.id)
  }
  if (action === "CREATE_DOCUMENTATION_INVOICE") {
    return appointmentBillingService.createSessionDocumentationInvoice(detailAppointment.value.id)
  }
  if (action === "CREATE_HMO_CLAIM") {
    if (!canCreateSponsorClaimFromDetails("HMO")) {
      errorToast(toast, "Patient has no active HMO sponsor information for this appointment.")
      return null
    }
    const payload = buildHmoClaimPayload()
    return payload ? appointmentBillingService.createHmoClaim(detailAppointment.value.id, payload) : null
  }
  if (action === "CREATE_LGU_CLAIM") {
    if (!canCreateSponsorClaimFromDetails("LGU")) {
      errorToast(toast, "Patient has no active LGU sponsor information for this appointment.")
      return null
    }
    return appointmentBillingService.createLguClaim(detailAppointment.value.id, buildLguClaimPayload())
  }

  errorToast(toast, "Invoice printing for this billing type is not wired yet.")
  return null
}

const printAppointmentInvoiceFromBillingDialog = async (): Promise<void> => {
  try {
    isBillingActionLoading.value = true
    const document = await createInvoiceDocumentForCurrentBillingPath()
    if (!document) return
    successToast(toast, "Invoice ready")
    await refreshDetailBillingPreparation()
    await refreshAppointmentViews()
    openInvoicePrintWindow(document)
  } catch (error) {
    const message = (error as any)?.response?.data?.message
    errorToast(toast, message ? String(message) : "Unable to print invoice")
  } finally {
    isBillingActionLoading.value = false
  }
}

const loadPaymentMethods = async (): Promise<void> => {
  if (paymentMethods.value.length) return

  try {
    isPaymentMethodsLoading.value = true
    paymentMethods.value = await appointmentBillingService.getPaymentMethods()
  } catch (error) {
    const message = (error as any)?.response?.data?.message
    errorToast(toast, message ? String(message) : "Unable to load payment methods")
  } finally {
    isPaymentMethodsLoading.value = false
  }
}

const openTenderDialog = async (document: AppointmentBillingDocument): Promise<void> => {
  tenderBillingDocument.value = document
  tenderForm.amount_tendered = Number(document.totals.balance ?? 0)
  tenderForm.payment_method_id = paymentMethods.value[0]?.id ?? null
  tenderForm.payment_reference = ""
  tenderForm.notes = ""
  tenderForm.senior_pwd_id_presented = false
  tenderForm.senior_pwd_id_reference = ""
  tenderForm.custom_discount_type = null
  tenderForm.custom_discount_value = null
  tenderVisible.value = true
  await loadPaymentMethods()
  tenderForm.payment_method_id = tenderForm.payment_method_id ?? paymentMethods.value[0]?.id ?? null
}

const submitTenderPayment = async (): Promise<void> => {
  if (!tenderBillingDocument.value) return

  const amountTendered = Number(tenderForm.amount_tendered ?? 0)
  if (!Number.isFinite(amountTendered) || amountTendered <= 0) {
    errorToast(toast, "Enter a valid tendered amount.")
    return
  }

  if (!tenderForm.payment_method_id) {
    errorToast(toast, "Select a payment method.")
    return
  }

  try {
    isTenderSaving.value = true
    const result = await appointmentBillingService.tenderSelfPayBillingDocument(tenderBillingDocument.value.id, {
      amount_tendered: amountTendered,
      payment_method_id: tenderForm.payment_method_id,
      payment_reference: tenderForm.payment_reference.trim() || null,
      notes: tenderForm.notes.trim() || null,
      senior_pwd_id_presented: tenderForm.senior_pwd_id_presented,
      senior_pwd_id_reference: tenderForm.senior_pwd_id_reference.trim() || null,
      custom_discount_type: tenderForm.custom_discount_type,
      custom_discount_value: tenderForm.custom_discount_value
    })
    tenderBillingDocument.value = result.billing_document
    tenderVisible.value = false
    successToast(toast, `Payment saved${result.receipt.receipt_number ? `: ${result.receipt.receipt_number}` : ""}`)
    await refreshDetailBillingPreparation()
    await refreshAppointmentViews()
  } catch (error) {
    const message = (error as any)?.response?.data?.message
    errorToast(toast, message ? String(message) : "Unable to save payment")
  } finally {
    isTenderSaving.value = false
  }
}

watch(
  () => [
    tenderVisible.value,
    tenderForm.senior_pwd_id_presented,
    tenderForm.custom_discount_type,
    tenderForm.custom_discount_value,
    tenderBillingDocument.value?.id
  ],
  () => {
    if (!tenderVisible.value || !tenderBillingDocument.value) return
    tenderForm.amount_tendered = Number(tenderDiscountSummary.value.amountDue.toFixed(2))
  }
)

const runBillingActionFromDetails = async (
  action: (appointmentId: number) => Promise<AppointmentBillingDocument>,
  successMessage: string,
  shouldOfferTender = false
): Promise<void> => {
  if (!detailAppointment.value) return

  try {
    isBillingActionLoading.value = true
    const document = await action(detailAppointment.value.id)
    successToast(toast, successMessage)
    await refreshDetailBillingPreparation()
    await refreshAppointmentViews()
    if (shouldOfferTender && Number(document.totals.balance ?? 0) > 0) {
      await openTenderDialog(document)
    }
  } catch (error) {
    const message = (error as any)?.response?.data?.message
    errorToast(toast, message ? String(message) : "Billing action failed")
  } finally {
    isBillingActionLoading.value = false
  }
}

const createSelfPayAppointmentBillFromDetails = (): void => {
  void runBillingActionFromDetails(
    appointmentBillingService.createSelfPayAppointmentBill,
    "Self Pay appointment bill created",
    true
  )
}

const createSelfPayPackageBillFromDetails = (): void => {
  void runBillingActionFromDetails(
    appointmentBillingService.createSelfPayPackageBill,
    "Self Pay package bill created",
    true
  )
}

const createSessionDocumentationInvoiceFromDetails = (): void => {
  void runBillingActionFromDetails(
    appointmentBillingService.createSessionDocumentationInvoice,
    "Session documentation invoice created"
  )
}

const createHmoClaimFromDetails = (): void => {
  if (!canCreateSponsorClaimFromDetails("HMO")) {
    errorToast(toast, "Patient has no active HMO sponsor information for this appointment.")
    return
  }

  const payload = buildHmoClaimPayload()
  if (!payload) return

  void runBillingActionFromDetails(
    (appointmentId) => appointmentBillingService.createHmoClaim(appointmentId, payload),
    "HMO claim created"
  )
}

const createLguClaimFromDetails = (): void => {
  if (!canCreateSponsorClaimFromDetails("LGU")) {
    errorToast(toast, "Patient has no active LGU sponsor information for this appointment.")
    return
  }

  void runBillingActionFromDetails(
    (appointmentId) => appointmentBillingService.createLguClaim(appointmentId, buildLguClaimPayload()),
    "LGU claim created"
  )
}

const saveAppointment = async (): Promise<void> => {
  form.appointment_status_id = form.appointment_status_id ?? (pendingStatusOption.value?.value as number | null) ?? null
  form.clinic_id = activeBranchId.value ?? form.clinic_id

  if (!form.patient_id || !form.clinic_id || !form.appointment_type_id || !form.appointment_status_id || !form.starts_at || !form.ends_at) {
    errorToast(toast, "Complete patient, clinic branch, type, start, and end.")
    return
  }

  if (!editingId.value && !selectedServices.value.length) {
    errorToast(toast, "Add at least one planned service.")
    return
  }

  if (selectedServices.value.length && !form.payer_type) {
    errorToast(toast, "Select a billing type before saving planned services.")
    return
  }

  if (form.payer_type && !isAppointmentPayerTypeAllowed(form.payer_type)) {
    errorToast(toast, "Selected patient is not eligible for that billing type.")
    return
  }

  try {
    isSaving.value = true
    await refreshSessionPreview()
    const payload = buildAppointmentPayload(form.starts_at)

    if (editingId.value) {
      await appointmentPhase1Service.update(editingId.value, payload)
      successToast(toast, "Appointment updated")
    } else {
      const created = await appointmentPhase1Service.create(payload)
      const totalCreated = created.appointment_ids?.length ?? created.total_sessions ?? 1
      successToast(toast, `Appointment created with ${totalCreated} session${totalCreated > 1 ? "s" : ""}`)
    }

    formVisible.value = false
    await refreshAppointmentViews()
  } catch (error) {
    let message = "Failed to save appointment"
    try {
      errorHandler(error)
    } catch (handledError) {
      if (handledError instanceof Error && handledError.message.trim()) {
        message = handledError.message
      }
    }
    errorToast(toast, message)
  } finally {
    isSaving.value = false
  }
}

const savePlannedServicesForAppointment = async (appointmentId: number, payerType?: string | null) =>
  appointmentPhase1Service.savePlannedServices(appointmentId, {
    payer_type: payerType,
    services: selectedServices.value.map(service => ({
      type: service.type,
      id: service.value,
      quantity: servicePayloadQuantity(service)
    }))
  })

const canceledStatusOption = computed(() =>
  appointmentStatusOptions.value.find(option => String(option.label).toLowerCase().includes("cancel"))
  ?? null
)

const cancelAppointment = async (appointment: AppointmentListItem): Promise<void> => {
  if (!canCancelAppointment.value) {
    errorToast(toast, "You do not have permission to cancel appointments")
    return
  }

  if (!window.confirm(`Cancel appointment for ${appointment.patient_name}?`)) return

  const canceledStatusId = canceledStatusOption.value?.value
  if (!canceledStatusId) {
    errorToast(toast, "Cancelled appointment status was not found in references")
    return
  }

  try {
    const start = new Date(appointment.starts_at)
    const end = new Date(appointment.ends_at)
    const payload: AppointmentCreatePayload = {
      patient_id: (appointment as any).patient_id,
      clinic_id: (appointment as any).clinic_id,
      primary_provider_staff_id: (appointment as any).primary_provider_staff_id ?? (appointment as any).doctor_id ?? null,
      referring_staff_id: (appointment as any).referring_staff_id ?? null,
      appointment_type_id: (appointment as any).appointment_type_id,
      appointment_status_id: Number(canceledStatusId),
      specialty_tag_id: (appointment as any).specialty_tag_id ?? null,
      treatment_area_id: (appointment as any).treatment_area_id ?? null,
      medical_category_id: null,
      medical_diagnose_id: (appointment as any).medical_diagnose_id ?? null,
      diagnosis_laterality: (appointment as any).diagnosis_laterality ?? null,
      pt_case_impression_id: null,
      pt_case_laterality: null,
      starts_at: toDateTimePayload(start),
      ends_at: toDateTimePayload(end),
      appointment_phase: (appointment as any).appointment_phase,
      location_context: (appointment as any).location_context,
      payer_type: (appointment as any).payer_type,
      notes: (appointment as any).notes ?? undefined,
      services: [],
      session_schedules: []
    }

    await appointmentPhase1Service.update(appointment.id, payload)
    successToast(toast, "Appointment canceled")
    await refreshAppointmentViews()
  } catch {
    errorToast(toast, "Failed to cancel appointment")
  }
}

const openServicesDialog = async (appointment: AppointmentListItem): Promise<void> => {
  activeAppointment.value = appointment
  selectedServices.value = []
  resetServicePicker(appointment.payer_type)
  servicesVisible.value = true

  try {
    servicesModalPlannedServices.value = await appointmentPhase1Service.getPlannedServices(appointment.id)
  } catch {
    servicesModalPlannedServices.value = []
  }
}

const removeDisallowedSelectedServices = (billingType: PayerType | null): void => {
  const allowed = new Set(getAllowedServiceTypes(billingType))
  selectedServices.value = selectedServices.value.filter(service => allowed.has(service.type))
}

const getSelectedServiceQuantity = (selected: ServiceOption): number => {
  const requestedQuantity = Math.max(1, Number(servicePicker.quantity ?? 1))

  if (selected.type === "PACKAGE") {
    return 1
  }

  if (selected.type === "BUNDLE") {
    return Math.max(1, Number(selected.inheritedQuantity ?? 1), requestedQuantity)
  }

  return requestedQuantity
}

const addPickedService = (): void => {
  const allowedTypes = new Set(getAllowedServiceTypes(currentServiceBillingType.value))
  if (!allowedTypes.has(servicePicker.type)) {
    errorToast(toast, "That service is not allowed for this billing type")
    resetServicePicker()
    return
  }

  const selected = currentServiceOptions.value.find(option => option.value === servicePicker.id)
  if (!selected) {
    errorToast(toast, "Select a service first")
    return
  }

  if (homeCareAddOnTypes.has(selected.type)) {
    form.location_context = "HOME_CARE"
  }

  selectedServices.value.push({
    ...selected,
    name: selected.label,
    quantity: getSelectedServiceQuantity(selected),
    typeLabel: serviceTypeLabel(selected.type)
  })

  servicePicker.id = null
  servicePicker.quantity = 1
  void refreshSessionPreview()
}

const removeSelectedService = (index: number): void => {
  selectedServices.value.splice(index, 1)
  void refreshSessionPreview()
}

const saveServices = async (): Promise<void> => {
  if (!activeAppointment.value) return

  if (!selectedServices.value.length) {
    errorToast(toast, "Add at least one service")
    return
  }

  try {
    isSavingServices.value = true
    await savePlannedServicesForAppointment(activeAppointment.value.id, activeAppointment.value.payer_type)
    servicesModalPlannedServices.value = await appointmentPhase1Service.getPlannedServices(activeAppointment.value.id)
    selectedServices.value = []
    successToast(toast, "Planned services saved")
    await refreshAppointmentViews()
  } catch {
    errorToast(toast, "Failed to save planned services")
  } finally {
    isSavingServices.value = false
  }
}

const openAttendanceDialog = async (appointment: AppointmentListItem): Promise<void> => {
  if (!canMarkAttendance.value) {
    errorToast(toast, "You do not have permission to mark attendance")
    return
  }

  activeAppointment.value = appointment
  detailFlowSummary.value = null
  attendanceVisible.value = true

  try {
    const summary = await loadAppointmentFlowSummary(appointment.id)
    const planned = summary.planned_services ?? []
    attendancePlannedServices.value = planned
    attendanceItems.value = buildAttendanceItems(planned)
  } catch {
    try {
      const planned = await appointmentPhase1Service.getPlannedServices(appointment.id)
      attendancePlannedServices.value = planned
      attendanceItems.value = buildAttendanceItems(planned)
    } catch {
      attendancePlannedServices.value = []
      attendanceItems.value = []
      errorToast(toast, "Failed to load planned services")
    }
  }
}

const saveAttendance = async (): Promise<void> => {
  if (!activeAppointment.value) return

  const selectedBundleIds = new Set(
    attendanceItems.value
      .filter(item => item.selected && item.type === "BUNDLE")
      .map(item => Number(item.id))
  )

  const items = attendanceItems.value
    .filter(item => item.selected && item.remaining > 0 && item.appointmentConsumed <= 0 && item.type !== "PACKAGE")
    .filter(item => !item.parent_credit_item_id || !selectedBundleIds.has(Number(item.parent_credit_item_id)))
    .map(item => ({
      credit_item_id: item.id,
      quantity: Math.min(item.remaining, Math.max(1, Number(item.quantity ?? 1)))
    }))

  if (!items.length) {
    errorToast(toast, "Select at least one finished service")
    return
  }

  try {
    isSavingAttendance.value = true
    await appointmentPhase1Service.saveAttendance(activeAppointment.value.id, { items })
    successToast(toast, "Attendance saved")
    await openAttendanceDialog(activeAppointment.value)
    await refreshAppointmentViews()
  } catch (error) {
    const message = (error as any)?.response?.data?.message
    errorToast(toast, message ? String(message) : "Failed to save attendance")
  } finally {
    isSavingAttendance.value = false
  }
}

const dropOutActiveAppointment = async (reason: string): Promise<void> => {
  if (!activeAppointment.value) return
  if (!canDropOutActiveAppointment.value) {
    errorToast(toast, "This LGU appointment cannot be marked as dropped out.")
    return
  }

  try {
    isDroppingOut.value = true
    const summary = await appointmentPhase1Service.updateDropoutStatus(activeAppointment.value.id, {
      dropout_status: "DROPPED_OUT",
      reason
    })
    applyAppointmentFlowSummary(summary)
    attendanceItems.value = buildAttendanceItems(summary.planned_services ?? [])
    successToast(toast, "LGU patient marked as dropped out")
    await refreshAppointmentViews()
  } catch (error) {
    const message = (error as any)?.response?.data?.message
    errorToast(toast, message ? String(message) : "Failed to mark patient as dropped out")
  } finally {
    isDroppingOut.value = false
  }
}

const undoDropOutActiveAppointment = async (): Promise<void> => {
  if (!activeAppointment.value) return
  if (!isLguAppointment(activeAppointment.value) || !canManageAppointmentBilling.value) {
    errorToast(toast, "This LGU appointment cannot undo drop-out status.")
    return
  }

  try {
    isDroppingOut.value = true
    const summary = await appointmentPhase1Service.undoDropoutStatus(activeAppointment.value.id)
    applyAppointmentFlowSummary(summary)
    attendanceItems.value = buildAttendanceItems(summary.planned_services ?? [])
    successToast(toast, "LGU drop-out status restored")
    await refreshAppointmentViews()
  } catch (error) {
    const message = (error as any)?.response?.data?.message
    errorToast(toast, message ? String(message) : "Failed to undo patient drop-out status")
  } finally {
    isDroppingOut.value = false
  }
}

onMounted(async () => {
  try {
    await branchStore.initializeFromAuthSession()
    await loadLookups()
    resetForm()
    await refreshAppointmentViews()
  } catch {
    errorToast(toast, "Failed to load appointment setup data")
  }
})

watch(
  () => form.starts_at,
  (date, previousDate) => {
    if (!date) return

    const previousStart = previousDate instanceof Date ? previousDate : null
    const previousDefaultEnd = previousStart ? getDefaultAppointmentEnd(previousStart) : null
    const shouldAutoSetEnd =
      !form.ends_at ||
      form.ends_at.getTime() <= date.getTime() ||
      (previousDefaultEnd ? isWithinOneMinute(form.ends_at, previousDefaultEnd) : false)

    if (shouldAutoSetEnd) {
      form.ends_at = getDefaultAppointmentEnd(date)
    }

    if (!form.session_dates.length) {
      form.session_dates = [new Date(date)]
      return
    }

    const first = new Date(form.session_dates[0])
    const updated = new Date(date)
    updated.setSeconds(0, 0)

    if (first.getTime() !== updated.getTime()) {
      form.session_dates[0] = updated
    }

    syncSessionDateCountFromSelectedServices()
  }
)

watch(
  activeBranchId,
  (clinicId) => {
    if (clinicId && !editingId.value) {
      form.clinic_id = clinicId
    }

    page.value = 1
    void refreshAppointmentViews()
  }
)

watch(
  () => form.primary_provider_staff_id,
  (staffId) => {
    if (!staffId) return

    const selectedPt = staffOptions.value.find(option => Number(option.value) === Number(staffId))
    if (selectedPt?.specialtyTagId) {
      form.specialty_tag_id = selectedPt.specialtyTagId
    }
  }
)

watch(
  () => form.patient_id,
  (patientId) => {
    void loadSelectedPatientContext(patientId)
  }
)

watch(
  () => [
    filters.search,
    filters.ptId,
    filters.payerType,
    filters.billingStatus,
    filters.attendanceStatus,
    filters.fromDate?.getTime() ?? null,
    filters.toDate?.getTime() ?? null
  ],
  () => {
    page.value = 1
    queueLiveFilterLoad()
  }
)

watch(
  () => [
    formVisible.value,
    form.clinic_id,
    form.primary_provider_staff_id,
    form.starts_at?.getTime() ?? null,
    form.ends_at?.getTime() ?? null,
    ...form.session_dates.map(date => date ? new Date(date).getTime() : null)
  ],
  () => {
    queueAvailabilityLoad()
  }
)

watch(
  () => form.payer_type,
  (billingType) => {
    removeDisallowedSelectedServices(billingType)
    resetServicePicker(billingType)
    void refreshSessionPreview()
  }
)
</script>
