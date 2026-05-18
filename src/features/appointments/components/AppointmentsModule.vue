<template>
  <main class="app-page-shell space-y-5">
    <section class="app-hero-banner-vivid p-4 sm:p-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
<div class="space-y-2">
  <div class="app-section-title">
    Appointments Overview
  </div>

  <p class="app-muted-text max-w-2xl text-sm leading-6">
    Manage daily clinic appointments, filter schedules, export records, and review reports from one view.
  </p>

  <div class="flex flex-wrap gap-2 text-xs">
    <span
      class="app-appointment-chip"
    >
      Date: {{ selectedDateLabel }}
    </span>

    <span
      class="app-appointment-chip"
    >
      Clinic: {{ selectedClinic?.name || "No clinic selected" }}
    </span>
  </div>
</div>

<div class="flex flex-col gap-4 lg:items-end">
  <Button
    label="Add Appointment"
    icon="pi pi-plus"
    :pt="ptPrimaryBtn"
    class="w-full sm:w-auto"
    @click="openCreateDialog"
  />

  <div class="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto">
    <article
      class="app-appointment-summary-card"
    >
      <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">
        Visible Appointments
      </p>
      <p class="app-appointment-value mt-1 text-2xl font-semibold">
        {{ dayBookings.length }}
      </p>
    </article>

    <article
      class="app-appointment-summary-card"
    >
      <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">
        Filtered Table
      </p>
      <p class="app-appointment-value mt-1 text-2xl font-semibold">
        {{ totalElements }}
      </p>
    </article>

    <article
      class="app-appointment-summary-card"
    >
      <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">
        Rescheduled Today
      </p>
      <p class="app-appointment-value mt-1 text-2xl font-semibold">
        {{ rescheduledAppointmentsCount }}
      </p>
    </article>

    <article
      class="app-appointment-summary-card"
    >
      <p class="app-appointment-muted text-xs font-medium uppercase tracking-wide">
        Needs Billing
      </p>
      <p class="app-appointment-value mt-1 text-2xl font-semibold">
        {{ billingAttentionCount }}
      </p>
    </article>
  </div>
</div>
      </div>
    </section>

<section :class="sectionCardClass">
  <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div class="space-y-1">
      <h3 :class="sectionTitleClass">
        Clinic Calendar
      </h3>

      <p class="app-muted-text max-w-2xl text-sm leading-6">
        View valid booking days, monthly appointment status, and branch schedule availability.
      </p>

      <div class="flex flex-wrap gap-2 pt-1 text-xs">
        <span
          class="app-appointment-chip"
        >
          Selected: {{ selectedDateLabel }}
        </span>

        <span
          v-if="selectedClinicScheduleLabel"
          class="app-appointment-chip"
        >
          {{ selectedClinicScheduleLabel }}
        </span>
      </div>
    </div>

    <div
      class="app-appointment-branch-pill"
    >
      Branch:
      <span class="app-appointment-value font-medium">
        {{ selectedClinic?.name || "No branch selected" }}
      </span>
    </div>
  </div>

  <div class="app-appointment-muted flex flex-wrap gap-2 text-xs">
    <span
      class="app-appointment-legend app-appointment-legend-danger"
    >
      <span class="app-appointment-legend-dot app-appointment-legend-dot-danger" />
      Unfinished and unbilled
    </span>

    <span
      class="app-appointment-legend app-appointment-legend-info"
    >
      <span class="app-appointment-legend-dot app-appointment-legend-dot-info" />
      Scheduled, not fully paid
    </span>

    <span
      class="app-appointment-legend app-appointment-legend-warning"
    >
      <span class="app-appointment-legend-dot app-appointment-legend-dot-warning" />
      Unfinished but billed
    </span>

    <span
      class="app-appointment-legend app-appointment-legend-amber"
    >
      <span class="app-appointment-legend-dot app-appointment-legend-dot-amber" />
      Multi-session billed
    </span>

    <span
      class="app-appointment-legend app-appointment-legend-success"
    >
      <span class="app-appointment-legend-dot app-appointment-legend-dot-success" />
      Finished and billed
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
      <div :class="calendarDayCellClass(slotProps.date)">
        <span>{{ slotProps.date.day }}</span>

        <span
          v-if="getCalendarDayStatus(slotProps.date)"
          :class="calendarDayDotClass(slotProps.date)"
        />
      </div>
    </template>
  </DatePicker>

  <div class="flex justify-end pt-1">
    <Button
      label="Add Appointment"
      icon="pi pi-plus"
      size="small"
      outlined
      :pt="ptPrimaryBtn"
      @click="openCreateDialog"
    />
  </div>
</section>

