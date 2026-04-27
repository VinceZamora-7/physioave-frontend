<template>
  <component :is="embedded ? 'div' : 'main'" :class="embedded ? 'space-y-4' : 'app-page-shell space-y-4'">
    <template v-if="!overlayOnly">

      <!-- ── Section 1: Billing Records Table ────────────────────────────── -->
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
              @click="resetBillingForm(); posExpanded = true"
            />
          </div>
        </div>

        <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">

          <!-- Search always visible -->
          <div class="flex items-center gap-3 flex-wrap">
            <div class="flex-1 min-w-48">
              <IftaLabel>
                <InputText v-model="tableFilterQuery" fluid placeholder="Patient name, label, receipt no…" />
                <label>Search</label>
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
                <InputNumber v-model="tableFilterMinDue" :min="0" fluid />
                <label>Min Due</label>
              </IftaLabel>

              <IftaLabel>
                <InputNumber v-model="tableFilterMaxDue" :min="0" fluid />
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
              Showing {{ filteredBillings.length }} of {{ billings.length }} record{{ billings.length !== 1 ? 's' : '' }}
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
                :disabled="filteredBillings.length === 0"
                @click="exportFilteredEncounterTicketsPdf"
              />
            </div>
          </div>
        </div>

        <DataTable
          v-model:selection="selectedBillingRows"
          :value="filteredBillings"
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
          <Column field="patient_name" header="Patient" style="width: 160px" />
          <Column field="billing_type" header="Type" style="width: 140px">
            <template #body="{data}">
              <Tag :value="displayBillingType(data.billing_type)" severity="secondary" class="text-xs" />
            </template>
          </Column>
          <Column header="Label / Receipt" >
            <template #body="{data}">
              <div>
                <div>{{ data.service_name || "—" }}</div>
                <div v-if="data.receipt_number" class="text-xs opacity-50">{{ data.receipt_number }}</div>
              </div>
            </template>
          </Column>
          <Column header="Status" style="width: 110px">
            <template #body="{data}">
              <Tag
                :value="displayBillingStatus(data.billing_status)"
                :severity="billingStatusSeverity(data.billing_status)"
                class="text-xs"
              />
            </template>
          </Column>
          <Column header="Due" style="width: 110px">
            <template #body="{data}">{{ asCurrency(data.amount_due) }}</template>
          </Column>
          <Column header="Paid" style="width: 110px">
            <template #body="{data}">
              <span :class="Number(data.amount_paid) >= Number(data.amount_due) && Number(data.amount_due) > 0 ? 'text-green-600 dark:text-green-400 font-medium' : ''">
                {{ asCurrency(data.amount_paid) }}
              </span>
            </template>
          </Column>
          <Column header="Actions" style="width: 200px">
            <template #body="{data}">
              <div class="flex items-center gap-1">
                <Button size="small" outlined icon="pi pi-eye" label="View" @click="openBillingDetails(data.id)" />
                <Button size="small" text icon="pi pi-pencil" v-tooltip.top="isBillingStatusPaid(data.billing_status) ? 'Open in locked mode (paid)' : 'Edit'" @click="loadBillingForEdit(data.id)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </section>

      <!-- ── Section 2: POS / Create & Edit Billing ───────────────────────── -->
      <section ref="posSection" class="app-section-card-comfy space-y-4">
        <!-- POS section header — always visible -->
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
              @click="posExpanded = !posExpanded"
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

            <!-- ── Billing Mode Banner ──────────────────────────────────── -->
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
                  placeholder="Search patient…"
                />
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
                <InputNumber v-model="form.appointment_id" :min="1" fluid placeholder="Optional" />
                <label>Linked Appointment ID</label>
              </IftaLabel>
            </div>

            <!-- HMO / LGU contextual messages -->
            <template v-if="form.billing_type === 'HMO_BILLING'">
              <Message v-if="billingPatientHmoInfo" severity="info" :closable="false" size="small">
                <span class="font-medium">{{ billingPatientHmoInfo.hmo_name }}</span>
                &nbsp;·&nbsp;{{ billingPatientHmoInfo.hmo_type_name }}
                &nbsp;·&nbsp;{{ billingPatientHmoInfo.company_name }}
              </Message>
              <Message v-else-if="form.patient_id && !syncingBillingHmoRates" severity="warn" :closable="false" size="small">
                No HMO information on file for this patient. Register HMO via the Patients module first.
              </Message>
            </template>

            <template v-if="form.billing_type === 'LGU_BILLING'">
              <Message v-if="loadingLguBudgetSummary" severity="secondary" :closable="false" size="small">
                Loading active LGU fund summary…
              </Message>
              <Message v-else-if="activeLguBudgetSummary" :severity="lguWillExceedRemainingFund ? 'error' : 'info'" :closable="false" size="small">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span class="font-medium">{{ activeLguBudgetSummary.program_name }}</span>
                  <span class="opacity-70">{{ activeLguBudgetSummary.period_year }}-{{ String(activeLguBudgetSummary.period_month).padStart(2, "0") }}</span>
                  <span>Remaining: <strong>{{ asCurrency(activeLguBudgetSummary.remaining_amount) }}</strong></span>
                  <template v-if="lguProjectedRemainingAfterSave != null">
                    <span class="opacity-60">→</span>
                    <span :class="lguWillExceedRemainingFund ? 'text-red-600 font-semibold' : ''">
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
                No active LGU budget period configured. LGU billing cannot be saved until a budget period is opened.
              </Message>
            </template>

            <!-- ── Line Items ─────────────────────────────────────────── -->
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
                  <InputNumber v-model="selectedLineQty" :min="1" fluid @keydown.enter.prevent="addSelectedLine" />
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
                          :minFractionDigits="2"
                          :maxFractionDigits="2"
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
                        v-if="resolveBillingLineOriginalPrice(data) > resolveEffectiveBillingLinePrice(data)"
                        class="text-xs opacity-50 line-through"
                      >{{ asCurrency(resolveBillingLineOriginalPrice(data)) }}</div>
                    </div>
                  </template>
                </Column>

                <Column header="Qty" style="width:80px">
                  <template #body="{data}">
                    <InputNumber
                      :modelValue="data.quantity"
                      :min="1"
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
                        v-if="resolveBillingLineOriginalPrice(data) > resolveEffectiveBillingLinePrice(data)"
                        class="text-xs opacity-50 line-through"
                      >{{ asCurrency(resolveBillingLineOriginalPrice(data) * data.quantity) }}</div>
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

            <!-- ── Discounts ───────────────────────────────────────────── -->
            <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3 space-y-3">
              <h4 class="text-sm font-semibold">Discounts</h4>

              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input v-model="form.senior_pwd_id_presented" type="checkbox" />
                  <span>Senior / PWD ID presented
                    <span class="opacity-50 text-xs">(20% discount on one item — RA 9994)</span>
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
                      — because a {{ form.billing_type === 'SELF_PAY_PACKAGE' ? 'Package' : 'Bundle' }} is in the cart.
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

            <!-- ── Payment ─────────────────────────────────────────────── -->
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
                      Insufficient — short by {{ asCurrency(posSummary.totalDue - Number(form.amount_tendered ?? 0)) }}
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

            <!-- ── Sticky Financial Summary ────────────────────────────── -->
            <div class="sticky bottom-0 z-10 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-surface,var(--app-bg)))] shadow-sm p-3">
              <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 text-sm">
                <div>
                  <div class="text-xs opacity-60">Subtotal</div>
                  <div class="font-semibold">{{ asCurrency(posSummary.subtotal) }}</div>
                </div>
                <div v-if="posSummary.seniorDiscountAmount > 0">
                  <div class="text-xs opacity-60">Senior/PWD</div>
                  <div class="font-semibold text-orange-500">−{{ asCurrency(posSummary.seniorDiscountAmount) }}</div>
                </div>
                <div v-if="posSummary.customDiscountAmount > 0">
                  <div class="text-xs opacity-60">Discount</div>
                  <div class="font-semibold text-orange-500">−{{ asCurrency(posSummary.customDiscountAmount) }}</div>
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
                  :disabled="lguWillExceedRemainingFund"
                  v-tooltip.top="lguWillExceedRemainingFund ? 'LGU fund exceeded — cannot save until budget is increased' : undefined"
                  @click="createBilling"
                />
                <Button v-if="editingBillingId" label="Cancel Edit" icon="pi pi-times" text @click="resetBillingForm" />
              </div>
            </div>

          </div>
        </Transition>
      </section>
    </template>

    <!-- ── Billing Detail Dialog ──────────────────────────────────────────── -->
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
                1) Verify essentials and totals · 2) Tender or complete claim workflow · 3) Review line items · 4) Optional audit review
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Tag :value="displayBillingType(selectedBillingDetail.billing_type)" severity="info" />
              <Tag :value="displayBillingStatus(selectedBillingDetail.billing_status)" :severity="billingStatusSeverity(selectedBillingDetail.billing_status)" />
              <Tag v-if="derivePaymentType(selectedBillingDetail)" :value="derivePaymentType(selectedBillingDetail)" severity="contrast" />
            </div>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <Button label="Print Receipt" icon="pi pi-print" outlined @click="printSelectedBillingReceipt" />
            <Button
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
            <div class="font-medium">{{ selectedBillingDetail.patient_name || selectedBillingDetail.patient_public_id || selectedBillingDetail.patient_id }}</div>
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

        <!-- Step 2: Payment / Claim -->
        <div class="order-4 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <template v-if="isSelectedBillingSelfPay">
            <div>
              <h4 class="text-sm font-semibold">Step 2 · Tender Payment</h4>
              <p class="text-xs opacity-60 mt-0.5">Record payment directly from the detail modal.</p>
            </div>

            <Message v-if="selectedBillingDiscountNote" severity="info" :closable="false">
              {{ selectedBillingDiscountNote }}
            </Message>

            <Message v-if="selectedBillingOutstanding <= 0" severity="success" :closable="false">
              This billing is already fully paid.
            </Message>

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
                    <div class="font-medium">{{ asCurrency(entry.amountTendered) }} → {{ asCurrency(entry.amountApplied) }}</div>
                  </div>
                  <div>
                    <div class="opacity-60 uppercase tracking-wide">Balance After</div>
                    <div class="font-medium">{{ asCurrency(entry.balanceAfter) }}</div>
                  </div>
                  <div>
                    <div class="opacity-60 uppercase tracking-wide">Recorded By</div>
                    <div class="font-medium truncate" :title="entry.recordedBy">{{ entry.recordedBy }}</div>
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

            <!-- Tender form -->
            <template v-if="selectedBillingOutstanding > 0">
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
                  <InputText v-model="billingTenderReferenceNo" fluid placeholder="e.g. GCash Ref #" />
                  <label>Reference Number</label>
                </IftaLabel>

                <IftaLabel>
                  <InputNumber v-model="billingTenderAmount" mode="currency" currency="PHP" locale="en-PH" fluid :min="0" />
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
                  Insufficient — short by {{ asCurrency(selectedBillingOutstanding - billingTenderInputAmount) }}
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
            <div>
              <h4 class="text-sm font-semibold">Step 2 · Claim Workflow</h4>
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

        <!-- Step 3: Line items breakdown -->
        <div class="order-5 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-semibold">Step 3 · Line Items</h4>
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
          class="order-6 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <h4 class="text-sm font-semibold">Step 4 · Encounter Tickets</h4>
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
        <Button v-if="selectedBillingDetail" label="Print Receipt" icon="pi pi-print" outlined @click="printSelectedBillingReceipt" />
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

    <!-- ── Edit Drawer — uses the shared LineItemEditor composable section ── -->
    <Drawer
      v-model:visible="billingEditDrawerVisible"
      position="right"
      header="Edit Billing"
      :style="{ width: 'min(920px, 96vw)' }"
      :modal="true"
    >
      <div class="space-y-5 pb-6">

        <Message v-if="isEditingPaidBilling" class="h-14 py-2 px-2" severity="warn" :closable="false">
          This billing is paid. You can still open and review this record, but updates are locked.
        </Message>

        <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div>
            <h4 class="text-sm font-semibold">1 · Bill Identity</h4>
            <p class="mt-0.5 text-xs opacity-60">Patient, billing type, and optional label.</p>
          </div>
          <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <IftaLabel class="xl:col-span-2">
              <Select v-model="form.patient_id" :options="patientOptions" optionLabel="name" optionValue="id" filter showClear fluid placeholder="Select patient" :disabled="isEditingPaidBilling" />
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
            <InputNumber v-model="form.appointment_id" :min="1" fluid :disabled="isEditingPaidBilling" />
            <label>Linked Appointment ID (optional)</label>
          </IftaLabel>
        </section>

        <section v-if="editingBillingId" class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div>
            <h4 class="text-sm font-semibold">Accounting · Payment History</h4>
            <p class="mt-0.5 text-xs opacity-60">Immutable payment ledger for this billing. Entries cannot be edited or deleted.</p>
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
                <div class="font-medium">{{ asCurrency(entry.amountTendered) }} → {{ asCurrency(entry.amountApplied) }}</div>
              </div>
              <div>
                <div class="opacity-60 uppercase tracking-wide">Balance After</div>
                <div class="font-medium">{{ asCurrency(entry.balanceAfter) }}</div>
              </div>
              <div>
                <div class="opacity-60 uppercase tracking-wide">Recorded By</div>
                <div class="font-medium truncate" :title="entry.recordedBy">{{ entry.recordedBy }}</div>
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
        </section>

        <section class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-4 space-y-3">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 class="text-sm font-semibold">2 · Charge Breakdown</h4>
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
              <InputNumber v-model="selectedLineQty" :min="1" fluid :disabled="isEditingPaidBilling" @keydown.enter.prevent="addSelectedLine" />
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
            <p class="text-sm opacity-50">No line items — use the controls above to add services.</p>
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
                    <InputNumber :modelValue="resolveEffectiveBillingLinePrice(data)" :min="0" :minFractionDigits="2" :maxFractionDigits="2" inputClass="w-24 text-sm" :disabled="isEditingPaidBilling" @update:modelValue="val => setLinePriceOverride(data.key, val)" />
                    <Button v-if="data.priceOverride != null" text rounded size="small" severity="secondary" icon="pi pi-times" v-tooltip.top="'Reset price'" class="p-0 flex-shrink-0" :disabled="isEditingPaidBilling" @click="clearLinePriceOverride(data.key)" />
                  </div>
                  <div v-if="resolveBillingLineOriginalPrice(data) > resolveEffectiveBillingLinePrice(data)" class="text-xs opacity-50 line-through">{{ asCurrency(resolveBillingLineOriginalPrice(data)) }}</div>
                </div>
              </template>
            </Column>
            <Column header="Qty" style="width:80px">
              <template #body="{data}">
                <InputNumber :modelValue="data.quantity" :min="1" inputClass="w-16" :disabled="isEditingPaidBilling" @update:modelValue="setLineQuantity(data.key, $event)" />
              </template>
            </Column>
            <Column header="Line Total" style="width:130px">
              <template #body="{data}">
                <div>
                  <div class="font-medium">{{ asCurrency(resolveEffectiveBillingLinePrice(data) * data.quantity) }}</div>
                  <div v-if="resolveBillingLineOriginalPrice(data) > resolveEffectiveBillingLinePrice(data)" class="text-xs opacity-50 line-through">{{ asCurrency(resolveBillingLineOriginalPrice(data) * data.quantity) }}</div>
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
            <h4 class="text-sm font-semibold">3 · Pricing and Discounts</h4>
            <p class="mt-0.5 text-xs opacity-60">Apply Senior/PWD or custom discount before computing the total.</p>
          </div>

          <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input v-model="form.senior_pwd_id_presented" type="checkbox" :disabled="isEditingPaidBilling" />
            <span>Senior / PWD ID presented <span class="opacity-60 text-xs">(20% discount — RA 9994)</span></span>
          </label>
          <div v-if="form.senior_pwd_id_presented && seniorDiscountIsAutoAssigned && seniorDiscountEffectiveTargetKey" class="text-xs text-sky-700 dark:text-sky-400 pl-5">
            Auto-applied to: <strong>{{ selectedLines.find(l => l.key === seniorDiscountEffectiveTargetKey)?.name }}</strong>
            — because a {{ form.billing_type === 'SELF_PAY_PACKAGE' ? 'Package' : 'Bundle' }} is in the cart.
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
              <InputNumber v-model="manualDiscountValue" :min="0" :max="manualDiscountType === 'PERCENTAGE' ? 100 : undefined" fluid :disabled="isEditingPaidBilling" />
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
          <Button label="Update Billing" icon="pi pi-save" :disabled="isEditingPaidBilling" v-tooltip.top="isEditingPaidBilling ? 'Paid billing is locked' : 'Save updates'" @click="createBilling" />
        </div>
      </div>
    </Drawer>

    <!-- ── Create Bundle Dialog ──────────────────────────────────────────── -->
    <Dialog v-model:visible="createBundleDialogVisible" header="Create New Bundle" modal :style="{width: '520px'}">
      <div class="space-y-3">
        <p class="text-sm opacity-70">Save selected individual items as a reusable bundled service.</p>
        <IftaLabel>
          <InputText v-model="createBundleName" fluid placeholder="Enter bundle name" />
          <label>Bundle Name</label>
        </IftaLabel>
        <IftaLabel>
          <InputNumber v-model="createBundleDiscountedPrice" mode="currency" currency="PHP" locale="en-PH" fluid :min="0" />
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
  </component>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue"
