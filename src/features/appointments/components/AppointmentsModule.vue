<template>
  <main class="app-page-shell space-y-5">
    <section class="rounded-3xl border border-[#A91D8B]/25 bg-[linear-gradient(120deg,rgba(36,39,87,0.14),rgba(94,24,105,0.10),rgba(169,29,139,0.18))] shadow-[0_18px_40px_rgba(36,39,87,0.12)] p-4 sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="text-lg font-semibold tracking-tight">Appointments Daily Deck</div>
          <p class="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Run the clinic's day from the primary Appointments view, then use the table below only for secondary filtering, export, and reporting support.
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
            <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Daily Deck</div>
            <div class="mt-1 text-2xl font-semibold">{{ dayBookings.length }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
            <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Filtered Table</div>
            <div class="mt-1 text-2xl font-semibold">{{ totalElements }}</div>
          </article>
          <article class="rounded-2xl border border-white/40 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
            <div class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Rescheduled Today</div>
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
          <p class="text-sm opacity-70">Pick a clinic schedule first to see valid booking days and the day status colors for the month.</p>
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
      <div class="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
        <span class="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 dark:border-red-500/20 dark:bg-red-500/10">
          <span class="h-2.5 w-2.5 rounded-full bg-red-500 dark:bg-red-300" />
          Red: Unfinished and unbilled
        </span>
        <span class="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-500/20 dark:bg-blue-500/10">
          <span class="h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-300" />
          Blue: Scheduled but not fully paid
        </span>
        <span class="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 dark:border-orange-500/20 dark:bg-orange-500/10">
          <span class="h-2.5 w-2.5 rounded-full bg-orange-500 dark:bg-orange-300" />
          Orange: Unfinished but billed
        </span>
        <span class="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 dark:border-amber-500/20 dark:bg-amber-500/10">
          <span class="h-2.5 w-2.5 rounded-full bg-amber-500 dark:bg-amber-300" />
          Yellow: Multi-session already billed
        </span>
        <span class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-300" />
          Green: Finished and billed
        </span>
      </div>
      <DatePicker
        v-model="calendarDate"
        inline
        fluid
        :manualInput="false"
        :disabledDays="calendarDisabledDays"
        @month-change="onCalendarMonthChange"
      >
        <template #date="slotProps">
          <div
            :class="calendarDayCellClass(slotProps.date)"
          >
            <span>{{ slotProps.date.day }}</span>
            <span
              v-if="getCalendarDayStatus(slotProps.date)"
              :class="calendarDayDotClass(slotProps.date)"
            />
          </div>
        </template>
      </DatePicker>
    </section>

    <section :class="sectionCardClass">
      <AppointmentPtDeck
        :groups="visiblePtDeckGroups"
        :selected-appointment-id="selectedDetail?.id"
        :can-delete-appointments="canDeleteAppointments"
        :is-loading="isPtDeckLoading"
        @create="openCreateDialog"
        @refresh="refreshAll"
        @select="selectAppointment"
        @billing="goToBillingForAppointment"
        @reschedule="openReschedule"
        @delete="confirmDeleteAppointment"
      />
    </section>

    <section :class="sectionCardClass">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h3 :class="sectionTitleClass">Appointments Table</h3>
          <p class="text-sm opacity-70">Secondary list and report view for filtering, paging, and CSV export for the selected date.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <IftaLabel>
          <InputText
            v-model="recordFilter"
            fluid
            placeholder="Search patient or record ID"
            :pt="ptInputText"
          />
          <label>Record search</label>
        </IftaLabel>
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
        <IftaLabel>
          <Select
            v-model="phaseFilter"
            :options="appointmentPhaseOptions"
            optionLabel="label"
            optionValue="value"
            showClear
            fluid
            placeholder="All phases"
            :pt="ptSelect"
          />
          <label>Phase filter</label>
        </IftaLabel>
        <IftaLabel>
          <Select
            v-model="ptFilter"
            :options="ptFilterOptions"
            optionLabel="label"
            optionValue="value"
            showClear
            filter
            fluid
            placeholder="All providers"
            :pt="ptSelect"
          />
          <label>Provider filter</label>
        </IftaLabel>
        <div class="flex flex-wrap items-end gap-2 md:col-span-2 xl:col-span-2">
          <Button label="Refresh Table" icon="pi pi-refresh" outlined :pt="ptOutlinedBtn" @click="refreshAll" />
          <Button label="Export CSV" icon="pi pi-download" severity="secondary" outlined :pt="ptOutlinedBtn" @click="onExportCsv" />
        </div>
        <p v-if="recordFilter.trim()" class="text-xs opacity-60 md:col-span-2 xl:col-span-6">
          Record searches look across clinics, providers, statuses, and dates. Clear the search to return to the selected table filters.
        </p>
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
          <Column field="appointment_phase" header="Phase">
            <template #body="{data}">
              <Tag :value="displayAppointmentPhase(data.appointment_phase)" :severity="appointmentPhaseSeverity(data.appointment_phase)" />
            </template>
          </Column>
          <Column field="location_context" header="Location">
            <template #body="{data}">
              <Tag :value="displayLocationContext(data.location_context)" :severity="appointmentLocationContextSeverity(data.location_context)" />
            </template>
          </Column>
          <Column field="specialty_tag_name" header="Specialty">
            <template #body="{data}">
              <div class="space-y-1">
                <div>{{ data.specialty_tag_name || "N/A" }}</div>
                <Tag
                  v-if="data.specialty_tag_name && data.specialty_tag_is_active === false"
                  value="Inactive specialty"
                  severity="secondary"
                  class="text-xs"
                />
              </div>
            </template>
          </Column>
          <Column field="treatment_area_name" header="Clinic Room">
            <template #body="{data}">
              <div class="space-y-1">
                <TreatmentAreaChip :name="data.treatment_area_name" :color="data.treatment_area_color" />
                <Tag
                  v-if="data.treatment_area_name && data.treatment_area_is_active === false"
                  value="Inactive room"
                  severity="secondary"
                  class="text-xs"
                />
              </div>
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
                <Button size="small" text icon="pi pi-eye" @click="selectAppointment(data)" />
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

    <Dialog
      v-model:visible="detailPanelVisible"
      :modal="false"
      position="right"
      dismissableMask
      :draggable="false"
      :resizable="false"
      :style="{ width: '430px' }"
      :breakpoints="{ '1280px': '92vw', '768px': '100vw' }"
      header="Appointment Checkout"
      @hide="closeDetailPanel"
    >
      <div v-if="selectedDetail" class="space-y-4">
        <div class="rounded-2xl border border-[#A91D8B]/20 bg-[linear-gradient(120deg,rgba(36,39,87,0.08),rgba(94,24,105,0.06),rgba(169,29,139,0.10))] p-4">
          <div class="text-xs uppercase tracking-wide opacity-70">Patient</div>
          <div class="mt-1 text-lg font-semibold">{{ selectedDetail.patient_name }}</div>
          <div class="mt-3 grid gap-3">
            <div
              :class="hasPatientWalletAmountToCollect
                ? 'rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
                : 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'"
            >
              <div class="text-xs uppercase tracking-wide opacity-75">Wallet 1 - Patient Responsibility</div>
              <template v-if="hasPatientWalletAmountToCollect">
                <div class="mt-2 text-sm font-medium">Collect this out-of-pocket balance before checkout clears.</div>
                <div class="mt-1 text-2xl font-semibold">{{ asCurrency(patientWalletAmountToCollect) }}</div>
              </template>
              <div v-else class="mt-2 text-sm font-medium">No out-of-pocket cash due right now.</div>
            </div>

            <div class="rounded-2xl border border-white/50 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/10">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs uppercase tracking-wide opacity-60">Wallet 2 - Third-Party / Packages</div>
                  <div class="mt-2 text-sm font-medium">
                    {{ sponsorWalletSummary?.display_text || "No HMO/LGU authorization attached to this appointment." }}
                  </div>
                  <div v-if="sponsorWalletSummary" class="mt-1 text-xs opacity-60">
                    Sponsor balances stay hidden here. Only authorization and session usage are shown.
                  </div>
                </div>
                <Tag
                  v-if="sponsorWalletSummary"
                  :value="sponsorWalletSummary.sponsor_type"
                  severity="info"
                  class="shrink-0"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Tag v-if="selectedDetail.specialty_tag_name" :value="selectedDetail.specialty_tag_name" severity="info" />
          <Tag
            v-if="selectedDetail.specialty_tag_name && selectedDetail.specialty_tag_is_active === false"
            value="Inactive specialty"
            severity="secondary"
          />
          <Tag
            v-if="selectedDetail.treatment_area_name && selectedDetail.treatment_area_is_active === false"
            value="Inactive room"
            severity="secondary"
          />
          <Tag
            v-if="selectedEncounterTicketHasPtSignature"
            value="PT Signed-Off"
            severity="success"
          />
          <Tag :value="displayAppointmentPhase(selectedDetail.appointment_phase)" :severity="appointmentPhaseSeverity(selectedDetail.appointment_phase)" />
          <Tag :value="displayLocationContext(selectedDetail.location_context)" :severity="appointmentLocationContextSeverity(selectedDetail.location_context)" />
          <Tag :value="displayAppointmentStatus(selectedDetail.appointment_status)" :severity="appointmentSeverity(selectedDetail.appointment_status)" />
          <Tag :value="displayBillingStatus(selectedDetail.billing_status)" :severity="billingSeverity(selectedDetail.billing_status)" />
          <Tag :value="encounterAttendanceLabel" :severity="selectedEncounterTicket ? 'success' : 'warn'" />
        </div>

        <div class="grid grid-cols-1 gap-3 text-sm">
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Clinic</div>
            <div class="font-medium">{{ selectedDetail.clinic_name }}</div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Patient Record ID</div>
            <div class="font-medium">{{ selectedDetail.patient_public_id || "Pending patient record code" }}</div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Appointment Record ID</div>
            <div class="font-medium">{{ selectedDetail.public_id || "Pending appointment record code" }}</div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Billing Record ID</div>
            <div class="font-medium">{{ selectedDetail.billing_public_id || "No billing linked yet" }}</div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Assigned Provider</div>
            <div class="font-medium">{{ selectedDetail.doctor_name || "N/A" }}</div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Schedule</div>
            <div class="font-medium">{{ formatDateTime(selectedDetail.starts_at) }} - {{ formatDateTime(selectedDetail.ends_at) }}</div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Specialty</div>
            <div class="font-medium">{{ selectedDetail.specialty_tag_name || "N/A" }}</div>
            <div
              v-if="selectedDetail.specialty_tag_name && selectedDetail.specialty_tag_is_active === false"
              class="mt-1 text-xs opacity-70"
            >
              Inactive now, preserved on this appointment for audit history.
            </div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Clinic Room</div>
            <div class="mt-1">
              <TreatmentAreaChip :name="selectedDetail.treatment_area_name" :color="selectedDetail.treatment_area_color" />
            </div>
            <div
              v-if="selectedDetail.treatment_area_name && selectedDetail.treatment_area_is_active === false"
              class="mt-1 text-xs opacity-70"
            >
              Inactive now, preserved on this appointment for audit history.
            </div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Appointment Status</div>
            <div class="mt-1">
              <Tag :value="displayAppointmentStatus(selectedDetail.appointment_status)" :severity="appointmentSeverity(selectedDetail.appointment_status)" />
            </div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Encounter Ticket</div>
            <div class="font-medium">
              {{ selectedEncounterTicket?.slip_number || "Not generated yet" }}
            </div>
            <div class="mt-1 text-xs opacity-70">
              {{ selectedEncounterTicketSummaryLabel }}
            </div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Encounter Ticket ID</div>
            <div class="font-medium">{{ encounterTicketRecordLabel }}</div>
            <div class="mt-1 text-xs opacity-70">
              {{ isSelectedEncounterTicketLocked
                ? "Locked as the independent attendance ledger record for this appointment."
                : "This attendance ledger record stays open until patient sign-off locks it." }}
            </div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Active Billing Package</div>
            <div class="font-medium">{{ selectedEncounterTicketPackageLabel }}</div>
            <div v-if="selectedEncounterTicketPackageSourceLabel" class="mt-1 text-xs opacity-70">
              {{ selectedEncounterTicketPackageSourceLabel }}
            </div>
          </div>
          <div :class="detailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">PT Session Confirmation</div>
            <div class="font-medium">
              {{ selectedEncounterTicketHasPtSignature
                ? `Signed by ${selectedEncounterTicketPtConfirmedByLabel}`
                : "PT has not signed this session yet" }}
            </div>
            <div class="mt-1 text-xs opacity-70">
              {{ selectedEncounterTicket?.pt_confirmed_at
                ? `Captured ${formatDateTime(selectedEncounterTicket.pt_confirmed_at)}`
                : "Higher-ups can review the PT signature here before final patient sign-off." }}
            </div>
            <div
              v-if="selectedEncounterTicketPtCompletionTag"
              class="mt-2 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-xs opacity-80 dark:border-white/10 dark:bg-white/10"
            >
              {{ selectedEncounterTicketPtCompletionTag }}
            </div>
            <div
              v-if="selectedEncounterTicket?.pt_signature_data_url"
              class="mt-3 overflow-hidden rounded-xl border border-[rgb(var(--app-border))] bg-white p-2"
            >
              <img
                :src="selectedEncounterTicket.pt_signature_data_url"
                alt="PT signature"
                class="h-24 w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-1">
          <Button label="Open Patient Record" icon="pi pi-user" outlined :pt="ptOutlinedBtn" class="min-w-[180px]" @click="goToPatients" />
          <Button
            :label="selectedDetail.billing_id ? 'Open Billing Record' : 'Create Billing'"
            icon="pi pi-receipt"
            severity="secondary"
            outlined
            :pt="ptOutlinedBtn"
            class="min-w-[180px]"
            @click="goToBilling"
          />
        </div>

        <Button
          :label="encounterTicketButtonLabel"
          icon="pi pi-receipt"
          :pt="ptPrimaryBtn"
          class="w-full"
          :disabled="!canProcessEncounterTicket"
          @click="openEncounterTicketDialog"
        />
        <Button
          v-if="isSelectedEncounterTicketLocked"
          label="Export Ticket PDF"
          icon="pi pi-file-pdf"
          outlined
          class="w-full"
          @click="exportSelectedEncounterTicketPdf"
        />
        <p v-if="!canProcessEncounterTicket" class="text-xs opacity-70">
          Create or open the billing record first so the signed ticket can be permanently attached to the patient’s billing profile.
        </p>
      </div>
    </Dialog>

    <Dialog
      v-model:visible="encounterTicketVisible"
      modal
      header="Digital Sign-Off Slip"
      :style="{width:'620px'}"
      :breakpoints="{'1024px':'94vw','768px':'100vw'}"
    >
      <div v-if="selectedDetail" class="space-y-4">
        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
          <div class="text-sm font-semibold text-[rgb(var(--app-fg))]">Encounter Ticket</div>
          <p class="mt-1 text-sm text-[rgb(var(--app-fg))]/65">
            Review the transaction details below, then let the patient sign to confirm attendance and authorize the session deduction.
          </p>
          <div class="mt-4 grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Date</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ formatDateTime(selectedDetail.starts_at) }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">PT Name</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ selectedDetail.doctor_name || "Unassigned" }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Service Rendered</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ encounterServiceRenderedLabel }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Session Deduction</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ encounterSessionDeductionLabel }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Encounter Ticket ID</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ encounterTicketRecordLabel }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Billing Package Link</div>
              <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ selectedEncounterTicketPackageLabel }}</div>
              <div v-if="selectedEncounterTicketPackageSourceLabel" class="mt-1 text-xs text-[rgb(var(--app-fg))]/55">
                {{ selectedEncounterTicketPackageSourceLabel }}
              </div>
            </div>
          </div>
          <div v-if="selectedEncounterTicket" class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
            Existing slip: <strong>{{ selectedEncounterTicket.slip_number || `#${selectedEncounterTicket.id}` }}</strong>
            <span class="mx-1 opacity-50">|</span>
            {{ isSelectedEncounterTicketLocked
              ? `Patient signed ${formatDateTime(selectedEncounterTicket.signed_off_at)}`
              : "Waiting for patient sign-off to lock this record" }}
          </div>
          <div v-if="isSelectedEncounterTicketLocked" class="mt-3 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            This signed ticket is locked as a permanent billing record and can no longer be changed.
          </div>
        </div>

        <div v-if="selectedEncounterTicketHasPtSignature" class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">PT Confirmation</div>
          <div class="mt-2 text-sm text-[rgb(var(--app-fg))]/75">
            {{ selectedEncounterTicketPtConfirmedByLabel }}
            <span v-if="selectedEncounterTicket?.pt_confirmed_at">
              signed on {{ formatDateTime(selectedEncounterTicket.pt_confirmed_at) }}
            </span>
            to confirm the session was completed.
          </div>
          <div
            v-if="selectedEncounterTicketPtCompletionTag"
            class="mt-3 rounded-xl border border-white/50 bg-white/70 px-3 py-2 text-sm text-[rgb(var(--app-fg))]/75 dark:border-white/10 dark:bg-white/10"
          >
            {{ selectedEncounterTicketPtCompletionTag }}
          </div>
          <div class="mt-4 overflow-hidden rounded-xl border border-[rgb(var(--app-border))] bg-white p-2">
            <img
              :src="selectedEncounterTicket?.pt_signature_data_url"
              alt="PT signature"
              class="h-28 w-full object-contain"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4">
          <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Patient Signature</div>
          <div class="mt-2 text-sm text-[rgb(var(--app-fg))]/65">
            {{ isSelectedEncounterTicketLocked
              ? "This is the stored patient signature linked to billing. It is shown here for record review only."
              : "The patient signs below to acknowledge attendance and authorize this session to be tallied." }}
          </div>
          <div class="mt-4">
            <PatientSignaturePad v-model="encounterTicketSignatureDataUrl" :disabled="isSelectedEncounterTicketLocked" />
          </div>
        </div>
      </div>
      <template #footer>
        <Button :label="isSelectedEncounterTicketLocked ? 'Close' : 'Cancel'" text @click="encounterTicketVisible = false" />
        <Button
          v-if="!isSelectedEncounterTicketLocked"
          :label="'Generate Sign-Off Slip'"
          icon="pi pi-check"
          :loading="isEncounterTicketSaving"
          :pt="ptPrimaryBtn"
          @click="submitEncounterTicket"
        />
      </template>
    </Dialog>

    <Dialog v-model:visible="rescheduleVisible" modal header="Reschedule Appointment" :style="{width:'520px'}">
      <div class="space-y-3">
        <p v-if="activeAppointment">Current reschedules: <strong>{{ activeAppointment.reschedule_count }}</strong> / 3</p>
        <Message v-if="needsOverrideReason" severity="warn" :closable="false">
          Max reschedule reached. Owner override is required and a reason is mandatory.
        </Message>
        <IftaLabel>
          <SelectButton
            v-model="rescheduleSlotDuration"
            :options="slotDurationOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
          <label>Slot Length</label>
        </IftaLabel>
        <IftaLabel>
          <DatePicker
            v-model="rescheduleStart"
            showTime
            fluid
            :manualInput="false"
            :stepMinute="slotMinuteStep"
            :disabledDays="calendarDisabledDays"
            hourFormat="24"
          />
          <label>New Start</label>
        </IftaLabel>
        <IftaLabel>
          <InputText :modelValue="formatDateTime(rescheduleEnd)" fluid readonly />
          <label>New End</label>
        </IftaLabel>
        <IftaLabel>
          <InputText v-model="overrideReason" fluid :disabled="!needsOverrideReason" />
          <label>Owner override reason (required after 3)</label>
        </IftaLabel>
        <small class="opacity-70">Slots start every 15 minutes and must be 15, 30, or 60 minutes long.</small>
        <small class="opacity-70">If max reschedule reached, only Owner override is accepted.</small>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="rescheduleVisible = false" />
        <Button label="Submit Reschedule" icon="pi pi-check" :pt="ptModalPrimaryBtn" @click="submitReschedule" />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="createVisible"
      modal
      header="Create Appointment"
      :style="{width:'980px'}"
      :breakpoints="{'1280px':'96vw','768px':'100vw'}"
    >
