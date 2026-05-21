<template>
  <section class="app-section-card-comfy space-y-3">
    <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">Manager LGU Dashboard{{ selectedProgramName ? ` — ${selectedProgramName}` : '' }}</h3>
        <p class="text-xs opacity-70">Select an LGU program and set the monthly budget. Each program and month is tracked independently.</p>
      </div>
      <Tag :value="canManageLguDashboard ? 'Manager Access' : 'Read-only'" :severity="canManageLguDashboard ? 'success' : 'secondary'" />
    </div>

    <Message v-if="!canManageLguDashboard" severity="warn" :closable="false" size="small">
      Budget controls are available to Manager/Operations leadership roles. Totals remain visible.
    </Message>

    <Message v-if="budgetSyncError" severity="warn" :closable="false" size="small">
      {{ budgetSyncError }}
    </Message>
    <Message v-else-if="loadingDashboardBudget" severity="secondary" :closable="false" size="small">
      Loading live LGU budget for {{ budgetMonthLabel }}...
    </Message>
    <Message v-else-if="hasLocalOnlyBudgetDraft" severity="warn" :closable="false" size="small">
      This budget was only saved in this browser before. Click <strong>Save Budget</strong> to publish it to appointments and LGU billing for {{ budgetMonthLabel }}.
    </Message>
    <Message v-else-if="lguDashboardBudget" severity="info" :closable="false" size="small">
      Live LGU budget is open for {{ budgetMonthLabel }}. Used so far: <strong>{{ asCurrency(usedLguFund) }}</strong>.
    </Message>
    <Message v-else severity="secondary" :closable="false" size="small">
      No live LGU budget is open for {{ budgetMonthLabel }} yet. Save this month’s budget here to make LGU appointments billable.
    </Message>

    <Message v-if="isFutureBudgetMonth" severity="info" :closable="false" size="small">
      You are preparing the LGU budget for {{ budgetMonthLabel }} in advance. This stays separate from {{ currentMonthLabel }} and will not add into the current month fund.
    </Message>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
      <div class="flex flex-col gap-1">
        <IftaLabel>
          <Select
            v-model="selectedProgramId"
            :options="lguProgramOptions"
            optionLabel="label"
            optionValue="id"
            placeholder="Select LGU Program"
            :loading="loadingPrograms"
            :disabled="savingDashboardBudget"
            fluid
          />
          <label>LGU</label>
        </IftaLabel>
        <div class="flex items-center gap-2">
          <InputText
            v-if="showNewProgramInput"
            v-model="newProgramName"
            placeholder="e.g. Gapan"
            size="small"
            fluid
            @keyup.enter="createNewProgram"
          />
          <Button
            v-if="showNewProgramInput"
            icon="pi pi-check"
            size="small"
            :loading="creatingProgram"
            :disabled="!newProgramName.trim()"
            @click="createNewProgram"
          />
          <Button
            :label="showNewProgramInput ? 'Cancel' : 'Add LGU'"
            :icon="showNewProgramInput ? 'pi pi-times' : 'pi pi-plus'"
            size="small"
            :severity="showNewProgramInput ? 'secondary' : 'info'"
            text
            :disabled="!canManageLguDashboard"
            @click="showNewProgramInput = !showNewProgramInput; newProgramName = ''"
          />
        </div>
      </div>

      <IftaLabel>
        <DatePicker
          v-model="selectedBudgetMonthDate"
          view="month"
          dateFormat="MM yy"
          :manualInput="false"
          showIcon
          fluid
          :minDate="currentMonthStart"
          :disabled="savingDashboardBudget"
        />
        <label>Budget Month</label>
      </IftaLabel>

      <IftaLabel>
        <InputNumber
          v-model="baseMonthlyBudget"
          :disabled="!canManageLguDashboard || savingDashboardBudget"
          :min="0"
          mode="currency"
          currency="PHP"
          locale="en-PH"
          fluid
        />
        <label>Base Monthly Budget</label>
      </IftaLabel>

      <IftaLabel>
        <InputNumber
          v-model="rolloverInput"
          :disabled="!canManageLguDashboard || savingDashboardBudget"
          :min="0"
          mode="currency"
          currency="PHP"
          locale="en-PH"
          fluid
        />
        <label>Rollover Amount to Add</label>
      </IftaLabel>

      <div class="flex flex-wrap items-end gap-2">
        <Button
          label="Refresh Budget"
          icon="pi pi-refresh"
          outlined
          :loading="refreshingDashboardBudget"
          :disabled="loadingDashboardBudget || loadingTransactionHistory || savingDashboardBudget"
          @click="refreshDashboardBudget"
        />
        <Button
          label="Add Rollover"
          icon="pi pi-plus"
          outlined
          :disabled="!canManageLguDashboard || savingDashboardBudget"
          @click="addRolloverAmount"
        />
        <Button
          label="Save Budget"
          icon="pi pi-save"
          :disabled="!canManageLguDashboard || loadingDashboardBudget || savingDashboardBudget"
          :loading="savingDashboardBudget"
          @click="saveDashboardBudget"
        />
      </div>

      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3 space-y-1">
        <p class="text-xs opacity-70">Tracked Rollover Amount</p>
        <p class="text-base font-semibold">{{ asCurrency(rolloverAmount) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Total Available Fund</p>
        <p class="text-lg font-semibold">{{ asCurrency(totalAvailableFund) }}</p>
      </div>
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Used LGU Fund</p>
        <p class="text-lg font-semibold">{{ asCurrency(usedLguFund) }}</p>
      </div>
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Pending Used LGU Fund</p>
        <p class="text-lg font-semibold text-amber-600">{{ asCurrency(pendingUsedLguFund) }}</p>
      </div>
      <div class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3">
        <p class="text-xs opacity-70">Remaining Available Fund</p>
        <p class="text-lg font-semibold" :class="remainingAvailableFund < 0 ? 'text-red-600' : ''">{{ asCurrency(remainingAvailableFund) }}</p>
      </div>
    </div>

    <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4 space-y-3">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="space-y-1">
          <h4 class="text-sm font-semibold">Recent LGU Transactions</h4>
          <p class="text-xs opacity-70">Shows the actual LGU ledger activity created by LGU billings, including deductions, reversals, and the running balance after each entry.</p>
        </div>
        <div class="flex items-center gap-2">
          <Tag :value="`${lguTransactionHistory.length} record${lguTransactionHistory.length === 1 ? '' : 's'}`" severity="contrast" />
          <Button
            label="Exports"
            icon="pi pi-arrow-up-right"
            outlined
            size="small"
            @click="exportsModalVisible = true"
          />
          <Button
            label="Refresh History"
            icon="pi pi-refresh"
            outlined
            size="small"
            :loading="loadingTransactionHistory"
            @click="loadTransactionHistory"
          />
        </div>
      </div>

      <Message v-if="transactionHistoryError" severity="warn" :closable="false" size="small">
        {{ transactionHistoryError }}
      </Message>

      <DataTable
        :value="lguTransactionHistory"
        :loading="loadingTransactionHistory"
        size="small"
        scrollable
        scrollHeight="320px"
        dataKey="id"
      >
        <template #empty>
          <div class="px-4 py-10 text-center text-sm opacity-60">
            No LGU ledger transactions have been recorded yet.
          </div>
        </template>

        <Column field="created_at" header="Created" style="width: 170px">
          <template #body="{ data }">
            <div class="text-sm">{{ formatDateTime(data.created_at) }}</div>
          </template>
        </Column>

        <Column header="Patient / Billing" style="min-width: 240px">
          <template #body="{ data }">
            <div class="space-y-1">
              <div class="font-medium">{{ data.patient_name || "No patient linked" }}</div>
              <div class="text-xs opacity-60">
                Billing {{ data.phase1_billing_public_id || "N/A" }}
                <span v-if="data.receipt_number"> · Receipt {{ data.receipt_number }}</span>
              </div>
              <div v-if="data.patient_public_id" class="text-xs opacity-60">Patient {{ data.patient_public_id }}</div>
              <div class="text-xs opacity-60">{{ data.service_name || data.reference_label || "LGU transaction" }}</div>
            </div>
          </template>
        </Column>

        <Column header="Action" style="width: 130px">
          <template #body="{ data }">
            <Button
              v-if="data.patient_id"
              label="View Details"
              icon="pi pi-external-link"
              size="small"
              outlined
              @click="openPatientDetail(data.patient_id)"
            />
            <span v-else class="text-xs opacity-60">N/A</span>
          </template>
        </Column>

        <Column header="Period" style="width: 120px">
          <template #body="{ data }">
            <div class="text-sm">{{ formatBudgetPeriod(data.period_year, data.period_month) }}</div>
            <div class="text-xs opacity-60">{{ data.program_name }}</div>
          </template>
        </Column>

        <Column header="Type / Status" style="width: 150px">
          <template #body="{ data }">
            <div class="flex flex-col gap-1">
              <Tag :value="formatEntryType(data.entry_type)" :severity="entryTypeSeverity(data.entry_type)" class="text-xs" />
              <Tag :value="data.usage_status" :severity="usageStatusSeverity(data.usage_status)" class="text-xs" />
            </div>
          </template>
        </Column>

        <Column header="Movement" style="width: 150px">
          <template #body="{ data }">
            <div class="space-y-1 text-right">
              <div v-if="Number(data.amount_out ?? 0) > 0" class="font-medium text-red-700">- {{ asCurrency(data.amount_out) }}</div>
              <div v-if="Number(data.amount_in ?? 0) > 0" class="font-medium text-emerald-700">+ {{ asCurrency(data.amount_in) }}</div>
              <div v-if="Number(data.amount_out ?? 0) <= 0 && Number(data.amount_in ?? 0) <= 0" class="font-medium">{{ asCurrency(0) }}</div>
            </div>
          </template>
        </Column>

        <Column header="Balance After" style="width: 150px">
          <template #body="{ data }">
            {{ asCurrency(data.balance_after ?? 0) }}
          </template>
        </Column>
      </DataTable>

      <Dialog v-model:visible="exportsModalVisible" header="LGU Exports" modal :style="{ width: '560px' }">
        <div class="space-y-4">

          <!-- Create SOA -->
          <div class="rounded-xl border border-[rgb(var(--app-border))] p-4 space-y-3">
            <div class="space-y-1">
              <h4 class="text-sm font-semibold">Create Statement of Account (SOA)</h4>
              <p class="text-xs opacity-70">Generate a printable SOA summarising LGU billing activity for the selected date range.</p>
            </div>
            <IftaLabel>
              <DatePicker v-model="soaRange" selectionMode="range" dateFormat="yy-mm-dd" :manualInput="false" showIcon fluid />
              <label>Date Range</label>
            </IftaLabel>
            <div class="flex justify-end">
              <Button label="Generate SOA" icon="pi pi-print" :disabled="!hasValidSoaRange" @click="generateSoa" />
            </div>
          </div>

          <!-- Export Encounter Tickets -->
          <div class="rounded-xl border border-[rgb(var(--app-border))] p-4 space-y-3">
            <div class="space-y-1">
              <h4 class="text-sm font-semibold">Export Bulk Encounter Tickets</h4>
              <p class="text-xs opacity-70">Export all locked encounter tickets from LGU billings created within the selected date range.</p>
            </div>
            <IftaLabel>
              <DatePicker v-model="bulkTicketRange" selectionMode="range" dateFormat="yy-mm-dd" :manualInput="false" showIcon fluid />
              <label>Date Range</label>
            </IftaLabel>
            <div class="flex justify-end">
              <Button
                label="Export PDF"
                icon="pi pi-download"
                :disabled="!hasValidBulkTicketRange"
                :loading="exportingBulkTickets"
                @click="exportBulkLguEncounterTickets"
              />
            </div>
          </div>

        </div>
        <template #footer>
          <Button label="Close" text @click="exportsModalVisible = false" />
        </template>
      </Dialog>
    </div>

    <!-- Patient LGU Credit Detail Dialog -->
    <Dialog
      v-model:visible="showPatientDetailDialog"
      modal
      :header="selectedPatientDetail ? `${selectedPatientDetail.patient_name} - LGU Credit Detail` : 'LGU Credit Detail'"
      style="width: min(92vw, 860px)"
      :pt="{ content: { class: 'space-y-4' } }"
    >
      <Message v-if="loadingPatientDetail" severity="secondary" :closable="false" size="small">
        Loading patient LGU credit details...
      </Message>
      <Message v-else-if="patientDetailError" severity="warn" :closable="false" size="small">
        {{ patientDetailError }}
      </Message>
      <template v-else-if="selectedPatientDetail">
        <div class="flex flex-wrap items-center gap-2">
          <Tag
            :value="formatLguStatus(selectedPatientDetail.package_availments[0]?.status ?? selectedPatientDetail.dropout_status ?? selectedPatientDetail.authorizations[0]?.authorization_status)"
            :severity="lguStatusSeverity(selectedPatientDetail.package_availments[0]?.status ?? selectedPatientDetail.dropout_status ?? selectedPatientDetail.authorizations[0]?.authorization_status)"
          />
          <span class="text-xs opacity-60">Patient ID: {{ selectedPatientDetail.patient_id }}</span>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-[rgb(var(--app-border))] pb-1">
            <div class="text-sm font-semibold">Appointments</div>
            <Button
              label="Create Claim"
              icon="pi pi-file"
              size="small"
              :loading="isCreatingClaims"
              :disabled="isCreatingClaims"
              @click="createClaimsForEligibleAppointments()"
            />
          </div>
          <div class="overflow-x-auto rounded-xl border border-[rgb(var(--app-border))]">
            <table class="min-w-full text-sm">
              <thead class="bg-black/5 text-left text-xs uppercase tracking-wide opacity-70 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 font-medium">Appointment</th>
                  <th class="px-3 py-2 font-medium">Date</th>
                  <th class="px-3 py-2 font-medium">Package</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(appointment, index) in selectedPatientDetail.appointments"
                  :key="appointment.appointment_id"
                  :class="[
                    'border-t border-[rgb(var(--app-border))]',
                    firstDroppedOutAppointmentId === appointment.appointment_id
                      ? 'bg-red-50/70 dark:bg-red-900/20'
                      : ''
                  ]"
                >
                  <td class="px-3 py-2">
                    <div class="text-xs font-semibold">Session {{ index + 1 }}</div>
                    <div class="font-mono text-[11px] opacity-60">APT-{{ appointment.appointment_id }}</div>
                  </td>
                  <td class="px-3 py-2 text-xs">{{ formatDateTime(appointment.appointment_date) }}</td>
                  <td class="px-3 py-2 text-xs">{{ appointment.package_name || '-' }}</td>
                  <td class="px-3 py-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <Tag
                        :value="formatLguStatus(appointment.status)"
                        :severity="lguStatusSeverity(appointment.status)"
                        class="text-xs"
                      />
                      <span
                        v-if="firstDroppedOutAppointmentId === appointment.appointment_id"
                        class="inline-flex rounded bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      >Dropout Starts Here</span>
                    </div>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!selectedPatientDetail.appointments.length" class="text-xs opacity-60">No appointments recorded yet.</div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-semibold border-b border-[rgb(var(--app-border))] pb-1">Package Availment</div>
          <div class="overflow-x-auto rounded-xl border border-[rgb(var(--app-border))]">
            <table class="min-w-full text-sm">
              <thead class="bg-black/5 text-left text-xs uppercase tracking-wide opacity-70 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 font-medium">Availed Package</th>
                  <th class="px-3 py-2 font-medium text-right">Total Purchased</th>
                  <th class="px-3 py-2 font-medium text-right">Used</th>
                  <th class="px-3 py-2 font-medium text-right">Balance</th>
                  <th class="px-3 py-2 font-medium">Expiry</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="pkg in selectedPatientDetail.package_availments"
                  :key="pkg.authorization_id"
                  class="border-t border-[rgb(var(--app-border))]"
                >
                  <td class="px-3 py-2">{{ pkg.package_name }}</td>
                  <td class="px-3 py-2 text-right">{{ pkg.availed_count }}</td>
                  <td class="px-3 py-2 text-right">{{ pkg.used_count }}</td>
                  <td class="px-3 py-2 text-right">{{ pkg.available_balance }}</td>
                  <td class="px-3 py-2 text-xs">{{ pkg.expiry_date || '-' }}</td>
                  <td class="px-3 py-2">
                    <Tag
                      :value="formatLguStatus(pkg.status)"
                      :severity="lguStatusSeverity(pkg.status)"
                      class="text-xs"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!selectedPatientDetail.package_availments.length" class="text-xs opacity-60">No package availment records yet.</div>
        </div>

        <div v-if="selectedPatientDetail.billings.length" class="space-y-2">
          <div class="text-sm font-semibold border-b border-[rgb(var(--app-border))] pb-1">Billing Summary</div>
          <div class="overflow-x-auto rounded-xl border border-[rgb(var(--app-border))]">
            <table class="min-w-full text-sm">
              <thead class="bg-black/5 text-left text-xs uppercase tracking-wide opacity-70 dark:bg-white/5">
                <tr>
                  <th class="px-3 py-2 font-medium">Reference</th>
                  <th class="px-3 py-2 font-medium">Service</th>
                  <th class="px-3 py-2 font-medium">Type</th>
                  <th class="px-3 py-2 font-medium text-right">Amount</th>
                  <th class="px-3 py-2 font-medium">Status</th>
                  <th class="px-3 py-2 font-medium">Date</th>
                  <th class="px-3 py-2 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="billing in selectedPatientDetail.billings"
                  :key="billing.id"
                  class="border-t border-[rgb(var(--app-border))]"
                >
                  <td class="px-3 py-2 font-mono text-xs">{{ billing.public_id }}</td>
                  <td class="px-3 py-2 text-xs">{{ billing.service_name || '-' }}</td>
                  <td class="px-3 py-2">
                    <span
                      v-if="billing.pricing_source === 'LGU_DROPOUT_INDIVIDUAL_CLAIM'"
                      class="inline-flex rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                    >Dropout Claim</span>
                    <span
                      v-else-if="billing.pricing_source === 'LGU_PACKAGE_MONTHLY_CLAIM'"
                      class="inline-flex rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >Monthly Claim</span>
                    <span v-else class="text-xs opacity-60">{{ billing.pricing_source || '-' }}</span>
                  </td>
                  <td class="px-3 py-2 text-right font-medium">{{ asCurrency(billing.amount_due) }}</td>
                  <td class="px-3 py-2">
                    <Tag
                      :value="billing.billing_status"
                      :severity="billing.billing_status === 'PAID' ? 'success' : billing.billing_status === 'BILLED' ? 'info' : billing.billing_status === 'VOID' ? 'danger' : 'secondary'"
                      class="text-xs"
                    />
                  </td>
                  <td class="px-3 py-2 text-xs opacity-60">{{ formatDateTime(billing.created_at) }}</td>
                  <td class="px-3 py-2">
                    <Button
                      label="PDF"
                      icon="pi pi-file-pdf"
                      size="small"
                      outlined
                      :loading="printingClaimBillingId === billing.id"
                      @click="downloadClaimPdf(billing.id)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="text-xs opacity-60">No LGU claim billings generated yet.</div>
      </template>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
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
import { useToast } from "primevue/usetoast"
import { useRouter } from "vue-router"
import {
  billingPhase1Service,
  type BillingListItem
} from "@/features/billing/api/billing-phase1.service"
import type { Pageable } from "@/models/paging"
import {
  lguBillingService,
  type LguDashboardBudget,
  type LguDashboardHistoryItem,
  type LguPatientCreditDetail,
  type LguProgramLookup
} from "@/features/lgu-billing/api/lgu-billing.service"
import { renderLguInvoiceWindow } from "@/features/lgu-billing/invoices/lgu-invoice.util"
import { pamsAPI } from "@/utils/axios-interceptor"
import { getApiErrorMessage } from "@/utils/actionable-error.util"
import { errorToast, successToast } from "@/utils/toast.util"
import {
  openEncounterTicketPdfWindow,
  renderEncounterTicketBulkPdfWindow,
  type EncounterTicketPdfCard
} from "@/utils/encounter-ticket-pdf.util"

type LocalLguBudgetDraft = {
  baseMonthlyBudget?: number
  rolloverAmount?: number
}

const toast = useToast()
const router = useRouter()
const currentRoleName = ref<string>("")
const lguPrograms = ref<LguProgramLookup[]>([])
const loadingPrograms = ref(false)
const selectedProgramId = ref<number | null>(null)
const showNewProgramInput = ref(false)
const newProgramName = ref("")
const creatingProgram = ref(false)
const baseMonthlyBudget = ref<number>(0)
const rolloverAmount = ref<number>(0)
const rolloverInput = ref<number>(0)
const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const selectedBudgetMonthDate = ref<Date>(new Date(currentMonthStart))
const lguDashboardBudget = ref<LguDashboardBudget | null>(null)
const loadingDashboardBudget = ref(false)
const savingDashboardBudget = ref(false)
const refreshingDashboardBudget = ref(false)
const hasLocalOnlyBudgetDraft = ref(false)
const budgetSyncError = ref("")
const lguTransactionHistory = ref<LguDashboardHistoryItem[]>([])
const loadingTransactionHistory = ref(false)
const transactionHistoryError = ref("")
const showPatientDetailDialog = ref(false)
const selectedPatientDetail = ref<LguPatientCreditDetail | null>(null)
const loadingPatientDetail = ref(false)
const patientDetailError = ref("")
const isCreatingClaims = ref(false)
const printingClaimBillingId = ref<number | null>(null)
const exportsModalVisible = ref(false)
const soaRange = ref<Date[] | null>(null)
const bulkTicketRange = ref<Date[] | null>(null)
const exportingBulkTickets = ref(false)

type LocalService = { id: string; type?: string; name: string; price?: number; status?: string }
type LocalBundle = {
  id: string
  name: string
  machineIds?: string[]
  techniqueIds?: string[]
  evaluationIds?: string[]
  addOnIds?: string[]
}
type LguInvoiceSubItem = { name: string; quantity: number; unitPrice?: number; children?: LguInvoiceSubItem[] }
type LocalPackageOffer = {
  id: string
  name: string
  bundleId?: string
  bundleQty?: number
  machineIds?: string[]
  machineQty?: number
  machineItems?: Array<{id: string; qty: number}>
  techniqueIds?: string[]
  techniqueQty?: number
  techniqueItems?: Array<{id: string; qty: number}>
  evaluationIds?: string[]
  evaluationQty?: number
  evaluationItems?: Array<{id: string; qty: number}>
  addOnIds?: string[]
  addOnQty?: number
  addOnItems?: Array<{id: string; qty: number}>
  sessionIds?: string[]
  sessionQty?: number
  sessionItems?: Array<{id: string; qty: number}>
  invoiceSubItems?: LguInvoiceSubItem[]
  status?: string
}

const localServices = ref<LocalService[]>([])
const localBundles = ref<LocalBundle[]>([])
const localPackageOffers = ref<LocalPackageOffer[]>([])
const lguInvoiceCatalogLoaded = ref(false)

const hasValidSoaRange = computed(() => {
  const r = soaRange.value
  return Array.isArray(r) && r.length === 2 && r[0] instanceof Date && r[1] instanceof Date
})

const hasValidBulkTicketRange = computed(() => {
  const r = bulkTicketRange.value
  return Array.isArray(r) && r.length === 2 && r[0] instanceof Date && r[1] instanceof Date
})

const MANAGER_ROLE_KEYWORDS = [
  "manager",
  "operations manager",
  "chief operations officer",
  "coo",
  "owner"
]

const asCurrency = (value: number): string =>
  Number(value ?? 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" })

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A"
  return new Date(value).toLocaleString("en-PH")
}

const getClaimReferenceNumber = (detail: BillingListItem): string =>
  detail.receipt_number?.trim() || detail.public_id || `BILL-${detail.id}`

const parseMaybeJsonArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return []
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const toOptionalStringId = (value: unknown): string | undefined => {
  const text = String(value ?? "").trim()
  return text || undefined
}

const normalizePositiveInt = (value: unknown, fallback = 1): number => {
  const parsed = Math.trunc(Number(value))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const normalizeStringIdArray = (value: unknown): string[] =>
  parseMaybeJsonArray(value).map(item => toOptionalStringId(item)).filter((item): item is string => Boolean(item))

const normalizeQtyItems = (value: unknown): Array<{id: string; qty: number}> =>
  parseMaybeJsonArray(value).flatMap(item => {
    if (!item || typeof item !== "object") return []
    const raw = item as Record<string, unknown>
    const id = toOptionalStringId(raw.id ?? raw.item_id ?? raw.service_id ?? raw.session_id)
    return id ? [{ id, qty: normalizePositiveInt(raw.qty ?? raw.quantity, 1) }] : []
  })

const normalizeInvoiceSubItems = (value: unknown): LguInvoiceSubItem[] =>
  parseMaybeJsonArray(value).flatMap(item => {
    if (!item || typeof item !== "object") return []
    const raw = item as Record<string, unknown>
    const name = String(raw.name ?? "").trim()
    return name
      ? [{
          name,
          quantity: normalizePositiveInt(raw.quantity, 1),
          unitPrice: Number(raw.unitPrice ?? raw.unit_price ?? raw.price ?? 0) > 0
            ? Number(raw.unitPrice ?? raw.unit_price ?? raw.price)
            : undefined,
          children: normalizeInvoiceSubItems(raw.children)
        }]
      : []
  })

const normalizePackageOffer = (value: unknown): LocalPackageOffer | null => {
  if (!value || typeof value !== "object") return null
  const raw = value as Record<string, unknown>
  const id = toOptionalStringId(raw.id)
  const name = String(raw.name ?? "").trim()
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
    invoiceSubItems: normalizeInvoiceSubItems(raw.invoiceSubItems ?? raw.invoice_sub_items),
    status: typeof raw.status === "string" ? raw.status : undefined
  }
}

const loadLguInvoiceCatalog = async (): Promise<void> => {
  if (lguInvoiceCatalogLoaded.value) return

  try {
    localServices.value = JSON.parse(localStorage.getItem("singlePayServices") || "[]") as LocalService[]
  } catch {
    localServices.value = []
  }
  try {
    localBundles.value = JSON.parse(localStorage.getItem("bundledServices") || "[]") as LocalBundle[]
  } catch {
    localBundles.value = []
  }
  try {
    const parsed = JSON.parse(localStorage.getItem("packageServiceOffers") || "[]") as unknown[]
    localPackageOffers.value = Array.isArray(parsed)
      ? parsed.map(normalizePackageOffer).filter((item): item is LocalPackageOffer => item !== null)
      : []
  } catch {
    localPackageOffers.value = []
  }

  try {
    const [globalResponse, lguResponse] = await Promise.all([
      pamsAPI.get<Pageable<unknown>>("/package-service-offers", { params: { page: 1, size: 1000, status: "ALL", scope: "GLOBAL" } }),
      pamsAPI.get<Pageable<unknown>>("/package-service-offers", { params: { page: 1, size: 1000, status: "ALL", scope: "LGU" } })
    ])
    const merged = [
      ...(globalResponse.data?.content ?? []),
      ...(lguResponse.data?.content ?? [])
    ].map(normalizePackageOffer).filter((item): item is LocalPackageOffer => item !== null)
    const byId = new Map(localPackageOffers.value.map(item => [item.id, item]))
    merged.forEach(item => byId.set(item.id, item))
    localPackageOffers.value = Array.from(byId.values())
  } catch {
    // Local package catalog is enough for printing older saved packages.
  } finally {
    lguInvoiceCatalogLoaded.value = true
  }
}

const findPackageOffer = (pkgId?: string | number, pkgName?: string): LocalPackageOffer | undefined => {
  const id = String(pkgId ?? "").trim()
  if (id) {
    const match = localPackageOffers.value.find(item => item.id === id)
    if (match) return match
  }
  const normalizeName = (value?: string): string =>
    String(value ?? "").trim().replace(/\s+\(LGU\s+.*?\)\s*$/i, "").toLowerCase()
  const name = normalizeName(pkgName)
  return name
    ? localPackageOffers.value.find(item => {
        const candidate = normalizeName(item.name)
        return candidate === name || candidate.startsWith(name) || name.startsWith(candidate)
      })
    : undefined
}

const findBundle = (bundleId?: string | number): LocalBundle | undefined => {
  const id = String(bundleId ?? "").trim()
  return id ? localBundles.value.find(bundle => bundle.id === id) : undefined
}

const getServiceName = (id?: string): string | undefined =>
  id ? localServices.value.find(service => service.id === id)?.name : undefined

const getServicePrice = (id?: string): number | undefined => {
  if (!id) return undefined
  const price = Number(localServices.value.find(service => service.id === id)?.price ?? 0)
  return price > 0 ? price : undefined
}

const getServicePriceByName = (name?: string): number | undefined => {
  const normalized = String(name ?? "").trim().toLowerCase()
  if (!normalized) return undefined
  const price = Number(localServices.value.find(service => service.name.trim().toLowerCase() === normalized)?.price ?? 0)
  return price > 0 ? price : undefined
}

const enrichSubItemPrices = (items?: LguInvoiceSubItem[]): LguInvoiceSubItem[] | undefined => {
  if (!items?.length) return items
  return items.map(item => ({
    ...item,
    unitPrice: item.children?.length ? undefined : item.unitPrice ?? getServicePriceByName(item.name),
    children: enrichSubItemPrices(item.children)
  }))
}

const hasNestedSubItems = (items?: LguInvoiceSubItem[]): boolean =>
  Boolean(items?.some(item => (item.children?.length ?? 0) > 0 || hasNestedSubItems(item.children)))

const expandPackageItemIds = (
  items: Array<{id: string; qty: number}> | undefined,
  ids: string[] | undefined,
  fallbackQty: number | undefined,
  multiplier: number,
  includePrices: boolean
): LguInvoiceSubItem[] =>
  (items?.length ? items : (ids ?? []).map(id => ({ id, qty: normalizePositiveInt(fallbackQty, 1) })))
    .flatMap(item => {
      const name = getServiceName(item.id)
      return name
        ? [{
            name,
            quantity: Math.max(1, normalizePositiveInt(item.qty, 1) * multiplier),
            unitPrice: includePrices ? getServicePrice(item.id) : undefined
          }]
        : []
    })

const getPackageInvoiceSubItems = (pkgId?: string | number, pkgName?: string, multiplier = 1, includePrices = false): LguInvoiceSubItem[] => {
  const pkg = findPackageOffer(pkgId, pkgName)
  if (!pkg) return []

  if (pkg.invoiceSubItems?.length) {
    const multiply = (items: LguInvoiceSubItem[]): LguInvoiceSubItem[] =>
      items.map(item => ({
        name: item.name,
        quantity: Math.max(1, normalizePositiveInt(item.quantity, 1) * multiplier),
        unitPrice: includePrices ? item.unitPrice : undefined,
        children: item.children?.length ? multiply(item.children) : undefined
      }))
    return multiply(pkg.invoiceSubItems)
  }

  const subItems: LguInvoiceSubItem[] = []
  const bundle = findBundle(pkg.bundleId)
  if (bundle) {
    const bundleIds = [
      ...(bundle.machineIds ?? []),
      ...(bundle.techniqueIds ?? []),
      ...(bundle.evaluationIds ?? []),
      ...(bundle.addOnIds ?? [])
    ]
    subItems.push({
      name: bundle.name,
      quantity: Math.max(1, normalizePositiveInt(pkg.bundleQty, 1) * multiplier),
      children: bundleIds.flatMap(id => {
        const name = getServiceName(id)
        return name
          ? [{
              name,
              quantity: Math.max(1, normalizePositiveInt(pkg.bundleQty, 1) * multiplier),
              unitPrice: includePrices ? getServicePrice(id) : undefined
            }]
          : []
      })
    })
  }

  subItems.push(
    ...expandPackageItemIds(pkg.machineItems, pkg.machineIds, pkg.machineQty, multiplier, includePrices),
    ...expandPackageItemIds(pkg.techniqueItems, pkg.techniqueIds, pkg.techniqueQty, multiplier, includePrices),
    ...expandPackageItemIds(pkg.evaluationItems, pkg.evaluationIds, pkg.evaluationQty, multiplier, includePrices),
    ...expandPackageItemIds(pkg.addOnItems, pkg.addOnIds, pkg.addOnQty, multiplier, includePrices),
    ...expandPackageItemIds(pkg.sessionItems, pkg.sessionIds, pkg.sessionQty, multiplier, includePrices)
  )
  return subItems
}

const parseClaimLineItems = (raw?: string): Array<{
  id?: string | number
  type?: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
  treatmentDate?: string
  sessionSequence?: string
  totalSessions?: number
  claimStatus?: string
  subItems?: LguInvoiceSubItem[]
}> => {
  if (!raw) return []
  try {
    type RawLguSubItem = {name?: string; quantity?: number; price?: number; unitPrice?: number; unit_price?: number; children?: RawLguSubItem[]}
    const normalizeSubItems = (items?: RawLguSubItem[]): LguInvoiceSubItem[] =>
      (items ?? []).map(item => ({
        name: String(item.name ?? "Service"),
        quantity: Math.max(1, Number(item.quantity ?? 1)),
        unitPrice: Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0) > 0
          ? Number(item.unitPrice ?? item.unit_price ?? item.price)
          : undefined,
        children: normalizeSubItems(item.children)
      }))
    const parsed = JSON.parse(raw) as Array<{
      id?: string | number
      name?: string
      type?: string
      quantity?: number
      price?: number
      treatmentDate?: string
      sessionSequenceLabel?: string
      sessionSequence?: string | number
      totalSessions?: string | number
      claimStatus?: string
      subItems?: RawLguSubItem[]
    }>
    if (!Array.isArray(parsed)) return []
    return parsed.map(line => {
      const quantity = Math.max(1, Number(line.quantity ?? 1))
      const unitPrice = Number(line.price ?? 0)
      const sequence = line.sessionSequenceLabel
        || (
          line.sessionSequence && line.totalSessions
            ? `Session ${line.sessionSequence} of ${line.totalSessions}`
            : undefined
        )
      return {
        id: line.id,
        type: line.type,
        name: String(line.name ?? "LGU Session"),
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
        treatmentDate: line.treatmentDate,
        sessionSequence: sequence,
        totalSessions: Number(line.totalSessions ?? 0) > 0 ? Number(line.totalSessions) : undefined,
        claimStatus: line.claimStatus,
        subItems: Array.isArray(line.subItems)
          ? normalizeSubItems(line.subItems)
          : undefined
      }
    })
  } catch {
    return []
  }
}