import {useRoute} from "vue-router"
import {storeToRefs} from "pinia"
import {clinicStore} from "@/stores/clinic.store"

const props = withDefaults(defineProps<{embedded?: boolean; overlayOnly?: boolean; initialView?: 'detail' | 'edit'}>(), {embedded: false, overlayOnly: false, initialView: 'edit'})
const emit = defineEmits<{(e: "close-overlay"): void}>()

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
import {openEncounterTicketPdfWindow, renderEncounterTicketPdfWindow, type EncounterTicketPdfCard} from "@/utils/encounter-ticket-pdf.util"
import {getApiErrorMessage} from "@/utils/actionable-error.util"
import {openBillingReceiptWindow, renderBillingReceiptWindow, type BillingReceiptPrintBreakdownGroup, type BillingReceiptPrintSubItem} from "@/utils/billing-receipt-print.util"
import {renderSingleServiceInvoiceWindow} from "@/features/billing/invoices/single-service-invoice.util"
import {renderPackageServiceInvoiceWindow} from "@/features/billing/invoices/package-service-invoice.util"
import {renderHmoInvoiceWindow} from "@/features/billing/invoices/hmo-invoice.util"
import {renderLguInvoiceWindow} from "@/features/billing/invoices/lgu-invoice.util"
import {renderPatientCopyInvoiceWindow} from "@/features/billing/invoices/patient-copy-invoice.util"
import {readActivePromosServiceCatalog} from "@/features/promos-offers/composables/promos-storage.composable"
import { hasAnyStoredPermission, readStoredAuthSnapshot } from "@/utils/auth-user.util"

const route = useRoute()
const toast = useToast()

// ── Clinic branch ─────────────────────────────────────────────────────────────
const globalClinicStore = clinicStore()
const { selectedClinicId } = storeToRefs(globalClinicStore)

