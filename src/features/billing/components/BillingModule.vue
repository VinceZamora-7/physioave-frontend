<template>
  <component :is="embedded ? 'div' : 'main'" :class="embedded ? 'space-y-4' : 'app-page-shell space-y-4'">
    <template v-if="!overlayOnly">

      <!-- â”€â”€ Section 1: Billing Records Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
      <section class="app-section-card-comfy space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="app-section-title">Billing Records</h2>
            <p class="text-sm opacity-60 mt-0.5">Search, filter, and manage all billing records.</p>
          </div>
          <div class="flex gap-2 flex-wrap">
            <Button label="Refresh" icon="pi pi-refresh" severity="secondary" outlined size="small" @click="fetchBillings" />
            <Button
              label="New Billing"
              icon="pi pi-plus"
              size="small"
              @click="openNewBillingForm"
            />
          </div>
        </div>

        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">

          <!-- Search always visible -->
          <div class="flex items-center gap-3 flex-wrap">
            <div class="flex-1 min-w-48">
              <IftaLabel>
                <InputText v-model="tableFilterQuery" fluid placeholder="Patient name, Label, Receipt Number" />
                <label>Search</label>
              </IftaLabel>
            </div>
            <div class="min-w-52">
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
            </div>
            <Button
              :label="filtersExpanded ? 'Hide Filters' : 'Advanced Filters'"
              :icon="filtersExpanded ? 'pi pi-chevron-up' : 'pi pi-filter'"
              text
              size="small"
              @click="filtersExpanded = !filtersExpanded"
            />
            <Button label="Clear" text size="small" @click="resetTableFilters" />
          </div>

          <!-- Collapsible advanced filters -->
          <Transition name="filter-expand">
            <div v-if="filtersExpanded" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                <label>Status</label>
              </IftaLabel>

              <IftaLabel>
                <DatePicker v-model="tableFilterDateFrom" fluid showIcon iconDisplay="input" :manualInput="false" dateFormat="yy-mm-dd" />
                <label>Created From</label>
              </IftaLabel>

              <IftaLabel>
                <DatePicker v-model="tableFilterDateTo" fluid showIcon iconDisplay="input" :manualInput="false" dateFormat="yy-mm-dd" />
                <label>Created To</label>
              </IftaLabel>

              <IftaLabel>
                <InputNumber v-model="tableFilterMinDue" :min="0" :minFractionDigits="0" :maxFractionDigits="0" fluid />
                <label>Min Due</label>
              </IftaLabel>

              <IftaLabel>
                <InputNumber v-model="tableFilterMaxDue" :min="0" :minFractionDigits="0" :maxFractionDigits="0" fluid />
                <label>Max Due</label>
              </IftaLabel>

              <label class="flex items-center gap-2 text-sm self-center cursor-pointer select-none">
                <input v-model="tableFilterOutstandingOnly" type="checkbox" />
                <span>Outstanding Only</span>
              </label>
            </div>
          </Transition>

          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="text-xs opacity-60">
              Showing {{ billingTableRows.length }} row{{ billingTableRows.length !== 1 ? 's' : '' }} from {{ filteredBillings.length }} billing record{{ filteredBillings.length !== 1 ? 's' : '' }}
            </div>
            <div class="flex gap-2 flex-wrap">
              <Button
                label="Export Selected PDF"
                icon="pi pi-file-pdf"
                severity="secondary"
                outlined
                size="small"
                :loading="exportingEncounterTicketsPdf"
                :disabled="selectedBillingRows.length === 0"
                @click="exportSelectedEncounterTicketsPdf"
              />
              <Button
                label="Export Filtered PDF"
                icon="pi pi-print"
                outlined
                size="small"
                :loading="exportingEncounterTicketsPdf"
                :disabled="billingTableRows.length === 0"
                @click="exportFilteredEncounterTicketsPdf"
              />
            </div>
          </div>
        </div>

        <DataTable
          v-model:selection="selectedBillingRows"
          :value="billingTableRows"
          dataKey="id"
          paginator
          :rows="10"
          :loading="isLoading"
        >
          <Column selectionMode="multiple" headerStyle="width: 3rem" />
          <Column field="created_at" header="Date" style="width: 140px">
            <template #body="{data}">
              <div class="text-sm">{{ formatDate(data.created_at) }}</div>
            </template>
          </Column>
          <Column field="patient_name" header="Patient" style="width: 160px">
            <template #body="{data}">
              <span class="uppercase">{{ data.patient_name || "—" }}</span>
            </template>
          </Column>
          <Column field="billing_type" header="Billing Type" style="width: 190px">
            <template #body="{data}">
              <div class="flex flex-col gap-1">
                <Tag
                  :value="billingTableTypeLabel(data)"
                  :severity="billingTableTypeSeverity(data)"
                  class="w-fit text-xs font-semibold"
                />
                <span v-if="data.is_lgu_group_row" class="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  Per appointment
                </span>
              </div>
            </template>
          </Column>
          <Column header="Label / Receipt" >
            <template #body="{data}">
              <div>
                <div class="font-medium">{{ data.service_name || "â€”" }}</div>
                <div v-if="data.is_package_group_row || data.is_lgu_group_row" class="text-xs opacity-60">
                  {{ data.package_group_billing_count }} billing{{ data.package_group_billing_count !== 1 ? 's' : '' }}
                  <span v-if="data.total_sessions"> · {{ data.total_sessions }} session{{ data.total_sessions !== 1 ? 's' : '' }}</span>
                </div>
                <div v-if="data.is_lgu_group_row && (data.lgu_program_name || data.lgu_reference_label)" class="text-xs opacity-50">
                  {{ [data.lgu_program_name, data.lgu_reference_label].filter(Boolean).join(" · ") }}
                </div>
                <div v-if="data.receipt_number" class="text-xs opacity-50">{{ data.receipt_number }}</div>
              </div>
            </template>
          </Column>
          <Column header="Status" style="width: 110px">
            <template #body="{data}">
              <Tag
                :value="displayBillingStatus(resolveBillingRuntimeStatus(data))"
                :severity="billingStatusSeverity(resolveBillingRuntimeStatus(data))"
                class="text-xs"
              />
            </template>
          </Column>
          <Column header="Due" style="width: 110px">
            <template #body="{data}">{{ asCurrency(data.package_total_due ?? data.amount_due) }}</template>
          </Column>
          <Column header="Paid" style="width: 110px">
            <template #body="{data}">
              <span :class="Number(data.package_total_paid ?? data.amount_paid) >= Number(data.package_total_due ?? data.amount_due) && Number(data.package_total_due ?? data.amount_due) > 0 ? 'text-green-600 dark:text-green-400 font-medium' : ''">
                {{ asCurrency(data.package_total_paid ?? data.amount_paid) }}
              </span>
            </template>
          </Column>
          <Column header="Actions" style="width: 270px">
            <template #body="{data}">
              <div class="flex flex-wrap items-center gap-1">
                <Button size="small" outlined icon="pi pi-eye" label="View" @click="openBillingDetails(data.representative_billing_id ?? data.id)" />
                <Button
                  v-if="isLguBillingRow(data) && !data.is_package_group_row && !data.is_lgu_group_row"
                  size="small"
                  outlined
                  icon="pi pi-file"
                  label="Print Invoice"
                  :disabled="!canPrintLguAppointmentInvoice(data)"
                  v-tooltip.top="getLguAppointmentInvoiceTooltip(data)"
                  @click="printLguAppointmentInvoice(data)"
                />
                <Button size="small" text icon="pi pi-pencil" v-tooltip.top="billingEditTooltip(resolveBillingRuntimeStatus(data))" @click="loadBillingForEdit(data.representative_billing_id ?? data.id)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </section>

      <!-- â”€â”€ Section 2: POS / Create & Edit Billing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
      <section ref="posSection" class="app-section-card-comfy space-y-4">
        <!-- POS section header â€” always visible -->
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="app-section-title">
              {{ editingBillingId ? 'Edit Billing' : 'Create New Billing' }}
            </h2>
            <p v-if="editingBillingId" class="text-sm opacity-60 mt-0.5">
              Editing billing #{{ editingBillingId }}
              <span v-if="editingBillingStatus" class="ml-2">
                <Tag :value="displayBillingStatus(editingBillingStatus)" :severity="billingStatusSeverity(editingBillingStatus)" class="text-xs" />
              </span>
            </p>
            <p v-else class="text-sm opacity-60 mt-0.5">Build and save a new billing record for a patient.</p>
          </div>
          <div class="flex gap-2">
            <Button
              :icon="posExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
              :label="posExpanded ? 'Collapse' : 'Expand'"
              text
              size="small"
              @click="toggleBillingForm"
            />
            <Button
              v-if="editingBillingId"
              label="Cancel Edit"
              icon="pi pi-times"
              text
              size="small"
              severity="secondary"
              @click="resetBillingForm"
            />
          </div>
        </div>

        <!-- Collapsible POS body -->
        <Transition name="filter-expand">
          <div v-if="posExpanded" class="space-y-4">

            <!-- â”€â”€ Billing Mode Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
            <Transition name="billing-mode">
              <div
                v-if="form.billing_type"
                :class="billingModeBannerClass"
                class="rounded-xl px-4 py-2.5 flex items-center gap-3 text-sm font-medium transition-all duration-200"
              >
                <i :class="billingModeIcon" class="text-base" />
                <span>{{ billingModeLabel }}</span>
                <span class="ml-auto opacity-70 text-xs font-normal">{{ billingModeHint }}</span>
              </div>
            </Transition>

            <!-- Patient + Billing Type row -->
            <div class="grid gap-3 md:grid-cols-3">
              <IftaLabel class="md:col-span-1">
                <Select
                  v-model="form.patient_id"
                  :options="patientOptions"
                  optionLabel="name"
                  optionValue="id"
                  filter
                  showClear
                  fluid
                  placeholder="Search patient"
                >
                  <template #option="{ option }">
                    <span class="uppercase">{{ option.name }}</span>
                  </template>
                  <template #value="{ value, placeholder }">
                    <span v-if="value !== null && value !== undefined" class="uppercase">
                      {{ patientOptions.find(patient => patient.id === value)?.name || '' }}
                    </span>
                    <span v-else>{{ placeholder }}</span>
                  </template>
                </Select>
                <label>Patient Name</label>
              </IftaLabel>

              <IftaLabel>
                <Select
                  v-model="form.billing_type"
                  :options="billingTypeOptions"
                  optionLabel="label"
                  optionValue="value"
                  fluid
                />
                <label>Billing Type</label>
              </IftaLabel>

              <IftaLabel>
                <InputNumber v-model="form.appointment_id" :min="1" :minFractionDigits="0" :maxFractionDigits="0" fluid placeholder="Optional" />
                <label>Linked Appointment ID</label>
              </IftaLabel>
            </div>

            <!-- HMO / LGU contextual messages -->
            <template v-if="form.billing_type === 'HMO_BILLING'">
              <Message v-if="billingPatientHmoInfo" severity="info" :closable="false" size="small">
                <span class="font-medium">{{ billingPatientHmoInfo.hmo_name }}</span>
                &nbsp;Â·&nbsp;{{ billingPatientHmoInfo.hmo_type_name }}
                &nbsp;Â·&nbsp;{{ billingPatientHmoInfo.company_name }}
              </Message>
              <Message v-else-if="form.patient_id && !syncingBillingHmoRates" severity="warn" :closable="false" size="small">
                No HMO information on file for this patient. Register HMO via the Patients module first.
              </Message>
              <div class="grid gap-3 md:grid-cols-2">
                <IftaLabel>
                  <InputText v-model="form.loa_number" fluid placeholder="Optional until HMO releases LOA" />
                  <label>LOA Number</label>
                </IftaLabel>
                <IftaLabel>
                  <InputText v-model="form.loa_date" type="date" fluid />
                  <label>LOA / Invoice Date</label>
                </IftaLabel>
              </div>
            </template>

            <template v-if="form.billing_type === 'LGU_BILLING'">
              <Message v-if="loadingLguBudgetSummary" severity="secondary" :closable="false" size="small">
                Loading active LGU fund summaryâ€¦
              </Message>
              <Message v-else-if="activeLguBudgetSummary" severity="info" :closable="false" size="small">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span class="font-medium">{{ activeLguBudgetSummary.program_name }}</span>
                  <span class="opacity-70">{{ activeLguBudgetSummary.period_year }}-{{ String(activeLguBudgetSummary.period_month).padStart(2, "0") }}</span>
                  <span>Remaining: <strong>{{ asCurrency(activeLguBudgetSummary.remaining_amount) }}</strong></span>
                  <template v-if="lguProjectedRemainingAfterSave != null">
                    <span class="opacity-60">â†’</span>
                    <span :class="lguProjectedRemainingAfterSave != null && lguProjectedRemainingAfterSave < 0 ? 'text-amber-600 font-semibold' : ''">
                      After save: {{ asCurrency(lguProjectedRemainingAfterSave) }}
                    </span>
                  </template>
                </div>
              </Message>
              <Message v-if="activeLguBudgetSummary && lguAvailableBeforeSave != null && editingLguReservedAmount > 0" severity="secondary" :closable="false" size="small">
                Available for this edited billing: {{ asCurrency(lguAvailableBeforeSave) }}
              </Message>
              <Message v-else-if="lguBudgetSummaryError" severity="warn" :closable="false" size="small">
                {{ lguBudgetSummaryError }}
              </Message>
              <Message v-else-if="form.patient_id && !activeLguBudgetSummary && !loadingLguBudgetSummary" severity="warn" :closable="false" size="small">
                No active LGU budget period is configured yet. Saving an appointment-linked LGU billing will create a tracking ledger automatically.
              </Message>
            </template>

            <!-- Line Items -->
            <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h4 class="text-sm font-semibold">Line Items</h4>
                <div class="flex items-center gap-2 flex-wrap">
                  <small v-if="existingBundleMatchName" class="text-xs opacity-60">Matches bundle: {{ existingBundleMatchName }}</small>
                  <Button
                    v-if="canCreateBundleFromSelection"
                    size="small"
                    outlined
                    icon="pi pi-box"
                    label="Create Bundle"
                    @click="openCreateBundleFromSelection"
                  />
                  <Button
                    v-if="form.patient_id"
                    size="small"
                    outlined
                    icon="pi pi-history"
                    label="Copy Last Session"
                    :loading="copyingFromLastSession"
                    @click="copyFromLastSession"
                  />
                </div>
              </div>

              <!-- Add-line controls -->
              <div class="grid gap-2 md:grid-cols-[160px_1fr_100px_auto] items-end">
                <IftaLabel v-if="form.billing_type !== 'HMO_BILLING'" class="hidden xl:block">
                  <Select
                    v-model="selectedPackageOfferId"
                    :options="activePackageOffers"
                    optionLabel="name"
                    optionValue="id"
                    showClear
                    filter
                    fluid
                    placeholder="Package offer"
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
                    @keydown.enter.prevent="addSelectedLine"
                  />
                  <label>Service / Add-on</label>
                </IftaLabel>

                <IftaLabel>
                  <InputNumber v-model="selectedLineQty" :min="1" :minFractionDigits="0" :maxFractionDigits="0" fluid @keydown.enter.prevent="addSelectedLine" />
                  <label>Qty</label>
                </IftaLabel>

                <Button
                  label="Add"
                  icon="pi pi-plus"
                  outlined
                  @click="addSelectedLine"
                  v-tooltip.top="'Enter to add'"
                />
              </div>

              <div v-if="form.billing_type !== 'HMO_BILLING'" class="flex flex-wrap gap-2 xl:hidden">
                <IftaLabel class="w-full md:w-64">
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
                <Button
                  label="Add Package"
                  icon="pi pi-box"
                  text
                  :disabled="!selectedPackageOfferId"
                  @click="addSelectedPackageOffer"
                />
              </div>
              <div v-if="form.billing_type !== 'HMO_BILLING'" class="hidden xl:flex gap-2">
                <Button
                  label="Add Package Offer"
                  icon="pi pi-box"
                  text
                  :disabled="!selectedPackageOfferId"
                  @click="addSelectedPackageOffer"
                />
              </div>

              <!-- Empty state -->
              <div
                v-if="selectedLines.length === 0"
                class="rounded-lg border border-dashed border-[rgb(var(--app-border))] py-8 text-center space-y-2"
              >
                <i class="pi pi-inbox text-2xl opacity-30" />
                <p class="text-sm opacity-50">No line items yet</p>
                <p class="text-xs opacity-40">Select a service type and item above, then click Add</p>
              </div>

              <!-- Line items table -->
              <DataTable
                v-else
                :value="selectedLines"
                size="small"
                dataKey="key"
                class="rounded-lg border border-[rgb(var(--app-border))]"
              >
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

                <!-- Expandable body area: click row to reveal -->
                <Column header="Body Area" style="width:150px">
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

                <Column header="Unit Price" style="width:190px">
                  <template #body="{data}">
                    <div class="flex flex-col gap-0.5">
                      <div class="flex items-center gap-1">
                        <InputNumber
                          :modelValue="resolveEffectiveBillingLinePrice(data)"
                          :min="0"
                          :minFractionDigits="0"
                          :maxFractionDigits="0"
                          inputClass="w-24 text-sm"
                          @update:modelValue="val => setLinePriceOverride(data.key, val)"
                        />
                        <Button
                          v-if="data.priceOverride != null"
                          text rounded size="small" severity="secondary"
                          icon="pi pi-times"
                          v-tooltip.top="'Reset to default price'"
                          class="p-0 flex-shrink-0"
                          @click="clearLinePriceOverride(data.key)"
                        />
                      </div>
                      <div
                        v-if="billingLineHasCustomPriceBasis(data)"
                        class="text-xs opacity-50"
                      >Original: {{ asCurrency(resolveBillingLineOriginalPrice(data)) }}</div>
                    </div>
                  </template>
                </Column>

                <Column header="Qty" style="width:80px">
                  <template #body="{data}">
                    <InputNumber
                      :modelValue="data.quantity"
                      :min="1"
                      :minFractionDigits="0"
                      :maxFractionDigits="0"
                      inputClass="w-16"
                      @update:modelValue="setLineQuantity(data.key, $event)"
                    />
                  </template>
                </Column>

                <Column header="Line Total" style="width:130px">
                  <template #body="{data}">
                    <div>
                      <div class="font-medium">{{ asCurrency(resolveEffectiveBillingLinePrice(data) * data.quantity) }}</div>
                      <div
                        v-if="billingLineHasCustomPriceBasis(data)"
                        class="text-xs opacity-50"
                      >Original: {{ asCurrency(resolveBillingLineOriginalPrice(data) * data.quantity) }}</div>
                    </div>
                  </template>
                </Column>

                <Column style="width:60px">
                  <template #body="{data}">
                    <Button size="small" text severity="danger" icon="pi pi-trash" @click="removeLine(data.key)" />
                  </template>
                </Column>
              </DataTable>
            </section>

            <!-- â”€â”€ Discounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
            <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
              <h4 class="text-sm font-semibold">Discounts</h4>

              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input v-model="form.senior_pwd_id_presented" type="checkbox" />
                  <span>Senior / PWD ID presented
                    <span class="opacity-50 text-xs">(20% discount on one item â€” RA 9994)</span>
                  </span>
                </label>

                <template v-if="form.senior_pwd_id_presented">
                  <div
                    v-if="seniorDiscountIsAutoAssigned && seniorDiscountEffectiveTargetKey"
                    class="flex items-center gap-1.5 text-xs text-sky-700 dark:text-sky-400 pl-5"
                  >
                    <i class="pi pi-info-circle" />
                    <span>
                      Auto-applied to <strong>{{ selectedLines.find(l => l.key === seniorDiscountEffectiveTargetKey)?.name }}</strong>
                      â€” because a {{ form.billing_type === 'SELF_PAY_PACKAGE' ? 'Package' : 'Bundle' }} is in the cart.
                    </span>
                  </div>

                  <div v-else-if="!seniorDiscountIsAutoAssigned && selectedLines.length > 0" class="pl-5 md:w-1/2">
                    <p class="text-xs opacity-60 mb-1.5">Select which service receives the 20% privilege discount:</p>
                    <IftaLabel>
                      <Select
                        v-model="seniorDiscountTargetKey"
                        :options="seniorDiscountSelectableLines"
                        optionLabel="label"
                        optionValue="key"
                        showClear
                        fluid
                        placeholder="Select service"
                      />
                      <label>Senior/PWD Discount Applies To</label>
                    </IftaLabel>
                  </div>

                  <p v-else-if="!selectedLines.length" class="text-xs opacity-60 pl-5">
                    Add services above to choose which item gets the 20% discount.
                  </p>
                </template>
              </div>

              <div class="grid gap-3 md:grid-cols-4">
                <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input v-model="manualDiscountEnabled" type="checkbox" />
                  <span>Custom Discount</span>
                </label>

                <IftaLabel v-if="manualDiscountEnabled">
                  <Select v-model="manualDiscountType" :options="discountTypeOptions" optionLabel="label" optionValue="value" fluid />
                  <label>Discount Type</label>
                </IftaLabel>

                <IftaLabel v-if="manualDiscountEnabled">
                  <InputNumber
                    v-model="manualDiscountValue"
                    :min="0"
                    :max="manualDiscountType === 'PERCENTAGE' ? 100 : undefined"
                    :minFractionDigits="0"
                    :maxFractionDigits="0"
                    fluid
                  />
                  <label>{{ manualDiscountType === "PERCENTAGE" ? "Discount %" : "Discount Amount" }}</label>
                </IftaLabel>

                <IftaLabel v-if="manualDiscountEnabled">
                  <InputText v-model="manualDiscountReason" fluid placeholder="Optional reason" />
                  <label>Discount Reason</label>
                </IftaLabel>
              </div>
            </section>

            <!-- â”€â”€ Payment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
            <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
              <h4 class="text-sm font-semibold">Payment</h4>
              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <IftaLabel>
                  <InputText v-model="form.service_name" fluid placeholder="Optional label" />
                  <label>Billing Label</label>
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
                  <InputText
                    v-else
                    :modelValue="form.billing_type === 'HMO_BILLING' ? 'HMO' : 'LGU'"
                    fluid
                    readonly
                  />
                  <label>Payment Method</label>
                </IftaLabel>

                <template v-if="isSelfPay">
                  <IftaLabel>
                    <InputNumber
                      v-model="form.amount_tendered"
                      mode="currency"
                      currency="PHP"
                      locale="en-PH"
                      fluid
                      inputClass="tender-amount-input"
                      :min="0"
                      :minFractionDigits="0"
                      :maxFractionDigits="0"
                      @focus="selectNumericInputText"
                    />
                    <label>Amount Tendered</label>
                  </IftaLabel>

                  <!-- Derived: amount paid and change are computed, not manual inputs -->
                  <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-1 text-sm">
                    <div class="flex justify-between">
                      <span class="opacity-60">Applied</span>
                      <strong>{{ asCurrency(Math.min(posSummary.totalDue, Number(form.amount_tendered ?? 0))) }}</strong>
                    </div>
                    <div class="flex justify-between" :class="posSummary.changeAmount > 0 ? 'text-green-600 dark:text-green-400' : ''">
                      <span class="opacity-60">Change</span>
                      <strong>{{ asCurrency(posSummary.changeAmount) }}</strong>
                    </div>
                    <div
                      v-if="Number(form.amount_tendered ?? 0) > 0 && Number(form.amount_tendered ?? 0) < posSummary.totalDue"
                      class="text-xs text-orange-600 dark:text-orange-400 mt-1"
                    >
                      Partial payment - remaining {{ asCurrency(posSummary.totalDue - Number(form.amount_tendered ?? 0)) }}
                    </div>
                  </div>
                </template>

                <div
                  v-else
                  class="md:col-span-2 xl:col-span-2 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 text-sm"
                >
                  <div class="text-xs uppercase tracking-wide opacity-60">Claim Workflow</div>
                  <p class="mt-2 opacity-75">{{ formClaimWorkflowMessage }}</p>
                </div>
              </div>
            </section>

            <!-- â”€â”€ Sticky Financial Summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
            <div class="sticky bottom-0 z-10 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-surface,var(--app-bg)))] shadow-sm p-3">
              <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 text-sm">
                <div>
                  <div class="text-xs opacity-60">Subtotal</div>
                  <div class="font-semibold">{{ asCurrency(posSummary.subtotal) }}</div>
                </div>
                <div v-if="posSummary.seniorDiscountAmount > 0">
                  <div class="text-xs opacity-60">Senior/PWD</div>
                  <div class="font-semibold text-orange-500">âˆ’{{ asCurrency(posSummary.seniorDiscountAmount) }}</div>
                </div>
                <div v-if="posSummary.customDiscountAmount > 0">
                  <div class="text-xs opacity-60">Discount</div>
                  <div class="font-semibold text-orange-500">âˆ’{{ asCurrency(posSummary.customDiscountAmount) }}</div>
                </div>
                <template v-if="vatEnabled">
                  <div>
                    <div class="text-xs opacity-60">Vatable</div>
                    <div class="font-semibold">{{ asCurrency(posSummary.vatableAmount) }}</div>
                  </div>
                  <div>
                    <div class="text-xs opacity-60">VAT ({{ (VAT_RATE * 100).toFixed(0) }}%)</div>
                    <div class="font-semibold">{{ asCurrency(posSummary.vatAmount) }}</div>
                  </div>
                </template>
                <div>
                  <div class="text-xs opacity-60">Total Due</div>
                  <div class="font-bold text-base">{{ asCurrency(posSummary.totalDue) }}</div>
                </div>
                <div v-if="isSelfPay">
                  <div class="text-xs opacity-60">Change</div>
                  <div
                    class="font-semibold"
                    :class="posSummary.changeAmount > 0 ? 'text-green-600 dark:text-green-400' : ''"
                  >{{ asCurrency(posSummary.changeAmount) }}</div>
                </div>
              </div>

              <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[rgb(var(--app-border))]">
                <Button
                  :label="editingBillingId ? 'Update Billing' : 'Create Billing'"
                  icon="pi pi-save"
                  @click="createBilling"
                />
                <Button v-if="editingBillingId" label="Cancel Edit" icon="pi pi-times" text @click="resetBillingForm" />
              </div>
            </div>

          </div>
        </Transition>
      </section>
    </template>

    <!-- â”€â”€ Billing Detail Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
    <Dialog
      v-model:visible="billingDetailsVisible"
      header="Billing Detail"
      modal
      :style="{width: '920px'}"
      :breakpoints="{'1280px':'95vw','768px':'98vw'}"
    >
      <div v-if="selectedBillingDetail" class="flex flex-col gap-4">

        <!-- Header card -->
        <div class="app-hero-panel order-1">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 class="text-lg font-semibold">Billing Detail</h3>
              <p class="mt-1 text-xs opacity-60">
                1) Verify essentials and totals Â· 2) Tender or complete claim workflow Â· 3) Review line items Â· 4) Optional audit review
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Tag :value="displayBillingType(selectedBillingDetail.billing_type)" severity="info" />
              <Tag :value="displayBillingStatus(resolveBillingRuntimeStatus(selectedBillingDetail))" :severity="billingStatusSeverity(resolveBillingRuntimeStatus(selectedBillingDetail))" />
              <Tag v-if="derivePaymentType(selectedBillingDetail)" :value="derivePaymentType(selectedBillingDetail)" severity="contrast" />
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
<Button
  :label="selectedBillingPrintButtonLabel"
  icon="pi pi-print"
  outlined
  :disabled="!canPrintSelectedBillingReceipt"
  v-tooltip.top="printReceiptTooltip"
  @click="printSelectedBillingReceipt"