<div class="space-y-5">
  <!-- Header Card -->
  <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
    <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_160px] lg:items-center">
      <div>
        <h3 class="text-lg font-semibold text-[rgb(var(--app-fg))]">New appointment</h3>
        <p class="mt-1 text-sm leading-6 text-[rgb(var(--app-fg))]/65">
          Fill in the essentials, add at least one service, then save.
        </p>
      </div>
      <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Date</div>
        <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ selectedDateLabel }}</div>
      </div>
      <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Clinic</div>
        <div class="mt-1 font-medium text-[rgb(var(--app-fg))]">{{ selectedClinic?.name || "No clinic selected" }}</div>
      </div>
      <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-4 py-3">
        <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Total</div>
        <div class="mt-1 font-semibold text-[rgb(var(--app-fg))]">{{ asCurrency(subtotalFromServiceLines) }}</div>
      </div>
    </div>
  </section>

  <div class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
    <div class="space-y-4">

      <!-- ── Essentials ── -->
      <section :class="createModalCardClass">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 :class="createModalSectionTitleClass">Essentials</h4>
            <p class="mt-1 text-sm leading-6 text-[rgb(var(--app-fg))]/65">
              Patient, billing type, and the basic booking setup.
            </p>
          </div>
          <Tag :value="displayLocationContext(createLocationContext)" severity="secondary" />
        </div>

        <!-- Main fields -->
        <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <!-- Patient -->
          <div class="md:col-span-2 flex flex-col gap-1.5">
            <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Patient</label>
            <Select
              v-model="createPatient"
              :options="patientOptions"
              optionLabel="name"
              optionValue="id"
              filter fluid
              placeholder="Search patient…"
              :pt="ptSelect"
            />
          </div>

          <!-- Billing Type -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Billing Type</label>
            <Select
              v-model="createBillingType"
              :options="billingTypeOptions"
              optionLabel="label"
              optionValue="value"
              fluid :pt="ptSelect"
            />
          </div>

          <!-- Phase -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Phase</label>
            <div class="flex rounded-xl bg-[rgb(var(--app-bg))] border border-[rgb(var(--app-border))] p-1 gap-1">
              <button
                v-for="option in appointmentPhaseOptions"
                :key="option.value"
                @click="createPhase = option.value"
                :class="[
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                  createPhase === option.value
                    ? 'bg-[rgb(var(--app-card))] text-[rgb(var(--app-fg))] shadow-sm ring-1 ring-[rgb(var(--app-border))]'
                    : 'text-[rgb(var(--app-fg))]/50 hover:text-[rgb(var(--app-fg))]/80 hover:bg-[rgb(var(--app-card))]'
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- HMO message -->
<template v-if="createBillingType === 'HMO_BILLING'">
  <div
    v-if="createPatientHmoInfo"
    class="mt-4 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
  >
    <i class="pi pi-info-circle shrink-0 text-blue-500 dark:text-blue-400" />
    <span>
      <span class="font-medium">{{ createPatientHmoInfo.hmo_name }}</span>
      <span class="mx-1 opacity-40">·</span>{{ createPatientHmoInfo.hmo_type_name }}
      <span class="mx-1 opacity-40">·</span>{{ createPatientHmoInfo.company_name }}
    </span>
  </div>

  <div
    v-else-if="createPatient && !syncingCreateHmoRates"
    class="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
  >
    <i class="pi pi-exclamation-triangle shrink-0 text-amber-500 dark:text-amber-400" />
    <span>No HMO information on file for this patient. Please register HMO via the Patients module first.</span>
  </div>
</template>

        <!-- Additional details (collapsible) -->
        <details class="mt-4 group rounded-2xl border border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))]">
          <summary class="flex cursor-pointer select-none items-center justify-between px-4 py-3 text-sm font-medium text-[rgb(var(--app-fg))]">
            <span>Additional details</span>
            <svg
              class="h-4 w-4 text-[rgb(var(--app-fg))]/40 transition-transform duration-200 group-open:rotate-180"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          <div class="px-4 pb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <!-- Assigned Provider -->
            <div class="md:col-span-2 flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Assigned Provider</label>
              <Select
                v-model="createDoctor"
                :options="doctorOptions"
                optionLabel="label"
                optionValue="id"
                filter showClear fluid
                placeholder="Select provider (optional)"
                :pt="ptSelect"
              />
            </div>

            <!-- Location Context -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Location Context</label>
              <div class="flex rounded-xl bg-[rgb(var(--app-bg))] border border-[rgb(var(--app-border))] p-1 gap-1">
                <button
                  v-for="option in appointmentLocationContextOptions"
                  :key="option.value"
                  @click="createLocationContext = option.value"
                  :class="[
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                    createLocationContext === option.value
                      ? 'bg-[rgb(var(--app-card))] text-[rgb(var(--app-fg))] shadow-sm ring-1 ring-[rgb(var(--app-border))]'
                      : 'text-[rgb(var(--app-fg))]/50 hover:text-[rgb(var(--app-fg))]/80 hover:bg-[rgb(var(--app-card))]'
                  ]"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>

            <!-- Specialty -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Specialty</label>
              <Select
                v-model="createSpecialtyTag"
                :options="specialtyTagOptions"
                optionLabel="name"
                optionValue="id"
                showClear filter fluid
                :disabled="isCreateSpecialtyLockedByProvider"
                :placeholder="isCreateSpecialtyLockedByProvider ? 'Provider specialty applied automatically' : 'Select specialty (optional)'"
                :pt="ptSelect"
              />
              <p v-if="selectedCreateProviderHasSpecialty || selectedCreateProviderRequiresSpecialty" class="px-1 text-xs text-[rgb(var(--app-fg))]/50">
                {{ selectedCreateProviderSpecialtyLabel
                  ? (selectedCreateProviderRequiresSpecialty
                    ? `This provider role requires a specialty, so ${selectedCreateProviderSpecialtyLabel} is applied automatically.`
                    : `${selectedCreateProviderSpecialtyLabel} is suggested from the selected provider and can still be changed.`)
                  : 'This provider role requires a specialty. Assign it on Staffs or choose one here before saving.' }}
              </p>
            </div>

            <!-- Clinic Room -->
            <div class="md:col-span-2 flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Clinic Room</label>
              <Select
                v-model="createTreatmentArea"
                :options="treatmentAreaOptions"
                optionLabel="name"
                optionValue="id"
                showClear filter fluid
                :disabled="createLocationContext === 'HOME_CARE'"
                :placeholder="createLocationContext === 'HOME_CARE' ? 'Not used for Home Care' : 'Select clinic room (optional)'"
                :pt="ptSelect"
              >
                <template #option="{ option }">
                  <div class="flex items-center gap-2">
                    <TreatmentAreaChip :name="option.name" :color="option.color" />
                  </div>
                </template>
                <template #value="{ value, placeholder }">
                  <span v-if="value && selectedTreatmentAreaOption">
                    <TreatmentAreaChip :name="selectedTreatmentAreaOption.name" :color="selectedTreatmentAreaOption.color" />
                  </span>
                  <span v-else class="opacity-70">{{ placeholder }}</span>
                </template>
              </Select>
              <p class="px-1 text-xs text-[rgb(var(--app-fg))]/50">
                {{ createLocationContext === 'HOME_CARE'
                  ? 'Clinic rooms are skipped for Home Care appointments.'
                  : 'Clinic rooms are managed from the Clinics page and applied per selected clinic.' }}
              </p>
            </div>

            <!-- Billing Notes -->
            <div class="md:col-span-2 flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Billing Notes</label>
              <InputText v-model="createBillingNotes" fluid placeholder="Optional billing notes" :pt="ptInputText" />
            </div>
          </div>
        </details>
      </section>

      <!-- ── Services ── -->
      <section :class="createModalCardClass">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h4 :class="createModalSectionTitleClass">Services</h4>
            <p class="mt-1 text-sm leading-6 text-[rgb(var(--app-fg))]/65">
              Add at least one service for this appointment.
            </p>
          </div>
          <span class="text-sm text-[rgb(var(--app-fg))]/60">{{ selectedServiceLines.length }} selected</span>
        </div>

        <div class="mt-4 space-y-4">
          <!-- HMO info banner -->