// ── State ─────────────────────────────────────────────────────────────────────
const isLoading = ref(false)
const copyingFromLastSession = ref(false)
const billings = ref<BillingListItem[]>([])
const selectedBillingRows = ref<BillingListItem[]>([])
const editingBillingId = ref<number>()
const editingBillingStatus = ref<string>()
const billingDetailsVisible = ref(false)
const selectedBillingPaymentLog = ref<BillingPaymentLogEntry[]>([])
const editBillingPaymentLog = ref<BillingPaymentLogEntry[]>([])
const billingEditDrawerVisible = ref(false)
const overlayActivated = ref(false)
const overlayEntryMode = ref<"detail" | "edit" | "tender">("detail")
const selectedBillingDetail = ref<BillingListItem>()
const exportingEncounterTicketsPdf = ref(false)
const filtersExpanded = ref(false)
const posExpanded = ref(false)
const posSection = ref<HTMLElement | null>(null)

// ── VAT ───────────────────────────────────────────────────────────────────────
// Non-VAT clinic: vatEnabled = false. Fields are OMITTED from payload (not zeroed)
// when vatEnabled is false to keep BIR audit records clean.
const VAT_RATE = 0.12
const vatEnabled = ref(false)

// ── Bundle / Package / local catalog ─────────────────────────────────────────
const createBundleDialogVisible = ref(false)
const createBundleName = ref("")
const createBundleDiscountedPrice = ref<number>(0)

// ── Table filters ─────────────────────────────────────────────────────────────
const tableFilterQuery = ref("")
const tableFilterBillingType = ref<BillingType>()
const tableFilterPaymentType = ref<string>()
const tableFilterStatus = ref<string>()
const tableFilterDateFrom = ref<Date>()
const tableFilterDateTo = ref<Date>()
const tableFilterMinDue = ref<number | null>(null)
const tableFilterMaxDue = ref<number | null>(null)
const tableFilterOutstandingOnly = ref(false)

// ── LGU budget ────────────────────────────────────────────────────────────────
const activeLguBudgetSummary = ref<LguBudgetSummary | null>(null)
const loadingLguBudgetSummary = ref(false)
const lguBudgetSummaryError = ref("")

// ── Role ──────────────────────────────────────────────────────────────────────
const roleName = ref("")
const permissionSet = ref<Set<string>>(new Set())

const billingDetailCardClass = "rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg))] p-3"

// ── Error extraction ──────────────────────────────────────────────────────────
const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Billing access (Read Only or Can Edit) in Role Access",
    notFoundHint: "The billing record was not found. Refresh the list and try again.",
    invalidInputHint: "Some billing fields are invalid. Check patient, line items, and payment values, then retry.",
    retryHint: "Please try again."
  })

// ── Local catalog types ───────────────────────────────────────────────────────
type LocalService  = {id: string; type: string; name: string; price: number; status: string}
type LocalBundle   = {id: string; name: string; machineIds: string[]; techniqueIds: string[]; evaluationIds: string[]; addOnIds: string[]; bundledPrice: number; status: string}
type LocalPackageOffer = {
  id: string; name: string; bundleId?: string; bundleQty: number
  machineIds?: string[]; machineQty?: number; machineItems?: Array<{id:string;qty:number}>
  techniqueIds?: string[]; techniqueQty?: number; techniqueItems?: Array<{id:string;qty:number}>
  evaluationIds: string[]; evaluationQty: number; evaluationItems?: Array<{id:string;qty:number}>
  addOnIds?: string[]; addOnQty?: number; addOnItems?: Array<{id:string;qty:number}>
  sessionIds?: string[]; sessionQty?: number; sessionItems?: Array<{id:string;qty:number}>
  packagePrice: number; status: string
}

const localServices      = ref<LocalService[]>([])
const localBundles       = ref<LocalBundle[]>([])
const localPackageOffers = ref<LocalPackageOffer[]>([])
const sessionServices    = ref<BillingPickerLookup[]>([])
const patientOptions     = ref<Lookup[]>([])
const canEditReceipt     = computed(() =>
  hasAnyStoredPermission(permissionSet.value, "CashBill::UPDATE", "HMOBill::UPDATE", "CashBill::CREATE", "HMOBill::CREATE")
)

const isBillingStatusPaid = (value?: string): boolean => displayBillingStatus(value) === "PAID"
const isSelectedBillingPaid = computed(() => isBillingStatusPaid(selectedBillingDetail.value?.billing_status))
const isEditingPaidBilling = computed(() => isBillingStatusPaid(editingBillingStatus.value))

// ── Normalisation helpers (unchanged from original) ────────────────────────────
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
const parseMaybeJsonArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return []
  const t = value.trim(); if (!t) return []
  try { const p = JSON.parse(t) as unknown; return Array.isArray(p) ? p : [] } catch { return [] }
}
const normalizeStringIdArray = (value: unknown): string[] =>
  parseMaybeJsonArray(value).map(e => toOptionalStringId(e)).filter((e): e is string => !!e)
const normalizeQtyItems = (value: unknown): Array<{id:string;qty:number}> =>
  parseMaybeJsonArray(value).flatMap(entry => {
    if (!entry || typeof entry !== "object") return []
    const raw = entry as Record<string, unknown>
    const id = toOptionalStringId(raw.id ?? raw.item_id ?? raw.service_id ?? raw.session_id)
    if (!id) return []
    return [{id, qty: normalizePositiveInt(raw.qty ?? raw.quantity, 1)}]
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
  return {
    id, name,
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
  if (fallback?.trim()) return fallback.trim()
  return [patient.first_name, patient.middle_name, patient.last_name]
    .filter((p): p is string => !!p && p.toLowerCase() !== "null")
    .join(" ")
}

// ── Patient options ───────────────────────────────────────────────────────────
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

// ── Role sync ─────────────────────────────────────────────────────────────────
const syncRoleFromStorage = (): void => {
  const snapshot = readStoredAuthSnapshot()
  roleName.value = snapshot.roleName
  permissionSet.value = snapshot.permissions
}

// ── Local catalog ─────────────────────────────────────────────────────────────
const loadLocalData = (): void => {
  try { localServices.value = JSON.parse(localStorage.getItem("singlePayServices") || "[]") } catch { localServices.value = [] }
  try { localBundles.value = JSON.parse(localStorage.getItem("bundledServices") || "[]") } catch { localBundles.value = [] }
  try {
    const parsed = JSON.parse(localStorage.getItem("packageServiceOffers") || "[]")
    localPackageOffers.value = Array.isArray(parsed)
      ? parsed.map(normalizePackageServiceOffer).filter((item): item is LocalPackageOffer => item !== null)
      : []
  } catch { localPackageOffers.value = [] }
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
  const nName = (pkgName ?? "").trim().toLowerCase()
  if (!nName) return undefined
  return localPackageOffers.value.find(i => i.name.trim().toLowerCase() === nName)
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
  items: Array<{id:string;qty:number}> | undefined,
  ids: string[] | undefined,
  fallbackQty: number | undefined
): Array<{id?:string;qty:number}> =>
  items?.length ? items.map(e => ({id: e.id, qty: Number(e.qty ?? 1)})) : (ids ?? []).map(id => ({id, qty: Number(fallbackQty ?? 1)}))

const buildBreakdownItems = (
  entries: Array<{id?:string;qty:number}>,
  resolveItem: (id:string) => {name:string;price:number}|undefined,
  multiplier = 1
): BillingReceiptPrintSubItem[] =>
  entries.flatMap(entry => {
    if (!entry.id) return []
    const resolved = resolveItem(entry.id); if (!resolved) return []
    const quantity = Math.max(1, Number(entry.qty ?? 1) * multiplier)
    const unitPrice = Number(resolved.price ?? 0)
    return [{name: resolved.name, quantity, unitPrice, totalPrice: unitPrice * quantity}]
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
      .forEach(g => groups.push({label: bundle ? `Bundle · ${g.label} (${bundle.name})` : `Bundle · ${g.label}`, items: g.items}))
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

// ── Line parsing ──────────────────────────────────────────────────────────────
type ParsedLine = {key:string;id:string;type:string;name:string;price:number;quantity:number;originalPrice?:number}
const parsedLineItems = (raw?: string): ParsedLine[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<{id?:string|number;type?:string;name?:string;price?:number;originalPrice?:number;quantity?:number}>
    if (!Array.isArray(parsed)) return []
    return parsed.map((line, i) => ({
      key: `${i}-${line.id ?? line.name}`,
      id: String(line.id ?? ""), type: line.type ?? "service", name: line.name ?? "—",
      price: Number(line.price ?? 0), quantity: Math.max(1, Number(line.quantity ?? 1)),
      originalPrice: line.originalPrice ? Number(line.originalPrice) : undefined
    }))
  } catch { return [] }
}

const selectedBillingLines            = computed(() => parsedLineItems(selectedBillingDetail.value?.line_items_json))
const selectedBillingEncounterTickets = computed(() => selectedBillingDetail.value?.encounter_tickets ?? [])

// ── Encounter ticket helpers ──────────────────────────────────────────────────
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
  return id ? `${formatEncounterTicketPackageSource(source)} · Linked ID ${id}` : formatEncounterTicketPackageSource(source)
}

const getSelectedBillingLineBreakdownGroups = (line: {type:string;id:string|number;name:string;quantity:number}): BillingReceiptPrintBreakdownGroup[] => {
  if (line.type === "bundle")  return getBundleReceiptGroups(line.id, line.name, line.quantity)
  if (line.type === "package") return getPackageReceiptGroups(line.id, line.name, line.quantity)
  return []
}

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

const selectedBillingReceiptLines = computed(() =>
  selectedBillingLines.value.map(line => ({
    typeLabel: line.type === "bundle" ? "Bundle" : line.type === "package" ? "Package" : formatType(line.type),
    name: line.name,
    quantity: Number(line.quantity ?? 1),
    unitPrice: Number(line.price ?? 0),
    lineTotal: Number(line.price ?? 0) * Number(line.quantity ?? 1),
    originalLineTotal: line.originalPrice && line.originalPrice > line.price
      ? Number(line.originalPrice) * Number(line.quantity ?? 1) : undefined,
    breakdownGroups: getSelectedBillingLineBreakdownGroups(line)
  }))
)

// ── Detail modal payment state ────────────────────────────────────────────────
const billingDetailPaymentType = ref("")
const billingTenderReferenceNo = ref("")
const billingTenderAmount      = ref<number>(0)
const savingBillingTender      = ref(false)
const markingBillingAsBilled   = ref(false)

const selectedBillingAmountTendered = computed(() => Number(selectedBillingDetail.value?.amount_tendered ?? 0))

const isClaimBillingType = (billingType?: string): boolean => {
  const n = String(billingType ?? "").trim().toUpperCase()
  return n === "HMO_BILLING" || n === "HMO" || n === "LGU_BILLING" || n === "LGU"
}

const isSelectedBillingSelfPay   = computed(() => selectedBillingDetail.value ? !isClaimBillingType(selectedBillingDetail.value.billing_type) : false)
const selectedBillingNormalizedStatus = computed(() => displayBillingStatus(selectedBillingDetail.value?.billing_status))
const isSelectedBillingMarkedBilled   = computed(() => selectedBillingNormalizedStatus.value === "BILLED")

const canShowMarkBillingAsBilledAction = computed(() =>
  !!selectedBillingDetail.value &&
  isClaimBillingType(selectedBillingDetail.value.billing_type) &&
  !["PAID","VOID","CANCELLED"].includes(selectedBillingNormalizedStatus.value)
)
const canMarkSelectedBillingAsBilled = computed(() => canShowMarkBillingAsBilledAction.value && !isSelectedBillingMarkedBilled.value)
const showBillingSettlementCard      = computed(() => !props.overlayOnly || overlayEntryMode.value === "tender")

const billingTenderInputAmount = computed(() => Math.max(0, Number(billingTenderAmount.value ?? 0)))
const billingTenderApplied     = computed(() => Math.min(selectedBillingOutstanding.value, billingTenderInputAmount.value))
const billingResultingPaid     = computed(() => selectedBillingAmountPaid.value + billingTenderApplied.value)
const billingResultingAmountTendered = computed(() => selectedBillingAmountTendered.value + billingTenderInputAmount.value)
const billingResultingChange   = computed(() => Math.max(0, billingResultingAmountTendered.value - selectedBillingTotalDue.value))

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
  return `Discount applied: ${selectedBillingDiscountTypeLabel.value} · ${asCurrency(selectedBillingDiscountAmount.value)} deducted from subtotal.`
})