<section :class="sectionCardClass">
  <div class="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
    <div class="space-y-1">
      <h3 :class="sectionTitleClass">
        Appointments Table
      </h3>

      <p class="app-muted-text max-w-2xl text-sm leading-6">
        Filter, review, page through, and export appointment records for the selected date.
      </p>
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
      <label>Record Search</label>
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
      <label>Status</label>
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
      <label>Phase</label>
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
        placeholder="All assigned PTs"
        :pt="ptSelect"
      />
      <label>Assigned PT</label>
    </IftaLabel>

    <div class="flex flex-col gap-2 md:col-span-2 sm:flex-row sm:items-end xl:col-span-2">
      <Button
        label="Refresh"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        class="w-full sm:w-auto"
        :pt="ptOutlinedBtn"
        @click="refreshAll"
      />

      <Button
        label="Export CSV"
        icon="pi pi-download"
        severity="secondary"
        outlined
        class="w-full sm:w-auto"
        :pt="ptOutlinedBtn"
        @click="onExportCsv"
      />
    </div>

    <p
      v-if="recordFilter.trim()"
      class="app-muted-text text-xs leading-5 md:col-span-2 xl:col-span-6"
    >
      Record search checks across clinics, assigned PTs, statuses, and dates. Clear the search to return to the selected table filters.
    </p>
  </div>

  <div class="app-appointment-table-shell">
    <DataTable
      :value="appointments"
      dataKey="id"
      paginator
      :rows="pageSize"
      :first="(page - 1) * pageSize"
      :totalRecords="totalElements"
      :loading="isLoading"
      selectionMode="single"
      @page="onPage"
      @rowSelect="onSelectRow"
      :pt="{
        column: {
          headerCell: {
            class: 'app-appointment-table-th'
          },
          bodyCell: {
            class: 'app-appointment-table-td'
          }
        }
      }"
    >
      <template #empty>
        <div class="app-appointment-empty">
          No appointments found for the selected date and filters.
        </div>
      </template>

      <Column field="patient_name" header="Patient" />

      <Column field="doctor_name" header="Assigned PT">
        <template #body="{ data }">
          {{ data.doctor_name || "Unassigned" }}
        </template>
      </Column>

      <Column field="starts_at" header="Start">
        <template #body="{ data }">
          {{ formatDateTime(data.starts_at) }}
        </template>
      </Column>

      <Column field="appointment_status" header="Status">
        <template #body="{ data }">
          <Tag
            :value="displayAppointmentStatus(data.appointment_status)"
            :severity="appointmentSeverity(data.appointment_status)"
          />
        </template>
      </Column>

      <Column field="appointment_phase" header="Phase">
        <template #body="{ data }">
          <Tag
            :value="displayAppointmentPhase(data.appointment_phase)"
            :severity="appointmentPhaseSeverity(data.appointment_phase)"
          />
        </template>
      </Column>

      <Column field="location_context" header="Location">
        <template #body="{ data }">
          <Tag
            :value="displayLocationContext(data.location_context)"
            :severity="appointmentLocationContextSeverity(data.location_context)"
          />
        </template>
      </Column>

      <Column field="specialty_tag_name" header="Specialty">
        <template #body="{ data }">
          <div class="space-y-1">
            <p>{{ data.specialty_tag_name || "N/A" }}</p>

            <Tag
              v-if="data.specialty_tag_name && data.specialty_tag_is_active === false"
              value="Inactive Specialty"
              severity="secondary"
              class="text-xs"
            />
          </div>
        </template>
      </Column>

      <Column field="treatment_area_name" header="Clinic Room">
        <template #body="{ data }">
          <div class="space-y-1">
            <TreatmentAreaChip
              :name="data.treatment_area_name"
              :color="data.treatment_area_color"
            />

            <Tag
              v-if="data.treatment_area_name && data.treatment_area_is_active === false"
              value="Inactive Room"
              severity="secondary"
              class="text-xs"
            />
          </div>
        </template>
      </Column>

      <Column field="billing_status" header="Billing">
        <template #body="{ data }">
          <Tag
            :value="displayBillingStatus(data.billing_status)"
            :severity="billingSeverity(data.billing_status)"
          />
        </template>
      </Column>

      <Column field="reschedule_count" header="Reschedules">
        <template #body="{ data }">
          <span class="font-medium">
            {{ data.reschedule_count }}
          </span>
        </template>
      </Column>

      <Column header="Actions">
        <template #body="{ data }">
          <div class="flex items-center gap-1">
            <Button
              size="small"
              text
              rounded
              icon="pi pi-eye"
              aria-label="View appointment"
              @click.stop="selectAppointment(data)"
            />

            <Button
              size="small"
              text
              rounded
              icon="pi pi-calendar-plus"
              aria-label="Reschedule appointment"
              @click.stop="openReschedule(data)"
            />

            <Button
              v-if="canDeleteAppointments"
              size="small"
              text
              rounded
              severity="danger"
              icon="pi pi-trash"
              aria-label="Delete appointment"
              @click.stop="confirmDeleteAppointment(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</section>

<AppointmentCheckoutPanel
  v-model:visible="detailPanelVisible"
  :selected-detail="selectedDetail"
  :sponsor-wallet-summary="sponsorWalletSummary"
  :has-patient-wallet-amount-to-collect="hasPatientWalletAmountToCollect"
  :patient-wallet-amount-to-collect="patientWalletAmountToCollect"
  :selected-encounter-ticket="selectedEncounterTicket"
  :selected-encounter-ticket-has-pt-signature="selectedEncounterTicketHasPtSignature"
  :selected-encounter-ticket-summary-label="selectedEncounterTicketSummaryLabel"
  :selected-encounter-ticket-package-label="selectedEncounterTicketPackageLabel"
  :selected-encounter-ticket-package-source-label="selectedEncounterTicketPackageSourceLabel"
  :selected-encounter-ticket-pt-confirmed-by-label="selectedEncounterTicketPtConfirmedByLabel"
  :selected-encounter-ticket-pt-completion-tag="selectedEncounterTicketPtCompletionTag"
  :encounter-ticket-button-label="encounterTicketButtonLabel"
  :encounter-ticket-record-label="encounterTicketRecordLabel"
  :encounter-attendance-label="encounterAttendanceLabel"
  :can-process-encounter-ticket="canProcessEncounterTicket"
  :is-selected-encounter-ticket-locked="isSelectedEncounterTicketLocked"
  :is-lgu-billing="isLguBilling"
  :dropout-status-label="dropoutStatusLabel"
  :dropout-status-severity="dropoutStatusSeverity"
  :dropout-status-value="dropoutStatusValue"
  :dropout-toggle-label="dropoutToggleLabel"
  :dropout-toggle-icon="dropoutToggleIcon"
  :dropout-toggle-severity="dropoutToggleSeverity"
  :dropout-loading="dropoutLoading"
  :dropout-status-description="dropoutStatusDescription"
  :pt-primary-btn="ptPrimaryBtn"
  :pt-outlined-btn="ptOutlinedBtn"
  :detail-card-class="detailCardClass"
  :format-date-time="formatDateTime"
  :as-currency="asCurrency"
  :display-appointment-phase="displayAppointmentPhase"
  :appointment-phase-severity="appointmentPhaseSeverity"
  :display-location-context="displayLocationContext"
  :appointment-location-context-severity="appointmentLocationContextSeverity"
  :display-appointment-status="displayAppointmentStatus"
  :appointment-severity="appointmentSeverity"
  :display-billing-status="displayBillingStatus"
  :billing-severity="billingSeverity"
  @close="closeDetailPanel"
  @open-patient-record="goToPatients"
  @open-tender-payment="openTenderPaymentDrawer"
  @create-billing="goToBilling"
  @open-encounter-ticket="openEncounterTicketDialog"
  @export-ticket-pdf="exportSelectedEncounterTicketPdf"
  @toggle-dropout-status="toggleDropoutStatus"
  @open-lgu-monthly-claim="openLguMonthlyClaimDialog"