<template v-if="createBillingType === 'HMO_BILLING'">
  <div
    v-if="createPatientHmoInfo"
    class="mt-4 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
  >
    <i class="pi pi-info-circle shrink-0 text-blue-500 dark:text-blue-400" />
    <span>
      <span class="font-medium">{{ createPatientHmoInfo.hmo_name }}</span>
      <span class="mx-1 opacity-40">·</span>{{ createPatientHmoInfo.hmo_type_name }}
      <span class="mx-1 opacity-40">·</span>{{ createPatientHmoInfo.company_name }}
    </span>
  </div>

  <div
    v-else-if="createPatient && !syncingCreateHmoRates"
    class="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
  >
    <i class="pi pi-exclamation-triangle shrink-0 text-amber-500 dark:text-amber-400" />
    <span>No HMO information on file for this patient. Please register HMO via the Patients module first.</span>
  </div>
</template>

          <!-- Service Mode Toggle -->
          <div v-if="createBillingType !== 'SELF_PAY_PACKAGE'" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Service Mode</label>
            <div class="flex rounded-xl bg-[rgb(var(--app-bg))] border border-[rgb(var(--app-border))] p-1 gap-1">
              <button
                v-for="option in visibleServiceModeOptions"
                :key="option.value"
                @click="serviceMode = option.value"
                :class="[
                  'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                  serviceMode === option.value
                    ? 'bg-[rgb(var(--app-card))] text-[rgb(var(--app-fg))] shadow-sm ring-1 ring-[rgb(var(--app-border))]'
                    : 'text-[rgb(var(--app-fg))]/50 hover:text-[rgb(var(--app-fg))]/80 hover:bg-[rgb(var(--app-card))]'
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <!-- Package -->
          <div v-if="createBillingType === 'SELF_PAY_PACKAGE'" class="space-y-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Package Offer</label>
              <Select
                v-model="selectedPackageOfferId"
                :options="activePackageServiceOffers"
                optionLabel="name"
                optionValue="id"
                filter fluid
                placeholder="Select package offer"
                :pt="ptSelect"
                @update:modelValue="selectPackageOffer"
              />
              <p v-if="activePackageServiceOffers.length === 0" class="px-1 text-xs text-[rgb(var(--app-fg))]/50">
                No package offers available. Add them in Self Pay: Package Service Management.
              </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Machine</label>
                <Select v-model="selectedMachineId" :options="machineServices" optionLabel="name" optionValue="id" filter fluid placeholder="Select machine" :pt="ptSelect" @update:modelValue="addServiceLine('machine')" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Technique</label>
                <Select v-model="selectedTechniqueId" :options="techniqueServices" optionLabel="name" optionValue="id" filter fluid placeholder="Select technique" :pt="ptSelect" @update:modelValue="addServiceLine('technique')" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Evaluation</label>
                <Select v-model="selectedEvaluationId" :options="evaluationServices" optionLabel="name" optionValue="id" filter fluid placeholder="Select evaluation" :pt="ptSelect" @update:modelValue="addServiceLine('evaluation')" />
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Add-on Type</label>
                  <Select v-model="selectedAddOnType" :options="addOnTypeOptions" optionLabel="label" optionValue="value" fluid placeholder="Type" :pt="ptSelect" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Add-on</label>
                  <Select v-model="selectedAddOnId" :options="currentAddOnServices" optionLabel="name" optionValue="id" filter fluid placeholder="Select" :pt="ptSelect" @update:modelValue="addServiceLine(selectedAddOnType)" />
                </div>
              </div>
            </div>
          </div>

          <!-- Individual -->
          <div v-else-if="serviceMode === 'individual'" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Machine</label>
              <Select v-model="selectedMachineId" :options="machineServices" optionLabel="name" optionValue="id" filter fluid placeholder="Select machine" :pt="ptSelect" @update:modelValue="addServiceLine('machine')" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Technique</label>
              <Select v-model="selectedTechniqueId" :options="techniqueServices" optionLabel="name" optionValue="id" filter fluid placeholder="Select technique" :pt="ptSelect" @update:modelValue="addServiceLine('technique')" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Evaluation</label>
              <Select v-model="selectedEvaluationId" :options="evaluationServices" optionLabel="name" optionValue="id" filter fluid placeholder="Select evaluation" :pt="ptSelect" @update:modelValue="addServiceLine('evaluation')" />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Add-on Type</label>
                <Select v-model="selectedAddOnType" :options="addOnTypeOptions" optionLabel="label" optionValue="value" fluid placeholder="Type" :pt="ptSelect" />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Add-on</label>
                <Select v-model="selectedAddOnId" :options="currentAddOnServices" optionLabel="name" optionValue="id" filter fluid placeholder="Select" :pt="ptSelect" @update:modelValue="addServiceLine(selectedAddOnType)" />
              </div>
            </div>
          </div>

          <!-- Bundled -->
          <div v-else-if="serviceMode === 'bundled'" class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Bundle</label>
            <Select
              v-model="selectedBundleId"
              :options="activeBundledServices"
              optionLabel="name"
              optionValue="id"
              filter fluid
              placeholder="Select a bundle"
              :pt="ptSelect"
              @update:modelValue="selectBundle"
            />
            <p v-if="activeBundledServices.length === 0" class="px-1 text-xs text-[rgb(var(--app-fg))]/50">
              No bundles available. Add them in Single Pay: Single Service Management.
            </p>
          </div>

          <!-- Selected Services Summary -->
          <div
            v-if="selectedServiceLines.length > 0"
            class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-semibold text-[rgb(var(--app-fg))]">Selected Services</div>
                <div class="mt-1 text-sm text-[rgb(var(--app-fg))]/65">
                  {{ selectedServiceLines.length }} item{{ selectedServiceLines.length === 1 ? '' : 's' }} will be attached to billing.
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Amount Due</div>
                <div class="mt-1 text-lg font-semibold text-[rgb(var(--app-fg))]">{{ asCurrency(subtotalFromServiceLines) }}</div>
              </div>
            </div>
            <div class="mt-4 grid gap-2 max-h-60 overflow-y-auto pr-1">
              <article
                v-for="(line, idx) in selectedServiceLines"
                :key="`${line.type}-${line.id}-${idx}`"
                class="flex items-start justify-between gap-3 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3"
              >
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <Tag :value="formatCreateLineType(line.type)" :severity="createLineSeverity(line.type)" class="text-xs" />
                    <span class="font-medium text-[rgb(var(--app-fg))]">{{ line.name }}</span>
                  </div>
                  <div class="text-xs text-[rgb(var(--app-fg))]/60">
                    <span v-if="getCreateLineOriginalPrice(line) > getEffectiveCreateLinePrice(line)" class="mr-2 line-through">
                      {{ asCurrency(getCreateLineOriginalPrice(line)) }}
                    </span>
                    <span>{{ asCurrency(getEffectiveCreateLinePrice(line)) }}</span>
                  </div>
                </div>
                <Button size="small" text severity="danger" icon="pi pi-trash" @click="removeServiceLine(idx)" />
              </article>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-else
            class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-5 py-8 text-center"
          >
            <div class="font-semibold text-[rgb(var(--app-fg))]">No services selected yet</div>
            <p class="mt-2 text-sm leading-6 text-[rgb(var(--app-fg))]/65">
              Add the service lines for this booking. A Home Service add-on from Promos and Offers will automatically tag this booking as Home Care.
            </p>
          </div>

<div
  v-if="hasHomeServiceAddOn"
  class="flex items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400"
>
  <i class="pi pi-info-circle shrink-0 text-blue-500 dark:text-blue-400" />
  <span>Home Service add-on detected. This appointment is tagged as Home Care automatically.</span>
</div>

<div
  v-else-if="createLocationContext === 'HOME_CARE'"
  class="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
>
  <i class="pi pi-exclamation-triangle shrink-0 text-amber-500 dark:text-amber-400" />
  <span>Select a Home Service add-on from Add-ons before saving this Home Care appointment.</span>
</div>
        </div>
      </section>

    </div>

    <!-- ── Schedule (sidebar) ── -->
<section :class="createModalCardClass">
  <div>
    <h4 :class="createModalSectionTitleClass">Schedule</h4>
    <p class="mt-1 text-sm leading-6 text-[rgb(var(--app-fg))]/65">
      Appointment time follows the selected clinic schedule.
    </p>
  </div>

  <div class="mt-4 space-y-4">

    <!-- Slot Length -->
    <div class="flex flex-col gap-1.5">
      <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">
        Slot Length
      </label>
      <div class="flex rounded-xl bg-[rgb(var(--app-bg))] border border-[rgb(var(--app-border))] p-1 gap-1">
        <button
          v-for="option in slotDurationOptions"
          :key="option.value"
          @click="createSlotDuration = option.value"
          :class="[
            'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
            createSlotDuration === option.value
              ? 'bg-[rgb(var(--app-card))] text-[rgb(var(--app-fg))] shadow-sm ring-1 ring-[rgb(var(--app-border))]'
              : 'text-[rgb(var(--app-fg))]/50 hover:text-[rgb(var(--app-fg))]/80 hover:bg-[rgb(var(--app-card))]'
          ]"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <template v-if="selectedPackageHasSessionSchedules">
      <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-4 py-3">
        <div class="text-sm font-medium text-[rgb(var(--app-fg))]">
          {{ selectedPackageOfferDetail?.name || "This package" }} includes {{ packageSessionSchedules.length }} schedulable session{{ packageSessionSchedules.length === 1 ? "" : "s" }}.
        </div>
        <p class="mt-1 text-xs text-[rgb(var(--app-fg))]/60">
          Each schedule creates its own appointment while sharing the same billing record.
        </p>
      </div>

      <div class="space-y-3">
        <article
          v-for="(schedule, index) in packageSessionSchedules"
          :key="schedule.key"
          class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-medium text-[rgb(var(--app-fg))]">{{ schedule.sessionName }}</div>
              <div class="mt-1 text-xs text-[rgb(var(--app-fg))]/60">
                Session {{ schedule.occurrence }} of {{ schedule.totalOccurrences }}
              </div>
            </div>
            <Tag :value="`#${index + 1}`" severity="contrast" />
          </div>

          <div class="mt-3 grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">
                Start
              </label>
              <DatePicker
                :modelValue="schedule.startsAt"
                showTime
                fluid
                :manualInput="false"
                :stepMinute="slotMinuteStep"
                :disabledDays="calendarDisabledDays"
                hourFormat="24"
                @update:modelValue="value => updatePackageSessionStart(index, value)"
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">
                End
              </label>
              <div class="flex h-full items-center rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-3 py-2 text-sm text-[rgb(var(--app-fg))]/70">
                {{ formatDateTime(getPackageSessionEnd(schedule.startsAt)) }}
              </div>
            </div>
          </div>
        </article>
      </div>
    </template>

    <div v-else class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">
          Start
        </label>
        <DatePicker
          v-model="createStart"
          showTime fluid
          :manualInput="false"
          :stepMinute="slotMinuteStep"
          :disabledDays="calendarDisabledDays"
          hourFormat="24"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">
          End
        </label>
        <div class="flex h-full items-center rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-3 py-2 text-sm text-[rgb(var(--app-fg))]/70">
          {{ formatDateTime(createEnd) }}
        </div>
      </div>
    </div>

    <!-- Clinic Schedule info — integrated, not orphaned -->
    <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] px-4 py-3 space-y-1">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs uppercase tracking-wide text-[rgb(var(--app-fg))]/55">Clinic Schedule</span>
        <span class="text-xs text-[rgb(var(--app-fg))]/40">15 · 30 · 60 min slots</span>
      </div>
      <div class="text-sm font-medium text-[rgb(var(--app-fg))]">
        {{ selectedClinicScheduleLabel || "No clinic resolved yet" }}
      </div>
    </div>

  </div>

