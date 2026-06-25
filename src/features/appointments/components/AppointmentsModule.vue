<template>
  <main class="app-page-shell space-y-5">
    <section
      class="app-appointment-card app-appointment-card-accent p-4 sm:p-5"
    >
      <div
        class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="space-y-2">
          <h2 class="app-appointment-title text-xl">Appointments Overview</h2>
          <p class="app-appointment-muted max-w-2xl text-sm leading-6">
            Manage clinic appointments, filter schedules, and review booking
            status from one view.
          </p>
          <div class="flex flex-wrap gap-2 text-xs">
            <span class="app-appointment-chip"
              >Date: {{ selectedDateLabel }}</span
            >
            <span class="app-appointment-chip"
              >Clinic Branch:
              {{ selectedClinic?.label || "All branches" }}</span
            >
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
              <p
                class="app-appointment-muted text-xs font-medium uppercase tracking-wide"
              >
                Total Appointments
              </p>
              <p class="app-appointment-value mt-1 text-2xl font-semibold">
                {{ totalAppointmentsCount }}
              </p>
            </article>
            <article class="app-appointment-summary-card">
              <p
                class="app-appointment-muted text-xs font-medium uppercase tracking-wide"
              >
                Rescheduled / Canceled
              </p>
              <p class="app-appointment-value mt-1 text-2xl font-semibold">
                {{ rescheduledOrCanceledAppointmentsCount }}
              </p>
            </article>
            <article class="app-appointment-summary-card">
              <p
                class="app-appointment-muted text-xs font-medium uppercase tracking-wide"
              >
                Unbilled Appointments
              </p>
              <p class="app-appointment-value mt-1 text-2xl font-semibold">
                {{ unbilledAppointmentsCount }}
              </p>
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
      :selected-clinic-schedule="selectedClinicSchedule"
      @addAppointment="openCreateDialog"
      @selectAppointment="openDetailsDialog"
      @selectDate="selectCalendarDate"
      @visible-range-change="loadCalendarAppointmentsForRange"
    />

    <section class="app-appointment-card space-y-4 p-4 sm:p-5">
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <h3 class="app-appointment-title text-lg">Appointment Records</h3>
          <p class="app-appointment-muted text-sm">
            Search, filter, and manage appointment rows.
          </p>
        </div>
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          severity="secondary"
          outlined
          :loading="isLoading || isCalendarLoading"
          @click="refreshAppointmentViews"
        />
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
        <Select
          v-model="filters.payerType"
          :options="payerOptionsWithAll"
          optionLabel="label"
          optionValue="value"
          placeholder="Billing Type"
          showClear
        />
        <Select
          v-model="filters.billingStatus"
          :options="billingStatusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Billing Status"
          showClear
        />
        <Select
          v-model="filters.attendanceStatus"
          :options="attendanceStatusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Attendance Status"
          showClear
        />
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
          <div class="py-10 text-center text-sm opacity-70">
            No appointments found.
          </div>
        </template>

        <Column
          field="patient_name"
          header="Patient Details"
          style="min-width: 240px"
        >
          <template #body="{ data }">
            <button
              v-if="canViewAppointmentDetails"
              type="button"
              class="text-left"
              @click="openDetailsDialog(data)"
            >
              <div
                class="font-semibold text-[rgb(var(--app-fg))] hover:underline"
              >
                {{ data.patient_name || "Unnamed patient" }}
              </div>
              <div class="mt-0.5 text-xs opacity-60">
                Details include planned services
              </div>
            </button>
            <div v-else>
              <div class="font-semibold text-[rgb(var(--app-fg))]">
                {{ data.patient_name || "Unnamed patient" }}
              </div>
              <div class="mt-0.5 text-xs opacity-60">Details restricted</div>
            </div>
          </template>
        </Column>
        <Column field="starts_at" header="Schedule" style="min-width: 210px">
          <template #body="{ data }">
            <div class="space-y-1">
              <div class="font-medium">{{ formatDate(data.starts_at) }}</div>
              <div class="text-xs opacity-60">
                {{ formatTime(data.starts_at) }} -
                {{ formatTime(data.ends_at) }}
              </div>
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
          <template #body="{ data }">{{
            data.provider_name || "Unassigned"
          }}</template>
        </Column>
        <Column field="clinic_name" header="Clinic" style="min-width: 160px" />
        <Column
          field="payer_type"
          header="Billing Type"
          style="min-width: 150px"
        >
          <template #body="{ data }">
            <Tag :value="formatPayer(data.payer_type)" severity="info" />
          </template>
        </Column>
        <Column header="Billing Status" style="min-width: 150px">
          <template #body="{ data }">
            <Tag
              :value="displayBillingStatus(data)"
              :severity="billingStatusSeverity(data)"
            />
          </template>
        </Column>
        <Column header="Attendance Status" style="min-width: 180px">
          <template #body="{ data }">
            <div class="flex flex-col items-start gap-1">
              <Tag
                :value="displayAttendanceStatus(data)"
                :severity="attendanceStatusSeverity(data)"
              />
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
              <Button
                v-if="canViewAppointmentDetails"
                icon="pi pi-eye"
                text
                rounded
                severity="secondary"
                aria-label="Details"
                @click="openDetailsDialog(data)"
              />
              <Button
                v-if="canMarkAttendance"
                icon="pi pi-check-square"
                text
                rounded
                severity="success"
                aria-label="Attendance"
                @click="openAttendanceDialog(data)"
              />
              <Button
                v-if="canRescheduleSpecificAppointment(data)"
                icon="pi pi-calendar-plus"
                text
                rounded
                severity="warn"
                aria-label="Reschedule"
                @click="openRescheduleDialog(data)"
              />
              <Button
                v-if="canEditAppointment"
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                aria-label="Edit"
                @click="openEditDialog(data)"
              />
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
      :can-reschedule="canRescheduleSpecificAppointment(detailAppointment)"
      :can-mark-attendance="canMarkAttendance"
      :is-billing-action-loading="isBillingActionLoading"
      @edit="editFromDetails"
      @reschedule="rescheduleFromDetails"
      @attendance="openAttendanceFromDetails"
      @open-billing="openAppointmentBillingDialog"
      @create-self-pay-appointment-bill="
        createSelfPayAppointmentBillFromDetails
      "
      @create-self-pay-package-bill="createSelfPayPackageBillFromDetails"
      @create-session-documentation-invoice="
        createSessionDocumentationInvoiceFromDetails
      "
    />

    <Dialog
      v-model:visible="appointmentBillingVisible"
      modal
      header="Appointment Billing"
      :style="{ width: '48rem', maxWidth: '96vw' }"
      :draggable="false"
    >
      <div v-if="detailBillingPreparation" class="space-y-4">
        <section
          class="app-appointment-card app-appointment-card-accent space-y-3"
        >
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <p
                class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
              >
                Billing Path
              </p>
              <h4 class="app-appointment-title mt-1 text-base">
                {{
                  formatBillingPreparationStatus(
                    detailBillingPreparation.billing_path.next_document_type,
                  )
                }}
              </h4>
              <p class="app-appointment-muted mt-1 text-sm">
                {{ detailBillingPreparation.billing_path.message }}
              </p>
            </div>
            <Tag
              :value="
                formatBillingPreparationStatus(
                  detailBillingPreparation.billing_path.status,
                )
              "
              :severity="billingPreparationSeverity"
            />
          </div>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs uppercase tracking-wide">
                Charge Scope
              </p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">
                {{
                  formatBillingPreparationStatus(
                    detailBillingPreparation.billing_path.charge_scope,
                  )
                }}
              </p>
            </div>
            <div class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs uppercase tracking-wide">
                Tendering
              </p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">
                {{
                  detailBillingPreparation.billing_path.requires_tendering
                    ? "Required"
                    : "Not required"
                }}
              </p>
            </div>
            <div class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs uppercase tracking-wide">
                Consumed
              </p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">
                {{ detailBillingPreparation.consumed_services.count }}
              </p>
            </div>
            <div class="app-appointment-summary-card">
              <p class="app-appointment-muted text-xs uppercase tracking-wide">
                Prepared Amount
              </p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">
                {{
                  formatCurrency(
                    detailBillingPreparation.consumed_services.subtotal,
                  )
                }}
              </p>
            </div>
          </div>
        </section>

        <section class="app-appointment-card space-y-3">
          <div
            class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h4 class="app-appointment-title text-base">Billing Actions</h4>
              <p class="app-appointment-muted mt-1 text-sm">
                Create, tender, or print the appointment invoice.
              </p>
            </div>
          </div>

          <div
            v-if="
              detailBillingPreparation.billing_path.action ===
              'CREATE_HMO_CLAIM'
            "
            class="grid grid-cols-1 gap-3 rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3 sm:grid-cols-2"
          >
            <div class="space-y-1">
              <label
                class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
                >LOA Number</label
              >
              <InputText
                v-model="hmoClaimForm.loa_number"
                class="w-full"
                placeholder="Enter LOA number"
              />
            </div>
            <div class="space-y-1">
              <label
                class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
                >Approval Code</label
              >
              <InputText
                v-model="hmoClaimForm.approval_code"
                class="w-full"
                placeholder="Optional approval code"
              />
            </div>
            <div class="space-y-1 sm:col-span-2">
              <label
                class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
                >Claim Notes</label
              >
              <Textarea
                v-model="hmoClaimForm.notes"
                class="w-full"
                rows="2"
                autoResize
                placeholder="Optional HMO claim notes"
              />
            </div>
          </div>

          <div
            v-if="
              detailBillingPreparation.billing_path.action ===
              'CREATE_LGU_CLAIM'
            "
            class="grid grid-cols-1 gap-3 rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3 sm:grid-cols-2"
          >
            <div class="space-y-1">
              <label
                class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
                >Approval Code</label
              >
              <InputText
                v-model="lguClaimForm.approval_code"
                class="w-full"
                placeholder="Optional approval code"
              />
            </div>
            <div class="space-y-1 sm:col-span-2">
              <label
                class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
                >Claim Notes</label
              >
              <Textarea
                v-model="lguClaimForm.notes"
                class="w-full"
                rows="2"
                autoResize
                placeholder="Optional LGU claim notes"
              />
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
              v-if="
                detailBillingPreparation.billing_path.action ===
                'CREATE_SELF_PAY_APPOINTMENT_BILL'
              "
              label="Create Bill / Tender"
              icon="pi pi-wallet"
              size="small"
              :loading="isBillingActionLoading"
              :pt="ptPrimaryBtn"
              @click="createSelfPayAppointmentBillFromDetails"
            />
            <Button
              v-if="
                detailBillingPreparation.billing_path.action ===
                'CREATE_SELF_PAY_PACKAGE_BILL'
              "
              label="Create Package Bill"
              icon="pi pi-box"
              size="small"
              :loading="isBillingActionLoading"
              :pt="ptPrimaryBtn"
              @click="createSelfPayPackageBillFromDetails"
            />
            <Button
              v-if="
                detailBillingPreparation.billing_path.action ===
                'CREATE_DOCUMENTATION_INVOICE'
              "
              label="Create Session Invoice"
              icon="pi pi-file"
              size="small"
              :loading="isBillingActionLoading"
              :pt="ptPrimaryBtn"
              @click="createSessionDocumentationInvoiceFromDetails"
            />
            <Button
              v-if="
                detailBillingPreparation.billing_path.action ===
                'CREATE_HMO_CLAIM'
              "
              label="Create HMO Claim"
              icon="pi pi-file-check"
              size="small"
              :loading="isBillingActionLoading"
              :disabled="!canCreateSponsorClaimFromDetails('HMO')"
              :pt="ptPrimaryBtn"
              @click="createHmoClaimFromDetails"
            />
            <Button
              v-if="
                detailBillingPreparation.billing_path.action ===
                'CREATE_LGU_CLAIM'
              "
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
            <strong class="ml-1">{{
              formatCurrency(tenderableBillingDocument.totals.balance)
            }}</strong>
            <span class="ml-2 text-[rgb(var(--app-fg))]/50">
              {{
                tenderableBillingDocument.document_number ||
                `Document #${tenderableBillingDocument.id}`
              }}
            </span>
          </div>
        </section>
      </div>

      <div
        v-else
        class="app-appointment-card py-8 text-center text-sm text-[rgb(var(--app-fg))]/60"
      >
        Billing preparation is not available for this appointment yet.
      </div>

      <template #footer>
        <Button
          label="Close"
          severity="secondary"
          outlined
          @click="appointmentBillingVisible = false"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="tenderVisible"
      modal
      header="Tender Payment"
      :style="{ width: '44rem', maxWidth: '94vw' }"
      :draggable="false"
    >
      <div v-if="tenderBillingDocument" class="space-y-4">
        <section
          class="app-appointment-card app-appointment-card-accent space-y-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p
                class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
              >
                Billing Document
              </p>
              <h4 class="app-appointment-title mt-1 text-base">
                {{
                  tenderBillingDocument.document_number ||
                  `Document #${tenderBillingDocument.id}`
                }}
              </h4>
            </div>
            <Tag
              :value="tenderBillingDocument.document_status"
              severity="warn"
            />
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">
                Total
              </p>
              <p class="app-appointment-value font-semibold">
                {{ formatCurrency(tenderBillingDocument.totals.total) }}
              </p>
            </div>
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">
                Balance
              </p>
              <p class="app-appointment-value font-semibold">
                {{ formatCurrency(tenderBillingDocument.totals.balance) }}
              </p>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <label
              class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
              >Amount Tendered</label
            >
            <InputNumber
              v-model="tenderForm.amount_tendered"
              mode="currency"
              currency="PHP"
              locale="en-PH"
              class="w-full"
              inputClass="tender-amount-input"
              :min="0"
              :minFractionDigits="0"
              :maxFractionDigits="0"
              @focus="selectNumericInputText"
            />
          </div>
          <div class="space-y-1">
            <label
              class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
              >Payment Method</label
            >
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
            <label
              for="tender-senior-pwd"
              class="text-sm font-semibold text-[rgb(var(--app-fg))]"
            >
              Senior / PWD ID presented
              <span
                class="block text-xs font-normal text-[rgb(var(--app-fg))]/60"
                >Applies 20% privilege discount before custom discount.</span
              >
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
              <label
                class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
                >Custom Discount</label
              >
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
              <label
                class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
                >Discount Value</label
              >
              <InputNumber
                v-model="tenderForm.custom_discount_value"
                class="w-full"
                :min="0"
                :suffix="
                  tenderForm.custom_discount_type === 'PERCENTAGE'
                    ? '%'
                    : undefined
                "
                mode="decimal"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">
                Estimated Discount
              </p>
              <p class="font-semibold text-orange-500">
                {{ formatCurrency(tenderDiscountSummary.discount) }}
              </p>
            </div>
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">
                Amount Due
              </p>
              <p class="app-appointment-value font-semibold">
                {{ formatCurrency(tenderDiscountSummary.amountDue) }}
              </p>
            </div>
            <div>
              <p class="app-appointment-muted text-xs uppercase tracking-wide">
                Change
              </p>
              <p class="font-semibold text-green-600">
                {{ formatCurrency(tenderDiscountSummary.change) }}
              </p>
            </div>
          </div>
        </section>

        <div class="space-y-1">
          <label
            class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
            >Reference</label
          >
          <InputText
            v-model="tenderForm.payment_reference"
            class="w-full"
            placeholder="Optional reference number"
          />
        </div>

        <div class="space-y-1">
          <label
            class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
            >Notes</label
          >
          <Textarea
            v-model="tenderForm.notes"
            class="w-full"
            rows="3"
            autoResize
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="isTenderSaving"
          @click="tenderVisible = false"
        />
        <Button
          label="Save Payment"
          icon="pi pi-check"
          :loading="isTenderSaving"
          :pt="ptPrimaryBtn"
          @click="submitTenderPayment"
        />
      </template>
    </Dialog>

    <Dialog
      v-model:visible="rescheduleVisible"
      modal
      header="Reschedule Appointment"
      :style="{ width: '34rem', maxWidth: '94vw' }"
      :draggable="false"
    >
      <div v-if="rescheduleAppointment" class="space-y-4">
        <section
          class="app-appointment-card app-appointment-card-accent space-y-2"
        >
          <p
            class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
          >
            Patient
          </p>
          <h4 class="app-appointment-title text-base">
            {{ rescheduleAppointment.patient_name }}
          </h4>
          <p class="app-appointment-muted text-sm">
            Current: {{ formatDate(rescheduleAppointment.starts_at) }} ·
            {{ formatTime(rescheduleAppointment.starts_at) }} -
            {{ formatTime(rescheduleAppointment.ends_at) }}
          </p>
        </section>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div class="space-y-1">
            <label
              class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
              >New Date</label
            >
            <DatePicker
              v-model="rescheduleForm.date"
              showIcon
              dateFormat="M dd, yy"
              fluid
            />
          </div>
          <div class="space-y-1">
            <label
              class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
              >Start Time</label
            >
            <DatePicker
              v-model="rescheduleForm.start_time"
              timeOnly
              hourFormat="12"
              showIcon
              fluid
            />
          </div>
          <div class="space-y-1">
            <label
              class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
              >Duration</label
            >
            <InputNumber
              v-model="rescheduleForm.duration_minutes"
              :min="15"
              :max="480"
              suffix=" min"
              showButtons
              fluid
            />
          </div>
        </div>

        <section class="app-appointment-card app-appointment-card-secondary space-y-2">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">New Start</p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">
                {{ reschedulePreviewStartLabel }}
              </p>
            </div>
            <div>
              <p class="app-appointment-muted text-xs font-semibold uppercase tracking-wide">New End</p>
              <p class="app-appointment-value mt-1 text-sm font-semibold">
                {{ reschedulePreviewEndLabel }}
              </p>
            </div>
          </div>
          <p v-if="reschedulePreviewShiftLabel" class="app-appointment-muted text-xs">
            Schedule shift: {{ reschedulePreviewShiftLabel }}
          </p>
          <p v-if="connectedFutureSessionCount > 0" class="app-appointment-muted text-xs">
            {{ connectedFutureSessionCount }} future connected session{{ connectedFutureSessionCount === 1 ? "" : "s" }}
            will move by the same date/time change.
          </p>
        </section>

        <div
          v-if="rescheduleClinicWarning"
          class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
        >
          {{ rescheduleClinicWarning }}
        </div>

        <div class="space-y-1">
          <label
            class="app-appointment-muted text-xs font-semibold uppercase tracking-wide"
            >Reason</label
          >
          <Textarea
            v-model="rescheduleForm.reason"
            class="w-full"
            rows="3"
            autoResize
            placeholder="Optional reason for audit notes"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Cancel"
          severity="secondary"
          outlined
          :disabled="isRescheduling"
          @click="rescheduleVisible = false"
        />
        <Button
          label="Save Reschedule"
          icon="pi pi-calendar-plus"
          severity="warn"
          :loading="isRescheduling"
          @click="submitReschedule"
        />
      </template>
    </Dialog>

    <AppointmentForm
      v-model:visible="formVisible"
      :editing-id="editingId"
      :is-saving="isSaving"
      :is-copying-last-services="isCopyingLastServices"
      :is-follow-up-mode="Boolean(followUpSourceAppointment)"
      :can-create-follow-up="Boolean(editingId && form.credit_account_id && !followUpSourceAppointment)"
      :form="form"
      :session-count="adjustedSessionCountPreview"
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
      @use-last-services="useLastPatientServices"
      @create-follow-up="openFollowUpAppointmentFromForm"
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
      :encounter-ticket="detailFlowSummary?.encounter_ticket ?? null"
      :attendance-items="attendanceItems"
      :is-saving="isSavingAttendance"
      :is-dropping-out="isDroppingOut"
      :can-drop-out-lgu="canDropOutActiveAppointment"
      :dropout-status="activeAppointment?.dropout_status ?? null"
      :format-date="formatDate"
      :format-time="formatTime"
      @drop-out="dropOutActiveAppointment"
      @undo-drop-out="undoDropOutActiveAppointment"
      @save-draft="saveEncounterTicketDraft"
      @create-follow-up="openFollowUpAppointmentFromAttendance"
      @save="saveAttendance"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable, { type DataTablePageEvent } from "primevue/datatable";