const canSaveBillingTender = computed(() =>
  !!selectedBillingDetail.value &&
  isSelectedBillingSelfPay.value &&
  selectedBillingOutstanding.value > 0 &&
  billingTenderInputAmount.value > 0 &&
  !!billingDetailPaymentType.value.trim()
)

// ── Claim workflow messages ────────────────────────────────────────────────────
const getClaimWorkflowMessage = (billingType?: string, billingStatus?: string): string => {
  const n = String(billingType ?? "").trim().toUpperCase()
  const s = displayBillingStatus(billingStatus)
  if (n === "HMO_BILLING" || n === "HMO") {
    return s === "BILLED"
      ? "This HMO transaction is marked as billed. Ready for claim follow-through and reconciliation."
      : "HMO flow: patient enlistment, LOA signature, scheduling, then billing. Payment tendering is handled outside the POS modal."
  }
  if (n === "LGU_BILLING" || n === "LGU") {
    return s === "BILLED"
      ? "This LGU transaction is marked as billed. Ready for guarantee tracking and reconciliation."
      : "LGU billing follows a guarantee or sponsorship workflow. Payment tendering is handled outside the POS modal."
  }
  return ""
}
const formClaimWorkflowMessage       = computed(() => getClaimWorkflowMessage(form.value.billing_type))
const selectedBillingClaimWorkflowMessage = computed(() => getClaimWorkflowMessage(selectedBillingDetail.value?.billing_type, selectedBillingDetail.value?.billing_status))

// ── Formatting helpers ────────────────────────────────────────────────────────
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
  if (n === "INDIVIDUAL_PRICING")                       return "Individual Pricing"
  if (n === "PACKAGE_BILLING")                          return "Package Billing"
  if (n === "ALA_CARTE")                                return "A La Carte"
  return value?.trim() || "N/A"
}

// ── Billing mode banner ───────────────────────────────────────────────────────
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
  if (form.value.billing_type === "HMO_BILLING")      return "HMO negotiated rates apply · Items filtered to plan coverage"
  if (form.value.billing_type === "LGU_BILLING")      return "LGU guarantee workflow · Budget monitored per period"
  if (form.value.billing_type === "SELF_PAY_SINGLE")  return "Standard catalogue prices · Cash or e-wallet payment"
  if (form.value.billing_type === "SELF_PAY_PACKAGE") return "Package pricing applies · Bundles and package offers available"
  return ""
})

const displayBillingStatus = (value?: string): string => (value?.trim() || "UNBILLED").toUpperCase()
const billingStatusSeverity = (value?: string): "success"|"warn"|"danger"|"info" => {
  const n = displayBillingStatus(value)
  if (n === "PAID")    return "success"
  if (["PARTIAL","PENDING","UNBILLED"].includes(n)) return "warn"
  if (["VOID","CANCELLED"].includes(n))             return "danger"
  return "info"
}

// ── Route helpers ─────────────────────────────────────────────────────────────
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
  if (["individual pricing","individual_pricing"].includes(n)) return "INDIVIDUAL_PRICING"
  if (["package billing","package_billing"].includes(n)) return "PACKAGE_BILLING"
  if (["ala carte","a la carte","ala_carte"].includes(n)) return "ALA_CARTE"
  return undefined
}

const normalizePaymentType = (value?: string): string => {
  const n = String(value ?? "").trim().toLowerCase()
  if (!n) return ""
  const map: Record<string,string> = {cash:"Cash",gcash:"GCash","e-wallet":"E-wallet",ewallet:"E-wallet","e wallet":"E-wallet",hmo:"HMO",lgu:"LGU",other:"Other"}
  return map[n] ?? String(value ?? "").trim()
}

const parseRouteQueryId = (value: unknown): number|undefined => {
  const n = Number(getRouteQueryValue(value))
  return Number.isFinite(n) && n > 0 ? n : undefined
}