/>

    <Dialog
      v-model:visible="lguMonthlyClaimVisible"
      modal
      header="Create Month-End LGU Claim"
      :style="{ width: '540px' }"
      :breakpoints="{ '1024px': '92vw', '768px': '100vw' }"
    >
      <div v-if="selectedDetail?.lgu_credit_summary" class="space-y-4">
        <div class="app-appointment-card">
          <div class="app-appointment-title text-sm">Appointment & Package Summary</div>
          <div class="mt-4 grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <div class="app-appointment-muted text-xs uppercase tracking-wide">Patient</div>
              <div class="app-appointment-value mt-1 font-medium">{{ selectedDetail.patient_name }}</div>
              <div class="text-xs opacity-65">{{ selectedDetail.patient_public_id }}</div>
            </div>
            <div>
              <div class="app-appointment-muted text-xs uppercase tracking-wide">Package</div>
              <div class="app-appointment-value mt-1 font-medium">{{ selectedDetail.lgu_credit_summary.package_name }}</div>
            </div>
            <div>
              <div class="app-appointment-muted text-xs uppercase tracking-wide">Consumed Credits</div>
              <div class="mt-1">
                <span class="app-appointment-value text-xl font-semibold">{{ selectedDetail.lgu_credit_summary.consumed_sessions }}</span>
                <span class="text-xs opacity-65"> of {{ selectedDetail.lgu_credit_summary.total_sessions }} total</span>
              </div>
            </div>
            <div>
              <div class="app-appointment-muted text-xs uppercase tracking-wide">Status</div>
              <div class="mt-1">
                <Tag :value="selectedDetail.lgu_credit_summary.authorization_status" :severity="selectedDetail.lgu_credit_summary.authorization_status === 'ACTIVE' ? 'success' : 'danger'" />
              </div>
            </div>
          </div>
        </div>

        <div class="app-appointment-card app-appointment-card-secondary">
          <div class="app-appointment-muted text-xs uppercase tracking-wide">Billing Month</div>
          <div class="app-appointment-muted mt-2 text-sm">
            Select the month to bill these consumed LGU credits. Format: YYYY-MM (e.g., 2026-04 for April 2026).
          </div>
          <IftaLabel class="mt-4">
            <InputText
              v-model="lguMonthlyClaimMonth"
              fluid
              placeholder="2026-04"
              @input="sanitizeLguMonthInput"
            />
            <label>Billing Month</label>
          </IftaLabel>
          <small class="mt-2 block text-[11px] opacity-65">
            Only consumed credits from this month will be included in the claim.
          </small>
        </div>

        <Message
          v-if="lguMonthlyClaimSummary"
          severity="info"
          :closable="false"
          class="text-sm"
        >
          <div class="font-medium">{{ lguMonthlyClaimSummary.consumed_count }} credits from consumed items</div>
          <div class="text-xs opacity-75 mt-1">will be billed as individual pricing</div>
        </Message>
      </div>

      <template #footer>
        <Button label="Cancel" text @click="lguMonthlyClaimVisible = false" />
        <Button
          label="Create Claim"
          icon="pi pi-check"
          :loading="isLguMonthlyClaimSaving"
          :pt="ptPrimaryBtn"
          :disabled="!lguMonthlyClaimMonth?.trim()"
          @click="submitLguMonthlyClaim"
        />
      </template>
    </Dialog>

  <AppointmentEncounterTicketDialog
  v-model:visible="encounterTicketVisible"
  v-model:signature-data-url="encounterTicketSignatureDataUrl"
  :selected-detail="selectedDetail"
  :selected-encounter-ticket="selectedEncounterTicket"
  :selected-encounter-ticket-has-pt-signature="selectedEncounterTicketHasPtSignature"
  :selected-encounter-ticket-pt-confirmed-by-label="selectedEncounterTicketPtConfirmedByLabel"
  :selected-encounter-ticket-pt-completion-tag="selectedEncounterTicketPtCompletionTag"
  :encounter-service-rendered-label="encounterServiceRenderedLabel"
  :encounter-session-deduction-label="encounterSessionDeductionLabel"
  :encounter-ticket-record-label="encounterTicketRecordLabel"
  :selected-encounter-ticket-package-label="selectedEncounterTicketPackageLabel"
  :selected-encounter-ticket-package-source-label="selectedEncounterTicketPackageSourceLabel"
  :is-selected-encounter-ticket-locked="isSelectedEncounterTicketLocked"
  :is-encounter-ticket-saving="isEncounterTicketSaving"
  :pt-primary-btn="ptPrimaryBtn"
  :format-date-time="formatDateTime"
  @submit="submitEncounterTicket"
/>

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
            :manualInput="true"
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
        <small class="opacity-70">Slots start every 15 minutes and must be 30, 60, or 75 minutes long.</small>
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
  <section class="app-appointment-card app-appointment-card-accent">
    <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_160px] lg:items-center">
      <div>
        <h3 class="app-appointment-title text-lg">New appointment</h3>
        <p class="app-appointment-muted mt-1 text-sm leading-6">
          Fill in the essentials, add at least one service, then save.
        </p>
      </div>
      <div class="app-appointment-card px-4 py-3">
        <div class="app-appointment-muted text-xs uppercase tracking-wide">Date</div>
        <div class="app-appointment-value mt-1 font-medium">{{ selectedDateLabel }}</div>
      </div>
      <div class="app-appointment-card px-4 py-3">
        <div class="app-appointment-muted text-xs uppercase tracking-wide">Clinic</div>
        <div class="app-appointment-value mt-1 font-medium">{{ selectedClinic?.name || "No clinic selected" }}</div>
      </div>
      <div class="app-appointment-card px-4 py-3">
        <div class="app-appointment-muted text-xs uppercase tracking-wide">Total</div>
        <div class="app-appointment-value mt-1 font-semibold">{{ asCurrency(subtotalFromServiceLines) }}</div>
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

        <!-- LGU Program picker -->
        <div v-if="createBillingType === 'LGU_BILLING'" class="mt-4 flex flex-col gap-1.5">
          <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">LGU Program</label>
          <Select
            v-model="createLguProgramId"
            :options="lguProgramOptions"
            optionLabel="name"
            optionValue="id"
            fluid
            placeholder="Select LGU program…"
            :pt="ptSelect"
          />
        </div>

        <!-- Care team and session setup (collapsible) -->
<section
  class="mt-4 overflow-hidden rounded-2xl border border-[#A3D9E8] bg-[#EEF8FB] shadow-sm"