/>            <Button
              v-if="selectedBillingDetail && canPrintPatientInvoiceCopy"
              label="Print Patient Statement"
              icon="pi pi-file"
              outlined
              @click="printSelectedPatientInvoiceCopy"
            />
            <Button
              v-if="canEditReceipt"
              label="Edit Receipt"
              icon="pi pi-pencil"
              severity="secondary"
              outlined
              v-tooltip.top="isSelectedBillingPaid ? 'Open in locked mode (paid)' : 'Edit receipt details'"
              @click="openReceiptEditor"
            />
          </div>
        </div>

        <Message v-if="isSelectedBillingPaid" severity="warn" :closable="false">
          Editing is locked for paid billings.
        </Message>

        <!-- Essentials -->
        <div class="order-2 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Patient</div>
            <div class="font-medium uppercase">{{ selectedBillingDetail.patient_name || selectedBillingDetail.patient_public_id || selectedBillingDetail.patient_id }}</div>
            <div class="mt-1 text-xs opacity-60">{{ selectedBillingDetail.patient_public_id || "Patient record code pending" }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Billing Record ID</div>
            <div class="font-medium">{{ selectedBillingDetail.public_id || "Billing record code pending" }}</div>
            <div class="mt-1 text-xs opacity-60">Receipt {{ selectedBillingDetail.receipt_number || "N/A" }}</div>
          </div>
          <div v-if="!isSelectedBillingSelfPay" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Appointment Record</div>
            <div class="font-medium">{{ selectedBillingDetail.appointment_public_id || "N/A" }}</div>
          </div>
          <div v-if="!isSelectedBillingSelfPay" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Created</div>
            <div class="font-medium">{{ formatDateTime(selectedBillingDetail.created_at) }}</div>
          </div>
          <div v-if="!isSelectedBillingSelfPay" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Billing Label</div>
            <div class="font-medium">{{ selectedBillingDetail.service_name || "N/A" }}</div>
          </div>
          <div v-if="!isSelectedBillingSelfPay" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Payment Type</div>
            <div class="font-medium">{{ derivePaymentType(selectedBillingDetail) || "N/A" }}</div>
          </div>
        </div>

        <!-- Financial summary -->
        <div class="order-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          <div v-if="!isSelectedBillingSelfPay" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Original Total</div>
            <div class="font-medium">{{ asCurrency(selectedBillingOriginalTotal) }}</div>
          </div>
          <div v-if="!isSelectedBillingSelfPay" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Subtotal</div>
            <div class="font-medium">{{ asCurrency(selectedBillingDetail.subtotal_amount ?? selectedBillingDetail.amount_due) }}</div>
          </div>
          <div v-if="!isSelectedBillingSelfPay" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Discount</div>
            <div class="font-medium">{{ asCurrency(selectedBillingDetail.discount_amount ?? 0) }}</div>
          </div>
          <div v-if="!isSelectedBillingSelfPay && selectedBillingDetail.vat_enabled" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Vatable Amount</div>
            <div class="font-medium">{{ asCurrency(selectedBillingDetail.vatable_amount ?? 0) }}</div>
          </div>
          <div v-if="!isSelectedBillingSelfPay && selectedBillingDetail.vat_enabled" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">VAT</div>
            <div class="font-medium">{{ asCurrency(selectedBillingDetail.vat_amount ?? 0) }}</div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Total Due</div>
            <div class="font-medium" :class="selectedBillingOutstanding <= 0 ? 'text-green-500' : selectedBillingAmountPaid > 0 ? 'text-orange-500' : 'text-red-500'">
              {{ asCurrency(selectedBillingTotalDue) }}
            </div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Paid</div>
            <div class="font-medium" :class="selectedBillingAmountPaid >= selectedBillingTotalDue && selectedBillingTotalDue > 0 ? 'text-green-500' : selectedBillingAmountPaid > 0 ? 'text-orange-500' : 'text-red-500'">
              {{ asCurrency(selectedBillingAmountPaid) }}
            </div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Outstanding</div>
            <div class="font-medium" :class="selectedBillingOutstanding <= 0 ? 'text-green-500' : selectedBillingAmountPaid > 0 ? 'text-orange-500' : 'text-red-500'">
              {{ asCurrency(selectedBillingOutstanding) }}
            </div>
          </div>
          <div :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">Change</div>
            <div class="font-medium" :class="(selectedBillingDetail.change_amount ?? 0) > 0 ? 'text-green-500' : ''">
              {{ asCurrency(selectedBillingDetail.change_amount ?? 0) }}
            </div>
          </div>
        </div>

        <!-- Package summary -->
        <div
          v-if="selectedBillingPackageGroup"
          class="order-4 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-950 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-50"
        >
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="text-xs font-semibold uppercase tracking-wide opacity-70">Package Billing</div>
              <div class="mt-1 text-base font-semibold">{{ selectedBillingPackageGroup.package_name }}</div>
              <div class="mt-1 text-xs opacity-70">
                {{ selectedBillingPackageSessionLabel }}
                <span v-if="selectedBillingDetail.package_group_id"> · Group #{{ selectedBillingDetail.package_group_id }}</span>
              </div>
            </div>

            <Tag
              :value="selectedBillingPackagePaymentStatus"
              :severity="selectedBillingPackageBalance <= 0 ? 'success' : selectedBillingPackagePaid > 0 ? 'warn' : 'secondary'"
            />
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div class="rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div class="text-xs uppercase tracking-wide opacity-60">Package Total</div>
              <div class="font-semibold">{{ asCurrency(selectedBillingPackageTotalPrice) }}</div>
            </div>

            <div class="rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div class="text-xs uppercase tracking-wide opacity-60">Package Paid</div>
              <div class="font-semibold">{{ asCurrency(selectedBillingPackagePaid) }}</div>
            </div>

            <div class="rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div class="text-xs uppercase tracking-wide opacity-60">Package Balance</div>
              <div
                class="font-semibold"
                :class="selectedBillingPackageBalance <= 0 ? 'text-green-600 dark:text-green-300' : 'text-orange-600 dark:text-orange-300'"
              >
                {{ asCurrency(selectedBillingPackageBalance) }}
              </div>
            </div>

            <div class="rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div class="text-xs uppercase tracking-wide opacity-60">This Session</div>
              <div class="font-semibold">{{ asCurrency(selectedBillingTotalDue) }}</div>
            </div>

            <div class="rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div class="text-xs uppercase tracking-wide opacity-60">This Session Paid</div>
              <div
                class="font-semibold"
                :class="selectedBillingAmountPaid >= selectedBillingTotalDue && selectedBillingTotalDue > 0 ? 'text-green-600 dark:text-green-300' : selectedBillingAmountPaid > 0 ? 'text-orange-600 dark:text-orange-300' : ''"
              >
                {{ asCurrency(selectedBillingAmountPaid) }}
              </div>
            </div>

            <div class="rounded-xl border border-white/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
              <div class="text-xs uppercase tracking-wide opacity-60">Sessions Paid</div>
              <div class="font-semibold">
                {{ selectedBillingPackageGroup.paid_session_count ?? 0 }} / {{ selectedBillingPackageGroup.total_sessions ?? selectedBillingDetail.total_sessions ?? 1 }}
              </div>
            </div>
          </div>

          <div v-if="selectedBillingPackageIncludedBillings.length" class="mt-4 overflow-hidden rounded-xl border border-white/60 dark:border-white/10">
            <div class="grid grid-cols-[90px_1fr_120px_110px_110px_120px] gap-2 bg-white/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide opacity-70 dark:bg-white/5">
              <span>Session</span>
              <span>Appointment / Billing</span>
              <span>Status</span>
              <span class="text-right">Due</span>
              <span class="text-right">Paid</span>
              <span class="text-right">Actions</span>
            </div>
            <div
              v-for="billing in selectedBillingPackageIncludedBillings"
              :key="billing.id"
              class="grid grid-cols-[90px_1fr_120px_110px_110px_120px] gap-2 border-t border-white/60 px-3 py-2 text-xs items-center dark:border-white/10"
            >
              <span class="font-medium">{{ billing.session_sequence_label || (billing.session_sequence ? `Session ${billing.session_sequence}` : `#${billing.id}`) }}</span>
              <span>
                <span class="font-medium">{{ billing.appointment_public_id || `Appointment ${billing.appointment_id || "N/A"}` }}</span>
                <span class="opacity-60"> · {{ billing.public_id || `Billing ${billing.id}` }}</span>
              </span>
              <span>
                <Tag :value="displayBillingStatus(resolveBillingRuntimeStatus(billing))" :severity="billingStatusSeverity(resolveBillingRuntimeStatus(billing))" class="text-xs" />
              </span>
              <span class="text-right">{{ asCurrency(billing.total_amount ?? billing.amount_due) }}</span>
              <span class="text-right">{{ asCurrency(billing.amount_paid) }}</span>
              <span class="flex justify-end gap-1">
                <Button size="small" text icon="pi pi-eye" v-tooltip.top="'Open billing'" @click="openBillingDetails(billing.id)" />
           <Button
  v-if="isLguBillingRow(billing)"
  size="small"
  text
  icon="pi pi-file"
  v-tooltip.top="getLguAppointmentInvoiceTooltip(billing)"
  :disabled="!canPrintLguAppointmentInvoice(billing)"
  @click="printLguAppointmentInvoice(billing)"
/>
                <Button size="small" text icon="pi pi-pencil" v-tooltip.top="billingEditTooltip(resolveBillingRuntimeStatus(billing))" @click="loadBillingForEdit(billing.id)" />
              </span>
            </div>
          </div>
        </div>

        <!-- Step 2: Payment / Claim -->
        <div class="order-5 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <template v-if="isSelectedBillingSelfPay">
            <div>
              <h4 class="text-sm font-semibold">Step 2 Â· Tender Payment</h4>
              <p class="text-xs opacity-60 mt-0.5">Record payment directly from the detail modal.</p>
            </div>

            <Message v-if="selectedBillingDiscountNote" severity="info" :closable="false">
              {{ selectedBillingDiscountNote }}
            </Message>

            <Message v-if="selectedBillingOutstanding <= 0" severity="success" :closable="false">
              This billing is already fully paid.
            </Message>

            <div v-if="canShowPayFullPackageButton && !isSelectedBillingPackageFullyPaid" class="flex flex-wrap justify-end gap-2">
              <Button
                :label="`Pay Full Package (${asCurrency(selectedBillingPackageBalance)})`"
                icon="pi pi-wallet"
                severity="success"
                outlined
                :loading="savingPackagePayment"
                :disabled="!canPayFullPackage"
                v-tooltip.top="payFullPackageTooltip"
                @click="payFullPackage"
              />
            </div>

            <!-- Payment history -->
            <template v-if="selectedBillingPaymentLog.length > 0">
              <h5 class="text-xs font-semibold uppercase tracking-wide opacity-70">Payment History</h5>
              <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
                <div
                  v-for="entry in selectedBillingPaymentLog"
                  :key="entry.id"
                  class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-surface))] p-3 text-xs grid grid-cols-2 md:grid-cols-4 gap-2"
                >
                  <div>
                    <div class="opacity-60 uppercase tracking-wide">Date</div>
                    <div class="font-medium">{{ formatDateTime(entry.createdAt) }}</div>
                  </div>
                  <div>
                    <div class="opacity-60 uppercase tracking-wide">Tendered / Applied</div>
                    <div class="font-medium">{{ asCurrency(entry.amountTendered) }} â†’ {{ asCurrency(entry.amountApplied) }}</div>
                  </div>
                  <div>
                    <div class="opacity-60 uppercase tracking-wide">Balance After</div>
                    <div class="font-medium">{{ asCurrency(entry.balanceAfter) }}</div>
                  </div>
                  <div>
                    <div class="opacity-60 uppercase tracking-wide">Recorded By</div>
                    <div class="font-medium truncate uppercase" :title="entry.recordedBy">{{ entry.recordedBy }}</div>
                  </div>
                  <div v-if="entry.paymentType">
                    <div class="opacity-60 uppercase tracking-wide">Type</div>
                    <div class="font-medium">{{ entry.paymentType }}</div>
                  </div>
                  <div v-if="entry.referenceNo">
                    <div class="opacity-60 uppercase tracking-wide">Reference</div>
                    <div class="font-medium">{{ entry.referenceNo }}</div>
                  </div>
                  <div v-if="entry.changeGiven > 0">
                    <div class="opacity-60 uppercase tracking-wide">Change Given</div>
                    <div class="font-medium text-green-600">{{ asCurrency(entry.changeGiven) }}</div>
                  </div>
                </div>
              </div>
            </template>

            <Message
              v-if="isSelectedBillingPackageFullyPaid"
              severity="success"
              :closable="false"
            >
              This package is already fully paid. No individual session payment is required.
            </Message>

            <!-- Tender form -->
            <template v-if="canRecordIndividualBillingTender">
              <div v-if="selectedBillingPaymentLog.length > 0" class="flex flex-col gap-0.5">
                <h5 class="text-xs font-semibold uppercase tracking-wide opacity-70">Record Additional Payment</h5>
                <p class="text-xs opacity-50">
                  Remaining: <span class="font-semibold text-orange-500">{{ asCurrency(selectedBillingOutstanding) }}</span>
                </p>
              </div>

              <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <IftaLabel>
                  <Select v-model="billingDetailPaymentType" :options="selfPayPaymentOptions" optionLabel="label" optionValue="value" fluid />
                  <label>Payment Type</label>
                </IftaLabel>

                <IftaLabel>
                  <InputText v-model="billingTenderReferenceNo" fluid placeholder="e.g. wallet or card ref #" />
                  <label>Reference Number</label>
                </IftaLabel>

                <IftaLabel>
                  <InputNumber v-model="billingTenderAmount" mode="currency" currency="PHP" locale="en-PH" fluid inputClass="tender-amount-input" :min="0" :minFractionDigits="0" :maxFractionDigits="0" @focus="selectNumericInputText" />
                  <label>Additional Tender</label>
                </IftaLabel>

                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Payment Applied</div>
                  <div class="font-medium">{{ asCurrency(billingTenderApplied) }}</div>
                </div>

                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Resulting Change</div>
                  <div class="font-medium" :class="billingResultingChange > 0 ? 'text-green-600' : ''">
                    {{ asCurrency(billingResultingChange) }}
                  </div>
                </div>

                <div
                  v-if="billingTenderInputAmount > 0 && billingTenderInputAmount < selectedBillingOutstanding"
                  class="text-xs text-orange-600 dark:text-orange-400 self-center"
                >
                  Partial payment - remaining {{ asCurrency(selectedBillingOutstanding - billingTenderInputAmount) }}
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


              <div class="flex flex-wrap justify-end gap-2">
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
            <div>
              <h4 class="text-sm font-semibold">Step 2 Â· Claim Workflow</h4>
              <p class="text-xs opacity-60 mt-0.5">Claim-based billings are tracked here and not tendered via POS.</p>
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
                @click="startMarkBillingAsBilled"
              />
            </div>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3 text-sm">
              <div :class="billingDetailCardClass">
                <div class="text-xs uppercase tracking-wide opacity-70">Billing Route</div>
                <div class="font-medium">{{ displayBillingType(selectedBillingDetail.billing_type) }}</div>
              </div>
          <div v-if="isSelectedBillingHmo" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">LOA Number</div>
            <div class="font-medium">{{ selectedBillingDetail.hmo_loa_number || 'Not recorded' }}</div>
          </div>
          <div v-if="isSelectedBillingHmo" :class="billingDetailCardClass">
            <div class="text-xs uppercase tracking-wide opacity-70">LOA Date</div>
            <div class="font-medium">{{ selectedBillingDetail.hmo_loa_date ? formatDate(selectedBillingDetail.hmo_loa_date) : 'Not recorded' }}</div>
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

        <!-- Step 3: Line items breakdown -->
        <div class="order-6 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-semibold">Step 3 Â· Line Items</h4>
              <p class="mt-1 text-xs opacity-60">
                {{ selectedBillingLines.length }} item{{ selectedBillingLines.length !== 1 ? "s" : "" }} on this billing.
              </p>
            </div>
            <div class="text-right">
              <div class="text-xs uppercase tracking-wide opacity-55">Total Due</div>
              <div
                class="mt-1 text-lg font-semibold"
                :class="selectedBillingOutstanding <= 0 ? 'text-green-500' : selectedBillingAmountPaid > 0 ? 'text-orange-500' : 'text-red-500'"
              >{{ asCurrency(selectedBillingTotalDue) }}</div>
            </div>
          </div>

          <div v-if="selectedBillingLines.length === 0" class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] px-5 py-8 text-center text-sm opacity-60">
            No line items found.
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
                  <div v-if="line.originalPrice && line.originalPrice !== line.price" class="text-xs opacity-50">
                    Original: {{ asCurrency(line.originalPrice * line.quantity) }}
                  </div>
                </div>
              </div>

              <div v-if="line.type === 'bundle'" class="mt-2 pl-2 space-y-1">
                <template v-for="cat in getBundleCategoryGroups(line.id, line.name)" :key="cat.label">
                  <div v-if="cat.items.length" class="text-xs">
                    <div class="mb-1 font-semibold opacity-70">{{ cat.label }}</div>
                    <div v-for="comp in cat.items" :key="comp.id" class="flex items-center gap-2 pl-2 opacity-60">
                      <i class="pi pi-circle-fill" style="font-size:0.35rem"></i>
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
                      <i class="pi pi-circle-fill" style="font-size:0.35rem"></i>
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

        <!-- Step 4: Encounter tickets -->
        <div
          v-if="showBillingSettlementCard"
          class="order-7 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-semibold">Step 4 Â· Encounter Tickets</h4>
              <p class="mt-1 text-xs opacity-60">Patient-signed attendance slips permanently locked after sign-off.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Tag
                :value="selectedBillingEncounterTickets.length ? `${selectedBillingEncounterTickets.length} linked` : 'None yet'"
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
            No signed encounter tickets linked yet.
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
                    <span v-if="ticket.locked_at"> Â· Locked {{ formatDateTime(ticket.locked_at) }}</span>
                  </div>
                </div>
                <div class="text-sm">
                  <div class="text-xs uppercase tracking-wide opacity-55">Authorized By</div>
                  <div class="font-medium uppercase">{{ ticket.patient_acknowledged_by }}</div>
                </div>
              </div>

              <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Appointment</div>
                  <div class="font-medium">{{ ticket.billing_snapshot?.appointment_public_id || ticket.appointment_public_id || "N/A" }}</div>
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
                  <div v-if="ticket.billing_snapshot?.specialty_tag_name && ticket.billing_snapshot?.specialty_tag_is_active === false" class="mt-1 text-xs text-slate-500">
                    Inactive now, kept for audit.
                  </div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Treatment Area</div>
                  <div class="font-medium">{{ ticket.billing_snapshot?.treatment_area_name || "N/A" }}</div>
                  <div v-if="ticket.billing_snapshot?.treatment_area_name && ticket.billing_snapshot?.treatment_area_is_active === false" class="mt-1 text-xs text-slate-500">
                    Inactive now, kept for audit.
                  </div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Amount Snapshot</div>
                  <div class="font-medium">{{ asCurrency(ticket.billing_snapshot?.total_amount ?? selectedBillingTotalDue) }}</div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Encounter Ticket ID</div>
                  <div class="font-medium">ET-{{ ticket.id }}</div>
                </div>
                <div :class="billingDetailCardClass">
                  <div class="text-xs uppercase tracking-wide opacity-70">Active Billing Package</div>
                  <div class="font-medium">{{ describeEncounterTicketPackage(ticket) }}</div>
                  <div v-if="describeEncounterTicketPackageSource(ticket)" class="mt-1 text-xs text-slate-500">
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
                <Button size="small" icon="pi pi-file-pdf" label="Export PDF" outlined @click="exportSingleEncounterTicketPdf(ticket, selectedBillingDetail)" />
              </div>
            </article>
          </div>
        </div>
      </div>

      <template #footer>
        <Button
          v-if="selectedBillingDetail"
          :label="selectedBillingPrintButtonLabel"
          icon="pi pi-print"
          outlined
          :disabled="!canPrintSelectedBillingReceipt"
          v-tooltip.top="printReceiptTooltip"
          @click="printSelectedBillingReceipt"
        />
        <Button
          v-if="selectedBillingDetail && canPrintPatientInvoiceCopy"
          label="Print Patient Statement"
          icon="pi pi-file"
          outlined
          @click="printSelectedPatientInvoiceCopy"
        />
        <Button
          v-if="selectedBillingDetail && canEditReceipt"
          label="Edit Receipt"
          icon="pi pi-pencil"
          severity="secondary"
          outlined
          v-tooltip.top="isSelectedBillingPaid ? 'Open in locked mode (paid)' : 'Edit receipt details'"
          @click="openReceiptEditor"
        />
        <Button label="Close" text @click="billingDetailsVisible = false" />
      </template>
    </Dialog>

    <!-- â”€â”€ Edit Drawer â€” uses the shared LineItemEditor composable section â”€â”€ -->
    <Drawer
      v-model:visible="billingEditDrawerVisible"
      position="right"
      header="Edit Billing"
      :style="{ width: 'min(920px, 96vw)' }"
      :modal="true"
    >
      <div class="space-y-5 pb-6">

        <Message
          v-if="isEditingLockedBilling"
          class="py-2 px-2"
          :severity="canOverrideLockedBillingEdit ? 'info' : 'warn'"
          :closable="false"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {{
                canOverrideLockedBillingEdit
                  ? 'Owner override active. This billing is locked for regular users, but you can update it.'
                  : 'This billing is already locked. You can still open and review this record, but updates are locked.'
              }}
            </span>
            <Button
              v-if="canOfferLockedBillingOverride && !canOverrideLockedBillingEdit"
              label="Override Lock"
              icon="pi pi-lock-open"
              size="small"
              severity="warn"
              outlined
              @click="enableLockedBillingOverride"
            />
          </div>
        </Message>

        <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div>
            <h4 class="text-sm font-semibold">1 Â· Bill Identity</h4>
            <p class="mt-0.5 text-xs opacity-60">Patient, billing type, and optional label.</p>
          </div>
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <IftaLabel class="xl:col-span-2">
              <Select
                v-model="form.patient_id"
                :options="patientOptions"
                optionLabel="name"
                optionValue="id"
                filter
                showClear
                fluid
                placeholder="Select patient"
                :disabled="isEditingPaidBilling"
              >
                <template #option="{ option }">
                  <span class="uppercase">{{ option.name }}</span>
                </template>
                <template #value="{ value, placeholder }">
                  <span v-if="value !== null && value !== undefined" class="uppercase">
                    {{ patientOptions.find(patient => patient.id === value)?.name || '' }}
                  </span>
                  <span v-else>{{ placeholder }}</span>
                </template>
              </Select>
              <label>Patient Name</label>
            </IftaLabel>
            <IftaLabel>
              <Select v-model="form.billing_type" :options="billingTypeOptions" optionLabel="label" optionValue="value" fluid :disabled="isEditingPaidBilling" />
              <label>Billing Type</label>
            </IftaLabel>
            <IftaLabel>
              <InputText v-model="form.service_name" fluid placeholder="Optional label" :disabled="isEditingPaidBilling" />
              <label>Billing Label</label>
            </IftaLabel>
          </div>
          <IftaLabel class="md:w-1/2">
            <InputNumber v-model="form.appointment_id" :min="1" :minFractionDigits="0" :maxFractionDigits="0" fluid :disabled="isEditingPaidBilling" />
            <label>Linked Appointment ID (optional)</label>
          </IftaLabel>
        </section>

        <section v-if="editingBillingId" class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div>
            <h4 class="text-sm font-semibold">Accounting Â· Payment History</h4>
            <p class="mt-0.5 text-xs opacity-60">Tendered and applied amounts stay ledgered. Owner or billing editors can correct method, reference, and notes.</p>
          </div>

          <div v-if="editBillingPaymentLog.length === 0" class="rounded-lg border border-dashed border-[rgb(var(--app-border))] px-4 py-5 text-center text-sm opacity-60">
            No recorded payments yet for this billing.
          </div>

          <div v-else class="space-y-2 max-h-56 overflow-y-auto pr-1">
            <div
              v-for="entry in editBillingPaymentLog"
              :key="entry.id"
              class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3 text-xs grid grid-cols-2 md:grid-cols-4 gap-2"
            >
              <div>
                <div class="opacity-60 uppercase tracking-wide">Date</div>
                <div class="font-medium">{{ formatDateTime(entry.createdAt) }}</div>
              </div>
              <div>
                <div class="opacity-60 uppercase tracking-wide">Tendered / Applied</div>
                <div class="font-medium">{{ asCurrency(entry.amountTendered) }} â†’ {{ asCurrency(entry.amountApplied) }}</div>
              </div>
              <div>
                <div class="opacity-60 uppercase tracking-wide">Balance After</div>
                <div class="font-medium">{{ asCurrency(entry.balanceAfter) }}</div>
              </div>
              <div>
                <div class="opacity-60 uppercase tracking-wide">Recorded By</div>
                <div class="font-medium truncate uppercase" :title="entry.recordedBy">{{ entry.recordedBy }}</div>
              </div>
              <div v-if="entry.paymentType">
                <div class="opacity-60 uppercase tracking-wide">Type</div>
                <div class="font-medium">{{ entry.paymentType }}</div>
              </div>
              <div v-if="entry.referenceNo">
                <div class="opacity-60 uppercase tracking-wide">Reference</div>
                <div class="font-medium">{{ entry.referenceNo }}</div>
              </div>
              <div v-if="entry.changeGiven > 0">
                <div class="opacity-60 uppercase tracking-wide">Change Given</div>
                <div class="font-medium text-green-600">{{ asCurrency(entry.changeGiven) }}</div>
              </div>
              <div class="col-span-2 md:col-span-4">
                <div
                  v-if="editingPaymentLogEntryId === entry.id"
                  class="mt-2 grid gap-2 rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <IftaLabel>
                    <Select
                      v-model="paymentLogEditForm.paymentType"
                      :options="selfPayPaymentOptions"
                      optionLabel="label"
                      optionValue="value"
                      fluid
                    />
                    <label>Payment Type</label>
                  </IftaLabel>
                  <IftaLabel>
                    <InputText v-model="paymentLogEditForm.referenceNo" fluid placeholder="Reference number" />
                    <label>Reference No.</label>
                  </IftaLabel>
                  <IftaLabel>
                    <InputText v-model="paymentLogEditForm.note" fluid placeholder="Optional note" />
                    <label>Note</label>
                  </IftaLabel>
                  <div class="flex items-center justify-end gap-1">
                    <Button
                      icon="pi pi-check"
                      size="small"
                      :loading="savingPaymentLogEntryId === entry.id"
                      :disabled="savingPaymentLogEntryId === entry.id"
                      @click="savePaymentLogCorrection(entry)"
                    />
                    <Button
                      icon="pi pi-times"
                      size="small"
                      severity="secondary"
                      text
                      :disabled="savingPaymentLogEntryId === entry.id"
                      @click="cancelPaymentLogCorrection"
                    />
                  </div>
                </div>
                <div v-else class="mt-2 flex justify-end">
                  <Button
                    label="Correct Tender Info"
                    icon="pi pi-pencil"
                    size="small"
                    text
                    :disabled="!canEditReceipt"
                    @click="startPaymentLogCorrection(entry)"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 class="text-sm font-semibold">2 Â· Charge Breakdown</h4>
              <p class="mt-0.5 text-xs opacity-60">Add services, add-ons, or packages.</p>
            </div>
            <Button v-if="canCreateBundleFromSelection" size="small" outlined icon="pi pi-box" label="Create Bundle" :disabled="isEditingPaidBilling" @click="openCreateBundleFromSelection" />
          </div>

          <div class="grid gap-2 md:grid-cols-[1fr_1fr_100px_auto] items-end">
            <IftaLabel>
              <Select v-model="selectedLineType" :options="lineTypeOptions" optionLabel="label" optionValue="value" fluid :disabled="isEditingPaidBilling" />
              <label>Service Type</label>
            </IftaLabel>
            <IftaLabel>
              <Select v-model="selectedLineId" :options="currentLineTypeOptions" optionLabel="name" optionValue="id" showClear filter fluid placeholder="Select item" :disabled="isEditingPaidBilling" @keydown.enter.prevent="addSelectedLine" />
              <label>Service / Add-on</label>
            </IftaLabel>
            <IftaLabel>
              <InputNumber v-model="selectedLineQty" :min="1" :minFractionDigits="0" :maxFractionDigits="0" fluid :disabled="isEditingPaidBilling" @keydown.enter.prevent="addSelectedLine" />
              <label>Qty</label>
            </IftaLabel>
            <Button label="Add" icon="pi pi-plus" outlined :disabled="isEditingPaidBilling" @click="addSelectedLine" v-tooltip.top="'Enter to add'" />
          </div>

          <div v-if="form.billing_type !== 'HMO_BILLING'" class="flex flex-wrap gap-2">
            <IftaLabel class="w-64">
              <Select v-model="selectedPackageOfferId" :options="activePackageOffers" optionLabel="name" optionValue="id" showClear filter fluid placeholder="Package offer" :disabled="isEditingPaidBilling" />
              <label>Package Offer</label>
            </IftaLabel>
            <Button label="Add Package" icon="pi pi-box" text :disabled="isEditingPaidBilling || !selectedPackageOfferId" @click="addSelectedPackageOffer" />
          </div>

          <div v-if="selectedLines.length === 0" class="rounded-lg border border-dashed border-[rgb(var(--app-border))] py-6 text-center space-y-1">
            <i class="pi pi-inbox text-2xl opacity-30" />
            <p class="text-sm opacity-50">No line items â€” use the controls above to add services.</p>
          </div>

          <DataTable v-else :value="selectedLines" size="small" dataKey="key" class="rounded-lg border border-[rgb(var(--app-border))]">
            <Column field="name" header="Service">
              <template #body="{data}">
                <div class="flex items-center gap-1">
                  <Tag v-if="data.type === 'bundle'" value="Bundle" severity="contrast" class="text-xs" />
                  <Tag v-else-if="data.type === 'package'" value="Package" severity="info" class="text-xs" />
                  <span>{{ data.name }}</span>
                </div>
              </template>
            </Column>
            <Column header="Body Area" style="width:150px">
              <template #body="{data}">
                <InputText v-if="data.type !== 'bundle' && data.type !== 'package'" :modelValue="data.body_area ?? ''" placeholder="e.g. Lower Back" class="w-full text-sm" :disabled="isEditingPaidBilling" @update:modelValue="val => setLineBodyArea(data.key, val as string)" />
              </template>
            </Column>
            <Column header="Unit Price" style="width:190px">
              <template #body="{data}">
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-1">
                    <InputNumber :modelValue="resolveEffectiveBillingLinePrice(data)" :min="0" :minFractionDigits="0" :maxFractionDigits="0" inputClass="w-24 text-sm" :disabled="isEditingPaidBilling" @update:modelValue="val => setLinePriceOverride(data.key, val)" />
                    <Button v-if="data.priceOverride != null" text rounded size="small" severity="secondary" icon="pi pi-times" v-tooltip.top="'Reset price'" class="p-0 flex-shrink-0" :disabled="isEditingPaidBilling" @click="clearLinePriceOverride(data.key)" />
                  </div>
                  <div v-if="billingLineHasCustomPriceBasis(data)" class="text-xs opacity-50">Original: {{ asCurrency(resolveBillingLineOriginalPrice(data)) }}</div>
                </div>
              </template>
            </Column>
            <Column header="Qty" style="width:80px">
              <template #body="{data}">
                <InputNumber :modelValue="data.quantity" :min="1" :minFractionDigits="0" :maxFractionDigits="0" inputClass="w-16" :disabled="isEditingPaidBilling" @update:modelValue="setLineQuantity(data.key, $event)" />
              </template>
            </Column>
            <Column header="Line Total" style="width:130px">
              <template #body="{data}">
                <div>
                  <div class="font-medium">{{ asCurrency(resolveEffectiveBillingLinePrice(data) * data.quantity) }}</div>
                  <div v-if="billingLineHasCustomPriceBasis(data)" class="text-xs opacity-50">Original: {{ asCurrency(resolveBillingLineOriginalPrice(data) * data.quantity) }}</div>
                </div>
              </template>
            </Column>
            <Column style="width:60px">
              <template #body="{data}">
                <Button size="small" text severity="danger" icon="pi pi-trash" :disabled="isEditingPaidBilling" @click="removeLine(data.key)" />
              </template>
            </Column>
          </DataTable>
        </section>

        <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div>
            <h4 class="text-sm font-semibold">3 Â· Pricing and Discounts</h4>
            <p class="mt-0.5 text-xs opacity-60">Apply Senior/PWD or custom discount before computing the total.</p>
          </div>

          <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input v-model="form.senior_pwd_id_presented" type="checkbox" :disabled="isEditingPaidBilling" />
            <span>Senior / PWD ID presented <span class="opacity-60 text-xs">(20% discount â€” RA 9994)</span></span>
          </label>
          <div v-if="form.senior_pwd_id_presented && seniorDiscountIsAutoAssigned && seniorDiscountEffectiveTargetKey" class="text-xs text-sky-700 dark:text-sky-400 pl-5">
            Auto-applied to: <strong>{{ selectedLines.find(l => l.key === seniorDiscountEffectiveTargetKey)?.name }}</strong>
            â€” because a {{ form.billing_type === 'SELF_PAY_PACKAGE' ? 'Package' : 'Bundle' }} is in the cart.
          </div>
          <IftaLabel v-if="form.senior_pwd_id_presented && !seniorDiscountIsAutoAssigned && selectedLines.length > 0" class="md:w-1/2 pl-5">
            <Select v-model="seniorDiscountTargetKey" :options="seniorDiscountSelectableLines" optionLabel="label" optionValue="key" showClear fluid placeholder="Select service for 20% discount" :disabled="isEditingPaidBilling" />
            <label>Senior/PWD Discount Applies To</label>
          </IftaLabel>

          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4 pt-1">
            <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input v-model="manualDiscountEnabled" type="checkbox" :disabled="isEditingPaidBilling" />
              <span>Custom Discount</span>
            </label>
            <IftaLabel v-if="manualDiscountEnabled">
              <Select v-model="manualDiscountType" :options="discountTypeOptions" optionLabel="label" optionValue="value" fluid :disabled="isEditingPaidBilling" />
              <label>Discount Type</label>
            </IftaLabel>
            <IftaLabel v-if="manualDiscountEnabled">
              <InputNumber v-model="manualDiscountValue" :min="0" :max="manualDiscountType === 'PERCENTAGE' ? 100 : undefined" :minFractionDigits="0" :maxFractionDigits="0" fluid :disabled="isEditingPaidBilling" />
              <label>{{ manualDiscountType === "PERCENTAGE" ? "Discount %" : "Discount Amount" }}</label>
            </IftaLabel>
            <IftaLabel v-if="manualDiscountEnabled">
              <InputText v-model="manualDiscountReason" fluid placeholder="Optional reason" :disabled="isEditingPaidBilling" />
              <label>Discount Reason</label>
            </IftaLabel>
          </div>

          <!-- Financial summary strip -->
          <div class="rounded-lg bg-[rgb(var(--app-card))] border border-[rgb(var(--app-border))] px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div class="text-xs uppercase tracking-wide opacity-55">Subtotal</div>
              <div class="mt-0.5 font-semibold">{{ asCurrency(posSummary.subtotal) }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide opacity-55">Discount</div>
              <div class="mt-0.5 font-semibold text-orange-500">{{ asCurrency(posSummary.discountAmount) }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide opacity-55">Total Due</div>
              <div class="mt-0.5 font-semibold text-red-500">{{ asCurrency(posSummary.totalDue) }}</div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-wide opacity-55">Change</div>
              <div class="mt-0.5 font-semibold" :class="posSummary.changeAmount > 0 ? 'text-green-500' : ''">{{ asCurrency(posSummary.changeAmount) }}</div>
            </div>
          </div>
        </section>

        <div class="flex justify-end gap-2">
          <Button label="Cancel" text @click="billingEditDrawerVisible = false" />
          <Button label="Update Billing" icon="pi pi-save" :disabled="isEditingPaidBilling" v-tooltip.top="isEditingPaidBilling ? 'Billing is locked' : 'Save updates'" @click="createBilling" />
        </div>
      </div>
    </Drawer>

    <!-- â”€â”€ Create Bundle Dialog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
    <Dialog v-model:visible="createBundleDialogVisible" header="Create New Bundle" modal :style="{width: '520px'}">
      <div class="space-y-3">
        <p class="text-sm opacity-70">Save selected individual items as a reusable bundled service.</p>
        <IftaLabel>
          <InputText v-model="createBundleName" fluid placeholder="Enter bundle name" />
          <label>Bundle Name</label>
        </IftaLabel>
        <IftaLabel>
          <InputNumber v-model="createBundleDiscountedPrice" mode="currency" currency="PHP" locale="en-PH" fluid :min="0" :minFractionDigits="0" :maxFractionDigits="0" />
          <label>Bundled Price</label>
        </IftaLabel>
        <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 text-sm space-y-1">
          <div class="flex justify-between"><span class="opacity-60">Original Total</span><strong>{{ asCurrency(selectionOriginalTotal) }}</strong></div>
          <div class="flex justify-between"><span class="opacity-60">Bundled Price</span><strong>{{ asCurrency(Number(createBundleDiscountedPrice ?? 0)) }}</strong></div>
          <div v-if="Number(createBundleDiscountedPrice ?? 0) < selectionOriginalTotal" class="flex justify-between text-green-600">
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

    <Dialog v-model:visible="markBilledLoaDialogVisible" header="Letter of Authorization" modal :style="{width: '460px'}">
      <div class="space-y-3">
        <p class="text-sm opacity-70">Enter the LOA number before this HMO transaction is marked as billed.</p>
        <IftaLabel>
          <InputText v-model="markBilledLoaNumber" fluid autofocus placeholder="LOA number" @keyup.enter="confirmMarkBillingAsBilled" />
          <label>LOA Number</label>
        </IftaLabel>
        <IftaLabel>
          <InputText v-model="markBilledLoaDate" type="date" fluid @keyup.enter="confirmMarkBillingAsBilled" />
          <label>LOA Date</label>
        </IftaLabel>
      </div>
      <template #footer>
        <Button label="Cancel" text :disabled="markingBillingAsBilled" @click="markBilledLoaDialogVisible = false" />
        <Button
          label="Confirm"
          icon="pi pi-check"
          :loading="markingBillingAsBilled"
          :disabled="!canSubmitMarkBilledLoa"
          @click="confirmMarkBillingAsBilled"
        />
      </template>
    </Dialog>
  </component>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, reactive, ref, watch} from "vue"
import {useRoute, useRouter} from "vue-router"
import {storeToRefs} from "pinia"
import {useQueryClient} from "@tanstack/vue-query"
import {clinicStore} from "@/stores/clinic.store"

const props = withDefaults(defineProps<{embedded?: boolean; overlayOnly?: boolean; initialView?: 'detail' | 'edit'}>(), {embedded: false, overlayOnly: false, initialView: 'edit'})
const emit = defineEmits<{
  (e: "close-overlay"): void
  (e: "billing-updated", payload: { billingId?: number; appointmentId?: number; billingStatus?: string }): void
}>()

import Button from "primevue/button"
import Column from "primevue/column"
import DataTable from "primevue/datatable"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import Drawer from "primevue/drawer"
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
  type BillingPaymentLogEntry,
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
import {defaultPage} from "@/models/paging"
import type {Patient} from "@/features/patients/types/patient"
import {type BillingPickerLookup} from "@/features/billing/components/SingleServiceItemPicker.vue"
import {errorToast, successToast} from "@/utils/toast.util"
import {Status} from "@/utils/global.type"
import type {PatientHMOInformation} from "@/models/hmo-information"
import {patientTanstackService} from "@/features/patients/queries/patient.tanstack.service"
import {openEncounterTicketPdfWindow, renderEncounterTicketPdfWindow, type EncounterTicketPdfCard} from "@/utils/encounter-ticket-pdf.util"
import {getApiErrorMessage} from "@/utils/actionable-error.util"
import type {BillingReceiptPrintBreakdownGroup, BillingReceiptPrintSubItem} from "@/utils/billing-receipt-print.util"
import {lguBillingService} from "@/features/lgu-billing/api/lgu-billing.service"
import {formatLguStatus, normalizeLguStatus} from "@/features/lgu-billing/invoices/lgu-invoice.shared"
import {useAuthSessionStore} from "@/stores/auth-session.store"
import {billingContextTanstackService} from "@/features/billing/queries/billing-context.tanstack.service"
import {BillingTanstackKey} from "@/utils/keys/tanstack-key"
import {serviceCatalogContextTanstackService} from "@/features/services/queries/service-catalog-context.tanstack.service"
import type {
  ServiceCatalogBundle,
  ServiceCatalogContext,
  ServiceCatalogItem,
  ServiceCatalogScope
} from "@/features/services/api/service-catalog-context.service"

const route = useRoute()
const router = useRouter()
const toast = useToast()
const queryClient = useQueryClient()

type BillingTableRow = BillingListItem & {
  is_package_group_row?: boolean
  is_lgu_group_row?: boolean
  representative_billing_id?: number
  package_group_billing_count?: number
  package_total_due?: number
  package_total_paid?: number
  package_balance?: number
  package_display_status?: string
  included_billings?: BillingListItem[]
}

// â”€â”€ Clinic branch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const globalClinicStore = clinicStore()
const { selectedClinicId } = storeToRefs(globalClinicStore)
const authSession = useAuthSessionStore()

// â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const savingPackagePayment = ref(false)
const isLoading = ref(false)
const copyingFromLastSession = ref(false)
const billings = ref<BillingListItem[]>([])
const selectedBillingRows = ref<BillingTableRow[]>([])
const editingBillingId = ref<number>()
const editingBillingStatus = ref<string>()
const billingDetailsVisible = ref(false)
const selectedBillingPaymentLog = ref<BillingPaymentLogEntry[]>([])
const editBillingPaymentLog = ref<BillingPaymentLogEntry[]>([])
const billingEditDrawerVisible = ref(false)
const lockedBillingOverrideEnabled = ref(false)
const editingPaymentLogEntryId = ref<number | null>(null)
const savingPaymentLogEntryId = ref<number | null>(null)
const paymentLogEditForm = reactive({
  paymentType: "",
  referenceNo: "",
  note: "",
})
const overlayActivated = ref(false)
const overlayEntryMode = ref<"detail" | "edit" | "tender">("detail")
const selectedBillingDetail = ref<BillingListItem>()
const exportingEncounterTicketsPdf = ref(false)
const filtersExpanded = ref(false)
const posExpanded = ref(false)
const posSection = ref<HTMLElement | null>(null)



// â”€â”€ VAT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Non-VAT clinic: vatEnabled = false. Fields are OMITTED from payload (not zeroed)
// when vatEnabled is false to keep BIR audit records clean.
const VAT_RATE = 0.12
const vatEnabled = ref(false)

// â”€â”€ Bundle / Package / local catalog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const createBundleDialogVisible = ref(false)
const createBundleName = ref("")
const createBundleDiscountedPrice = ref<number>(0)

// â”€â”€ Table filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const tableFilterQuery = ref("")
const tableFilterBillingType = ref<BillingType>()
const tableFilterPaymentType = ref<string>()
const tableFilterStatus = ref<string>()
const tableFilterDateFrom = ref<Date>()
const tableFilterDateTo = ref<Date>()
const tableFilterMinDue = ref<number | null>(null)
const tableFilterMaxDue = ref<number | null>(null)
const tableFilterOutstandingOnly = ref(false)

// â”€â”€ LGU budget â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const activeLguBudgetSummary = ref<LguBudgetSummary | null>(null)
const loadingLguBudgetSummary = ref(false)
const lguBudgetSummaryError = ref("")

const billingDetailCardClass = "rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3"

// â”€â”€ Error extraction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Billing access (Read Only or Can Edit) in Role Access",
    notFoundHint: "The billing record was not found. Refresh the list and try again.",
    invalidInputHint: "Some billing fields are invalid. Check patient, line items, and payment values, then retry.",
    retryHint: "Please try again."
  })

