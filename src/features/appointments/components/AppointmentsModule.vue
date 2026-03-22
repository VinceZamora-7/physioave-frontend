<template>
  <main class="app-page-shell space-y-5">
    <section class="rounded-3xl border border-[#A91D8B]/25 bg-[linear-gradient(120deg,rgba(36,39,87,0.14),rgba(94,24,105,0.10),rgba(169,29,139,0.18))] shadow-[0_18px_40px_rgba(36,39,87,0.12)] p-4 sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Appointments Workbench</div>
          <p class="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Manage clinic schedules, review same-day bookings, and jump straight into patient or billing follow-up from one place.
          </p>
          <div class="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span class="rounded-full border border-white/40 bg-white/55 px-3 py-1 dark:border-white/10 dark:bg-white/10">
              Date: {{ selectedDateLabel }}
            </span>
            <span class="rounded-full border border-white/40 bg-white/55 px-3 py-1 dark:border-white/10 dark:bg-white/10">
              Clinic: {{ selectedClinic?.name || "Select clinic schedule" }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
            <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Appointments</div>
            <div class="mt-1 text-2xl font-semibold">{{ totalElements }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
            <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Day Bookings</div>
            <div class="mt-1 text-2xl font-semibold">{{ dayBookings.length }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
            <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Rescheduled</div>
            <div class="mt-1 text-2xl font-semibold">{{ rescheduledAppointmentsCount }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
            <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Needs Billing</div>
            <div class="mt-1 text-2xl font-semibold">{{ billingAttentionCount }}</div>
          </article>
        </div>
      </div>
    </section>

    <section :class="sectionCardClass">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 :class="sectionTitleClass">Clinic Calendar</h3>
          <p class="text-sm opacity-70">Pick a clinic schedule first to see valid booking days and booking dots for the month.</p>
          <span class="text-sm opacity-70">Selected: {{ selectedDateLabel }}</span>
        </div>
        <IftaLabel class="min-w-[260px]">
          <Select
            v-model="selectedClinicId"
            :options="clinicOptions"
            optionLabel="name"
            optionValue="id"
            fluid
            filter
            placeholder="Select clinic schedule"
            :pt="ptSelect"
          />
          <label>Clinic Schedule</label>
        </IftaLabel>
      </div>
      <small v-if="selectedClinicScheduleLabel" class="opacity-70">{{ selectedClinicScheduleLabel }}</small>
      <DatePicker
        v-model="calendarDate"
        inline
        fluid
        :manualInput="false"
        showWeek
        :disabledDays="calendarDisabledDays"
        @month-change="onCalendarMonthChange"
      >
        <template #date="slotProps">
          <div class="relative h-8 w-8 grid place-items-center">
            <span>{{ slotProps.date.day }}</span>
            <span
              v-if="hasBookingDot(slotProps.date)"
              class="absolute bottom-[2px] h-1.5 w-1.5 rounded-full bg-red-500"
            />
          </div>
        </template>
      </DatePicker>
    </section>

    <section :class="sectionCardClass">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h3 :class="sectionTitleClass">Appointments</h3>
          <p class="text-sm opacity-70">Filter the selected date, open full detail, and move quickly into reschedule or billing actions.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <IftaLabel>
          <Select
            v-model="statusFilter"
            :options="appointmentStatusOptions"
            showClear
            fluid
            placeholder="All statuses"
            :pt="ptSelect"
          />
          <label>Status filter</label>
        </IftaLabel>
        <div class="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-3">
          <Button label="Create Appointment" icon="pi pi-plus" :pt="ptPrimaryBtn" @click="openCreateDialog" />
          <Button label="Refresh Table" icon="pi pi-refresh" outlined :pt="ptOutlinedBtn" @click="refreshAll" />
          <Button label="Export CSV" icon="pi pi-download" severity="secondary" outlined :pt="ptOutlinedBtn" @click="onExportCsv" />
        </div>
      </div>

      <div class="overflow-x-auto">
        <DataTable
          :value="appointments"
          dataKey="id"
          paginator
          :rows="pageSize"
          :first="(page - 1) * pageSize"
          :totalRecords="totalElements"
          :loading="isLoading"
          size="small"
          @page="onPage"
          selectionMode="single"
          @rowSelect="onSelectRow"
        >
          <template #empty>
            <div class="py-8 text-center text-sm opacity-70">
              No appointments found for the selected date and filter.
            </div>
          </template>
          <Column field="patient_name" header="Patient" />
          <Column field="doctor_name" header="Doctor" />
          <Column field="starts_at" header="Start">
            <template #body="{data}">{{ formatDateTime(data.starts_at) }}</template>
          </Column>
          <Column field="appointment_status" header="Appt Status">
            <template #body="{data}">
              <Tag :value="displayAppointmentStatus(data.appointment_status)" :severity="appointmentSeverity(data.appointment_status)" />
            </template>
          </Column>
          <Column field="billing_status" header="Billing">
            <template #body="{data}">
              <Tag :value="displayBillingStatus(data.billing_status)" :severity="billingSeverity(data.billing_status)" />
            </template>
          </Column>
          <Column field="reschedule_count" header="Reschedules" />
          <Column header="Actions">
            <template #body="{data}">
              <div class="flex items-center gap-1">
                <Button size="small" text icon="pi pi-calendar-plus" @click="openReschedule(data)" />
                <Button
                  v-if="canDeleteAppointments"
                  size="small"
                  text
                  severity="danger"
                  icon="pi pi-trash"
                  @click="confirmDeleteAppointment(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </section>

    <section :class="sectionCardClass">
      <div>
        <h3 :class="sectionTitleClass">Calendar Day Bookings</h3>
        <p class="text-sm opacity-70">A quick same-day list so you can review what is actually booked on the selected date.</p>
      </div>
      <DataTable :value="dayBookings" dataKey="id" size="small" selectionMode="single" @rowSelect="onSelectRow">
        <template #empty>
          <div class="py-6 text-center text-sm opacity-70">
            No bookings found for this day.
          </div>
        </template>
        <Column field="patient_name" header="Patient" />
        <Column field="starts_at" header="Start">
          <template #body="{data}">{{ formatDateTime(data.starts_at) }}</template>
        </Column>
        <Column field="appointment_status" header="Status">
          <template #body="{data}">
            <Tag :value="displayAppointmentStatus(data.appointment_status)" :severity="appointmentSeverity(data.appointment_status)" />
          </template>
        </Column>
        <Column field="billing_status" header="Billing">
          <template #body="{data}">
            <Tag :value="displayBillingStatus(data.billing_status)" :severity="billingSeverity(data.billing_status)" />
          </template>
        </Column>
      </DataTable>
    </section>

    <section v-if="selectedDetail" :class="sectionCardClass">
      <div class="rounded-2xl border border-[#A91D8B]/20 bg-[linear-gradient(120deg,rgba(36,39,87,0.08),rgba(94,24,105,0.06),rgba(169,29,139,0.10))] p-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 :class="sectionTitleClass">Appointment Detail</h3>
            <p class="mt-1 text-sm opacity-70">Selected appointment summary and fast links to the related patient and billing records.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Tag :value="displayAppointmentStatus(selectedDetail.appointment_status)" :severity="appointmentSeverity(selectedDetail.appointment_status)" />
            <Tag :value="displayBillingStatus(selectedDetail.billing_status)" :severity="billingSeverity(selectedDetail.billing_status)" />
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div :class="detailCardClass">
          <div class="text-xs uppercase tracking-wide opacity-70">Patient</div>
          <div class="font-medium">{{ selectedDetail.patient_name }}</div>
        </div>
        <div :class="detailCardClass">
          <div class="text-xs uppercase tracking-wide opacity-70">Doctor</div>
          <div class="font-medium">{{ selectedDetail.doctor_name || "N/A" }}</div>
        </div>
        <div :class="detailCardClass">
          <div class="text-xs uppercase tracking-wide opacity-70">Schedule</div>
          <div class="font-medium">{{ formatDateTime(selectedDetail.starts_at) }} - {{ formatDateTime(selectedDetail.ends_at) }}</div>
        </div>
        <div :class="detailCardClass">
          <div class="text-xs uppercase tracking-wide opacity-70">Appointment Status</div>
          <div class="mt-1">
            <Tag :value="displayAppointmentStatus(selectedDetail.appointment_status)" :severity="appointmentSeverity(selectedDetail.appointment_status)" />
          </div>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 pt-1">
        <Button label="Open Patient Record" icon="pi pi-user" outlined :pt="ptOutlinedBtn" class="min-w-[190px]" @click="goToPatients" />
        <Button
          :label="selectedDetail.billing_id ? 'Open Billing Record' : 'Create Billing'"
          icon="pi pi-receipt"
          severity="secondary"
          outlined
          :pt="ptOutlinedBtn"
          class="min-w-[190px]"
          @click="goToBilling"
        />
      </div>
    </section>

    <Dialog v-model:visible="rescheduleVisible" modal header="Reschedule Appointment" :style="{width:'520px'}">
      <div class="space-y-3">
        <p v-if="activeAppointment">Current reschedules: <strong>{{ activeAppointment.reschedule_count }}</strong> / 3</p>
        <Message v-if="needsOverrideReason" severity="warn" :closable="false">
          Max reschedule reached. Owner override is required and a reason is mandatory.
        </Message>
        <IftaLabel>
          <DatePicker
            v-model="rescheduleStart"
            showTime
            fluid
            :manualInput="false"
            :stepMinute="5"
            :disabledDays="calendarDisabledDays"
            hourFormat="24"
          />
          <label>New Start</label>
        </IftaLabel>
        <IftaLabel>
          <DatePicker
            v-model="rescheduleEnd"
            showTime
            fluid
            :manualInput="false"
            :stepMinute="5"
            :disabledDays="calendarDisabledDays"
            hourFormat="24"
          />
          <label>New End</label>
        </IftaLabel>
        <IftaLabel>
          <InputText v-model="overrideReason" fluid :disabled="!needsOverrideReason" />
          <label>Owner override reason (required after 3)</label>
        </IftaLabel>
        <small class="opacity-70">If max reschedule reached, only Owner override is accepted.</small>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="rescheduleVisible = false" />
        <Button label="Submit Reschedule" icon="pi pi-check" :pt="ptModalPrimaryBtn" @click="submitReschedule" />
      </template>
    </Dialog>

    <Dialog v-model:visible="createVisible" modal header="Create Appointment" :style="{width:'560px'}">
      <div class="space-y-3">
        <IftaLabel>
          <Select
            v-model="createPatient"
            :options="patientOptions"
            optionLabel="name"
            optionValue="id"
            filter
            fluid
            placeholder="Select patient"
          />
          <label>Patient</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-model="createDoctor"
            :options="doctorOptions"
            optionLabel="name"
            optionValue="id"
            filter
            showClear
            fluid
            placeholder="Select doctor (optional)"
          />
          <label>Doctor (optional)</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-model="createBillingType"
            :options="billingTypeOptions"
            optionLabel="label"
            optionValue="value"
            fluid
          />
          <label>Billing Type</label>
        </IftaLabel>

        <!-- HMO plan indicator for HMO_BILLING -->
        <template v-if="createBillingType === 'HMO_BILLING'">
          <Message v-if="createPatientHmoInfo" severity="info" :closable="false" size="small">
            <span class="font-medium">{{ createPatientHmoInfo.hmo_name }}</span>
            &nbsp;·&nbsp;{{ createPatientHmoInfo.hmo_type_name }}
            &nbsp;·&nbsp;{{ createPatientHmoInfo.company_name }}
          </Message>
          <Message v-else-if="createPatient && !syncingCreateHmoRates" severity="warn" :closable="false" size="small">
            No HMO information on file for this patient. Please register HMO via the Patients module first.
          </Message>
        </template>

        <div class="space-y-3 pt-2">
          <div class="flex items-center justify-between">
            <h4 class="font-semibold text-sm">Select Services</h4>
            <small class="opacity-70">At least one service required</small>
          </div>

          <!-- Mode Toggle -->
          <SelectButton
            v-if="createBillingType !== 'SELF_PAY_PACKAGE'"
            v-model="serviceMode"
            :options="visibleServiceModeOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />

          <!-- Package Service: show package picker + individual selectors together -->
          <div v-if="createBillingType === 'SELF_PAY_PACKAGE'" class="space-y-3">
            <IftaLabel>
              <Select
                v-model="selectedPackageOfferId"
                :options="activePackageServiceOffers"
                optionLabel="name"
                optionValue="id"
                filter
                placeholder="Select package offer"
                fluid
                @update:modelValue="selectPackageOffer"
              />
              <label>Package Offer</label>
            </IftaLabel>
            <small v-if="activePackageServiceOffers.length === 0" class="opacity-60">No package offers available. Add them in Self Pay: Package Service Management.</small>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <IftaLabel>
                <Select
                  v-model="selectedMachineId"
                  :options="machineServices"
                  optionLabel="name"
                  optionValue="id"
                  filter
                  placeholder="Select machine"
                  fluid
                  @update:modelValue="addServiceLine('machine')"
                />
                <label>Machine</label>
              </IftaLabel>

              <IftaLabel>
                <Select
                  v-model="selectedTechniqueId"
                  :options="techniqueServices"
                  optionLabel="name"
                  optionValue="id"
                  filter
                  placeholder="Select technique"
                  fluid
                  @update:modelValue="addServiceLine('technique')"
                />
                <label>Technique</label>
              </IftaLabel>

              <IftaLabel>
                <Select
                  v-model="selectedEvaluationId"
                  :options="evaluationServices"
                  optionLabel="name"
                  optionValue="id"
                  filter
                  placeholder="Select evaluation"
                  fluid
                  @update:modelValue="addServiceLine('evaluation')"
                />
                <label>Evaluation</label>
              </IftaLabel>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                <IftaLabel>
                  <Select
                    v-model="selectedAddOnType"
                    :options="addOnTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select add-on type"
                    fluid
                  />
                  <label>Add-on Type</label>
                </IftaLabel>
                <IftaLabel>
                  <Select
                    v-model="selectedAddOnId"
                    :options="currentAddOnServices"
                    optionLabel="name"
                    optionValue="id"
                    filter
                    placeholder="Select add-on"
                    fluid
                    @update:modelValue="addServiceLine(selectedAddOnType)"
                  />
                  <label>Add-on</label>
                </IftaLabel>
              </div>
            </div>
          </div>

          <!-- Individual Service Selection Dropdowns -->
          <div v-else-if="serviceMode === 'individual'" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <IftaLabel>
              <Select
                v-model="selectedMachineId"
                :options="machineServices"
                optionLabel="name"
                optionValue="id"
                filter
                placeholder="Select machine"
                fluid
                @update:modelValue="addServiceLine('machine')"
              />
              <label>Machine</label>
            </IftaLabel>

            <IftaLabel>
              <Select
                v-model="selectedTechniqueId"
                :options="techniqueServices"
                optionLabel="name"
                optionValue="id"
                filter
                placeholder="Select technique"
                fluid
                @update:modelValue="addServiceLine('technique')"
              />
              <label>Technique</label>
            </IftaLabel>

            <IftaLabel>
              <Select
                v-model="selectedEvaluationId"
                :options="evaluationServices"
                optionLabel="name"
                optionValue="id"
                filter
                placeholder="Select evaluation"
                fluid
                @update:modelValue="addServiceLine('evaluation')"
              />
              <label>Evaluation</label>
            </IftaLabel>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
              <IftaLabel>
                <Select
                  v-model="selectedAddOnType"
                  :options="addOnTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select add-on type"
                  fluid
                />
                <label>Add-on Type</label>
              </IftaLabel>
              <IftaLabel>
                <Select
                  v-model="selectedAddOnId"
                  :options="currentAddOnServices"
                  optionLabel="name"
                  optionValue="id"
                  filter
                  placeholder="Select add-on"
                  fluid
                  @update:modelValue="addServiceLine(selectedAddOnType)"
                />
                <label>Add-on</label>
              </IftaLabel>
            </div>
          </div>

          <!-- Bundled Service Selection -->
          <div v-else-if="serviceMode === 'bundled'" class="space-y-2">
            <IftaLabel>
              <Select
                v-model="selectedBundleId"
                :options="activeBundledServices"
                optionLabel="name"
                optionValue="id"
                filter
                placeholder="Select a bundle"
                fluid
                @update:modelValue="selectBundle"
              />
              <label>Bundle</label>
            </IftaLabel>
            <small v-if="activeBundledServices.length === 0" class="opacity-60">No bundles available. Add them in Single Pay: Single Service Management.</small>
          </div>

          <!-- Selected Services Summary -->
          <div v-if="selectedServiceLines.length > 0" class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-2 text-sm">
            <div class="flex justify-between font-medium">
              <span>{{ selectedServiceLines.length }} item{{ selectedServiceLines.length === 1 ? '' : 's' }} selected</span>
              <span>{{ subtotalFromServiceLines.toLocaleString("en-PH", {style: "currency", currency: "PHP"}) }}</span>
            </div>
            <div class="space-y-1 max-h-32 overflow-y-auto">
              <div v-for="(line, idx) in selectedServiceLines" :key="idx" class="flex items-center justify-between text-xs opacity-80">
                <div class="flex items-center gap-1 min-w-0 mr-2">
                  <Tag v-if="line.type === 'bundle'" value="Bundle" severity="contrast" class="text-xs shrink-0" />
                  <Tag v-else-if="line.type === 'package'" value="Package" severity="info" class="text-xs shrink-0" />
                  <span class="truncate">{{ line.name }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span v-if="getCreateLineOriginalPrice(line) > getEffectiveCreateLinePrice(line)" class="line-through opacity-50">{{ getCreateLineOriginalPrice(line).toLocaleString("en-PH", {style: "currency", currency: "PHP"}) }}</span>
                  <span>{{ getEffectiveCreateLinePrice(line).toLocaleString("en-PH", {style: "currency", currency: "PHP"}) }}</span>
                  <Button size="small" text severity="danger" icon="pi pi-trash" @click="removeServiceLine(idx)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <IftaLabel>
          <InputText v-model="createBillingNotes" fluid placeholder="Optional notes for billing" />
          <label>Billing Notes</label>
        </IftaLabel>

        <small class="opacity-70">
          Applied clinic schedule: {{ selectedClinicScheduleLabel || "No clinic resolved yet" }}
        </small>
        <Message v-if="isOvernightClinicSchedule" severity="warn" :closable="false">
          This clinic schedule is overnight. If this is unintended, verify clinic end time (AM/PM).
        </Message>

        <IftaLabel>
          <DatePicker
            v-model="createStart"
            showTime
            fluid
            :manualInput="false"
            :stepMinute="5"
            :disabledDays="calendarDisabledDays"
            hourFormat="24"
          />
          <label>Start</label>
        </IftaLabel>
        <IftaLabel>
          <DatePicker
            v-model="createEnd"
            showTime
            fluid
            :manualInput="false"
            :stepMinute="5"
            :disabledDays="calendarDisabledDays"
            hourFormat="24"
          />
          <label>End</label>
        </IftaLabel>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="createVisible = false" />
        <Button label="Create" icon="pi pi-check" :pt="ptModalPrimaryBtn" @click="submitCreateAppointment" />
      </template>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRouter} from "vue-router";
import {useConfirm, useToast} from "primevue";
import axios from "axios";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable, {type DataTablePageEvent} from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import IftaLabel from "primevue/iftalabel";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";
import SelectButton from "primevue/selectbutton";
import Tag from "primevue/tag";
import {appointmentPhase1Service, type AppointmentDetail, type AppointmentListItem} from "@/features/appointments/api/appointment-phase1.service";
import {exportToExcel} from "@/utils/export-excel.util";
import {errorToast, successToast} from "@/utils/toast.util";
import type {Lookup} from "@/models/global.model";
import {patientService} from "@/features/patients/api/patient.service";
import {staffService} from "@/features/staff/api/staff.service";
import {clinicService} from "@/features/clinics/api/clinic.service";
import {defaultPage, defaultPageSize} from "@/models/paging";
import {Status} from "@/utils/global.type";
import type {Clinic} from "@/features/clinics/types/clinic";
import type {Patient} from "@/features/patients/types/patient";
import type {Staff} from "@/features/staff/types/staff";
import {pamsAPI} from "@/utils/axios-interceptor";
import type {Pageable} from "@/models/paging";
import type {OfferLookupDTO} from "@/models/global.model";
import {patientHMOInformationService} from "@/services/patient-hmo-information.service";
import type {PatientHMOInformation} from "@/models/hmo-information";
import {hmoMachineRateService} from "@/services/hmo-machine-rate.service";
import {hmoTechniqueRateService} from "@/services/hmo-technique-rate.service";
import {hmoEvaluationRateService} from "@/services/hmo-evaluation-rate.service";
import {hmoAddOnRateService} from "@/services/hmo-add-on-rate.service";
import { ptModalPrimaryBtn, ptOutlinedBtn, ptPrimaryBtn, ptSelect } from "@/features/shared/table-header.styles";

interface BillingPickerLookup {
  id: string | number
  name: string
  price: number
}

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const roleName = ref("")

const appointments = ref<AppointmentListItem[]>([])
const dayBookings = ref<AppointmentListItem[]>([])
const selectedDetail = ref<AppointmentDetail>()
const isLoading = ref(false)

const page = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const statusFilter = ref<string>()
const calendarDate = ref<Date>(new Date())

const rescheduleVisible = ref(false)
const activeAppointment = ref<AppointmentListItem>()
const rescheduleStart = ref<Date>(new Date())
const rescheduleEnd = ref<Date>(new Date())
const overrideReason = ref("")

const createVisible = ref(false)
type AppointmentPersonOption = {id: number; name: string; clinic_id: number}
type BillingType = "SELF_PAY_SINGLE" | "SELF_PAY_PACKAGE" | "HMO_BILLING" | "LGU_BILLING"
type SingleService = {
  id: string
  type: "machine" | "technique" | "evaluation" | "add-on-machine" | "add-on-technique" | "add-on-home-service"
  name: string
  price: number
  status: string
}
type BundledService = {
  id: string
  name: string
  machineIds: string[]
  techniqueIds: string[]
  evaluationIds: string[]
  addOnIds: string[]
  bundledPrice: number
  status: string
}
type PackageServiceOffer = {
  id: string
  name: string
  bundleId?: string
  bundleQty: number
  machineIds?: string[]
  machineQty?: number
  machineItems?: Array<{id: string; qty: number}>
  techniqueIds?: string[]
  techniqueQty?: number
  techniqueItems?: Array<{id: string; qty: number}>
  evaluationIds: string[]
  evaluationItems?: Array<{id: string; qty: number}>
  addOnIds?: string[]
  addOnQty?: number
  addOnItems?: Array<{id: string; qty: number}>
    sessionIds?: string[]
    sessionQty?: number
    sessionItems?: Array<{id: string; qty: number}>
  evaluationQty: number
  packagePrice: number
  status: string
}
const patientOptions = ref<AppointmentPersonOption[]>([])
const doctorOptions = ref<AppointmentPersonOption[]>([])
const clinicOptions = ref<Clinic[]>([])
const billingTypeOptions = [
  {label: "Self Pay: Single Service", value: "SELF_PAY_SINGLE"},
  {label: "Self Pay: Package Service", value: "SELF_PAY_PACKAGE"},
  {label: "HMO", value: "HMO_BILLING"},
  {label: "LGU", value: "LGU_BILLING"},
]
const appointmentStatusOptions = ["Pending", "Rescheduled", "No show", "Cancelled", "Completed"]
const selectedClinicId = ref<number>()
const createPatient = ref<number>()
const createDoctor = ref<number>()
const createBillingType = ref<BillingType>("SELF_PAY_SINGLE")
const createBillingNotes = ref("")
const createStart = ref<Date>(new Date())
const createEnd = ref<Date>(new Date(Date.now() + 60 * 60 * 1000))
const allSinglePayServices = ref<SingleService[]>([])
const allBundledServices = ref<BundledService[]>([])
const allPackageServiceOffers = ref<PackageServiceOffer[]>([])

// Service selection state
type ServiceMode = "individual" | "bundled"
const serviceMode = ref<ServiceMode>("individual")
const serviceModeOptions = [
  {label: "Individual", value: "individual"},
  {label: "Bundled", value: "bundled"},
]
const visibleServiceModeOptions = computed(() =>
  createBillingType.value === "HMO_BILLING"
    ? serviceModeOptions.filter(option => option.value === "individual")
    : serviceModeOptions
)
const selectedMachineId = ref<string>()
const selectedTechniqueId = ref<string>()
const selectedEvaluationId = ref<string>()
const selectedAddOnType = ref<"add-on-machine" | "add-on-technique" | "add-on-home-service">("add-on-machine")
const selectedAddOnId = ref<string>()
const selectedBundleId = ref<string>()
const selectedPackageOfferId = ref<string>()
const selectedServiceLines = ref<Array<{type: string; id: string; name: string; price: number; originalPrice?: number}>>([])
const createPatientHmoId = ref<number | null>(null)
const createPatientHmoInfo = ref<PatientHMOInformation | null>(null)
const syncingCreateHmoRates = ref(false)
const createPatientMachineRateMap = ref<Map<number, number>>(new Map())
const createPatientTechniqueRateMap = ref<Map<number, number>>(new Map())
const createPatientEvaluationRateMap = ref<Map<number, number>>(new Map())
const createPatientAddOnMachineRateMap = ref<Map<number, number>>(new Map())
const createPatientAddOnTechniqueRateMap = ref<Map<number, number>>(new Map())
const createPatientAddOnHomeServiceRateMap = ref<Map<number, number>>(new Map())
// Null = no HMO filter active; Set = only these IDs are covered by the HMO plan
const createHmoMachineIds = ref<Set<number> | null>(null)
const createHmoTechniqueIds = ref<Set<number> | null>(null)
const createHmoEvaluationIds = ref<Set<number> | null>(null)
const createHmoAddOnMachineIds = ref<Set<number> | null>(null)
const createHmoAddOnTechniqueIds = ref<Set<number> | null>(null)
const createHmoAddOnHomeServiceIds = ref<Set<number> | null>(null)
const bookedDateKeys = ref<Set<string>>(new Set())
const bookedMonthCache = ref<Map<string, Set<string>>>(new Map())
const visibleMonth = ref<number>(new Date().getMonth())
const visibleYear = ref<number>(new Date().getFullYear())

const needsOverrideReason = computed(() => (activeAppointment.value?.reschedule_count ?? 0) >= 3)
const canDeleteAppointments = computed(() => roleName.value === "Owner")

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const addOnTypeOptions = [
  { label: "Machine Add-on", value: "add-on-machine" as const },
  { label: "Technique Add-on", value: "add-on-technique" as const },
  { label: "Home Service", value: "add-on-home-service" as const },
]

function filterServicesByHmoIds<T extends { id: string; type: string }>(services: T[], allowed: Set<number> | null): T[] {
  if (createBillingType.value !== "HMO_BILLING" || allowed === null) return services
  return services.filter(s => allowed.has(Number(s.id)))
}

const machineServices = computed(() =>
  filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "machine"), createHmoMachineIds.value)
)

const techniqueServices = computed(() =>
  filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "technique"), createHmoTechniqueIds.value)
)