const openClaimPrintWindow = (title: string): Window => {
  const popup = window.open("", "_blank")
  if (!popup || popup.closed) {
    throw new Error("Please allow pop-ups so the LGU claim PDF can open.")
  }
  popup.document.open()
  popup.document.write(`
    <!doctype html>
    <html>
      <head><title>${title}</title><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif; padding: 24px;">Preparing LGU claim PDF...</body>
    </html>
  `)
  popup.document.close()
  return popup
}

const formatYmd = (value: Date): string => {
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, "0")
  const d = String(value.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const inferLguPackageTotalSessions = (name?: string, fallback = 1): number => {
  const match = String(name ?? "").match(/\((\d+)\)\s*Sessions?/i)
  return match ? Math.max(1, Number(match[1])) : Math.max(1, fallback)
}

const generateSoa = (): void => {
  if (!hasValidSoaRange.value) return
  const [from, to] = soaRange.value as Date[]
  const url = router.resolve({
    name: "soa-print",
    params: { payer: "lgu" },
    query: {
      from: formatYmd(from),
      to: formatYmd(to),
      ...(selectedProgramId.value ? { program_id: String(selectedProgramId.value) } : {}),
      ...(selectedProgramName.value ? { program_name: selectedProgramName.value } : {})
    }
  }).href
  window.open(url, "_blank", "noopener,noreferrer")
}

const buildEncounterTicketCards = (detail: BillingListItem): EncounterTicketPdfCard[] => {
  const billingRoute = (() => {
    const n = String(detail.billing_type ?? "").trim().toUpperCase()
    if (n === "LGU_BILLING" || n === "LGU") return "LGU"
    if (n === "HMO_BILLING" || n === "HMO") return "HMO"
    if (n.includes("SELF_PAY")) return "Self Pay"
    return detail.billing_type?.trim() || "N/A"
  })()
  return (detail.encounter_tickets ?? [])
    .filter(ticket => ticket.record_locked)
    .map(ticket => {
      const snap = ticket.billing_snapshot
      const snapBillingType = snap?.billing_type ?? detail.billing_type

      const pkgName   = ticket.active_billing_package_name?.trim()   || snap?.active_billing_package_name?.trim()   || ""
      const pkgId     = ticket.active_billing_package_id?.trim()     || snap?.active_billing_package_id?.trim()     || ""
      const pkgSource = ticket.active_billing_package_source?.trim() || snap?.active_billing_package_source?.trim() || ""

      const describePackageLabel = (): string => {
        if (pkgName && pkgId && pkgName !== pkgId) return `${pkgName} (${pkgId})`
        return pkgName || pkgId || "No active billing package linked"
      }
      const formatPkgSource = (src: string): string => {
        const n = src.trim().toUpperCase()
        if (n === "PATIENT_PACKAGE_SERVICE_PURCHASE") return "Linked from patient package service purchase"
        if (n === "PATIENT_PACKAGE_PURCHASE")         return "Linked from patient package purchase"
        if (n === "PHASE1_BILLING_PACKAGE")           return "Linked from the billing package record"
        if (n === "BILLING_LINE_ITEM_PACKAGE")        return "Linked from the saved billing package line item"
        return src.trim() || "Linked billing package"
      }
      const describePackageSource = (): string | undefined => {
        if (!pkgSource) return undefined
        return pkgId ? `${formatPkgSource(pkgSource)} · Linked ID ${pkgId}` : formatPkgSource(pkgSource)
      }
      const buildDeductionSummary = (): string => {
        const n = String(snapBillingType ?? "").trim().toUpperCase().replace(/[: -]/g, "_")
        if (["HMO", "HMO_BILLING"].includes(n))  return "Deducting 1 Session from HMO Allocation"
        if (["LGU", "LGU_BILLING"].includes(n))  return "Deducting 1 Session from LGU Authorization"
        if (n === "SELF_PAY_PACKAGE")             return "Recording 1 Attended Package Session"
        return "Attendance record only"
      }

      return {
        slipNumber: ticket.slip_number || `ETS-${ticket.id}`,
        encounterTicketId: ticket.id,
        patientName: snap?.patient_name || detail.patient_name || "Patient",
        providerName: snap?.provider_name || detail.physical_therapist || "Unassigned",
        serviceName: snap?.service_name || detail.service_name || "Therapy Session",
        specialtyName: snap?.specialty_tag_name,
        specialtyIsActive: snap?.specialty_tag_is_active,
        treatmentAreaName: snap?.treatment_area_name,
        treatmentAreaColor: snap?.treatment_area_color,
        treatmentAreaIsActive: snap?.treatment_area_is_active,
        billingRoute,
        attendanceStatus: ticket.attendance_status === "ATTENDED" ? "Attended" : "No Show",
        attendedAt: ticket.attended_at,
        signedOffAt: ticket.signed_off_at,
        lockedAt: ticket.locked_at,
        appointmentId: snap?.appointment_public_id ?? ticket.appointment_public_id ?? detail.appointment_public_id ?? detail.appointment_id,
        billingId: ticket.phase1_billing_public_id ?? detail.public_id ?? detail.id,
        activeBillingPackageLabel: describePackageLabel(),
        activeBillingPackageSource: describePackageSource(),
        deductionSummary: buildDeductionSummary(),
        signatureDataUrl: ticket.patient_signature_data_url,
        ptSignatureDataUrl: ticket.pt_signature_data_url,
        sessionSequenceLabel: snap?.session_sequence_label
      } as EncounterTicketPdfCard
    })
}

const exportBulkLguEncounterTickets = async (): Promise<void> => {
  if (!hasValidBulkTicketRange.value) return
  const [from, to] = bulkTicketRange.value as Date[]
  const fromStr = formatYmd(from)
  const toStr = formatYmd(to)

  let popup: Window
  try {
    popup = openEncounterTicketPdfWindow("LGU Bulk Encounter Ticket PDF")
  } catch {
    errorToast(toast, "Unable to open PDF window. Allow pop-ups for this site, then try again.")
    return
  }

  exportingBulkTickets.value = true
  try {
    const response = await billingPhase1Service.getAll({
      page: 1,
      size: 500,
      billing_type: "LGU_BILLING",
      from_date: fromStr,
      to_date: toStr
    })
    const billingIds = (response?.content ?? []).map(b => b.id).filter(id => Number.isFinite(id) && id > 0)
    if (!billingIds.length) {
      popup.close()
      errorToast(toast, `No LGU billings found between ${fromStr} and ${toStr}`)
      return
    }

    const details = (await Promise.all(billingIds.map(id => billingPhase1Service.getById(id)))).filter((d): d is BillingListItem => !!d)
    const cards = details
      .flatMap(d => buildEncounterTicketCards(d))
      .sort((a, b) => new Date(a.signedOffAt).getTime() - new Date(b.signedOffAt).getTime())

    if (!cards.length) {
      popup.close()
      errorToast(toast, "No locked encounter tickets found for the selected date range")
      return
    }

    renderEncounterTicketBulkPdfWindow(popup, cards, {
      title: "LGU Bulk Encounter Tickets",
      subtitle: `LGU billings from ${fromStr} to ${toStr} · ${cards.length} ticket${cards.length === 1 ? "" : "s"}`,
      fileName: `lgu-encounter-tickets-${fromStr}-to-${toStr}`
    })
  } catch (e) {
    popup.close()
    errorToast(toast, getApiErrorMessage(e, {baseMessage: "Failed to export LGU encounter tickets"}))
  } finally {
    exportingBulkTickets.value = false
  }
}

const firstDroppedOutAppointmentId = computed<number | null>(() => {
  const appointments = selectedPatientDetail.value?.appointments ?? []
  return appointments.find(appointment =>
    appointment.status === "DROPPED_OUT" || appointment.status === "CROSS_MONTH_DROPPED_OUT"
  )?.appointment_id ?? null
})

const formatLguStatus = (value?: string | null): string => {
  const normalized = String(value ?? "PENDING").trim().toUpperCase()
  if (normalized === "CROSS_MONTH_DROPPED_OUT") return "Cross Month Dropped Out"
  if (normalized === "DROPPED_OUT") return "Dropped Out"
  if (normalized === "COMPLETED") return "Completed"
  return "Pending"
}

const lguStatusSeverity = (value?: string | null): "success" | "warn" | "danger" | "info" | "secondary" => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "COMPLETED") return "success"
  if (normalized === "DROPPED_OUT" || normalized === "CROSS_MONTH_DROPPED_OUT") return "danger"
  if (normalized === "PENDING" || normalized === "ACTIVE") return "warn"
  return "secondary"
}

