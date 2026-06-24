<template>
  <HmoInvoiceLayout
    title="HMO PROFILE SUMMARY"
    :has-error="!!error"
  >
    <template #meta>
      <strong>PRINT DATE:</strong><span>{{ printDateLabel }}</span>
      <strong>PATIENT ID:</strong><span>{{ patientIdLabel }}</span>
    </template>

    <template #toolbar>
      <Button label="Print" icon="pi pi-print" @click="() => printPage()" />
      <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
    </template>

    <template v-if="error" #error>
      {{ error }}
    </template>

    <template v-if="!error" #details>
      <div class="profile-details">
        <div class="profile-card">
          <div class="profile-section-title">Patient Information</div>

          <div class="profile-grid">
            <div class="profile-group">
              <div class="profile-row profile-row--list">
                <span class="profile-label">Name:</span>
                <span class="profile-value">{{ patientName }}</span>
              </div>
              <div>
                &nbsp;
              </div>
              <div class="profile-row profile-row--list">
                <span class="profile-label">Age:</span>
                <span class="profile-value">{{ patientAge }}</span>
              </div>
            </div>

            <div class="profile-group">
              <div class="profile-row profile-row--list">
                <span class="profile-label">Address:</span>
                <span class="profile-value">{{ patientAddress }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!error">
      <section v-if="!hasUploadedHmoId" class="hmo-reference">
        <div v-if="hasPatientHmoInformation" class="hmo-reference-summary">
          <div class="hmo-reference-title">HMO Information</div>
          <div class="hmo-reference-summary-grid">
            <div class="hmo-reference-summary-item uppercase">
              <span>HMO</span>
              <strong>{{ patientHmoName }}</strong>
            </div>
            <div class="hmo-reference-summary-item uppercase">
              <span>HMO Type</span>
              <strong>{{ patientHmoType }}</strong>
            </div>
            <div class="hmo-reference-summary-item uppercase">
              <span>Expiration Date</span>
              <strong>{{ patientHmoExpirationDate }}</strong>
            </div>
          </div>
        </div>

        <div class="hmo-reference-field">
          <label for="hmo-number">HMO Number</label>
          <input
            id="hmo-number"
            v-model="hmoNumber"
            :readonly="usesSavedHmoProfile"
            type="text"
          />
        </div>

        <div class="hmo-reference-field uppercase">
          <label for="patient-company">Patient Company Name</label>
          <input
            class="uppercase"
            id="patient-company"
            v-model="patientCompany"
            :readonly="usesSavedHmoProfile"
            type="text"
          />
        </div>
      </section>

      <section
        v-if="visibleDocumentCards.length"
        class="hmo-profile-documents"
        aria-label="HMO profile uploaded documents"
      >
        <article
          v-for="document in visibleDocumentCards"
          :key="document.key"
          class="hmo-profile-document"
        >
          <header class="hmo-profile-document-header">
            <div>
              <h2>{{ document.title }}</h2>
            </div>
          </header>

          <div class="hmo-profile-document-frame">
            <img
              v-if="document.previewUrl && document.isImage"
              :src="document.previewUrl"
              :alt="document.title"
            />
            <object
              v-else-if="document.previewUrl && document.isPdf"
              :data="document.previewUrl"
              type="application/pdf"
            >
              <a :href="document.previewUrl" target="_blank" rel="noopener">{{ document.title }}</a>
            </object>
            <div v-else class="hmo-profile-document-empty">
              <strong>{{ document.title }}</strong>
              <span>{{ document.error || "No uploaded document found." }}</span>
            </div>
          </div>
        </article>
      </section>
    </template>

    <template #bottom>
      <div>
        <section>
          <div>&nbsp;</div>

        </section>
      </div>
    </template>
  </HmoInvoiceLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { useQueryClient } from "@tanstack/vue-query"
import Button from "primevue/button"
import type { Patient } from "@/features/patients/types/patient"
import { patientTanstackService } from "@/features/patients/queries/patient.tanstack.service"
import type { PatientHMOInformation } from "@/models/hmo-information"
import type { PatientAttachment } from "@/models/patient-attachment"
import { PatientAttachmentTanstackKey } from "@/utils/keys/tanstack-key"
import { pamsAPI } from "@/utils/axios-interceptor"
import HmoInvoiceLayout from "./HmoInvoiceLayout.vue"
import { useHmoInvoicePrintActions } from "./hmo-invoice.shared"

type AttachmentDocument = {
  key: PatientAttachmentTanstackKey
  title: string
  attachment: PatientAttachment | null
  previewUrl: string
  mediaType: string
  error: string
}

const route = useRoute()
const queryClient = useQueryClient()
const { printPage, goBack } = useHmoInvoicePrintActions()

const patient = ref<Patient | null>(null)
const sponsorInfo = ref<PatientHMOInformation | null>(null)
const documents = ref<AttachmentDocument[]>([])
const objectUrls = ref<string[]>([])
const error = ref("")

const patientId = computed(() => {
  const parsed = Number(String(route.query.patient_id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const hmoId = computed(() => {
  const parsed = Number(String(route.query.hmo_id ?? "").trim())
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
})

const printDateLabel = computed(() =>
  new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric"
  })
)

const firstNonBlank = (...values: unknown[]): string => {
  for (const value of values) {
    const text = String(value ?? "").trim()
    if (text) return text
  }

  return ""
}

const formatPrintableName = (value?: string | null, fallback = "Patient"): string => {
  const name = String(value ?? "").trim()
  return name ? name.toUpperCase() : fallback
}

const patientName = computed(() =>
  formatPrintableName(
    firstNonBlank(patient.value?.full_name, route.query.patient_name),
    "Patient"
  )
)

const patientIdLabel = computed(() => patientId.value > 0 ? String(patientId.value) : "N/A")

const patientAge = computed(() =>
  patient.value?.age == null ? "N/A" : `${patient.value.age} years old`
)

const patientAddress = computed(() => {
  const parts = [
    patient.value?.baranggay_name,
    patient.value?.city_name,
    patient.value?.province_name,
    patient.value?.region_name
  ].map(part => String(part ?? "").trim()).filter(Boolean)

  return firstNonBlank(parts.join(", "), "N/A")
})

const hmoNumber = ref("")
const patientCompany = ref("")
const usesSavedHmoProfile = computed(() => hmoId.value > 0 && !!sponsorInfo.value)

const resolveSavedHmoNumber = (record?: PatientHMOInformation | null): string =>
  firstNonBlank(record?.card_number)

const resolveSavedPatientCompany = (record?: PatientHMOInformation | null): string =>
  firstNonBlank(record?.company_name)

const formatDate = (value?: string | null): string => {
  if (!value) return "N/A"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-PH")
}

const patientHmoName = computed(() =>
  firstNonBlank(sponsorInfo.value?.hmo_name, patient.value?.hmo_name, route.query.hmo_name, "N/A")
)

const patientHmoType = computed(() =>
  firstNonBlank(sponsorInfo.value?.hmo_type_name, "N/A")
)

const patientHmoExpirationDate = computed(() =>
  formatDate(sponsorInfo.value?.validity_end_date)
)

const hasPatientHmoInformation = computed(() =>
  !!sponsorInfo.value ||
  patientHmoName.value !== "N/A" ||
  patientHmoType.value !== "N/A" ||
  patientHmoExpirationDate.value !== "N/A"
)

const documentCards = computed(() =>
  documents.value.map(document => {
    const mediaType = String(document.mediaType || document.attachment?.media_type || "").toLowerCase()
    const extension = String(document.attachment?.extension ?? "").toLowerCase()

    return {
      ...document,
      isImage: mediaType.startsWith("image/") || ["jpg", "jpeg", "png"].includes(extension),
      isPdf: mediaType.includes("pdf") || extension === "pdf"
    }
  })
)

const hmoIdDocument = computed(() =>
  documentCards.value.find(document => document.key === PatientAttachmentTanstackKey.HMO_ID) ?? null
)

const hasUploadedHmoId = computed(() =>
  Boolean(hmoIdDocument.value?.previewUrl) ||
  documentCards.value.some(document => document.key === PatientAttachmentTanstackKey.HMO_ID_BACK && Boolean(document.previewUrl))
)

const visibleDocumentCards = computed(() =>
  documentCards.value.filter(document => Boolean(document.previewUrl))
)

const documentStatus = (document: AttachmentDocument): string => {
  if (document.previewUrl) return "Attached"
  if (document.error) return "Unavailable"
  return "Missing"
}

const releaseObjectUrls = (): void => {
  objectUrls.value.forEach(url => URL.revokeObjectURL(url))
  objectUrls.value = []
}

const loadAttachmentDocument = async (
  key: PatientAttachmentTanstackKey,
  title: string
): Promise<AttachmentDocument> => {
  try {
    const { data: attachment } = await pamsAPI.get<PatientAttachment>(`/patients/${patientId.value}/attachments/${key}`)
    const fileResponse = await pamsAPI.get<Blob>(`/patients/${patientId.value}/attachments/${key}/file`, {
      responseType: "blob"
    })
    const previewUrl = URL.createObjectURL(fileResponse.data)
    objectUrls.value.push(previewUrl)

    return {
      key,
      title,
      attachment,
      previewUrl,
      mediaType: fileResponse.data.type || attachment.media_type || "",
      error: ""
    }
  } catch {
    return {
      key,
      title,
      attachment: null,
      previewUrl: "",
      mediaType: "",
      error: "No uploaded document found."
    }
  }
}

const load = async (): Promise<void> => {
  error.value = ""
  documents.value = []
  patient.value = null
  sponsorInfo.value = null
  releaseObjectUrls()

  if (!patientId.value) {
    error.value = "Patient ID is required."
    return
  }

  try {
    const context = await patientTanstackService.fetchContext(queryClient, patientId.value)
    patient.value = context?.patient ?? null

    const sponsorRecords = context?.sponsor_information ?? []
    sponsorInfo.value =
      sponsorRecords.find(record => record.sponsor_context === "HMO" && Number(record.hmo_id) === hmoId.value) ??
      (hmoId.value > 0 ? null : sponsorRecords.find(record => record.sponsor_context === "HMO")) ??
      null

    hmoNumber.value = usesSavedHmoProfile.value
      ? resolveSavedHmoNumber(sponsorInfo.value)
      : ""
    patientCompany.value = usesSavedHmoProfile.value
      ? resolveSavedPatientCompany(sponsorInfo.value)
      : ""

    documents.value = await Promise.all([
      loadAttachmentDocument(PatientAttachmentTanstackKey.VALID_ID, "Valid ID Front"),
      loadAttachmentDocument(PatientAttachmentTanstackKey.VALID_ID_BACK, "Valid ID Back"),
      loadAttachmentDocument(PatientAttachmentTanstackKey.HMO_ID, "HMO ID Front"),
      loadAttachmentDocument(PatientAttachmentTanstackKey.HMO_ID_BACK, "HMO ID Back")
    ])
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : "Failed to load HMO profile summary"
  }
}

onMounted(() => {
  void load().then(() => {
    if (hasUploadedHmoId.value && String(route.query.autoprint ?? "1") !== "0") {
      window.setTimeout(() => printPage(), 250)
    }
  })
})

onBeforeUnmount(() => {
  releaseObjectUrls()
})
</script>

<style scoped>
.profile-section-title,
.profile-label,
.profile-value,
.hmo-reference-title,
.hmo-reference-summary-item span,
.hmo-reference-summary-item strong,
.hmo-reference-field label,
.hmo-reference-field input,
.hmo-profile-document-header h2,
.hmo-profile-document-empty {
  font-size: 12px;
}

.hmo-reference {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid var(--lgu-border);
  background: #ffffff;
}

.hmo-reference-summary {
  grid-column: 1 / -1;
  min-width: 0;
}

.hmo-reference-title {
  margin-bottom: 8px;
  font-family: "Montserrat", "Open Sans", sans-serif;
  font-weight: 800;
  color: var(--lgu-accent);
  text-transform: uppercase;
}

.hmo-reference-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.hmo-reference-summary-item {
  min-width: 0;
  border: 1px solid var(--lgu-border);
  padding: 7px 8px;
  background: #f8fafc;
}

.hmo-reference-summary-item span {
  display: block;
  margin-bottom: 3px;
  font-weight: 800;
  color: #4b5563;
  text-transform: uppercase;
}

.hmo-reference-summary-item strong {
  display: block;
  min-width: 0;
  color: #111827;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.hmo-reference-field {
  min-width: 0;
}

.hmo-reference-field label {
  display: block;
  margin-bottom: 4px;
  font-family: "Montserrat", "Open Sans", sans-serif;
  font-weight: 800;
  color: #111827;
  text-transform: uppercase;
}

.hmo-reference-field input {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--lgu-border);
  padding: 7px 8px;
  background: #ffffff;
  color: #111827;
  font: inherit;
}

.hmo-reference-field input[readonly] {
  background: #f8fafc;
}

.hmo-profile-documents {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

.hmo-profile-document {
  min-width: 0;
  border: 1px solid var(--lgu-border);
  background: #ffffff;
}

.hmo-profile-document-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 3px solid var(--lgu-accent);
}

.hmo-profile-document-header h2 {
  margin: 0;
  font-family: "Montserrat", "Open Sans", sans-serif;
  font-weight: 800;
  text-transform: uppercase;
}

.hmo-profile-document-header p {
  margin: 2px 0 0;
  color: #4b5563;
  word-break: break-word;
}

.hmo-profile-document-header span {
  flex: 0 0 auto;
  font-weight: 800;
  color: var(--lgu-accent);
  text-transform: uppercase;
}

.hmo-profile-document-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 330px;
  padding: 10px;
  background: #f8fafc;
}

.hmo-profile-document-frame img,
.hmo-profile-document-frame object {
  display: block;
  width: 100%;
  height: 330px;
  object-fit: contain;
  background: #ffffff;
}

.hmo-profile-document-empty {
  display: flex;
  min-height: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  color: #4b5563;
}

.hmo-profile-document-empty strong {
  color: #111827;
}

.approval-wrap {
  justify-content: flex-end;
}

@media screen and (max-width: 760px) {
  .hmo-reference,
  .hmo-profile-documents {
    grid-template-columns: 1fr;
  }

  .hmo-reference-summary-grid {
    grid-template-columns: 1fr;
  }
}

@media print {
  .profile-section-title,
  .profile-label,
  .profile-value,
  .hmo-reference-title,
  .hmo-reference-summary-item span,
  .hmo-reference-summary-item strong,
  .hmo-reference-field label,
  .hmo-reference-field input,
  .hmo-profile-document-header h2,
  .hmo-profile-document-header p,
  .hmo-profile-document-header span,
  .hmo-profile-document-empty {
    font-size: 9px !important;
  }

  .hmo-reference {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin-bottom: 8px !important;
    padding: 5px !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .hmo-reference-title {
    margin-bottom: 4px !important;
  }

  .hmo-reference-summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 5px !important;
  }

  .hmo-reference-summary-item {
    padding: 4px 5px !important;
  }

  .hmo-reference-field input {
    border: 1px solid var(--lgu-border) !important;
    padding: 4px 5px !important;
  }

  .hmo-profile-documents {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .hmo-profile-document,
  .hmo-profile-document-frame {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .hmo-profile-document-header {
    padding: 5px 6px !important;
  }

  .hmo-profile-document-frame {
    min-height: 250px !important;
    padding: 5px !important;
  }

  .hmo-profile-document-frame img,
  .hmo-profile-document-frame object {
    height: 250px !important;
  }
}
</style>