// â”€â”€ Local catalog types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type LocalService  = {id: string; type: string; name: string; price: number; status: string; dropoutUnitPrice?: number}
type LocalBundle   = {id: string; name: string; machineIds: string[]; techniqueIds: string[]; evaluationIds: string[]; addOnIds: string[]; bundledPrice: number; status: string; dropoutUnitPrice?: number}
type LocalPackageItem = {
  id: string
  qty: number
  standardUnitPrice?: number
  packageUnitPrice?: number
  dropoutUnitPrice?: number
}
type LocalPackageOffer = {
  id: string; name: string; bundleId?: string; bundleQty: number
  bundleItems?: LocalPackageItem[]
  machineIds?: string[]; machineQty?: number; machineItems?: LocalPackageItem[]
  techniqueIds?: string[]; techniqueQty?: number; techniqueItems?: LocalPackageItem[]
  evaluationIds: string[]; evaluationQty: number; evaluationItems?: LocalPackageItem[]
  addOnIds?: string[]; addOnQty?: number; addOnItems?: LocalPackageItem[]
  sessionIds?: string[]; sessionQty?: number; sessionItems?: LocalPackageItem[]
  invoiceSubItems?: PackageInvoicePrintSubItem[]
  dropoutUnitPrice?: number
  packagePrice: number; status: string
}

const localServices      = ref<LocalService[]>([])
const localBundles       = ref<LocalBundle[]>([])
const localPackageOffers = ref<LocalPackageOffer[]>([])
const sessionServices    = ref<BillingPickerLookup[]>([])
const patientOptions     = ref<Lookup[]>([])
const canEditReceipt     = computed(() =>
  authSession.isOwnerEquivalent ||
  authSession.hasAnyPermission("CashBill::UPDATE", "HMOBill::UPDATE", "CashBill::CREATE", "HMOBill::CREATE")
)

const isBillingStatusPaid = (value?: string): boolean => normalizeBillingStatusLabel(value) === "PAID"
const isBillingStatusLocked = (value?: string): boolean =>
  ["BILLED", "PARTIALLY_PAID", "PAID", "VOID", "CANCELLED", "DROPPED_OUT", "CROSS_MONTH_DROPPED_OUT"].includes(normalizeBillingStatusLabel(value))