const formatBudgetPeriod = (year: number, month: number): string =>
  new Date(year, month - 1, 1).toLocaleDateString("en-PH", {
    month: "short",
    year: "numeric"
  })

const normalizeBudgetMonthDate = (value?: Date | null): Date => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return new Date(currentMonthStart)
  }
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

const formatEntryType = (value?: string): string =>
  String(value ?? "")
    .toLowerCase()
    .split("_")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

const entryTypeSeverity = (value?: string): "success" | "info" | "warn" | "danger" | "secondary" => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "SESSION_CHARGE") return "warn"
  if (normalized === "REVERSAL") return "danger"
  if (normalized === "ROLLOVER") return "success"
  if (normalized === "MANUAL_ADJUSTMENT") return "info"
  return "secondary"
}

const usageStatusSeverity = (value?: string): "success" | "warn" | "danger" | "secondary" => {
  const normalized = String(value ?? "").trim().toUpperCase()
  if (normalized === "APPLIED") return "success"
  if (normalized === "ADJUSTED") return "warn"
  if (normalized === "REVERSED" || normalized === "VOID") return "danger"
  return "secondary"
}

const usedLguFund = computed(() =>
  lguTransactionHistory.value
    .filter(entry => entry.billing_status === "BILLED")
    .reduce((sum, entry) => sum + Number(entry.amount_out ?? 0), 0)
)