import DatePicker from "primevue/datepicker";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Tag from "primevue/tag";
import Textarea from "primevue/textarea";
import { useToast } from "primevue/usetoast";
import { useRouter } from "vue-router";
import AppointmentScheduleCalendar from "@/features/appointments/components/AppointmentScheduleCalendar.vue";
import AppointmentDetailsModal from "@/features/appointments/components/AppointmentDetailsModal.vue";
import AppointmentForm from "@/features/appointments/components/AppointmentForm.vue";
import PlannedServicesModal from "@/features/appointments/components/PlannedServicesModal.vue";
import AttendanceModal from "@/features/appointments/components/AttendanceModal.vue";
import {
  appointmentBillingService,
  type AppointmentBillingDocument,
  type PaymentMethodLookup,
  type AppointmentBillingPreparation,
} from "@/features/appointments/api/appointment-billing.service";
import {
  appointmentPhase1Service,
  type AppointmentDropoutStatus,
  type AppointmentListItem,
  type AppointmentPlannedService,
  type AppointmentLocationContext,
  type AppointmentPhase,
  type AppointmentServiceSelectionType,
  type AppointmentCreatePayload,
  type AppointmentSessionSchedulePayload,
  type AppointmentFlowSummary,
} from "@/features/appointments/api/appointment-phase1.service";
import { clinicService } from "@/features/clinics/api/clinic.service";
import { patientService } from "@/features/patients/api/patient.service";
import type { PatientContext } from "@/features/patients/types/patient";
import {
  serviceCatalogContextService,
  type ServiceCatalogContext,
} from "@/features/services/api/service-catalog-context.service";
import type { PatientHMOInformation } from "@/models/hmo-information";
import { staffService } from "@/features/staff/api/staff.service";
import { ptPrimaryBtn } from "@/features/shared/table-header.styles";
import { useAuthSessionStore } from "@/stores/auth-session.store";
import { clinicStore } from "@/stores/clinic.store";
import { getApiErrorMessage } from "@/utils/actionable-error.util";
import { pamsAPI } from "@/utils/axios-interceptor";
import { errorHandler } from "@/utils/error-handler";
import { Status } from "@/utils/global.type";
import { errorToast, successToast } from "@/utils/toast.util";
import { isPtAppointmentProvider } from "@/utils/appointment-provider.util";

type SelectOption = { label: string; value: number | string | null };
type PayerType = "SELF_PAY_SINGLE" | "SELF_PAY_PACKAGE" | "HMO" | "LGU";
type Laterality = "LEFT" | "RIGHT" | "BOTH" | "BILATERAL" | "NA";
type IncludedServicePreview = {
  name: string;
  quantity: number;
  type?: string;
};

type ServiceOption = {
  label: string;
  value: number;
  pickerValue?: number | string;
  price: number;
  type: AppointmentServiceSelectionType;
  inheritedQuantity: number;
  includedServices: IncludedServicePreview[];
};
type ClinicSelectOption = SelectOption & {
  startDay: number;
  endDay: number;
  startTime: string;
  endTime: string;
};
type PatientSelectOption = SelectOption & { clinicId: number | null };
type SelectedService = ServiceOption & {
  name: string;
  quantity: number;
  typeLabel: string;
};
type AttendanceItem = AppointmentPlannedService & {
  selected: boolean;
  quantity: number;
  remaining: number;
  appointmentConsumed: number;
};
type AttendanceSignaturePayload = {
  patient_signature_data_url?: string | null;
  patient_signature_signed_at?: string | null;
  patient_signature_signed_by?: string | null;
  pt_signature_data_url?: string | null;
  pt_confirmed_at?: string | null;
  pt_completion_tag?: string | null;
  notes?: string | null;
};
type TreatmentAreaOption = SelectOption & {
  clinicId: number | null;
  color?: string | null;
};
type CalendarVisibleRange = { from: Date; to: Date };
type SponsorEligibilityStatus =
  | "available"
  | "active"
  | "missing"
  | "blocked"
  | "loading";
type SponsorEligibilityItem = {
  payerType: PayerType;
  label: string;
  status: SponsorEligibilityStatus;
  detail: string;
};

const toast = useToast();
const router = useRouter();
const branchStore = clinicStore();
const authSession = useAuthSessionStore();

const normalizeDateOnly = (value: Date): Date => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const initialSelectedDate = normalizeDateOnly(new Date());

const addDays = (value: Date, days: number): Date => {
  const date = normalizeDateOnly(value);
  date.setDate(date.getDate() + days);
  return date;
};

const startOfMonth = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth(), 1);

const endOfMonth = (value: Date): Date =>
  new Date(value.getFullYear(), value.getMonth() + 1, 0);

const defaultCalendarRange = (value: Date): CalendarVisibleRange => ({
  from: addDays(startOfMonth(value), -7),
  to: addDays(endOfMonth(value), 7),
});

const activeCalendarRange = ref<CalendarVisibleRange>(
  defaultCalendarRange(initialSelectedDate),
);
const DEFAULT_APPOINTMENT_DURATION_MS = 60 * 60 * 1000;
const MAX_APPOINTMENT_RESCHEDULE_COUNT = 3;

const appointments = ref<AppointmentListItem[]>([]);
const tableAppointmentSource = ref<AppointmentListItem[]>([]);
const calendarAppointments = ref<AppointmentListItem[]>([]);
const availabilityAppointments = ref<AppointmentListItem[]>([]);
const totalRecords = ref(0);
const page = ref(1);
const pageSize = ref(20);

const isLoading = ref(false);
const isCalendarLoading = ref(false);
const isAvailabilityLoading = ref(false);
const isSaving = ref(false);
const isSavingServices = ref(false);
const isSavingAttendance = ref(false);
const isDroppingOut = ref(false);
const isBillingActionLoading = ref(false);
const isTenderSaving = ref(false);
const isPaymentMethodsLoading = ref(false);
const isRescheduling = ref(false);
const isCopyingLastServices = ref(false);

const formVisible = ref(false);
const detailsVisible = ref(false);
const servicesVisible = ref(false);
const attendanceVisible = ref(false);
const appointmentBillingVisible = ref(false);
const tenderVisible = ref(false);
const rescheduleVisible = ref(false);

const editingId = ref<number | null>(null);
const activeAppointment = ref<AppointmentListItem | null>(null);
const detailAppointment = ref<AppointmentListItem | null>(null);
const rescheduleAppointment = ref<AppointmentListItem | null>(null);
const followUpSourceAppointment = ref<AppointmentListItem | null>(null);

const patientOptions = ref<PatientSelectOption[]>([]);
const clinicOptions = ref<ClinicSelectOption[]>([]);
const staffOptions = ref<
  Array<
    SelectOption & {
      clinicId?: number | null;
      providerType?: string;
      secondaryProviderType?: string | null;
      specialtyTagId?: number | null;
    }
  >
>([]);
const appointmentTypeOptions = ref<SelectOption[]>([]);
const appointmentStatusOptions = ref<SelectOption[]>([]);
const specialtyOptions = ref<SelectOption[]>([]);
const treatmentAreaOptions = ref<TreatmentAreaOption[]>([]);
const medicalDiagnoseOptions = ref<SelectOption[]>([]);

type AppointmentServiceCatalog = Record<
  AppointmentServiceSelectionType,
  ServiceOption[]
>;

const emptyServiceCatalog = (): AppointmentServiceCatalog => ({
  PACKAGE: [],
  BUNDLE: [],
  MACHINE: [],
  TECHNIQUE: [],
  EVALUATION: [],
  ADD_ON_MACHINE: [],
  ADD_ON_TECHNIQUE: [],
  ADD_ON_HOME_SERVICE: [],
});

const globalServiceCatalog = ref<AppointmentServiceCatalog>(
  emptyServiceCatalog(),
);
const lguServiceCatalog = ref<AppointmentServiceCatalog>(emptyServiceCatalog());

const selectedServices = ref<SelectedService[]>([]);
const detailFlowSummary = ref<AppointmentFlowSummary | null>(null);
const detailPlannedServices = ref<AppointmentPlannedService[]>([]);
const detailBillingPreparation = ref<AppointmentBillingPreparation | null>(
  null,
);
const tenderBillingDocument = ref<AppointmentBillingDocument | null>(null);
const paymentMethods = ref<PaymentMethodLookup[]>([]);
const servicesModalPlannedServices = ref<AppointmentPlannedService[]>([]);
const attendancePlannedServices = ref<AppointmentPlannedService[]>([]);
const attendanceItems = ref<AttendanceItem[]>([]);
const sessionCountPreview = ref(1);
const selectedPatientContext = ref<PatientContext | null>(null);
const isLoadingPatientContext = ref(false);

type AttendanceStatusFilter = "PENDING" | "COMPLETED" | "CANCELED";

type BillingStatusFilter = "UNBILLED" | "BILLED" | "PAID" | "PARTIALLY_PAID";

const filters = reactive({
  search: "",
  fromDate: initialSelectedDate,
  toDate: initialSelectedDate,
  ptId: null as number | null,
  payerType: null as PayerType | null,
  billingStatus: null as BillingStatusFilter | null,
  attendanceStatus: null as AttendanceStatusFilter | null,
});

const form = reactive({
  patient_id: null as number | null,
  clinic_id: null as number | null,
  primary_provider_staff_id: null as number | null,
  assistant_provider_staff_id: null as number | null,
  intern_provider_staff_id: null as number | null,
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
  credit_account_id: null as number | null,
  notes: "",
  create_all_sessions: true,
  add_initial_evaluation_appointment: false,
  session_dates: [] as Date[],
});

const tenderForm = reactive({
  amount_tendered: 0 as number | null,
  payment_method_id: null as number | null,
  payment_reference: "",
  notes: "",
  senior_pwd_id_presented: false,
  senior_pwd_id_reference: "",
  custom_discount_type: null as "PERCENTAGE" | "FIXED" | null,
  custom_discount_value: 0 as number | null,
});

const selectNumericInputText = (event: Event): void => {
  const input = event.target instanceof HTMLInputElement ? event.target : null;
  window.setTimeout(() => input?.select(), 0);
};

const rescheduleForm = reactive({
  date: null as Date | null,
  start_time: null as Date | null,
  duration_minutes: 60,
  reason: "",
});

const hmoClaimForm = reactive({
  loa_number: "",
  approval_code: "",
  notes: "",
});

const lguClaimForm = reactive({
  approval_code: "",
  notes: "",
});

const servicePicker = reactive({
  type: "TECHNIQUE" as AppointmentServiceSelectionType,
  id: null as number | string | null,
  quantity: 1,
});

const phaseOptions: Array<{ label: string; value: AppointmentPhase }> = [
  { label: "Evaluation", value: "EVAL" },
  { label: "Session", value: "SESSION" },
  { label: "Re-evaluation", value: "RE_EVAL" },
];

const locationOptions: Array<{
  label: string;
  value: AppointmentLocationContext;
}> = [
  { label: "Clinic Branch", value: "IN_CLINIC" },
  { label: "Home Care", value: "HOME_CARE" },
];

const payerOptions: Array<{ label: string; value: PayerType }> = [
  { label: "Self Pay: Single", value: "SELF_PAY_SINGLE" },
  { label: "Self Pay: Package", value: "SELF_PAY_PACKAGE" },
  { label: "HMO", value: "HMO" },
  { label: "LGU", value: "LGU" },
];

const discountTypeOptions: Array<{
  label: string;
  value: "PERCENTAGE" | "FIXED";
}> = [
  { label: "Percentage", value: "PERCENTAGE" },
  { label: "Fixed Amount", value: "FIXED" },
];

const lateralityOptions: Array<{ label: string; value: Laterality }> = [
  { label: "Left", value: "LEFT" },
  { label: "Right", value: "RIGHT" },
  { label: "Both", value: "BOTH" },
  { label: "N/A", value: "NA" },
];

const allServiceTypeOptions: Array<{
  label: string;
  value: AppointmentServiceSelectionType;
}> = [
  { label: "Package", value: "PACKAGE" },
  { label: "Bundle", value: "BUNDLE" },
  { label: "Single Service: Machine", value: "MACHINE" },
  { label: "Single Service: Technique", value: "TECHNIQUE" },
  { label: "Single Service: Evaluation", value: "EVALUATION" },
  { label: "Add-ons", value: "ADD_ON_MACHINE" },
  { label: "Add-ons", value: "ADD_ON_TECHNIQUE" },
  { label: "Home Care Add-ons", value: "ADD_ON_HOME_SERVICE" },
];

const hiddenServiceTypeOptions = new Set<AppointmentServiceSelectionType>([
  "ADD_ON_TECHNIQUE",
]);

const allowedServiceTypesByBillingType: Record<
  PayerType,
  AppointmentServiceSelectionType[]
> = {
  SELF_PAY_SINGLE: [
    "BUNDLE",
    "MACHINE",
    "TECHNIQUE",
    "EVALUATION",
    "ADD_ON_MACHINE",
    "ADD_ON_TECHNIQUE",
    "ADD_ON_HOME_SERVICE",
  ],
  SELF_PAY_PACKAGE: [
    "PACKAGE",
    "BUNDLE",
    "MACHINE",
    "TECHNIQUE",
    "EVALUATION",
    "ADD_ON_MACHINE",
    "ADD_ON_TECHNIQUE",
    "ADD_ON_HOME_SERVICE",
  ],
  HMO: [
    "MACHINE",
    "TECHNIQUE",
    "EVALUATION",
    "ADD_ON_MACHINE",
    "ADD_ON_TECHNIQUE",
    "ADD_ON_HOME_SERVICE",
  ],
  LGU: [
    "PACKAGE",
    "BUNDLE",
    "MACHINE",
    "TECHNIQUE",
    "EVALUATION",
    "ADD_ON_MACHINE",
    "ADD_ON_TECHNIQUE",
    "ADD_ON_HOME_SERVICE",
  ],
};

const homeCareAddOnTypes = new Set<AppointmentServiceSelectionType>([
  "ADD_ON_HOME_SERVICE",
]);

const getAllowedServiceTypes = (
  billingType?: PayerType | null,
): AppointmentServiceSelectionType[] =>
  billingType
    ? allowedServiceTypesByBillingType[billingType]
    : [
        "MACHINE",
        "TECHNIQUE",
        "EVALUATION",
        "ADD_ON_MACHINE",
        "ADD_ON_TECHNIQUE",
        "ADD_ON_HOME_SERVICE",
      ];