const routeBillingContextKey = computed(() =>
  [getRouteQueryValue(route.query.patientId) ?? "", getRouteQueryValue(route.query.appointmentId) ?? "",
   getRouteQueryValue(route.query.billingId) ?? "", getRouteQueryValue(route.query.openMode) ?? ""].join("|")
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

// ── Table computed options ────────────────────────────────────────────────────
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

const filteredBillings = computed(() => {
  const query   = tableFilterQuery.value.trim().toLowerCase()
  const fromDate = tableFilterDateFrom.value ? new Date(tableFilterDateFrom.value) : undefined
  const toDate   = tableFilterDateTo.value ? new Date(tableFilterDateTo.value) : undefined
  if (toDate) toDate.setHours(23, 59, 59, 999)

  return billings.value.filter(billing => {
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

// ── Encounter ticket PDF export ───────────────────────────────────────────────
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
        sessionSequenceLabel: snapshot?.session_sequence_label
      }
    })
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

const getBillingDetailForEncounterTicketExport = async (billingId: number): Promise<BillingListItem|undefined> => {
  if (selectedBillingDetail.value?.id === billingId && selectedBillingDetail.value.encounter_tickets) return selectedBillingDetail.value
  return await billingPhase1Service.getById(billingId)
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

const exportSelectedEncounterTicketsPdf = async (): Promise<void> =>
  exportBillingEncounterTicketPack(selectedBillingRows.value.map(i => i.id), `Selected · ${selectedBillingRows.value.length} chosen`)

const exportFilteredEncounterTicketsPdf = async (): Promise<void> =>
  exportBillingEncounterTicketPack(filteredBillings.value.map(i => i.id), `Filtered · ${filteredBillings.value.length} shown`)

const resetTableFilters = (): void => {
  tableFilterQuery.value = ""; tableFilterBillingType.value = undefined; tableFilterPaymentType.value = undefined
  tableFilterStatus.value = undefined; tableFilterDateFrom.value = undefined; tableFilterDateTo.value = undefined
  tableFilterMinDue.value = null; tableFilterMaxDue.value = null; tableFilterOutstandingOnly.value = false
}

// ── Static options ────────────────────────────────────────────────────────────
const selfPayPaymentOptions = [
  {label: "Cash",     value: "Cash"},
  {label: "GCash",    value: "GCash"},
  {label: "E-wallet", value: "E-wallet"},
  {label: "Other",    value: "Other"},
]
const discountTypeOptions: Array<{label:string;value:DiscountType}> = [
  {label: "Percentage",    value: "PERCENTAGE"},
  {label: "Fixed Amount",  value: "FIXED"},
]
const isSelfPay = computed(() => form.value.billing_type === "SELF_PAY_SINGLE" || form.value.billing_type === "SELF_PAY_PACKAGE")

// ── Service lookups ───────────────────────────────────────────────────────────
const machines         = ref<BillingPickerLookup[]>([])
const techniques       = ref<BillingPickerLookup[]>([])
const evaluations      = ref<BillingPickerLookup[]>([])
const addOnMachines    = ref<BillingPickerLookup[]>([])
const addOnTechniques  = ref<BillingPickerLookup[]>([])
const addOnHomeServices= ref<BillingPickerLookup[]>([])

// ── HMO rate maps and ID filters ──────────────────────────────────────────────
const billingPatientHmoId               = ref<number|null>(null)
const billingPatientHmoInfo             = ref<PatientHMOInformation|null>(null)
const syncingBillingHmoRates            = ref(false)
const billingPatientMachineRateMap      = ref<Map<number,number>>(new Map())
const billingPatientTechniqueRateMap    = ref<Map<number,number>>(new Map())
const billingPatientEvaluationRateMap   = ref<Map<number,number>>(new Map())
const billingPatientAddOnMachineRateMap = ref<Map<number,number>>(new Map())
const billingPatientAddOnTechniqueRateMap     = ref<Map<number,number>>(new Map())
const billingPatientAddOnHomeServiceRateMap   = ref<Map<number,number>>(new Map())
const billingHmoMachineIds              = ref<Set<number>|null>(null)
const billingHmoTechniqueIds            = ref<Set<number>|null>(null)
const billingHmoEvaluationIds           = ref<Set<number>|null>(null)
const billingHmoAddOnMachineIds         = ref<Set<number>|null>(null)
const billingHmoAddOnTechniqueIds       = ref<Set<number>|null>(null)
const billingHmoAddOnHomeServiceIds     = ref<Set<number>|null>(null)

// ── Selected lines ────────────────────────────────────────────────────────────
type SelectedLine = {key:string;id:number|string;type:string;name:string;price:number;quantity:number;originalPrice?:number;priceOverride?:number;body_area?:string}
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

const filterByHmoIds = (items: BillingPickerLookup[], allowed: Set<number>|null): BillingPickerLookup[] => {
  if (form.value.billing_type !== "HMO_BILLING" || allowed === null) return items
  return items.filter(i => allowed.has(Number(i.id)))
}

const billingTypeOptions = [
  {label: "Self Pay: Single Service",  value: "SELF_PAY_SINGLE"},
  {label: "Self Pay: Package Service", value: "SELF_PAY_PACKAGE"},
  {label: "HMO",                       value: "HMO_BILLING"},
  {label: "LGU",                       value: "LGU_BILLING"},
]

const currentLineTypeOptions = computed(() => {
  const type = selectedLineType.value
  if (type === "machine")           return filterByHmoIds(machines.value,       billingHmoMachineIds.value)
  if (type === "technique")         return filterByHmoIds(techniques.value,      billingHmoTechniqueIds.value)
  if (type === "evaluation")        return filterByHmoIds(evaluations.value,     billingHmoEvaluationIds.value)
  if (type === "add-on-machine")    return [
    ...filterByHmoIds(addOnMachines.value,   billingHmoAddOnMachineIds.value).map(i => ({...i, type: "add-on-machine" as const})),
    ...filterByHmoIds(addOnTechniques.value, billingHmoAddOnTechniqueIds.value).map(i => ({...i, type: "add-on-technique" as const})),
  ]
  return filterByHmoIds(addOnHomeServices.value, billingHmoAddOnHomeServiceIds.value)
})

// ── Bundle creation from selection ───────────────────────────────────────────
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

// ── Form ──────────────────────────────────────────────────────────────────────
const form = ref<{
  patient_id?: number; appointment_id?: number; billing_type: BillingType; service_type: ServiceType
  service_name?: string; amount_paid: number; amount_tendered?: number; payment_type?: string
  senior_pwd_id_presented?: boolean; senior_pwd_id_reference?: string
}>({billing_type: "SELF_PAY_SINGLE", service_type: "SINGLE", amount_paid: 0, amount_tendered: 0, senior_pwd_id_presented: false})

// ── Currency & date helpers ───────────────────────────────────────────────────
const asCurrency       = (value: number) => Number(value ?? 0).toLocaleString("en-PH", {style: "currency", currency: "PHP"})
const formatFilterDate = (value?: Date): string|undefined => value ? new Date(value).toISOString().slice(0, 10) : undefined
const formatType       = (type: string): string => ({
  machine: "Machine", technique: "Technique", evaluation: "Evaluation",
  "add-on-machine": "Add-ons", "add-on-technique": "Add-ons", "add-on-home-service": "Add-on (Home Service)"
}[type] || type)

// ── Line mutation helpers ─────────────────────────────────────────────────────
const removeLine          = (key: string) => { selectedLines.value = selectedLines.value.filter(i => i.key !== key) }
const setLineQuantity     = (key: string, value: number|null|undefined) => {
  const qty = Math.max(1, Number(value ?? 1))
  selectedLines.value = selectedLines.value.map(i => i.key === key ? {...i, quantity: qty} : i)
}
const setLinePriceOverride  = (key: string, value: number|null|undefined) => {
  if (value == null) return
  selectedLines.value = selectedLines.value.map(i => i.key === key ? {...i, priceOverride: Math.max(0, Number(value))} : i)
}
const clearLinePriceOverride = (key: string) => { selectedLines.value = selectedLines.value.map(i => i.key === key ? {...i, priceOverride: undefined} : i) }
const setLineBodyArea       = (key: string, value: string) => { selectedLines.value = selectedLines.value.map(i => i.key === key ? {...i, body_area: value || undefined} : i) }

const addSelectedLine = (): void => {
  if (!selectedLineId.value) return
  const found = currentLineTypeOptions.value.find(i => String(i.id) === String(selectedLineId.value))
  if (!found) return
  selectedLines.value.push({key: crypto.randomUUID(), id: found.id, type: found.type ?? selectedLineType.value, name: found.name, price: Number(found.price ?? 0), quantity: Math.max(1, Number(selectedLineQty.value ?? 1))})
  selectedLineId.value = undefined; selectedLineQty.value = 1
}

const addSelectedPackageOffer = (): void => {
  if (!selectedPackageOfferId.value) return
  const found = activePackageOffers.value.find(i => i.id === selectedPackageOfferId.value)
  if (!found) return
  selectedLines.value.push({key: crypto.randomUUID(), id: found.id, type: "package", name: found.name, price: Number(found.packagePrice ?? 0), quantity: 1})
  selectedPackageOfferId.value = undefined
}

// ── Price resolution ──────────────────────────────────────────────────────────
const resolveNaturalLinePrice = (line: SelectedLine): number => {
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
  line.priceOverride != null ? Number(line.priceOverride) : resolveNaturalLinePrice(line)
const resolveBillingLineOriginalPrice  = (line: SelectedLine): number => Number(line.originalPrice ?? line.price ?? 0)

// ── HMO rate sync ─────────────────────────────────────────────────────────────
const syncBillingPatientHmoRates = async (): Promise<void> => {
  // Reset all HMO state
  billingPatientHmoId.value = null; billingPatientHmoInfo.value = null
  billingPatientMachineRateMap.value = new Map(); billingPatientTechniqueRateMap.value = new Map()
  billingPatientEvaluationRateMap.value = new Map(); billingPatientAddOnMachineRateMap.value = new Map()
  billingPatientAddOnTechniqueRateMap.value = new Map(); billingPatientAddOnHomeServiceRateMap.value = new Map()
  billingHmoMachineIds.value = null; billingHmoTechniqueIds.value = null; billingHmoEvaluationIds.value = null
  billingHmoAddOnMachineIds.value = null; billingHmoAddOnTechniqueIds.value = null; billingHmoAddOnHomeServiceIds.value = null

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

    const buildMap = (rates: Array<{id_field: number; rate: number}>, idField: string): {map: Map<number,number>; ids: Set<number>} => {
      const map = new Map<number,number>(); const ids = new Set<number>()
      for (const r of rates ?? []) {
        const id = Number((r as Record<string,unknown>)[idField]); const price = Number(r.rate)
        if (Number.isFinite(id) && id > 0 && Number.isFinite(price) && price >= 0) { map.set(id, price); ids.add(id) }
      }
      return {map, ids}
    }

    const machines   = buildMap(machineRates   as never, "machine_id")
    const techniques = buildMap(techniqueRates  as never, "technique_id")
    const evals      = buildMap(evaluationRates as never, "evaluation_id")
    billingPatientMachineRateMap.value    = machines.map;   billingHmoMachineIds.value    = machines.ids
    billingPatientTechniqueRateMap.value  = techniques.map; billingHmoTechniqueIds.value  = techniques.ids
    billingPatientEvaluationRateMap.value = evals.map;      billingHmoEvaluationIds.value = evals.ids

    const addOnMachineMap = new Map<number,number>(); const addOnMachineIds = new Set<number>()
    const addOnTechniqueMap = new Map<number,number>(); const addOnTechniqueIds = new Set<number>()
    const addOnHomeServiceMap = new Map<number,number>(); const addOnHomeServiceIds = new Set<number>()
    for (const r of addOnRates ?? []) {
      const price = Number(r.rate); if (!Number.isFinite(price) || price < 0) continue
      if (r.add_on_type === "ADD_ON_MACHINE"       && r.add_on_machine_id != null)      { const id = Number(r.add_on_machine_id);      if (id > 0) { addOnMachineMap.set(id, price);      addOnMachineIds.add(id) } }
      else if (r.add_on_type === "ADD_ON_TECHNIQUE" && r.add_on_technique_id != null)   { const id = Number(r.add_on_technique_id);    if (id > 0) { addOnTechniqueMap.set(id, price);    addOnTechniqueIds.add(id) } }
      else if (r.add_on_type === "ADD_ON_HOME_SERVICE" && r.add_on_home_service_id != null) { const id = Number(r.add_on_home_service_id); if (id > 0) { addOnHomeServiceMap.set(id, price); addOnHomeServiceIds.add(id) } }
    }
    billingPatientAddOnMachineRateMap.value       = addOnMachineMap;      billingHmoAddOnMachineIds.value       = addOnMachineIds
    billingPatientAddOnTechniqueRateMap.value      = addOnTechniqueMap;    billingHmoAddOnTechniqueIds.value      = addOnTechniqueIds
    billingPatientAddOnHomeServiceRateMap.value    = addOnHomeServiceMap;  billingHmoAddOnHomeServiceIds.value    = addOnHomeServiceIds
  } finally { syncingBillingHmoRates.value = false }
}

// ── Line items payload ────────────────────────────────────────────────────────
const lineItemsAsPayload = computed((): BillingLineItem[] =>
  selectedLines.value.map(item => {
    const effectivePrice = resolveEffectiveBillingLinePrice(item)
    const naturalPrice   = resolveNaturalLinePrice(item)
    const cataloguePrice = Number(item.price ?? 0)
    let originalPrice: number|undefined
    if (item.priceOverride != null && effectivePrice !== naturalPrice) originalPrice = naturalPrice
    else if (item.originalPrice != null) originalPrice = Number(item.originalPrice)
    else if (naturalPrice !== cataloguePrice) originalPrice = cataloguePrice
    return {
      id: item.id, type: item.type as BillingLineItem["type"], name: item.name,
      price: effectivePrice, quantity: Number(item.quantity ?? 1),
      originalPrice, body_area: item.body_area || undefined
    }
  })
)

const originalSubtotalFromLines = computed(() =>
  selectedLines.value.reduce((s, l) => s + Number(l.originalPrice ?? l.price ?? 0) * Number(l.quantity ?? 1), 0)
)
const subtotalFromLines = computed(() =>
  lineItemsAsPayload.value.reduce((s, l) => s + l.price * l.quantity, 0)
)

// ── Senior/PWD discount logic ─────────────────────────────────────────────────
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
  selectedLines.value.map(l => ({key: l.key, label: `${l.name} — ${asCurrency(resolveEffectiveBillingLinePrice(l) * Number(l.quantity ?? 1))}`}))
)

// ── POS summary ───────────────────────────────────────────────────────────────
const posSummary = computed(() => {
  const originalSubtotal = Number(originalSubtotalFromLines.value)
  const subtotal         = Number(subtotalFromLines.value)
  const targetLine       = seniorDiscountEffectiveTargetKey.value
    ? selectedLines.value.find(l => l.key === seniorDiscountEffectiveTargetKey.value) : null
  const targetLineSubtotal   = targetLine ? resolveEffectiveBillingLinePrice(targetLine) * Number(targetLine.quantity ?? 1) : 0
  const seniorDiscountAmount = form.value.senior_pwd_id_presented && targetLine ? Math.max(0, targetLineSubtotal * 0.2) : 0
  const remainingAfterSenior = Math.max(0, subtotal - seniorDiscountAmount)
  const customDiscountAmount = manualDiscountEnabled.value
    ? manualDiscountType.value === "PERCENTAGE"
      ? Math.max(0, remainingAfterSenior * (Number(manualDiscountValue.value ?? 0) / 100))
      : Math.max(0, Number(manualDiscountValue.value ?? 0))
    : 0
  const discountAmount = Math.min(subtotal, seniorDiscountAmount + customDiscountAmount)
  const vatableAmount  = Math.max(0, subtotal - discountAmount)
  const vatAmount      = vatEnabled.value ? Math.round(vatableAmount * VAT_RATE * 100) / 100 : 0
  const totalDue       = Math.max(0, vatableAmount + vatAmount)
  const tendered       = Number(form.value.amount_tendered ?? 0)
  const changeAmount   = Math.max(0, tendered - totalDue)
  // Derive amount_paid from tendered, capped at total due
  const amountPaid     = Math.min(totalDue, tendered)
  return {originalSubtotal, subtotal, discountAmount, vatableAmount, vatAmount, totalDue, changeAmount, seniorDiscountAmount, customDiscountAmount, amountPaid}
})

// ── LGU budget helpers ────────────────────────────────────────────────────────
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
const lguWillExceedRemainingFund = computed(() =>
  lguProjectedRemainingAfterSave.value != null && lguProjectedRemainingAfterSave.value < 0
)

// ── Service lookup fetchers ───────────────────────────────────────────────────
const fetchLookup = async (path: string): Promise<BillingPickerLookup[]> => {
  const {data} = await pamsAPI.get<Pageable<OfferLookupDTO>>(path, {params: {page: 1, size: 500, status: Status.ACTIVE}})
  return (data?.content ?? []).map(i => ({id: i.id, name: i.name, price: Number(i.price ?? 0)}))
}
const fetchSessionLookup = async (): Promise<BillingPickerLookup[]> => {
  const {data} = await pamsAPI.get<Pageable<BillingPickerLookup>>("/sessions/lookup", {params: {page: 1, size: 500, status: Status.ACTIVE}})
  return data?.content ?? []
}
const getSharedEvaluationLookups = (): BillingPickerLookup[] =>
  readActivePromosServiceCatalog().filter(i => i.type === "evaluation").map(i => ({id: i.id, name: i.name, price: Number(i.price ?? 0), type: "evaluation"}))

const loadLookups = async (): Promise<void> => {
  const [machinesRes, techniquesRes, addOnMachinesRes, addOnTechniquesRes, addOnHomeRes, sessionsRes] = await Promise.all([
    fetchLookup("/machines/lookup"), fetchLookup("/techniques/lookup"),
    fetchLookup("/add-on-machines/lookup"), fetchLookup("/add-on-techniques/lookup"),
    fetchLookup("/add-on-home-services/lookup"), fetchSessionLookup()
  ])
  await loadPatientOptions()
  machines.value = machinesRes; techniques.value = techniquesRes; evaluations.value = getSharedEvaluationLookups()
  addOnMachines.value = addOnMachinesRes; addOnTechniques.value = addOnTechniquesRes
  addOnHomeServices.value = addOnHomeRes; sessionServices.value = sessionsRes
  loadLocalData()
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
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Could not load billings. Check filters and click Refresh.")) }
  finally { isLoading.value = false }
}

const refreshLguBudgetSummary = async (): Promise<void> => {
  if (form.value.billing_type !== "LGU_BILLING" || !form.value.patient_id) {
    activeLguBudgetSummary.value = null; lguBudgetSummaryError.value = ""; return
  }
  loadingLguBudgetSummary.value = true
  try {
    activeLguBudgetSummary.value = await billingPhase1Service.getLguBudgetSummary(form.value.patient_id, form.value.appointment_id) ?? null
    lguBudgetSummaryError.value = ""
  } catch (e) { activeLguBudgetSummary.value = null; lguBudgetSummaryError.value = extractApiErrorMessage(e, "Failed to load LGU fund summary") }
  finally { loadingLguBudgetSummary.value = false }
}

// ── Form reset ────────────────────────────────────────────────────────────────
const resetBillingForm = (): void => {
  posExpanded.value = false
  editingBillingId.value = undefined; editingBillingStatus.value = undefined; selectedLines.value = []
  editBillingPaymentLog.value = []
  selectedLineType.value = "machine"; selectedLineId.value = undefined; selectedLineQty.value = 1
  selectedPackageOfferId.value = undefined; activeLguBudgetSummary.value = null
  loadingLguBudgetSummary.value = false; lguBudgetSummaryError.value = ""
  manualDiscountEnabled.value = false; manualDiscountType.value = "PERCENTAGE"
  manualDiscountValue.value = 0; manualDiscountReason.value = ""; seniorDiscountTargetKey.value = null
  createBundleDialogVisible.value = false; createBundleName.value = ""; createBundleDiscountedPrice.value = 0
  form.value = {billing_type: "SELF_PAY_SINGLE", service_type: "SINGLE", amount_paid: 0, amount_tendered: 0, payment_type: undefined, senior_pwd_id_presented: false}
}

// ── Copy from last session ────────────────────────────────────────────────────
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
    const detail = await billingPhase1Service.getById(billingId)
    if (!detail) { errorToast(toast, "Previous billing found but details could not be loaded"); return }
    let lines = parseBillingLines(detail.line_items_json)
    if (form.value.billing_type === "HMO_BILLING") lines = lines.filter(l => l.type !== "bundle" && l.type !== "package")
    if (!lines.length) { errorToast(toast, "Previous billing had no line items to copy"); return }
    selectedLines.value = lines
    successToast(toast, `Copied ${lines.length} item${lines.length === 1 ? "" : "s"} from last session (${detail.created_at})`)
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Could not copy from last session")) }
  finally { copyingFromLastSession.value = false }
}

// ── Bundle creation ───────────────────────────────────────────────────────────
const openCreateBundleFromSelection = (): void => {
  createBundleName.value = form.value.service_name?.trim() || `Custom Bundle ${new Date().toLocaleDateString("en-PH")}`
  createBundleDiscountedPrice.value = selectionOriginalTotal.value
  createBundleDialogVisible.value = true
}

const saveBundleFromSelection = (): void => {
  if (!canCreateBundleFromSelection.value) { errorToast(toast, "Selected items cannot be saved as a new bundle"); return }
  const bundleName = createBundleName.value.trim()
  if (!bundleName) { errorToast(toast, "Bundle name is required"); return }
  const discountedPrice = Number(createBundleDiscountedPrice.value ?? 0)
  if (discountedPrice < 0) { errorToast(toast, "Bundled price must be 0 or greater"); return }
  const parts = buildBundlePartsFromSelection()
  const newBundle: LocalBundle = {id: `bundle-${Date.now()}`, name: bundleName, ...parts, bundledPrice: discountedPrice, status: "Active"}
  localBundles.value = [...localBundles.value, newBundle]
  localStorage.setItem("bundledServices", JSON.stringify(localBundles.value))
  selectedLines.value = [{key: crypto.randomUUID(), id: newBundle.id, type: "bundle", name: newBundle.name, price: newBundle.bundledPrice, quantity: 1, originalPrice: selectionOriginalTotal.value}]
  form.value.service_name = newBundle.name
  createBundleDialogVisible.value = false
  successToast(toast, "Bundle created and applied to this billing")
}

// ── Create / Update billing ───────────────────────────────────────────────────
const createBilling = async (): Promise<void> => {
  if (!form.value.patient_id)        { errorToast(toast, "Patient is required"); return }
  if (!selectedLines.value.length)   { errorToast(toast, "Add at least one service"); return }
  if (lguWillExceedRemainingFund.value) { errorToast(toast, "LGU fund exceeded — cannot save until budget is increased"); return }

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
    amount_tendered: form.value.amount_tendered,
    change_amount: summary.changeAmount,
    senior_pwd_id_presented: !!form.value.senior_pwd_id_presented,
    senior_pwd_id_reference: form.value.senior_pwd_id_reference?.trim() || undefined,
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
      errorToast(toast, "Paid billings are locked and cannot be updated")
      return
    }
    if (editedBillingId) {
      const currentDetail = await billingPhase1Service.getById(editedBillingId)
      if (!currentDetail) { errorToast(toast, "Billing record could not be reloaded for security check"); return }
      if (isBillingStatusPaid(currentDetail.billing_status)) {
        errorToast(toast, "Paid billings are locked and can no longer be edited")
        return
      }
      await billingPhase1Service.update(editedBillingId, payload)
      successToast(toast, "Billing updated")
    } else {
      await billingPhase1Service.save(payload)
      successToast(toast, "Billing created")
    }
    await fetchBillings()
    if (editedBillingId && billingEditDrawerVisible.value) {
      const refreshed = await billingPhase1Service.getById(editedBillingId)
      if (refreshed) { selectedBillingDetail.value = refreshed; billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshed); billingTenderAmount.value = 0 }
      billingEditDrawerVisible.value = false
    }
    resetBillingForm()
    await refreshLguBudgetSummary()
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Failed to save billing")) }
}