const pendingUsedLguFund = computed(() =>
  lguTransactionHistory.value
    .filter(entry => entry.billing_status && entry.billing_status !== "BILLED")
    .reduce((sum, entry) => sum + Number(entry.amount_out ?? 0), 0)
)

const totalAvailableFund = computed(() =>
  Math.max(0, Number(baseMonthlyBudget.value ?? 0) + Number(rolloverAmount.value ?? 0))
)

const selectedBudgetPeriodYear = computed(() =>
  normalizeBudgetMonthDate(selectedBudgetMonthDate.value).getFullYear()
)

const selectedBudgetPeriodMonth = computed(() =>
  normalizeBudgetMonthDate(selectedBudgetMonthDate.value).getMonth() + 1
)

const budgetMonthLabel = computed(() => {
  return new Date(selectedBudgetPeriodYear.value, selectedBudgetPeriodMonth.value - 1, 1).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric"
  })
})

const currentMonthLabel = computed(() =>
  new Date(currentMonthStart).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric"
  })
)

const isFutureBudgetMonth = computed(() =>
  selectedBudgetPeriodYear.value > currentMonthStart.getFullYear()
  || (
    selectedBudgetPeriodYear.value === currentMonthStart.getFullYear()
    && selectedBudgetPeriodMonth.value > (currentMonthStart.getMonth() + 1)
  )
)