<div v-if="isOvernightClinicSchedule" class="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
  <i class="pi pi-exclamation-triangle mt-0.5 shrink-0 text-amber-500 dark:text-amber-400" />
  <span>This clinic schedule is overnight. If this is unintended, verify clinic end time (AM/PM).</span>
</div>
</section>

  </div>
</div>
      <template #footer>
        <Button label="Cancel" text @click="createVisible = false" />
        <Button label="Create Appointment" icon="pi pi-check" :pt="ptPrimaryBtn" @click="submitCreateAppointment" />
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
import AppointmentPtDeck from "@/features/appointments/components/AppointmentPtDeck.vue";
import PatientSignaturePad from "@/features/appointments/components/PatientSignaturePad.vue";
import TreatmentAreaChip from "@/features/appointments/components/TreatmentAreaChip.vue";
import {
  appointmentPhase1Service,
  type AppointmentEncounterTicket,
  type AppointmentEncounterTicketPayload,
  type AppointmentDetail,
  type DailyPtDeckGroup,
  type AppointmentListItem,
  type AppointmentLocationContext,
  type AppointmentPhase
} from "@/features/appointments/api/appointment-phase1.service";
import {exportToExcel} from "@/utils/export-excel.util";
import {
  openEncounterTicketPdfWindow,
  renderEncounterTicketPdfWindow
} from "@/utils/encounter-ticket-pdf.util";
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
import {createReferenceService} from "@/services/reference.service";
import {ReferenceTanstackKey} from "@/utils/keys/tanstack-key";
import type {AppointmentProviderType, SpecialtyTag, TreatmentArea} from "@/models/reference";
import { ptInputText, ptModalPrimaryBtn, ptOutlinedBtn, ptPrimaryBtn, ptSelect } from "@/features/shared/table-header.styles";

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
const dailyPtDeckGroups = ref<DailyPtDeckGroup[]>([])
const selectedDetail = ref<AppointmentDetail>()
const detailPanelVisible = ref(false)
const encounterTicketVisible = ref(false)
const isEncounterTicketSaving = ref(false)
const encounterTicketAttendedAt = ref<Date>(new Date())
const encounterTicketSignatureDataUrl = ref("")
const isLoading = ref(false)
const isPtDeckLoading = ref(false)
const slotMinuteStep = 15
type SlotDurationMinutes = 15 | 30 | 60
type DoctorConsultantFilterValue = number | "UNASSIGNED"
const slotDurationOptions: Array<{label: string; value: SlotDurationMinutes}> = [
  {label: "15 min", value: 15},
  {label: "30 min", value: 30},
  {label: "60 min", value: 60},
]

const page = ref(1)
const pageSize = ref(10)
const totalElements = ref(0)
const recordFilter = ref("")
const statusFilter = ref<string>()
const phaseFilter = ref<AppointmentPhase>()
const ptFilter = ref<DoctorConsultantFilterValue>()
const calendarDate = ref<Date>(new Date())

const rescheduleVisible = ref(false)
const activeAppointment = ref<AppointmentListItem>()
const rescheduleStart = ref<Date>(new Date())
const rescheduleEnd = ref<Date>(new Date())
const rescheduleSlotDuration = ref<SlotDurationMinutes>(60)
const overrideReason = ref("")

const createVisible = ref(false)
type AppointmentPersonOption = {
  id: number
  name: string
  label: string
  clinic_id: number
  role_name?: string
  appointment_provider_type?: AppointmentProviderType
  requires_specialty_tag?: boolean
  specialty_tag_id?: number
  specialty_tag_name?: string
}
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
type SelectedServiceLine = {
  type: string
  id: string
  name: string
  price: number
  originalPrice?: number
}
type PackageSessionSchedule = {
  key: string
  sessionId?: string
  sessionName: string
  occurrence: number
  totalOccurrences: number
  startsAt: Date
}
type PackageSessionTemplate = Omit<PackageSessionSchedule, "startsAt">
const patientOptions = ref<AppointmentPersonOption[]>([])
const doctorOptions = ref<AppointmentPersonOption[]>([])
const clinicOptions = ref<Clinic[]>([])
const specialtyTagOptions = ref<SpecialtyTag[]>([])
const treatmentAreaOptions = ref<TreatmentArea[]>([])
const sessionServices = ref<BillingPickerLookup[]>([])
const billingTypeOptions = [
  {label: "Self Pay: Single Service", value: "SELF_PAY_SINGLE"},
  {label: "Self Pay: Package Service", value: "SELF_PAY_PACKAGE"},
  {label: "HMO", value: "HMO_BILLING"},
  {label: "LGU", value: "LGU_BILLING"},
]
const appointmentPhaseOptions: Array<{label: string; value: AppointmentPhase}> = [
  {label: "Eval", value: "EVAL"},
  {label: "Session", value: "SESSION"},
  {label: "Re-Eval", value: "RE_EVAL"},
]
const appointmentLocationContextOptions: Array<{label: string; value: AppointmentLocationContext}> = [
  {label: "In-Clinic", value: "IN_CLINIC"},
  {label: "Home Care", value: "HOME_CARE"},
]
const appointmentStatusOptions = ["Pending", "Rescheduled", "No show", "Cancelled", "Completed"]
const selectedClinicId = ref<number>()
const createPatient = ref<number>()
const createDoctor = ref<number>()
const createPhase = ref<AppointmentPhase>("SESSION")
const createLocationContext = ref<AppointmentLocationContext>("IN_CLINIC")
const isCreateLocationContextAuto = ref(false)
const createSpecialtyTag = ref<number>()
const createTreatmentArea = ref<number>()
const createBillingType = ref<BillingType>("SELF_PAY_SINGLE")
const createBillingNotes = ref("")
const createStart = ref<Date>(new Date())
const createEnd = ref<Date>(new Date(Date.now() + 60 * 60 * 1000))
const createSlotDuration = ref<SlotDurationMinutes>(60)
const allSinglePayServices = ref<SingleService[]>([])
const allBundledServices = ref<BundledService[]>([])
const allPackageServiceOffers = ref<PackageServiceOffer[]>([])

// Service selection state
type ServiceMode = "individual" | "bundled"
const serviceMode = ref<ServiceMode>("individual")
const serviceModeOptions: Array<{label: string; value: ServiceMode}> = [
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
const selectedServiceLines = ref<SelectedServiceLine[]>([])
const selectedPackageOfferDetail = ref<PackageServiceOffer | null>(null)
const packageSessionSchedules = ref<PackageSessionSchedule[]>([])
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
type CalendarDayStatus =
  | "unfinished_unbilled"
  | "scheduled_partially_paid"
  | "unfinished_billed"
  | "multi_session_billed"
  | "finished_billed"
const calendarDayStatusMap = ref<Map<string, CalendarDayStatus>>(new Map())
const bookedMonthCache = ref<Map<string, Map<string, CalendarDayStatus>>>(new Map())
const visibleMonth = ref<number>(new Date().getMonth())
const visibleYear = ref<number>(new Date().getFullYear())

const needsOverrideReason = computed(() => (activeAppointment.value?.reschedule_count ?? 0) >= 3)
const canDeleteAppointments = computed(() => roleName.value === "Owner")
const specialtyTagReferenceService = createReferenceService<SpecialtyTag>(ReferenceTanstackKey.SPECIALTY_TAGS)
const treatmentAreaReferenceService = createReferenceService<TreatmentArea>(ReferenceTanstackKey.TREATMENT_AREAS)

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const addMinutes = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * 60 * 1000)

const snapToSlotBoundary = (date: Date): Date => {
  const result = new Date(date)
  const snappedMinutes = Math.floor(result.getMinutes() / slotMinuteStep) * slotMinuteStep
  result.setMinutes(snappedMinutes, 0, 0)
  return result
}

const normalizeSlotDuration = (minutes: number): SlotDurationMinutes => {
  if (minutes <= 15) return 15
  if (minutes <= 30) return 30
  return 60
}

const inferSlotDuration = (start: Date, end: Date): SlotDurationMinutes => {
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000)
  return slotDurationOptions.some(option => option.value === durationMinutes)
    ? durationMinutes as SlotDurationMinutes
    : normalizeSlotDuration(durationMinutes)
}

const addOnTypeOptions = [
  { label: "Add-ons", value: "add-on-machine" as const },
  { label: "Add-on (Home Service)", value: "add-on-home-service" as const },
]

const normalizeAppointmentProviderType = (
  providerType?: AppointmentProviderType | null
): AppointmentProviderType => {
  if (providerType === "DOCTOR_CONSULTANT" || providerType === "PHYSICAL_THERAPIST") return providerType
  return "NONE"
}
const isClinicalProviderType = (providerType?: AppointmentProviderType | null): boolean =>
  normalizeAppointmentProviderType(providerType) !== "NONE"
const isDoctorConsultantProviderType = (providerType?: AppointmentProviderType | null): boolean =>
  normalizeAppointmentProviderType(providerType) === "DOCTOR_CONSULTANT"
const formatAppointmentProviderLabel = (staff: {
  name: string
  role_name?: string
  specialty_tag_name?: string
}): string =>
  [staff.name, staff.role_name, staff.specialty_tag_name].filter(Boolean).join(" · ")

const resolveCreateServiceType = (billingType: BillingType): NonNullable<Parameters<typeof appointmentPhase1Service.create>[0]["service_type"]> => {
  if (billingType === "SELF_PAY_PACKAGE") return "PACKAGE"
  if (billingType === "HMO_BILLING") return "HMO"
  if (billingType === "LGU_BILLING") return "LGU"
  return "SINGLE"
}

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback
  const status = error.response?.status
  const detail = error.response?.data?.message || error.response?.data?.detail || error.message
  return detail ? `${fallback}${status ? ` (${status})` : ""}: ${detail}` : fallback
}

const toOptionalStringId = (value: unknown): string | undefined => {
  const normalized = String(value ?? "").trim()
  return normalized || undefined
}

const normalizePositiveInt = (value: unknown, fallback = 1): number => {
  const normalized = Math.trunc(Number(value))
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback
}

const normalizeNonNegativeNumber = (value: unknown): number => {
  const normalized = Number(value)
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : 0
}

const parseMaybeJsonArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return []

  const trimmed = value.trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const normalizeStringIdArray = (value: unknown): string[] =>
  parseMaybeJsonArray(value)
    .map(entry => toOptionalStringId(entry))
    .filter((entry): entry is string => !!entry)

const normalizeQtyItems = (value: unknown): Array<{id: string; qty: number}> =>
  parseMaybeJsonArray(value).flatMap(entry => {
    if (!entry || typeof entry !== "object") return []
    const raw = entry as Record<string, unknown>
    const id = toOptionalStringId(raw.id ?? raw.session_id ?? raw.item_id ?? raw.service_id)
    if (!id) return []
    return [{
      id,
      qty: normalizePositiveInt(raw.qty ?? raw.quantity, 1)
    }]
  })

const normalizePackageStatus = (raw: Record<string, unknown>): string => {
  if (typeof raw.status === "string" && raw.status.trim()) {
    return raw.status.trim()
  }
  if (typeof raw.is_active === "boolean") {
    return raw.is_active ? "Active" : "Inactive"
  }
  if (typeof raw.is_active === "number") {
    return raw.is_active > 0 ? "Active" : "Inactive"
  }
  return "Active"
}

const normalizePackageServiceOffer = (value: unknown): PackageServiceOffer | null => {
  if (!value || typeof value !== "object") return null

  const raw = value as Record<string, unknown>
  const id = toOptionalStringId(raw.id)
  const name = typeof raw.name === "string" ? raw.name.trim() : ""

  if (!id || !name) return null

  return {
    id,
    name,
    bundleId: toOptionalStringId(raw.bundleId ?? raw.bundle_template_id),
    bundleQty: normalizePositiveInt(raw.bundleQty ?? raw.bundle_qty, 1),
    machineIds: normalizeStringIdArray(raw.machineIds ?? raw.machine_ids ?? raw.machine_ids_json),
    machineQty: normalizePositiveInt(raw.machineQty ?? raw.machine_qty, 1),
    machineItems: normalizeQtyItems(raw.machineItems ?? raw.machine_items ?? raw.machine_items_json),
    techniqueIds: normalizeStringIdArray(raw.techniqueIds ?? raw.technique_ids ?? raw.technique_ids_json),
    techniqueQty: normalizePositiveInt(raw.techniqueQty ?? raw.technique_qty, 1),
    techniqueItems: normalizeQtyItems(raw.techniqueItems ?? raw.technique_items ?? raw.technique_items_json),
    evaluationIds: normalizeStringIdArray(raw.evaluationIds ?? raw.evaluation_ids ?? raw.evaluation_ids_json),
    evaluationQty: normalizePositiveInt(raw.evaluationQty ?? raw.evaluation_qty, 1),
    evaluationItems: normalizeQtyItems(raw.evaluationItems ?? raw.evaluation_items ?? raw.evaluation_items_json),
    addOnIds: normalizeStringIdArray(raw.addOnIds ?? raw.add_on_ids ?? raw.add_on_ids_json),
    addOnQty: normalizePositiveInt(raw.addOnQty ?? raw.add_on_qty, 1),
    addOnItems: normalizeQtyItems(raw.addOnItems ?? raw.add_on_items ?? raw.add_on_items_json),
    sessionIds: normalizeStringIdArray(raw.sessionIds ?? raw.session_ids ?? raw.session_ids_json),
    sessionQty: normalizePositiveInt(raw.sessionQty ?? raw.session_qty, 1),
    sessionItems: normalizeQtyItems(raw.sessionItems ?? raw.session_items ?? raw.session_items_json),
    packagePrice: normalizeNonNegativeNumber(raw.packagePrice ?? raw.package_price),
    status: normalizePackageStatus(raw)
  }
}