// ── Load for edit ─────────────────────────────────────────────────────────────
const loadBillingForEdit = async (billingId: number): Promise<void> => {
  const [detail, log] = await Promise.all([
    billingPhase1Service.getById(billingId),
    billingPhase1Service.getPaymentLog(billingId).catch(() => [] as BillingPaymentLogEntry[])
  ])
  if (!detail) return
  editingBillingId.value = detail.id
  editingBillingStatus.value = detail.billing_status
  editBillingPaymentLog.value = log
  form.value = {
    patient_id: detail.patient_id, appointment_id: detail.appointment_id,
    billing_type: normalizeBillingType(detail.billing_type), service_type: normalizeServiceType(detail.service_type),
    service_name: detail.service_name,
    amount_paid: Number(detail.amount_paid ?? 0), amount_tendered: Number(detail.amount_tendered ?? 0),
    payment_type: detail.payment_reference ?? (detail.billing_type === "HMO_BILLING" ? "HMO" : detail.billing_type === "LGU_BILLING" ? "LGU" : undefined),
    senior_pwd_id_presented: !!detail.senior_pwd_id_presented,
    senior_pwd_id_reference: detail.senior_pwd_id_reference
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
  // Preserve existing VAT fields as-is when updating metadata fields
  vat_enabled: detail.vat_enabled, vat_rate: detail.vat_rate,
  vatable_amount: detail.vatable_amount, vat_amount: detail.vat_amount,
  ...overrides
})