const remainingAvailableFund = computed(() =>
  Number((totalAvailableFund.value - usedLguFund.value).toFixed(2))
)

const canManageLguDashboard = computed(() => {
  const normalized = currentRoleName.value.trim().toLowerCase()
  if (!normalized) return false
  return MANAGER_ROLE_KEYWORDS.some(keyword => normalized.includes(keyword))
})

const lguProgramOptions = computed(() =>
  lguPrograms.value.map(p => ({ ...p, label: `LGU-${p.name}` }))
)

const selectedProgramName = computed(() =>
  lguProgramOptions.value.find(p => p.id === selectedProgramId.value)?.label ?? ""
)

const resolveRoleFromStorage = (): string => {
  const candidateKeys = ["auth_user", "currentUser", "user", "profile", "loggedInUser", "google_user"]
  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const role = String(parsed.role_name ?? parsed.role ?? parsed.userRole ?? parsed.primaryRole ?? "").trim()
      if (role) return role
      if (Array.isArray(parsed.roles) && parsed.roles.length > 0) {
        const first = parsed.roles[0]
        if (typeof first === "string" && first.trim()) return first.trim()
        if (first && typeof first === "object") {
          const roleObj = first as Record<string, unknown>
          const nested = String(roleObj.name ?? roleObj.role ?? "").trim()
          if (nested) return nested
        }
      }
    } catch {
      // Ignore malformed storage entries.
    }
  }
  return ""
}