const evaluationServices = computed(() =>
  filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "evaluation"), createHmoEvaluationIds.value)
)

const currentAddOnServices = computed(() => {
  const type = selectedAddOnType.value
  const raw = allSinglePayServices.value.filter(s => s.type === type)
  if (type === "add-on-machine")   return filterServicesByHmoIds(raw, createHmoAddOnMachineIds.value)
  if (type === "add-on-technique") return filterServicesByHmoIds(raw, createHmoAddOnTechniqueIds.value)
  return filterServicesByHmoIds(raw, createHmoAddOnHomeServiceIds.value)
})

const getEffectiveCreateLinePrice = (line: {type: string; id: string; price: number}): number => {
  if (createBillingType.value !== "HMO_BILLING") return Number(line.price ?? 0)
  const itemId = Number(line.id)
  if (!Number.isFinite(itemId) || itemId <= 0) return Number(line.price ?? 0)

  let hmoRate: number | undefined
  if (line.type === "machine")             hmoRate = createPatientMachineRateMap.value.get(itemId)
  else if (line.type === "technique")      hmoRate = createPatientTechniqueRateMap.value.get(itemId)
  else if (line.type === "evaluation")     hmoRate = createPatientEvaluationRateMap.value.get(itemId)
  else if (line.type === "add-on-machine") hmoRate = createPatientAddOnMachineRateMap.value.get(itemId)
  else if (line.type === "add-on-technique") hmoRate = createPatientAddOnTechniqueRateMap.value.get(itemId)
  else if (line.type === "add-on-home-service") hmoRate = createPatientAddOnHomeServiceRateMap.value.get(itemId)
  return hmoRate ?? Number(line.price ?? 0)
}