const getReceiptDisplayNumber = (detail: BillingListItem): string => detail.receipt_number?.trim() || `BILL-${detail.id}`

// ── Open billing details ──────────────────────────────────────────────────────
const openBillingDetails = async (billingId: number): Promise<void> => {
  const [detail, log] = await Promise.all([
    billingPhase1Service.getById(billingId),
    billingPhase1Service.getPaymentLog(billingId).catch(() => [] as BillingPaymentLogEntry[])
  ])
  if (!detail) { errorToast(toast, "Billing details could not be loaded. Refresh and try again."); return }
  selectedBillingDetail.value = detail
  selectedBillingPaymentLog.value = log
  billingDetailPaymentType.value = getDefaultBillingPaymentType(detail)
  billingTenderReferenceNo.value = ""; billingTenderAmount.value = 0
  billingDetailsVisible.value = true
}

// ── Print receipt ─────────────────────────────────────────────────────────────
const printSelectedBillingReceipt = (): void => {
  if (!selectedBillingDetail.value) return
  const detail = selectedBillingDetail.value
  const normalizedBillingType = normalizeBillingTypeValue(detail.billing_type)
  const popup = openBillingReceiptWindow(getReceiptDisplayNumber(detail))

  try {
    if (normalizedBillingType === "SELF_PAY_SINGLE") {
      renderSingleServiceInvoiceWindow(popup, {
        billingDate: detail.created_at, referenceNumber: getReceiptDisplayNumber(detail),
        patientName: detail.patient_name || `Patient ${detail.patient_public_id || detail.patient_id}`,
        patientAddress: detail.patient_address, patientAge: detail.patient_age, patientGender: detail.patient_gender,
        physicalTherapist: detail.physical_therapist, doctor: detail.doctor,
        paymentMethod: derivePaymentType(detail) || "Cash/Card/Online Transfer",
        paymentReferenceNo: detail.payment_reference || detail.receipt_number,
        subtotal: Number(detail.subtotal_amount ?? detail.amount_due ?? detail.total_amount ?? 0),
        discount: Number(detail.discount_amount ?? 0), grandTotal: selectedBillingTotalDue.value,
        lines: selectedBillingReceiptLines.value.map(l => ({name: l.name, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal}))
      }, {title: "Single Service Invoice", fileName: getReceiptDisplayNumber(detail)}); return
    }

    if (normalizedBillingType === "SELF_PAY_PACKAGE") {
      renderPackageServiceInvoiceWindow(popup, {
        billingDate: detail.created_at, referenceNumber: getReceiptDisplayNumber(detail),
        patientName: detail.patient_name || `Patient ${detail.patient_public_id || detail.patient_id}`,
        patientAddress: detail.patient_address, patientAge: detail.patient_age, patientGender: detail.patient_gender,
        physicalTherapist: detail.physical_therapist, doctor: detail.doctor,
        paymentMethod: derivePaymentType(detail) || "Cash/Card/Online Transfer",
        paymentReferenceNo: detail.payment_reference || detail.receipt_number,
        subtotal: Number(detail.subtotal_amount ?? detail.amount_due ?? detail.total_amount ?? 0),
        discount: Number(detail.discount_amount ?? 0), grandTotal: selectedBillingTotalDue.value,
        lines: selectedBillingReceiptLines.value.map(l => {
          const subItems = (l.breakdownGroups ?? []).flatMap(g => g.items.map(i => ({name: i.name, quantity: i.quantity})))
          return {name: l.name, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal, subItems}
        })
      }, {title: "Package Service Invoice", fileName: getReceiptDisplayNumber(detail)}); return
    }

    if (normalizedBillingType === "HMO_BILLING") {
      const rawLines = (() => { try { return JSON.parse(detail.line_items_json || "[]") as Array<Record<string,unknown>> } catch { return [] } })()
      renderHmoInvoiceWindow(popup, {
        billingDate: detail.created_at, referenceNumber: getReceiptDisplayNumber(detail),
        patientName: detail.patient_name || `Patient ${detail.patient_public_id || detail.patient_id}`,
        patientAddress: detail.patient_address, patientAge: detail.patient_age, patientGender: detail.patient_gender,
        physicalTherapist: detail.physical_therapist, doctor: detail.doctor,
        hmoName: detail.hmo_name, hmoTypeName: detail.hmo_type_name, hmoCompanyName: detail.hmo_company_name,
        hmoApprovalCode: detail.hmo_approval_code, hmoValidityStart: detail.hmo_validity_start, hmoValidityEnd: detail.hmo_validity_end,
        subtotal: Number(detail.subtotal_amount ?? detail.amount_due ?? detail.total_amount ?? 0),
        discount: Number(detail.discount_amount ?? 0), grandTotal: selectedBillingTotalDue.value,
        lines: selectedBillingReceiptLines.value.map((l, idx) => ({
          name: l.name, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal,
          treatmentDate: detail.created_at, laterality: String(rawLines[idx]?.laterality ?? ""), bodyArea: String(rawLines[idx]?.body_area ?? "")
        }))
      }, {title: "HMO Invoice", fileName: getReceiptDisplayNumber(detail)}); return
    }

    if (normalizedBillingType === "LGU_BILLING") {
      const lockedTickets = (detail.encounter_tickets ?? []).filter(t => t.record_locked)
      const sessionSeqLabel = lockedTickets[0]?.billing_snapshot?.session_sequence_label ?? undefined
      renderLguInvoiceWindow(popup, {
        billingDate: detail.created_at, referenceNumber: getReceiptDisplayNumber(detail),
        patientName: detail.patient_name || `Patient ${detail.patient_public_id || detail.patient_id}`,
        patientAddress: detail.patient_address, patientAge: detail.patient_age, patientGender: detail.patient_gender,
        physicalTherapist: detail.physical_therapist, doctor: detail.doctor,
        lguProgramName: detail.lgu_program_name, lguReferenceLabel: detail.lgu_reference_label, lguDateIssued: detail.lgu_date_issued,
        subtotal: Number(detail.subtotal_amount ?? detail.amount_due ?? detail.total_amount ?? 0),
        discount: Number(detail.discount_amount ?? 0), grandTotal: selectedBillingTotalDue.value,
        lines: selectedBillingReceiptLines.value.map(l => {
          const subItems = (l.breakdownGroups ?? []).flatMap(g => g.items.map(i => ({name: i.name, quantity: i.quantity})))
          return {name: l.name, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.lineTotal, treatmentDate: detail.created_at, sessionSequence: sessionSeqLabel, subItems}
        })
      }, {title: "LGU Invoice", fileName: getReceiptDisplayNumber(detail)}); return
    }

    // Fallback generic receipt
    renderBillingReceiptWindow(popup, {
      receiptNumber: getReceiptDisplayNumber(detail), billingId: detail.public_id || detail.id,
      patientRecordId: detail.patient_public_id, patientName: detail.patient_name || `Patient ${detail.patient_public_id || detail.patient_id}`,
      appointmentId: detail.appointment_public_id || detail.appointment_id, createdAt: detail.created_at,
      billingType: displayBillingType(detail.billing_type), paymentType: derivePaymentType(detail) || detail.payment_reference,
      serviceLabel: detail.service_name, receiptMode: "standard",
      subtotal: Number(detail.subtotal_amount ?? detail.amount_due ?? detail.total_amount ?? 0),
      discount: Number(detail.discount_amount ?? 0), totalDue: selectedBillingTotalDue.value,
      amountPaid: selectedBillingAmountPaid.value, outstanding: selectedBillingOutstanding.value,
      changeAmount: Number(detail.change_amount ?? 0), lines: selectedBillingReceiptLines.value
    }, {title: "Billing Receipt Copy", fileName: getReceiptDisplayNumber(detail)})
  } catch (e) { popup.close(); errorToast(toast, extractApiErrorMessage(e, "Failed to print receipt")) }
}

