<template>
  <main class="app-page-shell space-y-5">
    <section class="app-section-card-comfy space-y-2">
      <h2 class="app-section-title">Promos & Offers</h2>
      <p class="text-sm opacity-75">
        Reference package rates for Patient Care. Values below are encoded from the provided 2026 promo matrix.
      </p>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <h3 class="app-section-title">Trials & Initial Assessments</h3>
      <DataTable :value="trialsAndAssessments" size="small" stripedRows>
        <Column field="service_category" header="Service Category" />
        <Column field="type" header="Type" />
        <Column field="regular_value" header="Regular Value" />
        <Column field="promo_price" header="Promo Price" />
        <Column field="validity_period" header="Validity" />
      </DataTable>
    </section>

    <section class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <article class="app-section-card-comfy space-y-3">
        <h3 class="app-section-title">Orthopedic Recovery Packages (COIP)</h3>
        <DataTable :value="orthopedicRecovery" size="small" stripedRows>
          <Column field="package_size" header="Package Size" />
          <Column field="regular_total" header="Regular Total" />
          <Column field="senior_pwd" header="Senior/PWD (20% Off)" />
          <Column field="promo_price" header="Promo Price" />
          <Column field="validity_period" header="Validity" />
        </DataTable>
      </article>

      <article class="app-section-card-comfy space-y-3">
        <h3 class="app-section-title">Orthopedic Maintenance Packages</h3>
        <DataTable :value="orthopedicMaintenance" size="small" stripedRows>
          <Column field="package_size" header="Package Size" />
          <Column field="regular_total" header="Regular Total" />
          <Column field="senior_pwd" header="Senior/PWD (20% Off)" />
          <Column field="promo_price" header="Promo Price" />
          <Column field="validity_period" header="Validity" />
        </DataTable>
      </article>
    </section>

    <section class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <article class="app-section-card-comfy space-y-3">
        <h3 class="app-section-title">Neurologic Recovery Packages (CNIP)</h3>
        <DataTable :value="neurologicRecovery" size="small" stripedRows>
          <Column field="package_type" header="Package Type" />
          <Column field="package_size" header="Package Size" />
          <Column field="regular_total" header="Regular Total" />
          <Column field="senior_pwd" header="Senior/PWD (20% Off)" />
          <Column field="promo_price" header="Promo Price" />
          <Column field="validity_period" header="Validity" />
        </DataTable>
      </article>

      <article class="app-section-card-comfy space-y-3">
        <h3 class="app-section-title">Neurologic Maintenance Packages</h3>
        <DataTable :value="neurologicMaintenance" size="small" stripedRows>
          <Column field="package_type" header="Package Type" />
          <Column field="package_size" header="Package Size" />
          <Column field="regular_total" header="Regular Total" />
          <Column field="senior_pwd" header="Senior/PWD (20% Off)" />
          <Column field="promo_price" header="Promo Price" />
          <Column field="validity_period" header="Validity" />
        </DataTable>
      </article>
    </section>

    <section class="app-section-card-comfy space-y-3">
      <h3 class="app-section-title">Rehab Basic / Pain Therapy</h3>
      <DataTable :value="rehabBasicPainTherapy" size="small" stripedRows>
        <Column field="package_size" header="Package Size" />
        <Column field="regular_total" header="Regular Total" />
        <Column field="senior_pwd" header="Senior/PWD (20% Off)" />
        <Column field="promo_price" header="Promo Price" />
        <Column field="validity_period" header="Validity" />
      </DataTable>
    </section>

    <section class="app-section-card-comfy space-y-2">
      <p class="text-sm font-semibold text-rose-600">
        Start with any Orthopedic/Neurologic Recovery Package and save 20% on every session thereafter.
      </p>
      <p class="text-xs opacity-80">
        Promotional rates are stand-alone and do not stack on top of Senior/PWD discounts.
      </p>
    </section>
  </main>
</template>

