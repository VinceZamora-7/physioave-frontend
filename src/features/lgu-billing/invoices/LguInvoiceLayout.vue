<template>
  <main class="lgu-invoice-page min-h-screen bg-[#f5f5f5] text-black">
    <section class="mx-auto max-w-[1100px] px-4 py-4 print:px-0 print:py-0">
      <section class="lgu-invoice-sheet">
        <div class="lgu-invoice-top">
          <div>
            <img class="lgu-invoice-logo" src="/app-logo.png" alt="PhysioAve" />
            <h1 class="lgu-invoice-title"><span>{{ title }}</span></h1>
            <p v-if="subtitle" class="lgu-invoice-subtitle">{{ subtitle }}</p>
          </div>
          <div class="lgu-invoice-meta-grid">
            <slot name="meta" />
          </div>
        </div>

        <div class="lgu-invoice-toolbar print:hidden">
          <slot name="toolbar">
            <Button label="Print" icon="pi pi-print" @click="printPage" />
            <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
          </slot>
        </div>

        <div v-if="hasError" class="lgu-invoice-notice-box">
          <slot name="error" />
        </div>

        <template v-else>
          <div v-if="$slots.details" class="lgu-invoice-patient-doctor-grid">
            <slot name="details" />
          </div>

          <div v-if="$slots.details" class="lgu-invoice-divider" />

          <div class="lgu-invoice-body">
            <slot />
          </div>

          <div v-if="$slots.bottom" class="lgu-invoice-divider" />

          <div v-if="$slots.bottom" class="lgu-invoice-bottom">
            <slot name="bottom" />
          </div>

          <footer class="lgu-invoice-footer">
            <span>www.physioave.com</span>
            <span>+63-965-571-2455</span>
            <span>admin@physioave.com</span>
          </footer>
        </template>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router"
import Button from "primevue/button"

withDefaults(defineProps<{
  title: string
  subtitle?: string
  hasError?: boolean
}>(), {
  subtitle: "",
  hasError: false
})

const router = useRouter()

const printPage = (): void => window.print()
const goBack = (): void => router.back()
</script>

<style>
@import "./lgu-invoice.shared.css";
@import url("https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&family=Bebas+Neue&display=swap");

.lgu-invoice-page,
.lgu-invoice-page * {
  box-sizing: border-box;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.lgu-invoice-sheet {
  background: #ffffff;
  width: 100%;
  max-width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  border: 1px solid #d1d5db;
  padding: 12px 16px 10px;
  font-family: "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
}

.lgu-invoice-top {
  display: flex;
  gap: 10px;
  width: 100%;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 8px;
}

.lgu-invoice-logo {
  max-height: 60px;
  width: auto;
}

.lgu-invoice-title {
  text-align: center;
  margin: 4px 0 0;
  font-size: 24px;
  letter-spacing: 0.05em;
  font-weight: 800;
  color: #111827;
  font-family: "Bebas Neue Cyrillic", "Bebas Neue", "Open Sans", sans-serif;
}

.lgu-invoice-title span {
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
}

.lgu-invoice-subtitle {
  margin: 6px 0 0;
  max-width: 640px;
  font-size: 12px;
  line-height: 1.45;
  color: #374151;
}

.lgu-invoice-meta-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 2px 8px;
  font-size: 12px;
  padding-top: 6px;
  font-family: "Open Sans", sans-serif;
  font-weight: 600;
}

.lgu-invoice-meta-grid strong {
  white-space: nowrap;
  font-weight: 700;
  font-family: "Bebas Neue Cyrillic", "Bebas Neue", "Open Sans", sans-serif;
  letter-spacing: 0.06em;
}

.lgu-invoice-patient-doctor-grid {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  gap: 16px;
  font-size: 12px;
  line-height: 1.5;
  border: 2px solid #d31d6e;
  padding: 10px;
  background: #fef5f9;
}

.lgu-invoice-patient-doctor-grid > div {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lgu-invoice-divider {
  border-top: 3px solid #d31d6e;
  margin-top: 8px;
  margin-bottom: 4px;
}

.lgu-invoice-body table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
  font-size: 12px;
  font-family: "Open Sans", sans-serif;
}

.lgu-invoice-body th,
.lgu-invoice-body td {
  padding: 3px 6px;
  vertical-align: top;
}

.lgu-invoice-body th {
  text-align: left;
  font-weight: 700;
  font-family: "Bebas Neue Cyrillic", "Bebas Neue", "Open Sans", sans-serif;
  letter-spacing: 0.08em;
  background: #f3f4f6;
  border-bottom: 2px solid #d31d6e;
}

.lgu-invoice-body tbody tr.item-group-start td {
  border-top: 2px solid #d31d6e;
}

.lgu-invoice-body tbody tr.line-item-child td {
  border-top: 1px dashed #f3a8c8;
  color: #374151;
}

.lgu-invoice-body tbody tr.line-item-child td.text-right {
  color: #1f2937;
  font-weight: 600;
}

.lgu-invoice-body tbody tr:first-child td {
  border-top: none;
}

.lgu-invoice-bottom {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-top: 8px;
}

.lgu-invoice-notice-box {
  border: 1px solid #d1d5db;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  font-size: 12px;
}

.lgu-invoice-footer {
  margin-top: 8px;
  background: #1ea5d7;
  color: #0f172a;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-family: "Open Sans", sans-serif;
  font-weight: 600;
}

.lgu-invoice-footer span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lgu-invoice-toolbar {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin: 8px 0 10px;
}

@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }

  body {
    background: #ffffff;
    padding: 0;
  }

  .print\:hidden {
    display: none !important;
  }

  .lgu-invoice-page {
    background: #ffffff;
  }

  .lgu-invoice-sheet {
    width: 100%;
    max-width: 297mm;
    min-height: 210mm;
    border: none;
  }

  .lgu-invoice-footer {
    background: #1ea5d7 !important;
    background-color: #1ea5d7 !important;
  }
}
</style>