>
  <!-- Section Header -->
  <div class="flex items-start gap-3 border-b border-[#A3D9E8] bg-[#E8F6FB] px-4 py-4">
    <div
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3C88B1] text-white shadow-sm"
    >
      <i class="pi pi-users text-base"></i>
    </div>

    <div class="min-w-0">
      <h3 class="m-0 text-sm font-bold uppercase tracking-wide text-[#242757]">
        Care Team and Session Setup
      </h3>
      <p class="m-0 mt-1 text-xs text-[#276C91]">
        Assign the PT, session location, specialty, room, and billing notes.
      </p>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
    <!-- Referring Doctor -->
    <div class="md:col-span-2 flex flex-col gap-1.5">
      <label class="px-1 text-xs font-semibold uppercase tracking-widest text-[#276C91]">
        Referring Doctor
      </label>

      <Select
        v-model="createReferringDoctor"
        :options="referringDoctorOptions"
        optionLabel="label"
        optionValue="id"
        filter
        showClear
        fluid
        placeholder="Select referring doctor (optional)"
        :pt="ptSelect"
      />
    </div>

    <!-- Assigned PT -->
    <div
      class="rounded-2xl border border-[#7EC8DD] bg-white/80 p-3 shadow-sm"
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <label class="px-1 text-xs font-bold uppercase tracking-widest text-[#242757]">
          Assigned PT
        </label>

        <span class="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-600">
          Required
        </span>
      </div>

      <Select
        v-model="createDoctor"
        :options="doctorOptions"
        optionLabel="label"
        optionValue="id"
        filter
        showClear
        fluid
        placeholder="Select assigned PT"
        :pt="ptSelect"
      />
    </div>

    <!-- Supporting PT / Intern -->
    <div class="flex flex-col gap-1.5">
      <label class="px-1 text-xs font-semibold uppercase tracking-widest text-[#276C91]">
        PT Assistant / Intern
      </label>

      <Select
        v-model="createSupportStaff"
        :options="supportStaffOptions"
        optionLabel="label"
        optionValue="id"
        filter
        showClear
        fluid
        placeholder="Select PT assistant or intern (optional)"
        :pt="ptSelect"
      />
    </div>

    <!-- Location Context -->
    <div
      class="rounded-2xl border border-[#A3D9E8] bg-white/80 p-3 shadow-sm"
    >
      <label class="mb-2 block px-1 text-xs font-bold uppercase tracking-widest text-[#242757]">
        Location Context
      </label>

      <div class="flex gap-1 rounded-xl border border-[#A3D9E8] bg-[#F8FCFE] p-1">
        <button
          v-for="option in appointmentLocationContextOptions"
          :key="option.value"
          type="button"
          @click="createLocationContext = option.value"
          :class="[
            'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200',
            createLocationContext === option.value
              ? 'bg-[#3C88B1] text-white shadow-sm'
              : 'text-[#276C91] hover:bg-[#E8F6FB] hover:text-[#242757]'
          ]"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- Specialty -->
    <div
      class="rounded-2xl border border-[#A3D9E8] bg-white/80 p-3 shadow-sm"
    >
      <label class="mb-2 block px-1 text-xs font-bold uppercase tracking-widest text-[#242757]">
        Specialty
      </label>

      <Select
        v-model="createSpecialtyTag"
        :options="specialtyTagOptions"
        optionLabel="name"
        optionValue="id"
        showClear
        filter
        fluid
        :disabled="isCreateSpecialtyLockedByProvider"
        :placeholder="isCreateSpecialtyLockedByProvider ? 'Assigned PT specialty applied automatically' : 'Select specialty (optional)'"
        :pt="ptSelect"
      />

      <p
        v-if="selectedCreateProviderHasSpecialty || selectedCreateProviderRequiresSpecialty"
        class="m-0 mt-2 px-1 text-xs leading-relaxed text-[#276C91]"
      >
        {{
          selectedCreateProviderSpecialtyLabel
            ? (selectedCreateProviderRequiresSpecialty
              ? `This assigned PT role requires a specialty, so ${selectedCreateProviderSpecialtyLabel} is applied automatically.`
              : `${selectedCreateProviderSpecialtyLabel} is suggested from the selected PT and can still be changed.`)
            : 'This assigned PT role requires a specialty. Assign it on Staffs or choose one here before saving.'
        }}
      </p>
    </div>

    <!-- Clinic Room -->
    <div class="md:col-span-2 rounded-2xl border border-[#A3D9E8] bg-white/80 p-3 shadow-sm">
      <label class="mb-2 block px-1 text-xs font-bold uppercase tracking-widest text-[#242757]">
        Clinic Room
      </label>

      <Select
        v-model="createTreatmentArea"
        :options="treatmentAreaOptions"
        optionLabel="name"
        optionValue="id"
        showClear
        filter
        fluid
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
            <TreatmentAreaChip
              :name="selectedTreatmentAreaOption.name"
              :color="selectedTreatmentAreaOption.color"
            />
          </span>
          <span v-else class="opacity-70">{{ placeholder }}</span>
        </template>
      </Select>

      <p class="m-0 mt-2 px-1 text-xs leading-relaxed text-[#276C91]">
        {{
          createLocationContext === 'HOME_CARE'
            ? 'Clinic rooms are skipped for Home Care appointments.'
            : 'Clinic rooms are managed from the Clinics page and applied per selected clinic.'
        }}
      </p>
    </div>

    <!-- Billing Notes -->
    <div class="md:col-span-2 flex flex-col gap-1.5">
      <label class="px-1 text-xs font-semibold uppercase tracking-widest text-[#276C91]">
        Billing Notes
      </label>

      <InputText
        v-model="createBillingNotes"
        fluid
        placeholder="Optional billing notes"
        :pt="ptInputText"
      />
    </div>
  </div>
</section>
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
          <div v-if="!isCreatePackageServiceFlow" class="flex flex-col gap-1.5">
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
          <div v-if="isCreatePackageServiceFlow" class="space-y-3">
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
            <div v-if="createBillingType === 'LGU_BILLING'" class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold tracking-widest uppercase text-[rgb(var(--app-fg))]/50 px-1">Bundle</label>
              <div class="flex flex-col gap-2 md:flex-row md:items-end">
                <Select
                  v-model="selectedBundleId"
                  :options="activeBundledServices"
                  optionLabel="name"
                  optionValue="id"
                  filter
                  fluid
                  placeholder="Select a bundle"
                  :pt="ptSelect"
                />
                <Button
                  label="Add Bundle"
                  icon="pi pi-box"
                  outlined
                  :disabled="!selectedBundleId"
                  @click="addSelectedBundle"
                />
              </div>
              <p v-if="activeBundledServices.length === 0" class="px-1 text-xs text-[rgb(var(--app-fg))]/50">
                No bundles available. Add them in Single Pay: Single Service Management.
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
                :manualInput="true"
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
          :manualInput="true"
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
        <span class="text-xs text-[rgb(var(--app-fg))]/40">30 · 60 · 75 min slots</span>
      </div>
      <div class="text-sm font-medium text-[rgb(var(--app-fg))]">
        {{ selectedClinicScheduleLabel || "No clinic resolved yet" }}
      </div>
    </div>

  </div>