const payerOptionsWithAll = computed(() => [
  { label: "All Billing Types", value: null },
  ...payerOptions,
]);

const parseDateOnlyValue = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const isActiveSponsorInfo = (info: PatientHMOInformation): boolean => {
  const today = normalizeDateOnly(new Date());
  const start = parseDateOnlyValue(info.validity_start_date);
  const end = parseDateOnlyValue(info.validity_end_date);
  return (
    (!start || start.getTime() <= today.getTime()) &&
    (!end || end.getTime() >= today.getTime())
  );
};

const activeSponsorInfos = computed(() =>
  (selectedPatientContext.value?.sponsor_information ?? []).filter(
    isActiveSponsorInfo,
  ),
);

const hasActiveHmoSponsor = computed(() =>
  activeSponsorInfos.value.some(
    (info) => String(info.sponsor_context ?? "").toUpperCase() === "HMO",
  ),
);

const hasActiveLguSponsor = computed(() =>
  activeSponsorInfos.value.some(
    (info) => String(info.sponsor_context ?? "").toUpperCase() === "LGU",
  ),
);

const selectedPatientLguStatus = computed(() =>
  String(selectedPatientContext.value?.patient?.lgu_patient_status ?? "")
    .trim()
    .toUpperCase(),
);

const isSelectedPatientLguDroppedOut = computed(
  () =>
    selectedPatientLguStatus.value === "DROPPED_OUT" ||
    selectedPatientLguStatus.value === "CROSS_MONTH_DROPPED_OUT",
);

const isAppointmentPayerTypeAllowed = (
  payerType: PayerType | null | undefined,
): boolean => {
  if (!payerType) return true;
  if (payerType === "SELF_PAY_SINGLE" || payerType === "SELF_PAY_PACKAGE")
    return true;
  if (isLoadingPatientContext.value) return false;
  if (!selectedPatientContext.value) return false;
  if (payerType === "HMO") return hasActiveHmoSponsor.value;
  if (payerType === "LGU")
    return hasActiveLguSponsor.value && !isSelectedPatientLguDroppedOut.value;
  return false;
};

const appointmentPayerOptions = computed(() =>
  payerOptions.filter((option) => isAppointmentPayerTypeAllowed(option.value)),
);

const sponsorBillingEligibility = computed<SponsorEligibilityItem[]>(() => {
  if (!form.patient_id) {
    return [
      {
        payerType: "SELF_PAY_SINGLE",
        label: "Self Pay",
        status: "available",
        detail: "Available without sponsor information",
      },
      {
        payerType: "HMO",
        label: "HMO",
        status: "missing",
        detail: "Select a patient to check sponsor information",
      },
      {
        payerType: "LGU",
        label: "LGU",
        status: "missing",
        detail: "Select a patient to check sponsor information",
      },
    ];
  }

  if (isLoadingPatientContext.value) {
    return [
      {
        payerType: "SELF_PAY_SINGLE",
        label: "Self Pay",
        status: "available",
        detail: "Available without sponsor information",
      },
      {
        payerType: "HMO",
        label: "HMO",
        status: "loading",
        detail: "Checking HMO sponsor information",
      },
      {
        payerType: "LGU",
        label: "LGU",
        status: "loading",
        detail: "Checking LGU sponsor information",
      },
    ];
  }

  const lguStatus = isSelectedPatientLguDroppedOut.value
    ? "Patient LGU profile is dropped out. New LGU availments are blocked."
    : hasActiveLguSponsor.value
      ? "Active LGU sponsor information found"
      : "No active LGU sponsor information";

  return [
    {
      payerType: "SELF_PAY_SINGLE",
      label: "Self Pay",
      status: "available",
      detail: "Available without sponsor information",
    },
    {
      payerType: "HMO",
      label: "HMO",
      status: hasActiveHmoSponsor.value ? "active" : "missing",
      detail: hasActiveHmoSponsor.value
        ? "Active HMO sponsor information found"
        : "No active HMO sponsor information",
    },
    {
      payerType: "LGU",
      label: "LGU",
      status: isSelectedPatientLguDroppedOut.value
        ? "blocked"
        : hasActiveLguSponsor.value
          ? "active"
          : "missing",
      detail: lguStatus,
    },
  ];
});

const billingStatusOptions: Array<{
  label: string;
  value: BillingStatusFilter | null;
}> = [
  { label: "All Billing Status", value: null },
  { label: "Unbilled", value: "UNBILLED" },
  { label: "Billed", value: "BILLED" },
  { label: "Paid", value: "PAID" },
  { label: "Partially Paid", value: "PARTIALLY_PAID" },
];

const attendanceStatusOptions: Array<{
  label: string;
  value: AttendanceStatusFilter | null;
}> = [
  { label: "All Attendance Status", value: null },
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Canceled", value: "CANCELED" },
];

const activeBranchId = computed(() => branchStore.selectedClinicId ?? null);

const formBranchId = computed(
  () => form.clinic_id ?? activeBranchId.value ?? null,
);

const patientOptionsForClinic = computed(() =>
  formBranchId.value
    ? patientOptions.value.filter(
        (option) =>
          option.clinicId === Number(formBranchId.value),
      )
    : patientOptions.value,
);

const isOptionInFormBranch = (option: { clinicId?: number | null }): boolean =>
  !formBranchId.value || option.clinicId === Number(formBranchId.value);

const ptOptions = computed(() =>
  staffOptions.value.filter(
    (option) =>
      isOptionInFormBranch(option) &&
      (option.providerType === "PHYSICAL_THERAPIST" ||
        option.providerType === "PT_ASSISTANT" ||
        option.providerType === "INTERN" ||
        option.secondaryProviderType === "PHYSICAL_THERAPIST" ||
        option.secondaryProviderType === "PT_ASSISTANT" ||
        option.secondaryProviderType === "INTERN"),
  ),
);

const doctorOptions = computed(() =>
  staffOptions.value.filter(
    (option) =>
      isOptionInFormBranch(option) &&
      (option.providerType === "DOCTOR_CONSULTANT" ||
        option.secondaryProviderType === "DOCTOR_CONSULTANT"),
  ),
);

const ptFilterOptions = computed<Array<SelectOption>>(() => [
  { label: "All PT", value: null },
  ...ptOptions.value,
]);

const currentServiceBillingType = computed(() =>
  servicesVisible.value
    ? (activeAppointment.value?.payer_type as PayerType | null)
    : form.payer_type,
);

const serviceTypeOptions = computed(() => {
  const allowed = new Set(
    getAllowedServiceTypes(currentServiceBillingType.value),
  );
  return allServiceTypeOptions.filter(
    (option) =>
      allowed.has(option.value) && !hiddenServiceTypeOptions.has(option.value),
  );
});

const currentServiceCatalog = computed(() =>
  currentServiceBillingType.value === "LGU"
    ? lguServiceCatalog.value
    : globalServiceCatalog.value,
);

const currentServiceOptions = computed(() => {
  if (servicePicker.type !== "ADD_ON_MACHINE") {
    return currentServiceCatalog.value[servicePicker.type] ?? [];
  }

  return [
    ...currentServiceCatalog.value.ADD_ON_MACHINE.map((option) => ({
      ...option,
      pickerValue: `${option.type}:${option.value}`,
    })),
    ...currentServiceCatalog.value.ADD_ON_TECHNIQUE.map((option) => ({
      ...option,
      pickerValue: `${option.type}:${option.value}`,
    })),
  ];
});

const clinicAreaOptions = computed(() =>
  treatmentAreaOptions.value.filter(
    (option) => !form.clinic_id || option.clinicId === form.clinic_id,
  ),
);

const selectedClinic = computed(
  () =>
    clinicOptions.value.find((option) => option.value === form.clinic_id) ??
    clinicOptions.value.find(
      (option) => option.value === activeBranchId.value,
    ) ??
    clinicOptions.value.find(
      (option) => option.value === appointments.value[0]?.clinic_id,
    ) ??
    clinicOptions.value.find(
      (option) => option.value === calendarAppointments.value[0]?.clinic_id,
    ) ??
    null,
);

const selectedClinicSchedule = computed(
  () =>
    clinicOptions.value.find((option) => option.value === form.clinic_id) ??
    clinicOptions.value.find(
      (option) => option.value === activeBranchId.value,
    ) ??
    null,
);

const clinicScheduleById = (clinicId?: number | null): ClinicSelectOption | null =>
  clinicOptions.value.find((option) => Number(option.value) === Number(clinicId)) ?? null;

const paymentMethodOptions = computed<SelectOption[]>(() =>
  paymentMethods.value.map((method) => ({
    label: method.name,
    value: method.id,
  })),
);

const combineDateAndTime = (dateValue: Date | null, timeValue: Date | null): Date | null => {
  if (!dateValue || !timeValue) return null;
  const result = new Date(dateValue);
  result.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
  return result;
};

const connectedFutureSessionCount = computed(() => {
  const appointment = rescheduleAppointment.value;
  if (!appointment) return 0;
  const currentSequence = Number(appointment.session_sequence ?? 1);
  const totalSessions = Number(appointment.total_sessions ?? 1);
  if (!Number.isFinite(currentSequence) || !Number.isFinite(totalSessions)) return 0;
  return Math.max(0, totalSessions - currentSequence);
});

const reschedulePreviewStart = computed(() =>
  combineDateAndTime(rescheduleForm.date, rescheduleForm.start_time),
);

const reschedulePreviewEnd = computed(() => {
  const start = reschedulePreviewStart.value;
  if (!start) return null;
  const durationMinutes = Math.max(15, Number(rescheduleForm.duration_minutes || 60));
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
});

const formatDateTimePreview = (date: Date | null): string => {
  if (!date) return "Select a date and time";
  const payload = toDateTimePayload(date) as string;
  return `${formatDate(payload)} - ${formatTime(payload)}`;
};

const reschedulePreviewStartLabel = computed(() =>
  formatDateTimePreview(reschedulePreviewStart.value),
);

const reschedulePreviewEndLabel = computed(() =>
  formatDateTimePreview(reschedulePreviewEnd.value),
);

const reschedulePreviewShiftLabel = computed(() => {
  const appointment = rescheduleAppointment.value;
  const nextStart = reschedulePreviewStart.value;
  if (!appointment || !nextStart) return "";

  const currentStart = new Date(appointment.starts_at);
  const deltaMinutes = Math.round((nextStart.getTime() - currentStart.getTime()) / 60000);
  if (!Number.isFinite(deltaMinutes) || deltaMinutes === 0) return "no date/time change";

  const absoluteMinutes = Math.abs(deltaMinutes);
  const days = Math.floor(absoluteMinutes / 1440);
  const hours = Math.floor((absoluteMinutes % 1440) / 60);
  const minutes = absoluteMinutes % 60;
  const parts = [
    days ? `${days} day${days === 1 ? "" : "s"}` : "",
    hours ? `${hours} hour${hours === 1 ? "" : "s"}` : "",
    minutes ? `${minutes} minute${minutes === 1 ? "" : "s"}` : "",
  ].filter(Boolean);

  return `${parts.join(" ") || "0 minutes"} ${deltaMinutes > 0 ? "later" : "earlier"}`;
});

const rescheduleClinicWarning = computed(() => {
  const start = reschedulePreviewStart.value;
  const end = reschedulePreviewEnd.value;
  if (!start || !end || !rescheduleAppointment.value) return "";

  const clinicSchedule = clinicScheduleById(rescheduleAppointment.value.clinic_id);
  const withinClinicHours = isScheduleWithinClinicHours(start, end, clinicSchedule);
  const clinicHoursLabel = formatClinicHours(clinicSchedule);

  return withinClinicHours ? "" : `Choose a time within ${clinicHoursLabel}.`;
});

const largestTenderLineTotal = (
  lines: AppointmentBillingDocument["lines"] = [],
): number =>
  lines.reduce(
    (max, line) =>
      Math.max(
        max,
        Number(line.line_total ?? 0),
        largestTenderLineTotal(line.children),
      ),
    0,
  );

const tenderDiscountSummary = computed(() => {
  const document = tenderBillingDocument.value;
  const subtotal = Number(
    document?.totals.subtotal ?? document?.totals.total ?? 0,
  );
  const paid = Number(document?.totals.paid ?? 0);
  const existingDiscount = Number(document?.totals.discount ?? 0);
  const seniorTargetAmount =
    largestTenderLineTotal(document?.lines) || subtotal;
  const seniorDiscount = tenderForm.senior_pwd_id_presented
    ? Math.max(0, seniorTargetAmount * 0.2)
    : 0;
  const remainingAfterSenior = Math.max(0, subtotal - seniorDiscount);
  const customValue = Number(tenderForm.custom_discount_value ?? 0);
  const customDiscount =
    tenderForm.custom_discount_type && customValue > 0
      ? tenderForm.custom_discount_type === "PERCENTAGE"
        ? remainingAfterSenior * (customValue / 100)
        : customValue
      : 0;
  const requestedDiscount = Math.min(subtotal, seniorDiscount + customDiscount);
  const discount = requestedDiscount > 0 ? requestedDiscount : existingDiscount;
  const totalAfterDiscount = Math.max(
    0,
    subtotal - discount + Number(document?.totals.tax ?? 0),
  );
  return {
    discount,
    amountDue: Math.max(0, totalAfterDiscount - paid),
    change: Math.max(
      0,
      Number(tenderForm.amount_tendered ?? 0) -
        Math.max(0, totalAfterDiscount - paid),
    ),
  };
});

const pendingStatusOption = computed(
  () =>
    appointmentStatusOptions.value.find(
      (option) => String(option.label).toLowerCase() === "pending",
    ) ??
    appointmentStatusOptions.value.find((option) =>
      String(option.label).toLowerCase().includes("pending"),
    ) ??
    appointmentStatusOptions.value[0] ??
    null,
);

const appointmentStatusLabel = computed(() =>
  editingId.value
    ? (appointmentStatusOptions.value.find(
        (option) => option.value === form.appointment_status_id,
      )?.label ?? "Updated by attendance")
    : (pendingStatusOption.value?.label ?? "Pending"),
);

const selectedDateLabel = computed(() => {
  const date = filters.fromDate ?? form.starts_at ?? new Date();
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
});

const totalAppointmentsCount = computed(() => totalRecords.value);

const rescheduledOrCanceledAppointmentsCount = computed(
  () =>
    tableAppointmentSource.value.filter(
      (appointment) =>
        normalizeAttendanceStatus(appointment) === "CANCELED" ||
        isRescheduledAppointment(appointment),
    ).length,
);

const unbilledAppointmentsCount = computed(
  () =>
    tableAppointmentSource.value.filter(
      (appointment) => normalizeBillingStatus(appointment) === "UNBILLED",
    ).length,
);

const canUseAppointmentPermission = (...permissions: string[]): boolean =>
  authSession.isOwnerEquivalent || authSession.hasAnyPermission(...permissions);

const isPtRestrictedUser = computed(() =>
  isPtAppointmentProvider(authSession.currentUser) && !authSession.isOwnerEquivalent
);

const canViewAppointmentDetails = computed(() =>
  canUseAppointmentPermission("Appointment::READ", "Appointment::LOOKUP"),
);

const canCreateAppointment = computed(() =>
  !isPtRestrictedUser.value && canUseAppointmentPermission("Appointment::CREATE"),
);

const canEditAppointment = computed(() =>
  !isPtRestrictedUser.value && canUseAppointmentPermission("Appointment::UPDATE"),
);

const canRescheduleAppointment = computed(() => canEditAppointment.value);

const hasReachedRescheduleLimit = (appointment?: AppointmentListItem | null): boolean =>
  Number(appointment?.reschedule_count ?? 0) >= MAX_APPOINTMENT_RESCHEDULE_COUNT;

const canRescheduleSpecificAppointment = (appointment?: AppointmentListItem | null): boolean =>
  canRescheduleAppointment.value && !hasReachedRescheduleLimit(appointment);

const canCancelAppointment = computed(() =>
  !isPtRestrictedUser.value && canUseAppointmentPermission(
    "Appointment::DELETE",
    "Appointment::MANAGE_STATUS",
  ),
);

const canMarkAttendance = computed(() =>
  canUseAppointmentPermission(
    "Appointment::UPDATE",
    "Appointment::MANAGE_STATUS",
  ),
);

const canManageAppointmentBilling = computed(() =>
  !isPtRestrictedUser.value && canUseAppointmentPermission(
    "Appointment::MANAGE_BILL",
    "Patient::MANAGE_BILLS",
  ),
);

const normalizePayerType = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const isLguAppointment = (
  appointment: AppointmentListItem | null | undefined,
): boolean => {
  if (!appointment) return false;

  const valuesToCheck = [
    appointment.payer_type,
    (appointment as any).billing_type,
    (appointment as any).source_type,
    (appointment as any).payment_source,
    (appointment as any).contract_type,
    (appointment as any).sponsor_context,
  ];

  return (
    valuesToCheck.some((value) => {
      const normalized = normalizePayerType(value);
      return normalized === "LGU" || normalized === "LGU_BILLING";
    }) ||
    Boolean((appointment as any).lgu_patient_id) ||
    Boolean((appointment as any).lgu_contract_id)
  );
};

const canDropOutActiveAppointment = computed(() => {
  const appointment = activeAppointment.value;
  if (!appointment) return false;

  return isLguAppointment(appointment) && canManageAppointmentBilling.value;
});