const isSelectedBillingPaid = computed(() => isBillingStatusPaid(selectedBillingDetail.value?.billing_status))
const canOfferLockedBillingOverride = computed(() => authSession.isOwnerEquivalent && isEditingLockedBilling.value)
const canOverrideLockedBillingEdit = computed(() =>
  authSession.isOwnerEquivalent &&
  isEditingLockedBilling.value &&
  lockedBillingOverrideEnabled.value
)
const isEditingLockedBilling = computed(() => isBillingStatusLocked(editingBillingStatus.value))
const isEditingPaidBilling = computed(() =>
  isEditingLockedBilling.value && !canOverrideLockedBillingEdit.value
)
const billingEditTooltip = (status?: string): string => {
  if (!isBillingStatusLocked(status)) return "Edit billing"
  return authSession.isOwnerEquivalent
    ? "Open locked billing; Owner override available"
    : "Open in locked mode"
}

// â”€â”€ Normalisation helpers (unchanged from original) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const toOptionalStringId = (value: unknown): string | undefined => {
  const n = String(value ?? "").trim(); return n || undefined
}
const normalizePositiveInt = (value: unknown, fallback = 1): number => {
  const n = Math.trunc(Number(value))
  return Number.isFinite(n) && n > 0 ? n : fallback
}
const normalizeNonNegativeNumber = (value: unknown): number => {
  const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : 0
}
const normalizeOptionalAmount = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (value === undefined || value === null || String(value).trim() === "") continue
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return undefined
}
const parseMaybeJsonArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return []
  const t = value.trim(); if (!t) return []
  try { const p = JSON.parse(t) as unknown; return Array.isArray(p) ? p : [] } catch { return [] }
}
const toCatalogServiceId = (type: string, id: unknown): string | undefined => {
  const raw = toOptionalStringId(id)
  if (!raw) return undefined
  return raw.startsWith(`${type}-`) ? raw : `${type}-${raw}`
}
const normalizeStringIdArray = (value: unknown, type?: string): string[] =>
  parseMaybeJsonArray(value)
    .map(e => type ? toCatalogServiceId(type, e) : toOptionalStringId(e))
    .filter((e): e is string => !!e)
const normalizeQtyItems = (value: unknown, type?: string): LocalPackageItem[] =>
  parseMaybeJsonArray(value).flatMap(entry => {
    if (!entry || typeof entry !== "object") return []
    const raw = entry as Record<string, unknown>
    const id = type
      ? toCatalogServiceId(type, raw.id ?? raw.item_id ?? raw.service_id ?? raw.session_id)
      : toOptionalStringId(raw.id ?? raw.item_id ?? raw.service_id ?? raw.session_id)
    if (!id) return []
    const standardUnitPrice = normalizeOptionalAmount(raw.standardUnitPrice, raw.standard_unit_price, raw.referencePrice, raw.reference_price)
    const packageUnitPrice = normalizeOptionalAmount(raw.packageUnitPrice, raw.package_unit_price, raw.contractPrice, raw.contract_price, raw.allocatedPrice, raw.allocated_price)
    const dropoutUnitPrice = normalizeOptionalAmount(raw.dropoutUnitPrice, raw.dropout_unit_price, raw.dropoutPrice, raw.dropout_price)
    const isComplimentary = Boolean(raw.isComplimentary ?? raw.is_complimentary)
    return [{
      id,
      qty: normalizePositiveInt(raw.qty ?? raw.quantity, 1),
      ...(standardUnitPrice === undefined ? {} : { standardUnitPrice }),
      ...(packageUnitPrice === undefined && !isComplimentary ? {} : { packageUnitPrice: isComplimentary ? 0 : Number(packageUnitPrice ?? 0) }),
      ...(dropoutUnitPrice === undefined ? {} : { dropoutUnitPrice })
    }]
  })
const normalizeInvoiceSubItems = (value: unknown): PackageInvoicePrintSubItem[] =>
  parseMaybeJsonArray(value).flatMap(entry => {
    if (!entry || typeof entry !== "object") return []
    const raw = entry as Record<string, unknown>
    const name = String(raw.name ?? "").trim()
    if (!name) return []
    const rawUnitPrice = raw.unitPrice ?? raw.unit_price ?? raw.price
    const parsedUnitPrice = rawUnitPrice === undefined || rawUnitPrice === null || String(rawUnitPrice).trim() === ""
      ? undefined
      : Number(rawUnitPrice)
    const rawDropoutUnitPrice = raw.dropoutUnitPrice ?? raw.dropout_unit_price ?? raw.dropoutPrice ?? raw.dropout_price
    const parsedDropoutUnitPrice = rawDropoutUnitPrice === undefined || rawDropoutUnitPrice === null || String(rawDropoutUnitPrice).trim() === ""
      ? undefined
      : Number(rawDropoutUnitPrice)
    return [{
      name,
      quantity: normalizePositiveInt(raw.quantity, 1),
      unitPrice: parsedUnitPrice !== undefined && Number.isFinite(parsedUnitPrice) && parsedUnitPrice >= 0
        ? parsedUnitPrice
        : undefined,
      dropoutUnitPrice: parsedDropoutUnitPrice !== undefined && Number.isFinite(parsedDropoutUnitPrice) && parsedDropoutUnitPrice >= 0
        ? parsedDropoutUnitPrice
        : undefined,
      children: normalizeInvoiceSubItems(raw.children)
    }]
  })
const normalizePackageStatus = (raw: Record<string,unknown>): string => {
  if (typeof raw.status === "string" && raw.status.trim()) return raw.status.trim()
  if (typeof raw.is_active === "boolean") return raw.is_active ? "Active" : "Inactive"
  if (typeof raw.is_active === "number") return raw.is_active > 0 ? "Active" : "Inactive"
  return "Active"
}
const normalizePackageServiceOffer = (value: unknown): LocalPackageOffer | null => {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string,unknown>
  const id = toOptionalStringId(raw.id); const name = typeof raw.name === "string" ? raw.name.trim() : ""
  if (!id || !name) return null
  const prefixScope = String(raw.offer_scope ?? raw.offerScope ?? "").trim().toUpperCase() === "LGU" ? "lgu-" : ""
  return {
    id, name,
    bundleId: toOptionalStringId(raw.bundleId ?? raw.bundle_template_id),
    bundleQty: normalizePositiveInt(raw.bundleQty ?? raw.bundle_qty, 1),
    bundleItems: normalizeQtyItems(raw.bundleItems ?? raw.bundle_items ?? raw.bundle_items_json),
    machineIds: normalizeStringIdArray(raw.machineIds ?? raw.machine_ids ?? raw.machine_ids_json, `${prefixScope}machine`),
    machineQty: normalizePositiveInt(raw.machineQty ?? raw.machine_qty, 1),
    machineItems: normalizeQtyItems(raw.machineItems ?? raw.machine_items ?? raw.machine_items_json, `${prefixScope}machine`),
    techniqueIds: normalizeStringIdArray(raw.techniqueIds ?? raw.technique_ids ?? raw.technique_ids_json, `${prefixScope}technique`),
    techniqueQty: normalizePositiveInt(raw.techniqueQty ?? raw.technique_qty, 1),
    techniqueItems: normalizeQtyItems(raw.techniqueItems ?? raw.technique_items ?? raw.technique_items_json, `${prefixScope}technique`),
    evaluationIds: normalizeStringIdArray(raw.evaluationIds ?? raw.evaluation_ids ?? raw.evaluation_ids_json, `${prefixScope}evaluation`),
    evaluationQty: normalizePositiveInt(raw.evaluationQty ?? raw.evaluation_qty, 1),
    evaluationItems: normalizeQtyItems(raw.evaluationItems ?? raw.evaluation_items ?? raw.evaluation_items_json, `${prefixScope}evaluation`),
    addOnIds: normalizeStringIdArray(raw.addOnIds ?? raw.add_on_ids ?? raw.add_on_ids_json, `${prefixScope}add-on-machine`),
    addOnQty: normalizePositiveInt(raw.addOnQty ?? raw.add_on_qty, 1),
    addOnItems: normalizeQtyItems(raw.addOnItems ?? raw.add_on_items ?? raw.add_on_items_json, `${prefixScope}add-on-machine`),
    sessionIds: normalizeStringIdArray(raw.sessionIds ?? raw.session_ids ?? raw.session_ids_json),
    sessionQty: normalizePositiveInt(raw.sessionQty ?? raw.session_qty, 1),
    sessionItems: normalizeQtyItems(raw.sessionItems ?? raw.session_items ?? raw.session_items_json),
    invoiceSubItems: normalizeInvoiceSubItems(raw.invoiceSubItems ?? raw.invoice_sub_items),
    dropoutUnitPrice: normalizeOptionalAmount(raw.dropoutUnitPrice, raw.dropout_unit_price, raw.dropoutPrice, raw.dropout_price, raw.packageDropoutPrice, raw.package_dropout_price),
    packagePrice: normalizeNonNegativeNumber(raw.packagePrice ?? raw.package_price),
    status: normalizePackageStatus(raw)
  }
}

const formatPatientName = (patient: Partial<Patient>): string => {
  const name = [patient.last_name, patient.first_name]
    .map(part => part?.trim())
    .filter((part): part is string => Boolean(part && part.toLowerCase() !== "null"))
    .join(", ")
  if (name) return name
  const fallback = (patient as {full_name?: string}).full_name
  if (fallback?.trim()) return fallback.trim()
  return "Unknown Patient"
}

// â”€â”€ Patient options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const loadPatientOptions = async (): Promise<void> => {
  const lookupResponse = await patientService.getAllLookup({
    pageable_request: {page: defaultPage, size: 1000, name: undefined, status: Status.ACTIVE},
    clinic_id: undefined
  })
  if ((lookupResponse?.content?.length ?? 0) > 0) {
    patientOptions.value = lookupResponse?.content ?? []; return
  }
  const allPatientsResponse = await patientService.getAll({
    pageable_request: {page: defaultPage, size: 1000, name: undefined, status: Status.ACTIVE},
    clinic_id: undefined
  })
  patientOptions.value = (allPatientsResponse?.content ?? []).map(patient => ({id: patient.id, name: formatPatientName(patient)}))
}

// â”€â”€ Role sync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const loadCurrentUser = async (): Promise<void> => {
  await authSession.ensureLoaded()
}

// â”€â”€ Local catalog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const loadLocalData = (): void => {
  localServices.value = []
  localBundles.value = []
  localPackageOffers.value = []
}

const catalogItemToPicker = (type: BillingPickerLookup["type"], item: ServiceCatalogItem): BillingPickerLookup => ({
  id: item.id,
  name: item.name,
  price: Number(item.effective_price ?? item.price ?? 0),
  type,
})

const catalogItemToLocalService = (type: string, item: ServiceCatalogItem, scope: ServiceCatalogScope = "GLOBAL"): LocalService => ({
  id: toCatalogServiceId(scope === "LGU" ? `lgu-${type}` : type, item.id) ?? String(item.id),
  type,
  name: item.name,
  price: Number(item.effective_price ?? item.price ?? 0),
  dropoutUnitPrice: normalizeOptionalAmount((item as Record<string, unknown>).dropout_unit_price, (item as Record<string, unknown>).dropoutUnitPrice, (item as Record<string, unknown>).dropout_price, (item as Record<string, unknown>).dropoutPrice),
  status: item.is_active ? "Active" : "Inactive",
})

const catalogBundleTypeMap: Record<string, string> = {
  MACHINE: "machine",
  TECHNIQUE: "technique",
  EVALUATION: "evaluation",
  ADD_ON_MACHINE: "add-on-machine",
  ADD_ON_TECHNIQUE: "add-on-technique",
  ADD_ON_HOME_SERVICE: "add-on-home-service",
}

const catalogBundleToLocalBundle = (bundle: ServiceCatalogBundle, scope: ServiceCatalogScope = "GLOBAL"): LocalBundle => {
  const collect = (type: string): string[] =>
    bundle.items
      .filter(item => item.item_type === type && item.item_id != null)
      .map(item => toCatalogServiceId(scope === "LGU" ? `lgu-${catalogBundleTypeMap[type]}` : catalogBundleTypeMap[type], item.item_id))
      .filter((id): id is string => !!id)

  return {
    id: String(bundle.id),
    name: bundle.name,
    machineIds: collect("MACHINE"),
    techniqueIds: collect("TECHNIQUE"),
    evaluationIds: collect("EVALUATION"),
    addOnIds: [
      ...collect("ADD_ON_MACHINE"),
      ...collect("ADD_ON_TECHNIQUE"),
      ...collect("ADD_ON_HOME_SERVICE"),
    ],
    bundledPrice: Number(bundle.bundled_price ?? 0),
    dropoutUnitPrice: normalizeOptionalAmount((bundle as unknown as Record<string, unknown>).dropout_unit_price, (bundle as unknown as Record<string, unknown>).dropoutUnitPrice, (bundle as unknown as Record<string, unknown>).dropout_price, (bundle as unknown as Record<string, unknown>).dropoutPrice),
    status: bundle.is_active ? "Active" : "Inactive",
  }
}

const mergeById = <T extends {id: string}>(fallbackItems: T[], primaryItems: T[]): T[] => {
  const merged = new Map<string, T>()
  fallbackItems.forEach(item => merged.set(item.id, item))
  primaryItems.forEach(item => merged.set(item.id, item))
  return Array.from(merged.values())
}

const loadCatalogContext = async (
  scope: ServiceCatalogScope,
  hmoId?: number | null
): Promise<ServiceCatalogContext | undefined> =>
  serviceCatalogContextTanstackService.fetchContext(queryClient, {scope, hmo_id: hmoId})

const catalogContextToLocalServices = (context: ServiceCatalogContext): LocalService[] => [
  ...context.services.machines.map(item => catalogItemToLocalService("machine", item, context.scope)),
  ...context.services.techniques.map(item => catalogItemToLocalService("technique", item, context.scope)),
  ...context.services.evaluations.map(item => catalogItemToLocalService("evaluation", item, context.scope)),
  ...context.services.add_on_machines.map(item => catalogItemToLocalService("add-on-machine", item, context.scope)),
  ...context.services.add_on_techniques.map(item => catalogItemToLocalService("add-on-technique", item, context.scope)),
  ...context.services.add_on_home_services.map(item => catalogItemToLocalService("add-on-home-service", item, context.scope)),
]

const mergeCatalogContextLocalData = (context: ServiceCatalogContext): void => {
  localServices.value = catalogContextToLocalServices(context)
  localBundles.value = context.bundles.map(bundle => catalogBundleToLocalBundle(bundle, context.scope))
}

const applyServiceCatalogContext = (context: ServiceCatalogContext): void => {
  machines.value = context.services.machines.map(item => catalogItemToPicker("machine", item))
  techniques.value = context.services.techniques.map(item => catalogItemToPicker("technique", item))
  evaluations.value = context.services.evaluations.map(item => catalogItemToPicker("evaluation", item))
  addOnMachines.value = context.services.add_on_machines.map(item => catalogItemToPicker("add-on-machine", item))
  addOnTechniques.value = context.services.add_on_techniques.map(item => catalogItemToPicker("add-on-technique", item))
  addOnHomeServices.value = context.services.add_on_home_services.map(item => catalogItemToPicker("add-on-home-service", item))
  mergeCatalogContextLocalData(context)
}

const loadDbPackageOffers = async (): Promise<void> => {
  try {
    const [globalContext, lguContext] = await Promise.all([
      loadCatalogContext("GLOBAL"),
      loadCatalogContext("LGU"),
    ])
    if (globalContext) applyServiceCatalogContext(globalContext)
    if (lguContext) mergeCatalogContextLocalData(lguContext)
    const normalized = [
      ...(globalContext?.package_offers ?? []),
      ...(lguContext?.package_offers ?? [])
    ]
      .map(normalizePackageServiceOffer)
      .filter((item): item is LocalPackageOffer => item !== null)

    const byId = new Map<string, LocalPackageOffer>()
    normalized.forEach(item => byId.set(item.id, item))
    localPackageOffers.value = Array.from(byId.values())
  } catch (error) {
    localPackageOffers.value = []
    throw error
  }
}

const findBundle       = (bundleId?: string|number, bundleName?: string): LocalBundle|undefined => {
  const nId = String(bundleId ?? "").trim()
  if (nId) { const m = localBundles.value.find(b => b.id === nId); if (m) return m }
  const nName = (bundleName ?? "").trim().toLowerCase()
  if (!nName) return undefined
  return localBundles.value.find(b => b.name.trim().toLowerCase() === nName)
}
const findPackageOffer = (pkgId?: string|number, pkgName?: string): LocalPackageOffer|undefined => {
  const nId = String(pkgId ?? "").trim()
  if (nId) { const m = localPackageOffers.value.find(i => i.id === nId); if (m) return m }
  const normalizeName = (value?: string): string =>
    String(value ?? "")
      .trim()
      .replace(/\s+\(LGU\s+.*?\)\s*$/i, "")
      .toLowerCase()
  const nName = normalizeName(pkgName)
  if (!nName) return undefined
  return localPackageOffers.value.find(i => {
    const candidate = normalizeName(i.name)
    return candidate === nName || candidate.startsWith(nName) || nName.startsWith(candidate)
  })
}

const getPackageItemDropoutTotal = (items?: LocalPackageItem[]): number | undefined => {
  if (!items?.length) return undefined

  let total = 0

  for (const item of items) {
    if (item.dropoutUnitPrice === undefined) {
      return undefined
    }

    total += Number(item.dropoutUnitPrice ?? 0) * Math.max(1, Number(item.qty ?? 1))
  }

  return total
}

const resolvePackageOfferDropoutUnitPrice = (offer: LocalPackageOffer): number | undefined => {
  if (offer.dropoutUnitPrice !== undefined) {
    return Number(offer.dropoutUnitPrice ?? 0)
  }

  const totals: number[] = []

  if (offer.bundleId) {
    const bundle = findBundle(offer.bundleId)
    if (bundle?.dropoutUnitPrice === undefined) {
      return undefined
    }

    totals.push(Number(bundle.dropoutUnitPrice ?? 0) * Math.max(1, Number(offer.bundleQty ?? 1)))
  }

  for (const total of [
    getPackageItemDropoutTotal(offer.bundleItems),
    getPackageItemDropoutTotal(offer.machineItems),
    getPackageItemDropoutTotal(offer.techniqueItems),
    getPackageItemDropoutTotal(offer.evaluationItems),
    getPackageItemDropoutTotal(offer.addOnItems),
    getPackageItemDropoutTotal(offer.sessionItems)
  ]) {
    if (total !== undefined) {
      totals.push(total)
    }
  }

  return totals.length ? totals.reduce((sum, total) => sum + total, 0) : undefined
}

const getBundleComponents = (bundleId?: string|number, bundleName?: string): LocalService[] => {
  const bundle = findBundle(bundleId, bundleName); if (!bundle) return []
  const ids = [...bundle.machineIds, ...bundle.techniqueIds, ...bundle.evaluationIds, ...bundle.addOnIds]
  return ids.map(id => localServices.value.find(s => s.id === id)).filter(Boolean) as LocalService[]
}
const getBundleCategoryGroups = (bundleId?: string|number, bundleName?: string): {label:string;items:LocalService[]}[] => {
  const bundle = findBundle(bundleId, bundleName); if (!bundle) return []
  const resolve = (ids: string[]) => ids.map(id => localServices.value.find(s => s.id === id)).filter(Boolean) as LocalService[]
  return [
    {label: "Machines",    items: resolve(bundle.machineIds)},
    {label: "Techniques",  items: resolve(bundle.techniqueIds)},
    {label: "Evaluations", items: resolve(bundle.evaluationIds)},
    {label: "Add-ons",     items: resolve(bundle.addOnIds)},
  ]
}

const expandQtyItems = (
  items: LocalPackageItem[] | undefined,
  ids: string[] | undefined,
  fallbackQty: number | undefined
): Array<LocalPackageItem | {id?:string;qty:number}> =>
  items?.length ? items.map(e => ({...e, qty: Number(e.qty ?? 1)})) : (ids ?? []).map(id => ({id, qty: Number(fallbackQty ?? 1)}))

const buildBreakdownItems = (
  entries: Array<LocalPackageItem | {id?:string;qty:number}>,
  resolveItem: (id:string) => {name:string;price:number}|undefined,
  multiplier = 1
): BillingReceiptPrintSubItem[] =>
  entries.flatMap(entry => {
    if (!entry.id) return []
    const resolved = resolveItem(entry.id); if (!resolved) return []
    const quantity = Math.max(1, Number(entry.qty ?? 1) * multiplier)
    const unitPrice = Number(resolved.price ?? 0)
    return [{
      name: resolved.name,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      ...("dropoutUnitPrice" in entry && entry.dropoutUnitPrice !== undefined ? {dropoutUnitPrice: entry.dropoutUnitPrice} : {})
    }]
  })

const getBundleReceiptGroups = (bundleId?: string|number, bundleName?: string, multiplier = 1): BillingReceiptPrintBreakdownGroup[] =>
  getBundleCategoryGroups(bundleId, bundleName)
    .filter(g => g.items.length > 0)
    .map(g => ({label: g.label, items: g.items.map(i => ({name: i.name, quantity: Math.max(1, multiplier), unitPrice: Number(i.price ?? 0), totalPrice: Number(i.price ?? 0) * Math.max(1, multiplier)}))}))

const resolveLocalServiceSummary   = (id: string) => { const f = localServices.value.find(i => i.id === id); return f ? {name: f.name, price: Number(f.price ?? 0)} : undefined }
const resolveSessionServiceSummary = (id: string) => { const f = sessionServices.value.find(i => String(i.id) === String(id)); return f ? {name: f.name, price: Number(f.price ?? 0)} : undefined }

const getPackageReceiptGroups = (pkgId?: string|number, pkgName?: string, multiplier = 1): BillingReceiptPrintBreakdownGroup[] => {
  const pkg = findPackageOffer(pkgId, pkgName); if (!pkg) return []
  const groups: BillingReceiptPrintBreakdownGroup[] = []
  if (pkg.bundleId) {
    const bundle = findBundle(pkg.bundleId)
    getBundleReceiptGroups(pkg.bundleId, bundle?.name, Math.max(1, Number(pkg.bundleQty ?? 1) * multiplier))
      .forEach(g => groups.push({label: bundle ? `Bundle Â· ${g.label} (${bundle.name})` : `Bundle Â· ${g.label}`, items: g.items}))
  }
  const itemGroups = [
    {label: "Machines",   items: buildBreakdownItems(expandQtyItems(pkg.machineItems,   pkg.machineIds,   pkg.machineQty),   resolveLocalServiceSummary,   multiplier)},
    {label: "Techniques", items: buildBreakdownItems(expandQtyItems(pkg.techniqueItems, pkg.techniqueIds, pkg.techniqueQty), resolveLocalServiceSummary,   multiplier)},
    {label: "Evaluations",items: buildBreakdownItems(expandQtyItems(pkg.evaluationItems,pkg.evaluationIds,pkg.evaluationQty),resolveLocalServiceSummary,   multiplier)},
    {label: "Add-ons",    items: buildBreakdownItems(expandQtyItems(pkg.addOnItems,     pkg.addOnIds,     pkg.addOnQty),     resolveLocalServiceSummary,   multiplier)},
    {label: "Sessions",   items: buildBreakdownItems(expandQtyItems(pkg.sessionItems,   pkg.sessionIds,   pkg.sessionQty),   resolveSessionServiceSummary, multiplier)},
  ]
  itemGroups.forEach(g => { if (g.items.length) groups.push(g) })
  return groups
}

// â”€â”€ Line parsing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type PackageInvoicePrintSubItem = {
  name: string
  quantity: number
  unitPrice?: number
  dropoutUnitPrice?: number
  children?: PackageInvoicePrintSubItem[]
}
type ParsedLine = {key:string;id:string;type:string;name:string;price:number;dropoutUnitPrice?:number;quantity:number;originalPrice?:number;children?: BillingLineItem[]}
const parsedLineItems = (raw?: string): ParsedLine[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<{id?:string|number;type?:string;name?:string;price?:number;dropoutUnitPrice?:number;dropout_unit_price?:number;originalPrice?:number;quantity?:number;children?: BillingLineItem[]}>
    if (!Array.isArray(parsed)) return []
    return parsed.map((line, i) => ({
      key: `${i}-${line.id ?? line.name}`,
      id: String(line.id ?? ""), type: line.type ?? "service", name: line.name ?? "â€”",
      price: Number(line.price ?? 0),
      dropoutUnitPrice: normalizeOptionalAmount(line.dropoutUnitPrice, line.dropout_unit_price),
      quantity: Math.max(1, Number(line.quantity ?? 1)),
      originalPrice: line.originalPrice ? Number(line.originalPrice) : undefined,
      children: Array.isArray(line.children) ? line.children : undefined
    }))
  } catch { return [] }
}