</section>

  </div>
</div>
      <template #footer>
        <Button label="Cancel" text @click="createVisible = false" />
        <Button label="Create Appointment" icon="pi pi-check" :pt="ptPrimaryBtn" @click="submitCreateAppointment" />
      </template>
    </Dialog>

    <BillingModule
      v-if="billingOverlayVisible"
      :embedded="true"
      :overlay-only="true"
      :initial-view="billingOverlayMode"
      @close-overlay="onBillingOverlayClose"
    />

  </main>
</template>

<script setup lang="ts">
import AppointmentEncounterTicketDialog from "@/features/appointments/components/AppointmentEncounterTicketDialog.vue";
import {computed, defineAsyncComponent, onMounted, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useRouter} from "vue-router";
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable, {type DataTablePageEvent} from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import IftaLabel from "primevue/iftalabel";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Select from "primevue/select";
import SelectButton from "primevue/selectbutton";
import Tag from "primevue/tag";
import PatientSignaturePad from "@/features/appointments/components/PatientSignaturePad.vue";
import TreatmentAreaChip from "@/features/appointments/components/TreatmentAreaChip.vue";
import {billingPhase1Service} from "@/features/billing/api/billing-phase1.service";
import {
  appointmentPhase1Service,
  type AppointmentEncounterTicket,
  type AppointmentEncounterTicketPayload,
  type AppointmentDetail,
  type AppointmentListItem,
  type AppointmentLocationContext,
  type AppointmentPhase
} from "@/features/appointments/api/appointment-phase1.service";
import {exportToExcel} from "@/utils/export-excel.util";
import {
  openEncounterTicketPdfWindow,
  renderEncounterTicketPdfWindow
} from "@/utils/encounter-ticket-pdf.util";
import {getApiErrorMessage} from "@/utils/actionable-error.util";
import {errorToast, successToast} from "@/utils/toast.util";
import {patientService} from "@/features/patients/api/patient.service";
import {defaultPage} from "@/models/paging";
import {Status} from "@/utils/global.type";
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
import { hasAnyStoredPermission, readStoredAuthSnapshot } from "@/utils/auth-user.util"
import {clinicStore} from "@/stores/clinic.store"
import AppointmentCheckoutPanel from "@/features/appointments/components/AppointmentCheckoutPanel.vue"


const BillingModule = defineAsyncComponent(() => import("@/features/billing/components/BillingModule.vue"))

interface BillingPickerLookup {
  id: string | number
  name: string
  price: number
}

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()
const globalClinicStore = clinicStore()
const {clinicOptions, selectedClinicId} = storeToRefs(globalClinicStore)
const roleName = ref("")
const permissionSet = ref<Set<string>>(new Set())

const appointments = ref<AppointmentListItem[]>([])
const selectedDetail = ref<AppointmentDetail>()
const detailPanelVisible = ref(false)
const billingOverlayVisible = ref(false)
const billingOverlayMode = ref<'detail' | 'edit'>('detail')
const encounterTicketVisible = ref(false)
const isEncounterTicketSaving = ref(false)
const encounterTicketAttendedAt = ref<Date>(new Date())
const encounterTicketSignatureDataUrl = ref("")
const lguMonthlyClaimVisible = ref(false)
const lguMonthlyClaimMonth = ref("")
const isLguMonthlyClaimSaving = ref(false)
const lguMonthlyClaimSummary = ref<{ consumed_count: number; billing_month: string } | null>(null)
const isLoading = ref(false)
const slotMinuteStep = 15
type SlotDurationMinutes = 30 | 60 | 75
type DoctorConsultantFilterValue = number | "UNASSIGNED"
const slotDurationOptions: Array<{label: string; value: SlotDurationMinutes}> = [
  {label: "30 min", value: 30},
  {label: "60 min", value: 60},
  {label: "75 min", value: 75},
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
const createLookupsClinicId = ref<number>()
const doctorOptions = ref<AppointmentPersonOption[]>([])
const referringDoctorOptions = ref<AppointmentPersonOption[]>([])
const supportStaffOptions = ref<AppointmentPersonOption[]>([])
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
const createPatient = ref<number>()
const createDoctor = ref<number>()
const createReferringDoctor = ref<number>()
const createSupportStaff = ref<number>()
const createPhase = ref<AppointmentPhase>("SESSION")
const createLocationContext = ref<AppointmentLocationContext>("IN_CLINIC")
const isCreateLocationContextAuto = ref(false)
const createSpecialtyTag = ref<number>()
const createTreatmentArea = ref<number>()
const createBillingType = ref<BillingType>("SELF_PAY_SINGLE")
const createBillingNotes = ref("")
const createLguProgramId = ref<number>()
const lguProgramOptions = ref<Array<{id: number; name: string}>>([])
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
const isPackageServiceFlowBillingType = (billingType: BillingType): boolean =>
  billingType === "SELF_PAY_PACKAGE" || billingType === "LGU_BILLING"
const isCreatePackageServiceFlow = computed(() => isPackageServiceFlowBillingType(createBillingType.value))
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
const canDeleteAppointments = computed(() => hasAnyStoredPermission(permissionSet.value, "Appointment::DELETE"))
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
  if (minutes <= 30) return 30
  if (minutes <= 60) return 60
  return 75
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
  if (providerType === "DOCTOR_CONSULTANT" || providerType === "PHYSICAL_THERAPIST" || providerType === "PT_ASSISTANT" || providerType === "INTERN") return providerType
  return "NONE"
}
const isPhysicalTherapistProviderType = (providerType?: AppointmentProviderType | null): boolean =>
  normalizeAppointmentProviderType(providerType) === "PHYSICAL_THERAPIST"
const isDoctorConsultantProviderType = (providerType?: AppointmentProviderType | null): boolean =>
  normalizeAppointmentProviderType(providerType) === "DOCTOR_CONSULTANT"
const isSupportStaffProviderType = (providerType?: AppointmentProviderType | null): boolean =>
  normalizeAppointmentProviderType(providerType) === "PT_ASSISTANT"
  || normalizeAppointmentProviderType(providerType) === "INTERN"