const getMonthDateRange = (date: Date): { from: Date; to: Date } => ({
  from: new Date(date.getFullYear(), date.getMonth(), 1),
  to: new Date(date.getFullYear(), date.getMonth() + 1, 0),
});

const resolveDropoutStatusForAppointment = async (
  appointment: AppointmentListItem,
): Promise<AppointmentDropoutStatus> => {
  const appointmentStart = new Date(appointment.starts_at);
  if (Number.isNaN(appointmentStart.getTime())) return "DROPPED_OUT";

  const { from, to } = getMonthDateRange(appointmentStart);
  const result = await appointmentPhase1Service.getAll({
    page: 1,
    size: 1000,
    patient_id: appointment.patient_id,
    from_date: toDateParam(from),
    to_date: toDateParam(to),
  });

  const firstLguAppointmentThisMonth = (result.content ?? [])
    .filter((item) => item.patient_id === appointment.patient_id)
    .filter(isLguAppointment)
    .filter((item) => {
      const startsAt = new Date(item.starts_at);
      return !Number.isNaN(startsAt.getTime());
    })
    .sort(
      (left, right) =>
        new Date(left.starts_at).getTime() -
          new Date(right.starts_at).getTime() ||
        Number(left.id) - Number(right.id),
    )[0];

  return firstLguAppointmentThisMonth?.id === appointment.id
    ? "CROSS_MONTH_DROPPED_OUT"
    : "DROPPED_OUT";
};

const toDateParam = (date: Date | null): string | undefined => {
  if (!date) return undefined;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const toDateTimePayload = (date: Date | null): string | undefined => {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatTime = (value: string): string =>
  new Date(value).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });

const formatPayer = (value?: string | null): string =>
  value ? value.split("_").join(" ") : "Unassigned";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(value ?? 0),
  );

const formatBillingPreparationStatus = (value?: string | null): string =>
  String(value ?? "N/A")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const billingPreparationSeverity = computed<
  "success" | "warn" | "danger" | "info"
>(() => {
  const preparation = detailBillingPreparation.value;
  if (!preparation) return "info";
  if (preparation.billing_path.documentation_only) return "info";
  if (
    preparation.billing_path.requires_tendering ||
    preparation.billing_path.requires_loa
  )
    return "warn";
  return "success";
});

const tenderableBillingDocument = computed<AppointmentBillingDocument | null>(
  () => {
    const preparation = detailBillingPreparation.value;
    if (!preparation) return null;
    if (
      preparation.billing_path.payer_type !== "SELF_PAY_SINGLE" &&
      preparation.billing_path.payer_type !== "SELF_PAY_PACKAGE"
    )
      return null;

    const document = preparation.existing_documents.find(
      (existing) =>
        ["APPOINTMENT_INVOICE", "PACKAGE_INVOICE"].includes(
          existing.document_type,
        ) &&
        !["PAID", "VOID", "CANCELLED"].includes(
          String(existing.document_status).toUpperCase(),
        ) &&
        Number(existing.totals?.balance ?? 0) > 0,
    );

    return document
      ? {
          id: document.id,
          document_number: document.document_number,
          document_type: document.document_type,
          document_status: document.document_status,
          payer_type: preparation.billing_path.payer_type,
          document_date: document.document_date,
          totals: document.totals,
        }
      : null;
  },
);

const formatOptionalNumber = (value?: number | null): string | undefined =>
  value === undefined || value === null ? undefined : String(value);

const serviceTypeLabel = (value: AppointmentServiceSelectionType): string =>
  allServiceTypeOptions.find((option) => option.value === value)?.label ??
  value;

const displayAppointmentPhase = (value?: AppointmentPhase | string): string =>
  phaseOptions.find((option) => option.value === value)?.label ??
  String(value ?? "Unassigned");

const displayLocationContext = (
  value?: AppointmentLocationContext | string,
): string =>
  locationOptions.find((option) => option.value === value)?.label ??
  String(value ?? "Unassigned");

const displayLaterality = (value?: string | null): string => {
  if (!value) return "Not recorded";
  if (value === "BILATERAL") return "Both";
  return (
    lateralityOptions.find((option) => option.value === value)?.label ?? value
  );
};

const normalizeTextToken = (value?: string | null): string =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

const normalizeBillingStatus = (
  appointment: AppointmentListItem,
): BillingStatusFilter | string => {
  const normalized = normalizeTextToken((appointment as any).billing_status);
  if (normalized.includes("PARTIAL")) return "PARTIALLY_PAID";
  if (normalized.includes("UNBILLED") || normalized.includes("NEEDS_BILLING"))
    return "UNBILLED";
  if (normalized.includes("PAID")) return "PAID";
  if (normalized.includes("BILLED")) return "BILLED";
  return normalized || "UNBILLED";
};

const displayBillingStatus = (appointment: AppointmentListItem): string => {
  const status = normalizeBillingStatus(appointment);
  if (status === "PARTIALLY_PAID") return "Partially Paid";
  return String(status)
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const billingStatusSeverity = (
  appointment: AppointmentListItem,
): "success" | "warn" | "danger" | "info" => {
  const status = normalizeBillingStatus(appointment);
  if (status === "PAID") return "success";
  if (status === "UNBILLED") return "danger";
  if (status === "PARTIALLY_PAID") return "warn";
  return "info";
};

const getAppointmentNumberField = (
  appointment: AppointmentListItem,
  keys: string[],
): number | null => {
  for (const key of keys) {
    const value = Number((appointment as any)[key]);
    if (Number.isFinite(value)) return value;
  }
  return null;
};

const hasAllCreditsConsumed = (appointment: AppointmentListItem): boolean => {
  const consumed = getAppointmentNumberField(appointment, [
    "consumed_credits",
    "consumed_credit_count",
    "consumed_quantity",
    "finished_services_count",
    "completed_services_count",
  ]);
  const total = getAppointmentNumberField(appointment, [
    "total_credits",
    "total_credit_count",
    "planned_quantity",
    "planned_services_count",
    "total_services_count",
  ]);
  return consumed !== null && total !== null && total > 0 && consumed >= total;
};

const normalizeAttendanceStatus = (
  appointment: AppointmentListItem,
): AttendanceStatusFilter => {
  const rawStatus = normalizeTextToken(
    (appointment as any).attendance_status ??
      (appointment as any).attendanceStatus ??
      (appointment as any).appointment_status,
  );

  if (rawStatus.includes("CANCEL") || rawStatus.includes("NO_SHOW"))
    return "CANCELED";
  if (
    rawStatus.includes("COMPLETE") ||
    rawStatus.includes("ATTENDED") ||
    rawStatus.includes("PRESENT")
  )
    return "COMPLETED";
  if (hasAllCreditsConsumed(appointment)) return "COMPLETED";
  return "PENDING";
};

const displayAttendanceStatus = (appointment: AppointmentListItem): string => {
  const status = normalizeAttendanceStatus(appointment);
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELED") return "Canceled";
  return "Pending";
};

const attendanceStatusSeverity = (
  appointment: AppointmentListItem,
): "success" | "warn" | "danger" | "info" => {
  const status = normalizeAttendanceStatus(appointment);
  if (status === "COMPLETED") return "success";
  if (status === "CANCELED") return "danger";
  return "warn";
};

const statusSeverity = (
  value?: string,
): "success" | "warn" | "danger" | "info" => {
  const normalized = normalizeTextToken(value);
  if (normalized.includes("CANCEL") || normalized.includes("NO_SHOW"))
    return "danger";
  if (
    normalized.includes("COMPLETE") ||
    normalized.includes("ATTENDED") ||
    normalized.includes("PRESENT")
  )
    return "success";
  return "warn";
};

const isRescheduledAppointment = (
  appointment: AppointmentListItem,
): boolean => {
  const rawStatus = normalizeTextToken((appointment as any).appointment_status);
  return (
    rawStatus.includes("RESCHEDULE") ||
    Boolean((appointment as any).reschedule_flag) ||
    Number((appointment as any).reschedule_count ?? 0) > 0
  );
};

const getAppointmentDurationMs = (): number => {
  if (!form.starts_at || !form.ends_at) return DEFAULT_APPOINTMENT_DURATION_MS;
  return Math.max(
    15 * 60 * 1000,
    form.ends_at.getTime() - form.starts_at.getTime(),
  );
};

const getDefaultAppointmentEnd = (start: Date): Date =>
  new Date(start.getTime() + DEFAULT_APPOINTMENT_DURATION_MS);

const isWithinOneMinute = (left: Date, right: Date): boolean =>
  Math.abs(left.getTime() - right.getTime()) < 60 * 1000;

const getDayNumber = (date: Date): number => {
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

const timeToMinutes = (value?: string | null, fallback = 0): number => {
  const [hours, minutes] = String(value ?? "")
    .split(":")
    .map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback;
  return hours * 60 + minutes;
};

const setTimeFromMinutes = (date: Date, minutes: number): Date => {
  const result = new Date(date);
  result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return result;
};

const isClinicOpenOnDate = (date: Date, schedule = selectedClinicSchedule.value): boolean => {
  if (!schedule) return true;

  const day = getDayNumber(date);
  const startDay = Number(schedule.startDay);
  const endDay = Number(schedule.endDay);

  if (!Number.isFinite(startDay) || !Number.isFinite(endDay)) return true;
  if (startDay <= endDay) return day >= startDay && day <= endDay;

  return day >= startDay || day <= endDay;
};

const moveToNextClinicOpenDate = (date: Date): Date => {
  const next = new Date(date);

  for (let attempt = 0; attempt < 14; attempt += 1) {
    if (isClinicOpenOnDate(next)) return next;
    next.setDate(next.getDate() + 1);
  }

  return next;
};

const clampAppointmentStartToClinicHours = (date: Date, durationMs = DEFAULT_APPOINTMENT_DURATION_MS): Date => {
  const openDate = moveToNextClinicOpenDate(new Date(date));
  const schedule = selectedClinicSchedule.value;
  if (!schedule) return openDate;

  const startMinute = timeToMinutes(schedule.startTime, 7 * 60);
  const endMinute = timeToMinutes(schedule.endTime, 19 * 60);
  const selectedMinute = openDate.getHours() * 60 + openDate.getMinutes();
  const durationMinutes = Math.ceil(durationMs / 60000);
  const latestStartMinute = Math.max(startMinute, endMinute - durationMinutes);
  const clampedMinute = Math.min(Math.max(selectedMinute, startMinute), latestStartMinute);

  return setTimeFromMinutes(openDate, clampedMinute);
};

const isScheduleWithinClinicHours = (start: Date, end: Date, schedule: ClinicSelectOption | null): boolean => {
  if (!schedule) return true;
  if (!isClinicOpenOnDate(start, schedule)) return false;
  if (dateTimeKey(start).slice(0, 10) !== dateTimeKey(end).slice(0, 10)) return false;

  const startMinute = start.getHours() * 60 + start.getMinutes();
  const endMinute = end.getHours() * 60 + end.getMinutes();
  return startMinute >= timeToMinutes(schedule.startTime, 7 * 60)
    && endMinute <= timeToMinutes(schedule.endTime, 19 * 60);
};

const isScheduleWithinSelectedClinicHours = (start: Date, end: Date): boolean =>
  isScheduleWithinClinicHours(start, end, selectedClinicSchedule.value);

const formatClinicHours = (schedule: ClinicSelectOption | null): string => {
  if (!schedule) return "the selected clinic hours";
  return `${formatTime(`2000-01-01T${schedule.startTime}`)} - ${formatTime(`2000-01-01T${schedule.endTime}`)}`;
};

const formatSelectedClinicHours = (): string =>
  formatClinicHours(selectedClinicSchedule.value);

const copyTime = (targetDate: Date, sourceTime: Date): Date => {
  const result = new Date(targetDate);
  result.setHours(
    sourceTime.getHours(),
    sourceTime.getMinutes(),
    sourceTime.getSeconds(),
    sourceTime.getMilliseconds(),
  );
  return result;
};

const serviceSessionQuantity = (service: SelectedService): number => {
  const inherited = Number(service.inheritedQuantity ?? 0);
  const selected = Number(service.quantity ?? 0);
  const includedMax = Math.max(
    0,
    ...(service.includedServices ?? []).map((item) =>
      Number(item.quantity ?? 0),
    ),
  );

  return Math.max(1, inherited, selected, includedMax);
};

const servicePayloadQuantity = (service: SelectedService): number =>
  service.type === "PACKAGE" ? 1 : Math.max(1, Number(service.quantity ?? 1));

const serviceCatalogForBillingType = (
  billingType: PayerType | null,
): AppointmentServiceCatalog =>
  billingType === "LGU" ? lguServiceCatalog.value : globalServiceCatalog.value;

const isSupportedServiceSelectionType = (
  value: unknown,
): value is AppointmentServiceSelectionType =>
  allServiceTypeOptions.some((option) => option.value === value);

const normalizeServiceName = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const plannedServiceQuantity = (
  service: AppointmentPlannedService,
  option: ServiceOption,
): number => {
  if (option.type === "PACKAGE") return 1;

  return Math.max(
    1,
    Number(
      service.selected_quantity ??
        service.planned_quantity ??
        service.included_quantity ??
        option.inheritedQuantity ??
        1,
    ),
  );
};

const plannedServiceToSelectedService = (
  service: AppointmentPlannedService,
  billingType: PayerType,
): SelectedService | null => {
  if (!isSupportedServiceSelectionType(service.type)) return null;

  const allowed = new Set(getAllowedServiceTypes(billingType));
  if (!allowed.has(service.type)) return null;

  const catalogOptions = serviceCatalogForBillingType(billingType)[service.type] ?? [];
  const serviceId = Number(service.service_id ?? 0);
  const serviceName = normalizeServiceName(service.service_name);
  const option =
    (serviceId > 0
      ? catalogOptions.find((item) => Number(item.value) === serviceId)
      : undefined) ??
    catalogOptions.find((item) => normalizeServiceName(item.label) === serviceName);

  if (!option) return null;

  return {
    ...option,
    name: option.label,
    quantity: plannedServiceQuantity(service, option),
    typeLabel: serviceTypeLabel(option.type),
  };
};

const isTopLevelPlannedService = (
  service: AppointmentPlannedService,
): boolean => {
  if (service.type === "PACKAGE" || service.type === "BUNDLE") {
    return service.line_type === "PARENT" || !service.parent_credit_item_id;
  }

  return !service.parent_credit_item_id;
};

const fallbackSessionCountFromSelectedServices = (): number => {
  const packageOrBundleServices = selectedServices.value.filter(
    (service) => service.type === "PACKAGE" || service.type === "BUNDLE",
  );
  if (packageOrBundleServices.length) {
    return Math.max(1, ...packageOrBundleServices.map(serviceSessionQuantity));
  }

  return Math.max(1, ...selectedServices.value.map(serviceSessionQuantity));
};

const estimateSessionCountFromSelectedServices = (): number =>
  Math.max(
    1,
    Number(
      sessionCountPreview.value || fallbackSessionCountFromSelectedServices(),
    ),
  ) + (form.add_initial_evaluation_appointment ? 1 : 0);

const adjustedSessionCountPreview = computed(() =>
  estimateSessionCountFromSelectedServices(),
);

const refreshSessionPreview = async (): Promise<void> => {
  if (!selectedServices.value.length) {
    sessionCountPreview.value = 1;
    syncSessionDateCountFromSelectedServices();
    return;
  }

  try {
    const preview = await appointmentPhase1Service.previewSessions({
      payer_type: form.payer_type,
      services: selectedServices.value.map((service) => ({
        type: service.type,
        id: service.value,
        quantity: servicePayloadQuantity(service),
      })),
    });
    sessionCountPreview.value = Math.max(
      1,
      Number(preview.total_sessions ?? 1),
    );
  } catch {
    sessionCountPreview.value = fallbackSessionCountFromSelectedServices();
  }

  syncSessionDateCountFromSelectedServices();
};

const isSyncingSessionDates = ref(false);

const dateTimeKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const sameDateTime = (left?: Date | null, right?: Date | null): boolean => {
  if (!left || !right) return false;
  return dateTimeKey(new Date(left)) === dateTimeKey(new Date(right));
};

const setSessionDatesIfChanged = (dates: Date[]): void => {
  const currentKeys = form.session_dates
    .map((date) => dateTimeKey(new Date(date)))
    .join("|");
  const nextKeys = dates.map((date) => dateTimeKey(new Date(date))).join("|");

  if (currentKeys !== nextKeys) {
    form.session_dates = dates;
  }
};

const normalizeUniqueSessionDates = (
  dates: Date[],
  targetCount: number,
): Date[] => {
  const unique: Date[] = [];
  const used = new Set<string>();
  const baseTime = form.starts_at ? new Date(form.starts_at) : new Date();

  for (const rawDate of dates) {
    let date = clampAppointmentStartToClinicHours(
      copyTime(moveToNextClinicOpenDate(new Date(rawDate)), baseTime),
      getAppointmentDurationMs(),
    );

    while (used.has(dateTimeKey(date))) {
      date.setDate(date.getDate() + 1);
      date = clampAppointmentStartToClinicHours(
        copyTime(moveToNextClinicOpenDate(date), baseTime),
        getAppointmentDurationMs(),
      );
    }

    used.add(dateTimeKey(date));
    unique.push(date);

    if (unique.length >= targetCount) break;
  }

  return unique;
};

const syncSessionDateCountFromSelectedServices = (): void => {
  if (isSyncingSessionDates.value) return;

  const targetCount = estimateSessionCountFromSelectedServices();
  if (!form.starts_at) return;

  try {
    isSyncingSessionDates.value = true;

    const firstStart = copyTime(
      moveToNextClinicOpenDate(new Date(form.starts_at)),
      form.starts_at,
    );

    const current = form.session_dates
      .slice(0, targetCount)
      .map((date) =>
        copyTime(
          moveToNextClinicOpenDate(new Date(date)),
          form.starts_at as Date,
        ),
      );

    if (!current.length) current.push(firstStart);

    while (current.length < targetCount) {
      const previous = current[current.length - 1];
      const next = new Date(previous);
      next.setDate(next.getDate() + 7);
      current.push(copyTime(moveToNextClinicOpenDate(next), form.starts_at));
    }

    const uniqueCurrent = normalizeUniqueSessionDates(current, targetCount);
    setSessionDatesIfChanged(uniqueCurrent);

    if (!form.ends_at || form.ends_at.getTime() <= form.starts_at.getTime()) {
      form.ends_at = getDefaultAppointmentEnd(form.starts_at);
    }
  } finally {
    isSyncingSessionDates.value = false;
  }
};

const generateSessionDates = (
  mode: "DAILY" | "EVERY_OTHER_DAY" | "WEEKLY",
): void => {
  if (!form.starts_at) {
    errorToast(toast, "Set the first appointment start time first");
    return;
  }

  const count = estimateSessionCountFromSelectedServices();
  const durationMs = getAppointmentDurationMs();
  const dayStep = mode === "DAILY" ? 1 : mode === "EVERY_OTHER_DAY" ? 2 : 7;
  const firstStart = copyTime(
    moveToNextClinicOpenDate(new Date(form.starts_at)),
    form.starts_at,
  );

  const generated: Date[] = [];
  const used = new Set<string>();

  for (let index = 0; generated.length < count; index += 1) {
    let date = new Date(firstStart);

    if (index > 0) {
      date.setDate(date.getDate() + index * dayStep);
    }

    date = clampAppointmentStartToClinicHours(
      copyTime(moveToNextClinicOpenDate(date), form.starts_at),
      durationMs,
    );

    while (used.has(dateTimeKey(date))) {
      date.setDate(date.getDate() + 1);
      date = clampAppointmentStartToClinicHours(
        copyTime(moveToNextClinicOpenDate(date), form.starts_at),
        durationMs,
      );
    }

    used.add(dateTimeKey(date));
    generated.push(date);
  }

  form.session_dates = generated;
  form.starts_at = new Date(form.session_dates[0]);
  form.ends_at = new Date(form.starts_at.getTime() + durationMs);
};

const buildSessionSchedules = (): AppointmentSessionSchedulePayload[] => {
  const durationMs = getAppointmentDurationMs();
  const targetCount = estimateSessionCountFromSelectedServices();

  if (!form.starts_at || !form.ends_at) return [];

  const baseDates = form.session_dates.length
    ? form.session_dates.slice(0, targetCount).map((date) => new Date(date))
    : [new Date(form.starts_at)];

  const uniqueDates = normalizeUniqueSessionDates(baseDates, targetCount);

  return uniqueDates.map((date) => {
    const endDate = new Date(date.getTime() + durationMs);

    return {
      starts_at: toDateTimePayload(date) as string,
      ends_at: toDateTimePayload(endDate) as string,
    };
  });
};

const buildAppointmentPayload = (date: Date): AppointmentCreatePayload => {
  const endDate = new Date(date.getTime() + getAppointmentDurationMs());
  const clinicId = activeBranchId.value ?? form.clinic_id;
  const followUpRootAppointmentId = followUpSourceAppointment.value
    ? followUpSourceAppointment.value.root_appointment_id ??
      followUpSourceAppointment.value.id
    : null;

  return {
    patient_id: form.patient_id,
    clinic_id: clinicId,
    primary_provider_staff_id: form.primary_provider_staff_id,
    support_staff_id: form.assistant_provider_staff_id ?? form.intern_provider_staff_id,
    referring_staff_id: form.referring_staff_id,
    appointment_type_id: form.appointment_type_id,
    appointment_status_id:
      form.appointment_status_id ?? pendingStatusOption.value?.value,
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
    credit_account_id: form.credit_account_id,
    root_appointment_id: followUpRootAppointmentId,
    add_initial_evaluation_appointment:
      Boolean(selectedServices.value.length) &&
      !followUpRootAppointmentId &&
      Boolean(form.add_initial_evaluation_appointment),
    notes: form.notes.trim() || undefined,
    services: selectedServices.value.map((service) => ({
      type: service.type,
      id: service.value,
      quantity: servicePayloadQuantity(service),
    })),
    session_schedules: buildSessionSchedules(),
  };
};

const resetServicePicker = (
  billingType: PayerType | string | null = form.payer_type,
): void => {
  const allowedTypes = getAllowedServiceTypes(billingType as PayerType | null);
  servicePicker.type = allowedTypes.includes(servicePicker.type)
    ? servicePicker.type
    : (allowedTypes[0] ?? "TECHNIQUE");
  servicePicker.id = null;
  servicePicker.quantity = 1;
};

const clearDisallowedBillingSelection = (): void => {
  if (isAppointmentPayerTypeAllowed(form.payer_type)) return;

  form.payer_type = null;
  selectedServices.value = [];
  resetServicePicker(null);
};

const loadSelectedPatientContext = async (
  patientId: number | null,
): Promise<void> => {
  selectedPatientContext.value = null;
  if (!patientId) {
    clearDisallowedBillingSelection();
    return;
  }

  try {
    isLoadingPatientContext.value = true;
    selectedPatientContext.value =
      (await patientService.getContext(patientId)) ?? null;
  } catch {
    selectedPatientContext.value = null;
    errorToast(toast, "Unable to check sponsor billing eligibility.");
  } finally {
    isLoadingPatientContext.value = false;
    clearDisallowedBillingSelection();
  }
};

const resetForm = (): void => {
  const now = new Date();
  now.setMinutes(0, 0, 0);

  editingId.value = null;
  form.patient_id = null;
  form.clinic_id =
    activeBranchId.value ??
    (clinicOptions.value[0]?.value as number | null) ??
    null;
  const start = clampAppointmentStartToClinicHours(now);
  const end = getDefaultAppointmentEnd(start);
  form.primary_provider_staff_id = null;
  form.assistant_provider_staff_id = null;
  form.intern_provider_staff_id = null;
  form.referring_staff_id = null;
  form.appointment_type_id =
    (appointmentTypeOptions.value[0]?.value as number | null) ?? null;
  form.appointment_status_id =
    (pendingStatusOption.value?.value as number | null) ?? null;
  form.starts_at = start;
  form.ends_at = end;
  form.appointment_phase = "SESSION";
  form.location_context = "IN_CLINIC";
  form.specialty_tag_id = null;
  form.treatment_area_id = null;
  form.medical_diagnose_id = null;
  form.diagnosis_laterality = null;
  form.payer_type = null;
  form.credit_account_id = null;
  form.notes = "";
  form.create_all_sessions = true;
  form.add_initial_evaluation_appointment = false;
  form.session_dates = [start];
  sessionCountPreview.value = 1;
  selectedPatientContext.value = null;
  followUpSourceAppointment.value = null;

  selectedServices.value = [];
  resetServicePicker();
};

const formatAppointmentTypeLabel = (value: string): string =>
  value.replace(/^Dr\.?\s+Consultation$/i, "Consultation");

const loadLookups = async (): Promise<void> => {
  const clinicId = activeBranchId.value ?? undefined;
  const [
    patients,
    clinics,
    staff,
    appointmentTypes,
    appointmentStatuses,
    specialties,
    treatmentAreas,
    medicalDiagnoses,
  ] = await Promise.all([
    patientService.getAllLookup({
      clinic_id: undefined,
      pageable_request: {
        page: 1,
        size: 500,
        name: undefined,
        status: Status.ACTIVE,
      },
    }),
    clinicService.getAll({
      page: 1,
      size: 200,
      name: undefined,
      status: Status.ACTIVE,
    }),
    staffService.getAll({
      clinic_id: clinicId,
      pageable_request: {
        page: 1,
        size: 500,
        name: undefined,
        status: Status.ACTIVE,
      },
      staff_scope: "ALL",
    }),
    pamsAPI.get("/references/appointment-types", {
      params: { page: 1, size: 100, status: "ACTIVE" },
    }),
    pamsAPI.get("/references/appointment-statuses", {
      params: { page: 1, size: 100, status: "ACTIVE" },
    }),
    pamsAPI.get("/references/specialty-tags", {
      params: { page: 1, size: 500, status: "ACTIVE" },
    }),
    pamsAPI.get("/references/treatment-areas", {
      params: { page: 1, size: 500, status: "ACTIVE" },
    }),
    pamsAPI.get("/references/medical-diagnoses", {
      params: { page: 1, size: 500, status: "ACTIVE" },
    }),
  ]);

  patientOptions.value = (patients?.content ?? []).map((patient) => ({
    label: patient.name,
    value: patient.id,
    clinicId: (patient as { clinic_id?: number | null }).clinic_id == null ? null : Number((patient as { clinic_id?: number | null }).clinic_id),
  }));
  clinicOptions.value = (clinics?.content ?? []).map((clinic) => ({
    label: clinic.name,
    value: clinic.id,
    startDay: Number(clinic.start_day),
    endDay: Number(clinic.end_day),
    startTime: String(clinic.start_time),
    endTime: String(clinic.end_time),
  }));
  staffOptions.value = (staff?.content ?? []).map((row) => ({
    label: row.name,
    value: row.id,
    clinicId: row.clinic_id == null ? null : Number(row.clinic_id),
    providerType: row.appointment_provider_type,
    secondaryProviderType: row.secondary_appointment_provider_type,
    specialtyTagId:
      row.specialty_tag_id == null ? null : Number(row.specialty_tag_id),
  }));
  appointmentTypeOptions.value = (appointmentTypes.data?.content ?? []).map(
    (row: { id: number; name: string }) => ({
      label: formatAppointmentTypeLabel(row.name),
      value: row.id,
    }),
  );
  appointmentStatusOptions.value = (
    appointmentStatuses.data?.content ?? []
  ).map((row: { id: number; name: string }) => ({
    label: row.name,
    value: row.id,
  }));
  specialtyOptions.value = (specialties.data?.content ?? []).map(
    (row: { id: number; name: string }) => ({ label: row.name, value: row.id }),
  );
  treatmentAreaOptions.value = (treatmentAreas.data?.content ?? []).map(
    (row: {
      id: number;
      name: string;
      clinic_id?: number | null;
      color?: string | null;
    }) => ({
      label: row.name,
      value: row.id,
      clinicId: row.clinic_id == null ? null : Number(row.clinic_id),
      color: row.color,
    }),
  );
  medicalDiagnoseOptions.value = (medicalDiagnoses.data?.content ?? []).map(
    (row: { id: number; name: string }) => ({ label: row.name, value: row.id }),
  );

  await loadServiceCatalog();
};

const numberFromKeys = (
  row: Record<string, unknown>,
  keys: string[],
): number => {
  for (const key of keys) {
    const value = Number(row[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }

  return 0;
};

const recordFromUnknown = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const arrayFromUnknown = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value)
    ? (value.map(recordFromUnknown).filter(Boolean) as Array<
        Record<string, unknown>
      >)
    : [];

const serviceNameFromRow = (
  row: Record<string, unknown>,
  fallback = "Included service",
): string => {
  const direct =
    row.name ??
    row.service_name ??
    row.machine_name ??
    row.technique_name ??
    row.evaluation_name ??
    row.add_on_name ??
    row.package_name ??
    row.bundle_name;

  if (direct) return String(direct);

  for (const key of [
    "service",
    "machine",
    "technique",
    "evaluation",
    "item",
    "credit_item",
  ]) {
    const nested = recordFromUnknown(row[key]);
    if (nested) return serviceNameFromRow(nested, fallback);
  }

  return fallback;
};

const serviceTypeFromRow = (
  row: Record<string, unknown>,
): string | undefined => {
  const value =
    row.type ??
    row.service_type ??
    row.selection_type ??
    row.item_type ??
    row.category;
  return value ? String(value) : undefined;
};

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
      "total_sessions",
    ]),
  );