const selectedBillingLines            = computed(() => parsedLineItems(selectedBillingDetail.value?.line_items_json))
const selectedBillingEncounterTickets = computed(() => selectedBillingDetail.value?.encounter_tickets ?? [])

// â”€â”€ Encounter ticket helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const formatEncounterTicketPackageSource = (value?: string): string => {
  const n = String(value ?? "").trim().toUpperCase()
  if (n === "PATIENT_PACKAGE_SERVICE_PURCHASE") return "Linked from patient package service purchase"
  if (n === "PATIENT_PACKAGE_PURCHASE")         return "Linked from patient package purchase"
  if (n === "PHASE1_BILLING_PACKAGE")           return "Linked from the billing package record"
  if (n === "BILLING_LINE_ITEM_PACKAGE")        return "Linked from the saved billing package line item"
  return value?.trim() || "Linked billing package"
}
const describeEncounterTicketPackage = (ticket: BillingEncounterTicket): string => {
  const n = ticket.active_billing_package_name?.trim() || ticket.billing_snapshot?.active_billing_package_name?.trim() || ""
  const id = ticket.active_billing_package_id?.trim() || ticket.billing_snapshot?.active_billing_package_id?.trim() || ""
  if (n && id && n !== id) return `${n} (${id})`
  return n || id || "No active billing package linked"
}
const describeEncounterTicketPackageSource = (ticket: BillingEncounterTicket): string|undefined => {
  const source = ticket.active_billing_package_source?.trim() || ticket.billing_snapshot?.active_billing_package_source?.trim() || ""
  if (!source) return undefined
  const id = ticket.active_billing_package_id?.trim() || ticket.billing_snapshot?.active_billing_package_id?.trim() || ""
  return id ? `${formatEncounterTicketPackageSource(source)} Â· Linked ID ${id}` : formatEncounterTicketPackageSource(source)
}

const getSelectedBillingLineBreakdownGroups = (line: {type:string;id:string|number;name:string;quantity:number}): BillingReceiptPrintBreakdownGroup[] => {
  if (line.type === "bundle")  return getBundleReceiptGroups(line.id, line.name, line.quantity)
  if (line.type === "package" && selectedBillingPackageGroupId.value > 0) return []
  if (line.type === "package") return getPackageReceiptGroups(line.id, line.name, line.quantity)
  return []
}


const isPrintableBillingStatus = (value?: string): boolean => {
  const status = normalizeBillingStatusLabel(value)
  return ["BILLED", "PAID", "DROPPED_OUT", "CROSS_MONTH_DROPPED_OUT"].includes(status)
}

const isLguBillingRow = (billing?: BillingListItem | null): boolean =>
  normalizeBillingTypeValue(billing?.billing_type) === "LGU_BILLING"

const isBillingMarkedBilled = (billing?: BillingListItem | null): boolean =>
  normalizeBillingStatusLabel(resolveBillingRuntimeStatus(billing)) === "BILLED"

const canPrintLguAppointmentInvoice = (billing?: BillingListItem | null): boolean =>
  Boolean(billing) &&
  isLguBillingRow(billing) &&
  isPrintableBillingStatus(resolveBillingRuntimeStatus(billing))

const getLguAppointmentInvoiceTooltip = (billing?: BillingListItem | null): string =>
  canPrintLguAppointmentInvoice(billing)
    ? "Print this appointment invoice"
    : "Billing is not printable yet"

const selectedBillingPrintButtonLabel = computed(() =>
  "Print Invoice"
)

const canPrintSelectedBillingReceipt = computed<boolean>(() => {
  if (!selectedBillingDetail.value) return false
  if (isLguBillingRow(selectedBillingDetail.value)) {
    return canPrintLguAppointmentInvoice(selectedBillingDetail.value)
  }
  return isPrintableBillingStatus(resolveBillingRuntimeStatus(selectedBillingDetail.value))
})

const printReceiptTooltip = computed(() => {
  if (!selectedBillingDetail.value) return "No billing selected"

  if (isLguBillingRow(selectedBillingDetail.value)) {
    return getLguAppointmentInvoiceTooltip(selectedBillingDetail.value)
  }

  if (canPrintSelectedBillingReceipt.value) {
    return "Print the current billing invoice"
  }

  if (["DROPPED_OUT", "CROSS_MONTH_DROPPED_OUT"].includes(normalizeBillingStatusLabel(resolveBillingRuntimeStatus(selectedBillingDetail.value)))) {
    return "Print the LGU dropout billing invoice"
  }

  return "Mark this billing as billed first before printing"
})

const selectedBillingOriginalTotal = computed(() =>
  selectedBillingLines.value.reduce((sum, l) => sum + Number(l.originalPrice ?? l.price ?? 0) * Number(l.quantity ?? 1), 0)
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

type BillingPackageGroupSummary = {
  id: number
  patient_id?: number
  package_id?: number | null
  package_name: string
  package_total_price: number
  total_sessions: number
  package_status?: string
  payment_status?: string
  stored_payment_status?: string
  total_paid?: number
  balance?: number
  child_billings_total?: number
  billing_count?: number
  paid_session_count?: number
  paid_or_partial_session_count?: number
  created_at?: string
  updated_at?: string | null
}

type BillingWithPackageGroup = BillingListItem & {
  package_group_id?: number
  session_sequence?: number
  total_sessions?: number
  session_sequence_label?: string
  package_group?: BillingPackageGroupSummary | null
}

const selectedBillingDetailWithPackage = computed(() =>
  selectedBillingDetail.value as BillingWithPackageGroup | undefined
)

const selectedBillingPackageGroup = computed(() =>
  selectedBillingDetailWithPackage.value?.package_group ?? null
)

const selectedBillingPackageTotalPrice = computed(() =>
  Number(selectedBillingPackageGroup.value?.package_total_price ?? 0)
)

const selectedBillingPackagePaid = computed(() =>
  Number(selectedBillingPackageGroup.value?.total_paid ?? 0)
)

const selectedBillingPackageBalance = computed(() => {
  const explicitBalance = selectedBillingPackageGroup.value?.balance

  if (explicitBalance !== undefined && explicitBalance !== null) {
    return Math.max(0, Number(explicitBalance))
  }

  return Math.max(0, selectedBillingPackageTotalPrice.value - selectedBillingPackagePaid.value)
})

const selectedBillingPackagePaymentStatus = computed(() => {
  const storedStatus = String(
    selectedBillingPackageGroup.value?.payment_status ??
    selectedBillingPackageGroup.value?.stored_payment_status ??
    ""
  ).trim()

  if (storedStatus) return displayBillingStatus(storedStatus)
  if (selectedBillingPackageBalance.value <= 0 && selectedBillingPackageTotalPrice.value > 0) return "PAID"
  if (selectedBillingPackagePaid.value > 0) return "PARTIAL"
  return "UNPAID"
})

const selectedBillingPackageSessionLabel = computed(() =>
  String(
    selectedBillingDetailWithPackage.value?.session_sequence_label ??
    (selectedBillingDetailWithPackage.value?.session_sequence && selectedBillingDetailWithPackage.value?.total_sessions
      ? `Session ${selectedBillingDetailWithPackage.value.session_sequence} of ${selectedBillingDetailWithPackage.value.total_sessions}`
      : "Session billing")
  )
)

const selectedBillingPackageGroupId = computed(() =>
  Number(
    selectedBillingPackageGroup.value?.id ??
    selectedBillingDetailWithPackage.value?.package_group_id ??
    0
  )
)

const selectedBillingPackageIncludedBillings = computed(() => {
  const packageGroupId = selectedBillingPackageGroupId.value
  if (packageGroupId <= 0) return []

  return billings.value
    .filter(billing => getBillingPackageGroupId(billing) === packageGroupId)
    .sort((a, b) => packageGroupSortValue(a) - packageGroupSortValue(b))
})

const canShowPayFullPackageButton = computed(() =>
  isSelectedBillingSelfPay.value &&
  selectedBillingPackageGroupId.value > 0
)

const isSelectedBillingPackageFullyPaid = computed(() =>
  selectedBillingPackageGroupId.value > 0 &&
  selectedBillingPackageBalance.value <= 0
)

const canPayFullPackage = computed(() =>
  canShowPayFullPackageButton.value &&
  !isSelectedBillingPackageFullyPaid.value &&
  selectedBillingPackageBalance.value > 0 &&
  !savingPackagePayment.value
)

const canRecordIndividualBillingTender = computed(() =>
  isSelectedBillingSelfPay.value &&
  selectedBillingOutstanding.value > 0 &&
  !isSelectedBillingPackageFullyPaid.value
)

const payFullPackageTooltip = computed(() => {
  if (!isSelectedBillingSelfPay.value) return "Available only for self-pay package billings"
  if (selectedBillingPackageGroupId.value <= 0) return "No package group is linked to this billing"
  if (savingPackagePayment.value) return "Recording package payment..."
  if (selectedBillingPackageBalance.value <= 0) return "This package is already fully paid"
  return "Pay the remaining balance for the whole package"
})

// â”€â”€ Detail modal payment state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const billingDetailPaymentType = ref("")
const billingTenderReferenceNo = ref("")
const billingTenderAmount      = ref<number>(0)
const savingBillingTender      = ref(false)
const markingBillingAsBilled   = ref(false)
const billingContextAppointmentId = ref<number|undefined>(undefined)
const markBilledLoaDialogVisible = ref(false)
const markBilledLoaNumber = ref("")
const markBilledLoaDate = ref("")

const isClaimBillingType = (billingType?: string): boolean => {
  const n = String(billingType ?? "").trim().toUpperCase()
  return n === "HMO_BILLING" || n === "HMO" || n === "LGU_BILLING" || n === "LGU"
}

const isSelectedBillingSelfPay   = computed(() => selectedBillingDetail.value ? !isClaimBillingType(selectedBillingDetail.value.billing_type) : false)
const selectedBillingNormalizedStatus = computed(() => normalizeBillingStatusLabel(resolveBillingRuntimeStatus(selectedBillingDetail.value)))
const isSelectedBillingMarkedBilled   = computed(() => selectedBillingNormalizedStatus.value === "BILLED")
const isSelectedBillingHmo = computed(() => {
  const n = String(selectedBillingDetail.value?.billing_type ?? "").trim().toUpperCase()
  return n === "HMO_BILLING" || n === "HMO"
})

const canShowMarkBillingAsBilledAction = computed(() =>
  !!selectedBillingDetail.value &&
  isClaimBillingType(selectedBillingDetail.value.billing_type) &&
  !["PAID","VOID","CANCELLED","DROPPED_OUT","CROSS_MONTH_DROPPED_OUT"].includes(selectedBillingNormalizedStatus.value)
)
const canMarkSelectedBillingAsBilled = computed(() => canShowMarkBillingAsBilledAction.value && !isSelectedBillingMarkedBilled.value)
const canSubmitMarkBilledLoa = computed(() => canMarkSelectedBillingAsBilled.value && !!markBilledLoaNumber.value.trim() && !!markBilledLoaDate.value)
const showBillingSettlementCard      = computed(() => !props.overlayOnly || overlayEntryMode.value === "tender")

const billingTenderInputAmount = computed(() => toWholePeso(billingTenderAmount.value))
const billingTenderApplied     = computed(() => Math.min(toWholePeso(selectedBillingOutstanding.value), billingTenderInputAmount.value))
const billingResultingPaid     = computed(() => toWholePeso(selectedBillingAmountPaid.value + billingTenderApplied.value))
const billingResultingChange   = computed(() => Math.max(0, billingTenderInputAmount.value - toWholePeso(selectedBillingOutstanding.value)))

const selectedBillingDiscountAmount = computed(() =>
  Math.max(0, Number(selectedBillingDetail.value?.discount_amount ?? 0))
)

const selectedBillingDiscountTypeLabel = computed(() => {
  const type = String(selectedBillingDetail.value?.discount_type ?? "").trim().toUpperCase()
  if (type === "PERCENTAGE") {
    const value = Number(selectedBillingDetail.value?.discount_value ?? 0)
    return value > 0 ? `Percentage (${value}%)` : "Percentage"
  }
  if (type === "FIXED") return "Fixed Amount"
  return "Applied"
})

const selectedBillingDiscountNote = computed(() => {
  if (selectedBillingDiscountAmount.value <= 0) return ""
  return `Discount applied: ${selectedBillingDiscountTypeLabel.value} Â· ${asCurrency(selectedBillingDiscountAmount.value)} deducted from subtotal.`
})

const canSaveBillingTender = computed(() =>
  !!selectedBillingDetail.value &&
  canRecordIndividualBillingTender.value &&
  billingTenderInputAmount.value > 0 &&
  !!billingDetailPaymentType.value.trim()
)

// â”€â”€ Claim workflow messages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getClaimWorkflowMessage = (billingType?: string, billingStatus?: string): string => {
  const n = String(billingType ?? "").trim().toUpperCase()
  const s = normalizeBillingStatusLabel(billingStatus)
  if (n === "HMO_BILLING" || n === "HMO") {
    return s === "BILLED"
      ? "This HMO transaction is marked as billed. Ready for claim follow-through and reconciliation."
      : "HMO flow: patient enlistment, LOA signature, scheduling, then billing. Payment tendering is handled outside the POS modal."
  }
  if (n === "LGU_BILLING" || n === "LGU") {
    if (s === "CROSS_MONTH_DROPPED_OUT") {
      return "LGU cross-month dropout: completed sessions remain in their service month, while the dropout adjustment is tracked in the dropout month."
    }
    if (s === "DROPPED_OUT") {
      return "LGU dropout billing: this record is tracked as a dropped-out authorization/session and is excluded from normal payment tendering."
    }
    return s === "BILLED"
      ? "This LGU transaction is marked as billed. Ready for guarantee tracking and reconciliation."
      : "LGU billing follows a guarantee or sponsorship workflow. Payment tendering is handled outside the POS modal."
  }
  return ""
}
const formClaimWorkflowMessage       = computed(() => getClaimWorkflowMessage(form.value.billing_type))
const selectedBillingClaimWorkflowMessage = computed(() => getClaimWorkflowMessage(selectedBillingDetail.value?.billing_type, resolveBillingRuntimeStatus(selectedBillingDetail.value)))

// â”€â”€ Formatting helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const formatDateTime = (value?: string|number|Date): string =>
  value ? new Date(value).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "N/A"
const formatDate = (value?: string|number|Date): string =>
  value ? new Date(value).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "N/A"

const displayBillingType = (value?: string): string => {
  const n = String(value ?? "").trim().toUpperCase()
  if (n === "SELF_PAY_SINGLE")                          return "Self Pay: Single"
  if (n === "SELF_PAY_PACKAGE")                         return "Self Pay: Package"
  if (n === "HMO_BILLING" || n === "HMO")               return "HMO"
  if (n === "LGU_BILLING" || n === "LGU")               return "LGU"
  return value?.trim() || "N/A"
}

const billingTypeSeverity = (value?: string): "success"|"info"|"warn"|"secondary" => {
  const n = normalizeBillingTypeValue(value)
  if (n === "SELF_PAY_SINGLE") return "success"
  if (n === "SELF_PAY_PACKAGE") return "info"
  if (n === "HMO_BILLING") return "info"
  if (n === "LGU_BILLING") return "warn"
  return "secondary"
}

const billingTableTypeLabel = (billing: BillingTableRow): string => {
  if (billing.is_lgu_group_row) return "LGU Group"
  if (billing.is_package_group_row) return "Package Group"
  return displayBillingType(billing.billing_type)
}

const billingTableTypeSeverity = (billing: BillingTableRow): "success"|"info"|"warn"|"secondary" =>
  billing.is_lgu_group_row
    ? "warn"
    : billing.is_package_group_row
      ? "info"
      : billingTypeSeverity(billing.billing_type)

// â”€â”€ Billing mode banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const billingModeBannerClass = computed(() => {
  if (form.value.billing_type === "HMO_BILLING")     return "bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
  if (form.value.billing_type === "LGU_BILLING")     return "bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
  if (form.value.billing_type === "SELF_PAY_SINGLE") return "bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800"
  if (form.value.billing_type === "SELF_PAY_PACKAGE")return "bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800"
  return "bg-[rgb(var(--app-bg))] border border-[rgb(var(--app-border))]"
})
const billingModeIcon = computed(() => {
  if (form.value.billing_type === "HMO_BILLING")      return "pi pi-shield"
  if (form.value.billing_type === "LGU_BILLING")      return "pi pi-building"
  if (form.value.billing_type === "SELF_PAY_SINGLE")  return "pi pi-user"
  if (form.value.billing_type === "SELF_PAY_PACKAGE") return "pi pi-box"
  return "pi pi-credit-card"
})
const billingModeLabel = computed(() => displayBillingType(form.value.billing_type))
const billingModeHint  = computed(() => {
  if (form.value.billing_type === "HMO_BILLING")      return "HMO negotiated rates apply Â· Items filtered to plan coverage"
  if (form.value.billing_type === "LGU_BILLING")      return "LGU guarantee workflow Â· Budget monitored per period"
  if (form.value.billing_type === "SELF_PAY_SINGLE")  return "Standard catalogue prices Â· Cash or e-wallet payment"
  if (form.value.billing_type === "SELF_PAY_PACKAGE") return "Package pricing applies Â· Bundles and package offers available"
  return ""
})

const normalizeBillingStatusLabel = (value?: string): string =>
  normalizeLguStatus(value ?? "UNBILLED")

const displayBillingStatus = (value?: string): string => {
  const normalized = normalizeBillingStatusLabel(value)
  if (["DROPPED_OUT", "CROSS_MONTH_DROPPED_OUT", "VOIDED_DROPOUT"].includes(normalized)) {
    return formatLguStatus(normalized).toUpperCase()
  }
  return normalized.replace(/_/g, " ")
}

const resolveBillingRuntimeStatus = (billing?: BillingListItem | null): string => {
  if (!billing) return "UNBILLED"

  const billingType = normalizeBillingTypeValue(billing.billing_type)

  const dropoutStatus = normalizeBillingStatusLabel(
    (billing as any).lgu_patient_program_status ??
    (billing as any).lgu_patient_status ??
    (billing as any).dropout_status ??
    (billing as any).patient_lgu_status ??
    (billing as any).program_status
  )

  if (
    billingType === "LGU_BILLING" &&
    ["DROPPED_OUT", "CROSS_MONTH_DROPPED_OUT", "VOIDED_DROPOUT"].includes(dropoutStatus)
  ) {
    return dropoutStatus
  }

  return normalizeBillingStatusLabel(billing.billing_status)
}

const billingStatusSeverity = (value?: string): "success"|"warn"|"danger"|"info" => {
  const n = normalizeBillingStatusLabel(value)
  if (n === "PAID")    return "success"
  if (["PARTIAL","PENDING","UNBILLED"].includes(n)) return "warn"
  if (["VOID","CANCELLED","DROPPED_OUT","CROSS_MONTH_DROPPED_OUT","VOIDED_DROPOUT"].includes(n)) return "danger"
  return "info"
}

// â”€â”€ Route helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const getRouteQueryValue = (value: unknown): string|undefined => {
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined
  return typeof value === "string" ? value : undefined
}

const normalizeBillingTypeValue = (value?: string): BillingType|undefined => {
  const n = String(value ?? "").trim().toLowerCase()
  if (!n) return undefined
  if (["self pay: single service","self_pay_single"].includes(n)) return "SELF_PAY_SINGLE"
  if (["self pay: package service","self_pay_package"].includes(n)) return "SELF_PAY_PACKAGE"
  if (["hmo","hmo_billing"].includes(n)) return "HMO_BILLING"
  if (["lgu","lgu_billing"].includes(n)) return "LGU_BILLING"
  return undefined
}

const normalizePaymentType = (value?: string): string => {
  const n = String(value ?? "").trim().toLowerCase()
  if (!n) return ""
  const map: Record<string,string> = {
    cash: "Cash",
    card: "Debit/Credit",
    credit: "Debit/Credit",
    "credit card": "Debit/Credit",
    debit: "Debit/Credit",
    "debit card": "Debit/Credit",
    "debit/credit": "Debit/Credit",
    "debit / credit": "Debit/Credit",
    gcash: "E-wallet",
    maya: "E-wallet",
    "e-wallet": "E-wallet",
    "e-wallets": "E-wallet",
    ewallet: "E-wallet",
    ewallets: "E-wallet",
    "e wallet": "E-wallet",
    "e wallets": "E-wallet",
    hmo: "HMO",
    lgu: "LGU",
    other: "Other"
  }
  return map[n] ?? String(value ?? "").trim()
}

const parseRouteQueryId = (value: unknown): number|undefined => {
  const n = Number(getRouteQueryValue(value))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

const routeBillingContextKey = computed(() =>
  [getRouteQueryValue(route.query.patientId) ?? "", getRouteQueryValue(route.query.appointmentId) ?? "",
  getRouteQueryValue(route.query.billingId) ?? "", getRouteQueryValue(route.query.openMode) ?? "",
  getRouteQueryValue(route.query.billing_type) ?? ""].join("|")
)

const derivePaymentType  = (billing: BillingListItem): string => {
  const ref = normalizePaymentType(billing.payment_reference); if (ref) return ref
  const n = normalizeBillingTypeValue(billing.billing_type)
  if (n === "HMO_BILLING") return "HMO"
  if (n === "LGU_BILLING") return "LGU"
  return ""
}
const getDefaultBillingPaymentType = (billing: BillingListItem): string => {
  const existing = derivePaymentType(billing); if (existing) return existing
  const n = normalizeBillingTypeValue(billing.billing_type)
  if (n === "HMO_BILLING") return "HMO"
  if (n === "LGU_BILLING") return "LGU"
  return "Cash"
}

// â”€â”€ Table computed options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const tablePaymentTypeOptions = computed(() => {
  const values = new Set(selfPayPaymentOptions.map(o => o.value))
  values.add("HMO"); values.add("LGU")
  billings.value.forEach(b => { const p = derivePaymentType(b); if (p) values.add(p) })
  return Array.from(values).map(v => ({label: v, value: v}))
})
const tableStatusOptions = computed(() => {
  const values = new Set<string>()
  billings.value.forEach(b => { const s = displayBillingStatus(b.billing_status); if (s) values.add(s) })
  return Array.from(values).sort().map(v => ({label: v, value: v}))
})

const isZeroValueSelfPayPackageSessionRecord = (billing: BillingListItem): boolean => {
  const billingType = normalizeBillingTypeValue(billing.billing_type)
  const serviceType = String(billing.service_type ?? "").trim().toUpperCase()
  const status = normalizeBillingStatusLabel(billing.billing_status)
  const amountDue = Number(billing.amount_due ?? billing.total_amount ?? 0)
  const amountPaid = Number(billing.amount_paid ?? 0)
  const receiptNumber = String(billing.receipt_number ?? "").trim()

  return billingType === "SELF_PAY_PACKAGE" &&
    serviceType === "SINGLE" &&
    Number.isFinite(amountDue) &&
    amountDue <= 0 &&
    Number.isFinite(amountPaid) &&
    amountPaid <= 0 &&
    !receiptNumber &&
    ["ISSUED", "BILLED", "UNBILLED"].includes(status)
}

const filteredBillings = computed(() => {
  const query   = tableFilterQuery.value.trim().toLowerCase()
  const fromDate = tableFilterDateFrom.value ? new Date(tableFilterDateFrom.value) : undefined
  const toDate   = tableFilterDateTo.value ? new Date(tableFilterDateTo.value) : undefined
  if (toDate) toDate.setHours(23, 59, 59, 999)

  return billings.value.filter(billing => {
    if (isZeroValueSelfPayPackageSessionRecord(billing)) return false
    if (query) {
      const haystack = [String(billing.id ?? ""), String(billing.public_id ?? ""), String(billing.patient_id ?? ""),
        String(billing.patient_public_id ?? ""), billing.patient_name ?? "", billing.service_name ?? "",
        String(billing.appointment_id ?? ""), String(billing.appointment_public_id ?? ""),
        String(billing.receipt_number ?? ""), billing.billing_type ?? ""].join(" ").toLowerCase()
      if (!haystack.includes(query)) return false
    }
    if (tableFilterBillingType.value && normalizeBillingTypeValue(billing.billing_type) !== tableFilterBillingType.value) return false
    if (tableFilterPaymentType.value && derivePaymentType(billing) !== tableFilterPaymentType.value) return false
    if (tableFilterStatus.value && displayBillingStatus(billing.billing_status) !== tableFilterStatus.value) return false
    const createdAt = billing.created_at ? new Date(billing.created_at) : undefined
    if (fromDate && (!createdAt || createdAt < fromDate)) return false
    if (toDate   && (!createdAt || createdAt > toDate))   return false
    const amountDue  = Number(billing.amount_due ?? 0)
    const amountPaid = Number(billing.amount_paid ?? 0)
    if (tableFilterMinDue.value != null && amountDue < Number(tableFilterMinDue.value)) return false
    if (tableFilterMaxDue.value != null && amountDue > Number(tableFilterMaxDue.value)) return false
    if (tableFilterOutstandingOnly.value && amountPaid >= amountDue) return false
    return true
  })
})