function filterServicesByHmoIds<T extends { id: string; type: string }>(services: T[], allowed: Set<number> | null): T[] {
  if (createBillingType.value !== "HMO_BILLING" || allowed === null) return services
  return services.filter(s => allowed.has(Number(s.id)))
}

const createModalCardClass = "rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 shadow-sm"
const createModalSectionTitleClass = "text-base font-semibold text-[rgb(var(--app-fg))]"

const formatCreateLineType = (type: string): string => {
  switch (type) {
    case "machine":
      return "Machine"
    case "technique":
      return "Technique"
    case "evaluation":
      return "Evaluation"
    case "add-on-machine":
      return "Add-on"
    case "add-on-technique":
      return "Add-on"
    case "add-on-home-service":
      return "Home Service"
    case "bundle":
      return "Bundle"
    case "package":
      return "Package"
    default:
      return "Service"
  }
}

const createLineSeverity = (type: string): "info" | "success" | "warning" | "secondary" | "contrast" => {
  switch (type) {
    case "machine":
      return "info"
    case "technique":
      return "success"
    case "evaluation":
      return "warning"
    case "bundle":
      return "contrast"
    case "package":
      return "info"
    case "add-on-home-service":
      return "warning"
    default:
      return "secondary"
  }
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
  if (type === "add-on-machine") {
    return [
      ...filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "add-on-machine"), createHmoAddOnMachineIds.value),
      ...filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "add-on-technique"), createHmoAddOnTechniqueIds.value)
    ]
  }
  return filterServicesByHmoIds(
    allSinglePayServices.value.filter(s => s.type === "add-on-home-service"),
    createHmoAddOnHomeServiceIds.value
  )
})

const hasHomeServiceAddOn = computed(() =>
  selectedServiceLines.value.some(line => line.type === "add-on-home-service")
)

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

const resolveSessionServiceName = (sessionId?: string): string => {
  if (!sessionId) return "Recurring PT Session"
  const matched = sessionServices.value.find(service => String(service.id) === String(sessionId))
  return matched?.name || `Session ${sessionId}`
}

const expandQtyItems = (
  items: Array<{id: string; qty: number}> | undefined,
  ids: string[] | undefined,
  fallbackQty: number | undefined
): Array<{id?: string; qty: number}> =>
  items?.length
    ? items.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)}))
    : (ids ?? []).map(id => ({id, qty: Number(fallbackQty ?? 1)}))

const resolvePackageSessionFallbackCount = (pkg: PackageServiceOffer): number => {
  const quantityCandidates = [
    Number(pkg.bundleQty ?? 1),
    ...expandQtyItems(pkg.machineItems, pkg.machineIds, pkg.machineQty).map(item => Number(item.qty ?? 1)),
    ...expandQtyItems(pkg.techniqueItems, pkg.techniqueIds, pkg.techniqueQty).map(item => Number(item.qty ?? 1)),
    ...expandQtyItems(pkg.evaluationItems, pkg.evaluationIds, pkg.evaluationQty).map(item => Number(item.qty ?? 1)),
    ...expandQtyItems(pkg.addOnItems, pkg.addOnIds, pkg.addOnQty).map(item => Number(item.qty ?? 1)),
  ].filter(value => Number.isFinite(value) && value > 1)

  return quantityCandidates.length ? Math.max(...quantityCandidates) : 0
}

const getPackageSessionItems = (pkg: PackageServiceOffer): Array<{id?: string; qty: number}> =>
  (() => {
    const explicitSessionItems = expandQtyItems(pkg.sessionItems, pkg.sessionIds, pkg.sessionQty)
    if (explicitSessionItems.length) return explicitSessionItems

    const fallbackCount = resolvePackageSessionFallbackCount(pkg)
    return fallbackCount > 1 ? [{id: undefined, qty: fallbackCount}] : []
  })()

const buildPackageSessionTemplates = (pkg: PackageServiceOffer): PackageSessionTemplate[] => {
  const sessionItems = getPackageSessionItems(pkg)
  const templates: PackageSessionTemplate[] = []

  for (const item of sessionItems) {
    const totalOccurrences = Math.max(1, Number(item.qty ?? 1))
    for (let occurrence = 1; occurrence <= totalOccurrences; occurrence++) {
      templates.push({
        key: `${pkg.id}-${item.id ?? "session"}-${occurrence}`,
        sessionId: item.id,
        sessionName: item.id ? resolveSessionServiceName(item.id) : `${pkg.name} Session`,
        occurrence,
        totalOccurrences
      })
    }
  }

  return templates
}

const seedPackageSessionStart = (baseStart: Date, candidate: Date): Date => {
  const nextAllowed = findNextAllowedDate(new Date(candidate))
  nextAllowed.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0)
  return snapToSlotBoundary(nextAllowed)
}

const buildPackageSessionSchedules = (
  pkg: PackageServiceOffer,
  existingSchedules: PackageSessionSchedule[] = []
): PackageSessionSchedule[] => {
  const templates = buildPackageSessionTemplates(pkg)
  const baseStart = snapToSlotBoundary(new Date(createStart.value))
  let nextCandidate = new Date(baseStart)

  return templates.map((template, index) => {
    const existingSchedule = existingSchedules.find(schedule => schedule.key === template.key) ?? existingSchedules[index]
    const startsAt = existingSchedule?.startsAt instanceof Date && !Number.isNaN(existingSchedule.startsAt.getTime())
      ? snapToSlotBoundary(new Date(existingSchedule.startsAt))
      : seedPackageSessionStart(baseStart, nextCandidate)

    nextCandidate = new Date(startsAt)
    nextCandidate.setDate(nextCandidate.getDate() + 1)

    return {
      ...template,
      startsAt
    }
  })
}

const selectedPackageSessionExpectedCount = computed(() =>
  selectedPackageOfferDetail.value ? buildPackageSessionTemplates(selectedPackageOfferDetail.value).length : 0
)

const selectedPackageHasSessionSchedules = computed(() =>
  selectedPackageSessionExpectedCount.value > 0 || packageSessionSchedules.value.length > 0
)

const syncSelectedPackageSessionSchedules = (): void => {
  if (!selectedPackageOfferDetail.value) {
    packageSessionSchedules.value = []
    return
  }

  packageSessionSchedules.value = buildPackageSessionSchedules(
    selectedPackageOfferDetail.value,
    packageSessionSchedules.value
  )
}

const getPackageSessionEnd = (startsAt: Date): Date =>
  addMinutes(snapToSlotBoundary(new Date(startsAt)), createSlotDuration.value)

const hasOverlappingAppointmentSchedules = (
  schedules: Array<{startsAt: Date; endsAt: Date}>
): boolean => {
  const sortedSchedules = [...schedules]
    .map(schedule => ({
      startsAt: new Date(schedule.startsAt),
      endsAt: new Date(schedule.endsAt)
    }))
    .sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime())

  for (let index = 1; index < sortedSchedules.length; index++) {
    if (sortedSchedules[index].startsAt.getTime() < sortedSchedules[index - 1].endsAt.getTime()) {
      return true
    }
  }

  return false
}

const cascadePackageSessionStarts = (anchorIndex: number): void => {
  if (anchorIndex < 0 || anchorIndex >= packageSessionSchedules.value.length) return

  const nextSchedules = packageSessionSchedules.value.map(schedule => ({
    ...schedule,
    startsAt: new Date(schedule.startsAt)
  }))
  const anchorStart = snapToSlotBoundary(new Date(nextSchedules[anchorIndex].startsAt))
  nextSchedules[anchorIndex].startsAt = anchorStart

  let nextCandidate = new Date(anchorStart)
  nextCandidate.setDate(nextCandidate.getDate() + 1)

  for (let index = anchorIndex + 1; index < nextSchedules.length; index++) {
    const startsAt = seedPackageSessionStart(anchorStart, nextCandidate)
    nextSchedules[index].startsAt = startsAt
    nextCandidate = new Date(startsAt)
    nextCandidate.setDate(nextCandidate.getDate() + 1)
  }

  packageSessionSchedules.value = nextSchedules
}