const extractIncludedServices = (
  row: Record<string, unknown>,
): IncludedServicePreview[] => {
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
    "inclusions",
  ];

  const includedRows = includedKeys.flatMap((key) =>
    arrayFromUnknown(row[key]),
  );

  return includedRows
    .map((item) => ({
      name: serviceNameFromRow(item),
      quantity: includedQuantityFromRow(item),
      type: serviceTypeFromRow(item),
    }))
    .filter((item) => item.name.trim().length > 0);
};

const inheritedQuantityFromServiceRow = (
  row: Record<string, unknown>,
  type: AppointmentServiceSelectionType,
  includedServices: IncludedServicePreview[],
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
    "bundle_quantity",
  ]);

  const includedMax = Math.max(
    0,
    ...includedServices.map((item) => Number(item.quantity ?? 0)),
  );

  if (type === "PACKAGE" || type === "BUNDLE") {
    return Math.max(1, explicitQuantity, includedMax);
  }

  return Math.max(1, explicitQuantity || 1);
};

const normalizeServiceRows = (
  rows: Array<Record<string, unknown>>,
  type: AppointmentServiceSelectionType,
  priceKeys: string[],
): ServiceOption[] =>
  rows
    .map((row) => {
      const includedServices = extractIncludedServices(row);

      return {
        label: serviceNameFromRow(row, `Service ${row.id}`),
        value: Number(row.id),
        pickerValue: Number(row.id),
        price: Number(
          priceKeys
            .map((key) => row[key])
            .find((value) => value !== undefined && value !== null) ?? 0,
        ),
        type,
        inheritedQuantity: inheritedQuantityFromServiceRow(
          row,
          type,
          includedServices,
        ),
        includedServices,
      };
    })
    .filter((row) => Number.isFinite(row.value) && row.value > 0);

const recordsFromUnknownArray = (
  rows: unknown[] | undefined,
): Array<Record<string, unknown>> =>
  (rows ?? []).map(recordFromUnknown).filter((row): row is Record<string, unknown> => Boolean(row));

const serviceCatalogFromContext = (
  context: ServiceCatalogContext | undefined,
): AppointmentServiceCatalog => ({
  PACKAGE: normalizeServiceRows(
    recordsFromUnknownArray(context?.package_offers),
    "PACKAGE",
    ["package_price", "price", "effective_price"],
  ),
  BUNDLE: normalizeServiceRows(
    recordsFromUnknownArray(context?.bundles),
    "BUNDLE",
    ["bundled_price", "price", "effective_price"],
  ),
  MACHINE: normalizeServiceRows(
    recordsFromUnknownArray(context?.services.machines),
    "MACHINE",
    ["effective_price", "price", "base_price"],
  ),
  TECHNIQUE: normalizeServiceRows(
    recordsFromUnknownArray(context?.services.techniques),
    "TECHNIQUE",
    ["effective_price", "price", "base_price"],
  ),
  EVALUATION: normalizeServiceRows(
    recordsFromUnknownArray(context?.services.evaluations),
    "EVALUATION",
    ["effective_price", "price", "base_price"],
  ),
  ADD_ON_MACHINE: normalizeServiceRows(
    recordsFromUnknownArray(context?.services.add_on_machines),
    "ADD_ON_MACHINE",
    ["effective_price", "add_on_price", "price", "base_price"],
  ),
  ADD_ON_TECHNIQUE: normalizeServiceRows(
    recordsFromUnknownArray(context?.services.add_on_techniques),
    "ADD_ON_TECHNIQUE",
    ["effective_price", "add_on_price", "price", "base_price"],
  ),
  ADD_ON_HOME_SERVICE: normalizeServiceRows(
    recordsFromUnknownArray(context?.services.add_on_home_services),
    "ADD_ON_HOME_SERVICE",
    ["effective_price", "add_on_price", "price", "base_price"],
  ),
});

const loadServiceCatalog = async (): Promise<void> => {
  const [globalContext, lguContext] = await Promise.all([
    serviceCatalogContextService.getContext({ scope: "GLOBAL" }),
    serviceCatalogContextService.getContext({ scope: "LGU" }),
  ]);

  globalServiceCatalog.value = serviceCatalogFromContext(globalContext);
  lguServiceCatalog.value = serviceCatalogFromContext(lguContext);
};

let liveFilterTimer: number | undefined;

const queueLiveFilterLoad = (): void => {
  if (liveFilterTimer) window.clearTimeout(liveFilterTimer);

  liveFilterTimer = window.setTimeout(() => {
    void loadAppointments();
  }, 350);
};