const getCreateLineOriginalPrice = (line: {price: number; originalPrice?: number}): number =>
  Number(line.originalPrice ?? line.price ?? 0)

const subtotalFromServiceLines = computed(() =>
  selectedServiceLines.value.reduce((sum, line) => sum + getEffectiveCreateLinePrice(line), 0)
)

const syncCreatePatientHmoRates = async (): Promise<void> => {
  createPatientHmoId.value = null
  createPatientHmoInfo.value = null
  createPatientMachineRateMap.value = new Map()
  createPatientTechniqueRateMap.value = new Map()
  createPatientEvaluationRateMap.value = new Map()
  createPatientAddOnMachineRateMap.value = new Map()
  createPatientAddOnTechniqueRateMap.value = new Map()
  createPatientAddOnHomeServiceRateMap.value = new Map()
  createHmoMachineIds.value = null
  createHmoTechniqueIds.value = null
  createHmoEvaluationIds.value = null
  createHmoAddOnMachineIds.value = null
  createHmoAddOnTechniqueIds.value = null
  createHmoAddOnHomeServiceIds.value = null

  if (createBillingType.value !== "HMO_BILLING") return
  const patientId = Number(createPatient.value)
  if (!Number.isFinite(patientId) || patientId <= 0) return

  syncingCreateHmoRates.value = true
  try {
  const hmoInfo = await patientHMOInformationService.getByPatientId(patientId)
  createPatientHmoInfo.value = hmoInfo ?? null
  const hmoId = Number(hmoInfo?.hmo_id)
  if (!Number.isFinite(hmoId) || hmoId <= 0) return

  createPatientHmoId.value = hmoId

  const [machineRates, techniqueRates, evaluationRates, addOnRates] = await Promise.all([
    hmoMachineRateService.getAll(hmoId),
    hmoTechniqueRateService.getAll(hmoId),
    hmoEvaluationRateService.getAll(hmoId),
    hmoAddOnRateService.getAll(hmoId),
  ])

  const machineMap = new Map<number, number>()
  const machineIds = new Set<number>()
  for (const r of machineRates ?? []) {
    const id = Number(r.machine_id); const price = Number(r.rate)
    if (Number.isFinite(id) && id > 0 && Number.isFinite(price) && price >= 0) {
      machineMap.set(id, price); machineIds.add(id)
    }
  }
  createPatientMachineRateMap.value = machineMap
  createHmoMachineIds.value = machineIds

  const techniqueMap = new Map<number, number>()
  const techniqueIds = new Set<number>()
  for (const r of techniqueRates ?? []) {
    const id = Number(r.technique_id); const price = Number(r.rate)
    if (Number.isFinite(id) && id > 0 && Number.isFinite(price) && price >= 0) {
      techniqueMap.set(id, price); techniqueIds.add(id)
    }
  }
  createPatientTechniqueRateMap.value = techniqueMap
  createHmoTechniqueIds.value = techniqueIds

  const evaluationMap = new Map<number, number>()
  const evaluationIds = new Set<number>()
  for (const r of evaluationRates ?? []) {
    const id = Number(r.evaluation_id); const price = Number(r.rate)
    if (Number.isFinite(id) && id > 0 && Number.isFinite(price) && price >= 0) {
      evaluationMap.set(id, price); evaluationIds.add(id)
    }
  }
  createPatientEvaluationRateMap.value = evaluationMap
  createHmoEvaluationIds.value = evaluationIds

  const addOnMachineMap = new Map<number, number>()
  const addOnMachineIds = new Set<number>()
  const addOnTechniqueMap = new Map<number, number>()
  const addOnTechniqueIds = new Set<number>()
  const addOnHomeServiceMap = new Map<number, number>()
  const addOnHomeServiceIds = new Set<number>()
  for (const r of addOnRates ?? []) {
    const price = Number(r.rate)
    if (!Number.isFinite(price) || price < 0) continue
    if (r.add_on_type === "ADD_ON_MACHINE" && r.add_on_machine_id != null) {
      const id = Number(r.add_on_machine_id)
      if (id > 0) { addOnMachineMap.set(id, price); addOnMachineIds.add(id) }
    } else if (r.add_on_type === "ADD_ON_TECHNIQUE" && r.add_on_technique_id != null) {
      const id = Number(r.add_on_technique_id)
      if (id > 0) { addOnTechniqueMap.set(id, price); addOnTechniqueIds.add(id) }
    } else if (r.add_on_type === "ADD_ON_HOME_SERVICE" && r.add_on_home_service_id != null) {
      const id = Number(r.add_on_home_service_id)
      if (id > 0) { addOnHomeServiceMap.set(id, price); addOnHomeServiceIds.add(id) }
    }
  }
  createPatientAddOnMachineRateMap.value = addOnMachineMap
  createHmoAddOnMachineIds.value = addOnMachineIds
  createPatientAddOnTechniqueRateMap.value = addOnTechniqueMap
  createHmoAddOnTechniqueIds.value = addOnTechniqueIds
  createPatientAddOnHomeServiceRateMap.value = addOnHomeServiceMap
  createHmoAddOnHomeServiceIds.value = addOnHomeServiceIds
  } finally {
    syncingCreateHmoRates.value = false
  }
}