const getBillingPackageGroupId = (billing: BillingListItem): number => {
  const parsed = Number(billing.package_group_id ?? 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const isPackageGroupBilling = (billing: BillingListItem): boolean =>
  getBillingPackageGroupId(billing) > 0 &&
  ["SELF_PAY_PACKAGE", "LGU_BILLING"].includes(normalizeBillingTypeValue(billing.billing_type) ?? "")

const getLguAppointmentGroupKey = (billing: BillingListItem): string => {
  if (normalizeBillingTypeValue(billing.billing_type) !== "LGU_BILLING") return ""

  const patientId = Number(billing.patient_id ?? 0)
  if (!Number.isFinite(patientId) || patientId <= 0) return ""

  const program = String(billing.lgu_program_name ?? "NO_PROGRAM").trim().toUpperCase()
  const referral = String(
    billing.lgu_reference_label ??
    billing.lgu_patient_referral_form_no ??
    "NO_REFERRAL"
  ).trim().toUpperCase()

  return [patientId, program || "NO_PROGRAM", referral || "NO_REFERRAL"].join("|")
}

const isLguAppointmentGroupBilling = (billing: BillingListItem): boolean =>
  normalizeBillingTypeValue(billing.billing_type) === "LGU_BILLING" &&
  getBillingPackageGroupId(billing) <= 0 &&
  Boolean(getLguAppointmentGroupKey(billing))

const resolvePackageGroupStatus = (rows: BillingListItem[]): string => {
  const statuses = rows.map(row => normalizeBillingStatusLabel(resolveBillingRuntimeStatus(row)))
  if (statuses.includes("CROSS_MONTH_DROPPED_OUT")) return "CROSS_MONTH_DROPPED_OUT"
  if (statuses.includes("DROPPED_OUT")) return "DROPPED_OUT"
  if (statuses.length && statuses.every(status => status === "PAID")) return "PAID"
  if (statuses.some(status => status === "PARTIAL") || rows.some(row => Number(row.amount_paid ?? 0) > 0)) return "PARTIAL"
  if (statuses.some(status => status === "BILLED")) return "BILLED"
  return statuses[0] || "UNPAID"
}

const packageGroupSortValue = (billing: BillingListItem): number => {
  const sequence = Number(billing.session_sequence ?? 0)
  if (Number.isFinite(sequence) && sequence > 0) return sequence
  return Number(billing.id ?? 0)
}

const getPackageLineFullPrice = (billing: BillingListItem): number => {
  try {
    const parsed = JSON.parse(String(billing.line_items_json ?? "[]")) as unknown
    const lines = Array.isArray(parsed) ? parsed : []
    const packageLine = lines.find((line) => {
      if (!line || typeof line !== "object") return false
      const type = String((line as Record<string, unknown>).type ?? "").trim().toLowerCase()
      return type === "package" || type === "package-service" || type === "package_service"
    }) as Record<string, unknown> | undefined

    const fullPrice = Number(
      packageLine?.lineTotal ??
      packageLine?.line_total ??
      packageLine?.total ??
      packageLine?.amount ??
      packageLine?.price
    )

    return Number.isFinite(fullPrice) && fullPrice > 0 ? fullPrice : 0
  } catch {
    return 0
  }
}

const buildPackageGroupTableRow = (groupId: number, rows: BillingListItem[]): BillingTableRow => {
  const sortedRows = [...rows].sort((a, b) => packageGroupSortValue(a) - packageGroupSortValue(b))
  const representative = sortedRows[0] ?? rows[0]
  const summedSessionDue = Number(sortedRows.reduce((sum, row) => sum + Number(row.total_amount ?? row.amount_due ?? 0), 0).toFixed(2))
  const packageLineFullPrice = getPackageLineFullPrice(representative)
  const totalDue = packageLineFullPrice > 0 ? packageLineFullPrice : summedSessionDue
  const totalPaid = Number(sortedRows.reduce((sum, row) => sum + Number(row.amount_paid ?? 0), 0).toFixed(2))
  const balance = Math.max(0, Number((totalDue - totalPaid).toFixed(2)))
  const packageStatus = resolvePackageGroupStatus(sortedRows)
  const totalSessions = Math.max(
    Number(representative.total_sessions ?? 0),
    ...sortedRows.map(row => Number(row.session_sequence ?? 0)),
    sortedRows.length
  )

  return {
    ...representative,
    id: representative.id,
    service_name: representative.package_name || representative.service_name || "Package Billing",
    package_group_id: groupId,
    appointment_id: undefined,
    appointment_public_id: `${sortedRows.length} appointments`,
    billing_status: packageStatus,
    amount_due: totalDue,
    total_amount: totalDue,
    amount_paid: totalPaid,
    is_package_group_row: true,
    representative_billing_id: representative.id,
    package_group_billing_count: sortedRows.length,
    package_total_due: totalDue,
    package_total_paid: totalPaid,
    package_balance: balance,
    package_display_status: packageStatus,
    total_sessions: totalSessions,
    included_billings: sortedRows
  }
}

const buildLguAppointmentGroupTableRow = (groupKey: string, rows: BillingListItem[]): BillingTableRow => {
  const sortedRows = [...rows].sort((a, b) => {
    const leftDate = new Date(a.created_at).getTime()
    const rightDate = new Date(b.created_at).getTime()
    if (leftDate !== rightDate) return leftDate - rightDate
    return Number(a.id ?? 0) - Number(b.id ?? 0)
  })
  const representative = sortedRows[0] ?? rows[0]
  const totalDue = Number(sortedRows.reduce((sum, row) => sum + Number(row.total_amount ?? row.amount_due ?? 0), 0).toFixed(2))
  const totalPaid = Number(sortedRows.reduce((sum, row) => sum + Number(row.amount_paid ?? 0), 0).toFixed(2))
  const balance = Math.max(0, Number((totalDue - totalPaid).toFixed(2)))
  const groupStatus = resolvePackageGroupStatus(sortedRows)
  const totalSessions = Math.max(
    Number(representative.total_sessions ?? 0),
    ...sortedRows.map(row => Number(row.session_sequence ?? 0)),
    sortedRows.length
  )

  return {
    ...representative,
    id: representative.id,
    service_name: representative.lgu_reference_label
      ? `LGU Appointments · ${representative.lgu_reference_label}`
      : "LGU Appointment Billings",
    package_group_id: groupKey,
    appointment_id: undefined,
    appointment_public_id: `${sortedRows.length} appointments`,
    billing_status: groupStatus,
    amount_due: totalDue,
    total_amount: totalDue,
    amount_paid: totalPaid,
    is_lgu_group_row: true,
    representative_billing_id: representative.id,
    package_group_billing_count: sortedRows.length,
    package_total_due: totalDue,
    package_total_paid: totalPaid,
    package_balance: balance,
    package_display_status: groupStatus,
    total_sessions: totalSessions,
    included_billings: sortedRows
  }
}

const billingTableRows = computed<BillingTableRow[]>(() => {
  const output: BillingTableRow[] = []
  const packageGroups = new Map<number, BillingListItem[]>()
  const lguAppointmentGroups = new Map<string, BillingListItem[]>()

  filteredBillings.value.forEach((billing) => {
    const packageGroupId = getBillingPackageGroupId(billing)
    if (isPackageGroupBilling(billing) && packageGroupId > 0) {
      packageGroups.set(packageGroupId, [...(packageGroups.get(packageGroupId) ?? []), billing])
      return
    }

    const lguAppointmentGroupKey = getLguAppointmentGroupKey(billing)
    if (isLguAppointmentGroupBilling(billing) && lguAppointmentGroupKey) {
      lguAppointmentGroups.set(lguAppointmentGroupKey, [...(lguAppointmentGroups.get(lguAppointmentGroupKey) ?? []), billing])
      return
    }

    output.push(billing)
  })

  packageGroups.forEach((rows, groupId) => {
    output.push(buildPackageGroupTableRow(groupId, rows))
  })

  lguAppointmentGroups.forEach((rows, groupKey) => {
    output.push(buildLguAppointmentGroupTableRow(groupKey, rows))
  })

  return output.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

// â”€â”€ Encounter ticket PDF export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildEncounterTicketDeductionSummary = (billingType?: string): string => {
  const n = String(billingType ?? "").trim().toUpperCase().replace(/[: -]/g, "_")
  if (["HMO","HMO_BILLING"].includes(n))               return "Deducting 1 Session from HMO Allocation"
  if (["LGU","LGU_BILLING"].includes(n))               return "Deducting 1 Session from LGU Authorization"
  if (n === "SELF_PAY_PACKAGE")                        return "Recording 1 Attended Package Session"
  return "Attendance record only"
}

const buildEncounterTicketPdfCards = (detail?: BillingListItem): EncounterTicketPdfCard[] => {
  if (!detail) return []
  return (detail.encounter_tickets ?? [])
    .filter(ticket => ticket.record_locked)
    .map(ticket => {
      const snapshot = ticket.billing_snapshot
      return {
        slipNumber: ticket.slip_number || `ETS-${ticket.id}`,
        patientName: snapshot?.patient_name || detail.patient_name || "Patient",
        providerName: snapshot?.provider_name || "Unassigned",
        serviceName: snapshot?.service_name || detail.service_name || "Therapy Session",
        specialtyName: snapshot?.specialty_tag_name,
        specialtyIsActive: snapshot?.specialty_tag_is_active,
        treatmentAreaName: snapshot?.treatment_area_name,
        treatmentAreaColor: snapshot?.treatment_area_color,
        treatmentAreaIsActive: snapshot?.treatment_area_is_active,
        billingRoute: displayBillingType(snapshot?.billing_type ?? detail.billing_type),
        attendanceStatus: ticket.attendance_status === "ATTENDED" ? "Attended" : "No Show",
        attendedAt: ticket.attended_at,
        signedOffAt: ticket.signed_off_at,
        lockedAt: ticket.locked_at,
        encounterTicketId: ticket.id,
        appointmentId: snapshot?.appointment_public_id ?? ticket.appointment_public_id ?? detail.appointment_public_id ?? detail.appointment_id,
        billingId: ticket.phase1_billing_public_id ?? detail.public_id ?? detail.id,
        activeBillingPackageLabel: describeEncounterTicketPackage(ticket),
        activeBillingPackageSource: describeEncounterTicketPackageSource(ticket),
        deductionSummary: buildEncounterTicketDeductionSummary(snapshot?.billing_type ?? detail.billing_type),
        signatureDataUrl: ticket.patient_signature_data_url,
        ptSignatureDataUrl: ticket.pt_signature_data_url,
        sessionSequenceLabel: snapshot?.session_sequence_label
      }
    })
}

const getUnknownRecordValue = (record: unknown, key: string): unknown => {
  if (!record || typeof record !== "object") return undefined
  return (record as Record<string, unknown>)[key]
}

const getTicketSnapshotValue = (ticket: BillingEncounterTicket | null | undefined, key: string): unknown => {
  return getUnknownRecordValue(getUnknownRecordValue(ticket, "billing_snapshot"), key)
}

const getTicketAppointmentId = (ticket?: BillingEncounterTicket | null): number => {
  if (!ticket) return 0

  const parsed = Number(
    getUnknownRecordValue(ticket, "appointment_id") ??
    getTicketSnapshotValue(ticket, "appointment_id") ??
    0
  )

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}


const getBillingLinkedAppointmentId = (
  detail?: BillingListItem | null,
  ticket?: BillingEncounterTicket | null
): number | undefined => {
  const ticketAppointmentId = getTicketAppointmentId(ticket)

  if (ticketAppointmentId) {
    return ticketAppointmentId
  }

  const firstTicket = detail?.encounter_tickets?.[0]

  const parsed = Number(
    detail?.appointment_id ??
    billingContextAppointmentId.value ??
    getUnknownRecordValue(firstTicket, "appointment_id") ??
    getTicketSnapshotValue(firstTicket, "appointment_id") ??
    0
  )

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}



const exportEncounterTicketCards = (cards: EncounterTicketPdfCard[], options: {title:string;subtitle:string;fileName:string}): void => {
  const popup = openEncounterTicketPdfWindow(options.title)
  try { renderEncounterTicketPdfWindow(popup, cards, options) } catch (e) { popup.close(); throw e }
}

const exportSingleEncounterTicketPdf = (ticket: BillingEncounterTicket, detail?: BillingListItem): void => {
  const cards = buildEncounterTicketPdfCards(detail).filter(c => c.slipNumber === (ticket.slip_number || `ETS-${ticket.id}`))
  if (!cards.length) { errorToast(toast, "No locked encounter ticket available"); return }
  try { exportEncounterTicketCards(cards, {title: "Encounter Ticket PDF", subtitle: "Single locked encounter ticket", fileName: cards[0].slipNumber}) }
  catch (e) { errorToast(toast, extractApiErrorMessage(e, "Failed to export encounter ticket PDF")) }
}

const exportSelectedBillingEncounterTicketsPdf = (): void => {
  const cards = buildEncounterTicketPdfCards(selectedBillingDetail.value)
  if (!cards.length) { errorToast(toast, "No locked encounter tickets linked to this billing"); return }
  try {
    exportEncounterTicketCards(cards, {
      title: "Billing Encounter Ticket Pack",
      subtitle: `Locked tickets for Billing ${selectedBillingDetail.value?.public_id ?? selectedBillingDetail.value?.id ?? ""}`,
      fileName: `billing-${selectedBillingDetail.value?.public_id ?? selectedBillingDetail.value?.id ?? "encounter"}-tickets`
    })
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Failed to export billing encounter tickets")) }
}

const fetchBillingContextDetail = async (billingId: number): Promise<{detail?: BillingListItem; paymentLog: BillingPaymentLogEntry[]}> => {
  const context = await billingContextTanstackService.fetchContext(queryClient, billingId)
  const contextRecord = context as unknown as {
    billing?: BillingWithPackageGroup
    package_group?: BillingPackageGroupSummary | null
    payment_log?: BillingPaymentLogEntry[]
  } | undefined

  const detail = contextRecord?.billing
    ? ({
        ...contextRecord.billing,
        package_group: contextRecord.package_group ?? contextRecord.billing.package_group ?? null
      } as BillingListItem)
    : undefined

  return {
    detail,
    paymentLog: contextRecord?.payment_log ?? []
  }
}

const invalidateBillingContext = async (billingId?: number): Promise<void> => {
  if (!billingId) return
  await queryClient.invalidateQueries({queryKey: [BillingTanstackKey.BILLING_CONTEXT, billingId]})
}

const getBillingDetailForEncounterTicketExport = async (billingId: number): Promise<BillingListItem|undefined> => {
  if (selectedBillingDetail.value?.id === billingId && selectedBillingDetail.value.encounter_tickets) return selectedBillingDetail.value
  return (await fetchBillingContextDetail(billingId)).detail
}

const exportBillingEncounterTicketPack = async (billingIds: number[], sourceLabel: string): Promise<void> => {
  const uniqueIds = Array.from(new Set(billingIds.map(Number).filter(id => Number.isFinite(id) && id > 0)))
  if (!uniqueIds.length) { errorToast(toast, "Select at least one billing record"); return }
  let popup: Window
  try { popup = openEncounterTicketPdfWindow("Encounter Ticket PDF Pack") }
  catch { errorToast(toast, "Unable to open PDF window. Allow pop-ups for this site, then try again."); return }
  exportingEncounterTicketsPdf.value = true
  try {
    const details = (await Promise.all(uniqueIds.map(id => getBillingDetailForEncounterTicketExport(id)))).filter((d): d is BillingListItem => !!d)
    const cards = details.flatMap(d => buildEncounterTicketPdfCards(d)).sort((a, b) => new Date(a.signedOffAt).getTime() - new Date(b.signedOffAt).getTime())
    if (!cards.length) { popup.close(); errorToast(toast, "No locked encounter tickets found"); return }
    renderEncounterTicketPdfWindow(popup, cards, {title: "Encounter Ticket PDF Pack", subtitle: sourceLabel, fileName: `encounter-ticket-pack-${new Date().toISOString().slice(0,10)}`})
  } catch (e) { popup.close(); errorToast(toast, extractApiErrorMessage(e, "Failed to export encounter ticket pack")) }
  finally { exportingEncounterTicketsPdf.value = false }
}

const expandBillingTableRowIds = (rows: BillingTableRow[]): number[] =>
  rows.flatMap(row => row.included_billings?.length
    ? row.included_billings.map(billing => billing.id)
    : [row.representative_billing_id ?? row.id]
  )

const exportSelectedEncounterTicketsPdf = async (): Promise<void> =>
  exportBillingEncounterTicketPack(expandBillingTableRowIds(selectedBillingRows.value), `Selected Â· ${selectedBillingRows.value.length} chosen`)

const exportFilteredEncounterTicketsPdf = async (): Promise<void> =>
  exportBillingEncounterTicketPack(expandBillingTableRowIds(billingTableRows.value), `Filtered Â· ${billingTableRows.value.length} shown`)

const resetTableFilters = (): void => {
  tableFilterQuery.value = ""; tableFilterBillingType.value = undefined; tableFilterPaymentType.value = undefined
  tableFilterStatus.value = undefined; tableFilterDateFrom.value = undefined; tableFilterDateTo.value = undefined
  tableFilterMinDue.value = null; tableFilterMaxDue.value = null; tableFilterOutstandingOnly.value = false
}

// â”€â”€ Static options â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const selfPayPaymentOptions = [
  {label: "Cash",     value: "Cash"},
  {label: "E-wallet", value: "E-wallet"},
  {label: "Debit/Credit", value: "Debit/Credit"},
  {label: "Other",    value: "Other"},
]
const discountTypeOptions: Array<{label:string;value:DiscountType}> = [
  {label: "Percentage",    value: "PERCENTAGE"},
  {label: "Fixed Amount",  value: "FIXED"},
]
const isSelfPay = computed(() => form.value.billing_type === "SELF_PAY_SINGLE" || form.value.billing_type === "SELF_PAY_PACKAGE")

// â”€â”€ Service lookups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const machines         = ref<BillingPickerLookup[]>([])
const techniques       = ref<BillingPickerLookup[]>([])
const evaluations      = ref<BillingPickerLookup[]>([])
const addOnMachines    = ref<BillingPickerLookup[]>([])
const addOnTechniques  = ref<BillingPickerLookup[]>([])
const addOnHomeServices= ref<BillingPickerLookup[]>([])

// â”€â”€ HMO rate maps and ID filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const billingPatientHmoId               = ref<number|null>(null)
const billingPatientHmoInfo             = ref<PatientHMOInformation|null>(null)
const billingPatientLguStatus           = ref<string>("")
const syncingBillingHmoRates            = ref(false)
const billingPatientMachineRateMap      = ref<Map<number,number>>(new Map())
const billingPatientTechniqueRateMap    = ref<Map<number,number>>(new Map())
const billingPatientEvaluationRateMap   = ref<Map<number,number>>(new Map())
const billingPatientAddOnMachineRateMap = ref<Map<number,number>>(new Map())
const billingPatientAddOnTechniqueRateMap     = ref<Map<number,number>>(new Map())
const billingPatientAddOnHomeServiceRateMap   = ref<Map<number,number>>(new Map())

// â”€â”€ Selected lines â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type SelectedLine = {
  key: string
  id: number | string
  type: string
  name: string
  price: number
  dropoutUnitPrice?: number
  quantity: number
  originalPrice?: number
  priceOverride?: number
  body_area?: string
  packageId?: string
  bundleTemplateId?: string
  bundleQty?: number
  bundleItems?: LocalPackageItem[]
  packageConfig?: unknown
  children?: BillingLineItem[]
}
const selectedLines      = ref<SelectedLine[]>([])
const selectedLineType   = ref<SelectedLine["type"]>("machine")
const selectedLineId     = ref<number|string>()
const selectedLineQty    = ref<number>(1)
const selectedPackageOfferId = ref<string>()
const manualDiscountEnabled  = ref(false)
const manualDiscountType     = ref<DiscountType>("PERCENTAGE")
const manualDiscountValue    = ref<number>(0)
const manualDiscountReason   = ref("")
const seniorDiscountTargetKey= ref<string|null>(null)

const activePackageOffers = computed(() => localPackageOffers.value.filter(i => i.status !== "Inactive"))

const lineTypeOptions: Array<{label:string;value:SelectedLine["type"]}> = [
  {label: "Machine",               value: "machine"},
  {label: "Technique",             value: "technique"},
  {label: "Evaluation",            value: "evaluation"},
  {label: "Add-ons",               value: "add-on-machine"},
  {label: "Add-on (Home Service)", value: "add-on-home-service"},
]

const billingTypeOptions = [
  {label: "Self Pay: Single Service",  value: "SELF_PAY_SINGLE"},
  {label: "Self Pay: Package Service", value: "SELF_PAY_PACKAGE"},
  {label: "HMO",                       value: "HMO_BILLING"},
  {label: "LGU",                       value: "LGU_BILLING"},
]

const currentLineTypeOptions = computed(() => {
  const type = selectedLineType.value
  if (type === "machine")           return machines.value
  if (type === "technique")         return techniques.value
  if (type === "evaluation")        return evaluations.value
  if (type === "add-on-machine")    return [
    ...addOnMachines.value.map(i => ({...i, type: "add-on-machine" as const})),
    ...addOnTechniques.value.map(i => ({...i, type: "add-on-technique" as const})),
  ]
  return addOnHomeServices.value
})

// â”€â”€ Bundle creation from selection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const selectedIndividualLines = computed(() => selectedLines.value.filter(l => l.type !== "bundle" && l.type !== "package"))
const selectionOriginalTotal  = computed(() => selectedIndividualLines.value.reduce((s, l) => s + Number(l.price ?? 0) * Number(l.quantity ?? 1), 0))

const buildBundlePartsFromSelection = () => {
  const machineIds = new Set<string>(); const techniqueIds = new Set<string>()
  const evaluationIds = new Set<string>(); const addOnIds = new Set<string>()
  selectedIndividualLines.value.forEach(l => {
    const id = String(l.id)
    if (l.type === "machine")          machineIds.add(id)
    else if (l.type === "technique")   techniqueIds.add(id)
    else if (l.type === "evaluation")  evaluationIds.add(id)
    else addOnIds.add(id)
  })
  return {machineIds: Array.from(machineIds), techniqueIds: Array.from(techniqueIds), evaluationIds: Array.from(evaluationIds), addOnIds: Array.from(addOnIds)}
}
const normalizeIds   = (ids: string[]) => [...ids].map(String).sort()
const isSameStringSet = (a: string[], b: string[]) => { const l = normalizeIds(a); const r = normalizeIds(b); return l.length === r.length && l.every((v, i) => v === r[i]) }

const findExistingBundleFromSelection = computed(() => {
  const parts = buildBundlePartsFromSelection()
  const hasAny = parts.machineIds.length + parts.techniqueIds.length + parts.evaluationIds.length + parts.addOnIds.length > 0
  if (!hasAny) return undefined
  return localBundles.value.find(b =>
    isSameStringSet(b.machineIds, parts.machineIds) && isSameStringSet(b.techniqueIds, parts.techniqueIds) &&
    isSameStringSet(b.evaluationIds, parts.evaluationIds) && isSameStringSet(b.addOnIds, parts.addOnIds)
  )
})
const existingBundleMatchName = computed(() => findExistingBundleFromSelection.value?.name)
const canCreateBundleFromSelection = computed(() =>
  form.value.billing_type !== "HMO_BILLING" && selectedLines.value.length > 0 &&
  !selectedLines.value.some(l => l.type === "bundle" || l.type === "package") &&
  selectedIndividualLines.value.length > 0 && selectionOriginalTotal.value > 0 &&
  !findExistingBundleFromSelection.value
)

const isBillingPatientLguDroppedOut = computed(() =>
  ["DROPPED_OUT", "CROSS_MONTH_DROPPED_OUT", "DROPOUT"].includes(
    String(billingPatientLguStatus.value ?? "").trim().toUpperCase()
  )
)

// â”€â”€ Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const form = ref<{
  patient_id?: number; appointment_id?: number; billing_type: BillingType; service_type: ServiceType
  service_name?: string; amount_paid: number; amount_tendered?: number; payment_type?: string
  senior_pwd_id_presented?: boolean; senior_pwd_id_reference?: string; loa_number?: string; loa_date?: string
}>({billing_type: "SELF_PAY_SINGLE", service_type: "SINGLE", amount_paid: 0, amount_tendered: 0, senior_pwd_id_presented: false})

// â”€â”€ Currency & date helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const toWholePeso = (value: unknown): number => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0
}