const appointmentProviderIdForFilter = (
  appointment: AppointmentListItem,
): number | null => {
  const value =
    (appointment as any).primary_provider_staff_id ??
    (appointment as any).provider_staff_id ??
    (appointment as any).doctor_id;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const appointmentMatchesSearch = (
  appointment: AppointmentListItem,
  query: string,
): boolean => {
  if (!query) return true;
  const haystack = [
    (appointment as any).patient_name,
    (appointment as any).provider_name,
    (appointment as any).doctor_name,
    (appointment as any).clinic_name,
    (appointment as any).payer_type,
    (appointment as any).billing_status,
    (appointment as any).attendance_status,
    (appointment as any).appointment_status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
};

const applyTableFilters = (
  items: AppointmentListItem[],
): AppointmentListItem[] => {
  const query = filters.search.trim();
  return items.filter((appointment) => {
    if (!appointmentMatchesSearch(appointment, query)) return false;
    if (
      filters.ptId &&
      appointmentProviderIdForFilter(appointment) !== Number(filters.ptId)
    )
      return false;
    if (
      filters.payerType &&
      (appointment as any).payer_type !== filters.payerType
    )
      return false;
    if (
      filters.billingStatus &&
      normalizeBillingStatus(appointment) !== filters.billingStatus
    )
      return false;
    if (
      filters.attendanceStatus &&
      normalizeAttendanceStatus(appointment) !== filters.attendanceStatus
    )
      return false;
    return true;
  });
};

const refreshDisplayedAppointmentRows = (): void => {
  const filtered = applyTableFilters(tableAppointmentSource.value);
  totalRecords.value = filtered.length;

  const start = (page.value - 1) * pageSize.value;
  appointments.value = filtered.slice(start, start + pageSize.value);
};

const loadAppointments = async (): Promise<void> => {
  try {
    isLoading.value = true;
    const result = await appointmentPhase1Service.getAll({
      page: 1,
      size: 1000,
      from_date: toDateParam(filters.fromDate),
      to_date: toDateParam(filters.toDate),
      clinic_id: activeBranchId.value ?? undefined,
    });

    tableAppointmentSource.value = result.content;
    refreshDisplayedAppointmentRows();
  } catch {
    tableAppointmentSource.value = [];
    appointments.value = [];
    totalRecords.value = 0;
    errorToast(toast, "Failed to load appointments");
  } finally {
    isLoading.value = false;
  }
};

const loadCalendarAppointmentsForRange = async (
  range?: CalendarVisibleRange,
): Promise<void> => {
  if (range) {
    activeCalendarRange.value = {
      from: normalizeDateOnly(range.from),
      to: normalizeDateOnly(range.to),
    };
  }

  try {
    isCalendarLoading.value = true;
    const result = await appointmentPhase1Service.getAll({
      page: 1,
      size: 1000,
      from_date: toDateParam(activeCalendarRange.value.from),
      to_date: toDateParam(activeCalendarRange.value.to),
      clinic_id: activeBranchId.value ?? undefined,
    });

    calendarAppointments.value = result.content;
  } catch {
    calendarAppointments.value = [];
    errorToast(toast, "Failed to load calendar appointments");
  } finally {
    isCalendarLoading.value = false;
  }
};

const getFormScheduleRange = (): CalendarVisibleRange => {
  const dates = [form.starts_at, ...form.session_dates]
    .map((value) => (value ? normalizeDateOnly(new Date(value)) : null))
    .filter((value): value is Date => Boolean(value));

  if (!dates.length)
    return { from: initialSelectedDate, to: initialSelectedDate };

  const from = dates.reduce(
    (earliest, date) => (date.getTime() < earliest.getTime() ? date : earliest),
    dates[0],
  );
  const to = dates.reduce(
    (latest, date) => (date.getTime() > latest.getTime() ? date : latest),
    dates[0],
  );

  return {
    from: addDays(from, -1),
    to: addDays(to, 1),
  };
};

const loadAvailabilityAppointmentsForRange = async (
  range: CalendarVisibleRange = getFormScheduleRange(),
): Promise<void> => {
  try {
    isAvailabilityLoading.value = true;
    const result = await appointmentPhase1Service.getAll({
      page: 1,
      size: 1000,
      from_date: toDateParam(range.from),
      to_date: toDateParam(range.to),
      clinic_id: form.clinic_id ?? activeBranchId.value ?? undefined,
    });

    availabilityAppointments.value = result.content;
  } catch {
    errorToast(toast, "Failed to load schedule availability");
  } finally {
    isAvailabilityLoading.value = false;
  }
};

let availabilityTimer: number | undefined;

const queueAvailabilityLoad = (): void => {
  if (!formVisible.value) return;
  if (availabilityTimer) window.clearTimeout(availabilityTimer);

  availabilityTimer = window.setTimeout(() => {
    void loadAvailabilityAppointmentsForRange();
  }, 250);
};

const refreshAppointmentViews = async (): Promise<void> => {
  const jobs: Promise<void>[] = [
    loadAppointments(),
    loadCalendarAppointmentsForRange(),
  ];

  if (formVisible.value) jobs.push(loadAvailabilityAppointmentsForRange());

  await Promise.all(jobs);
};

const onPage = (event: DataTablePageEvent): void => {
  page.value = Number(event.page ?? 0) + 1;
  pageSize.value = Number(event.rows ?? 20);
  refreshDisplayedAppointmentRows();
};

const selectCalendarDate = (date: Date): void => {
  const selectedDate = normalizeDateOnly(date);
  filters.fromDate = selectedDate;
  filters.toDate = selectedDate;
  page.value = 1;
};

const openCreateDialog = (): void => {
  if (!canCreateAppointment.value) {
    errorToast(toast, "You do not have permission to create appointments");
    return;
  }

  resetForm();
  formVisible.value = true;
  void loadAvailabilityAppointmentsForRange();
};

const openFollowUpAppointmentFromAttendance = (): void => {
  const source = activeAppointment.value;
  if (!source) return;

  if (!canCreateAppointment.value) {
    errorToast(toast, "You do not have permission to create appointments");
    return;
  }

  if (!source.credit_account_id) {
    errorToast(toast, "This appointment has no credit account to continue.");
    return;
  }

  const sourceStart = new Date(source.starts_at);
  const sourceEnd = new Date(source.ends_at);
  const durationMs = Math.max(
    15 * 60 * 1000,
    sourceEnd.getTime() - sourceStart.getTime(),
  );
  const preferredFollowUpStart = addDays(sourceStart, 1);

  resetForm();
  followUpSourceAppointment.value = source;
  editingId.value = null;
  activeAppointment.value = source;
  form.patient_id = source.patient_id;
  form.clinic_id = activeBranchId.value ?? source.clinic_id;
  form.primary_provider_staff_id =
    source.primary_provider_staff_id ?? source.doctor_id ?? null;
  form.referring_staff_id = source.referring_staff_id ?? null;
  form.appointment_type_id = source.appointment_type_id;
  form.appointment_status_id =
    (pendingStatusOption.value?.value as number | null) ??
    source.appointment_status_id;
  const followUpStart = clampAppointmentStartToClinicHours(
    preferredFollowUpStart,
    durationMs,
  );
  const followUpEnd = new Date(followUpStart.getTime() + durationMs);
  form.starts_at = followUpStart;
  form.ends_at = followUpEnd;
  form.appointment_phase = source.appointment_phase;
  form.location_context = source.location_context;
  form.specialty_tag_id = source.specialty_tag_id ?? null;
  form.treatment_area_id = source.treatment_area_id ?? null;
  form.medical_diagnose_id = source.medical_diagnose_id ?? null;
  form.diagnosis_laterality =
    source.diagnosis_laterality as Laterality | null;
  form.payer_type = source.payer_type as PayerType | null;
  form.credit_account_id = Number(source.credit_account_id);
  form.notes = `Follow-up from appointment #${source.id}`;
  form.create_all_sessions = false;
  form.add_initial_evaluation_appointment = false;
  form.session_dates = [followUpStart];
  selectedServices.value = [];
  sessionCountPreview.value = 1;
  attendanceVisible.value = false;
  formVisible.value = true;
  void loadAvailabilityAppointmentsForRange();
};

const openFollowUpAppointmentFromForm = (): void => {
  const source = activeAppointment.value ?? detailAppointment.value;
  if (!source) return;
  activeAppointment.value = source;
  openFollowUpAppointmentFromAttendance();
};

const applyAppointmentToForm = (appointment: AppointmentListItem): void => {
  editingId.value = appointment.id;
  form.patient_id = appointment.patient_id;
  form.clinic_id = appointment.clinic_id;
  form.primary_provider_staff_id =
    appointment.primary_provider_staff_id ?? appointment.doctor_id ?? null;
  form.referring_staff_id = appointment.referring_staff_id ?? null;
  form.appointment_type_id = appointment.appointment_type_id;
  form.appointment_status_id = appointment.appointment_status_id;
  form.starts_at = new Date(appointment.starts_at);
  form.ends_at = new Date(appointment.ends_at);
  form.appointment_phase = appointment.appointment_phase;
  form.location_context = appointment.location_context;
  form.specialty_tag_id = appointment.specialty_tag_id ?? null;
  form.treatment_area_id = appointment.treatment_area_id ?? null;
  form.medical_diagnose_id = appointment.medical_diagnose_id ?? null;
  form.diagnosis_laterality =
    appointment.diagnosis_laterality as Laterality | null;
  form.payer_type = appointment.payer_type as PayerType | null;
  form.credit_account_id = appointment.credit_account_id ?? null;
  form.notes = appointment.notes ?? "";
  form.create_all_sessions = false;
  form.add_initial_evaluation_appointment = false;
  form.session_dates = [new Date(appointment.starts_at)];
  selectedServices.value = [];
  followUpSourceAppointment.value = null;
};

const openEditDialog = (appointment: AppointmentListItem): void => {
  if (!canEditAppointment.value) {
    errorToast(toast, "You do not have permission to edit appointments");
    return;
  }

  activeAppointment.value = appointment;
  applyAppointmentToForm(appointment);
  formVisible.value = true;
  void loadAvailabilityAppointmentsForRange();
};

const openRescheduleDialog = (appointment: AppointmentListItem): void => {
  if (!canRescheduleAppointment.value) {
    errorToast(toast, "You do not have permission to reschedule appointments");
    return;
  }
  if (hasReachedRescheduleLimit(appointment)) {
    errorToast(toast, `This appointment has reached the maximum ${MAX_APPOINTMENT_RESCHEDULE_COUNT} reschedules`);
    return;
  }

  rescheduleAppointment.value = appointment;
  const startsAt = new Date(appointment.starts_at);
  const endsAt = new Date(appointment.ends_at);
  rescheduleForm.date = startsAt;
  rescheduleForm.start_time = startsAt;
  rescheduleForm.duration_minutes = Math.max(
    15,
    Math.round((endsAt.getTime() - startsAt.getTime()) / 60000),
  );
  rescheduleForm.reason = "";
  rescheduleVisible.value = true;
};

const rescheduleFromDetails = (): void => {
  if (!detailAppointment.value) return;
  openRescheduleDialog(detailAppointment.value);
};

const submitReschedule = async (): Promise<void> => {
  const appointment = rescheduleAppointment.value;
  if (!appointment) return;
  const startsAt = reschedulePreviewStart.value;
  const endsAt = reschedulePreviewEnd.value;

  if (!startsAt || !endsAt) {
    errorToast(toast, "Set the new appointment date and start time.");
    return;
  }

  if (startsAt.getTime() >= endsAt.getTime()) {
    errorToast(toast, "New end time must be later than the new start time.");
    return;
  }

  const clinicSchedule = clinicScheduleById(appointment.clinic_id);
  const withinClinicHours = isScheduleWithinClinicHours(
    startsAt,
    endsAt,
    clinicSchedule,
  );
  const clinicHoursLabel = formatClinicHours(clinicSchedule);

  if (!withinClinicHours) {
    errorToast(toast, `Choose a time within ${clinicHoursLabel}.`);
    return;
  }

  try {
    isRescheduling.value = true;
    await appointmentPhase1Service.reschedule(appointment.id, {
      starts_at: toDateTimePayload(startsAt) as string,
      ends_at: toDateTimePayload(endsAt) as string,
      reason: rescheduleForm.reason.trim() || undefined,
    });
    successToast(toast, "Appointment rescheduled");
    rescheduleVisible.value = false;

    if (detailAppointment.value?.id === appointment.id) {
      await loadAppointmentFlowSummary(appointment.id);
    }

    await refreshAppointmentViews();
  } catch (error) {
    errorToast(toast, getApiErrorMessage(error, {
      baseMessage: "Failed to reschedule appointment",
      invalidInputHint: "Review the selected date and time, then try again.",
      notFoundHint: "The appointment could not be found. Refresh and try again."
    }));
  } finally {
    isRescheduling.value = false;
  }
};

const applyAppointmentFlowSummary = (summary: AppointmentFlowSummary): void => {
  detailFlowSummary.value = summary;
  detailAppointment.value = summary.appointment;
  activeAppointment.value = summary.appointment;
  detailPlannedServices.value = summary.planned_services ?? [];
  detailBillingPreparation.value =
    summary.billing_preparation as AppointmentBillingPreparation | null;
};

const buildAttendanceItems = (
  planned: AppointmentPlannedService[],
): AttendanceItem[] =>
  planned.map((item) => {
    const appointmentConsumed = Math.max(
      0,
      Number(item.appointment_consumed_quantity ?? 0),
    );
    const remaining = Math.max(
      0,
      Number(
        item.remaining_quantity ??
          Number(item.planned_quantity ?? 0) -
            Number(item.consumed_quantity ?? 0),
      ),
    );
    return {
      ...item,
      remaining,
      appointmentConsumed,
      selected: false,
      quantity: remaining > 0 && appointmentConsumed <= 0 ? 1 : 0,
    };
  });

const loadAppointmentFlowSummary = async (
  appointmentId: number,
): Promise<AppointmentFlowSummary> => {
  const summary = await appointmentPhase1Service.getFlowSummary(appointmentId);
  applyAppointmentFlowSummary(summary);
  return summary;
};

const openDetailsDialog = async (
  appointment: AppointmentListItem,
): Promise<void> => {
  if (!canViewAppointmentDetails.value) {
    errorToast(toast, "You do not have permission to view appointment details");
    return;
  }

  detailAppointment.value = appointment;
  activeAppointment.value = appointment;
  detailFlowSummary.value = null;
  detailPlannedServices.value = [];
  detailBillingPreparation.value = null;
  detailsVisible.value = true;

  try {
    await loadAppointmentFlowSummary(appointment.id);
  } catch {
    const plannedServicesPromise = appointmentPhase1Service
      .getPlannedServices(appointment.id)
      .then((plannedServices) => {
        detailPlannedServices.value = plannedServices;
      })
      .catch(() => {
        detailPlannedServices.value = [];
      });

    const billingPreparationPromise = canManageAppointmentBilling.value
      ? appointmentBillingService
          .getPreparation(appointment.id)
          .then((preparation) => {
            detailBillingPreparation.value = preparation;
          })
          .catch(() => {
            detailBillingPreparation.value = null;
          })
      : Promise.resolve();

    await Promise.all([plannedServicesPromise, billingPreparationPromise]);
  }
};

const editFromDetails = (): void => {
  if (!detailAppointment.value) return;
  detailsVisible.value = false;
  openEditDialog(detailAppointment.value);
};

const openAttendanceFromDetails = (): void => {
  if (!detailAppointment.value) return;

  const appointment = detailAppointment.value;
  void openAttendanceDialog(appointment);
};

const refreshDetailBillingPreparation = async (): Promise<void> => {
  if (!detailAppointment.value || !canManageAppointmentBilling.value) return;

  try {
    await loadAppointmentFlowSummary(detailAppointment.value.id);
  } catch {
    try {
      detailBillingPreparation.value =
        await appointmentBillingService.getPreparation(
          detailAppointment.value.id,
        );
    } catch {
      detailBillingPreparation.value = null;
    }
  }
};

const openAppointmentBillingDialog = async (): Promise<void> => {
  if (!detailAppointment.value || !canManageAppointmentBilling.value) return;
  appointmentBillingVisible.value = true;
  await refreshDetailBillingPreparation();
};

const openTenderFromBillingDialog = async (): Promise<void> => {
  const document = tenderableBillingDocument.value;
  if (!document) {
    errorToast(toast, "Create a Self Pay bill before tendering.");
    return;
  }
  await openTenderDialog(document);
};

const openInvoicePrintWindow = (document: AppointmentBillingDocument): void => {
  const patientId =
    detailAppointment.value?.patient_id ??
    detailBillingPreparation.value?.appointment.patient_id;
  const appointmentId =
    detailAppointment.value?.id ??
    detailBillingPreparation.value?.appointment.id;
  const routeName =
    document.payer_type === "HMO"
      ? "hmo-patient-billing-summary-print"
      : document.payer_type === "LGU"
        ? "lgu-patient-invoice-billing-print"
        : document.payer_type === "SELF_PAY_PACKAGE" ||
            document.document_type === "PACKAGE_INVOICE"
          ? "self-pay-package-invoice-print"
          : "self-pay-single-invoice-print";
  const routeLocation = router.resolve({
    name: routeName,
    query: {
      billing_id: String(document.id),
      ...(patientId ? { patient_id: String(patientId) } : {}),
      ...(appointmentId ? { appointment_id: String(appointmentId) } : {}),
      autoprint: "1",
    },
  });
  window.open(routeLocation.href, "_blank", "noopener,noreferrer");
};

const buildHmoClaimPayload = () => {
  const loaNumber = hmoClaimForm.loa_number.trim();
  if (!loaNumber) {
    errorToast(toast, "Enter the HMO LOA number before creating the claim.");
    return null;
  }

  return {
    loa_number: loaNumber,
    approval_code: hmoClaimForm.approval_code.trim() || null,
    notes: hmoClaimForm.notes.trim() || null,
  };
};

const buildLguClaimPayload = () => ({
  approval_code: lguClaimForm.approval_code.trim() || null,
  notes: lguClaimForm.notes.trim() || null,
});

const isLguDroppedOutBillingContext = (): boolean => {
  const appointment = detailAppointment.value;
  const preparationAppointment = detailBillingPreparation.value?.appointment;

  const valuesToCheck = [
    (appointment as any)?.dropout_status,
    (appointment as any)?.lgu_patient_status,
    (appointment as any)?.patient_lgu_status,
    (preparationAppointment as any)?.dropout_status,
    (preparationAppointment as any)?.lgu_patient_status,
    (preparationAppointment as any)?.patient_lgu_status,
    selectedPatientLguStatus.value,
  ];

  return valuesToCheck.some((value) => {
    const normalized = normalizeTextToken(value);
    return (
      normalized === "DROPPED_OUT" || normalized === "CROSS_MONTH_DROPPED_OUT"
    );
  });
};

const canCreateSponsorClaimFromDetails = (
  payerType: "HMO" | "LGU",
): boolean => {
  const appointment = detailAppointment.value;
  const preparation = detailBillingPreparation.value;

  if (!appointment || !preparation) return false;

  if (payerType === "HMO") {
    return (
      preparation.billing_path.action === "CREATE_HMO_CLAIM" &&
      preparation.billing_path.payer_type === "HMO" &&
      (Number((appointment as any).hmo_id ?? 0) > 0 ||
        Number((preparation.appointment as any)?.hmo_id ?? 0) > 0)
    );
  }

  const hasCreditAccount =
    Number((appointment as any).credit_account_id ?? 0) > 0 ||
    Number((preparation.appointment as any)?.credit_account_id ?? 0) > 0;

  return (
    preparation.billing_path.action === "CREATE_LGU_CLAIM" &&
    preparation.billing_path.payer_type === "LGU" &&
    hasCreditAccount
  );
};

const normalizeBillingDocumentStatus = (value?: string | null): string =>
  normalizeTextToken(value);

const isVoidBillingDocumentStatus = (value?: string | null): boolean => {
  const status = normalizeBillingDocumentStatus(value);
  return (
    status === "VOID" ||
    status === "VOIDED" ||
    status === "CANCELLED" ||
    status === "CANCELED"
  );
};

const getExistingDocumentPayerType = (
  document: unknown,
  preparation: AppointmentBillingPreparation,
): PayerType =>
  normalizePayerType(
    (document as any)?.payer_type ??
      (document as any)?.payerType ??
      preparation.billing_path.payer_type,
  ) as PayerType;

const toAppointmentBillingDocument = (
  document: any,
  preparation: AppointmentBillingPreparation,
): AppointmentBillingDocument => ({
  id: document.id,
  document_number: document.document_number,
  document_type: document.document_type,
  document_status: document.document_status,
  payer_type: getExistingDocumentPayerType(document, preparation),
  document_date: document.document_date,
  totals: document.totals,
  lines: document.lines ?? [],
});

const getPrintableExistingBillingDocument =
  (): AppointmentBillingDocument | null => {
    const preparation = detailBillingPreparation.value;
    if (!preparation) return null;

    const currentPayerType = normalizePayerType(
      preparation.billing_path.payer_type,
    );
    const printableDocuments = preparation.existing_documents
      .filter(
        (existing) => !isVoidBillingDocumentStatus(existing.document_status),
      )
      .filter(
        (existing) =>
          normalizePayerType(
            getExistingDocumentPayerType(existing, preparation),
          ) === currentPayerType,
      )
      .filter((existing) => {
        const documentType = normalizeTextToken(existing.document_type);
        if (currentPayerType === "LGU") {
          return (
            documentType.includes("LGU") ||
            documentType.includes("CLAIM") ||
            documentType.includes("INVOICE")
          );
        }
        if (currentPayerType === "HMO") {
          return (
            documentType.includes("HMO") ||
            documentType.includes("CLAIM") ||
            documentType.includes("INVOICE")
          );
        }
        return documentType.includes("INVOICE");
      });

    const activeDocument =
      printableDocuments.find((existing) => {
        const status = normalizeBillingDocumentStatus(existing.document_status);
        return (
          status === "BILLED" ||
          status === "PAID" ||
          status === "PARTIALLY_PAID" ||
          status === "PARTIAL" ||
          status === "DROPPED_OUT" ||
          status === "CROSS_MONTH_DROPPED_OUT"
        );
      }) ?? printableDocuments[0];

    return activeDocument
      ? toAppointmentBillingDocument(activeDocument, preparation)
      : null;
  };

const createInvoiceDocumentForCurrentBillingPath =
  async (): Promise<AppointmentBillingDocument | null> => {
    if (!detailAppointment.value || !detailBillingPreparation.value)
      return null;

    const existingDocument = getPrintableExistingBillingDocument();
    if (existingDocument) {
      return existingDocument;
    }

    const action = detailBillingPreparation.value.billing_path.action;
    const payerType = detailBillingPreparation.value.billing_path.payer_type;

    if (action === "CREATE_SELF_PAY_APPOINTMENT_BILL") {
      return appointmentBillingService.createSelfPayAppointmentBill(
        detailAppointment.value.id,
      );
    }
    if (action === "CREATE_SELF_PAY_PACKAGE_BILL") {
      return appointmentBillingService.createSelfPayPackageBill(
        detailAppointment.value.id,
      );
    }
    if (action === "CREATE_DOCUMENTATION_INVOICE") {
      return appointmentBillingService.createSessionDocumentationInvoice(
        detailAppointment.value.id,
      );
    }
    if (action === "CREATE_HMO_CLAIM") {
      if (!canCreateSponsorClaimFromDetails("HMO")) {
        errorToast(
          toast,
          "Patient has no active HMO sponsor information for this appointment.",
        );
        return null;
      }
      const payload = buildHmoClaimPayload();
      return payload
        ? appointmentBillingService.createHmoClaim(
            detailAppointment.value.id,
            payload,
          )
        : null;
    }
    if (
      action === "CREATE_LGU_CLAIM" ||
      (payerType === "LGU" && isLguDroppedOutBillingContext())
    ) {
      if (
        action === "CREATE_LGU_CLAIM" &&
        !canCreateSponsorClaimFromDetails("LGU")
      ) {
        errorToast(
          toast,
          "Patient has no active LGU sponsor information for this appointment.",
        );
        return null;
      }
      return appointmentBillingService.createLguClaim(
        detailAppointment.value.id,
        buildLguClaimPayload(),
      );
    }

    errorToast(
      toast,
      "Invoice printing for this billing type is not wired yet.",
    );
    return null;
  };

const printAppointmentInvoiceFromBillingDialog = async (): Promise<void> => {
  try {
    isBillingActionLoading.value = true;
    const document = await createInvoiceDocumentForCurrentBillingPath();
    if (!document) return;
    successToast(toast, "Invoice ready");
    await refreshDetailBillingPreparation();
    await refreshAppointmentViews();
    openInvoicePrintWindow(document);
  } catch (error) {
    const message = (error as any)?.response?.data?.message;
    errorToast(toast, message ? String(message) : "Unable to print invoice");
  } finally {
    isBillingActionLoading.value = false;
  }
};

const loadPaymentMethods = async (): Promise<void> => {
  if (paymentMethods.value.length) return;

  try {
    isPaymentMethodsLoading.value = true;
    paymentMethods.value = await appointmentBillingService.getPaymentMethods();
  } catch (error) {
    const message = (error as any)?.response?.data?.message;
    errorToast(
      toast,
      message ? String(message) : "Unable to load payment methods",
    );
  } finally {
    isPaymentMethodsLoading.value = false;
  }
};

const openTenderDialog = async (
  document: AppointmentBillingDocument,
  _fallbackAmountDue = 0,
): Promise<void> => {
  tenderBillingDocument.value = document;
  tenderForm.amount_tendered = 0;
  tenderForm.payment_method_id = paymentMethods.value[0]?.id ?? null;
  tenderForm.payment_reference = "";
  tenderForm.notes = "";
  tenderForm.senior_pwd_id_presented = false;
  tenderForm.senior_pwd_id_reference = "";
  tenderForm.custom_discount_type = null;
  tenderForm.custom_discount_value = 0;
  tenderVisible.value = true;
  await loadPaymentMethods();
  tenderForm.payment_method_id =
    tenderForm.payment_method_id ?? paymentMethods.value[0]?.id ?? null;
};

const plannedServicesAmountDue = (): number =>
  Number(
    detailPlannedServices.value
      .filter((service) => {
        const type = String((service as any).type ?? (service as any).line_type ?? "").toUpperCase();
        return type !== "PACKAGE" && type !== "BUNDLE";
      })
      .reduce((sum, service) => {
        const quantity = Number((service as any).planned_quantity ?? (service as any).quantity ?? 0);
        const unitPrice = Number((service as any).unit_price ?? (service as any).price ?? 0);
        return sum + (Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0);
      }, 0)
      .toFixed(2),
  );

const selfPayTenderFallbackAmount = (): number => {
  const preparationSubtotal = Number(detailBillingPreparation.value?.consumed_services.subtotal ?? 0);
  if (Number.isFinite(preparationSubtotal) && preparationSubtotal > 0) {
    return preparationSubtotal;
  }
  return plannedServicesAmountDue();
};

const isPaidBillingDocument = (document: AppointmentBillingDocument): boolean => {
  const status = normalizeBillingDocumentStatus(document.document_status);
  return status === "PAID" || status === "SETTLED";
};

const submitTenderPayment = async (): Promise<void> => {
  if (!tenderBillingDocument.value) return;

  const amountTendered = Number(tenderForm.amount_tendered ?? 0);
  if (!Number.isFinite(amountTendered) || amountTendered <= 0) {
    errorToast(toast, "Enter a valid tendered amount.");
    return;
  }

  if (!tenderForm.payment_method_id) {
    errorToast(toast, "Select a payment method.");
    return;
  }

  try {
    isTenderSaving.value = true;
    const result = await appointmentBillingService.tenderSelfPayBillingDocument(
      tenderBillingDocument.value.id,
      {
        amount_tendered: amountTendered,
        payment_method_id: tenderForm.payment_method_id,
        payment_reference: tenderForm.payment_reference.trim() || null,
        notes: tenderForm.notes.trim() || null,
        senior_pwd_id_presented: tenderForm.senior_pwd_id_presented,
        senior_pwd_id_reference:
          tenderForm.senior_pwd_id_reference.trim() || null,
        custom_discount_type: tenderForm.custom_discount_type,
        custom_discount_value: Number(tenderForm.custom_discount_value ?? 0),
      },
    );
    tenderBillingDocument.value = result.billing_document;
    tenderVisible.value = false;
    successToast(
      toast,
      `Payment saved${result.receipt.receipt_number ? `: ${result.receipt.receipt_number}` : ""}`,
    );
    await refreshDetailBillingPreparation();
    await refreshAppointmentViews();
  } catch (error) {
    const message = (error as any)?.response?.data?.message;
    errorToast(toast, message ? String(message) : "Unable to save payment");
  } finally {
    isTenderSaving.value = false;
  }
};

watch(
  () => [
    tenderForm.senior_pwd_id_presented,
    tenderForm.custom_discount_type,
    tenderForm.custom_discount_value,
    tenderBillingDocument.value?.id,
  ],
  () => {
    if (!tenderVisible.value || !tenderBillingDocument.value) return;
    tenderForm.amount_tendered = Number(tenderForm.amount_tendered ?? 0);
  },
);

const runBillingActionFromDetails = async (
  action: (appointmentId: number) => Promise<AppointmentBillingDocument>,
  successMessage: string,
  shouldOfferTender = false,
): Promise<void> => {
  if (!detailAppointment.value) return;

  try {
    isBillingActionLoading.value = true;
    const document = await action(detailAppointment.value.id);
    await refreshDetailBillingPreparation();
    await refreshAppointmentViews();
    if (shouldOfferTender && !isPaidBillingDocument(document)) {
      await openTenderDialog(document, selfPayTenderFallbackAmount());
      return;
    }
    successToast(toast, successMessage);
  } catch (error) {
    const message = (error as any)?.response?.data?.message;
    errorToast(toast, message ? String(message) : "Billing action failed");
  } finally {
    isBillingActionLoading.value = false;
  }
};

const createSelfPayAppointmentBillFromDetails = (): void => {
  void runBillingActionFromDetails(
    appointmentBillingService.createSelfPayAppointmentBill,
    "Self Pay appointment bill created",
    true,
  );
};

const createSelfPayPackageBillFromDetails = (): void => {
  void runBillingActionFromDetails(
    appointmentBillingService.createSelfPayPackageBill,
    "Self Pay package bill created",
    true,
  );
};

const createSessionDocumentationInvoiceFromDetails = (): void => {
  void runBillingActionFromDetails(
    appointmentBillingService.createSessionDocumentationInvoice,
    "Session documentation invoice created",
  );
};

const createHmoClaimFromDetails = (): void => {
  if (!canCreateSponsorClaimFromDetails("HMO")) {
    errorToast(
      toast,
      "Patient has no active HMO sponsor information for this appointment.",
    );
    return;
  }

  const payload = buildHmoClaimPayload();
  if (!payload) return;

  void runBillingActionFromDetails(
    (appointmentId) =>
      appointmentBillingService.createHmoClaim(appointmentId, payload),
    "HMO claim created",
  );
};

const createLguClaimFromDetails = (): void => {
  if (!canCreateSponsorClaimFromDetails("LGU")) {
    errorToast(
      toast,
      "Patient has no active LGU sponsor information for this appointment.",
    );
    return;
  }

  void runBillingActionFromDetails(
    (appointmentId) =>
      appointmentBillingService.createLguClaim(
        appointmentId,
        buildLguClaimPayload(),
      ),
    "LGU claim created",
  );
};

const saveAppointment = async (): Promise<void> => {
  form.appointment_status_id =
    form.appointment_status_id ??
    (pendingStatusOption.value?.value as number | null) ??
    null;
  form.clinic_id = activeBranchId.value ?? form.clinic_id;

  if (
    !form.patient_id ||
    !form.clinic_id ||
    !form.appointment_type_id ||
    !form.appointment_status_id ||
    !form.starts_at ||
    !form.ends_at
  ) {
    errorToast(toast, "Complete patient, clinic branch, type, start, and end.");
    return;
  }

  if (!form.primary_provider_staff_id) {
    errorToast(toast, "Select a Main PT before saving the appointment.");
    return;
  }

  const isFollowUpAppointment = Boolean(
    followUpSourceAppointment.value && form.credit_account_id,
  );

  if (!editingId.value && !selectedServices.value.length && !isFollowUpAppointment) {
    errorToast(toast, "Add at least one planned service.");
    return;
  }

  if (selectedServices.value.length && !form.payer_type) {
    errorToast(toast, "Select a billing type before saving planned services.");
    return;
  }

  if (
    form.payer_type &&
    !isFollowUpAppointment &&
    !isAppointmentPayerTypeAllowed(form.payer_type)
  ) {
    errorToast(
      toast,
      "Selected patient is not eligible for that billing type.",
    );
    return;
  }

  try {
    isSaving.value = true;
    await refreshSessionPreview();

    const firstAppointmentDate = form.session_dates.length
      ? new Date(form.session_dates[0])
      : form.starts_at;

    if (!firstAppointmentDate || Number.isNaN(firstAppointmentDate.getTime())) {
      errorToast(toast, "Set a valid appointment schedule first.");
      return;
    }

    const payload = buildAppointmentPayload(firstAppointmentDate);
    const schedules = payload.session_schedules ?? [];
    const outsideClinicHours = schedules.some((schedule) => {
      const start = new Date(schedule.starts_at);
      const end = new Date(schedule.ends_at);
      return !isScheduleWithinSelectedClinicHours(start, end);
    });

    if (outsideClinicHours) {
      errorToast(toast, `Choose session times within ${formatSelectedClinicHours()}.`);
      return;
    }

    if (editingId.value) {
      await appointmentPhase1Service.update(editingId.value, payload);
      successToast(toast, "Appointment updated");
    } else {
      const created = await appointmentPhase1Service.create(payload);
      const totalCreated =
        created.appointment_ids?.length ?? created.total_sessions ?? 1;
      successToast(
        toast,
        isFollowUpAppointment
          ? "Follow-up appointment created"
          : `Appointment created with ${totalCreated} session${totalCreated > 1 ? "s" : ""}`,
      );
    }

    formVisible.value = false;
    followUpSourceAppointment.value = null;
    await refreshAppointmentViews();
  } catch (error) {
    let message = "Failed to save appointment";
    try {
      errorHandler(error);
    } catch (handledError) {
      if (handledError instanceof Error && handledError.message.trim()) {
        message = handledError.message;
      }
    }
    errorToast(toast, message);
  } finally {
    isSaving.value = false;
  }
};

const savePlannedServicesForAppointment = async (
  appointmentId: number,
  payerType?: string | null,
) =>
  appointmentPhase1Service.savePlannedServices(appointmentId, {
    payer_type: payerType,
    services: selectedServices.value.map((service) => ({
      type: service.type,
      id: service.value,
      quantity: servicePayloadQuantity(service),
    })),
  });

const canceledStatusOption = computed(
  () =>
    appointmentStatusOptions.value.find((option) =>
      String(option.label).toLowerCase().includes("cancel"),
    ) ?? null,
);

const cancelAppointment = async (
  appointment: AppointmentListItem,
): Promise<void> => {
  if (!canCancelAppointment.value) {
    errorToast(toast, "You do not have permission to cancel appointments");
    return;
  }

  if (!window.confirm(`Cancel appointment for ${appointment.patient_name}?`))
    return;

  const canceledStatusId = canceledStatusOption.value?.value;
  if (!canceledStatusId) {
    errorToast(
      toast,
      "Cancelled appointment status was not found in references",
    );
    return;
  }

  try {
    const start = new Date(appointment.starts_at);
    const end = new Date(appointment.ends_at);
    const payload: AppointmentCreatePayload = {
      patient_id: (appointment as any).patient_id,
      clinic_id: (appointment as any).clinic_id,
      primary_provider_staff_id:
        (appointment as any).primary_provider_staff_id ??
        (appointment as any).doctor_id ??
        null,
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
      session_schedules: [],
    };

    await appointmentPhase1Service.update(appointment.id, payload);
    successToast(toast, "Appointment canceled");
    await refreshAppointmentViews();
  } catch {
    errorToast(toast, "Failed to cancel appointment");
  }
};

const openServicesDialog = async (
  appointment: AppointmentListItem,
): Promise<void> => {
  activeAppointment.value = appointment;
  selectedServices.value = [];
  resetServicePicker(appointment.payer_type);
  servicesVisible.value = true;

  try {
    servicesModalPlannedServices.value =
      await appointmentPhase1Service.getPlannedServices(appointment.id);
  } catch {
    servicesModalPlannedServices.value = [];
  }
};

const removeDisallowedSelectedServices = (
  billingType: PayerType | null,
): void => {
  const allowed = new Set(getAllowedServiceTypes(billingType));
  selectedServices.value = selectedServices.value.filter((service) =>
    allowed.has(service.type),
  );
};

const getSelectedServiceQuantity = (selected: ServiceOption): number => {
  const requestedQuantity = Math.max(1, Number(servicePicker.quantity ?? 1));

  if (selected.type === "PACKAGE") {
    return 1;
  }

  if (selected.type === "BUNDLE") {
    return Math.max(
      1,
      Number(selected.inheritedQuantity ?? 1),
      requestedQuantity,
    );
  }

  return requestedQuantity;
};

const addPickedService = (): void => {
  const allowedTypes = new Set(
    getAllowedServiceTypes(currentServiceBillingType.value),
  );
  if (!allowedTypes.has(servicePicker.type)) {
    errorToast(toast, "That service is not allowed for this billing type");
    resetServicePicker();
    return;
  }

  const selected = currentServiceOptions.value.find(
    (option) => String(option.pickerValue) === String(servicePicker.id),
  );
  if (!selected) {
    errorToast(toast, "Select a service first");
    return;
  }

  if (homeCareAddOnTypes.has(selected.type)) {
    form.location_context = "HOME_CARE";
  }

  selectedServices.value.push({
    ...selected,
    name: selected.label,
    quantity: getSelectedServiceQuantity(selected),
    typeLabel: serviceTypeLabel(selected.type),
  });

  servicePicker.id = null;
  servicePicker.quantity = 1;
  void refreshSessionPreview();
};

const removeSelectedService = (index: number): void => {
  selectedServices.value.splice(index, 1);
  void refreshSessionPreview();
};

const payerTypeFromAppointment = (
  value: unknown,
): PayerType | null => {
  const normalized = normalizePayerType(value);
  return payerOptions.some((option) => option.value === normalized)
    ? (normalized as PayerType)
    : null;
};

const useLastPatientServices = async (): Promise<void> => {
  if (editingId.value) {
    errorToast(toast, "Use this option when creating a new appointment.");
    return;
  }

  const patientId = Number(form.patient_id ?? 0);
  if (!patientId) {
    errorToast(toast, "Select a patient first.");
    return;
  }

  try {
    isCopyingLastServices.value = true;

    const contextPatientId = Number(selectedPatientContext.value?.patient?.id ?? 0);
    if (contextPatientId !== patientId) {
      await loadSelectedPatientContext(patientId);
    }

    const result = await appointmentPhase1Service.getAll({
      page: 1,
      size: 10,
      patient_id: patientId,
    });

    const previousAppointments = (result.content ?? [])
      .filter((appointment) => Number(appointment.id) !== Number(editingId.value))
      .filter((appointment) => Number(appointment.patient_id) === patientId);

    for (const appointment of previousAppointments) {
      const summary = await appointmentPhase1Service.getFlowSummary(appointment.id);
      const billingType = payerTypeFromAppointment(
        summary.appointment?.payer_type ?? appointment.payer_type,
      );

      if (!billingType) continue;

      if (!isAppointmentPayerTypeAllowed(billingType)) {
        errorToast(
          toast,
          "The patient's last billing type is not currently allowed.",
        );
        return;
      }

      const copyableServices = (summary.planned_services ?? [])
        .filter(isTopLevelPlannedService)
        .map((service) => plannedServiceToSelectedService(service, billingType))
        .filter((service): service is SelectedService => Boolean(service));

      if (!copyableServices.length) continue;

      form.payer_type = billingType;
      selectedServices.value = copyableServices;

      if (copyableServices.some((service) => homeCareAddOnTypes.has(service.type))) {
        form.location_context = "HOME_CARE";
      }

      resetServicePicker(billingType);
      await refreshSessionPreview();
      successToast(
        toast,
        `Copied ${copyableServices.length} service${copyableServices.length === 1 ? "" : "s"} from ${formatDate(appointment.starts_at)}.`,
      );
      return;
    }

    errorToast(toast, "No previous planned services found for this patient.");
  } catch {
    errorToast(toast, "Failed to copy the patient's last services.");
  } finally {
    isCopyingLastServices.value = false;
  }
};

const saveServices = async (): Promise<void> => {
  if (!activeAppointment.value) return;

  if (!selectedServices.value.length) {
    errorToast(toast, "Add at least one service");
    return;
  }

  try {
    isSavingServices.value = true;
    await savePlannedServicesForAppointment(
      activeAppointment.value.id,
      activeAppointment.value.payer_type,
    );
    servicesModalPlannedServices.value =
      await appointmentPhase1Service.getPlannedServices(
        activeAppointment.value.id,
      );
    selectedServices.value = [];
    successToast(toast, "Planned services saved");
    await refreshAppointmentViews();
  } catch {
    errorToast(toast, "Failed to save planned services");
  } finally {
    isSavingServices.value = false;
  }
};

const openAttendanceDialog = async (
  appointment: AppointmentListItem,
): Promise<void> => {
  if (!canMarkAttendance.value) {
    errorToast(toast, "You do not have permission to mark attendance");
    return;
  }

  activeAppointment.value = appointment;
  detailFlowSummary.value = null;
  attendanceVisible.value = true;

  try {
    const summary = await loadAppointmentFlowSummary(appointment.id);
    const planned = summary.planned_services ?? [];
    attendancePlannedServices.value = planned;
    attendanceItems.value = buildAttendanceItems(planned);
  } catch {
    try {
      const planned = await appointmentPhase1Service.getPlannedServices(
        appointment.id,
      );
      attendancePlannedServices.value = planned;
      attendanceItems.value = buildAttendanceItems(planned);
    } catch {
      attendancePlannedServices.value = [];
      attendanceItems.value = [];
      errorToast(toast, "Failed to load planned services");
    }
  }
};

const saveEncounterTicketDraft = async (
  signature: AttendanceSignaturePayload,
): Promise<void> => {
  if (!activeAppointment.value) return;

  try {
    isSavingAttendance.value = true;
    await appointmentPhase1Service.processEncounterTicket(
      activeAppointment.value.id,
      {
        patient_signature_data_url:
          signature.patient_signature_data_url || null,
        patient_signature_signed_at:
          signature.patient_signature_signed_at || null,
        patient_signature_signed_by:
          signature.patient_signature_signed_by ||
          activeAppointment.value.patient_name ||
          null,
        pt_signature_data_url: signature.pt_signature_data_url || null,
        pt_confirmed_at: signature.pt_confirmed_at || null,
        pt_completion_tag: signature.pt_completion_tag || null,
        notes: signature.notes || null,
      },
    );

    const summary = await loadAppointmentFlowSummary(
      activeAppointment.value.id,
    );
    attendanceItems.value = buildAttendanceItems(
      summary.planned_services ?? [],
    );
    successToast(toast, "Encounter ticket saved");
  } catch (error) {
    const message = (error as any)?.response?.data?.message;
    errorToast(
      toast,
      message ? String(message) : "Failed to save encounter ticket",
    );
  } finally {
    isSavingAttendance.value = false;
  }
};

const saveAttendance = async (
  signature: AttendanceSignaturePayload,
): Promise<void> => {
  if (!activeAppointment.value) return;

  const signatureDataUrl = String(
    signature?.patient_signature_data_url ?? "",
  ).trim();

  if (!signatureDataUrl) {
    errorToast(toast, "Patient signature is required to complete attendance");
    return;
  }

  const staffSignatureDataUrl = String(
    signature?.pt_signature_data_url ?? "",
  ).trim();

  const selectedBundleIds = new Set(
    attendanceItems.value
      .filter((item) => item.selected && item.type === "BUNDLE")
      .map((item) => Number(item.id)),
  );

  const items = attendanceItems.value
    .filter(
      (item) =>
        item.selected &&
        item.remaining > 0 &&
        item.appointmentConsumed <= 0 &&
        item.type !== "PACKAGE",
    )
    .filter(
      (item) =>
        !item.parent_credit_item_id ||
        !selectedBundleIds.has(Number(item.parent_credit_item_id)),
    )
    .map((item) => ({
      credit_item_id: item.id,
      quantity: Math.min(
        item.remaining,
        Math.max(1, Number(item.quantity ?? 1)),
      ),
    }));

  if (!items.length) {
    errorToast(toast, "Select at least one finished service");
    return;
  }

  try {
    isSavingAttendance.value = true;

    await appointmentPhase1Service.saveAttendance(activeAppointment.value.id, {
      items,
      patient_signature_data_url: signatureDataUrl,
      patient_signature_signed_at:
        signature.patient_signature_signed_at || new Date().toISOString(),
      patient_signature_signed_by:
        signature.patient_signature_signed_by ||
        activeAppointment.value.patient_name ||
        null,
      pt_signature_data_url: staffSignatureDataUrl || undefined,
      pt_confirmed_at: staffSignatureDataUrl
        ? signature.pt_confirmed_at || new Date().toISOString()
        : undefined,
      pt_completion_tag: staffSignatureDataUrl
        ? signature.pt_completion_tag || "ATTENDANCE_CONFIRMED"
        : undefined,
      notes: signature.notes || null,
    });

    successToast(toast, "Attendance completed with patient signature");
    await openAttendanceDialog(activeAppointment.value);
    await refreshAppointmentViews();
  } catch (error) {
    const message = (error as any)?.response?.data?.message;
    errorToast(toast, message ? String(message) : "Failed to save attendance");
  } finally {
    isSavingAttendance.value = false;
  }
};

const dropOutActiveAppointment = async (reason: string): Promise<void> => {
  if (!activeAppointment.value) return;
  if (!canDropOutActiveAppointment.value) {
    errorToast(toast, "This LGU appointment cannot be marked as dropped out.");
    return;
  }

  try {
    isDroppingOut.value = true;
    const dropoutStatus = await resolveDropoutStatusForAppointment(
      activeAppointment.value,
    );
    const summary = await appointmentPhase1Service.updateDropoutStatus(
      activeAppointment.value.id,
      {
        dropout_status: dropoutStatus,
        reason,
      },
    );
    applyAppointmentFlowSummary(summary);
    attendanceItems.value = buildAttendanceItems(
      summary.planned_services ?? [],
    );
    successToast(
      toast,
      dropoutStatus === "CROSS_MONTH_DROPPED_OUT"
        ? "LGU patient marked as cross-month dropped out"
        : "LGU patient marked as dropped out",
    );
    await refreshAppointmentViews();
  } catch (error) {
    const message = (error as any)?.response?.data?.message;
    errorToast(
      toast,
      message ? String(message) : "Failed to mark patient as dropped out",
    );
  } finally {
    isDroppingOut.value = false;
  }
};

const undoDropOutActiveAppointment = async (): Promise<void> => {
  if (!activeAppointment.value) return;
  if (
    !isLguAppointment(activeAppointment.value) ||
    !canManageAppointmentBilling.value
  ) {
    errorToast(toast, "This LGU appointment cannot undo drop-out status.");
    return;
  }

  try {
    isDroppingOut.value = true;
    const summary = await appointmentPhase1Service.undoDropoutStatus(
      activeAppointment.value.id,
    );
    applyAppointmentFlowSummary(summary);
    attendanceItems.value = buildAttendanceItems(
      summary.planned_services ?? [],
    );
    successToast(toast, "LGU drop-out status restored");
    await refreshAppointmentViews();
  } catch (error) {
    const message = (error as any)?.response?.data?.message;
    errorToast(
      toast,
      message ? String(message) : "Failed to undo patient drop-out status",
    );
  } finally {
    isDroppingOut.value = false;
  }
};

onMounted(async () => {
  try {
    await branchStore.initializeFromAuthSession();
    await loadLookups();
    resetForm();
    await refreshAppointmentViews();
  } catch {
    errorToast(toast, "Failed to load appointment setup data");
  }
});

watch(
  () => form.starts_at,
  (date, previousDate) => {
    if (!date || isSyncingSessionDates.value) return;

    const previousStart = previousDate instanceof Date ? previousDate : null;
    const previousDefaultEnd = previousStart
      ? getDefaultAppointmentEnd(previousStart)
      : null;
    const shouldAutoSetEnd =
      !form.ends_at ||
      form.ends_at.getTime() <= date.getTime() ||
      (previousDefaultEnd
        ? isWithinOneMinute(form.ends_at, previousDefaultEnd)
        : false);

    if (shouldAutoSetEnd) {
      form.ends_at = getDefaultAppointmentEnd(date);
    }

    const updated = new Date(date);
    updated.setSeconds(0, 0);

    if (!form.session_dates.length) {
      form.session_dates = [updated];
      return;
    }

    const first = new Date(form.session_dates[0]);

    if (!sameDateTime(first, updated)) {
      form.session_dates[0] = updated;
    }

    // Do not call syncSessionDateCountFromSelectedServices() here.
    // That sync function can update form.session_dates, and the child form also reads these values.
    // Running it from this watcher can recursively trigger Vue updates while saving.
  },
);

watch(activeBranchId, (clinicId) => {
  if (clinicId && !editingId.value) {
    form.clinic_id = clinicId;
  }

  page.value = 1;
  void loadLookups().then(() => refreshAppointmentViews());
});

watch([ptOptions, doctorOptions], () => {
  const isValidProvider = (staffId: number | null, options: SelectOption[]): boolean =>
    !staffId || options.some((option) => Number(option.value) === Number(staffId));

  if (!isValidProvider(form.primary_provider_staff_id, ptOptions.value)) {
    form.primary_provider_staff_id = null;
    form.specialty_tag_id = null;
  }
  if (!isValidProvider(form.assistant_provider_staff_id, ptOptions.value)) {
    form.assistant_provider_staff_id = null;
  }
  if (!isValidProvider(form.intern_provider_staff_id, ptOptions.value)) {
    form.intern_provider_staff_id = null;
  }
  if (!isValidProvider(form.referring_staff_id, doctorOptions.value)) {
    form.referring_staff_id = null;
  }
});

watch(
  () => form.primary_provider_staff_id,
  (staffId) => {
    if (!staffId) return;

    const selectedPt = staffOptions.value.find(
      (option) => Number(option.value) === Number(staffId),
    );
    if (selectedPt?.specialtyTagId) {
      form.specialty_tag_id = selectedPt.specialtyTagId;
    }
  },
);

watch(
  () => form.patient_id,
  (patientId) => {
    void loadSelectedPatientContext(patientId);
  },
);

watch(
  () => [
    filters.search,
    filters.ptId,
    filters.payerType,
    filters.billingStatus,
    filters.attendanceStatus,
    filters.fromDate?.getTime() ?? null,
    filters.toDate?.getTime() ?? null,
  ],
  () => {
    page.value = 1;
    queueLiveFilterLoad();
  },
);

watch(
  () => [
    formVisible.value,
    form.clinic_id,
    form.primary_provider_staff_id,
    form.starts_at?.getTime() ?? null,
    form.ends_at?.getTime() ?? null,
    ...form.session_dates.map((date) =>
      date ? new Date(date).getTime() : null,
    ),
  ],
  () => {
    queueAvailabilityLoad();
  },
);

watch(
  () => form.payer_type,
  (billingType) => {
    removeDisallowedSelectedServices(billingType);
    resetServicePicker(billingType);
    void refreshSessionPreview();
  },
);

watch(
  () => form.add_initial_evaluation_appointment,
  () => {
    syncSessionDateCountFromSelectedServices();
  },
);
</script>