const activeBundledServices = computed(() =>
  allBundledServices.value.filter(b => b.status !== "Inactive")
)

const activePackageServiceOffers = computed(() =>
  allPackageServiceOffers.value.filter(p => p.status !== "Inactive")
)

const availableServiceCategories = computed(() => {
  const categories = [
    { type: "machine", label: "Machines", services: filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "machine"), createHmoMachineIds.value) },
    { type: "technique", label: "Techniques", services: filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "technique"), createHmoTechniqueIds.value) },
    { type: "evaluation", label: "Evaluations", services: filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "evaluation"), createHmoEvaluationIds.value) },
    { type: "add-on-machine", label: "Add-ons (Machine)", services: filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "add-on-machine"), createHmoAddOnMachineIds.value) },
    { type: "add-on-technique", label: "Add-ons (Technique)", services: filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "add-on-technique"), createHmoAddOnTechniqueIds.value) },
    { type: "add-on-home-service", label: "Add-ons (Home Service)", services: filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "add-on-home-service"), createHmoAddOnHomeServiceIds.value) },
  ]
  return categories.filter(cat => cat.services.length > 0)
})

const formatLocalDateKey = (date: Date): string => {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const selectedDateIso = computed(() => formatLocalDateKey(calendarDate.value))
const sectionCardClass = "app-section-card-comfy space-y-4"
const sectionTitleClass = "app-section-title"
const detailCardClass = "rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3"
const rescheduledAppointmentsCount = computed(() => appointments.value.filter(item => Number(item.reschedule_count ?? 0) > 0).length)
const billingAttentionCount = computed(() =>
  appointments.value.filter(item => {
    const status = displayBillingStatus(item.billing_status)
    return status !== "PAID"
  }).length
)
const selectedClinic = computed(() => clinicOptions.value.find(clinic => clinic.id === selectedClinicId.value))
const selectedDateLabel = computed(() =>
  calendarDate.value.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)
const selectedClinicScheduleLabel = computed(() => {
  if (!selectedClinic.value) return ""
  return `${selectedClinic.value.name}: ${selectedClinic.value.start_day_name} to ${selectedClinic.value.end_day_name}, ${selectedClinic.value.start_time_formatted} - ${selectedClinic.value.end_time_formatted}`
})
const isOvernightClinicSchedule = computed(() => {
  const start = getClinicStartMinutes()
  const end = getClinicEndMinutes()
  if (start == null || end == null) return false
  return end < start
})
const calendarDisabledDays = computed<number[]>(() => {
  if (!selectedClinic.value) return []
  const disabled: number[] = []
  for (let jsDay = 0; jsDay < 7; jsDay++) {
    const clinicDay = jsDay === 0 ? 7 : jsDay
    if (!isClinicDayAllowed(clinicDay)) disabled.push(jsDay)
  }
  return disabled
})

const billingSeverity = (status: string): "success" | "warn" | "danger" | "info" => {
  const normalized = (status || "UNBILLED").toUpperCase()
  if (normalized === "PAID") return "success"
  if (normalized === "PARTIAL" || normalized === "PENDING") return "warn"
  if (normalized === "VOID") return "danger"
  return "info"
}
const appointmentSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = (status || "PENDING").trim().toUpperCase()
  if (normalized === "COMPLETED") return "success"
  if (normalized === "RESCHEDULED") return "warn"
  if (normalized === "CANCELLED" || normalized === "NO SHOW" || normalized === "NO_SHOW") return "danger"
  return "info"
}
const displayAppointmentStatus = (status?: string): string => (status?.trim() || "Pending").toUpperCase()
const displayBillingStatus = (status?: string): string => (status?.trim() || "UNBILLED").toUpperCase()

