<template>
  <main class="lgu-invoice-page min-h-screen bg-[#f5f5f5] text-black">
    <section class="mx-auto max-w-[1100px] px-4 py-4 print:px-0 print:py-0">
      <section class="lgu-invoice-sheet">
        <div class="lgu-invoice-top">
          <div class="flex flex-col items-start gap-1 w-full">
            <div class="flex items-center justify-between gap-4 w-full">
              <img class="lgu-invoice-logo" src="/app-logo.png" alt="PhysioAve" />
                        <div class="lgu-invoice-meta-grid">
              <slot name="meta" />
                        </div>
            </div>
            <div class="flex items-center justify-center w-full">
              <h1 class="lgu-invoice-title"><span>{{ title }}</span></h1>

            </div>
              <div class="flex items-center justify-center w-full">
              <span v-if="subtitle" class="lgu-invoice-subtitle">{{ subtitle }}</span>

            </div>
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

/* PAGE SHEET */
.lgu-invoice-sheet {
  background: #ffffff;
  width: 100%;
  max-width: 148mm;   /* A5 width */
  min-height: 210mm;
  margin: 0 auto;
  border: 1px solid #d1d5db;

  /* 🔥 FIX: reduce padding to avoid right cut */
  padding: 8px 8px;

  font-family: "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
}

/* HEADER */
.lgu-invoice-top {
  display: flex;
  gap: 8px;
  width: 100%;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}

.lgu-invoice-logo {
  max-height: 50px;
  width: auto;
}

/* TITLE */
.lgu-invoice-title {
  text-align: center;
  margin: 2px 0 0;
  font-size: 20px; /* slightly smaller to fit better */
  letter-spacing: 0.04em;
  font-weight: 800;
  color: #111827;
  font-family: "Bebas Neue", "Open Sans", sans-serif;
}

.lgu-invoice-subtitle {
  margin: 1px 0 0;
  font-size: 11px;
  line-height: 1;
  color: #374151;
  text-transform: uppercase;
}

/* META */
.lgu-invoice-meta-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1px 6px;
  font-size: 11px;
  padding-top: 4px;
  font-weight: 600;
}

/* PATIENT BOX */
.lgu-invoice-patient-doctor-grid {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 11px;

  border: 2px solid #d31d6e;
  padding: 8px;
  background: #fef5f9;
}

/* DIVIDER */
.lgu-invoice-divider {
  border-top: 2px solid #d31d6e;
  margin: 6px 0;
}

/* ================= TABLE FIX ================= */

.lgu-invoice-body table {
  width: 100%;
  border-collapse: collapse;

  /* 🔥 IMPORTANT FIX */
  table-layout: fixed;

  font-size: 11px;
}

.lgu-invoice-body th,
.lgu-invoice-body td {
  padding: 3px 4px;
  vertical-align: top;

  /* 🔥 prevent overflow cutting */
  word-break: break-word;
  overflow-wrap: break-word;
}

/* HEADER */
.lgu-invoice-body th {
  text-align: left;
  font-weight: 700;
  font-size: 10.5px;
  background: #f3f4f6;
  border-bottom: 2px solid #d31d6e;
}

/* BODY */
.lgu-invoice-body td {
  font-size: 10px;
  line-height: 1.2;
}

/* ================= BOTTOM ================= */

.lgu-invoice-bottom {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-top: 6px;
}

/* FOOTER */
.lgu-invoice-footer {
  margin-top: 6px;
  background: #1ea5d7;
  color: #0f172a;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px 6px;
  font-size: 10px;
  font-weight: 600;
}

/* ================= PRINT ================= */

@media print {
  @page {
    size: A5 portrait;
    margin: 4mm;
  }

  html,
  body {
    width: 100%;
    margin: 0;
    padding: 0;
    background: #fff;
  }

  .print\:hidden {
    display: none !important;
  }

  .lgu-invoice-page {
    width: 100%;
    min-height: auto;
    background: #fff;
  }

  .lgu-invoice-sheet {
    width: 100%;
    max-width: none;
    min-height: auto;
    margin: 0;
    padding: 0;
    border: none;
    overflow: visible;
  }

  .lgu-invoice-body,
  .lgu-invoice-body table {
    width: 100%;
    max-width: 100%;
  }

  .lgu-invoice-body table {
    table-layout: fixed;
    font-size: 9px;
  }

  .lgu-invoice-body th,
  .lgu-invoice-body td {
    padding: 2px;
    font-size: 8.5px;
    line-height: 1.15;
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .lgu-invoice-title {
    font-size: 18px;
  }

  .lgu-invoice-logo {
    max-height: 42px;
  }

  .lgu-invoice-meta-grid,
  .lgu-invoice-patient-doctor-grid {
    font-size: 9px;
  }

  .lgu-invoice-footer {
    background: #1ea5d7 !important;
    font-size: 8px;
  }
}
</style>