const updatePackageSessionStart = (
  index: number,
  value: Date | Date[] | Array<Date | null> | null | undefined
): void => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return
  if (!packageSessionSchedules.value[index]) return

  const nextStart = snapToSlotBoundary(new Date(value))
  packageSessionSchedules.value[index].startsAt = nextStart

  if (index === 0) {
    createStart.value = nextStart
  }

  cascadePackageSessionStarts(index)
}

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
    {
      type: "add-on-machine",
      label: "Add-ons",
      services: [
        ...filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "add-on-machine"), createHmoAddOnMachineIds.value),
        ...filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "add-on-technique"), createHmoAddOnTechniqueIds.value)
      ]
    },
    { type: "add-on-home-service", label: "Add-on (Home Service)", services: filterServicesByHmoIds(allSinglePayServices.value.filter(s => s.type === "add-on-home-service"), createHmoAddOnHomeServiceIds.value) },
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
const selectedCheckoutSummary = computed(() => selectedDetail.value?.checkout_summary)
const patientWalletAmountToCollect = computed(() =>
  Number(selectedCheckoutSummary.value?.patient_wallet.amount_to_collect ?? 0)
)
const hasPatientWalletAmountToCollect = computed(() => patientWalletAmountToCollect.value > 0)
const sponsorWalletSummary = computed(() => selectedCheckoutSummary.value?.sponsor_wallet)
const selectedEncounterTicket = computed(() => selectedDetail.value?.encounter_ticket)
const selectedEncounterTicketHasPatientSignature = computed(() =>
  Boolean(selectedEncounterTicket.value?.patient_signature_data_url?.trim())
)
const selectedEncounterTicketHasPtSignature = computed(() =>
  Boolean(selectedEncounterTicket.value?.pt_signature_data_url?.trim())
)
const isSelectedEncounterTicketLocked = computed(() => Boolean(selectedEncounterTicket.value?.record_locked))
const encounterAttendanceLabel = computed(() =>
  selectedEncounterTicketHasPatientSignature.value
    ? "Patient Attendance Confirmed"
    : selectedEncounterTicketHasPtSignature.value
      ? "PT Attendance Confirmed"
      : "Attendance Pending"
)
const canProcessEncounterTicket = computed(() =>
  Boolean(selectedDetail.value?.billing_id || selectedEncounterTicket.value?.phase1_billing_id)
)
const selectedEncounterTicketPtConfirmedByLabel = computed(() =>
  selectedEncounterTicket.value?.pt_confirmed_by_name?.trim()
    || selectedDetail.value?.doctor_name?.trim()
    || "Assigned Physical Therapist"
)
const selectedEncounterTicketPtCompletionTag = computed(() =>
  selectedEncounterTicket.value?.pt_completion_tag?.trim() || ""
)
const selectedEncounterTicketSummaryLabel = computed(() => {
  if (selectedEncounterTicketHasPatientSignature.value && selectedEncounterTicket.value?.signed_off_at) {
    return `Patient signed on ${formatDateTime(selectedEncounterTicket.value.signed_off_at)}`
  }
  if (selectedEncounterTicketHasPtSignature.value && selectedEncounterTicket.value?.pt_confirmed_at) {
    return `PT signed on ${formatDateTime(selectedEncounterTicket.value.pt_confirmed_at)}`
  }
  return "Attendance and sign-off still need to be processed."
})
const formatEncounterTicketPackageSource = (value?: string): string => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "PATIENT_PACKAGE_SERVICE_PURCHASE") return "Linked from patient package service purchase"
  if (normalized === "PATIENT_PACKAGE_PURCHASE") return "Linked from patient package purchase"
  if (normalized === "PHASE1_BILLING_PACKAGE") return "Linked from the billing package record"
  if (normalized === "BILLING_LINE_ITEM_PACKAGE") return "Linked from the saved billing package line item"
  return value?.trim() || "Linked billing package"
}
const displayEncounterBillingRoute = (value?: string): string => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "SELF_PAY_SINGLE") return "Self Pay: Single Service"
  if (normalized === "SELF_PAY_PACKAGE") return "Self Pay: Package Service"
  if (normalized === "HMO_BILLING" || normalized === "HMO") return "HMO"
  if (normalized === "LGU_BILLING" || normalized === "LGU") return "LGU"
  return value?.trim() || "N/A"
}
const encounterTicketRecordLabel = computed(() =>
  selectedEncounterTicket.value ? `ET-${selectedEncounterTicket.value.id}` : "Will be generated on sign-off"
)
const selectedEncounterTicketPackageId = computed(() =>
  selectedEncounterTicket.value?.active_billing_package_id?.trim()
    || selectedEncounterTicket.value?.billing_snapshot?.active_billing_package_id?.trim()
    || ""
)
const selectedEncounterTicketPackageName = computed(() =>
  selectedEncounterTicket.value?.active_billing_package_name?.trim()
    || selectedEncounterTicket.value?.billing_snapshot?.active_billing_package_name?.trim()
    || ""
)
const selectedEncounterTicketPackageLabel = computed(() => {
  const packageName = selectedEncounterTicketPackageName.value
  const packageId = selectedEncounterTicketPackageId.value
  if (packageName && packageId && packageName !== packageId) return `${packageName} (${packageId})`
  if (packageName) return packageName
  if (packageId) return packageId
  return "No active billing package linked"
})
const selectedEncounterTicketPackageSourceLabel = computed(() => {
  const source = selectedEncounterTicket.value?.active_billing_package_source?.trim()
    || selectedEncounterTicket.value?.billing_snapshot?.active_billing_package_source?.trim()
    || ""
  if (!source) return undefined
  return selectedEncounterTicketPackageId.value
    ? `${formatEncounterTicketPackageSource(source)} · Linked ID ${selectedEncounterTicketPackageId.value}`
    : formatEncounterTicketPackageSource(source)
})
const encounterTicketButtonLabel = computed(() =>
  isSelectedEncounterTicketLocked.value
    ? "View Locked Encounter Ticket"
    : selectedEncounterTicket.value
      ? "Continue Encounter Ticket"
      : "Process Encounter Ticket"
)
const encounterServiceRenderedLabel = computed(() => {
  if (selectedDetail.value?.service_name?.trim()) return selectedDetail.value.service_name.trim()
  const phase = selectedDetail.value?.appointment_phase
  if (phase === "EVAL") return "Evaluation Session"
  if (phase === "RE_EVAL") return "Re-Evaluation Session"
  return "Therapy Session"
})
const encounterSessionDeductionLabel = computed(() => {
  const normalizedBillingType = String(selectedDetail.value?.billing_type ?? "")
    .trim()
    .toUpperCase()
    .replace(/:/g, "")
    .replace(/-/g, "_")
    .replace(/ /g, "_")

  if (normalizedBillingType === "HMO" || normalizedBillingType === "HMO_BILLING") {
    return `Deducting 1 Session from ${sponsorWalletSummary.value?.sponsor_name || "HMO"} Allocation`
  }
  if (normalizedBillingType === "LGU" || normalizedBillingType === "LGU_BILLING") {
    return `Deducting 1 Session from ${sponsorWalletSummary.value?.sponsor_name || "LGU"} Authorization`
  }
  if (normalizedBillingType === "SELF_PAY_PACKAGE") {
    return "Recording 1 Attended Package Session"
  }
  return "Attendance will be recorded. No session deduction applies."
})
const visiblePtDeckGroups = computed<DailyPtDeckGroup[]>(() => {
  const groups: DailyPtDeckGroup[] = []

  for (const group of dailyPtDeckGroups.value) {
    const appointments = phaseFilter.value
      ? group.appointments.filter(appointment => appointment.phase === phaseFilter.value || appointment.appointment_phase === phaseFilter.value)
      : [...group.appointments]
    if (!appointments.length) continue

    const earliestAppointment = [...appointments].sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime())[0]
    groups.push({
      ...group,
      appointments,
      appointment_count: appointments.length,
      pending_count: appointments.filter(appointment => normalizeAppointmentStatus(appointment.status) === "PENDING").length,
      completed_count: appointments.filter(appointment => normalizeAppointmentStatus(appointment.status) === "COMPLETED").length,
      needs_billing_count: appointments.filter(appointment => needsBillingAttention(appointment.billing_status)).length,
      earliest_starts_at: earliestAppointment?.start
    })
  }

  return groups
})
const dayBookings = computed<AppointmentListItem[]>(() =>
  visiblePtDeckGroups.value.flatMap(group => group.appointments)
)
const rescheduledAppointmentsCount = computed(() => dayBookings.value.filter(item => Number(item.reschedule_count ?? 0) > 0).length)
const billingAttentionCount = computed(() =>
  dayBookings.value.filter(item => {
    return needsBillingAttention(item.billing_status)
  }).length
)
const selectedClinic = computed(() => clinicOptions.value.find(clinic => clinic.id === selectedClinicId.value))
const selectedCreateProvider = computed(() =>
  doctorOptions.value.find(option => option.id === createDoctor.value)
)
const selectedCreateProviderHasSpecialty = computed(() =>
  Boolean(selectedCreateProvider.value?.specialty_tag_id)
)
const selectedCreateProviderRequiresSpecialty = computed(() =>
  Boolean(selectedCreateProvider.value?.requires_specialty_tag)
)
const isCreateSpecialtyLockedByProvider = computed(() =>
  Boolean(selectedCreateProvider.value?.requires_specialty_tag && selectedCreateProvider.value?.specialty_tag_id)
)
const selectedCreateProviderSpecialtyLabel = computed(() =>
  selectedCreateProvider.value?.specialty_tag_name || ""
)
const selectedTreatmentAreaOption = computed(() =>
  treatmentAreaOptions.value.find(option => option.id === createTreatmentArea.value)
)
const ptFilterOptions = computed(() =>
  [
    {label: "Unassigned", value: "UNASSIGNED" as const},
    ...doctorOptions.value
      .filter(option => isDoctorConsultantProviderType(option.appointment_provider_type))
      .map(option => ({label: option.label, value: option.id}))
  ]
)
const selectedDoctorConsultantId = computed(() =>
  typeof ptFilter.value === "number" ? ptFilter.value : undefined
)
const isUnassignedDoctorConsultantFilter = computed(() => ptFilter.value === "UNASSIGNED")
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
const normalizeAppointmentStatus = (status?: string): string =>
  (status || "PENDING").trim().toUpperCase().split(" ").join("_")
const appointmentSeverity = (status?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = normalizeAppointmentStatus(status)
  if (normalized === "COMPLETED") return "success"
  if (normalized === "RESCHEDULED") return "warn"
  if (normalized === "CANCELLED" || normalized === "NO_SHOW") return "danger"
  return "info"
}
const appointmentPhaseSeverity = (phase?: AppointmentPhase): "info" | "contrast" | "warn" => {
  if (phase === "EVAL") return "info"
  if (phase === "RE_EVAL") return "warn"
  return "contrast"
}
const appointmentLocationContextSeverity = (locationContext?: AppointmentLocationContext): "success" | "warn" => {
  if (locationContext === "HOME_CARE") return "warn"
  return "success"
}
const displayAppointmentPhase = (phase?: AppointmentPhase): string => {
  if (phase === "RE_EVAL") return "RE-EVAL"
  return phase ?? "SESSION"
}
const displayLocationContext = (locationContext?: AppointmentLocationContext): string => {
  if (locationContext === "HOME_CARE") return "HOME CARE"
  return "IN-CLINIC"
}
const displayAppointmentStatus = (status?: string): string => normalizeAppointmentStatus(status).split("_").join(" ")
const displayBillingStatus = (status?: string): string => (status?.trim() || "UNBILLED").toUpperCase()
const normalizeBillingTypeForCalendar = (value?: string): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/:/g, "")
    .replace(/-/g, "_")
    .replace(/ /g, "_")
const normalizeServiceTypeForCalendar = (value?: string): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/:/g, "")
    .replace(/-/g, "_")
    .replace(/ /g, "_")
const isFullyBilledStatus = (status?: string): boolean => {
  const normalized = displayBillingStatus(status)
  return normalized === "PAID" || normalized === "BILLED"
}
const isPartiallyPaidStatus = (status?: string): boolean => displayBillingStatus(status) === "PARTIAL"
const isUnbilledStatus = (status?: string): boolean => {
  const normalized = displayBillingStatus(status)
  return normalized === "UNBILLED" || normalized === "PENDING"
}
const needsBillingAttention = (status?: string): boolean => {
  const normalized = displayBillingStatus(status)
  return normalized !== "PAID" && normalized !== "BILLED"
}
const isFinishedAppointmentStatus = (status?: string): boolean => {
  const normalized = normalizeAppointmentStatus(status)
  return normalized === "COMPLETED" || normalized === "CANCELLED" || normalized === "NO_SHOW"
}
const isMultiSessionAppointment = (appointment: AppointmentListItem): boolean => {
  const normalizedBillingType = normalizeBillingTypeForCalendar(appointment.billing_type)
  const normalizedServiceType = normalizeServiceTypeForCalendar(appointment.service_type)

  return normalizedServiceType === "PACKAGE"
    || normalizedBillingType === "SELF_PAY_PACKAGE"
    || normalizedBillingType === "PACKAGE_BILLING"
}