const formatDateTime = (value: string): string => new Date(value).toLocaleString()
const toDateKey = (year: number, month: number, day: number): string => {
  const mm = String(month + 1).padStart(2, "0")
  const dd = String(day).padStart(2, "0")
  return `${year}-${mm}-${dd}`
}

const fetchLookup = async (path: string): Promise<BillingPickerLookup[]> => {
  const {data} = await pamsAPI.get<Pageable<OfferLookupDTO>>(path, {params: {page: 1, size: 500, status: Status.ACTIVE}})
  return (data?.content ?? []).map(item => ({id: item.id, name: item.name, price: Number(item.price)}))
}

const loadSinglePayServices = (): void => {
  try {
    const stored = localStorage.getItem("singlePayServices")
    allSinglePayServices.value = stored ? JSON.parse(stored) : []
  } catch {
    allSinglePayServices.value = []
  }
  try {
    const stored = localStorage.getItem("bundledServices")
    allBundledServices.value = stored ? JSON.parse(stored) : []
  } catch {
    allBundledServices.value = []
  }
  try {
    const stored = localStorage.getItem("packageServiceOffers")
    allPackageServiceOffers.value = stored ? JSON.parse(stored) : []
  } catch {
    allPackageServiceOffers.value = []
  }
}

const calculatePackageOfferRegularTotal = (item: PackageServiceOffer): number => {
  const bundle = item.bundleId ? allBundledServices.value.find(entry => entry.id === item.bundleId) : undefined
  const bundlePortion = Number(bundle?.bundledPrice ?? 0) * Number(item.bundleQty ?? 1)
  const machineItems = item.machineItems?.length
    ? item.machineItems
    : (item.machineIds ?? []).map(id => ({id, qty: Number(item.machineQty ?? 1)}))
  const techniqueItems = item.techniqueItems?.length
    ? item.techniqueItems
    : (item.techniqueIds ?? []).map(id => ({id, qty: Number(item.techniqueQty ?? 1)}))
  const evaluationItems = item.evaluationItems?.length
    ? item.evaluationItems
    : (item.evaluationIds ?? []).map(id => ({id, qty: Number(item.evaluationQty ?? 1)}))
  const addOnItems = item.addOnItems?.length
    ? item.addOnItems
    : (item.addOnIds ?? []).map(id => ({id, qty: Number(item.addOnQty ?? 1)}))

  const machinePortion = machineItems.reduce((sum, entry) => {
    const unitPrice = allSinglePayServices.value.find(service => service.id === entry.id)?.price ?? 0
    return sum + unitPrice * Number(entry.qty ?? 1)
  }, 0)
  const techniquePortion = techniqueItems.reduce((sum, entry) => {
    const unitPrice = allSinglePayServices.value.find(service => service.id === entry.id)?.price ?? 0
    return sum + unitPrice * Number(entry.qty ?? 1)
  }, 0)
  const evaluationPortion = evaluationItems.reduce((sum, entry) => {
    const unitPrice = allSinglePayServices.value.find(service => service.id === entry.id)?.price ?? 0
    return sum + unitPrice * Number(entry.qty ?? 1)
  }, 0)
  const addOnPortion = addOnItems.reduce((sum, entry) => {
    const unitPrice = allSinglePayServices.value.find(service => service.id === entry.id)?.price ?? 0
    return sum + unitPrice * Number(entry.qty ?? 1)
  }, 0)
  return bundlePortion + machinePortion + techniquePortion + evaluationPortion + addOnPortion
}