const asCurrency = (value: unknown) =>
  toWholePeso(value).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })

const selectNumericInputText = (event: Event): void => {
  const input = event.target instanceof HTMLInputElement ? event.target : null
  window.setTimeout(() => input?.select(), 0)
}

const formatFilterDate = (value?: Date): string|undefined => value ? new Date(value).toISOString().slice(0, 10) : undefined
const formatType       = (type: string): string => ({
  machine: "Machine", technique: "Technique", evaluation: "Evaluation",
  "add-on-machine": "Add-ons", "add-on-technique": "Add-ons", "add-on-home-service": "Add-on (Home Service)"
}[type] || type)

// â”€â”€ Line mutation helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const removeLine          = (key: string) => { selectedLines.value = selectedLines.value.filter(i => i.key !== key) }
const setLineQuantity     = (key: string, value: number|null|undefined) => {
  const qty = Math.max(1, toWholePeso(value))
  selectedLines.value = selectedLines.value.map(i => i.key === key ? {...i, quantity: qty} : i)
}
const setLinePriceOverride  = (key: string, value: number|null|undefined) => {
  if (value == null) return
  selectedLines.value = selectedLines.value.map(i => i.key === key ? {...i, priceOverride: toWholePeso(value)} : i)
}
const clearLinePriceOverride = (key: string) => { selectedLines.value = selectedLines.value.map(i => i.key === key ? {...i, priceOverride: undefined} : i) }
const setLineBodyArea       = (key: string, value: string) => { selectedLines.value = selectedLines.value.map(i => i.key === key ? {...i, body_area: value || undefined} : i) }

const addSelectedLine = (): void => {
  if (!selectedLineId.value) return
  const found = currentLineTypeOptions.value.find(i => String(i.id) === String(selectedLineId.value))
  if (!found) return
  selectedLines.value.push({
    key: crypto.randomUUID(),
    id: found.id,
    type: found.type ?? selectedLineType.value,
    name: found.name,
    price: toWholePeso(found.price),
    dropoutUnitPrice: normalizeOptionalAmount((found as Record<string, unknown>).dropoutUnitPrice, (found as Record<string, unknown>).dropout_unit_price),
    quantity: Math.max(1, toWholePeso(selectedLineQty.value))
  })
  selectedLineId.value = undefined; selectedLineQty.value = 1
}

const addSelectedPackageOffer = (): void => {
  if (!selectedPackageOfferId.value) return
  const found = activePackageOffers.value.find(i => i.id === selectedPackageOfferId.value)
  if (!found) return
  selectedLines.value.push({
    key: crypto.randomUUID(),
    id: found.id,
    type: "package",
    name: found.name,
    price: toWholePeso(found.packagePrice),
    dropoutUnitPrice: resolvePackageOfferDropoutUnitPrice(found),
    quantity: 1,
    packageId: found.id,
    bundleTemplateId: found.bundleId,
    bundleQty: Math.max(1, Number(found.bundleQty ?? 1)),
    bundleItems: found.bundleItems?.map(item => ({ ...item })),
    packageConfig: {
      package_id: found.id,
      package_name: found.name,
      bundle_template_id: found.bundleId,
      bundle_qty: Math.max(1, Number(found.bundleQty ?? 1)),
      bundle_items: found.bundleItems?.map(item => ({ ...item })) ?? [],
      machine_items: found.machineItems?.map(item => ({ ...item })) ?? [],
      technique_items: found.techniqueItems?.map(item => ({ ...item })) ?? [],
      evaluation_items: found.evaluationItems?.map(item => ({ ...item })) ?? [],
      add_on_items: found.addOnItems?.map(item => ({ ...item })) ?? [],
      session_items: found.sessionItems?.map(item => ({ ...item })) ?? []
    }
  })
  selectedPackageOfferId.value = undefined
}

// â”€â”€ Price resolution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const resolveNaturalLinePrice = (line: SelectedLine): number => {
  if (form.value.billing_type === "LGU_BILLING" && isBillingPatientLguDroppedOut.value && line.dropoutUnitPrice !== undefined) {
    return Number(line.dropoutUnitPrice ?? 0)
  }

  if (form.value.billing_type !== "HMO_BILLING") return Number(line.price ?? 0)
  const itemId = Number(line.id); if (!Number.isFinite(itemId) || itemId <= 0) return Number(line.price ?? 0)
  const maps: Record<string, Map<number,number>> = {
    machine: billingPatientMachineRateMap.value, technique: billingPatientTechniqueRateMap.value,
    evaluation: billingPatientEvaluationRateMap.value, "add-on-machine": billingPatientAddOnMachineRateMap.value,
    "add-on-technique": billingPatientAddOnTechniqueRateMap.value, "add-on-home-service": billingPatientAddOnHomeServiceRateMap.value
  }
  return maps[line.type]?.get(itemId) ?? Number(line.price ?? 0)
}
const resolveEffectiveBillingLinePrice = (line: SelectedLine): number =>
  line.priceOverride != null ? toWholePeso(line.priceOverride) : toWholePeso(resolveNaturalLinePrice(line))
const resolveBillingLineOriginalPrice  = (line: SelectedLine): number => toWholePeso(line.originalPrice ?? line.price ?? 0)
const billingLineHasCustomPriceBasis = (line: SelectedLine): boolean =>
  Math.abs(resolveBillingLineOriginalPrice(line) - resolveEffectiveBillingLinePrice(line)) > 0.004

// â”€â”€ HMO rate sync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildHmoRateMap = (items: ServiceCatalogItem[]): {map: Map<number, number>; ids: Set<number>} => {
  const map = new Map<number, number>()
  const ids = new Set<number>()
  for (const item of items) {
    const id = Number(item.id)
    const price = Number(item.hmo_rate)
    if (Number.isFinite(id) && id > 0 && Number.isFinite(price) && price >= 0) {
      map.set(id, price)
      ids.add(id)
    }
  }
  return {map, ids}
}

const syncBillingPatientHmoRates = async (): Promise<void> => {
  // Reset all HMO state
  billingPatientHmoId.value = null; billingPatientHmoInfo.value = null
  billingPatientLguStatus.value = ""
  billingPatientMachineRateMap.value = new Map(); billingPatientTechniqueRateMap.value = new Map()
  billingPatientEvaluationRateMap.value = new Map(); billingPatientAddOnMachineRateMap.value = new Map()
  billingPatientAddOnTechniqueRateMap.value = new Map(); billingPatientAddOnHomeServiceRateMap.value = new Map()

  if (form.value.billing_type !== "HMO_BILLING") return
  const patientId = Number(form.value.patient_id)
  if (!Number.isFinite(patientId) || patientId <= 0) return

  syncingBillingHmoRates.value = true
  try {
    const patientContext = await patientTanstackService.fetchContext(queryClient, patientId)
    billingPatientLguStatus.value = String(patientContext?.patient?.lgu_patient_status ?? "").trim().toUpperCase()
    const sponsorEntries = patientContext?.sponsor_information ?? []
    const hmoInfo = sponsorEntries.find(entry => entry.sponsor_context === 'HMO' && Number(entry.hmo_id) > 0) ?? null
    billingPatientHmoInfo.value = hmoInfo
    const hmoId = Number(hmoInfo?.hmo_id)
    if (!Number.isFinite(hmoId) || hmoId <= 0) return
    billingPatientHmoId.value = hmoId

    const catalogContext = await loadCatalogContext("HMO", hmoId)
    const machines   = buildHmoRateMap(catalogContext?.services.machines ?? [])
    const techniques = buildHmoRateMap(catalogContext?.services.techniques ?? [])
    const evals      = buildHmoRateMap(catalogContext?.services.evaluations ?? [])
    const addOnMachines = buildHmoRateMap(catalogContext?.services.add_on_machines ?? [])
    const addOnTechniques = buildHmoRateMap(catalogContext?.services.add_on_techniques ?? [])
    const addOnHomeServices = buildHmoRateMap(catalogContext?.services.add_on_home_services ?? [])

    billingPatientMachineRateMap.value = machines.map
    billingPatientTechniqueRateMap.value = techniques.map
    billingPatientEvaluationRateMap.value = evals.map
    billingPatientAddOnMachineRateMap.value = addOnMachines.map
    billingPatientAddOnTechniqueRateMap.value = addOnTechniques.map
    billingPatientAddOnHomeServiceRateMap.value = addOnHomeServices.map
  } finally { syncingBillingHmoRates.value = false }
}

// â”€â”€ Line items payload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const buildIncludedBillingLine = (
  id: string,
  name: string,
  quantity: number,
  unitPrice = 0,
  dropoutUnitPrice?: number,
  children: BillingLineItem[] = []
): BillingLineItem => ({
  id,
  type: "included-service",
  name,
  price: toWholePeso(unitPrice),
  ...(dropoutUnitPrice === undefined ? {} : {dropoutUnitPrice: toWholePeso(dropoutUnitPrice)}),
  quantity: Math.max(1, toWholePeso(quantity)),
  originalPrice: toWholePeso(unitPrice),
  ...(children.length ? {children} : {})
})

const normalizeInvoiceSubItemName = (value?: string): string =>
  String(value ?? "")
    .replace(/^\s*\d+\s+/, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()

const isPackageBundleInvoiceSubItem = (
  item: PackageInvoicePrintSubItem,
  packageOffer: LocalPackageOffer
): boolean => {
  const itemName = normalizeInvoiceSubItemName(item.name)
  const bundle = findBundle(packageOffer.bundleId)
  const bundleName = normalizeInvoiceSubItemName(bundle?.name)

  if (itemName && bundleName) {
    return itemName === bundleName || itemName.includes(bundleName) || bundleName.includes(itemName)
  }

  return Boolean(packageOffer.bundleId && itemName.includes("bundle"))
}

const getPackageInvoiceSubItemQuantity = (
  item: PackageInvoicePrintSubItem,
  multiplier: number,
  packageOffer?: LocalPackageOffer
): number => {
  if (packageOffer && isPackageBundleInvoiceSubItem(item, packageOffer)) {
    const configuredBundleQty = packageOffer.bundleItems?.[0]?.qty ?? packageOffer.bundleQty
    return Math.max(1, Number(configuredBundleQty ?? 1) * multiplier)
  }

  return Math.max(1, Number(item.quantity ?? 1) * multiplier)
}

const buildInvoiceSubItemBillingChildren = (
  items: PackageInvoicePrintSubItem[] | undefined,
  multiplier = 1,
  path = "package-included",
  packageOffer?: LocalPackageOffer
): BillingLineItem[] =>
  (items ?? []).map((item, index) =>
    buildIncludedBillingLine(
      `${path}-${index + 1}`,
      item.name,
      getPackageInvoiceSubItemQuantity(item, multiplier, packageOffer),
      toWholePeso(item.unitPrice),
      item.dropoutUnitPrice,
      buildInvoiceSubItemBillingChildren(item.children, multiplier, `${path}-${index + 1}`)
    )
  )

const buildBreakdownGroupBillingChildren = (
  groups: BillingReceiptPrintBreakdownGroup[],
  path = "included"
): BillingLineItem[] =>
  groups.flatMap((group, groupIndex) =>
    group.items.map((item, itemIndex) =>
      buildIncludedBillingLine(
        `${path}-${groupIndex + 1}-${itemIndex + 1}`,
        item.name,
        item.quantity,
        item.unitPrice,
        (item as BillingReceiptPrintSubItem & {dropoutUnitPrice?: number}).dropoutUnitPrice
      )
    )
  )

const buildLineItemChildren = (item: SelectedLine): BillingLineItem[] => {
  if (item.children?.length) return item.children

  if (item.type === "bundle") {
    return buildBreakdownGroupBillingChildren(
      getBundleReceiptGroups(item.id, item.name, Number(item.quantity ?? 1)),
      "bundle-included"
    )
  }

  if (item.type === "package") {
    const packageOffer = findPackageOffer(item.id, item.name)
    const quantity = Math.max(1, Number(item.quantity ?? 1))
    if (packageOffer?.invoiceSubItems?.length) {
      return buildInvoiceSubItemBillingChildren(packageOffer.invoiceSubItems, quantity, "package-included", packageOffer)
    }

    return buildBreakdownGroupBillingChildren(
      getPackageReceiptGroups(item.id, item.name, quantity),
      "package-included"
    )
  }

  return []
}

const lineItemsAsPayload = computed((): BillingLineItem[] =>
  selectedLines.value.map(item => {
    const effectivePrice = toWholePeso(resolveEffectiveBillingLinePrice(item))
    const naturalPrice   = toWholePeso(resolveNaturalLinePrice(item))
    const cataloguePrice = toWholePeso(item.price)
    const children = buildLineItemChildren(item)
    let originalPrice: number|undefined
    if (item.priceOverride != null && effectivePrice !== naturalPrice) originalPrice = naturalPrice
    else if (item.originalPrice != null) originalPrice = toWholePeso(item.originalPrice)
    else if (naturalPrice !== cataloguePrice) originalPrice = cataloguePrice
    return {
      id: item.id, type: item.type as BillingLineItem["type"], name: item.name,
      price: effectivePrice, quantity: Math.max(1, toWholePeso(item.quantity)),
      ...(item.dropoutUnitPrice === undefined ? {} : {dropoutUnitPrice: toWholePeso(item.dropoutUnitPrice)}),
      originalPrice, body_area: item.body_area || undefined,
      ...(item.type === "package" ? {
        package_id: item.packageId ?? item.id,
        bundle_template_id: item.bundleTemplateId,
        bundle_id: item.bundleTemplateId,
        bundle_qty: item.bundleQty,
        bundle_items: item.bundleItems?.map(bundleItem => ({
          id: bundleItem.id,
          qty: Math.max(1, Number(bundleItem.qty ?? 1))
        })),
        package_config: item.packageConfig
      } : {}),
      ...(children.length ? {children} : {})
    }
  })
)

const originalSubtotalFromLines = computed(() =>
  selectedLines.value.reduce((s, l) => s + toWholePeso(l.originalPrice ?? l.price) * Math.max(1, toWholePeso(l.quantity)), 0)
)
const subtotalFromLines = computed(() =>
  lineItemsAsPayload.value.reduce((s, l) => s + toWholePeso(l.price) * Math.max(1, toWholePeso(l.quantity)), 0)
)

// â”€â”€ Senior/PWD discount logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const seniorDiscountIsAutoAssigned = computed((): boolean => {
  const bt = form.value.billing_type
  if (bt === "SELF_PAY_PACKAGE") return !!selectedLines.value.find(l => l.type === "package")
  if (bt === "SELF_PAY_SINGLE")  return !!selectedLines.value.find(l => l.type === "bundle")
  return false
})
const seniorDiscountEffectiveTargetKey = computed((): string|null => {
  if (!form.value.senior_pwd_id_presented) return null
  const bt = form.value.billing_type
  if (bt === "SELF_PAY_PACKAGE") return selectedLines.value.find(l => l.type === "package")?.key ?? null
  if (bt === "SELF_PAY_SINGLE")  { const b = selectedLines.value.find(l => l.type === "bundle"); if (b) return b.key }
  return seniorDiscountTargetKey.value
})
const seniorDiscountSelectableLines = computed(() =>
  selectedLines.value.map(l => ({key: l.key, label: `${l.name} â€” ${asCurrency(resolveEffectiveBillingLinePrice(l) * Number(l.quantity ?? 1))}`}))
)

// â”€â”€ POS summary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const posSummary = computed(() => {
  const originalSubtotal = toWholePeso(originalSubtotalFromLines.value)
  const subtotal         = toWholePeso(subtotalFromLines.value)
  const targetLine       = seniorDiscountEffectiveTargetKey.value
    ? selectedLines.value.find(l => l.key === seniorDiscountEffectiveTargetKey.value) : null
  const targetLineSubtotal   = targetLine ? toWholePeso(resolveEffectiveBillingLinePrice(targetLine) * Number(targetLine.quantity ?? 1)) : 0
  const seniorDiscountAmount = form.value.senior_pwd_id_presented && targetLine ? toWholePeso(targetLineSubtotal * 0.2) : 0
  const remainingAfterSenior = Math.max(0, subtotal - seniorDiscountAmount)
  const customDiscountAmount = manualDiscountEnabled.value
    ? manualDiscountType.value === "PERCENTAGE"
      ? toWholePeso(remainingAfterSenior * (Number(manualDiscountValue.value ?? 0) / 100))
      : toWholePeso(manualDiscountValue.value)
    : 0
  const discountAmount = Math.min(subtotal, seniorDiscountAmount + customDiscountAmount)
  const vatableAmount  = Math.max(0, subtotal - discountAmount)
  const vatAmount      = vatEnabled.value ? toWholePeso(vatableAmount * VAT_RATE) : 0
  const totalDue       = toWholePeso(vatableAmount + vatAmount)
  const tendered       = toWholePeso(form.value.amount_tendered)
  const changeAmount   = Math.max(0, tendered - totalDue)
  // Derive amount_paid from tendered, capped at total due
  const amountPaid     = Math.min(totalDue, tendered)
  return {originalSubtotal, subtotal, discountAmount, vatableAmount, vatAmount, totalDue, changeAmount, seniorDiscountAmount, customDiscountAmount, amountPaid}
})

// â”€â”€ LGU budget helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const editingLguReservedAmount = computed(() => {
  if (!editingBillingId.value || form.value.billing_type !== "LGU_BILLING") return 0
  const source = selectedBillingDetail.value?.id === editingBillingId.value
    ? selectedBillingDetail.value
    : billings.value.find(i => i.id === editingBillingId.value)
  if (!source || normalizeBillingTypeValue(source.billing_type) !== "LGU_BILLING") return 0
  return Number(source.total_amount ?? source.amount_due ?? 0)
})
const lguAvailableBeforeSave = computed(() =>
  activeLguBudgetSummary.value ? Number((activeLguBudgetSummary.value.remaining_amount + editingLguReservedAmount.value).toFixed(2)) : null
)
const lguProjectedRemainingAfterSave = computed(() =>
  lguAvailableBeforeSave.value != null ? Number((lguAvailableBeforeSave.value - posSummary.value.totalDue).toFixed(2)) : null
)
// â”€â”€ Service lookup fetchers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fetchSessionLookup = async (): Promise<BillingPickerLookup[]> => {
  const {data} = await pamsAPI.get<Pageable<BillingPickerLookup>>("/sessions/lookup", {params: {page: 1, size: 500, status: Status.ACTIVE}})
  return data?.content ?? []
}

const loadLookups = async (): Promise<void> => {
  loadLocalData()
  const [catalogContext, sessionsRes] = await Promise.all([
    loadCatalogContext("GLOBAL"),
    fetchSessionLookup()
  ])
  await loadPatientOptions()
  if (catalogContext) applyServiceCatalogContext(catalogContext)
  sessionServices.value = sessionsRes
  await loadDbPackageOffers()
}

const ensureLookupsLoaded = async (): Promise<void> => {
  if (patientOptions.value.length && machines.value.length && techniques.value.length && evaluations.value.length) return
  await loadLookups()
}

const fetchBillings = async (): Promise<void> => {
  try {
    isLoading.value = true
    const response = await billingPhase1Service.getAll({
      page: 1, size: 500, name: tableFilterQuery.value.trim() || undefined,
      billing_type: tableFilterBillingType.value, billing_status: tableFilterStatus.value,
      from_date: formatFilterDate(tableFilterDateFrom.value), to_date: formatFilterDate(tableFilterDateTo.value),
      ...(selectedClinicId.value ? {clinic_id: selectedClinicId.value} : {})
    })
    billings.value = response?.content ?? []
    selectedBillingRows.value = []
  } catch (e) {
    billings.value = []
    selectedBillingRows.value = []
    errorToast(toast, extractApiErrorMessage(e, "Could not load billings. Check filters and click Refresh."))
  }
  finally { isLoading.value = false }
}

const refreshLguBudgetSummary = async (): Promise<void> => {
  if (form.value.billing_type !== "LGU_BILLING" || !form.value.patient_id) {
    activeLguBudgetSummary.value = null; lguBudgetSummaryError.value = ""; return
  }
  loadingLguBudgetSummary.value = true
  try {
    activeLguBudgetSummary.value = await lguBillingService.getBudgetSummary(form.value.patient_id, form.value.appointment_id) ?? null
    lguBudgetSummaryError.value = ""
  } catch (e) { activeLguBudgetSummary.value = null; lguBudgetSummaryError.value = extractApiErrorMessage(e, "Failed to load LGU fund summary") }
  finally { loadingLguBudgetSummary.value = false }
}

// â”€â”€ Form reset â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const resetBillingForm = (): void => {
  posExpanded.value = false
  editingBillingId.value = undefined; editingBillingStatus.value = undefined; selectedLines.value = []
  editBillingPaymentLog.value = []
  lockedBillingOverrideEnabled.value = false
  editingPaymentLogEntryId.value = null
  savingPaymentLogEntryId.value = null
  selectedLineType.value = "machine"; selectedLineId.value = undefined; selectedLineQty.value = 1
  selectedPackageOfferId.value = undefined; activeLguBudgetSummary.value = null
  loadingLguBudgetSummary.value = false; lguBudgetSummaryError.value = ""
  manualDiscountEnabled.value = false; manualDiscountType.value = "PERCENTAGE"
  manualDiscountValue.value = 0; manualDiscountReason.value = ""; seniorDiscountTargetKey.value = null
  createBundleDialogVisible.value = false; createBundleName.value = ""; createBundleDiscountedPrice.value = 0
  form.value = {billing_type: "SELF_PAY_SINGLE", service_type: "SINGLE", amount_paid: 0, amount_tendered: 0, payment_type: undefined, senior_pwd_id_presented: false}
}

const enableLockedBillingOverride = (): void => {
  if (!canOfferLockedBillingOverride.value) return
  lockedBillingOverrideEnabled.value = true
}

const openNewBillingForm = async (): Promise<void> => {
  resetBillingForm()
  await ensureLookupsLoaded()
  posExpanded.value = true
  await nextTick()
  posSection.value?.scrollIntoView({behavior: "smooth", block: "start"})
}

const toggleBillingForm = async (): Promise<void> => {
  if (posExpanded.value) {
    posExpanded.value = false
    return
  }
  await ensureLookupsLoaded()
  posExpanded.value = true
}

// â”€â”€ Copy from last session â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const copyFromLastSession = async (): Promise<void> => {
  if (!form.value.patient_id) return
  copyingFromLastSession.value = true
  try {
    const localMatch = billings.value
      .filter(b => b.patient_id === form.value.patient_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    let billingId: number|undefined = localMatch?.id
    if (!billingId) {
      const apiResult = await billingPhase1Service.getAll({patient_id: form.value.patient_id, page: 1, size: 1})
      billingId = apiResult?.content?.[0]?.id
    }
    if (!billingId) { errorToast(toast, "No previous billing found for this patient"); return }
    const detail = (await fetchBillingContextDetail(billingId)).detail
    if (!detail) { errorToast(toast, "Previous billing found but details could not be loaded"); return }
    let lines = parseBillingLines(detail.line_items_json)
    if (form.value.billing_type === "HMO_BILLING") lines = lines.filter(l => l.type !== "bundle" && l.type !== "package")
    if (!lines.length) { errorToast(toast, "Previous billing had no line items to copy"); return }
    selectedLines.value = lines
    successToast(toast, `Copied ${lines.length} item${lines.length === 1 ? "" : "s"} from last session (${detail.created_at})`)
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Could not copy from last session")) }
  finally { copyingFromLastSession.value = false }
}

// â”€â”€ Bundle creation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const openCreateBundleFromSelection = (): void => {
  createBundleName.value = form.value.service_name?.trim() || `Custom Bundle ${new Date().toLocaleDateString("en-PH")}`
  createBundleDiscountedPrice.value = selectionOriginalTotal.value
  createBundleDialogVisible.value = true
}

const saveBundleFromSelection = (): void => {
  if (!canCreateBundleFromSelection.value) { errorToast(toast, "Selected items cannot be saved as a new bundle"); return }
  errorToast(toast, "Bundles must be created in Promos and Offers so they are saved to the database.")
}