const formatDateTime = (value: string | Date): string => new Date(value).toLocaleString()
const toDateKey = (year: number, month: number, day: number): string => {
  const mm = String(month + 1).padStart(2, "0")
  const dd = String(day).padStart(2, "0")
  return `${year}-${mm}-${dd}`
}
const getBookedMonthCacheKey = (year: number, month: number, clinicId?: number): string => {
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`
  return `${monthKey}::clinic:${clinicId ?? "all"}`
}

const fetchLookup = async (path: string): Promise<BillingPickerLookup[]> => {
  const {data} = await pamsAPI.get<Pageable<OfferLookupDTO>>(path, {params: {page: 1, size: 500, status: Status.ACTIVE}})
  return (data?.content ?? []).map(item => ({id: item.id, name: item.name, price: Number(item.price)}))
}

const loadTreatmentAreaOptions = async (): Promise<void> => {
  if (!selectedClinicId.value) {
    treatmentAreaOptions.value = []
    createTreatmentArea.value = undefined
    return
  }

  const treatmentAreas = await treatmentAreaReferenceService.getAll({
    page: defaultPage,
    size: 100,
    status: Status.ACTIVE,
    name: undefined,
    clinic_id: selectedClinicId.value
  })
  treatmentAreaOptions.value = treatmentAreas?.content ?? []
  if (createTreatmentArea.value && !treatmentAreaOptions.value.some(option => option.id === createTreatmentArea.value)) {
    createTreatmentArea.value = undefined
  }
}

const loadSinglePayServices = async (): Promise<void> => {
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
    const parsed = stored ? JSON.parse(stored) : []
    allPackageServiceOffers.value = Array.isArray(parsed)
      ? parsed
          .map(normalizePackageServiceOffer)
          .filter((item): item is PackageServiceOffer => item !== null)
      : []
  } catch {
    allPackageServiceOffers.value = []
  }
}

const removeHomeServiceAddOn = (): void => {
  selectedServiceLines.value = selectedServiceLines.value.filter(line => line.type !== "add-on-home-service")
  if (isCreateLocationContextAuto.value && createLocationContext.value === "HOME_CARE") {
    createLocationContext.value = "IN_CLINIC"
    isCreateLocationContextAuto.value = false
  }
}

const setHomeServiceAddOn = (serviceId?: string): void => {
  if (!serviceId) {
    removeHomeServiceAddOn()
    return
  }

  const service = allSinglePayServices.value.find(item => item.id === serviceId && item.type === "add-on-home-service")

  if (!service) return

  const nextLine = {
    type: service.type,
    id: service.id,
    name: service.name,
    price: service.price
  }

  if (createLocationContext.value !== "HOME_CARE") {
    createLocationContext.value = "HOME_CARE"
    isCreateLocationContextAuto.value = true
  }
  createTreatmentArea.value = undefined

  const existingIndex = selectedServiceLines.value.findIndex(line => line.type === "add-on-home-service")
  if (existingIndex >= 0) {
    selectedServiceLines.value.splice(existingIndex, 1, nextLine)
    return
  }

  selectedServiceLines.value.push(nextLine)
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

  selectedServiceLines.value = selectedServiceLines.value.filter(line => line.type !== "package")
  selectedServiceLines.value.push({
    type: "package",
    id: pkg.id,
    name: pkg.name,
    price: Number(pkg.packagePrice ?? 0),
    originalPrice: calculatePackageOfferRegularTotal(pkg)
  })
  selectedPackageOfferDetail.value = pkg
  packageSessionSchedules.value = buildPackageSessionSchedules(pkg, packageSessionSchedules.value)
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

  if (service.type === "add-on-home-service") {
    setHomeServiceAddOn(service.id)
    selectedAddOnId.value = undefined
    return
  }

  const resolvedLineType = service.type

  // Check if service already in selected lines
  const exists = selectedServiceLines.value.find(line => line.id === serviceId && line.type === resolvedLineType)
  if (!exists) {
    selectedServiceLines.value.push({
      type: resolvedLineType,
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
  const [removedLine] = selectedServiceLines.value.splice(index, 1)
  if (removedLine?.type === "package") {
    selectedPackageOfferDetail.value = null
    packageSessionSchedules.value = []
  }
}

type CalendarSlotDate = {
  year: number
  month: number
  day: number
  today?: boolean
  selectable?: boolean
}

const calendarDayStatusStyles: Record<CalendarDayStatus, {cell: string; dot: string}> = {
  unfinished_unbilled: {
    cell: "bg-red-100 text-red-700 ring-1 ring-red-300 dark:bg-red-500/20 dark:text-red-100 dark:ring-red-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-300"
  },
  scheduled_partially_paid: {
    cell: "bg-blue-100 text-blue-800 ring-1 ring-blue-300 dark:bg-blue-500/20 dark:text-blue-100 dark:ring-blue-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-300"
  },
  unfinished_billed: {
    cell: "bg-orange-100 text-orange-800 ring-1 ring-orange-300 dark:bg-orange-500/20 dark:text-orange-100 dark:ring-orange-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-300"
  },
  multi_session_billed: {
    cell: "bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-300"
  },
  finished_billed: {
    cell: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/40",
    dot: "absolute bottom-[3px] h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300"
  }
}

const formatCalendarDateKey = (year: number, monthOneBased: number, day: number): string =>
  `${year}-${String(monthOneBased).padStart(2, "0")}-${String(day).padStart(2, "0")}`

const getBookedDateCandidateKeys = (date: CalendarSlotDate): string[] => {
  const candidateKeys = new Set<string>()
  const year = Number(date.year)
  const month = Number(date.month)
  const day = Number(date.day)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return []
  }

  // PrimeVue month in slot date can vary by version (0-based vs 1-based), so keep both interpretations.
  if (month >= 0 && month <= 11) {
    candidateKeys.add(toDateKey(year, month, day))
    candidateKeys.add(formatCalendarDateKey(year, month + 1, day))
  }

  if (month >= 1 && month <= 12) {
    candidateKeys.add(formatCalendarDateKey(year, month, day))
  }

  const isVisibleMonth =
    (month >= 0 && month <= 11 && month === visibleMonth.value)
    || (month >= 1 && month <= 12 && (month - 1) === visibleMonth.value)

  // When the slot belongs to the visible month, fall back to the rendered month as a final match key.
  if (isVisibleMonth) {
    candidateKeys.add(toDateKey(visibleYear.value, visibleMonth.value, day))
  }

  return [...candidateKeys]
}

const hasBookedDate = (date: CalendarSlotDate): boolean => {
  return getBookedDateCandidateKeys(date).some(candidateKey => calendarDayStatusMap.value.has(candidateKey))
}

const getCalendarDayStatus = (date: CalendarSlotDate): CalendarDayStatus | null => {
  const candidateKey = getBookedDateCandidateKeys(date)
    .find(key => calendarDayStatusMap.value.has(key))

  return candidateKey ? calendarDayStatusMap.value.get(candidateKey) ?? null : null
}

const calendarDayCellClass = (date: CalendarSlotDate): string[] => {
  const dayStatus = getCalendarDayStatus(date)
  return [
    "relative flex h-full min-h-8 w-full items-center justify-center rounded-xl px-1 text-sm font-medium transition-colors",
    dayStatus ? calendarDayStatusStyles[dayStatus].cell : "",
    date.today ? "ring-2 ring-slate-400/70 dark:ring-slate-300/60" : "",
    date.selectable === false ? "opacity-40" : ""
  ]
}

const calendarDayDotClass = (date: CalendarSlotDate): string => {
  const dayStatus = getCalendarDayStatus(date)
  return dayStatus ? calendarDayStatusStyles[dayStatus].dot : ""
}

const classifyCalendarDayStatus = (rows: AppointmentListItem[]): CalendarDayStatus | null => {
  if (!rows.length) return null

  if (rows.some(row => !isFinishedAppointmentStatus(row.appointment_status) && isUnbilledStatus(row.billing_status))) {
    return "unfinished_unbilled"
  }

  if (rows.some(row => isPartiallyPaidStatus(row.billing_status))) {
    return "scheduled_partially_paid"
  }

  if (rows.some(row => isMultiSessionAppointment(row) && isFullyBilledStatus(row.billing_status))) {
    return "multi_session_billed"
  }

  if (rows.some(row => !isFinishedAppointmentStatus(row.appointment_status) && isFullyBilledStatus(row.billing_status))) {
    return "unfinished_billed"
  }

  if (rows.every(row => isFinishedAppointmentStatus(row.appointment_status) && isFullyBilledStatus(row.billing_status))) {
    return "finished_billed"
  }

  if (rows.some(row => needsBillingAttention(row.billing_status))) {
    return "unfinished_unbilled"
  }

  return "finished_billed"
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

const isSlotBoundaryAligned = (date: Date): boolean => {
  return date.getMinutes() % slotMinuteStep === 0 && date.getSeconds() === 0
}

const hasAllowedSlotDuration = (start: Date, end: Date): boolean => {
  const durationMinutes = (end.getTime() - start.getTime()) / 60000
  return Number.isInteger(durationMinutes) && slotDurationOptions.some(option => option.value === durationMinutes)
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

  if (!isSlotBoundaryAligned(start) || !isSlotBoundaryAligned(end)) {
    errorToast(toast, "Time must be in 15-minute increments")
    return false
  }

  if (!hasAllowedSlotDuration(start, end)) {
    errorToast(toast, "Appointment length must be 15, 30, or 60 minutes")
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

const alignToClinicStart = (date: Date): Date => {
  const result = new Date(date)
  result.setSeconds(0, 0)
  const clinicStart = getClinicStartMinutes()
  if (clinicStart != null) {
    result.setHours(Math.floor(clinicStart / 60), clinicStart % 60, 0, 0)
  } else {
    return snapToSlotBoundary(result)
  }
  return snapToSlotBoundary(result)
}

const fetchBookedDatesForMonth = async (year: number, month: number): Promise<void> => {
  const clinicId = selectedClinicId.value
  if (!clinicId) {
    calendarDayStatusMap.value = new Map()
    return
  }

  const monthKey = getBookedMonthCacheKey(year, month, clinicId)
  const cached = bookedMonthCache.value.get(monthKey)
  if (cached) {
    calendarDayStatusMap.value = new Map(cached)
    return
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthStatuses = new Map<string, CalendarDayStatus>()

  // Use sequential requests to avoid overloading API and missing dots from transient failures.
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = toDateKey(year, month, day)
    let dayStatus: CalendarDayStatus | null = null
    try {
      const rows = await appointmentPhase1Service.getDay(dateKey, {clinic_id: clinicId})
      dayStatus = classifyCalendarDayStatus(rows ?? [])
    } catch {
      try {
        const retryRows = await appointmentPhase1Service.getDay(dateKey, {clinic_id: clinicId})
        dayStatus = classifyCalendarDayStatus(retryRows ?? [])
      } catch {
        dayStatus = null
      }
    }
    if (dayStatus) monthStatuses.set(dateKey, dayStatus)
  }

  bookedMonthCache.value.set(monthKey, monthStatuses)
  calendarDayStatusMap.value = new Map(monthStatuses)
}

const refreshBookedDotsForVisibleMonth = async (): Promise<void> => {
  const monthKey = getBookedMonthCacheKey(visibleYear.value, visibleMonth.value, selectedClinicId.value)
  bookedMonthCache.value.delete(monthKey)
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
}

const onCalendarMonthChange = async (event: {month: number; year: number}): Promise<void> => {
  visibleMonth.value = Math.max(0, Math.min(11, Number(event.month) - 1))
  visibleYear.value = event.year
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
}

const fetchAppointments = async (): Promise<void> => {
  try {
    isLoading.value = true
    const normalizedRecordFilter = recordFilter.value.trim()
    const isRecordSearchActive = !!normalizedRecordFilter
    const response = await appointmentPhase1Service.getAll({
      page: page.value,
      size: pageSize.value,
      clinic_id: isRecordSearchActive ? undefined : selectedClinicId.value,
      doctor_id: isRecordSearchActive ? undefined : selectedDoctorConsultantId.value,
      unassigned: isRecordSearchActive ? undefined : (isUnassignedDoctorConsultantFilter.value || undefined),
      search: normalizedRecordFilter || undefined,
      status: isRecordSearchActive ? undefined : (statusFilter.value?.trim() || undefined),
      phase: isRecordSearchActive ? undefined : phaseFilter.value,
      date: isRecordSearchActive ? undefined : selectedDateIso.value
    })
    appointments.value = response?.content ?? []
    totalElements.value = response?.total_elements ?? 0
  } catch (error: unknown) {
    errorToast(toast, "Failed to load appointments")
  } finally {
    isLoading.value = false
  }
}

const fetchDailyPtDeck = async (): Promise<void> => {
  if (!selectedClinicId.value) {
    dailyPtDeckGroups.value = []
    return
  }

  try {
    isPtDeckLoading.value = true
    dailyPtDeckGroups.value = await appointmentPhase1Service.getDailyPtDeck(selectedDateIso.value, selectedClinicId.value) ?? []
  } catch (error: unknown) {
    dailyPtDeckGroups.value = []
  } finally {
    isPtDeckLoading.value = false
  }
}

const refreshAll = async (): Promise<void> => {
  await fetchAppointments()
  await fetchDailyPtDeck()
  if (selectedDetail.value) {
    const isStillVisible = appointments.value.some(appointment => appointment.id === selectedDetail.value?.id)
      || dayBookings.value.some(appointment => appointment.id === selectedDetail.value?.id)
    if (!isStillVisible) {
      closeDetailPanel()
    }
  }
}

const loadCreateLookups = async (): Promise<void> => {
  const [patientsPage, doctorsPage, clinics, specialtyTags, sessionLookupPage] = await Promise.all([
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
    specialtyTagReferenceService.getAll({
      page: defaultPage,
      size: 100,
      status: Status.ACTIVE,
      name: undefined
    }),
    pamsAPI.get<Pageable<BillingPickerLookup>>("/sessions/lookup", {
      params: {page: 1, size: 500, status: Status.ACTIVE}
    })
  ])

  patientOptions.value = (patientsPage?.content ?? []).map((patient: Patient) => ({
    id: patient.id,
    name: [patient.first_name, patient.middle_name, patient.last_name]
      .filter((part): part is string => !!part && part.toLowerCase() !== "null")
      .join(" "),
    label: [patient.first_name, patient.middle_name, patient.last_name]
      .filter((part): part is string => !!part && part.toLowerCase() !== "null")
      .join(" "),
    clinic_id: patient.clinic_id
  }))
  doctorOptions.value = (doctorsPage?.content ?? []).map((doctor: Staff) => ({
    id: doctor.id,
    name: doctor.name,
    label: formatAppointmentProviderLabel(doctor),
    clinic_id: doctor.clinic_id,
    role_name: doctor.role_name,
    appointment_provider_type: normalizeAppointmentProviderType(doctor.appointment_provider_type),
    requires_specialty_tag: doctor.requires_specialty_tag,
    specialty_tag_id: doctor.specialty_tag_id,
    specialty_tag_name: doctor.specialty_tag_name
  }))
    .filter((doctor) => isClinicalProviderType(doctor.appointment_provider_type))
  clinicOptions.value = clinics?.content ?? []
  specialtyTagOptions.value = specialtyTags?.content ?? []
  sessionServices.value = sessionLookupPage.data?.content ?? []
  if (!selectedClinicId.value && clinicOptions.value.length) {
    selectedClinicId.value = clinicOptions.value[0].id
  }
  await loadTreatmentAreaOptions()

  await loadSinglePayServices()
}

const openCreateDialog = async (): Promise<void> => {
  if (
    !patientOptions.value.length ||
    !doctorOptions.value.length ||
    !clinicOptions.value.length ||
    !specialtyTagOptions.value.length
  ) {
    await loadCreateLookups()
  }
  createPatient.value = undefined
  createDoctor.value = undefined
  createPhase.value = "SESSION"
  createLocationContext.value = "IN_CLINIC"
  isCreateLocationContextAuto.value = false
  createSpecialtyTag.value = undefined
  createTreatmentArea.value = undefined
  createBillingType.value = "SELF_PAY_SINGLE"
  createBillingNotes.value = ""
  selectedMachineId.value = undefined
  selectedTechniqueId.value = undefined
  selectedEvaluationId.value = undefined
  selectedAddOnType.value = "add-on-machine"
  selectedAddOnId.value = undefined
  selectedBundleId.value = undefined
  selectedPackageOfferId.value = undefined
  selectedPackageOfferDetail.value = null
  packageSessionSchedules.value = []
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
  await loadSinglePayServices()
  const base = alignToClinicStart(findNextAllowedDate(new Date(calendarDate.value)))
  createSlotDuration.value = 60
  createStart.value = base
  createEnd.value = addMinutes(base, createSlotDuration.value)
  createVisible.value = true
}

const submitCreateAppointment = async (): Promise<void> => {
  if (!createPatient.value) {
    errorToast(toast, "Patient is required")
    return
  }
  if (!selectedClinicId.value) {
    errorToast(toast, "Clinic schedule is required")
    return
  }
  if (selectedServiceLines.value.length === 0) {
    errorToast(toast, "At least one service is required")
    return
  }
  if (createLocationContext.value === "HOME_CARE" && !hasHomeServiceAddOn.value) {
    errorToast(toast, "Home Care appointments require a Home Service add-on from Promos and Offers")
    return
  }
  if (selectedCreateProviderRequiresSpecialty.value && !createSpecialtyTag.value) {
    errorToast(toast, "The selected provider role requires a specialty for this appointment")
    return
  }

  const appointmentSchedules = selectedPackageHasSessionSchedules.value
    ? packageSessionSchedules.value.map(schedule => ({
        startsAt: snapToSlotBoundary(new Date(schedule.startsAt)),
        endsAt: getPackageSessionEnd(schedule.startsAt),
        label: `${schedule.sessionName} ${schedule.occurrence}/${schedule.totalOccurrences}`
      }))
    : [{
        startsAt: createStart.value,
        endsAt: createEnd.value,
        label: undefined
      }]

  if (!appointmentSchedules.length) {
    errorToast(toast, "At least one schedule is required")
    return
  }

  if (hasOverlappingAppointmentSchedules(appointmentSchedules)) {
    errorToast(
      toast,
      createDoctor.value
        ? "The selected PT cannot have overlapping appointment schedules."
        : "Session schedules cannot overlap."
    )
    return
  }

  for (const schedule of appointmentSchedules) {
    if (!validateClinicSchedule(schedule.startsAt, schedule.endsAt)) return
  }

  const primarySchedule = appointmentSchedules[0]

  const appointmentPayload: Parameters<typeof appointmentPhase1Service.create>[0] = {
    patient_id: createPatient.value,
    clinic_id: selectedClinicId.value,
    location_context: createLocationContext.value,
    specialty_tag_id: createSpecialtyTag.value,
    treatment_area_id: createTreatmentArea.value,
    doctor_id: createDoctor.value,
    starts_at: primarySchedule.startsAt.toISOString(),
    ends_at: primarySchedule.endsAt.toISOString(),
    session_schedules: selectedPackageHasSessionSchedules.value
      ? appointmentSchedules.map(schedule => ({
          starts_at: schedule.startsAt.toISOString(),
          ends_at: schedule.endsAt.toISOString(),
          label: schedule.label
        }))
      : undefined,
    appointment_phase: createPhase.value,
    amount_due: subtotalFromServiceLines.value,
    service_name: `${createBillingType.value.replace("_", " ")} - ${selectedServiceLines.value.length} items`,
    billing_type: createBillingType.value,
    service_type: resolveCreateServiceType(createBillingType.value),
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
    const created = await appointmentPhase1Service.create(appointmentPayload)
    const createdCount = created?.appointment_ids?.length ?? appointmentSchedules.length
    successToast(
      toast,
      createdCount > 1
        ? `Package scheduled across ${createdCount} appointments with one billing`
        : "Appointment created with services"
    )
    createVisible.value = false
    await refreshAll()
    await refreshBookedDotsForVisibleMonth()
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        errorToast(toast, "Session expired (401). Please log in again.")
        return
      }
      if (error.response?.status === 403) {
        errorToast(toast, "Permission denied (403): cannot create appointment.")
        return
      }
      errorToast(toast, extractApiErrorMessage(error, "Create failed"))
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

const seedEncounterTicketForm = (ticket?: AppointmentEncounterTicket): void => {
  encounterTicketAttendedAt.value = ticket?.attended_at ? new Date(ticket.attended_at) : new Date()
  encounterTicketSignatureDataUrl.value = ticket?.patient_signature_data_url ?? ""
}

const openEncounterTicketDialog = (): void => {
  if (!selectedDetail.value) return
  if (!canProcessEncounterTicket.value) {
    errorToast(toast, "A billing record is required before generating a locked encounter ticket")
    return
  }
  seedEncounterTicketForm(selectedEncounterTicket.value)
  encounterTicketVisible.value = true
}

const exportSelectedEncounterTicketPdf = (): void => {
  if (!selectedDetail.value || !selectedEncounterTicket.value || !isSelectedEncounterTicketLocked.value) {
    errorToast(toast, "No locked encounter ticket is available to export")
    return
  }

  const snapshot = selectedEncounterTicket.value.billing_snapshot
  const slipNumber = selectedEncounterTicket.value.slip_number || `ETS-${selectedEncounterTicket.value.id}`
  const popup = openEncounterTicketPdfWindow(slipNumber)

  try {
    renderEncounterTicketPdfWindow(popup, [{
      slipNumber,
      patientName: snapshot?.patient_name || selectedDetail.value.patient_name || "Patient",
      providerName: snapshot?.provider_name || selectedDetail.value.doctor_name || "Unassigned",
      serviceName: snapshot?.service_name || encounterServiceRenderedLabel.value,
      specialtyName: snapshot?.specialty_tag_name || selectedDetail.value.specialty_tag_name,
      specialtyIsActive: snapshot?.specialty_tag_is_active ?? selectedDetail.value.specialty_tag_is_active,
      treatmentAreaName: snapshot?.treatment_area_name || selectedDetail.value.treatment_area_name,
      treatmentAreaColor: snapshot?.treatment_area_color || selectedDetail.value.treatment_area_color,
      treatmentAreaIsActive: snapshot?.treatment_area_is_active ?? selectedDetail.value.treatment_area_is_active,
      billingRoute: displayEncounterBillingRoute(snapshot?.billing_type || selectedDetail.value.billing_type),
      attendanceStatus: selectedEncounterTicket.value.attendance_status === "ATTENDED" ? "Attended" : "No Show",
      attendedAt: selectedEncounterTicket.value.attended_at,
      signedOffAt: selectedEncounterTicket.value.signed_off_at,
      lockedAt: selectedEncounterTicket.value.locked_at,
      encounterTicketId: selectedEncounterTicket.value.id,
      appointmentId: snapshot?.appointment_public_id || selectedDetail.value.public_id || snapshot?.appointment_id || selectedDetail.value.id,
      billingId: selectedEncounterTicket.value.phase1_billing_public_id || selectedDetail.value.billing_public_id || selectedEncounterTicket.value.phase1_billing_id || selectedDetail.value.billing_id,
      activeBillingPackageLabel: selectedEncounterTicketPackageLabel.value,
      activeBillingPackageSource: selectedEncounterTicketPackageSourceLabel.value,
      deductionSummary: encounterSessionDeductionLabel.value,
      signatureDataUrl: selectedEncounterTicket.value.patient_signature_data_url
    }], {
      title: "Encounter Ticket PDF",
      subtitle: "Single locked encounter ticket export",
      fileName: slipNumber
    })
  } catch (error: unknown) {
    popup.close()
    errorToast(toast, extractApiErrorMessage(error, "Failed to export encounter ticket PDF"))
  }
}

const closeDetailPanel = (): void => {
  encounterTicketVisible.value = false
  detailPanelVisible.value = false
  selectedDetail.value = undefined
}

const selectAppointment = async (appointment: AppointmentListItem): Promise<void> => {
  try {
    selectedDetail.value = await appointmentPhase1Service.getById(appointment.id)
    detailPanelVisible.value = true
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to load appointment detail"))
  }
}

const onSelectRow = async (event: {data: AppointmentListItem}): Promise<void> => {
  await selectAppointment(event.data)
}

const submitEncounterTicket = async (): Promise<void> => {
  if (!selectedDetail.value) return
  if (isSelectedEncounterTicketLocked.value) {
    errorToast(toast, "This signed encounter ticket is already locked")
    return
  }
  const appointmentId = selectedDetail.value.id
  if (!encounterTicketSignatureDataUrl.value.trim()) {
    errorToast(toast, "Patient signature is required before saving the encounter ticket")
    return
  }

  const payload: AppointmentEncounterTicketPayload = {
    attended_at: encounterTicketAttendedAt.value.toISOString(),
    patient_signature_data_url: encounterTicketSignatureDataUrl.value
  }

  try {
    isEncounterTicketSaving.value = true
    await appointmentPhase1Service.processEncounterTicket(appointmentId, payload)
    successToast(toast, "Digital sign-off slip saved and attendance marked complete")
    encounterTicketVisible.value = false
    await refreshAll()
    selectedDetail.value = await appointmentPhase1Service.getById(appointmentId)
    detailPanelVisible.value = true
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to process encounter ticket"))
  } finally {
    isEncounterTicketSaving.value = false
  }
}

const openReschedule = (appointment: AppointmentListItem): void => {
  activeAppointment.value = appointment
  const start = snapToSlotBoundary(new Date(appointment.starts_at))
  const end = new Date(appointment.ends_at)
  rescheduleSlotDuration.value = inferSlotDuration(start, end)
  rescheduleStart.value = start
  rescheduleEnd.value = addMinutes(start, rescheduleSlotDuration.value)
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
    errorToast(toast, extractApiErrorMessage(error, "Reschedule failed"))
  }
}

const onExportCsv = async (): Promise<void> => {
  const normalizedRecordFilter = recordFilter.value.trim()
  const isRecordSearchActive = !!normalizedRecordFilter
  const response = await appointmentPhase1Service.exportCsv({
    clinic_id: isRecordSearchActive ? undefined : selectedClinicId.value,
    doctor_id: isRecordSearchActive ? undefined : selectedDoctorConsultantId.value,
    unassigned: isRecordSearchActive ? undefined : (isUnassignedDoctorConsultantFilter.value || undefined),
    search: normalizedRecordFilter || undefined,
    status: isRecordSearchActive ? undefined : (statusFilter.value?.trim() || undefined),
    phase: isRecordSearchActive ? undefined : phaseFilter.value,
    date: isRecordSearchActive ? undefined : selectedDateIso.value
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
          closeDetailPanel()
        }
        await refreshAll()
        await refreshBookedDotsForVisibleMonth()
      } catch (error: unknown) {
        errorToast(toast, extractApiErrorMessage(error, "Delete appointment failed"))
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

const goToBillingForAppointment = async (appointment: AppointmentListItem): Promise<void> => {
  await router.push({
    path: "/billing",
    query: {
      patientId: String(appointment.patient_id),
      appointmentId: String(appointment.id),
      ...(appointment.billing_id ? {billingId: String(appointment.billing_id)} : {})
    }
  })
}

watch(createStart, (value) => {
  const normalized = snapToSlotBoundary(new Date(value))
  if (normalized.getTime() !== value.getTime()) {
    createStart.value = normalized
    return
  }
  createEnd.value = addMinutes(normalized, createSlotDuration.value)
  if (selectedPackageOfferDetail.value && packageSessionSchedules.value.length === 0 && selectedPackageSessionExpectedCount.value > 0) {
    syncSelectedPackageSessionSchedules()
  }
})

watch(createSlotDuration, (duration) => {
  createEnd.value = addMinutes(snapToSlotBoundary(new Date(createStart.value)), duration)
})

watch(rescheduleStart, (value) => {
  const normalized = snapToSlotBoundary(new Date(value))
  if (normalized.getTime() !== value.getTime()) {
    rescheduleStart.value = normalized
    return
  }
  rescheduleEnd.value = addMinutes(normalized, rescheduleSlotDuration.value)
})

watch(rescheduleSlotDuration, (duration) => {
  rescheduleEnd.value = addMinutes(snapToSlotBoundary(new Date(rescheduleStart.value)), duration)
})

watch([calendarDate, statusFilter, phaseFilter], async () => {
  page.value = 1
  await refreshAll()
})

watch(ptFilter, async () => {
  page.value = 1
  await fetchAppointments()
})

let recordFilterDebounceHandle: ReturnType<typeof setTimeout> | undefined
watch(recordFilter, () => {
  page.value = 1
  if (recordFilterDebounceHandle) {
    clearTimeout(recordFilterDebounceHandle)
  }
  recordFilterDebounceHandle = setTimeout(() => {
    void fetchAppointments()
  }, 250)
})

watch(selectedClinicId, async () => {
  await loadTreatmentAreaOptions()
  const normalizedDate = findNextAllowedDate(new Date(calendarDate.value))
  if (normalizedDate.toDateString() !== calendarDate.value.toDateString()) {
    calendarDate.value = normalizedDate
    await refreshBookedDotsForVisibleMonth()
    return
  }

  page.value = 1
  await refreshBookedDotsForVisibleMonth()
  await refreshAll()
})

watch(createPatient, (patientId) => {
  if (!patientId) return
  const selectedPatientOption = patientOptions.value.find(option => option.id === patientId)
  if (selectedPatientOption?.clinic_id) {
    selectedClinicId.value = selectedPatientOption.clinic_id
  }
})

watch(createDoctor, (doctorId, previousDoctorId) => {
  const selectedDoctorOption = doctorOptions.value.find(option => option.id === doctorId)
  const previousDoctorOption = doctorOptions.value.find(option => option.id === previousDoctorId)

  if (!createPatient.value && selectedDoctorOption?.clinic_id) {
    selectedClinicId.value = selectedDoctorOption.clinic_id
  }

  if (selectedDoctorOption?.specialty_tag_id) {
    createSpecialtyTag.value = selectedDoctorOption.specialty_tag_id
    return
  }

  if (
    previousDoctorOption?.specialty_tag_id &&
    previousDoctorOption.specialty_tag_id &&
    createSpecialtyTag.value === previousDoctorOption.specialty_tag_id
  ) {
    createSpecialtyTag.value = undefined
  }
})

watch(createLocationContext, (locationContext) => {
  if (locationContext === "HOME_CARE") {
    createTreatmentArea.value = undefined
    return
  }

  isCreateLocationContextAuto.value = false
  if (hasHomeServiceAddOn.value) {
    removeHomeServiceAddOn()
  }
})

watch(createBillingType, (billingType) => {
  if (billingType === "HMO_BILLING") {
    serviceMode.value = "individual"
    selectedBundleId.value = undefined
    selectedServiceLines.value = selectedServiceLines.value.filter(line => line.type !== "bundle")
  }

  if (billingType !== "SELF_PAY_PACKAGE") {
    selectedPackageOfferDetail.value = null
    packageSessionSchedules.value = []
    selectedServiceLines.value = selectedServiceLines.value.filter(line => line.type !== "package")
  }
})

watch(selectedPackageOfferDetail, () => {
  if (!selectedPackageOfferDetail.value) {
    packageSessionSchedules.value = []
    return
  }

  syncSelectedPackageSessionSchedules()
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