<script setup lang="ts">
import DataTable from "primevue/datatable"
import Column from "primevue/column"

interface TrialsAndAssessmentRow {
  service_category: string
  type: string
  regular_value: string
  promo_price: string
  validity_period: string
}

interface PackageRow {
  package_size: string
  regular_total: string
  senior_pwd: string
  promo_price: string
  validity_period: string
}

interface PackageWithTypeRow extends PackageRow {
  package_type: string
}

const trialsAndAssessments: TrialsAndAssessmentRow[] = [
  {service_category: "Starter Ortho", type: "Trial Session", regular_value: "₱1,900", promo_price: "₱1,199", validity_period: "1 day"},
  {service_category: "Starter Neuro", type: "Trial Session", regular_value: "₱1,350", promo_price: "₱999", validity_period: "1 day"},
  {service_category: "Comprehensive (COIP)", type: "Ortho Initial", regular_value: "₱2,800", promo_price: "₱2,499", validity_period: "1 day"},
  {service_category: "Comprehensive (CNIP)", type: "Neuro Initial", regular_value: "₱2,800", promo_price: "₱2,249", validity_period: "1 day"},
]

const orthopedicRecovery: PackageRow[] = [
  {package_size: "1 Session", regular_total: "₱2,800", senior_pwd: "₱2,500", promo_price: "₱2,249", validity_period: "1 day"},
  {package_size: "6 Sessions", regular_total: "₱10,300", senior_pwd: "₱8,240", promo_price: "₱7,999", validity_period: "45 days"},
  {package_size: "8 Sessions", regular_total: "₱13,300", senior_pwd: "₱10,640", promo_price: "₱10,499", validity_period: "60 days"},
  {package_size: "10 Sessions", regular_total: "₱16,300", senior_pwd: "₱13,040", promo_price: "₱13,499", validity_period: "60 days"},
  {package_size: "12 Sessions", regular_total: "₱19,300", senior_pwd: "₱15,440", promo_price: "₱15,999", validity_period: "60 days"},
]

const orthopedicMaintenance: PackageRow[] = [
  {package_size: "1 Session", regular_total: "₱1,500", senior_pwd: "₱1,200", promo_price: "₱1,200", validity_period: "60 days"},
  {package_size: "8 Sessions", regular_total: "₱12,000", senior_pwd: "₱9,600", promo_price: "₱9,600", validity_period: "60 days"},
  {package_size: "10 Sessions", regular_total: "₱15,000", senior_pwd: "₱12,000", promo_price: "₱12,000", validity_period: "60 days"},
  {package_size: "12 Sessions", regular_total: "₱18,000", senior_pwd: "₱14,400", promo_price: "₱14,400", validity_period: "60 days"},
]

const neurologicRecovery: PackageWithTypeRow[] = [
  {package_type: "45-Min Standard", package_size: "1 Session", regular_total: "₱2,550", senior_pwd: "₱2,360", promo_price: "₱2,249", validity_period: "1 day"},
  {package_type: "45-Min Standard", package_size: "8 Sessions", regular_total: "₱9,200", senior_pwd: "₱7,680", promo_price: "₱7,999", validity_period: "60 days"},
  {package_type: "45-Min Standard", package_size: "12 Sessions", regular_total: "₱13,000", senior_pwd: "₱10,720", promo_price: "₱11,999", validity_period: "90 days"},
  {package_type: "60-Min Intensive", package_size: "1 Session", regular_total: "₱2,800", senior_pwd: "₱2,560", promo_price: "₱2,249", validity_period: "1 day"},
  {package_type: "60-Min Intensive", package_size: "8 Sessions", regular_total: "₱11,200", senior_pwd: "₱9,280", promo_price: "₱9,499", validity_period: "60 days"},
  {package_type: "60-Min Intensive", package_size: "12 Sessions", regular_total: "₱16,000", senior_pwd: "₱13,120", promo_price: "₱13,499", validity_period: "90 days"},
  {package_type: "45-Min + Premium Machine", package_size: "1 Session", regular_total: "₱3,400", senior_pwd: "₱3,040", promo_price: "₱2,799", validity_period: "1 day"},
  {package_type: "45-Min + Premium Machine", package_size: "8 Sessions", regular_total: "₱16,000", senior_pwd: "₱13,120", promo_price: "₱12,800", validity_period: "60 days"},
  {package_type: "45-Min + Premium Machine", package_size: "12 Sessions", regular_total: "₱23,200", senior_pwd: "₱18,880", promo_price: "₱18,000", validity_period: "90 days"},
]