const extractApiErrorMessage = (error: unknown, fallback: string): string =>
  getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Billing or LGU dashboard access in Role Access",
    invalidInputHint: "LGU values are invalid. Check the period and amount fields, then try again.",
    retryHint: "Please try again."
  })

const hasAnyBudgetDraft = (draft: LocalLguBudgetDraft | null): boolean =>
  Number(draft?.baseMonthlyBudget ?? 0) > 0 || Number(draft?.rolloverAmount ?? 0) > 0

const localDashboardBudgetStorageKey = computed(() =>
  `lgu_dashboard_budget:${selectedProgramId.value ?? "all"}:${selectedBudgetPeriodYear.value}-${String(selectedBudgetPeriodMonth.value).padStart(2, "0")}`
)

const selectedBillingMonth = computed(() =>
  `${selectedBudgetPeriodYear.value}-${String(selectedBudgetPeriodMonth.value).padStart(2, "0")}`
)

const readLocalDashboardBudget = (): LocalLguBudgetDraft | null => {
  try {
    const raw = localStorage.getItem(localDashboardBudgetStorageKey.value)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalLguBudgetDraft
    return {
      baseMonthlyBudget: Math.max(0, Number(parsed.baseMonthlyBudget ?? 0)),
      rolloverAmount: Math.max(0, Number(parsed.rolloverAmount ?? 0))
    }
  } catch {
    return null
  }
}

