<template>
  <main class="app-page-shell space-y-4">
    <section class="app-section-card-comfy space-y-3">
      <h2 class="app-section-title">Billing POS</h2>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <IftaLabel>
          <Select
            v-model="form.patient_id"
            :options="patientOptions"
            optionLabel="name"
            optionValue="id"
            filter
            showClear
            fluid
            placeholder="Select patient"
          />
          <label>Patient Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber v-model="form.appointment_id" :min="1" fluid />
          <label>Appointment ID (optional)</label>
        </IftaLabel>

        <IftaLabel>
          <Select v-model="form.billing_type" :options="billingTypeOptions" optionLabel="label" optionValue="value" fluid />
          <label>Billing Type</label>
        </IftaLabel>
      </div>

      <!-- HMO plan indicator -->
      <template v-if="form.billing_type === 'HMO_BILLING'">
        <Message v-if="billingPatientHmoInfo" severity="info" :closable="false" size="small">
          <span class="font-medium">{{ billingPatientHmoInfo.hmo_name }}</span>
          &nbsp;·&nbsp;{{ billingPatientHmoInfo.hmo_type_name }}
          &nbsp;·&nbsp;{{ billingPatientHmoInfo.company_name }}
        </Message>
        <Message v-else-if="form.patient_id && !syncingBillingHmoRates" severity="warn" :closable="false" size="small">
          No HMO information on file for this patient. Please register HMO via the Patients module first.
        </Message>
      </template>

      <template v-if="form.billing_type === 'LGU_BILLING'">
        <Message v-if="loadingLguBudgetSummary" severity="secondary" :closable="false" size="small">
          Loading active LGU fund summary...
        </Message>
        <Message v-else-if="activeLguBudgetSummary" severity="info" :closable="false" size="small">
          <span class="font-medium">{{ activeLguBudgetSummary.program_name }}</span>
          &nbsp;·&nbsp;{{ activeLguBudgetSummary.period_year }}-{{ String(activeLguBudgetSummary.period_month).padStart(2, "0") }}
          &nbsp;·&nbsp;Remaining {{ asCurrency(activeLguBudgetSummary.remaining_amount) }}
          <template v-if="lguProjectedRemainingAfterSave != null">
            &nbsp;·&nbsp;After this billing {{ asCurrency(lguProjectedRemainingAfterSave) }}
          </template>
        </Message>
        <Message
          v-if="activeLguBudgetSummary && lguAvailableBeforeSave != null && editingLguReservedAmount > 0"
          severity="secondary"
          :closable="false"
          size="small"
        >
          Available for this edited billing: {{ asCurrency(lguAvailableBeforeSave) }}
        </Message>
        <Message v-else-if="lguBudgetSummaryError" severity="warn" :closable="false" size="small">
          {{ lguBudgetSummaryError }}
        </Message>
        <Message v-else-if="form.patient_id" severity="warn" :closable="false" size="small">
          No active LGU budget period is configured for this patient/appointment yet. LGU billing cannot be saved until a budget period is opened.
        </Message>
        <Message v-if="lguWillExceedRemainingFund" severity="error" :closable="false" size="small">
          This billing is higher than the remaining LGU fund. Saving will be blocked until enough budget is available.
        </Message>
      </template>

      <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h4 class="text-sm font-semibold">Line Items</h4>
          <div class="flex items-center gap-2">
            <small v-if="existingBundleMatchName" class="text-xs opacity-60">Matches existing bundle: {{ existingBundleMatchName }}</small>
            <Button
              v-if="canCreateBundleFromSelection"
              size="small"
              outlined
              icon="pi pi-box"
              label="Create Bundle From Selection"
              @click="openCreateBundleFromSelection"
            />
            <Button
              v-if="form.patient_id"
              size="small"
              outlined
              icon="pi pi-history"
              label="Copy from Last Session"
              :loading="copyingFromLastSession"
              @click="copyFromLastSession"
            />
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <IftaLabel v-if="form.billing_type !== 'HMO_BILLING'">
            <Select
              v-model="selectedPackageOfferId"
              :options="activePackageOffers"
              optionLabel="name"
              optionValue="id"
              showClear
              filter
              fluid
              placeholder="Optional package offer"
            />
            <label>Package Offer</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="selectedLineType"
              :options="lineTypeOptions"
              optionLabel="label"
              optionValue="value"
              fluid
            />
            <label>Service Type</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="selectedLineId"
              :options="currentLineTypeOptions"
              optionLabel="name"
              optionValue="id"
              showClear
              filter
              fluid
              placeholder="Select item"
            />
            <label>Service / Add-on</label>
          </IftaLabel>

          <div class="grid grid-cols-[120px_1fr] gap-2 items-end">
            <IftaLabel>
              <InputNumber v-model="selectedLineQty" :min="1" fluid />
              <label>Qty</label>
            </IftaLabel>
            <Button label="Add Line" icon="pi pi-plus" outlined @click="addSelectedLine" />
          </div>
        </div>

        <div v-if="form.billing_type !== 'HMO_BILLING'" class="flex flex-wrap gap-2">
          <Button
            label="Add Package Offer"
            icon="pi pi-box"
            text
            :disabled="!selectedPackageOfferId"
            @click="addSelectedPackageOffer"
          />
        </div>

        <div v-if="selectedLines.length === 0" class="text-sm opacity-70 py-4 text-center">
          No line items added yet
        </div>

        <DataTable v-else :value="selectedLines" size="small" dataKey="key" class="rounded-lg border border-[rgb(var(--app-border))]">
          <Column field="name" header="Service">
            <template #body="{data}">
              <div>
                <div class="flex items-center gap-1">
                  <Tag v-if="data.type === 'bundle'" value="Bundle" severity="contrast" class="text-xs" />
                  <Tag v-else-if="data.type === 'package'" value="Package" severity="info" class="text-xs" />
                  <span>{{ data.name }}</span>
                </div>
                <div v-if="data.type === 'bundle'" class="pl-2 mt-1 space-y-0.5">
                  <div v-for="comp in getBundleComponents(data.id, data.name)" :key="comp.id" class="text-xs opacity-55 flex items-center gap-1">
                    <i class="pi pi-angle-right" style="font-size:0.6rem"></i>
                    <span>{{ comp.name }}</span>
                    <span class="ml-auto">{{ asCurrency(comp.price) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </Column>
          <Column header="Body Area" style="width: 160px">
            <template #body="{data}">
              <InputText
                v-if="data.type !== 'bundle' && data.type !== 'package'"
                :modelValue="data.body_area ?? ''"
                placeholder="e.g. Lower Back"
                class="w-full text-sm"
                @update:modelValue="val => setLineBodyArea(data.key, val as string)"
              />
            </template>
          </Column>
          <Column header="Unit Price" style="width: 180px">
            <template #body="{data}">
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center gap-1">
                  <InputNumber
                    :modelValue="resolveEffectiveBillingLinePrice(data)"
                    :min="0"
                    :minFractionDigits="2"
                    :maxFractionDigits="2"
                    inputClass="w-24 text-sm"
                    @update:modelValue="val => setLinePriceOverride(data.key, val)"
                  />
                  <Button
                    v-if="data.priceOverride != null"
                    text
                    rounded
                    size="small"
                    severity="secondary"
                    icon="pi pi-times"
                    v-tooltip.top="'Reset to default price'"
                    class="p-0 flex-shrink-0"
                    @click="clearLinePriceOverride(data.key)"
                  />
                </div>
                <div v-if="resolveBillingLineOriginalPrice(data) > resolveEffectiveBillingLinePrice(data)" class="text-xs opacity-50 line-through">{{ asCurrency(resolveBillingLineOriginalPrice(data)) }}</div>
              </div>
            </template>
          </Column>
          <Column header="Qty" style="width: 80px">
            <template #body="{data}">
              <InputNumber
                :modelValue="data.quantity"
                :min="1"
                inputClass="w-16"
                @update:modelValue="setLineQuantity(data.key, $event)"
              />
            </template>
          </Column>
          <Column header="Line Total" style="width: 130px">
            <template #body="{data}">
              <div>
                <div>{{ asCurrency(resolveEffectiveBillingLinePrice(data) * data.quantity) }}</div>
                <div
                  v-if="resolveBillingLineOriginalPrice(data) > resolveEffectiveBillingLinePrice(data)"
                  class="text-xs opacity-50 line-through"
                >
                  {{ asCurrency(resolveBillingLineOriginalPrice(data) * data.quantity) }}
                </div>
              </div>
            </template>
          </Column>
          <Column header="Actions" style="width: 80px">
            <template #body="{data}">
              <Button
                size="small"
                text
                severity="danger"
                icon="pi pi-trash"
                @click="removeLine(data.key)"
              />
            </template>
          </Column>
        </DataTable>
      </section>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <IftaLabel>
          <InputText v-model="form.service_name" fluid placeholder="Optional label for this billing" />
          <label>Service Name / Label</label>
        </IftaLabel>

        <IftaLabel>
          <Select
            v-if="isSelfPay"
            v-model="form.payment_type"
            :options="selfPayPaymentOptions"
            optionLabel="label"
            optionValue="value"
            fluid
          />
          <InputText v-else :modelValue="form.billing_type === 'HMO_BILLING' ? 'HMO' : 'LGU'" fluid readonly />
          <label>Payment Type</label>
        </IftaLabel>

        <IftaLabel v-if="isSelfPay">
          <InputNumber v-model="form.amount_paid" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Paid</label>
        </IftaLabel>

        <IftaLabel v-if="isSelfPay">
          <InputNumber v-model="form.amount_tendered" mode="currency" currency="PHP" locale="en-PH" fluid />
          <label>Amount Tendered</label>
        </IftaLabel>

        <div
          v-if="!isSelfPay"
          class="md:col-span-2 xl:col-span-2 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 text-sm"
        >
          <div class="text-xs uppercase tracking-wide opacity-60">Claim Workflow</div>
          <p class="mt-2 opacity-75">
            {{ formClaimWorkflowMessage }}
          </p>
        </div>
      </div>

      <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3">
        <div class="mb-2">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.senior_pwd_id_presented" type="checkbox" />
            <span>Senior/PWD ID presented</span>
          </label>
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-3">
          <label class="flex items-center gap-2 text-sm">
            <input v-model="manualDiscountEnabled" type="checkbox" />
            <span>Apply Custom Discount</span>
          </label>

          <IftaLabel v-if="manualDiscountEnabled">
            <Select
              v-model="manualDiscountType"
              :options="discountTypeOptions"
              optionLabel="label"
              optionValue="value"
              fluid
            />
            <label>Discount Type</label>
          </IftaLabel>

          <IftaLabel v-if="manualDiscountEnabled">
            <InputNumber
              v-model="manualDiscountValue"
              :min="0"
              :max="manualDiscountType === 'PERCENTAGE' ? 100 : undefined"
              fluid
            />
            <label>{{ manualDiscountType === "PERCENTAGE" ? "Discount %" : "Discount Amount" }}</label>
          </IftaLabel>

          <IftaLabel v-if="manualDiscountEnabled">
            <InputText v-model="manualDiscountReason" fluid placeholder="Optional reason" />
            <label>Discount Reason</label>
          </IftaLabel>
        </div>

        <div v-if="form.senior_pwd_id_presented || manualDiscountEnabled" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 mb-3 text-sm">
          <div v-if="form.senior_pwd_id_presented"><span class="opacity-70">Senior/PWD:</span> <strong>{{ asCurrency(posSummary.seniorDiscountAmount) }}</strong></div>
          <div v-if="manualDiscountEnabled"><span class="opacity-70">Custom Discount:</span> <strong>{{ asCurrency(posSummary.customDiscountAmount) }}</strong></div>
          <div v-if="manualDiscountEnabled && manualDiscountReason.trim()"><span class="opacity-70">Reason:</span> <strong>{{ manualDiscountReason }}</strong></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
          <div><span class="opacity-70">Original Total:</span> <strong>{{ asCurrency(posSummary.originalSubtotal) }}</strong></div>
          <div><span class="opacity-70">Subtotal:</span> <strong>{{ asCurrency(posSummary.subtotal) }}</strong></div>
          <div><span class="opacity-70">Discount:</span> <strong>{{ asCurrency(posSummary.discountAmount) }}</strong></div>
          <!-- VAT breakdown — visible only when vatEnabled (Non-VAT mode: hidden) -->
          <template v-if="vatEnabled">
            <div><span class="opacity-70">Vatable Amount:</span> <strong>{{ asCurrency(posSummary.vatableAmount) }}</strong></div>
            <div><span class="opacity-70">VAT ({{ (VAT_RATE * 100).toFixed(0) }}%):</span> <strong>{{ asCurrency(posSummary.vatAmount) }}</strong></div>
          </template>
          <div><span class="opacity-70">Total Due:</span> <strong>{{ asCurrency(posSummary.totalDue) }}</strong></div>
          <div><span class="opacity-70">Change:</span> <strong>{{ asCurrency(posSummary.changeAmount) }}</strong></div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button :label="editingBillingId ? 'Update Billing' : 'Create Billing'" icon="pi pi-save" @click="createBilling" />
        <Button v-if="editingBillingId" label="New Billing" icon="pi pi-plus" text @click="resetBillingForm" />
        <Button label="Refresh Table" icon="pi pi-refresh" outlined @click="fetchBillings" />
      </div>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold">Advanced Filters</h3>
            <p class="text-xs opacity-60">Narrow the billing records by text, type, payment, status, date, and amount.</p>
          </div>
          <Button label="Clear Filters" text @click="resetTableFilters" />
        </div>

        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <IftaLabel>
            <InputText v-model="tableFilterQuery" fluid placeholder="Search patient, label, ID" />
            <label>Search</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="tableFilterBillingType"
              :options="billingTypeOptions"
              optionLabel="label"
              optionValue="value"
              showClear
              fluid
            />
            <label>Billing Type</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="tableFilterPaymentType"
              :options="tablePaymentTypeOptions"
              optionLabel="label"
              optionValue="value"
              showClear
              fluid
            />
            <label>Payment Type</label>
          </IftaLabel>

          <IftaLabel>
            <Select
              v-model="tableFilterStatus"
              :options="tableStatusOptions"
              optionLabel="label"
              optionValue="value"
              showClear
              fluid
            />
            <label>Billing Status</label>
          </IftaLabel>

          <IftaLabel>
            <DatePicker
              v-model="tableFilterDateFrom"
              fluid
              showIcon
              iconDisplay="input"
              :manualInput="false"
              dateFormat="yy-mm-dd"
            />
            <label>Created From</label>
          </IftaLabel>

          <IftaLabel>
            <DatePicker
              v-model="tableFilterDateTo"
              fluid
              showIcon
              iconDisplay="input"
              :manualInput="false"
              dateFormat="yy-mm-dd"
            />
            <label>Created To</label>
          </IftaLabel>

          <IftaLabel>
            <InputNumber v-model="tableFilterMinDue" :min="0" fluid />
            <label>Min Due</label>
          </IftaLabel>

          <IftaLabel>
            <InputNumber v-model="tableFilterMaxDue" :min="0" fluid />
            <label>Max Due</label>
          </IftaLabel>
        </div>

        <label class="inline-flex items-center gap-2 text-sm">
          <input v-model="tableFilterOutstandingOnly" type="checkbox" />
          <span>Outstanding balances only</span>
        </label>

      <div class="text-xs opacity-60">Showing {{ filteredBillings.length }} of {{ billings.length }} billing record{{ billings.length === 1 ? '' : 's' }}</div>

      <div class="flex flex-wrap gap-2">
        <Button
          label="Export Selected Tickets PDF"
          icon="pi pi-file-pdf"
          severity="secondary"
          outlined
          :loading="exportingEncounterTicketsPdf"
          :disabled="selectedBillingRows.length === 0"
          @click="exportSelectedEncounterTicketsPdf"
        />
        <Button
          label="Export Filtered Tickets PDF"
          icon="pi pi-print"
          outlined
          :loading="exportingEncounterTicketsPdf"
          :disabled="filteredBillings.length === 0"
          @click="exportFilteredEncounterTicketsPdf"
        />
      </div>
      </div>

      <DataTable v-model:selection="selectedBillingRows" :value="filteredBillings" dataKey="id" paginator :rows="10" :loading="isLoading">
        <Column selectionMode="multiple" headerStyle="width: 3rem" />
        <Column field="created_at" header="Created" style="width: 160px" />
        <Column field="patient_name" header="Patient" style="width: 150px" />
        <Column field="billing_type" header="Billing Type" style="width: 160px" />
        <Column field="service_name" header="Label">
          <template #body="{data}">{{ data.service_name || "—" }}</template>
        </Column>
        <Column header="Due" style="width: 120px">
          <template #body="{data}">{{ asCurrency(data.amount_due) }}</template>
        </Column>
        <Column header="Paid" style="width: 120px">
          <template #body="{data}">{{ asCurrency(data.amount_paid) }}</template>
        </Column>
        <Column header="Actions" style="width: 220px">
          <template #body="{data}">
            <div class="flex items-center gap-1">
              <Button size="small" outlined icon="pi pi-eye" label="View Full Billing" @click="openBillingDetails(data.id)" />
              <Button size="small" text icon="pi pi-pencil" @click="loadBillingForEdit(data.id)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </section>

    <Dialog
      v-model:visible="billingDetailsVisible"
      header="Billing Detail"
      modal
      :style="{width: '920px'}"
      :breakpoints="{'1280px':'95vw','768px':'98vw'}"
    >
      <div v-if="selectedBillingDetail" class="space-y-4">
        <div class="rounded-2xl border border-[#A91D8B]/20 bg-[linear-gradient(120deg,rgba(36,39,87,0.08),rgba(94,24,105,0.06),rgba(169,29,139,0.10))] p-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 class="text-lg font-semibold text-[rgb(var(--app-fg))]">Billing Detail</h3>
              <p class="mt-1 text-sm opacity-70">
                Linked billing summary for the selected appointment route.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Tag :value="displayBillingType(selectedBillingDetail.billing_type)" severity="info" />
              <Tag :value="displayBillingStatus(selectedBillingDetail.billing_status)" :severity="billingStatusSeverity(selectedBillingDetail.billing_status)" />
              <Tag v-if="derivePaymentType(selectedBillingDetail)" :value="derivePaymentType(selectedBillingDetail)" severity="contrast" />
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <Button
              label="Print Receipt Copy"
              icon="pi pi-print"
              outlined
              @click="printSelectedBillingReceipt"
            />
            <Button
              v-if="canEditReceipt"
              label="Edit Receipt"
              icon="pi pi-pencil"
              severity="secondary"
              outlined
              @click="openReceiptEditor"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Patient</div>
            <div class="font-medium">{{ selectedBillingDetail.patient_name || selectedBillingDetail.patient_id }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Appointment ID</div>
            <div class="font-medium">{{ selectedBillingDetail.appointment_id || "N/A" }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Created</div>
            <div class="font-medium">{{ formatDateTime(selectedBillingDetail.created_at) }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Payment Type</div>
            <div class="font-medium">{{ derivePaymentType(selectedBillingDetail) || "N/A" }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Billing Label</div>
            <div class="font-medium">{{ selectedBillingDetail.service_name || "N/A" }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Receipt Number</div>
            <div class="font-medium">{{ selectedBillingDetail.receipt_number || "N/A" }}</div>
          </div>
        </div>

        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-semibold text-[rgb(var(--app-fg))]">Locked Encounter Tickets</h4>
              <p class="mt-1 text-xs opacity-60">
                Patient-signed attendance slips linked to this billing record are permanently locked after sign-off.
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Tag
                :value="selectedBillingEncounterTickets.length ? `${selectedBillingEncounterTickets.length} linked` : 'No tickets yet'"
                :severity="selectedBillingEncounterTickets.length ? 'success' : 'secondary'"
              />
              <Button
                v-if="selectedBillingEncounterTickets.length"
                size="small"
                icon="pi pi-file-pdf"
                label="Export All"
                outlined
                @click="exportSelectedBillingEncounterTicketsPdf"
              />
            </div>
          </div>

          <div v-if="selectedBillingEncounterTickets.length === 0" class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-5 py-8 text-center text-sm opacity-60">
            No signed encounter tickets are linked to this billing yet.
          </div>

          <div v-else class="space-y-3">
            <article
              v-for="ticket in selectedBillingEncounterTickets"
              :key="ticket.id"
              class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4"
            >
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <div class="font-semibold">{{ ticket.slip_number || `Ticket #${ticket.id}` }}</div>
                    <Tag :value="ticket.record_locked ? 'Locked' : 'Unlocked'" :severity="ticket.record_locked ? 'contrast' : 'warn'" class="text-xs" />
                  </div>
                  <div class="text-xs opacity-60">
                    Signed {{ formatDateTime(ticket.signed_off_at) }}
                    <span v-if="ticket.locked_at"> · Locked {{ formatDateTime(ticket.locked_at) }}</span>
                  </div>
                </div>
                <div class="text-sm">
                  <div class="text-xs uppercase tracking-wide opacity-55">Authorized By</div>
                  <div class="font-medium">{{ ticket.patient_acknowledged_by }}</div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Appointment</div>
                  <div class="font-medium">{{ ticket.billing_snapshot?.appointment_id || ticket.appointment_id }}</div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Attendance</div>
                  <div class="font-medium">{{ ticket.attendance_status }}</div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Service Snapshot</div>
                  <div class="font-medium">{{ ticket.billing_snapshot?.service_name || selectedBillingDetail.service_name || "N/A" }}</div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Specialty Snapshot</div>
                  <div class="font-medium">{{ ticket.billing_snapshot?.specialty_tag_name || "N/A" }}</div>
                  <div
                    v-if="ticket.billing_snapshot?.specialty_tag_name && ticket.billing_snapshot?.specialty_tag_is_active === false"
                    class="mt-1 text-xs text-slate-500"
                  >
                    Inactive now, kept for audit history.
                  </div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Treatment Area Snapshot</div>
                  <div class="font-medium">{{ ticket.billing_snapshot?.treatment_area_name || "N/A" }}</div>
                  <div
                    v-if="ticket.billing_snapshot?.treatment_area_name && ticket.billing_snapshot?.treatment_area_is_active === false"
                    class="mt-1 text-xs text-slate-500"
                  >
                    Inactive now, kept for audit history.
                  </div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Amount Snapshot</div>
                  <div class="font-medium">{{ asCurrency(ticket.billing_snapshot?.total_amount ?? selectedBillingTotalDue) }}</div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Encounter Ticket ID</div>
                  <div class="font-medium">ET-{{ ticket.id }}</div>
                  <div class="mt-1 text-xs text-slate-500">
                    Locked attendance ledger record linked to this billing.
                  </div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Active Billing Package</div>
                  <div class="font-medium">{{ describeEncounterTicketPackage(ticket) }}</div>
                  <div
                    v-if="describeEncounterTicketPackageSource(ticket)"
                    class="mt-1 text-xs text-slate-500"
                  >
                    {{ describeEncounterTicketPackageSource(ticket) }}
                  </div>
                </div>
              </div>

              <div v-if="ticket.patient_signature_data_url" class="mt-3">
                <div class="text-xs uppercase tracking-wide opacity-55">Patient Signature</div>
                <img
                  :src="ticket.patient_signature_data_url"
                  alt="Patient signature"
                  class="mt-2 max-h-40 rounded-xl border border-[rgb(var(--app-border))] bg-white p-2"
                />
              </div>

              <div class="mt-3 flex justify-end">
                <Button
                  size="small"
                  icon="pi pi-file-pdf"
                  label="Export PDF"
                  outlined
                  @click="exportSingleEncounterTicketPdf(ticket, selectedBillingDetail)"
                />
              </div>
            </article>
          </div>
        </div>

        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-semibold text-[rgb(var(--app-fg))]">Line Items</h4>
              <p class="mt-1 text-xs opacity-60">
                {{ selectedBillingLines.length }} item{{ selectedBillingLines.length === 1 ? "" : "s" }} saved on this billing.
              </p>
            </div>
            <div class="text-right">
              <div class="text-xs uppercase tracking-wide opacity-55">Total Due</div>
              <div class="mt-1 text-lg font-semibold">{{ asCurrency(selectedBillingTotalDue) }}</div>
            </div>
          </div>

          <div v-if="selectedBillingLines.length === 0" class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-5 py-8 text-center text-sm opacity-60">
            No line items found for this billing.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="line in selectedBillingLines"
              :key="line.key"
              class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3 text-sm"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <Tag v-if="line.type === 'bundle'" value="Bundle" severity="contrast" class="text-xs" />
                    <Tag v-else-if="line.type === 'package'" value="Package" severity="info" class="text-xs" />
                    <Tag v-else :value="formatType(line.type)" severity="secondary" class="text-xs" />
                    <span class="font-medium">{{ line.name }}</span>
                  </div>
                  <div class="text-xs opacity-60">Qty: {{ line.quantity }}</div>
                </div>
                <div class="shrink-0 text-right">
                  <div class="font-medium">{{ asCurrency(line.price * line.quantity) }}</div>
                  <div v-if="line.originalPrice && line.originalPrice > line.price" class="text-xs opacity-50 line-through">
                    {{ asCurrency(line.originalPrice * line.quantity) }}
                  </div>
                </div>
              </div>

              <div v-if="line.type === 'bundle'" class="mt-2 pl-2 space-y-1">
                <template v-for="cat in getBundleCategoryGroups(line.id, line.name)" :key="cat.label">
                  <div v-if="cat.items.length" class="text-xs">
                    <div class="mb-1 font-semibold opacity-70">{{ cat.label }}</div>
                    <div v-for="comp in cat.items" :key="comp.id" class="flex items-center gap-2 pl-2 opacity-60">
                      <i class="pi pi-circle-fill" style="font-size: 0.35rem"></i>
                      <span>{{ comp.name }}</span>
                      <span class="ml-auto">{{ asCurrency(comp.price) }}</span>
                    </div>
                  </div>
                </template>
              </div>
              <div v-else-if="line.type === 'package'" class="mt-2 pl-2 space-y-1">
                <template v-for="group in getSelectedBillingLineBreakdownGroups(line)" :key="group.label">
                  <div v-if="group.items.length" class="text-xs">
                    <div class="mb-1 font-semibold opacity-70">{{ group.label }}</div>
                    <div v-for="item in group.items" :key="`${group.label}-${item.name}`" class="flex items-center gap-2 pl-2 opacity-60">
                      <i class="pi pi-circle-fill" style="font-size: 0.35rem"></i>
                      <span>{{ item.name }}</span>
                      <span>x{{ item.quantity }}</span>
                      <span class="ml-auto">{{ asCurrency(item.totalPrice) }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Original Total</div>
            <div class="font-medium">{{ asCurrency(selectedBillingOriginalTotal) }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Subtotal</div>
            <div class="font-medium">{{ asCurrency(selectedBillingDetail.subtotal_amount ?? selectedBillingDetail.amount_due) }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Discount</div>
            <div class="font-medium">{{ asCurrency(selectedBillingDetail.discount_amount ?? 0) }}</div>
          </div>
          <div v-if="selectedBillingDetail.vat_enabled" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Vatable Amount</div>
            <div class="font-medium">{{ asCurrency(selectedBillingDetail.vatable_amount ?? 0) }}</div>
          </div>
          <div v-if="selectedBillingDetail.vat_enabled" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">VAT</div>
            <div class="font-medium">{{ asCurrency(selectedBillingDetail.vat_amount ?? 0) }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Total Due</div>
            <div class="font-medium">{{ asCurrency(selectedBillingTotalDue) }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Paid</div>
            <div class="font-medium">{{ asCurrency(selectedBillingAmountPaid) }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Outstanding</div>
            <div class="font-medium">{{ asCurrency(selectedBillingOutstanding) }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Change</div>
            <div class="font-medium">{{ asCurrency(selectedBillingDetail.change_amount ?? 0) }}</div>
          </div>
        </div>

        <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <template v-if="isSelectedBillingSelfPay">
            <div class="flex flex-col gap-1">
              <h4 class="text-sm font-semibold text-[rgb(var(--app-fg))]">Tender Payment</h4>
              <p class="text-xs opacity-60">
                Receive payment for this billing directly from the detail modal.
              </p>
            </div>

            <Message v-if="selectedBillingOutstanding <= 0" severity="success" :closable="false">
              This billing is already fully paid.
            </Message>

            <template v-else>
              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <IftaLabel>
                  <Select
                    v-model="billingDetailPaymentType"
                    :options="selfPayPaymentOptions"
                    optionLabel="label"
                    optionValue="value"
                    fluid
                  />
                  <label>Payment Type</label>
                </IftaLabel>

                <IftaLabel>
                  <InputNumber
                    v-model="billingTenderAmount"
                    mode="currency"
                    currency="PHP"
                    locale="en-PH"
                    fluid
                    :min="0"
                  />
                  <label>Additional Tender</label>
                </IftaLabel>

                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Payment Applied</div>
                  <div class="font-medium">{{ asCurrency(billingTenderApplied) }}</div>
                </div>

                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Resulting Change</div>
                  <div class="font-medium">{{ asCurrency(billingResultingChange) }}</div>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Outstanding Before</div>
                  <div class="font-medium">{{ asCurrency(selectedBillingOutstanding) }}</div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Paid After Tender</div>
                  <div class="font-medium">{{ asCurrency(billingResultingPaid) }}</div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Outstanding After</div>
                  <div class="font-medium">{{ asCurrency(Math.max(0, selectedBillingTotalDue - billingResultingPaid)) }}</div>
                </div>
              </div>

              <div class="flex justify-end">
                <Button
                  label="Save Payment"
                  icon="pi pi-wallet"
                  :loading="savingBillingTender"
                  :disabled="!canSaveBillingTender"
                  @click="saveBillingTender"
                />
              </div>
            </template>
          </template>

          <template v-else>
            <div class="flex flex-col gap-1">
              <h4 class="text-sm font-semibold text-[rgb(var(--app-fg))]">Claim Workflow</h4>
              <p class="text-xs opacity-60">
                Claim-based billings are tracked here, but they are not tendered like self-pay.
              </p>
            </div>

            <Message :severity="isSelectedBillingMarkedBilled ? 'success' : 'info'" :closable="false">
              {{ selectedBillingClaimWorkflowMessage }}
            </Message>

            <div v-if="canShowMarkBillingAsBilledAction" class="flex justify-end">
              <Button
                :label="isSelectedBillingMarkedBilled ? 'Marked as Billed' : 'Mark as Billed'"
                icon="pi pi-check-circle"
                outlined
                :loading="markingBillingAsBilled"
                :disabled="!canMarkSelectedBillingAsBilled"
                @click="markSelectedBillingAsBilled"
              />
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
              <div :class="billingDetailCardClass">
                <div class="text-xs uppercase tracking-wide opacity-70">Billing Route</div>
                <div class="font-medium">{{ displayBillingType(selectedBillingDetail.billing_type) }}</div>
              </div>
              <div :class="billingDetailCardClass">
                <div class="text-xs uppercase tracking-wide opacity-70">Current Paid</div>
                <div class="font-medium">{{ asCurrency(selectedBillingAmountPaid) }}</div>
              </div>
              <div :class="billingDetailCardClass">
                <div class="text-xs uppercase tracking-wide opacity-70">Claim Balance</div>
                <div class="font-medium">{{ asCurrency(selectedBillingOutstanding) }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <template #footer>
        <Button
          v-if="selectedBillingDetail"
          label="Print Receipt Copy"
          icon="pi pi-print"
          outlined
          @click="printSelectedBillingReceipt"
        />
        <Button
          v-if="selectedBillingDetail && canEditReceipt"
          label="Edit Receipt"
          icon="pi pi-pencil"
          severity="secondary"
          outlined
          @click="openReceiptEditor"
        />
        <Button label="Close" text @click="billingDetailsVisible = false" />
      </template>
    </Dialog>

    <Dialog v-model:visible="receiptEditorVisible" header="Edit Receipt" modal :style="{width: '520px'}">
      <div class="space-y-3">
        <p class="text-sm opacity-70">
          Update the printed receipt number or billing label. Product lines and totals stay based on the saved billing record.
        </p>

        <IftaLabel>
          <InputText v-model="receiptEditorNumber" fluid placeholder="Optional receipt number" />
          <label>Receipt Number</label>
        </IftaLabel>

        <IftaLabel>
          <InputText v-model="receiptEditorLabel" fluid placeholder="Optional billing label" />
          <label>Billing Label</label>
        </IftaLabel>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="receiptEditorVisible = false" />
        <Button
          label="Save Receipt"
          icon="pi pi-check"
          :loading="receiptEditorSaving"
          @click="saveReceiptEdits"
        />
      </template>
    </Dialog>

    <Dialog v-model:visible="createBundleDialogVisible" header="Create New Bundle" modal :style="{width: '520px'}">
      <div class="space-y-3">
        <p class="text-sm opacity-70">
          Save the selected individual items as a reusable bundled service with discounted price.
        </p>

        <IftaLabel>
          <InputText v-model="createBundleName" fluid placeholder="Enter bundled service name" />
          <label>Bundle Name</label>
        </IftaLabel>

        <IftaLabel>
          <InputNumber
            v-model="createBundleDiscountedPrice"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            fluid
            :min="0"
          />
          <label>Bundled Price</label>
        </IftaLabel>

        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 text-sm space-y-1">
          <div class="flex justify-between"><span class="opacity-60">Original Total</span><strong>{{ asCurrency(selectionOriginalTotal) }}</strong></div>
          <div class="flex justify-between"><span class="opacity-60">Bundled Price</span><strong>{{ asCurrency(Number(createBundleDiscountedPrice ?? 0)) }}</strong></div>
          <div class="flex justify-between text-green-600" v-if="Number(createBundleDiscountedPrice ?? 0) < selectionOriginalTotal">
            <span>You Save</span>
            <strong>{{ asCurrency(selectionOriginalTotal - Number(createBundleDiscountedPrice ?? 0)) }}</strong>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="createBundleDialogVisible = false" />
        <Button label="Save As Bundle" icon="pi pi-check" @click="saveBundleFromSelection" />
      </template>
    </Dialog>
  </main>
</template>

<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue"
import {useRoute} from "vue-router"
import axios from "axios"
import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import IftaLabel from "primevue/iftalabel"
import InputNumber from "primevue/inputnumber"
import InputText from "primevue/inputtext"
import Message from "primevue/message"
import Select from "primevue/select"
import Tag from "primevue/tag"
import {useToast} from "primevue/usetoast"
import {patientService} from "@/features/patients/api/patient.service"
import {
  billingPhase1Service,
  type BillingEncounterTicket,
  type BillingLineItem,
  type LguBudgetSummary,
  type BillingListItem,
  type BillingRequest,
  type BillingType,
  type DiscountType,
  type ServiceType
} from "@/features/billing/api/billing-phase1.service"
import {pamsAPI} from "@/utils/axios-interceptor"
import type {Lookup} from "@/models/global.model"
import type {Pageable} from "@/models/paging"
import {defaultPage, defaultPageSize} from "@/models/paging"
import type {OfferLookupDTO} from "@/models/global.model"
import type {Patient} from "@/features/patients/types/patient"
import {type BillingPickerLookup} from "@/features/billing/components/SingleServiceItemPicker.vue"
import {errorToast, successToast} from "@/utils/toast.util"
import {Status} from "@/utils/global.type"
import {patientHMOInformationService} from "@/services/patient-hmo-information.service"
import {hmoMachineRateService} from "@/services/hmo-machine-rate.service"
import {hmoTechniqueRateService} from "@/services/hmo-technique-rate.service"
import {hmoEvaluationRateService} from "@/services/hmo-evaluation-rate.service"
import {hmoAddOnRateService} from "@/services/hmo-add-on-rate.service"
import type {PatientHMOInformation} from "@/models/hmo-information"
import {
  openEncounterTicketPdfWindow,
  renderEncounterTicketPdfWindow,
  type EncounterTicketPdfCard
} from "@/utils/encounter-ticket-pdf.util"
import {
  openBillingReceiptWindow,
  renderBillingReceiptWindow,
  type BillingReceiptPrintBreakdownGroup,
  type BillingReceiptPrintSubItem
} from "@/utils/billing-receipt-print.util"

const route = useRoute()
const toast = useToast()
const isLoading = ref(false)
const copyingFromLastSession = ref(false)
const billings = ref<BillingListItem[]>([])
const selectedBillingRows = ref<BillingListItem[]>([])
const editingBillingId = ref<number>()
const billingDetailsVisible = ref(false)
const selectedBillingDetail = ref<BillingListItem>()
const billingDetailCardClass = "rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3"
const exportingEncounterTicketsPdf = ref(false)

// ── VAT ──────────────────────────────────────────────────────────────────────
// Philippines standard VAT rate. Currently Non-VAT; logic is prepared for
// future VAT registration. Toggle vatEnabled to activate the VAT flow.
const VAT_RATE = 0.12
const vatEnabled = ref(false) // set true when clinic becomes VAT-registered
// ─────────────────────────────────────────────────────────────────────────────
const createBundleDialogVisible = ref(false)
const createBundleName = ref("")
const createBundleDiscountedPrice = ref<number>(0)
const tableFilterQuery = ref("")
const tableFilterBillingType = ref<BillingType>()
const tableFilterPaymentType = ref<string>()
const tableFilterStatus = ref<string>()
const tableFilterDateFrom = ref<Date>()
const tableFilterDateTo = ref<Date>()
const tableFilterMinDue = ref<number | null>(null)
const tableFilterMaxDue = ref<number | null>(null)
const tableFilterOutstandingOnly = ref(false)
const activeLguBudgetSummary = ref<LguBudgetSummary | null>(null)
const loadingLguBudgetSummary = ref(false)
const lguBudgetSummaryError = ref("")
const roleName = ref("")
const receiptEditorVisible = ref(false)
const receiptEditorSaving = ref(false)
const receiptEditorNumber = ref("")
const receiptEditorLabel = ref("")

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) return fallback
  const status = error.response?.status
  const detail = error.response?.data?.message || error.response?.data?.detail || error.message
  return detail ? `${fallback}${status ? ` (${status})` : ""}: ${detail}` : fallback
}

type LocalService = { id: string; type: string; name: string; price: number; status: string }
type LocalBundle = { id: string; name: string; machineIds: string[]; techniqueIds: string[]; evaluationIds: string[]; addOnIds: string[]; bundledPrice: number; status: string }
type LocalPackageOffer = {
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
  evaluationQty: number
  evaluationItems?: Array<{id: string; qty: number}>
  addOnIds?: string[]
  addOnQty?: number
  addOnItems?: Array<{id: string; qty: number}>
  sessionIds?: string[]
  sessionQty?: number
  sessionItems?: Array<{id: string; qty: number}>
  packagePrice: number
  status: string
}
const localServices = ref<LocalService[]>([])
const localBundles = ref<LocalBundle[]>([])
const localPackageOffers = ref<LocalPackageOffer[]>([])
const sessionServices = ref<BillingPickerLookup[]>([])
const patientOptions = ref<Lookup[]>([])
const canEditReceipt = computed(() => roleName.value === "Owner")

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
    const id = toOptionalStringId(raw.id ?? raw.item_id ?? raw.service_id ?? raw.session_id)
    if (!id) return []
    return [{ id, qty: normalizePositiveInt(raw.qty ?? raw.quantity, 1) }]
  })

const normalizePackageStatus = (raw: Record<string, unknown>): string => {
  if (typeof raw.status === "string" && raw.status.trim()) return raw.status.trim()
  if (typeof raw.is_active === "boolean") return raw.is_active ? "Active" : "Inactive"
  if (typeof raw.is_active === "number") return raw.is_active > 0 ? "Active" : "Inactive"
  return "Active"
}

const normalizePackageServiceOffer = (value: unknown): LocalPackageOffer | null => {
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

const formatPatientName = (patient: Partial<Patient>): string => {
  const fallback = (patient as {full_name?: string}).full_name
  if (fallback && fallback.trim()) return fallback.trim()
  return [patient.first_name, patient.middle_name, patient.last_name]
    .filter((part): part is string => !!part && part.toLowerCase() !== "null")
    .join(" ")
}

const loadPatientOptions = async (): Promise<void> => {
  const lookupResponse = await patientService.getAllLookup({
    pageable_request: {
      page: defaultPage,
      size: 1000,
      name: undefined,
      status: Status.ACTIVE
    },
    clinic_id: undefined
  })

  if ((lookupResponse?.content?.length ?? 0) > 0) {
    patientOptions.value = lookupResponse?.content ?? []
    return
  }

  const allPatientsResponse = await patientService.getAll({
    pageable_request: {
      page: defaultPage,
      size: 1000,
      name: undefined,
      status: Status.ACTIVE
    },
    clinic_id: undefined
  })

  patientOptions.value = (allPatientsResponse?.content ?? []).map(patient => ({
    id: patient.id,
    name: formatPatientName(patient)
  }))
}

const syncRoleFromStorage = (): void => {
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

const loadLocalData = (): void => {
  try { localServices.value = JSON.parse(localStorage.getItem("singlePayServices") || "[]") } catch { localServices.value = [] }
  try { localBundles.value = JSON.parse(localStorage.getItem("bundledServices") || "[]") } catch { localBundles.value = [] }
  try {
    const parsed = JSON.parse(localStorage.getItem("packageServiceOffers") || "[]")
    localPackageOffers.value = Array.isArray(parsed)
      ? parsed.map(normalizePackageServiceOffer).filter((item): item is LocalPackageOffer => item !== null)
      : []
  } catch {
    localPackageOffers.value = []
  }
}

const findBundle = (bundleId?: string | number, bundleName?: string): LocalBundle | undefined => {
  const normalizedId = String(bundleId ?? "").trim()
  if (normalizedId) {
    const matchedById = localBundles.value.find(b => b.id === normalizedId)
    if (matchedById) return matchedById
  }
  const normalizedName = (bundleName ?? "").trim().toLowerCase()
  if (!normalizedName) return undefined
  return localBundles.value.find(b => b.name.trim().toLowerCase() === normalizedName)
}

const findPackageOffer = (packageId?: string | number, packageName?: string): LocalPackageOffer | undefined => {
  const normalizedId = String(packageId ?? "").trim()
  if (normalizedId) {
    const matchedById = localPackageOffers.value.find(item => item.id === normalizedId)
    if (matchedById) return matchedById
  }
  const normalizedName = (packageName ?? "").trim().toLowerCase()
  if (!normalizedName) return undefined
  return localPackageOffers.value.find(item => item.name.trim().toLowerCase() === normalizedName)
}

const getBundleComponents = (bundleId?: string | number, bundleName?: string): LocalService[] => {
  const bundle = findBundle(bundleId, bundleName)
  if (!bundle) return []
  const ids = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds, ...bundle.addOnIds]
  return ids.map(id => localServices.value.find(s => s.id === id)).filter(Boolean) as LocalService[]
}

const getBundleCategoryGroups = (bundleId?: string | number, bundleName?: string): { label: string; items: LocalService[] }[] => {
  const bundle = findBundle(bundleId, bundleName)
  if (!bundle) return []
  const resolve = (ids: string[]) => ids.map(id => localServices.value.find(s => s.id === id)).filter(Boolean) as LocalService[]
  return [
    { label: "Machines", items: resolve(bundle.machineIds) },
    { label: "Techniques", items: resolve(bundle.techniqueIds) },
    { label: "Evaluations", items: resolve(bundle.evaluationIds) },
    { label: "Add-ons", items: resolve(bundle.addOnIds) },
  ]
}

const expandQtyItems = (
  items: Array<{id: string; qty: number}> | undefined,
  ids: string[] | undefined,
  fallbackQty: number | undefined
): Array<{id?: string; qty: number}> =>
  items?.length
    ? items.map(entry => ({id: entry.id, qty: Number(entry.qty ?? 1)}))
    : (ids ?? []).map(id => ({id, qty: Number(fallbackQty ?? 1)}))

const buildBreakdownItems = (
  entries: Array<{id?: string; qty: number}>,
  resolveItem: (id: string) => {name: string; price: number} | undefined,
  multiplier = 1
): BillingReceiptPrintSubItem[] =>
  entries.flatMap(entry => {
    if (!entry.id) return []
    const resolved = resolveItem(entry.id)
    if (!resolved) return []
    const quantity = Math.max(1, Number(entry.qty ?? 1) * multiplier)
    const unitPrice = Number(resolved.price ?? 0)
    return [{
      name: resolved.name,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity
    }]
  })

const getBundleReceiptGroups = (
  bundleId?: string | number,
  bundleName?: string,
  multiplier = 1
): BillingReceiptPrintBreakdownGroup[] =>
  getBundleCategoryGroups(bundleId, bundleName)
    .filter(group => group.items.length > 0)
    .map(group => ({
      label: group.label,
      items: group.items.map(item => ({
        name: item.name,
        quantity: Math.max(1, multiplier),
        unitPrice: Number(item.price ?? 0),
        totalPrice: Number(item.price ?? 0) * Math.max(1, multiplier)
      }))
    }))

const resolveLocalServiceSummary = (id: string): {name: string; price: number} | undefined => {
  const found = localServices.value.find(item => item.id === id)
  if (!found) return undefined
  return {name: found.name, price: Number(found.price ?? 0)}
}

const resolveSessionServiceSummary = (id: string): {name: string; price: number} | undefined => {
  const found = sessionServices.value.find(item => String(item.id) === String(id))
  if (!found) return undefined
  return {name: found.name, price: Number(found.price ?? 0)}
}

const getPackageReceiptGroups = (
  packageId?: string | number,
  packageName?: string,
  multiplier = 1
): BillingReceiptPrintBreakdownGroup[] => {
  const pkg = findPackageOffer(packageId, packageName)
  if (!pkg) return []

  const groups: BillingReceiptPrintBreakdownGroup[] = []

  if (pkg.bundleId) {
    const bundle = findBundle(pkg.bundleId)
    const bundleGroups = getBundleReceiptGroups(pkg.bundleId, bundle?.name, Math.max(1, Number(pkg.bundleQty ?? 1) * multiplier))
    bundleGroups.forEach(group => {
      groups.push({
        label: bundle ? `Bundle · ${group.label} (${bundle.name})` : `Bundle · ${group.label}`,
        items: group.items
      })
    })
  }

  const itemGroups: Array<{label: string; items: BillingReceiptPrintSubItem[]}> = [
    {
      label: "Machines",
      items: buildBreakdownItems(expandQtyItems(pkg.machineItems, pkg.machineIds, pkg.machineQty), resolveLocalServiceSummary, multiplier)
    },
    {
      label: "Techniques",
      items: buildBreakdownItems(expandQtyItems(pkg.techniqueItems, pkg.techniqueIds, pkg.techniqueQty), resolveLocalServiceSummary, multiplier)
    },
    {
      label: "Evaluations",
      items: buildBreakdownItems(expandQtyItems(pkg.evaluationItems, pkg.evaluationIds, pkg.evaluationQty), resolveLocalServiceSummary, multiplier)
    },
    {
      label: "Add-ons",
      items: buildBreakdownItems(expandQtyItems(pkg.addOnItems, pkg.addOnIds, pkg.addOnQty), resolveLocalServiceSummary, multiplier)
    },
    {
      label: "Sessions",
      items: buildBreakdownItems(expandQtyItems(pkg.sessionItems, pkg.sessionIds, pkg.sessionQty), resolveSessionServiceSummary, multiplier)
    }
  ]

  itemGroups.forEach(group => {
    if (group.items.length) groups.push(group)
  })

  return groups
}

type ParsedLine = { key: string; id: string; type: string; name: string; price: number; quantity: number; originalPrice?: number }

const parsedLineItems = (raw?: string): ParsedLine[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<{ id?: string | number; type?: string; name?: string; price?: number; originalPrice?: number; quantity?: number }>
    if (!Array.isArray(parsed)) return []
    return parsed.map((line, i) => ({
      key: `${i}-${line.id ?? line.name}`,
      id: String(line.id ?? ""),
      type: line.type ?? "service",
      name: line.name ?? "—",
      price: Number(line.price ?? 0),
      quantity: Math.max(1, Number(line.quantity ?? 1)),
      originalPrice: line.originalPrice ? Number(line.originalPrice) : undefined
    }))
  } catch {
    return []
  }
}

const selectedBillingLines = computed(() => parsedLineItems(selectedBillingDetail.value?.line_items_json))
const selectedBillingEncounterTickets = computed(() => selectedBillingDetail.value?.encounter_tickets ?? [])
const formatEncounterTicketPackageSource = (value?: string): string => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "PATIENT_PACKAGE_SERVICE_PURCHASE") return "Linked from patient package service purchase"
  if (normalized === "PATIENT_PACKAGE_PURCHASE") return "Linked from patient package purchase"
  if (normalized === "PHASE1_BILLING_PACKAGE") return "Linked from the billing package record"
  if (normalized === "BILLING_LINE_ITEM_PACKAGE") return "Linked from the saved billing package line item"
  return value?.trim() || "Linked billing package"
}
const describeEncounterTicketPackage = (ticket: BillingEncounterTicket): string => {
  const packageName = ticket.active_billing_package_name?.trim()
    || ticket.billing_snapshot?.active_billing_package_name?.trim()
    || ""
  const packageId = ticket.active_billing_package_id?.trim()
    || ticket.billing_snapshot?.active_billing_package_id?.trim()
    || ""
  if (packageName && packageId && packageName !== packageId) return `${packageName} (${packageId})`
  if (packageName) return packageName
  if (packageId) return packageId
  return "No active billing package linked"
}
const describeEncounterTicketPackageSource = (ticket: BillingEncounterTicket): string | undefined => {
  const source = ticket.active_billing_package_source?.trim()
    || ticket.billing_snapshot?.active_billing_package_source?.trim()
    || ""
  if (!source) return undefined
  const packageId = ticket.active_billing_package_id?.trim()
    || ticket.billing_snapshot?.active_billing_package_id?.trim()
    || ""
  return packageId
    ? `${formatEncounterTicketPackageSource(source)} · Linked ID ${packageId}`
    : formatEncounterTicketPackageSource(source)
}

const getSelectedBillingLineBreakdownGroups = (line: {type: string; id: string | number; name: string; quantity: number}): BillingReceiptPrintBreakdownGroup[] => {
  if (line.type === "bundle") return getBundleReceiptGroups(line.id, line.name, line.quantity)
  if (line.type === "package") return getPackageReceiptGroups(line.id, line.name, line.quantity)
  return []
}

const selectedBillingOriginalTotal = computed(() =>
  selectedBillingLines.value.reduce((sum, line) => sum + Number(line.originalPrice ?? line.price ?? 0) * Number(line.quantity ?? 1), 0)
)

const selectedBillingTotalDue = computed(() =>
  Number(selectedBillingDetail.value?.total_amount ?? selectedBillingDetail.value?.amount_due ?? 0)
)

const selectedBillingAmountPaid = computed(() =>
  Number(selectedBillingDetail.value?.amount_paid ?? 0)
)

const selectedBillingOutstanding = computed(() =>
  Math.max(0, selectedBillingTotalDue.value - selectedBillingAmountPaid.value)
)

const selectedBillingReceiptLines = computed(() =>
  selectedBillingLines.value.map(line => ({
    typeLabel: line.type === "bundle" ? "Bundle" : line.type === "package" ? "Package" : formatType(line.type),
    name: line.name,
    quantity: Number(line.quantity ?? 1),
    unitPrice: Number(line.price ?? 0),
    lineTotal: Number(line.price ?? 0) * Number(line.quantity ?? 1),
    originalLineTotal: line.originalPrice && line.originalPrice > line.price
      ? Number(line.originalPrice) * Number(line.quantity ?? 1)
      : undefined,
    breakdownGroups: getSelectedBillingLineBreakdownGroups(line)
  }))
)

const billingDetailPaymentType = ref("")
const billingTenderAmount = ref<number>(0)
const savingBillingTender = ref(false)
const markingBillingAsBilled = ref(false)

const selectedBillingAmountTendered = computed(() =>
  Number(selectedBillingDetail.value?.amount_tendered ?? 0)
)

const isClaimBillingType = (billingType?: string): boolean => {
  const normalized = String(billingType ?? "").trim().toUpperCase()
  return normalized === "HMO_BILLING" || normalized === "HMO" || normalized === "LGU_BILLING" || normalized === "LGU"
}

const isSelectedBillingSelfPay = computed(() => {
  if (!selectedBillingDetail.value) return false
  return !isClaimBillingType(selectedBillingDetail.value.billing_type)
})

const selectedBillingNormalizedStatus = computed(() =>
  displayBillingStatus(selectedBillingDetail.value?.billing_status)
)

const isSelectedBillingMarkedBilled = computed(() =>
  selectedBillingNormalizedStatus.value === "BILLED"
)

const canShowMarkBillingAsBilledAction = computed(() =>
  !!selectedBillingDetail.value &&
  isClaimBillingType(selectedBillingDetail.value.billing_type) &&
  selectedBillingNormalizedStatus.value !== "PAID" &&
  selectedBillingNormalizedStatus.value !== "VOID" &&
  selectedBillingNormalizedStatus.value !== "CANCELLED"
)

const canMarkSelectedBillingAsBilled = computed(() =>
  canShowMarkBillingAsBilledAction.value && !isSelectedBillingMarkedBilled.value
)

const billingTenderInputAmount = computed(() =>
  Math.max(0, Number(billingTenderAmount.value ?? 0))
)

const billingTenderApplied = computed(() =>
  Math.min(selectedBillingOutstanding.value, billingTenderInputAmount.value)
)

const billingResultingPaid = computed(() =>
  selectedBillingAmountPaid.value + billingTenderApplied.value
)

const billingResultingAmountTendered = computed(() =>
  selectedBillingAmountTendered.value + billingTenderInputAmount.value
)

const billingResultingChange = computed(() =>
  Math.max(0, billingResultingAmountTendered.value - selectedBillingTotalDue.value)
)

const canSaveBillingTender = computed(() =>
  !!selectedBillingDetail.value &&
  isSelectedBillingSelfPay.value &&
  selectedBillingOutstanding.value > 0 &&
  billingTenderInputAmount.value > 0 &&
  !!billingDetailPaymentType.value.trim()
)

const getClaimWorkflowMessage = (billingType?: string, billingStatus?: string): string => {
  const normalized = String(billingType ?? "").trim().toUpperCase()
  const normalizedStatus = displayBillingStatus(billingStatus)
  if (normalized === "HMO_BILLING" || normalized === "HMO") {
    if (normalizedStatus === "BILLED") {
      return "This HMO transaction is already marked as billed. It is ready for downstream claim follow-through and reconciliation."
    }
    return "HMO flow: patient enlistment, LOA signature, scheduling, then billing. Payment tendering is handled outside the POS modal."
  }
  if (normalized === "LGU_BILLING" || normalized === "LGU") {
    if (normalizedStatus === "BILLED") {
      return "This LGU transaction is already marked as billed. It is ready for downstream guarantee tracking and reconciliation."
    }
    return "LGU billing follows a guarantee or sponsorship workflow. Payment tendering is handled outside the POS modal."
  }
  return ""
}

const formClaimWorkflowMessage = computed(() =>
  getClaimWorkflowMessage(form.value.billing_type)
)

const selectedBillingClaimWorkflowMessage = computed(() =>
  getClaimWorkflowMessage(selectedBillingDetail.value?.billing_type, selectedBillingDetail.value?.billing_status)
)

const formatDateTime = (value?: string | number | Date): string => {
  if (!value) return "N/A"
  return new Date(value).toLocaleString("en-PH")
}

const displayBillingType = (value?: string): string => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "SELF_PAY_SINGLE") return "Self Pay: Single Service"
  if (normalized === "SELF_PAY_PACKAGE") return "Self Pay: Package Service"
  if (normalized === "HMO_BILLING" || normalized === "HMO") return "HMO"
  if (normalized === "LGU_BILLING" || normalized === "LGU") return "LGU"
  if (normalized === "INDIVIDUAL_PRICING") return "Individual Pricing"
  if (normalized === "PACKAGE_BILLING") return "Package Billing"
  if (normalized === "ALA_CARTE") return "A La Carte"
  return value?.trim() || "N/A"
}

const buildEncounterTicketDeductionSummary = (billingType?: string): string => {
  const normalized = String(billingType ?? "")
    .trim()
    .toUpperCase()
    .replace(/:/g, "")
    .replace(/-/g, "_")
    .replace(/ /g, "_")

  if (normalized === "HMO" || normalized === "HMO_BILLING") {
    return "Deducting 1 Session from HMO Allocation"
  }
  if (normalized === "LGU" || normalized === "LGU_BILLING") {
    return "Deducting 1 Session from LGU Authorization"
  }
  if (normalized === "SELF_PAY_PACKAGE") {
    return "Recording 1 Attended Package Session"
  }
  return "Attendance record only"
}

const buildEncounterTicketPdfCards = (detail?: BillingListItem): EncounterTicketPdfCard[] => {
  if (!detail) return []

  return (detail.encounter_tickets ?? [])
    .filter(ticket => ticket.record_locked)
    .map(ticket => {
      const snapshot = ticket.billing_snapshot
      const resolvedBillingType = snapshot?.billing_type ?? detail.billing_type
      const resolvedServiceName = snapshot?.service_name || detail.service_name || "Therapy Session"

      return {
        slipNumber: ticket.slip_number || `ETS-${ticket.id}`,
        patientName: snapshot?.patient_name || detail.patient_name || "Patient",
        providerName: snapshot?.provider_name || "Unassigned",
        serviceName: resolvedServiceName,
        specialtyName: snapshot?.specialty_tag_name,
        specialtyIsActive: snapshot?.specialty_tag_is_active,
        treatmentAreaName: snapshot?.treatment_area_name,
        treatmentAreaColor: snapshot?.treatment_area_color,
        treatmentAreaIsActive: snapshot?.treatment_area_is_active,
        billingRoute: displayBillingType(resolvedBillingType),
        attendanceStatus: ticket.attendance_status === "ATTENDED" ? "Attended" : "No Show",
        attendedAt: ticket.attended_at,
        signedOffAt: ticket.signed_off_at,
        lockedAt: ticket.locked_at,
        encounterTicketId: ticket.id,
        appointmentId: snapshot?.appointment_id ?? detail.appointment_id,
        billingId: ticket.phase1_billing_id ?? detail.id,
        activeBillingPackageLabel: describeEncounterTicketPackage(ticket),
        activeBillingPackageSource: describeEncounterTicketPackageSource(ticket),
        deductionSummary: buildEncounterTicketDeductionSummary(resolvedBillingType),
        signatureDataUrl: ticket.patient_signature_data_url
      }
    })
}

const exportEncounterTicketCards = (
  cards: EncounterTicketPdfCard[],
  options: {title: string; subtitle: string; fileName: string}
): void => {
  const popup = openEncounterTicketPdfWindow(options.title)
  try {
    renderEncounterTicketPdfWindow(popup, cards, options)
  } catch (error: unknown) {
    popup.close()
    throw error
  }
}

const exportSingleEncounterTicketPdf = (ticket: BillingEncounterTicket, detail?: BillingListItem): void => {
  const cards = buildEncounterTicketPdfCards(detail).filter(card => card.slipNumber === (ticket.slip_number || `ETS-${ticket.id}`))
  if (!cards.length) {
    errorToast(toast, "No locked encounter ticket is available to export")
    return
  }

  try {
    exportEncounterTicketCards(cards, {
      title: "Encounter Ticket PDF",
      subtitle: "Single locked encounter ticket export",
      fileName: cards[0].slipNumber
    })
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to export encounter ticket PDF"))
  }
}

const exportSelectedBillingEncounterTicketsPdf = (): void => {
  const cards = buildEncounterTicketPdfCards(selectedBillingDetail.value)
  if (!cards.length) {
    errorToast(toast, "No locked encounter tickets are linked to this billing")
    return
  }

  try {
    exportEncounterTicketCards(cards, {
      title: "Billing Encounter Ticket Pack",
      subtitle: `Locked encounter tickets for Billing #${selectedBillingDetail.value?.id ?? ""}`,
      fileName: `billing-${selectedBillingDetail.value?.id ?? "encounter"}-tickets`
    })
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to export billing encounter tickets"))
  }
}

const displayBillingStatus = (value?: string): string =>
  (value?.trim() || "UNBILLED").toUpperCase()

const billingStatusSeverity = (value?: string): "success" | "warn" | "danger" | "info" => {
  const normalized = displayBillingStatus(value)
  if (normalized === "PAID") return "success"
  if (normalized === "PARTIAL" || normalized === "PENDING" || normalized === "UNBILLED") return "warn"
  if (normalized === "VOID" || normalized === "CANCELLED") return "danger"
  return "info"
}

const getRouteQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined
  return typeof value === "string" ? value : undefined
}

const normalizeBillingTypeValue = (value?: string): BillingType | undefined => {
  const normalized = String(value ?? "").trim().toLowerCase()
  if (!normalized) return undefined
  if (normalized === "self pay: single service" || normalized === "self_pay_single") return "SELF_PAY_SINGLE"
  if (normalized === "self pay: package service" || normalized === "self_pay_package") return "SELF_PAY_PACKAGE"
  if (normalized === "hmo" || normalized === "hmo_billing") return "HMO_BILLING"
  if (normalized === "lgu" || normalized === "lgu_billing") return "LGU_BILLING"
  if (normalized === "individual pricing" || normalized === "individual_pricing") return "INDIVIDUAL_PRICING"
  if (normalized === "package billing" || normalized === "package_billing") return "PACKAGE_BILLING"
  if (normalized === "ala carte" || normalized === "a la carte" || normalized === "ala_carte") return "ALA_CARTE"
  return undefined
}

const normalizePaymentType = (value?: string): string => {
  const normalized = String(value ?? "").trim().toLowerCase()
  if (!normalized) return ""
  if (normalized === "cash") return "Cash"
  if (normalized === "gcash") return "GCash"
  if (normalized === "e-wallet" || normalized === "ewallet" || normalized === "e wallet") return "E-wallet"
  if (normalized === "hmo") return "HMO"
  if (normalized === "lgu") return "LGU"
  if (normalized === "other") return "Other"
  return String(value ?? "").trim()
}

const parseRouteQueryId = (value: unknown): number | undefined => {
  const normalized = getRouteQueryValue(value)
  const parsed = Number(normalized)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const routeBillingContextKey = computed(() =>
  [
    getRouteQueryValue(route.query.patientId) ?? "",
    getRouteQueryValue(route.query.appointmentId) ?? "",
    getRouteQueryValue(route.query.billingId) ?? ""
  ].join("|")
)

const derivePaymentType = (billing: BillingListItem): string => {
  const paymentReference = normalizePaymentType(billing.payment_reference)
  if (paymentReference) return paymentReference

  const normalizedBillingType = normalizeBillingTypeValue(billing.billing_type)
  if (normalizedBillingType === "HMO_BILLING") return "HMO"
  if (normalizedBillingType === "LGU_BILLING") return "LGU"
  return ""
}

const getDefaultBillingPaymentType = (billing: BillingListItem): string => {
  const existing = derivePaymentType(billing)
  if (existing) return existing

  const normalizedBillingType = normalizeBillingTypeValue(billing.billing_type)
  if (normalizedBillingType === "HMO_BILLING") return "HMO"
  if (normalizedBillingType === "LGU_BILLING") return "LGU"
  return "Cash"
}

const tablePaymentTypeOptions = computed(() => {
  const values = new Set(selfPayPaymentOptions.map(option => option.value))
  values.add("HMO")
  values.add("LGU")
  billings.value.forEach(billing => {
    const paymentType = derivePaymentType(billing)
    if (paymentType) values.add(paymentType)
  })
  return Array.from(values).map(value => ({label: value, value}))
})

const tableStatusOptions = computed(() => {
  const values = new Set<string>()
  billings.value.forEach(billing => {
    const status = displayBillingStatus(billing.billing_status)
    if (status) values.add(status)
  })
  return Array.from(values).sort().map(value => ({label: value, value}))
})

const filteredBillings = computed(() => {
  const query = tableFilterQuery.value.trim().toLowerCase()
  const fromDate = tableFilterDateFrom.value ? new Date(tableFilterDateFrom.value) : undefined
  const toDate = tableFilterDateTo.value ? new Date(tableFilterDateTo.value) : undefined
  if (toDate) toDate.setHours(23, 59, 59, 999)

  return billings.value.filter(billing => {
    if (query) {
      const haystack = [
        String(billing.id ?? ""),
        String(billing.patient_id ?? ""),
        billing.patient_name ?? "",
        billing.service_name ?? "",
        String(billing.appointment_id ?? ""),
        billing.billing_type ?? ""
      ].join(" ").toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (tableFilterBillingType.value && normalizeBillingTypeValue(billing.billing_type) !== tableFilterBillingType.value) return false

    if (tableFilterPaymentType.value && derivePaymentType(billing) !== tableFilterPaymentType.value) return false

    if (tableFilterStatus.value && displayBillingStatus(billing.billing_status) !== tableFilterStatus.value) return false

    const createdAt = billing.created_at ? new Date(billing.created_at) : undefined
    if (fromDate && (!createdAt || createdAt < fromDate)) return false
    if (toDate && (!createdAt || createdAt > toDate)) return false

    const amountDue = Number(billing.amount_due ?? 0)
    const amountPaid = Number(billing.amount_paid ?? 0)
    if (tableFilterMinDue.value != null && amountDue < Number(tableFilterMinDue.value)) return false
    if (tableFilterMaxDue.value != null && amountDue > Number(tableFilterMaxDue.value)) return false
    if (tableFilterOutstandingOnly.value && amountPaid >= amountDue) return false

    return true
  })
})

const getBillingDetailForEncounterTicketExport = async (billingId: number): Promise<BillingListItem | undefined> => {
  if (selectedBillingDetail.value?.id === billingId && selectedBillingDetail.value.encounter_tickets) {
    return selectedBillingDetail.value
  }
  return await billingPhase1Service.getById(billingId)
}

const exportBillingEncounterTicketPack = async (billingIds: number[], sourceLabel: string): Promise<void> => {
  const uniqueIds = Array.from(new Set(
    billingIds
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0)
  ))

  if (!uniqueIds.length) {
    errorToast(toast, "Select at least one billing record first")
    return
  }

  let popup: Window
  try {
    popup = openEncounterTicketPdfWindow("Encounter Ticket PDF Pack")
  } catch (error: unknown) {
    errorToast(toast, error instanceof Error ? error.message : "Unable to open the PDF export window")
    return
  }
  exportingEncounterTicketsPdf.value = true

  try {
    const details = (await Promise.all(uniqueIds.map(id => getBillingDetailForEncounterTicketExport(id))))
      .filter((detail): detail is BillingListItem => !!detail)

    const cards = details
      .flatMap(detail => buildEncounterTicketPdfCards(detail))
      .sort((left, right) => new Date(left.signedOffAt).getTime() - new Date(right.signedOffAt).getTime())

    if (!cards.length) {
      popup.close()
      errorToast(toast, "No locked encounter tickets were found in the selected billing records")
      return
    }

    renderEncounterTicketPdfWindow(popup, cards, {
      title: "Encounter Ticket PDF Pack",
      subtitle: sourceLabel,
      fileName: `encounter-ticket-pack-${new Date().toISOString().slice(0, 10)}`
    })
  } catch (error: unknown) {
    popup.close()
    errorToast(toast, extractApiErrorMessage(error, "Failed to export encounter ticket pack"))
  } finally {
    exportingEncounterTicketsPdf.value = false
  }
}

const exportSelectedEncounterTicketsPdf = async (): Promise<void> => {
  await exportBillingEncounterTicketPack(
    selectedBillingRows.value.map(item => item.id),
    `Selected billing records · ${selectedBillingRows.value.length} chosen`
  )
}

const exportFilteredEncounterTicketsPdf = async (): Promise<void> => {
  await exportBillingEncounterTicketPack(
    filteredBillings.value.map(item => item.id),
    `Filtered billing records · ${filteredBillings.value.length} shown`
  )
}

const resetTableFilters = (): void => {
  tableFilterQuery.value = ""
  tableFilterBillingType.value = undefined
  tableFilterPaymentType.value = undefined
  tableFilterStatus.value = undefined
  tableFilterDateFrom.value = undefined
  tableFilterDateTo.value = undefined
  tableFilterMinDue.value = null
  tableFilterMaxDue.value = null
  tableFilterOutstandingOnly.value = false
}

const selfPayPaymentOptions = [
  { label: "Cash", value: "Cash" },
  { label: "GCash", value: "GCash" },
  { label: "E-wallet", value: "E-wallet" },
  { label: "Other", value: "Other" },
]

const discountTypeOptions: Array<{label: string; value: DiscountType}> = [
  {label: "Percentage", value: "PERCENTAGE"},
  {label: "Fixed Amount", value: "FIXED"},
]

const isSelfPay = computed(() =>
  form.value.billing_type === "SELF_PAY_SINGLE" || form.value.billing_type === "SELF_PAY_PACKAGE"
)

const machines = ref<BillingPickerLookup[]>([])
const techniques = ref<BillingPickerLookup[]>([])
const evaluations = ref<BillingPickerLookup[]>([])
const addOnMachines = ref<BillingPickerLookup[]>([])
const addOnTechniques = ref<BillingPickerLookup[]>([])
const addOnHomeServices = ref<BillingPickerLookup[]>([])
const billingPatientHmoId = ref<number | null>(null)
const billingPatientHmoInfo = ref<PatientHMOInformation | null>(null)
const syncingBillingHmoRates = ref(false)
const billingPatientMachineRateMap = ref<Map<number, number>>(new Map())
const billingPatientTechniqueRateMap = ref<Map<number, number>>(new Map())
const billingPatientEvaluationRateMap = ref<Map<number, number>>(new Map())
const billingPatientAddOnMachineRateMap = ref<Map<number, number>>(new Map())
const billingPatientAddOnTechniqueRateMap = ref<Map<number, number>>(new Map())
const billingPatientAddOnHomeServiceRateMap = ref<Map<number, number>>(new Map())
// Null = no HMO filter active; Set = only these IDs are covered by the HMO plan
const billingHmoMachineIds = ref<Set<number> | null>(null)
const billingHmoTechniqueIds = ref<Set<number> | null>(null)
const billingHmoEvaluationIds = ref<Set<number> | null>(null)
const billingHmoAddOnMachineIds = ref<Set<number> | null>(null)
const billingHmoAddOnTechniqueIds = ref<Set<number> | null>(null)
const billingHmoAddOnHomeServiceIds = ref<Set<number> | null>(null)

type SelectedLine = {
  key: string
  id: number | string
  type: string
  name: string
  price: number
  quantity: number
  originalPrice?: number
  priceOverride?: number
  body_area?: string
}

const selectedLines = ref<SelectedLine[]>([])
const selectedLineType = ref<SelectedLine["type"]>("machine")
const selectedLineId = ref<number | string>()
const selectedLineQty = ref<number>(1)
const selectedPackageOfferId = ref<string>()
const manualDiscountEnabled = ref(false)
const manualDiscountType = ref<DiscountType>("PERCENTAGE")
const manualDiscountValue = ref<number>(0)
const manualDiscountReason = ref("")

const activePackageOffers = computed(() =>
  localPackageOffers.value.filter(item => item.status !== "Inactive")
)

const lineTypeOptions: Array<{label: string; value: SelectedLine["type"]}> = [
  {label: "Machine", value: "machine"},
  {label: "Technique", value: "technique"},
  {label: "Evaluation", value: "evaluation"},
  {label: "Add-ons", value: "add-on-machine"},
  {label: "Add-on (Home Service)", value: "add-on-home-service"},
]

function filterByHmoIds(items: BillingPickerLookup[], allowed: Set<number> | null): BillingPickerLookup[] {
  if (form.value.billing_type !== "HMO_BILLING" || allowed === null) return items
  return items.filter(item => allowed.has(Number(item.id)))
}

const currentLineTypeOptions = computed(() => {
  const type = selectedLineType.value
  if (type === "machine")             return filterByHmoIds(machines.value,        billingHmoMachineIds.value)
  if (type === "technique")           return filterByHmoIds(techniques.value,       billingHmoTechniqueIds.value)
  if (type === "evaluation")          return filterByHmoIds(evaluations.value,      billingHmoEvaluationIds.value)
  if (type === "add-on-machine") {
    return [
      ...filterByHmoIds(addOnMachines.value, billingHmoAddOnMachineIds.value).map(item => ({...item, type: "add-on-machine" as const})),
      ...filterByHmoIds(addOnTechniques.value, billingHmoAddOnTechniqueIds.value).map(item => ({...item, type: "add-on-technique" as const}))
    ]
  }
  return filterByHmoIds(addOnHomeServices.value, billingHmoAddOnHomeServiceIds.value)
})

const selectedIndividualLines = computed(() =>
  selectedLines.value.filter(line => line.type !== "bundle" && line.type !== "package")
)

const selectionOriginalTotal = computed(() =>
  selectedIndividualLines.value.reduce((sum, line) => sum + Number(line.price ?? 0) * Number(line.quantity ?? 1), 0)
)

const buildBundlePartsFromSelection = (): {
  machineIds: string[]
  techniqueIds: string[]
  evaluationIds: string[]
  addOnIds: string[]
} => {
  const machineIds = new Set<string>()
  const techniqueIds = new Set<string>()
  const evaluationIds = new Set<string>()
  const addOnIds = new Set<string>()

  selectedIndividualLines.value.forEach(line => {
    const id = String(line.id)
    if (line.type === "machine") machineIds.add(id)
    else if (line.type === "technique") techniqueIds.add(id)
    else if (line.type === "evaluation") evaluationIds.add(id)
    else if (line.type === "add-on-machine" || line.type === "add-on-technique" || line.type === "add-on-home-service") addOnIds.add(id)
  })

  return {
    machineIds: Array.from(machineIds),
    techniqueIds: Array.from(techniqueIds),
    evaluationIds: Array.from(evaluationIds),
    addOnIds: Array.from(addOnIds),
  }
}

const normalizeIds = (ids: string[]): string[] => [...ids].map(String).sort()

const isSameStringSet = (a: string[], b: string[]): boolean => {
  const left = normalizeIds(a)
  const right = normalizeIds(b)
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

const findExistingBundleFromSelection = computed(() => {
  const parts = buildBundlePartsFromSelection()
  const hasAny = parts.machineIds.length + parts.techniqueIds.length + parts.evaluationIds.length + parts.addOnIds.length > 0
  if (!hasAny) return undefined

  return localBundles.value.find(bundle =>
    isSameStringSet(bundle.machineIds, parts.machineIds)
    && isSameStringSet(bundle.techniqueIds, parts.techniqueIds)
    && isSameStringSet(bundle.evaluationIds, parts.evaluationIds)
    && isSameStringSet(bundle.addOnIds, parts.addOnIds)
  )
})

const existingBundleMatchName = computed(() => findExistingBundleFromSelection.value?.name)

const canCreateBundleFromSelection = computed(() => {
  if (form.value.billing_type === "HMO_BILLING") return false
  if (!selectedLines.value.length) return false
  if (selectedLines.value.some(line => line.type === "bundle" || line.type === "package")) return false
  if (!selectedIndividualLines.value.length) return false
  if (selectionOriginalTotal.value <= 0) return false
  return !findExistingBundleFromSelection.value
})

const billingTypeOptions = [
  {label: "Self Pay: Single Service", value: "SELF_PAY_SINGLE"},
  {label: "Self Pay: Package Service", value: "SELF_PAY_PACKAGE"},
  {label: "HMO", value: "HMO_BILLING"},
  {label: "LGU", value: "LGU_BILLING"}
]

const fetchLookup = async (path: string): Promise<BillingPickerLookup[]> => {
  const {data} = await pamsAPI.get<Pageable<OfferLookupDTO>>(path, {
    params: {
      page: 1,
      size: 500,
      status: Status.ACTIVE
    }
  })
  return (data?.content ?? []).map(item => ({
    id: item.id,
    name: item.name,
    price: Number(item.price ?? 0)
  }))
}

const fetchSessionLookup = async (): Promise<BillingPickerLookup[]> => {
  const {data} = await pamsAPI.get<Pageable<BillingPickerLookup>>("/sessions/lookup", {
    params: {
      page: 1,
      size: 500,
      status: Status.ACTIVE
    }
  })
  return data?.content ?? []
}

const form = ref<{
  patient_id?: number
  appointment_id?: number
  billing_type: BillingType
  service_type: ServiceType
  service_name?: string
  amount_paid: number
  amount_tendered?: number
  payment_type?: string
  senior_pwd_id_presented?: boolean
  senior_pwd_id_reference?: string
}>({
  billing_type: "SELF_PAY_SINGLE",
  service_type: "SINGLE",
  amount_paid: 0,
  amount_tendered: 0,
  senior_pwd_id_presented: false
})

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", {style: "currency", currency: "PHP"})

const formatType = (type: string): string => {
  const typeMap: Record<string, string> = {
    machine: "Machine",
    technique: "Technique",
    evaluation: "Evaluation",
    "add-on-machine": "Add-ons",
    "add-on-technique": "Add-ons",
    "add-on-home-service": "Add-on (Home Service)"
  }
  return typeMap[type] || type
}

const removeLine = (key: string): void => {
  selectedLines.value = selectedLines.value.filter(item => item.key !== key)
}

const setLineQuantity = (key: string, value: number | null | undefined): void => {
  const qty = Math.max(1, Number(value ?? 1))
  selectedLines.value = selectedLines.value.map(item =>
    item.key === key
      ? {
        ...item,
        quantity: qty
      }
      : item
  )
}

const setLinePriceOverride = (key: string, value: number | null | undefined): void => {
  if (value == null) return
  const price = Math.max(0, Number(value))
  selectedLines.value = selectedLines.value.map(item =>
    item.key === key ? { ...item, priceOverride: price } : item
  )
}

const clearLinePriceOverride = (key: string): void => {
  selectedLines.value = selectedLines.value.map(item =>
    item.key === key ? { ...item, priceOverride: undefined } : item
  )
}

const setLineBodyArea = (key: string, value: string): void => {
  selectedLines.value = selectedLines.value.map(item =>
    item.key === key ? { ...item, body_area: value || undefined } : item
  )
}

const addSelectedLine = (): void => {
  if (!selectedLineId.value) return
  const found = currentLineTypeOptions.value.find(item => String(item.id) === String(selectedLineId.value))
  if (!found) return

  selectedLines.value.push({
    key: crypto.randomUUID(),
    id: found.id,
    type: found.type ?? selectedLineType.value,
    name: found.name,
    price: Number(found.price ?? 0),
    quantity: Math.max(1, Number(selectedLineQty.value ?? 1))
  })

  selectedLineId.value = undefined
  selectedLineQty.value = 1
}

const addSelectedPackageOffer = (): void => {
  if (!selectedPackageOfferId.value) return
  const found = activePackageOffers.value.find(item => item.id === selectedPackageOfferId.value)
  if (!found) return

  selectedLines.value.push({
    key: crypto.randomUUID(),
    id: found.id,
    type: "package",
    name: found.name,
    price: Number(found.packagePrice ?? 0),
    quantity: 1
  })

  selectedPackageOfferId.value = undefined
}

// Returns price before any manual override (catalogue price or HMO negotiated rate)
const resolveNaturalLinePrice = (line: SelectedLine): number => {
  if (form.value.billing_type !== "HMO_BILLING") return Number(line.price ?? 0)
  const itemId = Number(line.id)
  if (!Number.isFinite(itemId) || itemId <= 0) return Number(line.price ?? 0)

  let hmoRate: number | undefined
  if (line.type === "machine")             hmoRate = billingPatientMachineRateMap.value.get(itemId)
  else if (line.type === "technique")      hmoRate = billingPatientTechniqueRateMap.value.get(itemId)
  else if (line.type === "evaluation")     hmoRate = billingPatientEvaluationRateMap.value.get(itemId)
  else if (line.type === "add-on-machine") hmoRate = billingPatientAddOnMachineRateMap.value.get(itemId)
  else if (line.type === "add-on-technique") hmoRate = billingPatientAddOnTechniqueRateMap.value.get(itemId)
  else if (line.type === "add-on-home-service") hmoRate = billingPatientAddOnHomeServiceRateMap.value.get(itemId)
  return hmoRate ?? Number(line.price ?? 0)
}

// Returns the price to bill — manual override takes precedence over HMO/catalogue price
const resolveEffectiveBillingLinePrice = (line: SelectedLine): number => {
  if (line.priceOverride != null) return Number(line.priceOverride)
  return resolveNaturalLinePrice(line)
}

const resolveBillingLineOriginalPrice = (line: SelectedLine): number => Number(line.originalPrice ?? line.price ?? 0)

const syncBillingPatientHmoRates = async (): Promise<void> => {
  billingPatientHmoId.value = null
  billingPatientHmoInfo.value = null
  billingPatientMachineRateMap.value = new Map()
  billingPatientTechniqueRateMap.value = new Map()
  billingPatientEvaluationRateMap.value = new Map()
  billingPatientAddOnMachineRateMap.value = new Map()
  billingPatientAddOnTechniqueRateMap.value = new Map()
  billingPatientAddOnHomeServiceRateMap.value = new Map()
  billingHmoMachineIds.value = null
  billingHmoTechniqueIds.value = null
  billingHmoEvaluationIds.value = null
  billingHmoAddOnMachineIds.value = null
  billingHmoAddOnTechniqueIds.value = null
  billingHmoAddOnHomeServiceIds.value = null

  if (form.value.billing_type !== "HMO_BILLING") return
  const patientId = Number(form.value.patient_id)
  if (!Number.isFinite(patientId) || patientId <= 0) return

  syncingBillingHmoRates.value = true
  try {
  const hmoInfo = await patientHMOInformationService.getByPatientId(patientId)
  billingPatientHmoInfo.value = hmoInfo ?? null
  const hmoId = Number(hmoInfo?.hmo_id)
  if (!Number.isFinite(hmoId) || hmoId <= 0) return

  billingPatientHmoId.value = hmoId

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
  billingPatientMachineRateMap.value = machineMap
  billingHmoMachineIds.value = machineIds

  const techniqueMap = new Map<number, number>()
  const techniqueIds = new Set<number>()
  for (const r of techniqueRates ?? []) {
    const id = Number(r.technique_id); const price = Number(r.rate)
    if (Number.isFinite(id) && id > 0 && Number.isFinite(price) && price >= 0) {
      techniqueMap.set(id, price); techniqueIds.add(id)
    }
  }
  billingPatientTechniqueRateMap.value = techniqueMap
  billingHmoTechniqueIds.value = techniqueIds

  const evaluationMap = new Map<number, number>()
  const evaluationIds = new Set<number>()
  for (const r of evaluationRates ?? []) {
    const id = Number(r.evaluation_id); const price = Number(r.rate)
    if (Number.isFinite(id) && id > 0 && Number.isFinite(price) && price >= 0) {
      evaluationMap.set(id, price); evaluationIds.add(id)
    }
  }
  billingPatientEvaluationRateMap.value = evaluationMap
  billingHmoEvaluationIds.value = evaluationIds

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
  billingPatientAddOnMachineRateMap.value = addOnMachineMap
  billingHmoAddOnMachineIds.value = addOnMachineIds
  billingPatientAddOnTechniqueRateMap.value = addOnTechniqueMap
  billingHmoAddOnTechniqueIds.value = addOnTechniqueIds
  billingPatientAddOnHomeServiceRateMap.value = addOnHomeServiceMap
  billingHmoAddOnHomeServiceIds.value = addOnHomeServiceIds
  } finally {
    syncingBillingHmoRates.value = false
  }
}

const lineItemsAsPayload = computed((): BillingLineItem[] =>
  selectedLines.value.map(item => {
    const effectivePrice = resolveEffectiveBillingLinePrice(item)
    const naturalPrice = resolveNaturalLinePrice(item)
    const cataloguePrice = Number(item.price ?? 0)

    // Track reference price for strikethrough on receipt:
    // manual override → show what natural/negotiated price would have been
    // HMO discount only → show catalogue price
    // no change → no originalPrice
    let originalPrice: number | undefined
    if (item.priceOverride != null && effectivePrice !== naturalPrice) {
      originalPrice = naturalPrice
    } else if (item.originalPrice != null) {
      originalPrice = Number(item.originalPrice)
    } else if (naturalPrice !== cataloguePrice) {
      originalPrice = cataloguePrice
    }

    return {
      id: item.id,
      type: item.type as BillingLineItem["type"],
      name: item.name,
      price: effectivePrice,
      quantity: Number(item.quantity ?? 1),
      originalPrice,
      body_area: item.body_area || undefined
    }
  })
)

const originalSubtotalFromLines = computed(() =>
  selectedLines.value.reduce((sum, line) => {
    const originalUnitPrice = Number(line.originalPrice ?? line.price ?? 0)
    return sum + originalUnitPrice * Number(line.quantity ?? 1)
  }, 0)
)

const subtotalFromLines = computed(() =>
  lineItemsAsPayload.value.reduce((sum, line) => sum + line.price * line.quantity, 0)
)

const posSummary = computed(() => {
  const originalSubtotal = Number(originalSubtotalFromLines.value)
  const subtotal = Number(subtotalFromLines.value)
  const seniorDiscountAmount = form.value.senior_pwd_id_presented ? Math.max(0, subtotal * 0.2) : 0
  const remainingAfterSenior = Math.max(0, subtotal - seniorDiscountAmount)
  const customDiscountAmount = manualDiscountEnabled.value
    ? manualDiscountType.value === "PERCENTAGE"
      ? Math.max(0, remainingAfterSenior * (Number(manualDiscountValue.value ?? 0) / 100))
      : Math.max(0, Number(manualDiscountValue.value ?? 0))
    : 0
  const discountAmount = Math.min(subtotal, seniorDiscountAmount + customDiscountAmount)
  const vatableAmount = Math.max(0, subtotal - discountAmount)
  const vatAmount = vatEnabled.value ? Math.round(vatableAmount * VAT_RATE * 100) / 100 : 0
  const totalDue = Math.max(0, vatableAmount + vatAmount)
  const tendered = Number(form.value.amount_tendered ?? 0)
  const changeAmount = Math.max(0, tendered - totalDue)
  return {
    originalSubtotal,
    subtotal,
    discountAmount,
    vatableAmount,
    vatAmount,
    totalDue,
    changeAmount,
    seniorDiscountAmount,
    customDiscountAmount
  }
})

const editingLguReservedAmount = computed(() => {
  if (!editingBillingId.value || form.value.billing_type !== "LGU_BILLING") return 0
  const billingFromTable = billings.value.find(item => item.id === editingBillingId.value)
  const billingSource = selectedBillingDetail.value?.id === editingBillingId.value
    ? selectedBillingDetail.value
    : billingFromTable
  if (!billingSource || normalizeBillingTypeValue(billingSource.billing_type) !== "LGU_BILLING") return 0
  return Number(billingSource.total_amount ?? billingSource.amount_due ?? 0)
})

const lguAvailableBeforeSave = computed(() => {
  if (!activeLguBudgetSummary.value) return null
  return Number((activeLguBudgetSummary.value.remaining_amount + editingLguReservedAmount.value).toFixed(2))
})

const lguProjectedRemainingAfterSave = computed(() => {
  if (lguAvailableBeforeSave.value == null) return null
  return Number((lguAvailableBeforeSave.value - posSummary.value.totalDue).toFixed(2))
})

const lguWillExceedRemainingFund = computed(() =>
  lguProjectedRemainingAfterSave.value != null && lguProjectedRemainingAfterSave.value < 0
)

const loadLookups = async (): Promise<void> => {
  const [machinesRes, techniquesRes, evaluationsRes, addOnMachinesRes, addOnTechniquesRes, addOnHomeRes, sessionsRes] = await Promise.all([
    fetchLookup("/machines/lookup"),
    fetchLookup("/techniques/lookup"),
    fetchLookup("/evaluations/lookup"),
    fetchLookup("/add-on-machines/lookup"),
    fetchLookup("/add-on-techniques/lookup"),
    fetchLookup("/add-on-home-services/lookup"),
    fetchSessionLookup()
  ])

  await loadPatientOptions()
  machines.value = machinesRes
  techniques.value = techniquesRes
  evaluations.value = evaluationsRes
  addOnMachines.value = addOnMachinesRes
  addOnTechniques.value = addOnTechniquesRes
  addOnHomeServices.value = addOnHomeRes
  sessionServices.value = sessionsRes
  loadLocalData()
}

const fetchBillings = async (): Promise<void> => {
  try {
    isLoading.value = true
    const response = await billingPhase1Service.getAll({page: 1, size: 20})
    billings.value = response?.content ?? []
    selectedBillingRows.value = []
  } catch {
    errorToast(toast, "Failed to load billings")
  } finally {
    isLoading.value = false
  }
}

const refreshLguBudgetSummary = async (): Promise<void> => {
  if (form.value.billing_type !== "LGU_BILLING" || !form.value.patient_id) {
    activeLguBudgetSummary.value = null
    lguBudgetSummaryError.value = ""
    return
  }

  const patientId = form.value.patient_id
  const appointmentId = form.value.appointment_id

  loadingLguBudgetSummary.value = true
  try {
    activeLguBudgetSummary.value = await billingPhase1Service.getLguBudgetSummary(patientId, appointmentId) ?? null
    lguBudgetSummaryError.value = ""
  } catch (error: unknown) {
    activeLguBudgetSummary.value = null
    lguBudgetSummaryError.value = extractApiErrorMessage(error, "Failed to load LGU fund summary")
  } finally {
    loadingLguBudgetSummary.value = false
  }
}

const resetBillingForm = (): void => {
  editingBillingId.value = undefined
  selectedLines.value = []
  selectedLineType.value = "machine"
  selectedLineId.value = undefined
  selectedLineQty.value = 1
  selectedPackageOfferId.value = undefined
  activeLguBudgetSummary.value = null
  loadingLguBudgetSummary.value = false
  lguBudgetSummaryError.value = ""
  manualDiscountEnabled.value = false
  manualDiscountType.value = "PERCENTAGE"
  manualDiscountValue.value = 0
  manualDiscountReason.value = ""
  createBundleDialogVisible.value = false
  createBundleName.value = ""
  createBundleDiscountedPrice.value = 0
  form.value = {
    billing_type: "SELF_PAY_SINGLE",
    service_type: "SINGLE",
    amount_paid: 0,
    amount_tendered: 0,
    payment_type: undefined,
    senior_pwd_id_presented: false
  }
}

const copyFromLastSession = async (): Promise<void> => {
  if (!form.value.patient_id) return
  copyingFromLastSession.value = true
  try {
    // Look in already-loaded billings first
    const localMatch = billings.value
      .filter(b => b.patient_id === form.value.patient_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

    let billingId: number | undefined = localMatch?.id

    // If not found locally, try fetching from the API with a patient_id param
    if (!billingId) {
      const apiResult = await billingPhase1Service.getAll({
        patient_id: form.value.patient_id,
        page: 1,
        size: 1
      })
      billingId = apiResult?.content?.[0]?.id
    }

    if (!billingId) {
      errorToast(toast, "No previous billing found for this patient")
      return
    }

    const detail = await billingPhase1Service.getById(billingId)
    if (!detail) {
      errorToast(toast, "Failed to load previous billing details")
      return
    }

    let lines = parseBillingLines(detail.line_items_json)
    if (form.value.billing_type === "HMO_BILLING") {
      lines = lines.filter(line => line.type !== "bundle" && line.type !== "package")
    }
    if (!lines.length) {
      errorToast(toast, "Previous billing had no line items to copy")
      return
    }

    selectedLines.value = lines
    successToast(toast, `Copied ${lines.length} item${lines.length === 1 ? '' : 's'} from last session (${detail.created_at})`)
  } catch {
    errorToast(toast, "Failed to copy from last session")
  } finally {
    copyingFromLastSession.value = false
  }
}

const openCreateBundleFromSelection = (): void => {
  createBundleName.value = form.value.service_name?.trim() || `Custom Bundle ${new Date().toLocaleDateString("en-PH")}`
  createBundleDiscountedPrice.value = selectionOriginalTotal.value
  createBundleDialogVisible.value = true
}

const saveBundleFromSelection = (): void => {
  if (!canCreateBundleFromSelection.value) {
    errorToast(toast, "Selected items cannot be saved as a new bundle")
    return
  }

  const bundleName = createBundleName.value.trim()
  const discountedPrice = Number(createBundleDiscountedPrice.value ?? 0)

  if (!bundleName) {
    errorToast(toast, "Bundle name is required")
    return
  }
  if (discountedPrice < 0) {
    errorToast(toast, "Bundled price must be 0 or greater")
    return
  }

  const parts = buildBundlePartsFromSelection()
  const newBundle: LocalBundle = {
    id: `bundle-${Date.now()}`,
    name: bundleName,
    machineIds: parts.machineIds,
    techniqueIds: parts.techniqueIds,
    evaluationIds: parts.evaluationIds,
    addOnIds: parts.addOnIds,
    bundledPrice: discountedPrice,
    status: "Active"
  }

  localBundles.value = [...localBundles.value, newBundle]
  localStorage.setItem("bundledServices", JSON.stringify(localBundles.value))

  selectedLines.value = [{
    key: crypto.randomUUID(),
    id: newBundle.id,
    type: "bundle",
    name: newBundle.name,
    price: newBundle.bundledPrice,
    quantity: 1,
    originalPrice: selectionOriginalTotal.value
  }]

  form.value.service_name = newBundle.name
  createBundleDialogVisible.value = false
  successToast(toast, "Bundle created and applied to this billing")
}

const createBilling = async (): Promise<void> => {
  if (!form.value.patient_id) {
    errorToast(toast, "Patient ID is required")
    return
  }

  if (!selectedLines.value.length) {
    errorToast(toast, "Please add at least one availed product/service")
    return
  }

  const payload: BillingRequest = {
    patient_id: form.value.patient_id,
    appointment_id: form.value.appointment_id,
    billing_type: form.value.billing_type,
    service_type: form.value.service_type,
    service_name: form.value.service_name?.trim() || undefined,
    line_items_json: JSON.stringify(lineItemsAsPayload.value),
    amount_due: posSummary.value.totalDue,
    amount_paid: Number(form.value.amount_paid ?? 0),
    payment_reference: form.value.payment_type,
    discount_type: manualDiscountEnabled.value
      ? manualDiscountType.value
      : (form.value.senior_pwd_id_presented ? "PERCENTAGE" : undefined),
    discount_value: manualDiscountEnabled.value
      ? Number(manualDiscountValue.value ?? 0)
      : (form.value.senior_pwd_id_presented ? 20 : undefined),
    discount_amount: posSummary.value.discountAmount,
    subtotal_amount: posSummary.value.subtotal,
    total_amount: posSummary.value.totalDue,
    amount_tendered: form.value.amount_tendered,
    change_amount: posSummary.value.changeAmount,
    senior_pwd_id_presented: !!form.value.senior_pwd_id_presented,
    senior_pwd_id_reference: form.value.senior_pwd_id_reference?.trim() || undefined,
    notes: manualDiscountReason.value.trim() || undefined,
    // VAT fields — persisted even in Non-VAT mode for future accounting reconciliation
    vat_enabled: vatEnabled.value,
    vat_rate: vatEnabled.value ? VAT_RATE : 0,
    vatable_amount: posSummary.value.vatableAmount,
    vat_amount: posSummary.value.vatAmount,
  }

  try {
    if (editingBillingId.value) {
      await billingPhase1Service.update(editingBillingId.value, payload)
      successToast(toast, "Billing updated")
    } else {
      await billingPhase1Service.save(payload)
      successToast(toast, "Billing created")
    }
    await fetchBillings()
    resetBillingForm()
    await refreshLguBudgetSummary()
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to save billing"))
  }
}

const loadBillingForEdit = async (billingId: number): Promise<void> => {
  const detail = await billingPhase1Service.getById(billingId)
  if (!detail) return

  editingBillingId.value = detail.id
  form.value = {
    patient_id: detail.patient_id,
    appointment_id: detail.appointment_id,
    billing_type: normalizeBillingType(detail.billing_type),
    service_type: normalizeServiceType(detail.service_type),
    service_name: detail.service_name,
    amount_paid: Number(detail.amount_paid ?? 0),
    amount_tendered: Number(detail.amount_tendered ?? 0),
    payment_type: detail.payment_reference ?? (detail.billing_type === "HMO_BILLING" ? "HMO" : detail.billing_type === "LGU_BILLING" ? "LGU" : undefined),
    senior_pwd_id_presented: !!detail.senior_pwd_id_presented,
    senior_pwd_id_reference: detail.senior_pwd_id_reference
  }

  if (detail.discount_type && detail.discount_value != null) {
    manualDiscountEnabled.value = true
    manualDiscountType.value = detail.discount_type
    manualDiscountValue.value = Number(detail.discount_value ?? 0)
  }

  selectedLines.value = parseBillingLines(detail.line_items_json)
}

const buildBillingUpdatePayload = (detail: BillingListItem, overrides?: Partial<BillingRequest>): BillingRequest => ({
  patient_id: detail.patient_id,
  appointment_id: detail.appointment_id,
  package_id: detail.package_id,
  billing_type: normalizeBillingType(detail.billing_type),
  service_type: normalizeServiceType(detail.service_type),
  service_name: detail.service_name || undefined,
  line_items_json: detail.line_items_json,
  amount_due: Number(detail.amount_due ?? detail.total_amount ?? 0),
  amount_paid: Number(detail.amount_paid ?? 0),
  payment_method_id: detail.payment_method_id,
  payment_reference: detail.payment_reference || undefined,
  discount_type: detail.discount_type,
  discount_value: detail.discount_value,
  discount_amount: detail.discount_amount,
  subtotal_amount: detail.subtotal_amount,
  total_amount: detail.total_amount ?? detail.amount_due,
  amount_tendered: detail.amount_tendered,
  change_amount: detail.change_amount,
  pricing_tier: detail.pricing_tier,
  pricing_source: detail.pricing_source,
  receipt_number: detail.receipt_number,
  senior_pwd_id_presented: detail.senior_pwd_id_presented,
  senior_pwd_id_reference: detail.senior_pwd_id_reference,
  vat_enabled: detail.vat_enabled,
  vat_rate: detail.vat_rate,
  vatable_amount: detail.vatable_amount,
  vat_amount: detail.vat_amount,
  ...overrides
})

const getReceiptDisplayNumber = (detail: BillingListItem): string =>
  detail.receipt_number?.trim() || `BILL-${detail.id}`

const openBillingDetails = async (billingId: number): Promise<void> => {
  const detail = await billingPhase1Service.getById(billingId)
  if (!detail) {
    errorToast(toast, "Failed to load billing details")
    return
  }

  selectedBillingDetail.value = detail
  billingDetailPaymentType.value = getDefaultBillingPaymentType(detail)
  billingTenderAmount.value = 0
  billingDetailsVisible.value = true
}

const printSelectedBillingReceipt = (): void => {
  if (!selectedBillingDetail.value) return

  const detail = selectedBillingDetail.value
  const popup = openBillingReceiptWindow(getReceiptDisplayNumber(detail))

  try {
    renderBillingReceiptWindow(popup, {
      receiptNumber: getReceiptDisplayNumber(detail),
      billingId: detail.id,
      patientName: detail.patient_name || `Patient #${detail.patient_id}`,
      appointmentId: detail.appointment_id,
      createdAt: detail.created_at,
      billingType: displayBillingType(detail.billing_type),
      paymentType: derivePaymentType(detail) || detail.payment_reference,
      serviceLabel: detail.service_name,
      subtotal: Number(detail.subtotal_amount ?? detail.amount_due ?? detail.total_amount ?? 0),
      discount: Number(detail.discount_amount ?? 0),
      totalDue: selectedBillingTotalDue.value,
      amountPaid: selectedBillingAmountPaid.value,
      outstanding: selectedBillingOutstanding.value,
      changeAmount: Number(detail.change_amount ?? 0),
      lines: selectedBillingReceiptLines.value
    }, {
      title: "Billing Receipt Copy",
      fileName: getReceiptDisplayNumber(detail)
    })
  } catch (error: unknown) {
    popup.close()
    errorToast(toast, extractApiErrorMessage(error, "Failed to print receipt copy"))
  }
}

const openReceiptEditor = (): void => {
  if (!selectedBillingDetail.value || !canEditReceipt.value) return
  receiptEditorNumber.value = selectedBillingDetail.value.receipt_number || ""
  receiptEditorLabel.value = selectedBillingDetail.value.service_name || ""
  receiptEditorVisible.value = true
}

const saveReceiptEdits = async (): Promise<void> => {
  if (!selectedBillingDetail.value || !canEditReceipt.value) return

  const detail = selectedBillingDetail.value
  receiptEditorSaving.value = true
  try {
    await billingPhase1Service.update(detail.id, buildBillingUpdatePayload(detail, {
      receipt_number: receiptEditorNumber.value.trim() || undefined,
      service_name: receiptEditorLabel.value.trim() || undefined
    }))

    const refreshedDetail = await billingPhase1Service.getById(detail.id)
    if (!refreshedDetail) {
      errorToast(toast, "Receipt details were saved, but the billing could not be reloaded")
      return
    }

    selectedBillingDetail.value = refreshedDetail
    receiptEditorVisible.value = false
    await fetchBillings()
    successToast(toast, "Receipt details updated")
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to update receipt details"))
  } finally {
    receiptEditorSaving.value = false
  }
}

const saveBillingTender = async (): Promise<void> => {
  if (!selectedBillingDetail.value || !canSaveBillingTender.value) return

  const detail = selectedBillingDetail.value
  const paymentReference = billingDetailPaymentType.value.trim()
  const nextAmountPaid = billingResultingPaid.value
  const nextAmountTendered = billingResultingAmountTendered.value
  const nextChangeAmount = billingResultingChange.value

  savingBillingTender.value = true
  try {
    await billingPhase1Service.update(detail.id, buildBillingUpdatePayload(detail, {
      amount_paid: nextAmountPaid,
      amount_tendered: nextAmountTendered,
      change_amount: nextChangeAmount,
      payment_reference: paymentReference
    }))

    const refreshedDetail = await billingPhase1Service.getById(detail.id)
    if (!refreshedDetail) {
      errorToast(toast, "Payment saved, but the latest billing detail could not be reloaded")
      return
    }

    selectedBillingDetail.value = refreshedDetail
    billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshedDetail)
    billingTenderAmount.value = 0
    await fetchBillings()
    successToast(toast, "Billing payment tendered")
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to tender billing payment"))
  } finally {
    savingBillingTender.value = false
  }
}

const markSelectedBillingAsBilled = async (): Promise<void> => {
  if (!selectedBillingDetail.value || !canMarkSelectedBillingAsBilled.value) return

  const detail = selectedBillingDetail.value

  markingBillingAsBilled.value = true
  try {
    await billingPhase1Service.update(detail.id, buildBillingUpdatePayload(detail, {
      billing_status: "BILLED"
    }))

    const refreshedDetail = await billingPhase1Service.getById(detail.id)
    if (!refreshedDetail) {
      errorToast(toast, "Transaction was marked as billed, but the latest billing detail could not be reloaded")
      return
    }

    selectedBillingDetail.value = refreshedDetail
    billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshedDetail)
    billingTenderAmount.value = 0
    await fetchBillings()
    successToast(toast, "Transaction marked as billed")
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to mark transaction as billed"))
  } finally {
    markingBillingAsBilled.value = false
  }
}

const applyRouteBillingContext = async (): Promise<void> => {
  const patientId = parseRouteQueryId(route.query.patientId)
  const appointmentId = parseRouteQueryId(route.query.appointmentId)
  const billingId = parseRouteQueryId(route.query.billingId)

  if (!patientId && !appointmentId && !billingId) return

  resetBillingForm()
  selectedBillingDetail.value = undefined
  billingDetailsVisible.value = false

  if (patientId) form.value.patient_id = patientId
  if (appointmentId) form.value.appointment_id = appointmentId

  if (billingId) {
    await openBillingDetails(billingId)
  }
}

const normalizeBillingType = (value: string): BillingType => {
  return normalizeBillingTypeValue(value) ?? "ALA_CARTE"
}

const normalizeServiceType = (value: string): ServiceType => {
  const normalized = value.trim().toLowerCase()
  if (normalized === "package") return "PACKAGE"
  if (normalized === "hmo") return "HMO"
  if (normalized === "lgu") return "LGU"
  return "SINGLE"
}

const parseBillingLines = (raw?: string): SelectedLine[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<{id?: string | number; type?: string; name?: string; price?: number; quantity?: number; originalPrice?: number; body_area?: string}>
    if (!Array.isArray(parsed)) return []
    return parsed.map(line => ({
      key: crypto.randomUUID(),
      id: line.id ?? "",
      type: line.type ?? "service",
      name: line.name ?? "—",
      price: Number(line.price ?? 0),
      quantity: Math.max(1, Number(line.quantity ?? 1)),
      originalPrice: line.originalPrice ? Number(line.originalPrice) : undefined,
      body_area: line.body_area || undefined
    }))
  } catch {
    return []
  }
}

watch(
  () => form.value.billing_type,
  (value) => {
    const serviceTypeMap: Record<BillingType, ServiceType> = {
      SELF_PAY_SINGLE: "SINGLE",
      SELF_PAY_PACKAGE: "PACKAGE",
      HMO_BILLING: "HMO",
      LGU_BILLING: "LGU",
      INDIVIDUAL_PRICING: "SINGLE",
      PACKAGE_BILLING: "PACKAGE",
      ALA_CARTE: "SINGLE",
    }
    form.value.service_type = serviceTypeMap[value] ?? "SINGLE"
    if (value === "HMO_BILLING") {
      form.value.payment_type = "HMO"
      selectedLines.value = selectedLines.value.filter(line => line.type !== "bundle" && line.type !== "package")
      selectedPackageOfferId.value = undefined
    } else if (value === "LGU_BILLING") form.value.payment_type = "LGU"
    else form.value.payment_type = undefined
  }
)

watch(
  [() => form.value.patient_id, () => form.value.billing_type],
  async () => {
    await syncBillingPatientHmoRates()
  }
)

watch(
  [() => form.value.patient_id, () => form.value.appointment_id, () => form.value.billing_type],
  async () => {
    await refreshLguBudgetSummary()
  }
)

watch(
  routeBillingContextKey,
  async (value, previousValue) => {
    if (!value || value === previousValue) return
    await applyRouteBillingContext()
  }
)

onMounted(async () => {
  syncRoleFromStorage()
  await loadLookups()
  await fetchBillings()
  await applyRouteBillingContext()
})
</script>