const neurologicMaintenance: PackageWithTypeRow[] = [
  {package_type: "45-Min Standard", package_size: "1 Session", regular_total: "₱950", senior_pwd: "₱760", promo_price: "₱760", validity_period: "1 day"},
  {package_type: "45-Min Standard", package_size: "8 Sessions", regular_total: "₱7,600", senior_pwd: "₱6,080", promo_price: "₱6,840", validity_period: "60 days"},
  {package_type: "45-Min Standard", package_size: "12 Sessions", regular_total: "₱11,400", senior_pwd: "₱9,120", promo_price: "₱10,260", validity_period: "90 days"},
  {package_type: "45-Min Standard", package_size: "24 Sessions", regular_total: "₱22,800", senior_pwd: "₱18,240", promo_price: "₱20,520", validity_period: "120 days"},
  {package_type: "60-Min Intensive", package_size: "1 Session", regular_total: "₱1,200", senior_pwd: "₱960", promo_price: "₱960", validity_period: "1 day"},
  {package_type: "60-Min Intensive", package_size: "8 Sessions", regular_total: "₱9,600", senior_pwd: "₱7,680", promo_price: "₱7,680", validity_period: "60 days"},
  {package_type: "60-Min Intensive", package_size: "12 Sessions", regular_total: "₱14,400", senior_pwd: "₱11,520", promo_price: "₱11,520", validity_period: "90 days"},
  {package_type: "60-Min Intensive", package_size: "24 Sessions", regular_total: "₱28,800", senior_pwd: "₱23,040", promo_price: "₱23,040", validity_period: "120 days"},
  {package_type: "45-Min + Premium Machine", package_size: "1 Session", regular_total: "₱1,800", senior_pwd: "₱1,440", promo_price: "₱1,440", validity_period: "1 day"},
  {package_type: "45-Min + Premium Machine", package_size: "8 Sessions", regular_total: "₱14,400", senior_pwd: "₱11,520", promo_price: "₱11,520", validity_period: "60 days"},
  {package_type: "45-Min + Premium Machine", package_size: "12 Sessions", regular_total: "₱21,600", senior_pwd: "₱17,280", promo_price: "₱17,280", validity_period: "90 days"},
  {package_type: "45-Min + Premium Machine", package_size: "24 Sessions", regular_total: "₱43,200", senior_pwd: "₱34,560", promo_price: "₱34,560", validity_period: "120 days"},
]

const rehabBasicPainTherapy: PackageRow[] = [
  {package_size: "1 Session (Gapan Branch Only)", regular_total: "₱1,000", senior_pwd: "₱800", promo_price: "₱800", validity_period: "1 day"},
  {package_size: "8 Sessions", regular_total: "₱8,000", senior_pwd: "₱6,400", promo_price: "₱6,400", validity_period: "30 days"},
  {package_size: "12 Sessions", regular_total: "₱12,000", senior_pwd: "₱9,600", promo_price: "₱9,600", validity_period: "60 days"},
  {package_size: "16 Sessions", regular_total: "₱16,000", senior_pwd: "₱12,800", promo_price: "₱12,800", validity_period: "120 days"},
  {package_size: "24 Sessions", regular_total: "₱24,000", senior_pwd: "₱19,200", promo_price: "₱19,200", validity_period: "180 days"},
]
</script>