const selectPackageOffer = (packageId: string): void => {
  const pkg = allPackageServiceOffers.value.find(item => item.id === packageId)
  if (!pkg) return

  if (selectedServiceLines.value.find(line => line.id === pkg.id && line.type === "package")) {
    selectedPackageOfferId.value = undefined
    return
  }

  selectedServiceLines.value.push({
    type: "package",
    id: pkg.id,
    name: pkg.name,
    price: Number(pkg.packagePrice ?? 0),
    originalPrice: calculatePackageOfferRegularTotal(pkg)
  })
  selectedPackageOfferId.value = undefined
}

const selectBundle = (bundleId: string): void => {
  if (createBillingType.value === "HMO_BILLING") {
    selectedBundleId.value = undefined
    return
  }

  const bundle = allBundledServices.value.find(b => b.id === bundleId)
  if (!bundle) return

  // Calculate original price from individual services
  const allIds = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds, ...bundle.addOnIds]
  const originalPrice = allIds.reduce((sum, id) => {
    return sum + (allSinglePayServices.value.find(s => s.id === id)?.price ?? 0)
  }, 0)

  // Prevent adding the same bundle twice
  if (selectedServiceLines.value.find(l => l.id === bundle.id && l.type === "bundle")) {
    selectedBundleId.value = undefined
    return
  }

  selectedServiceLines.value.push({
    type: "bundle",
    id: bundle.id,
    name: bundle.name,
    price: bundle.bundledPrice,
    originalPrice
  })
  selectedBundleId.value = undefined
}

const addServiceLine = (type: string): void => {
  let serviceId: string | undefined
  let service: SingleService | undefined

  if (type === "machine") {
    serviceId = selectedMachineId.value
  } else if (type === "technique") {
    serviceId = selectedTechniqueId.value
  } else if (type === "evaluation") {
    serviceId = selectedEvaluationId.value
  } else if (type === "add-on-machine" || type === "add-on-technique" || type === "add-on-home-service") {
    serviceId = selectedAddOnId.value
  }

  if (!serviceId) return

  service = allSinglePayServices.value.find(s => s.id === serviceId)
  if (!service) return

  // Check if service already in selected lines
  const exists = selectedServiceLines.value.find(line => line.id === serviceId && line.type === type)
  if (!exists) {
    selectedServiceLines.value.push({
      type: service.type,
      id: service.id,
      name: service.name,
      price: service.price
    })
  }

  // Reset the dropdown
  if (type === "machine") selectedMachineId.value = undefined
  else if (type === "technique") selectedTechniqueId.value = undefined
  else if (type === "evaluation") selectedEvaluationId.value = undefined
  else if (type.startsWith("add-on")) selectedAddOnId.value = undefined
}

const removeServiceLine = (index: number): void => {
  selectedServiceLines.value.splice(index, 1)
}