// â”€â”€ Create / Update billing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const createBilling = async (): Promise<void> => {
  if (!form.value.patient_id)        { errorToast(toast, "Patient is required"); return }
  if (!selectedLines.value.length)   { errorToast(toast, "Add at least one service"); return }
  const summary = posSummary.value
  const payload: BillingRequest = {
    patient_id: form.value.patient_id,
    appointment_id: form.value.appointment_id,
    billing_type: form.value.billing_type,
    service_type: form.value.service_type,
    service_name: form.value.service_name?.trim() || undefined,
    line_items_json: JSON.stringify(lineItemsAsPayload.value),
    amount_due: summary.totalDue,
    // FIX: derive amount_paid from tendered; do not accept a separate field
    amount_paid: summary.amountPaid,
    payment_reference: form.value.payment_type,
    discount_type: manualDiscountEnabled.value ? manualDiscountType.value : (form.value.senior_pwd_id_presented ? "PERCENTAGE" : undefined),
    discount_value: manualDiscountEnabled.value ? Number(manualDiscountValue.value ?? 0) : (form.value.senior_pwd_id_presented ? 20 : undefined),
    discount_amount: summary.discountAmount,
    subtotal_amount: summary.subtotal,
    total_amount: summary.totalDue,
    amount_tendered: toWholePeso(form.value.amount_tendered),
    change_amount: summary.changeAmount,
    senior_pwd_id_presented: !!form.value.senior_pwd_id_presented,
    senior_pwd_id_reference: form.value.senior_pwd_id_reference?.trim() || undefined,
    loa_number: form.value.loa_number?.trim() || undefined,
    loa_date: form.value.loa_date || undefined,
    notes: manualDiscountReason.value.trim() || undefined,
    // FIX: only persist VAT fields when actually VAT-registered (avoids zero-value VAT audit noise)
    ...(vatEnabled.value ? {
      vat_enabled: true,
      vat_rate: VAT_RATE,
      vatable_amount: summary.vatableAmount,
      vat_amount: summary.vatAmount,
    } : {
      vat_enabled: false,
      vat_rate: undefined,
      vatable_amount: undefined,
      vat_amount: undefined,
    }),
  }

  const editedBillingId = editingBillingId.value
  try {
    if (isEditingPaidBilling.value) {
      errorToast(toast, "Locked billings cannot be updated")
      return
    }
    if (editedBillingId) {
      const currentDetail = (await fetchBillingContextDetail(editedBillingId)).detail
      if (!currentDetail) { errorToast(toast, "Billing record could not be reloaded for security check"); return }
      if (isBillingStatusLocked(resolveBillingRuntimeStatus(currentDetail)) && !canOverrideLockedBillingEdit.value) {
        errorToast(toast, "Locked billings can no longer be edited")
        return
      }
      await billingPhase1Service.update(editedBillingId, payload)
      await invalidateBillingContext(editedBillingId)
      successToast(toast, "Billing updated")
    } else {
      await billingPhase1Service.save(payload)
      successToast(toast, "Billing created")
    }
    await fetchBillings()
    if (editedBillingId && billingEditDrawerVisible.value) {
      const refreshed = (await fetchBillingContextDetail(editedBillingId)).detail
      if (refreshed) { selectedBillingDetail.value = refreshed; billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshed); billingTenderAmount.value = 0 }
      billingEditDrawerVisible.value = false
    }
    resetBillingForm()
    await refreshLguBudgetSummary()
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Failed to save billing")) }
}

// â”€â”€ Load for edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const loadBillingForEdit = async (billingId: number): Promise<void> => {
  lockedBillingOverrideEnabled.value = false
  editingPaymentLogEntryId.value = null
  savingPaymentLogEntryId.value = null
  const {detail, paymentLog} = await fetchBillingContextDetail(billingId)
  if (!detail) return
  editingBillingId.value = detail.id
  editingBillingStatus.value = resolveBillingRuntimeStatus(detail)
  editBillingPaymentLog.value = paymentLog
  form.value = {
    patient_id: detail.patient_id, appointment_id: detail.appointment_id,
    billing_type: normalizeBillingType(detail.billing_type), service_type: normalizeServiceType(detail.service_type),
    service_name: detail.service_name,
    amount_paid: Number(detail.amount_paid ?? 0), amount_tendered: Number(detail.amount_tendered ?? 0),
    payment_type: detail.payment_reference ?? (detail.billing_type === "HMO_BILLING" ? "HMO" : detail.billing_type === "LGU_BILLING" ? "LGU" : undefined),
    senior_pwd_id_presented: !!detail.senior_pwd_id_presented,
    senior_pwd_id_reference: detail.senior_pwd_id_reference,
    loa_number: detail.hmo_loa_number,
    loa_date: detail.hmo_loa_date?.slice(0, 10)
  }
  if (detail.discount_type && detail.discount_value != null) {
    manualDiscountEnabled.value = true; manualDiscountType.value = detail.discount_type; manualDiscountValue.value = Number(detail.discount_value ?? 0)
  }
  selectedLines.value = parseBillingLines(detail.line_items_json)
}

const buildBillingUpdatePayload = (detail: BillingListItem, overrides?: Partial<BillingRequest>): BillingRequest => ({
  patient_id: detail.patient_id, appointment_id: detail.appointment_id, package_id: detail.package_id,
  billing_type: normalizeBillingType(detail.billing_type), service_type: normalizeServiceType(detail.service_type),
  service_name: detail.service_name || undefined, line_items_json: detail.line_items_json,
  amount_due: Number(detail.amount_due ?? detail.total_amount ?? 0), amount_paid: Number(detail.amount_paid ?? 0),
  payment_method_id: detail.payment_method_id, payment_reference: detail.payment_reference || undefined,
  discount_type: detail.discount_type, discount_value: detail.discount_value, discount_amount: detail.discount_amount,
  subtotal_amount: detail.subtotal_amount, total_amount: detail.total_amount ?? detail.amount_due,
  amount_tendered: detail.amount_tendered, change_amount: detail.change_amount,
  pricing_tier: detail.pricing_tier, pricing_source: detail.pricing_source, receipt_number: detail.receipt_number,
  senior_pwd_id_presented: detail.senior_pwd_id_presented, senior_pwd_id_reference: detail.senior_pwd_id_reference,
  loa_number: detail.hmo_loa_number,
  loa_date: detail.hmo_loa_date?.slice(0, 10),
  // Preserve existing VAT fields as-is when updating metadata fields
  vat_enabled: detail.vat_enabled, vat_rate: detail.vat_rate,
  vatable_amount: detail.vatable_amount, vat_amount: detail.vat_amount,
  ...overrides
})

const getBillingPrintDate = (detail: BillingListItem): string =>
  String(
    detail.hmo_loa_date ||
    detail.loa_date ||
    detail.created_at ||
    new Date().toISOString()
  ).slice(0, 10)

const openBillingPrintableRoute = (detail: BillingListItem): void => {
  const normalizedBillingType = normalizeBillingTypeValue(detail.billing_type)
  const printDate = getBillingPrintDate(detail)

  const appointmentId =
    billingContextAppointmentId.value ??
    detail.appointment_id ??
    undefined

  const commonQuery: Record<string, string> = {
    billing_id: String(detail.id),
    patient_id: String(detail.patient_id),
    autoprint: "1"
  }

  if (appointmentId) {
    commonQuery.appointment_id = String(appointmentId)
  }

  const routeLocation =
    normalizedBillingType === "HMO_BILLING"
      ? router.resolve({
          name: "hmo-patient-billing-summary-print",
          query: {
            ...commonQuery,
            hmo_id: detail.hmo_id ? String(detail.hmo_id) : undefined,
            hmo_name: detail.hmo_name,
            from: printDate,
            to: printDate
          }
        })
: normalizedBillingType === "LGU_BILLING"
  ? router.resolve({
      name: "lgu-patient-invoice-billing-print",
      query: {
        ...commonQuery,
        billing_id: String(detail.id),
        autoprint: "1"
      }
    })
        : router.resolve({
            name: normalizedBillingType === "SELF_PAY_PACKAGE"
              ? "self-pay-package-invoice-print"
              : "self-pay-single-invoice-print",
            query: commonQuery
          })

  window.open(routeLocation.href, "_blank", "noopener,noreferrer")
}

// â”€â”€ Open billing details â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const openBillingDetails = async (billingId: number): Promise<void> => {
  if (!billingId) {
    errorToast(toast, "Billing ID is required.")
    return
  }

  /*
    Open the dialog immediately.
    If we wait until the billing context request finishes, the modal looks broken
    whenever the request is slow or fails.
  */
  billingDetailsVisible.value = true
  selectedBillingDetail.value = undefined
  selectedBillingPaymentLog.value = []
  billingTenderReferenceNo.value = ""
  billingTenderAmount.value = 0

  try {
    const { detail, paymentLog } = await fetchBillingContextDetail(billingId)

    if (!detail) {
      billingDetailsVisible.value = false
      errorToast(toast, "Billing details could not be loaded. Refresh and try again.")
      return
    }

    selectedBillingDetail.value = detail
    billingContextAppointmentId.value = getBillingLinkedAppointmentId(detail)
    selectedBillingPaymentLog.value = paymentLog
    billingDetailPaymentType.value = getDefaultBillingPaymentType(detail)
  } catch (err: unknown) {
    billingDetailsVisible.value = false
    errorToast(toast, extractApiErrorMessage(err, "Billing details could not be loaded."))
  }
}

const printSelectedBillingReceipt = async (): Promise<void> => {
  if (!selectedBillingDetail.value) return

  const currentBillingId = selectedBillingDetail.value.id

  const { detail: refreshed, paymentLog: refreshedLog } =
    await fetchBillingContextDetail(currentBillingId)

  if (!refreshed) {
    errorToast(toast, "Billing details could not be refreshed before printing.")
    return
  }

  selectedBillingDetail.value = refreshed
  selectedBillingPaymentLog.value = refreshedLog
  billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshed)

  if (!isPrintableBillingStatus(resolveBillingRuntimeStatus(refreshed))) {
    errorToast(toast, "Mark this billing as billed first before printing.")
    return
  }

  openBillingPrintableRoute(refreshed)
}

const printLguAppointmentInvoice = async (billing: BillingListItem): Promise<void> => {
  if (!billing?.id) return

  const { detail: refreshed } = await fetchBillingContextDetail(billing.id)

  if (!refreshed) {
    errorToast(toast, "Billing details could not be refreshed before printing.")
    return
  }

  if (!canPrintLguAppointmentInvoice(refreshed)) {
    errorToast(toast, "Billing is not printable yet.")
    return
  }

  openBillingPrintableRoute(refreshed)
}

const canPrintPatientInvoiceCopy = computed<boolean>(() => {
  if (!selectedBillingDetail.value) return false
  const normalizedBillingType = normalizeBillingTypeValue(selectedBillingDetail.value.billing_type)
  return normalizedBillingType === "HMO_BILLING"
})

const printSelectedPatientInvoiceCopy = (): void => {
  if (!selectedBillingDetail.value) return
  openBillingPrintableRoute(selectedBillingDetail.value)
}
const openReceiptEditor = async (): Promise<void> => {
  if (!selectedBillingDetail.value || !canEditReceipt.value) return
  if (!machines.value.length && !techniques.value.length && !evaluations.value.length) {
    await loadLookups()
  }
  resetBillingForm()
  await loadBillingForEdit(selectedBillingDetail.value.id)
  billingEditDrawerVisible.value = true
}

const startPaymentLogCorrection = (entry: BillingPaymentLogEntry): void => {
  if (!canEditReceipt.value) return
  editingPaymentLogEntryId.value = entry.id
  paymentLogEditForm.paymentType = normalizePaymentType(entry.paymentType) || "Cash"
  paymentLogEditForm.referenceNo = entry.referenceNo ?? ""
  paymentLogEditForm.note = entry.note ?? ""
}

const cancelPaymentLogCorrection = (): void => {
  editingPaymentLogEntryId.value = null
  paymentLogEditForm.paymentType = ""
  paymentLogEditForm.referenceNo = ""
  paymentLogEditForm.note = ""
}

const savePaymentLogCorrection = async (entry: BillingPaymentLogEntry): Promise<void> => {
  const billingId = editingBillingId.value
  if (!billingId || !canEditReceipt.value) return

  const paymentType = paymentLogEditForm.paymentType.trim()
  if (!paymentType) {
    errorToast(toast, "Select a payment type")
    return
  }

  try {
    savingPaymentLogEntryId.value = entry.id
    await billingPhase1Service.updatePaymentLog(billingId, entry.id, {
      paymentType,
      referenceNo: paymentLogEditForm.referenceNo.trim() || null,
      note: paymentLogEditForm.note.trim() || null,
    })
    await invalidateBillingContext(billingId)
    const {detail, paymentLog} = await fetchBillingContextDetail(billingId)
    if (detail) {
      selectedBillingDetail.value = detail
      editingBillingStatus.value = resolveBillingRuntimeStatus(detail)
    }
    editBillingPaymentLog.value = paymentLog
    selectedBillingPaymentLog.value = paymentLog
    cancelPaymentLogCorrection()
    successToast(toast, "Tender history updated")
  } catch (e) {
    errorToast(toast, extractApiErrorMessage(e, "Failed to update tender history"))
  } finally {
    savingPaymentLogEntryId.value = null
  }
}

// â”€â”€ Save tender â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const saveBillingTender = async (): Promise<void> => {
  if (!selectedBillingDetail.value || !canSaveBillingTender.value) return
  const detail = selectedBillingDetail.value
  savingBillingTender.value = true
  try {
    await billingPhase1Service.recordPayment(detail.id, {
      amountTendered: billingTenderInputAmount.value,
      paymentType: billingDetailPaymentType.value.trim(),
      referenceNo: billingTenderReferenceNo.value.trim() || undefined
    })
    await invalidateBillingContext(detail.id)
    const {detail: refreshed, paymentLog: refreshedLog} = await fetchBillingContextDetail(detail.id)
    if (!refreshed) { errorToast(toast, "Payment saved, but detail could not be reloaded"); return }
    selectedBillingDetail.value = refreshed; selectedBillingPaymentLog.value = refreshedLog
    billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshed)
    billingTenderReferenceNo.value = ""; billingTenderAmount.value = 0
    await fetchBillings()
    successToast(toast, "Payment recorded")
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Failed to record payment")) }
  finally { savingBillingTender.value = false }
}

const payFullPackage = async (): Promise<void> => {
  if (!selectedBillingDetail.value || !canPayFullPackage.value) return

  const detail = selectedBillingDetail.value
  const packageGroupId = selectedBillingPackageGroupId.value
  const amountTendered = toWholePeso(selectedBillingPackageBalance.value)

  savingPackagePayment.value = true

  try {
    await billingPhase1Service.recordPackageGroupPayment(packageGroupId, {
      amountTendered,
      paymentType: billingDetailPaymentType.value.trim() || "Cash",
      referenceNo: billingTenderReferenceNo.value.trim() || undefined,
      note: "Full package payment"
    })

    await invalidateBillingContext(detail.id)

    const { detail: refreshed, paymentLog: refreshedLog } =
      await fetchBillingContextDetail(detail.id)

    if (!refreshed) {
      errorToast(toast, "Package payment saved, but detail could not be reloaded.")
      return
    }

    selectedBillingDetail.value = refreshed
    selectedBillingPaymentLog.value = refreshedLog
    billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshed)
    billingTenderReferenceNo.value = ""
    billingTenderAmount.value = 0

    await fetchBillings()

    successToast(toast, "Full package payment recorded")
  } catch (e) {
    errorToast(toast, extractApiErrorMessage(e, "Failed to record full package payment"))
  } finally {
    savingPackagePayment.value = false
  }
}

// â”€â”€ Mark as billed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const startMarkBillingAsBilled = (): void => {
  if (!selectedBillingDetail.value || !canMarkSelectedBillingAsBilled.value) return
  if (isSelectedBillingHmo.value) {
    markBilledLoaNumber.value = selectedBillingDetail.value.hmo_loa_number?.trim() || ""
    markBilledLoaDate.value = selectedBillingDetail.value.hmo_loa_date?.slice(0, 10) || new Date().toISOString().slice(0, 10)
    markBilledLoaDialogVisible.value = true
    return
  }
  void markSelectedBillingAsBilled()
}

const confirmMarkBillingAsBilled = (): void => {
  if (!canSubmitMarkBilledLoa.value) return
  void markSelectedBillingAsBilled(markBilledLoaNumber.value.trim(), markBilledLoaDate.value)
}

const markSelectedBillingAsBilled = async (loaNumber?: string, loaDate?: string): Promise<void> => {
  if (!selectedBillingDetail.value || !canMarkSelectedBillingAsBilled.value) return
  markingBillingAsBilled.value = true
  try {
    const targetAppointmentId = billingContextAppointmentId.value ?? selectedBillingDetail.value.appointment_id
    if (targetAppointmentId) {
      const result = await billingPhase1Service.markAppointmentBilled(selectedBillingDetail.value.id, {
        appointment_id: targetAppointmentId,
        loa_number: loaNumber,
        loa_date: loaDate
      })
      await invalidateBillingContext(selectedBillingDetail.value.id)
      const refreshed = (await fetchBillingContextDetail(selectedBillingDetail.value.id)).detail
      const nextDetail = refreshed ?? selectedBillingDetail.value
selectedBillingDetail.value = {
  ...nextDetail,
  billing_status: result?.billing_status ?? "BILLED",
  appointment_id: targetAppointmentId
}

      billingDetailPaymentType.value = getDefaultBillingPaymentType(selectedBillingDetail.value)
      billingTenderAmount.value = 0
      markBilledLoaDialogVisible.value = false
      markBilledLoaNumber.value = ""
      markBilledLoaDate.value = ""
      await fetchBillings()
      billingContextAppointmentId.value = targetAppointmentId
      emit("billing-updated", {
        billingId: selectedBillingDetail.value.id,
        appointmentId: targetAppointmentId,
        billingStatus: result?.billing_status ?? "BILLED"
      })
      successToast(toast, result?.session_scoped ? "Current appointment marked as billed" : "Transaction marked as billed")
      return
    }

    await billingPhase1Service.update(selectedBillingDetail.value.id, buildBillingUpdatePayload(selectedBillingDetail.value, {
      billing_status: "BILLED",
      loa_number: loaNumber,
      loa_date: loaDate
    }))
    await invalidateBillingContext(selectedBillingDetail.value.id)
    const refreshed = (await fetchBillingContextDetail(selectedBillingDetail.value.id)).detail
    if (!refreshed) { errorToast(toast, "Marked as billed but detail could not be reloaded"); return }
    selectedBillingDetail.value = refreshed; billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshed); billingTenderAmount.value = 0
    markBilledLoaDialogVisible.value = false
    markBilledLoaNumber.value = ""
    markBilledLoaDate.value = ""
    await fetchBillings()
    emit("billing-updated", {
      billingId: selectedBillingDetail.value.id,
      appointmentId: selectedBillingDetail.value.appointment_id ?? undefined,
      billingStatus: "BILLED"
    })
    successToast(toast, "Transaction marked as billed")
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Failed to mark as billed")) }
  finally { markingBillingAsBilled.value = false }
}

// â”€â”€ Route context â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const applyRouteBillingContext = async (): Promise<void> => {
  const patientId    = parseRouteQueryId(route.query.patientId)
  const appointmentId= parseRouteQueryId(route.query.appointmentId)
  const billingId    = parseRouteQueryId(route.query.billingId)
  const openMode     = getRouteQueryValue(route.query.openMode)
  const billingType  = normalizeBillingTypeValue(getRouteQueryValue(route.query.billing_type))

  if (billingType) {
    form.value.billing_type = billingType
  }

  billingContextAppointmentId.value = appointmentId ?? undefined
  overlayEntryMode.value = openMode === "tender" ? "tender" : openMode === "edit" ? "edit" : "detail"
  if (!patientId && !appointmentId && !billingId) {
    billingContextAppointmentId.value = undefined
    return
  }
  resetBillingForm(); selectedBillingDetail.value = undefined; billingDetailsVisible.value = false
  if (patientId)     form.value.patient_id    = patientId
  if (appointmentId) form.value.appointment_id = appointmentId
  if (billingId) {
    if (props.initialView === "detail" || openMode === "detail" || openMode === "tender") {
      overlayActivated.value = props.overlayOnly
      await openBillingDetails(billingId)
    } else {
      overlayActivated.value = props.overlayOnly
      if (!machines.value.length && !techniques.value.length && !evaluations.value.length) {
        await loadLookups()
      }
      await loadBillingForEdit(billingId)
      billingEditDrawerVisible.value = true
      await syncBillingPatientHmoRates()
    }
  }
}

// â”€â”€ Type normalisation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const normalizeBillingType  = (value: string): BillingType  => normalizeBillingTypeValue(value) ?? "SELF_PAY_SINGLE"
const normalizeServiceType  = (value: string): ServiceType  => {
  const n = value.trim().toLowerCase()
  if (n === "package") return "PACKAGE"; if (n === "hmo") return "HMO"; if (n === "lgu") return "LGU"
  return "SINGLE"
}
const parseBillingLines = (raw?: string): SelectedLine[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<{id?:string|number;type?:string;name?:string;price?:number;quantity?:number;originalPrice?:number;body_area?:string;children?: BillingLineItem[]}>
    if (!Array.isArray(parsed)) return []
    return parsed.map(l => ({
      key: crypto.randomUUID(), id: l.id ?? "", type: l.type ?? "service", name: l.name ?? "â€”",
      price: Number(l.price ?? 0), quantity: Math.max(1, Number(l.quantity ?? 1)),
      originalPrice: l.originalPrice ? Number(l.originalPrice) : undefined,
      body_area: l.body_area || undefined,
      children: Array.isArray(l.children) ? l.children : undefined
    }))
  } catch { return [] }
}

// â”€â”€ Watchers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
watch(() => form.value.billing_type, (value) => {
  const serviceTypeMap: Record<BillingType, ServiceType> = {
    SELF_PAY_SINGLE: "SINGLE", SELF_PAY_PACKAGE: "PACKAGE", HMO_BILLING: "HMO", LGU_BILLING: "LGU",
  }
  form.value.service_type = serviceTypeMap[value] ?? "SINGLE"
  if (value === "HMO_BILLING") {
    form.value.payment_type = "HMO"
    selectedLines.value = selectedLines.value.filter(l => l.type !== "bundle" && l.type !== "package")
    selectedPackageOfferId.value = undefined
  } else if (value === "LGU_BILLING") {
    form.value.payment_type = "LGU"
  } else {
    form.value.payment_type = undefined
  }
  seniorDiscountTargetKey.value = null
})

// Clear senior discount target if the targeted line is removed
watch(() => selectedLines.value, (lines) => {
  if (seniorDiscountTargetKey.value && !lines.find(l => l.key === seniorDiscountTargetKey.value)) {
    seniorDiscountTargetKey.value = null
  }
}, {deep: true})

watch([() => form.value.patient_id, () => form.value.billing_type], async () => { await syncBillingPatientHmoRates() })
watch([() => form.value.patient_id, () => form.value.appointment_id, () => form.value.billing_type], async () => { await refreshLguBudgetSummary() })
watch(routeBillingContextKey, async (value, prev) => { if (!value || value === prev) return; await applyRouteBillingContext() })

let filterDebounce: ReturnType<typeof setTimeout> | undefined
watch([tableFilterQuery, tableFilterBillingType, tableFilterStatus, tableFilterDateFrom, tableFilterDateTo], () => {
  if (filterDebounce) clearTimeout(filterDebounce)
  filterDebounce = setTimeout(() => { void fetchBillings() }, 250)
})

watch([billingDetailsVisible, billingEditDrawerVisible], ([dv, ev]) => {
  if (!props.overlayOnly || !overlayActivated.value) return
  if (!dv && !ev) { overlayActivated.value = false; emit("close-overlay") }
})

watch(editingBillingId, (v) => {
  if (v) {
    posExpanded.value = true
    nextTick(() => posSection.value?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }
})

// â”€â”€ Mount â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
onMounted(async () => {
  await loadCurrentUser()

  // Initialize billing type filter from route query if present
  const billingTypeFromRoute = normalizeBillingTypeValue(getRouteQueryValue(route.query.billing_type))
  if (billingTypeFromRoute) {
    tableFilterBillingType.value = billingTypeFromRoute
  }

  await fetchBillings()
  await ensureLookupsLoaded()
  await applyRouteBillingContext()

})

watch(selectedClinicId, () => {
  patientOptions.value = []
  form.value.patient_id = undefined
  void Promise.all([fetchBillings(), loadPatientOptions()])
})
</script>


<style scoped>
.billing-mode-enter-active,
.billing-mode-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.billing-mode-enter-from,
.billing-mode-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.filter-expand-enter-active,
.filter-expand-leave-active {
  transition: opacity 0.15s ease;
}
.filter-expand-enter-from,
.filter-expand-leave-to {
  opacity: 0;
}
</style>