const resolveAppointmentStaffProviderType = (staff: Staff): AppointmentProviderType => {
  const primaryProviderType = normalizeAppointmentProviderType(staff.appointment_provider_type)
  if (primaryProviderType !== "NONE") {
    return primaryProviderType
  }
  return normalizeAppointmentProviderType(staff.secondary_appointment_provider_type)
}
const resolveAppointmentStaffRoleName = (staff: Staff): string => {
  const primaryProviderType = normalizeAppointmentProviderType(staff.appointment_provider_type)
  if (primaryProviderType !== "NONE") {
    return staff.role_name
  }
  return staff.secondary_role_name || staff.role_name
}
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
  return getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Appointment or Patient permissions in Role Access",
    notFoundHint: "The selected record was not found. Refresh the page and try again.",
    invalidInputHint: "Some inputs are invalid. Check required fields and schedule values, then retry.",
    retryHint: "Please try again."
  })
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

const createModalCardClass = "app-appointment-card"
const createModalSectionTitleClass = "app-appointment-title text-base"

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

const formatLocalDateKey = (date: Date): string => {
  const yyyy = String(date.getFullYear())
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

const selectedDateIso = computed(() => formatLocalDateKey(calendarDate.value))
const sectionCardClass = "app-section-card-comfy space-y-4"
const sectionTitleClass = "app-section-title"
const detailCardClass = "app-appointment-card p-3"
const selectedCheckoutSummary = computed(() => selectedDetail.value?.checkout_summary)
const patientWalletAmountToCollect = computed(() =>
  Number(selectedCheckoutSummary.value?.patient_wallet.amount_to_collect ?? 0)
)
const hasPatientWalletAmountToCollect = computed(() => patientWalletAmountToCollect.value > 0)
const sponsorWalletSummary = computed(() => selectedCheckoutSummary.value?.sponsor_wallet)
const selectedLguCreditSummary = computed(() => selectedDetail.value?.lgu_credit_summary)
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

const isLguBilling = computed(() => {
  const bt = String(selectedDetail.value?.billing_type ?? "").trim().toUpperCase().replace(/[:\- ]/g, "_")
  return bt === "LGU" || bt === "LGU_BILLING"
})
const dropoutLoading = ref(false)
const dropoutStatusValue = computed(() => {
  return (selectedDetail.value as Record<string, unknown> | undefined)?.dropout_status as string ?? "ACTIVE"
})
const dropoutStatusLabel = computed(() => {
  const status = dropoutStatusValue.value
  if (status === "DROPPED_OUT") return "Dropped Out"
  if (status === "RETURNED") return "Returned"
  return "Active"
})
const dropoutStatusSeverity = computed(() => {
  const status = dropoutStatusValue.value
  if (status === "DROPPED_OUT") return "danger"
  if (status === "RETURNED") return "warn"
  return "success"
})
const dropoutToggleLabel = computed(() =>
  dropoutStatusValue.value === "DROPPED_OUT" ? "Mark as Returned" : "Mark as Drop-out"
)
const dropoutToggleIcon = computed(() =>
  dropoutStatusValue.value === "DROPPED_OUT" ? "pi pi-undo" : "pi pi-times-circle"
)
const dropoutToggleSeverity = computed(() =>
  dropoutStatusValue.value === "DROPPED_OUT" ? "success" : "danger"
)
const dropoutStatusDescription = computed(() => {
  const status = dropoutStatusValue.value
  if (status === "DROPPED_OUT") return "Consumed LGU credits are converted into an individual-pricing dropout claim. Month-end package claims are blocked until the patient returns."
  if (status === "RETURNED") return "Patient returned after previously dropping out."
  return selectedLguCreditSummary.value
    ? "Patient is active. Month-end LGU claims can only be created from consumed credits with both PT and patient signatures."
    : "Patient is actively participating in the LGU program."
})
const toggleDropoutStatus = async () => {
  if (!selectedDetail.value?.id) return
  const nextStatus = dropoutStatusValue.value === "DROPPED_OUT" ? "RETURNED" : "DROPPED_OUT"
  dropoutLoading.value = true
  try {
    const result = await appointmentPhase1Service.updateDropoutStatus(selectedDetail.value.id, nextStatus)
    const baseMessage = `Status updated to ${nextStatus === "DROPPED_OUT" ? "Dropped Out" : "Returned"}`
    if (result?.dropout_billing_public_id) {
      successToast(toast, `${baseMessage}. Dropout claim ${result.dropout_billing_public_id} was created.`)
    } else {
      successToast(toast, baseMessage)
    }
    // Refresh detail
    selectedDetail.value = await appointmentPhase1Service.getById(selectedDetail.value.id)
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to update dropout status"))
  } finally {
    dropoutLoading.value = false
  }
}

const openLguMonthlyClaimDialog = (): void => {
  if (!selectedDetail.value) return
  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  lguMonthlyClaimMonth.value = currentMonth
  lguMonthlyClaimSummary.value = {
    consumed_count: selectedDetail.value.lgu_credit_summary?.consumed_sessions ?? 0,
    billing_month: currentMonth
  }
  lguMonthlyClaimVisible.value = true
}

const sanitizeLguMonthInput = (): void => {
  // Allow only YYYY-MM format: accept digits and hyphens, enforce format
  const value = lguMonthlyClaimMonth.value
  const sanitized = value.replace(/[^\d-]/g, "").substring(0, 7)
  lguMonthlyClaimMonth.value = sanitized

  // Auto-format as user types
  if (sanitized.length >= 4 && sanitized[4] !== "-") {
    lguMonthlyClaimMonth.value = `${sanitized.substring(0, 4)}-${sanitized.substring(4)}`
  }
}

const submitLguMonthlyClaim = async (): Promise<void> => {
  if (!selectedDetail.value?.id || !lguMonthlyClaimMonth.value?.trim()) return

  // Validate month format YYYY-MM
  const monthRegex = /^\d{4}-\d{2}$/
  if (!monthRegex.test(lguMonthlyClaimMonth.value)) {
    errorToast(toast, "Billing month must be in YYYY-MM format (e.g., 2026-04)")
    return
  }

  try {
    isLguMonthlyClaimSaving.value = true
    const result = await billingPhase1Service.createLguMonthlyClaim({
      appointment_id: selectedDetail.value.id,
      billing_month: lguMonthlyClaimMonth.value
    })

    if (result) {
      lguMonthlyClaimVisible.value = false
      // Refresh the appointment detail
      selectedDetail.value = await appointmentPhase1Service.getById(selectedDetail.value.id)
      successToast(
        toast,
        `Month-end LGU claim created successfully. Billing ID: ${result.billing_public_id} (${result.consumed_count} credits)`
      )
    }
  } catch (error: unknown) {
    const errorMsg = extractApiErrorMessage(error, "Failed to create month-end LGU claim")
    errorToast(toast, errorMsg)
  } finally {
    isLguMonthlyClaimSaving.value = false
  }
}

const dayBookings = computed<AppointmentListItem[]>(() => appointments.value)
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
      .filter(option => isPhysicalTherapistProviderType(option.appointment_provider_type))
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

  try {
    const { data } = await pamsAPI.get<Pageable<Record<string, unknown>>>("/package-service-offers", {
      params: { page: 1, size: 500, name: "", status: Status.ACTIVE }
    })
    const dbPackageOffers = (data?.content ?? [])
      .map(normalizePackageServiceOffer)
      .filter((item): item is PackageServiceOffer => item !== null)

    if (dbPackageOffers.length > 0) {
      allPackageServiceOffers.value = dbPackageOffers
    }
  } catch {
    // Keep local cache fallback for offline/stale deployments.
  }

  // Fallback: booking users might not have Promos/Offers module access that populates localStorage,
  // or may have stale/partial cached data (e.g. evaluation only). In either case, load lookup APIs.
  const hasMachineCatalog = allSinglePayServices.value.some(service => service.type === "machine")
  const hasTechniqueCatalog = allSinglePayServices.value.some(service => service.type === "technique")

  if (!allSinglePayServices.value.length || !hasMachineCatalog || !hasTechniqueCatalog) {
    const [machinesResult, techniquesResult, evaluationsResult, addOnMachinesResult, addOnTechniquesResult, addOnHomeServicesResult] = await Promise.allSettled([
      fetchLookup("/machines/lookup"),
      fetchLookup("/techniques/lookup"),
      fetchLookup("/evaluations/lookup"),
      fetchLookup("/add-on-machines/lookup"),
      fetchLookup("/add-on-techniques/lookup"),
      fetchLookup("/add-on-home-services/lookup")
    ])

    const asLookup = (result: PromiseSettledResult<BillingPickerLookup[]>): BillingPickerLookup[] =>
      result.status === "fulfilled" ? result.value : []

    const machines = asLookup(machinesResult).map(item => ({
      id: String(item.id),
      type: "machine" as const,
      name: item.name,
      price: Number(item.price ?? 0),
      status: "Active"
    }))

    const techniques = asLookup(techniquesResult).map(item => ({
      id: String(item.id),
      type: "technique" as const,
      name: item.name,
      price: Number(item.price ?? 0),
      status: "Active"
    }))

    const evaluations = asLookup(evaluationsResult).map(item => ({
      id: String(item.id),
      type: "evaluation" as const,
      name: item.name,
      price: Number(item.price ?? 0),
      status: "Active"
    }))

    const addOnMachines = asLookup(addOnMachinesResult).map(item => ({
      id: String(item.id),
      type: "add-on-machine" as const,
      name: item.name,
      price: Number(item.price ?? 0),
      status: "Active"
    }))

    const addOnTechniques = asLookup(addOnTechniquesResult).map(item => ({
      id: String(item.id),
      type: "add-on-technique" as const,
      name: item.name,
      price: Number(item.price ?? 0),
      status: "Active"
    }))

    const addOnHomeServices = asLookup(addOnHomeServicesResult).map(item => ({
      id: String(item.id),
      type: "add-on-home-service" as const,
      name: item.name,
      price: Number(item.price ?? 0),
      status: "Active"
    }))

    const localEvaluations = allSinglePayServices.value.filter(service => service.type === "evaluation")
    const localAddOnMachines = allSinglePayServices.value.filter(service => service.type === "add-on-machine")
    const localAddOnTechniques = allSinglePayServices.value.filter(service => service.type === "add-on-technique")
    const localAddOnHomeServices = allSinglePayServices.value.filter(service => service.type === "add-on-home-service")

    allSinglePayServices.value = [
      ...machines,
      ...techniques,
      ...(localEvaluations.length ? localEvaluations : evaluations),
      ...(localAddOnMachines.length ? localAddOnMachines : addOnMachines),
      ...(localAddOnTechniques.length ? localAddOnTechniques : addOnTechniques),
      ...(localAddOnHomeServices.length ? localAddOnHomeServices : addOnHomeServices)
    ]
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
  if (createBillingType.value === "HMO_BILLING" || createBillingType.value === "SELF_PAY_PACKAGE") {
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

const addSelectedBundle = (): void => {
  if (!selectedBundleId.value) return
  selectBundle(selectedBundleId.value)
}

const addServiceLine = (type: string): void => {
  let serviceId: string | undefined

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

  const service = allSinglePayServices.value.find(s => {
    if (s.id !== serviceId) return false
    if (type === "add-on-machine") return s.type === "add-on-machine" || s.type === "add-on-technique"
    return s.type === type
  })
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
    errorToast(toast, "Appointment length must be 30, 60, or 75 minutes")
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
    errorToast(
      toast,
      extractApiErrorMessage(
        error,
        "Could not load appointments. Adjust filters (date, clinic, provider) and click Refresh."
      )
    )
  } finally {
    isLoading.value = false
  }
}

const refreshAll = async (): Promise<void> => {
  await fetchAppointments()
  if (selectedDetail.value) {
    const isStillVisible = appointments.value.some(appointment => appointment.id === selectedDetail.value?.id)
    if (!isStillVisible) {
      closeDetailPanel()
    }
  }
}

const loadCreateLookups = async (): Promise<void> => {
  await globalClinicStore.loadClinics()
  if (!selectedClinicId.value && clinicOptions.value.length) {
    globalClinicStore.setSelectedClinicId(clinicOptions.value[0].id)
  }

  const lookupClinicId = selectedClinicId.value
  const [patientsPage, staffLookupPage, specialtyTags, sessionLookupPage] = await Promise.all([
    patientService.getAll({
      clinic_id: lookupClinicId,
      pageable_request: {
        page: defaultPage,
        size: 100,
        status: Status.ACTIVE,
        name: undefined
      }
    }),
    pamsAPI.get<Pageable<Staff>>("/staffs/lookup", {
      params: {
        page: defaultPage,
        size: 100,
        status: Status.ACTIVE,
        name: undefined,
        clinic_id: lookupClinicId
      }
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
  const allStaffMapped = (staffLookupPage.data?.content ?? []).map((doctor: Staff) => ({
    id: doctor.id,
    name: doctor.name,
    label: formatAppointmentProviderLabel({
      name: doctor.name,
      role_name: resolveAppointmentStaffRoleName(doctor),
      specialty_tag_name: doctor.specialty_tag_name
    }),
    clinic_id: doctor.clinic_id,
    role_name: resolveAppointmentStaffRoleName(doctor),
    appointment_provider_type: resolveAppointmentStaffProviderType(doctor),
    requires_specialty_tag: isPhysicalTherapistProviderType(resolveAppointmentStaffProviderType(doctor))
      ? Boolean(doctor.requires_specialty_tag || doctor.secondary_appointment_provider_type === "PHYSICAL_THERAPIST")
      : doctor.requires_specialty_tag,
    specialty_tag_id: doctor.specialty_tag_id,
    specialty_tag_name: doctor.specialty_tag_name
  }))
  doctorOptions.value = allStaffMapped.filter((staff) => isPhysicalTherapistProviderType(staff.appointment_provider_type))
  referringDoctorOptions.value = allStaffMapped.filter((staff) => isDoctorConsultantProviderType(staff.appointment_provider_type))
  supportStaffOptions.value = allStaffMapped.filter((staff) => isSupportStaffProviderType(staff.appointment_provider_type))
  specialtyTagOptions.value = specialtyTags?.content ?? []
  sessionServices.value = sessionLookupPage.data?.content ?? []
  createLookupsClinicId.value = lookupClinicId
  await loadTreatmentAreaOptions()

  await loadSinglePayServices()
}

const openCreateDialog = async (): Promise<void> => {
  if (
    !patientOptions.value.length ||
    !doctorOptions.value.length ||
    !clinicOptions.value.length ||
    !specialtyTagOptions.value.length ||
    createLookupsClinicId.value !== selectedClinicId.value
  ) {
    await loadCreateLookups()
  } else {
    await loadSinglePayServices()
  }
  createPatient.value = undefined
  createDoctor.value = undefined
    createReferringDoctor.value = undefined
    createSupportStaff.value = undefined
  createPhase.value = "SESSION"
  createLocationContext.value = "IN_CLINIC"
  isCreateLocationContextAuto.value = false
  createSpecialtyTag.value = undefined
  createTreatmentArea.value = undefined
  createBillingType.value = "SELF_PAY_SINGLE"
  createBillingNotes.value = ""
  createLguProgramId.value = undefined
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
  if (!createDoctor.value) {
    errorToast(toast, "Assigned PT is required")
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
      referring_doctor_id: createReferringDoctor.value,
      support_staff_id: createSupportStaff.value,
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
    lgu_program_id: createBillingType.value === "LGU_BILLING" ? createLguProgramId.value : undefined,
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
    errorToast(
      toast,
      extractApiErrorMessage(
        error,
        "Could not create appointment. Verify patient, PT, services, and schedule, then try again."
      )
    )
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
      signatureDataUrl: selectedEncounterTicket.value.patient_signature_data_url,
      sessionSequenceLabel: snapshot?.session_sequence_label
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
  const snapshot = readStoredAuthSnapshot()
  roleName.value = snapshot.roleName
  permissionSet.value = snapshot.permissions
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
    name: "patients",
    query: {
      patientId: String(selectedDetail.value.patient_id),
      name: selectedDetail.value.patient_name
    }
  })
}

const goToBilling = async (): Promise<void> => {
  if (!selectedDetail.value) return
  await router.push({
    name: "billing",
    query: {
      patientId: String(selectedDetail.value.patient_id),
      appointmentId: String(selectedDetail.value.id),
      ...(selectedDetail.value.billing_id ? {billingId: String(selectedDetail.value.billing_id)} : {})
    }
  })
}

const openTenderPaymentDrawer = async (): Promise<void> => {
  if (!selectedDetail.value?.billing_id) return
  billingOverlayMode.value = 'detail'
  await router.replace({
    query: {
      patientId: String(selectedDetail.value.patient_id),
      appointmentId: String(selectedDetail.value.id),
      billingId: String(selectedDetail.value.billing_id),
      openMode: 'tender'
    }
  })
  billingOverlayVisible.value = true
}

const onBillingOverlayClose = (): void => {
  billingOverlayVisible.value = false
  void router.replace({query: {}})
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
  createLookupsClinicId.value = undefined
  if (createPatient.value && !patientOptions.value.some(option => option.id === createPatient.value && option.clinic_id === selectedClinicId.value)) {
    createPatient.value = undefined
  }
  if (createDoctor.value && !doctorOptions.value.some(option => option.id === createDoctor.value && option.clinic_id === selectedClinicId.value)) {
    createDoctor.value = undefined
  }
  if (createReferringDoctor.value && !referringDoctorOptions.value.some(option => option.id === createReferringDoctor.value && option.clinic_id === selectedClinicId.value)) {
    createReferringDoctor.value = undefined
  }
  if (createSupportStaff.value && !supportStaffOptions.value.some(option => option.id === createSupportStaff.value && option.clinic_id === selectedClinicId.value)) {
    createSupportStaff.value = undefined
  }
  if (createVisible.value) {
    await loadCreateLookups()
  }

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
  if (selectedPatientOption?.clinic_id && selectedPatientOption.clinic_id !== selectedClinicId.value) {
    createPatient.value = undefined
  }
})

watch(createDoctor, (doctorId, previousDoctorId) => {
  const selectedDoctorOption = doctorOptions.value.find(option => option.id === doctorId)
  const previousDoctorOption = doctorOptions.value.find(option => option.id === previousDoctorId)

  if (selectedDoctorOption?.clinic_id && selectedDoctorOption.clinic_id !== selectedClinicId.value) {
    createDoctor.value = undefined
    return
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
  if (billingType === "HMO_BILLING" || billingType === "SELF_PAY_PACKAGE") {
    serviceMode.value = "individual"
    selectedBundleId.value = undefined
    selectedServiceLines.value = selectedServiceLines.value.filter(line => line.type !== "bundle")
  }

  if (!isPackageServiceFlowBillingType(billingType)) {
    selectedPackageOfferDetail.value = null
    packageSessionSchedules.value = []
    selectedServiceLines.value = selectedServiceLines.value.filter(line => line.type !== "package")
  }

  if (billingType === "LGU_BILLING" && lguProgramOptions.value.length === 0) {
    billingPhase1Service.getLguPrograms().then(programs => {
      lguProgramOptions.value = programs ?? []
    }).catch(() => { /* silently ignore */ })
  }
  if (billingType !== "LGU_BILLING") {
    createLguProgramId.value = undefined
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
  await fetchBookedDatesForMonth(visibleYear.value, visibleMonth.value)
  await refreshAll()
})
</script>