const hasBookingDot = (date: {year: number; month: number; day: number}): boolean => {
  // PrimeVue month in slot date can vary by version (0-based vs 1-based).
  const monthAsZeroBased = toDateKey(date.year, date.month, date.day)
  const monthAsOneBased = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`
  return bookedDateKeys.value.has(monthAsZeroBased) || bookedDateKeys.value.has(monthAsOneBased)
}

const toMinutesFromTime = (value: unknown): number | undefined => {
  if (value instanceof Date) return value.getHours() * 60 + value.getMinutes()
  if (typeof value !== "string") return undefined
  const hhmmss = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (hhmmss) return Number(hhmmss[1]) * 60 + Number(hhmmss[2])
  const ampm = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampm) {
    let hour = Number(ampm[1]) % 12
    if (ampm[3].toUpperCase() === "PM") hour += 12
    return hour * 60 + Number(ampm[2])
  }
  return undefined
}

const getClinicStartMinutes = (): number | undefined => {
  const clinic = selectedClinic.value
  if (!clinic) return undefined
  return toMinutesFromTime((clinic as {start_time_formatted?: string}).start_time_formatted) ??
    toMinutesFromTime(clinic.start_time)
}

const getClinicEndMinutes = (): number | undefined => {
  const clinic = selectedClinic.value
  if (!clinic) return undefined
  return toMinutesFromTime((clinic as {end_time_formatted?: string}).end_time_formatted) ??
    toMinutesFromTime(clinic.end_time)
}

const isClinicDayAllowed = (clinicDay: number): boolean => {
  const clinic = selectedClinic.value
  if (!clinic) return true
  if (clinic.start_day <= clinic.end_day) {
    return clinicDay >= clinic.start_day && clinicDay <= clinic.end_day
  }
  return clinicDay >= clinic.start_day || clinicDay <= clinic.end_day
}

const isWithinClinicTime = (date: Date): boolean => {
  if (!selectedClinic.value) return true
  const startMinutes = getClinicStartMinutes()
  const endMinutes = getClinicEndMinutes()
  if (startMinutes == null || endMinutes == null) return true
  const minutes = date.getHours() * 60 + date.getMinutes()
  if (endMinutes >= startMinutes) {
    return minutes >= startMinutes && minutes <= endMinutes
  }
  // Overnight schedule support (e.g. 8:00 AM to 5:00 AM next day).
  return minutes >= startMinutes || minutes <= endMinutes
}

const isFiveMinuteAligned = (date: Date): boolean => {
  return date.getMinutes() % 5 === 0 && date.getSeconds() === 0
}

const validateClinicSchedule = (start: Date, end: Date): boolean => {
  if (end <= start) {
    errorToast(toast, "End time must be after start time")
    return false
  }

  const startClinicDay = start.getDay() === 0 ? 7 : start.getDay()
  const endClinicDay = end.getDay() === 0 ? 7 : end.getDay()

  if (!isClinicDayAllowed(startClinicDay) || !isClinicDayAllowed(endClinicDay)) {
    errorToast(toast, "Selected date is outside clinic operating days")
    return false
  }

  if (!isWithinClinicTime(start) || !isWithinClinicTime(end)) {
    errorToast(toast, "Selected time is outside clinic operating hours")
    return false
  }

  if (!isFiveMinuteAligned(start) || !isFiveMinuteAligned(end)) {
    errorToast(toast, "Time must be in 5-minute increments")
    return false
  }
  return true
}

const findNextAllowedDate = (baseDate: Date): Date => {
  const next = new Date(baseDate)
  for (let i = 0; i < 14; i++) {
    const clinicDay = next.getDay() === 0 ? 7 : next.getDay()
    if (isClinicDayAllowed(clinicDay)) return next
    next.setDate(next.getDate() + 1)
  }
  return baseDate
}

const snapToFiveMinutes = (date: Date): Date => {
  const result = new Date(date)
  const snappedMinutes = Math.floor(result.getMinutes() / 5) * 5
  result.setMinutes(snappedMinutes, 0, 0)
  return result
}

const alignToClinicStart = (date: Date): Date => {
  const result = new Date(date)
  result.setSeconds(0, 0)
  const clinicStart = getClinicStartMinutes()
  if (clinicStart != null) {
    result.setHours(Math.floor(clinicStart / 60), clinicStart % 60, 0, 0)
  } else {
    return snapToFiveMinutes(result)
  }
  return result
}

const fetchBookedDatesForMonth = async (year: number, month: number): Promise<void> => {
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
  const cached = bookedMonthCache.value.get(monthKey)
  if (cached) {
    bookedDateKeys.value = new Set(cached)
    return
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthDots = new Set<string>()

  // Use sequential requests to avoid overloading API and missing dots from transient failures.
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = toDateKey(year, month, day)
    let hasBooking = false
    try {
      const rows = await appointmentPhase1Service.getDay(dateKey)
      hasBooking = (rows ?? []).length > 0
    } catch {
      try {
        const retryRows = await appointmentPhase1Service.getDay(dateKey)
        hasBooking = (retryRows ?? []).length > 0
      } catch {
        hasBooking = false
      }
    }
    if (hasBooking) monthDots.add(dateKey)
  }

  bookedMonthCache.value.set(monthKey, monthDots)
  bookedDateKeys.value = new Set(monthDots)
}

const refreshBookedDotsForVisibleMonth = async (): Promise<void> => {
  const monthKey = `${visibleYear.value}-${String(visibleMonth.value + 1).padStart(2, "0")}`
  bookedMonthCache.value.delete(monthKey)
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
}

const onCalendarMonthChange = async (event: {month: number; year: number}): Promise<void> => {
  visibleMonth.value = event.month
  visibleYear.value = event.year
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
}

const fetchAppointments = async (): Promise<void> => {
  try {
    isLoading.value = true
    const response = await appointmentPhase1Service.getAll({
      page: page.value,
      size: pageSize.value,
      status: statusFilter.value?.trim() || undefined,
      date: selectedDateIso.value
    })
    appointments.value = response?.content ?? []
    totalElements.value = response?.total_elements ?? 0
  } catch (error: unknown) {
    errorToast(toast, "Failed to load appointments")
  } finally {
    isLoading.value = false
  }
}

const fetchDayBookings = async (): Promise<void> => {
  try {
    dayBookings.value = await appointmentPhase1Service.getDay(selectedDateIso.value) ?? []
  } catch (error: unknown) {
    dayBookings.value = []
  }
}

const refreshAll = async (): Promise<void> => {
  await fetchAppointments()
  await fetchDayBookings()
}

const loadCreateLookups = async (): Promise<void> => {
  const [patientsPage, doctorsPage, clinics] = await Promise.all([
    patientService.getAll({
      clinic_id: undefined,
      pageable_request: {
        page: defaultPage,
        size: 100,
        status: Status.ACTIVE,
        name: undefined
      }
    }),
    staffService.getAll({
      clinic_id: undefined,
      pageable_request: {
        page: defaultPage,
        size: 100,
        status: Status.ACTIVE,
        name: undefined
      }
    }),
    clinicService.getAll({
      page: defaultPage,
      size: 100,
      status: Status.ACTIVE,
      name: undefined
    }),
  ])

  patientOptions.value = (patientsPage?.content ?? []).map((patient: Patient) => ({
    id: patient.id,
    name: [patient.first_name, patient.middle_name, patient.last_name]
      .filter((part): part is string => !!part && part.toLowerCase() !== "null")
      .join(" "),
    clinic_id: patient.clinic_id
  }))
  doctorOptions.value = (doctorsPage?.content ?? []).map((doctor: Staff) => ({
    id: doctor.id,
    name: doctor.name,
    clinic_id: doctor.clinic_id
  }))
  clinicOptions.value = clinics?.content ?? []
  if (!selectedClinicId.value && clinicOptions.value.length) {
    selectedClinicId.value = clinicOptions.value[0].id
  }

  // Load Single Pay services from localStorage
  loadSinglePayServices()
}

const openCreateDialog = async (): Promise<void> => {
  if (!patientOptions.value.length) {
    await loadCreateLookups()
  }
  createPatient.value = undefined
  createDoctor.value = undefined
  createBillingType.value = "SELF_PAY_SINGLE"
  createBillingNotes.value = ""
  selectedMachineId.value = undefined
  selectedTechniqueId.value = undefined
  selectedEvaluationId.value = undefined
  selectedAddOnType.value = "add-on-machine"
  selectedAddOnId.value = undefined
  selectedBundleId.value = undefined
  selectedPackageOfferId.value = undefined
  serviceMode.value = "individual"
  selectedServiceLines.value = []
  createPatientHmoId.value = null
  createPatientHmoInfo.value = null
  syncingCreateHmoRates.value = false
  createPatientMachineRateMap.value = new Map()
  createPatientTechniqueRateMap.value = new Map()
  createPatientEvaluationRateMap.value = new Map()
  createPatientAddOnMachineRateMap.value = new Map()
  createPatientAddOnTechniqueRateMap.value = new Map()
  createPatientAddOnHomeServiceRateMap.value = new Map()
  createHmoMachineIds.value = null
  createHmoTechniqueIds.value = null
  createHmoEvaluationIds.value = null
  createHmoAddOnMachineIds.value = null
  createHmoAddOnTechniqueIds.value = null
  createHmoAddOnHomeServiceIds.value = null
  loadSinglePayServices()
  const base = alignToClinicStart(findNextAllowedDate(new Date(calendarDate.value)))
  createStart.value = base
  createEnd.value = new Date(base.getTime() + 60 * 60 * 1000)
  createVisible.value = true
}

const submitCreateAppointment = async (): Promise<void> => {
  if (!createPatient.value) {
    errorToast(toast, "Patient is required")
    return
  }
  if (selectedServiceLines.value.length === 0) {
    errorToast(toast, "At least one service is required")
    return
  }
  if (!validateClinicSchedule(createStart.value, createEnd.value)) return

  const appointmentPayload: Parameters<typeof appointmentPhase1Service.create>[0] = {
    patient_id: createPatient.value,
    doctor_id: createDoctor.value,
    starts_at: createStart.value.toISOString(),
    ends_at: createEnd.value.toISOString(),
    amount_due: subtotalFromServiceLines.value,
    service_name: `${createBillingType.value.replace("_", " ")} - ${selectedServiceLines.value.length} items`,
    billing_type: createBillingType.value,
    service_type: createBillingType.value === "SELF_PAY_PACKAGE" ? "PACKAGE" : "SINGLE",
    line_items_json: JSON.stringify(selectedServiceLines.value.map(line => ({
      id: line.id,
      type: line.type,
      name: line.name,
      quantity: 1,
      price: getEffectiveCreateLinePrice(line),
      originalPrice: getCreateLineOriginalPrice(line)
    }))),
    notes: createBillingNotes.value.trim() || undefined,
  }

  try {
    await appointmentPhase1Service.create(appointmentPayload)
    successToast(toast, "Appointment created with services")
    createVisible.value = false
    await refreshAll()
    await refreshBookedDotsForVisibleMonth()
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const detail = error.response?.data?.message || error.response?.data?.detail || error.message
      if (status === 401) {
        errorToast(toast, "Session expired (401). Please log in again.")
        return
      }
      if (status === 403) {
        errorToast(toast, "Permission denied (403): cannot create appointment.")
        return
      }
      errorToast(toast, `Create failed${status ? ` (${status})` : ""}: ${detail}`)
      return
    }
    errorToast(toast, "Failed to create appointment")
  }
}

const onPage = async (event: DataTablePageEvent): Promise<void> => {
  page.value = Math.floor((event.first ?? 0) / (event.rows ?? pageSize.value)) + 1
  pageSize.value = event.rows ?? pageSize.value
  await fetchAppointments()
}

const onSelectRow = async (event: {data: AppointmentListItem}): Promise<void> => {
  const detail = await appointmentPhase1Service.getById(event.data.id)
  selectedDetail.value = detail
}

const openReschedule = (appointment: AppointmentListItem): void => {
  activeAppointment.value = appointment
  rescheduleStart.value = snapToFiveMinutes(new Date(appointment.starts_at))
  rescheduleEnd.value = snapToFiveMinutes(new Date(appointment.ends_at))
  overrideReason.value = ""
  rescheduleVisible.value = true
}

const submitReschedule = async (): Promise<void> => {
  if (!activeAppointment.value) return
  if (needsOverrideReason.value && !overrideReason.value.trim()) {
    errorToast(toast, "Owner override reason is required after 3 reschedules")
    return
  }
  if (!validateClinicSchedule(rescheduleStart.value, rescheduleEnd.value)) return
  try {
    await appointmentPhase1Service.reschedule(activeAppointment.value.id, {
      starts_at: rescheduleStart.value.toISOString(),
      ends_at: rescheduleEnd.value.toISOString(),
      override_reason: overrideReason.value.trim() || undefined
    })
    successToast(toast, "Reschedule successful")
    rescheduleVisible.value = false
    await refreshAll()
    await refreshBookedDotsForVisibleMonth()
    if (selectedDetail.value?.id === activeAppointment.value.id) {
      selectedDetail.value = await appointmentPhase1Service.getById(activeAppointment.value.id)
    }
  } catch (error: unknown) {
    errorToast(toast, "Reschedule blocked. Check max count or owner override reason.")
  }
}

const onExportCsv = async (): Promise<void> => {
  const response = await appointmentPhase1Service.exportCsv({
    status: statusFilter.value?.trim() || undefined,
    date: selectedDateIso.value
  })
  if (!response) return
  exportToExcel(response)
}

const syncRoleFromStorage = () => {
  const candidateKeys = ["auth_user", "currentUser", "user", "profile", "loggedInUser"]
  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const role = parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole
      if (typeof role === "string" && role.trim()) {
        roleName.value = role.trim()
        return
      }
    } catch {
      // ignore malformed value
    }
  }
  roleName.value = ""
}

const confirmDeleteAppointment = (appointment: AppointmentListItem): void => {
  confirm.require({
    message: `Delete appointment for ${appointment.patient_name}?`,
    header: "Delete Appointment",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "Delete",
      severity: "danger",
      icon: "pi pi-trash",
    },
    accept: async () => {
      try {
        await appointmentPhase1Service.delete(appointment.id)
        successToast(toast, "Appointment deleted")
        if (selectedDetail.value?.id === appointment.id) {
          selectedDetail.value = undefined
        }
        await refreshAll()
        await refreshBookedDotsForVisibleMonth()
      } catch {
        errorToast(toast, "Delete appointment failed")
      }
    },
  })
}

const goToPatients = async (): Promise<void> => {
  if (!selectedDetail.value) return
  await router.push({
    path: "/patients",
    query: {
      patientId: String(selectedDetail.value.patient_id),
      name: selectedDetail.value.patient_name
    }
  })
}

const goToBilling = async (): Promise<void> => {
  if (!selectedDetail.value) return
  await router.push({
    path: "/billing",
    query: {
      patientId: String(selectedDetail.value.patient_id),
      appointmentId: String(selectedDetail.value.id),
      ...(selectedDetail.value.billing_id ? {billingId: String(selectedDetail.value.billing_id)} : {})
    }
  })
}

watch([calendarDate, statusFilter], async () => {
  page.value = 1
  await refreshAll()
})

watch(selectedClinicId, () => {
  const normalizedDate = findNextAllowedDate(new Date(calendarDate.value))
  if (normalizedDate.toDateString() !== calendarDate.value.toDateString()) {
    calendarDate.value = normalizedDate
  }
})

watch(createPatient, (patientId) => {
  if (!patientId) return
  const selectedPatientOption = patientOptions.value.find(option => option.id === patientId)
  if (selectedPatientOption?.clinic_id) {
    selectedClinicId.value = selectedPatientOption.clinic_id
  }
})

watch(createDoctor, (doctorId) => {
  if (!doctorId || createPatient.value) return
  const selectedDoctorOption = doctorOptions.value.find(option => option.id === doctorId)
  if (selectedDoctorOption?.clinic_id) {
    selectedClinicId.value = selectedDoctorOption.clinic_id
  }
})

watch(createBillingType, (billingType) => {
  if (billingType !== "HMO_BILLING") return
  serviceMode.value = "individual"
  selectedBundleId.value = undefined
  selectedServiceLines.value = selectedServiceLines.value.filter(line => line.type !== "bundle")
})

watch([createPatient, createBillingType], async () => {
  await syncCreatePatientHmoRates()
})

onMounted(async () => {
  syncRoleFromStorage()
  await loadCreateLookups()
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
  await refreshAll()
})
</script>