const persistLocalDashboardBudget = (): void => {
  localStorage.setItem(
    localDashboardBudgetStorageKey.value,
    JSON.stringify({
      baseMonthlyBudget: Number(baseMonthlyBudget.value ?? 0),
      rolloverAmount: Number(rolloverAmount.value ?? 0),
      updatedAt: new Date().toISOString()
    })
  )
}

const applyBudgetValues = (payload: { base_budget?: number; rollover_amount?: number; baseMonthlyBudget?: number; rolloverAmount?: number }): void => {
  baseMonthlyBudget.value = Math.max(0, Number(payload.base_budget ?? payload.baseMonthlyBudget ?? 0))
  rolloverAmount.value = Math.max(0, Number(payload.rollover_amount ?? payload.rolloverAmount ?? 0))
}

const loadDashboardBudget = async (): Promise<void> => {
  const localDraft = readLocalDashboardBudget()
  loadingDashboardBudget.value = true
  budgetSyncError.value = ""
  rolloverInput.value = 0
  lguDashboardBudget.value = null
  if (!selectedProgramId.value) {
    applyBudgetValues({})
    hasLocalOnlyBudgetDraft.value = false
    loadingDashboardBudget.value = false
    return
  }
  try {
    const serverBudget = await lguBillingService.getDashboardBudget(
      selectedBudgetPeriodYear.value,
      selectedBudgetPeriodMonth.value,
      selectedProgramId.value ?? undefined
    )
    if (serverBudget) {
      lguDashboardBudget.value = serverBudget
      applyBudgetValues(serverBudget)
      hasLocalOnlyBudgetDraft.value = false
      persistLocalDashboardBudget()
      return
    }

    lguDashboardBudget.value = null
    applyBudgetValues(localDraft ?? {})
    hasLocalOnlyBudgetDraft.value = hasAnyBudgetDraft(localDraft)
  } catch (error: unknown) {
    lguDashboardBudget.value = null
    applyBudgetValues(localDraft ?? {})
    hasLocalOnlyBudgetDraft.value = hasAnyBudgetDraft(localDraft)
    budgetSyncError.value = extractApiErrorMessage(error, "Failed to load the live LGU budget")
  } finally {
    loadingDashboardBudget.value = false
  }
}

  const openPatientDetail = async (patientId: number | null | undefined): Promise<void> => {
    if (!patientId) return
    selectedPatientDetail.value = null
    patientDetailError.value = ""
    showPatientDetailDialog.value = true
    loadingPatientDetail.value = true
    try {
      selectedPatientDetail.value = await lguBillingService.getPatientCreditDetail(
        patientId,
        selectedBudgetPeriodYear.value,
        selectedBudgetPeriodMonth.value
      ) ?? null
    } catch (error: unknown) {
      patientDetailError.value = extractApiErrorMessage(error, "Failed to load patient LGU credit details")
    } finally {
      loadingPatientDetail.value = false
    }
  }

  const refreshSelectedPatientDetail = async (): Promise<void> => {
    const patientId = selectedPatientDetail.value?.patient_id
    if (!patientId) return
    try {
      selectedPatientDetail.value = await lguBillingService.getPatientCreditDetail(
        patientId,
        selectedBudgetPeriodYear.value,
        selectedBudgetPeriodMonth.value
      ) ?? null
    } catch (error: unknown) {
      patientDetailError.value = extractApiErrorMessage(error, "Failed to refresh patient LGU credit details")
    }
  }

  const downloadClaimPdf = async (billingId: number): Promise<void> => {
    if (!billingId || printingClaimBillingId.value) return
    printingClaimBillingId.value = billingId
    let popup: Window | null = null
    try {
      const detail = await billingPhase1Service.getById(billingId)
      if (!detail) {
        errorToast(toast, "LGU claim billing could not be loaded")
        return
      }

      await loadLguInvoiceCatalog()
      const referenceNumber = getClaimReferenceNumber(detail)
      popup = openClaimPrintWindow(referenceNumber)
      const lines = parseClaimLineItems(detail.line_items_json)
      const total = Number(detail.total_amount ?? detail.amount_due ?? 0)
      const isDropoutClaim = String(detail.pricing_source ?? "").toUpperCase().includes("DROPOUT")
        || lines.some(line => String(line.claimStatus ?? "").toUpperCase() === "DROPPED_OUT")
      const lockedTickets = (detail.encounter_tickets ?? [])
        .filter(ticket => ticket.record_locked)
        .sort((left, right) => {
          const leftDate = String(left.billing_snapshot?.starts_at ?? left.attended_at ?? "")
          const rightDate = String(right.billing_snapshot?.starts_at ?? right.attended_at ?? "")
          return leftDate.localeCompare(rightDate)
        })
      const shouldExpandSinglePackageLine = lines.length === 1
        && lockedTickets.length > 1
        && String(lines[0]?.type ?? "").toLowerCase() === "package"
      const invoiceLines = shouldExpandSinglePackageLine
        ? (() => {
            const line = lines[0]
            const sourceTotal = Number(line.unitPrice || line.lineTotal || total || 0)
            const unitPrice = lockedTickets.length > 0 ? sourceTotal / lockedTickets.length : sourceTotal
            const totalSessions = line.totalSessions ?? inferLguPackageTotalSessions(line.name, lockedTickets.length)

            return lockedTickets.map((ticket, index) => ({
              name: line.name,
              quantity: 1,
              unitPrice,
              lineTotal: unitPrice,
              treatmentDate: ticket.billing_snapshot?.starts_at || ticket.attended_at || detail.created_at,
              sessionSequence: `Session ${index + 1} of ${totalSessions}`,
              subItems: isDropoutClaim
                ? (
                    hasNestedSubItems(line.subItems)
                      ? enrichSubItemPrices(line.subItems)
                      : getPackageInvoiceSubItems(line.id, line.name, line.quantity, true).length
                      ? getPackageInvoiceSubItems(line.id, line.name, line.quantity, true)
                      : enrichSubItemPrices(line.subItems)
                  )
                : line.subItems?.length
                  ? line.subItems
                  : getPackageInvoiceSubItems(line.id, line.name, line.quantity)
            }))
          })()
        : lines.map((line, index) => ({
            name: line.name,
            quantity: line.quantity,
            unitPrice: isDropoutClaim ? 0 : line.unitPrice,
            lineTotal: isDropoutClaim ? 0 : line.lineTotal,
            treatmentDate: line.treatmentDate || lockedTickets[index]?.billing_snapshot?.starts_at || lockedTickets[index]?.attended_at || detail.created_at,
            sessionSequence: line.sessionSequence || lockedTickets[index]?.billing_snapshot?.session_sequence_label || String(index + 1),
            subItems: isDropoutClaim
              ? (
                  hasNestedSubItems(line.subItems)
                    ? enrichSubItemPrices(line.subItems)
                    : getPackageInvoiceSubItems(line.id, line.name, line.quantity, true).length
                    ? getPackageInvoiceSubItems(line.id, line.name, line.quantity, true)
                    : enrichSubItemPrices(line.subItems)
                )
              : line.subItems?.length
                ? line.subItems
                : String(line.type ?? "").toLowerCase() === "package"
                  ? getPackageInvoiceSubItems(line.id, line.name, line.quantity)
                  : undefined
          }))
      const lguStatus = selectedPatientDetail.value?.package_availments[0]?.status
        || lines.find(line => line.claimStatus)?.claimStatus
        || detail.billing_status
      renderLguInvoiceWindow(popup, {
        billingDate: detail.created_at,
        referenceNumber,
        patientName: detail.patient_name || `Patient ${detail.patient_public_id || detail.patient_id}`,
        patientAddress: detail.patient_address,
        patientAge: detail.patient_age,
        patientGender: detail.patient_gender,
        physicalTherapist: detail.physical_therapist,
        doctor: detail.doctor,
        lguProgramName: detail.lgu_program_name || selectedProgramName.value,
        lguReferenceLabel: detail.lgu_patient_referral_form_no || detail.lgu_reference_label || detail.service_name || selectedBillingMonth.value,
        lguDateIssued: detail.lgu_date_issued || detail.created_at,
        lguStatus: formatLguStatus(lguStatus),
        subtotal: Number(detail.subtotal_amount ?? total),
        discount: Number(detail.discount_amount ?? 0),
        grandTotal: total,
        lines: invoiceLines
      }, { title: "LGU Claim PDF", fileName: referenceNumber })
    } catch (error: unknown) {
      if (popup && !popup.closed) popup.close()
      errorToast(toast, extractApiErrorMessage(error, "Failed to download LGU claim PDF"))
    } finally {
      printingClaimBillingId.value = null
    }
  }

  const createClaimsForEligibleAppointments = async (): Promise<void> => {
    if (isCreatingClaims.value || !selectedPatientDetail.value) return
    isCreatingClaims.value = true
    try {
      const result = await lguBillingService.createPatientClaim({
        patient_id: selectedPatientDetail.value.patient_id,
        billing_month: selectedBillingMonth.value
      })
      successToast(
        toast,
        result?.consumed_count
          ? `${result.consumed_count} session${result.consumed_count > 1 ? "s" : ""} claimed (${result.billing_public_id ?? ""}) for ${selectedBillingMonth.value}.`
          : `Claim created for ${selectedBillingMonth.value}.`
      )
      await Promise.all([loadTransactionHistory(), refreshSelectedPatientDetail()])
      if (result?.billing_id) {
        await downloadClaimPdf(result.billing_id)
      }
    } catch (error: unknown) {
      errorToast(toast, extractApiErrorMessage(error, "Failed to create LGU claim"))
    } finally {
      isCreatingClaims.value = false
    }
  }