const canPrintPatientInvoiceCopy = computed<boolean>(() => {
  if (!selectedBillingDetail.value) return false
  const normalizedBillingType = normalizeBillingTypeValue(selectedBillingDetail.value.billing_type)
  return normalizedBillingType === "HMO_BILLING" || normalizedBillingType === "LGU_BILLING"
})

const printSelectedPatientInvoiceCopy = (): void => {
  if (!selectedBillingDetail.value) return

  const detail = selectedBillingDetail.value
  const normalizedBillingType = normalizeBillingTypeValue(detail.billing_type)
  if (normalizedBillingType !== "HMO_BILLING" && normalizedBillingType !== "LGU_BILLING") {
    errorToast(toast, "Patient statement without prices is available for LGU and HMO billings only")
    return
  }

  const popup = openBillingReceiptWindow(`${getReceiptDisplayNumber(detail)}-PATIENT-COPY`)

  try {
    const rawLines = (() => {
      try { return JSON.parse(detail.line_items_json || "[]") as Array<Record<string, unknown>> }
      catch { return [] }
    })()

    const lockedTickets = (detail.encounter_tickets ?? []).filter(ticket => ticket.record_locked)
    const sessionSeqLabel = lockedTickets[0]?.billing_snapshot?.session_sequence_label ?? undefined
    const sponsorName = normalizedBillingType === "HMO_BILLING" ? detail.hmo_name : detail.lgu_program_name
    const sponsorReference = normalizedBillingType === "HMO_BILLING"
      ? detail.hmo_approval_code
      : detail.lgu_reference_label

    renderPatientCopyInvoiceWindow(popup, {
      billingDate: detail.created_at,
      referenceNumber: getReceiptDisplayNumber(detail),
      patientName: detail.patient_name || `Patient ${detail.patient_public_id || detail.patient_id}`,
      patientAddress: detail.patient_address,
      patientAge: detail.patient_age,
      patientGender: detail.patient_gender,
      physicalTherapist: detail.physical_therapist,
      doctor: detail.doctor,
      diagnosis: detail.service_name || undefined,
      billingTypeLabel: normalizedBillingType === "HMO_BILLING" ? "HMO Billing" : "LGU Billing",
      sponsorName,
      sponsorReference,
      lines: selectedBillingReceiptLines.value.map((line, index) => ({
        name: line.name,
        quantity: line.quantity,
        treatmentDate: detail.created_at,
        sessionSequence: normalizedBillingType === "LGU_BILLING" ? sessionSeqLabel : undefined,
        laterality: String(rawLines[index]?.laterality ?? ""),
        bodyArea: String(rawLines[index]?.body_area ?? "")
      }))
    }, {
      title: "Patient Statement of Services",
      fileName: `${getReceiptDisplayNumber(detail)}-PATIENT-COPY`
    })
  } catch (e) {
    popup.close()
    errorToast(toast, extractApiErrorMessage(e, "Failed to print patient statement"))
  }
}

const openReceiptEditor = async (): Promise<void> => {
  if (!selectedBillingDetail.value || !canEditReceipt.value) return
  resetBillingForm()
  await loadBillingForEdit(selectedBillingDetail.value.id)
  billingEditDrawerVisible.value = true
}

// ── Save tender ────────────────────────────────────────────────────────────────
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
    const [refreshed, refreshedLog] = await Promise.all([
      billingPhase1Service.getById(detail.id),
      billingPhase1Service.getPaymentLog(detail.id).catch(() => [] as BillingPaymentLogEntry[])
    ])
    if (!refreshed) { errorToast(toast, "Payment saved, but detail could not be reloaded"); return }
    selectedBillingDetail.value = refreshed; selectedBillingPaymentLog.value = refreshedLog
    billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshed)
    billingTenderReferenceNo.value = ""; billingTenderAmount.value = 0
    await fetchBillings()
    successToast(toast, "Payment recorded")
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Failed to record payment")) }
  finally { savingBillingTender.value = false }
}

// ── Mark as billed ────────────────────────────────────────────────────────────
const markSelectedBillingAsBilled = async (): Promise<void> => {
  if (!selectedBillingDetail.value || !canMarkSelectedBillingAsBilled.value) return
  markingBillingAsBilled.value = true
  try {
    await billingPhase1Service.update(selectedBillingDetail.value.id, buildBillingUpdatePayload(selectedBillingDetail.value, {billing_status: "BILLED"}))
    const refreshed = await billingPhase1Service.getById(selectedBillingDetail.value.id)
    if (!refreshed) { errorToast(toast, "Marked as billed but detail could not be reloaded"); return }
    selectedBillingDetail.value = refreshed; billingDetailPaymentType.value = getDefaultBillingPaymentType(refreshed); billingTenderAmount.value = 0
    await fetchBillings()
    successToast(toast, "Transaction marked as billed")
  } catch (e) { errorToast(toast, extractApiErrorMessage(e, "Failed to mark as billed")) }
  finally { markingBillingAsBilled.value = false }
}

// ── Route context ─────────────────────────────────────────────────────────────
const applyRouteBillingContext = async (): Promise<void> => {
  const patientId    = parseRouteQueryId(route.query.patientId)
  const appointmentId= parseRouteQueryId(route.query.appointmentId)
  const billingId    = parseRouteQueryId(route.query.billingId)
  const openMode     = getRouteQueryValue(route.query.openMode)
  overlayEntryMode.value = openMode === "tender" ? "tender" : openMode === "edit" ? "edit" : "detail"
  if (!patientId && !appointmentId && !billingId) return
  resetBillingForm(); selectedBillingDetail.value = undefined; billingDetailsVisible.value = false
  if (patientId)     form.value.patient_id    = patientId
  if (appointmentId) form.value.appointment_id = appointmentId
  if (billingId) {
    if (props.initialView === "detail" || openMode === "detail" || openMode === "tender") {
      overlayActivated.value = props.overlayOnly
      await openBillingDetails(billingId)
    } else {
      overlayActivated.value = props.overlayOnly
      await loadBillingForEdit(billingId)
      billingEditDrawerVisible.value = true
      await syncBillingPatientHmoRates()
    }
  }
}

// ── Type normalisation ────────────────────────────────────────────────────────
const normalizeBillingType  = (value: string): BillingType  => normalizeBillingTypeValue(value) ?? "ALA_CARTE"
const normalizeServiceType  = (value: string): ServiceType  => {
  const n = value.trim().toLowerCase()
  if (n === "package") return "PACKAGE"; if (n === "hmo") return "HMO"; if (n === "lgu") return "LGU"
  return "SINGLE"
}
const parseBillingLines = (raw?: string): SelectedLine[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as Array<{id?:string|number;type?:string;name?:string;price?:number;quantity?:number;originalPrice?:number;body_area?:string}>
    if (!Array.isArray(parsed)) return []
    return parsed.map(l => ({
      key: crypto.randomUUID(), id: l.id ?? "", type: l.type ?? "service", name: l.name ?? "—",
      price: Number(l.price ?? 0), quantity: Math.max(1, Number(l.quantity ?? 1)),
      originalPrice: l.originalPrice ? Number(l.originalPrice) : undefined, body_area: l.body_area || undefined
    }))
  } catch { return [] }
}

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(() => form.value.billing_type, (value) => {
  const serviceTypeMap: Record<BillingType, ServiceType> = {
    SELF_PAY_SINGLE: "SINGLE", SELF_PAY_PACKAGE: "PACKAGE", HMO_BILLING: "HMO", LGU_BILLING: "LGU",
    INDIVIDUAL_PRICING: "SINGLE", PACKAGE_BILLING: "PACKAGE", ALA_CARTE: "SINGLE",
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

// ── Mount ─────────────────────────────────────────────────────────────────────
onMounted(async () => {
  syncRoleFromStorage()
  await loadLookups()
  await fetchBillings()
  await applyRouteBillingContext()
})

watch(selectedClinicId, () => { void fetchBillings() })
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