const loadTransactionHistory = async (): Promise<void> => {
  loadingTransactionHistory.value = true
  transactionHistoryError.value = ""
  if (!selectedProgramId.value) {
    lguTransactionHistory.value = []
    loadingTransactionHistory.value = false
    return
  }
  try {
    lguTransactionHistory.value = await lguBillingService.getDashboardHistory(
      100,
      selectedBudgetPeriodYear.value,
      selectedBudgetPeriodMonth.value,
      selectedProgramId.value ?? undefined
    ) ?? []
  } catch (error: unknown) {
    lguTransactionHistory.value = []
    transactionHistoryError.value = extractApiErrorMessage(error, "Failed to load LGU transaction history")
  } finally {
    loadingTransactionHistory.value = false
  }
}

const saveDashboardBudget = async (): Promise<void> => {
  if (!selectedProgramId.value) {
    errorToast(toast, "Select an LGU program first")
    return
  }
  persistLocalDashboardBudget()
  savingDashboardBudget.value = true
  budgetSyncError.value = ""
  try {
    const savedBudget = await lguBillingService.saveDashboardBudget({
      base_budget: Number(baseMonthlyBudget.value ?? 0),
      rollover_amount: Number(rolloverAmount.value ?? 0),
      period_year: selectedBudgetPeriodYear.value,
      period_month: selectedBudgetPeriodMonth.value,
      program_id: selectedProgramId.value ?? undefined
    })

    lguDashboardBudget.value = savedBudget ?? null
    if (savedBudget) {
      applyBudgetValues(savedBudget)
    }
    hasLocalOnlyBudgetDraft.value = false
    persistLocalDashboardBudget()
    successToast(toast, `LGU budget is now live for ${budgetMonthLabel.value}`)
  } catch (error: unknown) {
    hasLocalOnlyBudgetDraft.value = true
    const message = extractApiErrorMessage(error, "Failed to save the live LGU budget")
    budgetSyncError.value = message
    errorToast(toast, message)
  } finally {
    savingDashboardBudget.value = false
  }
}

const refreshDashboardBudget = async (): Promise<void> => {
  refreshingDashboardBudget.value = true
  budgetSyncError.value = ""
  try {
    if (canManageLguDashboard.value) {
      const result = await lguBillingService.refreshDashboardBudget(
        selectedBudgetPeriodYear.value,
        selectedBudgetPeriodMonth.value,
        selectedProgramId.value ?? undefined
      )
      await Promise.all([
        loadDashboardBudget(),
        loadTransactionHistory()
      ])
      successToast(
        toast,
        result?.reversed_entries
          ? `LGU budget refreshed. Reversed ${result.reversed_entries} duplicate billing charge${result.reversed_entries === 1 ? "" : "s"}.`
          : "LGU budget refreshed successfully"
      )
      return
    }

    await Promise.all([
      loadDashboardBudget(),
      loadTransactionHistory()
    ])
  } catch (error: unknown) {
    const message = extractApiErrorMessage(error, "Failed to refresh the LGU budget")
    budgetSyncError.value = message
    errorToast(toast, message)
  } finally {
    refreshingDashboardBudget.value = false
  }
}

const addRolloverAmount = (): void => {
  const amount = Math.max(0, Number(rolloverInput.value ?? 0))
  if (amount <= 0) {
    errorToast(toast, "Enter a rollover amount greater than 0")
    return
  }
  rolloverAmount.value = Number(rolloverAmount.value ?? 0) + amount
  rolloverInput.value = 0
}

watch(selectedBudgetMonthDate, (value) => {
  const normalized = normalizeBudgetMonthDate(value)
  if (!(value instanceof Date) || normalized.getTime() !== value.getTime()) {
    selectedBudgetMonthDate.value = normalized
    return
  }

  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory()
  ])
})

watch(selectedProgramId, () => {
  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory()
  ])
})

const loadLguPrograms = async (): Promise<void> => {
  loadingPrograms.value = true
  try {
    const programs = await lguBillingService.getPrograms()
    lguPrograms.value = programs ?? []
    if (lguPrograms.value.length > 0 && !selectedProgramId.value) {
      selectedProgramId.value = lguPrograms.value[0].id
    } else if (!lguPrograms.value.length) {
      selectedProgramId.value = null
    }
  } catch {
    lguPrograms.value = []
    selectedProgramId.value = null
  } finally {
    loadingPrograms.value = false
  }
}

const createNewProgram = async (): Promise<void> => {
  const name = newProgramName.value.trim()
  if (!name) return
  creatingProgram.value = true
  try {
    const created = await lguBillingService.createProgram(name)
    if (created) {
      await loadLguPrograms()
      selectedProgramId.value = created.id
      successToast(toast, `LGU program "${name}" created`)
    }
    showNewProgramInput.value = false
    newProgramName.value = ""
  } catch (error: unknown) {
    errorToast(toast, extractApiErrorMessage(error, "Failed to create LGU program"))
  } finally {
    creatingProgram.value = false
  }
}

onMounted(async () => {
  currentRoleName.value = resolveRoleFromStorage()
  await loadLguPrograms()
  void Promise.all([
    loadDashboardBudget(),
    loadTransactionHistory()
  ])
})
</script>
