<template>
  <main class="lgu-invoice-page min-h-screen bg-[#f5f5f5] text-black">
    <section class="lgu-invoice-container">
      <section class="lgu-invoice-sheet">
        <header class="lgu-invoice-top">
          <div class="lgu-invoice-heading">
            <img class="lgu-invoice-logo" src="/physioave-logo-dark-updated.png" alt="PhysioAve" />

            <div v-if="$slots.meta" class="lgu-invoice-meta-grid">
              <slot name="meta" />
            </div>
          </div>

          <div class="lgu-invoice-title-block">
            <h1 class="lgu-invoice-title">
              <span>{{ title }}</span>
            </h1>

          </div>
        </header>

        <div class="lgu-invoice-toolbar print:hidden">
          <slot name="toolbar">
            <Button label="Print" icon="pi pi-print" @click="printPage()" />
            <Button label="Close" icon="pi pi-times" severity="secondary" outlined @click="goBack" />
          </slot>
        </div>

        <div v-if="hasError" class="lgu-invoice-notice-box">
          <slot name="error" />
        </div>

        <template v-else>
          <div v-if="$slots.details" class="lgu-invoice-details">
            <slot name="details" />
          </div>

          <div class="lgu-invoice-body">
            <slot />
          </div>

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
import Button from "primevue/button"
import { useLguInvoicePrintActions } from "./lgu-invoice.shared"

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    hasError?: boolean
  }>(),
  {
    subtitle: "",
    hasError: false
  }
)

const { printPage, goBack } = useLguInvoicePrintActions()
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

.lgu-invoice-page {
  width: 100%;
  overflow-x: auto;
}

.lgu-invoice-container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 16px;
}

.lgu-invoice-sheet {
  width: 100%;
  max-width: 210mm;
  min-height: auto;
  margin: 0 auto;
  padding: 10mm;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  font-family: "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  color: #000000;
}

/* HEADER */
.lgu-invoice-top {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 10px;
}

.lgu-invoice-heading {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(110px, 1fr) minmax(260px, auto);
  align-items: center;
  gap: 12px;
}

.lgu-invoice-logo {
  display: block;
  max-height: 92px;
  width: auto;
  max-width: 340px;
  object-fit: contain;
}

.lgu-invoice-title-block {
  width: 100%;
  text-align: center;
}

/* TITLE */
.lgu-invoice-title {
  width: 100%;
  margin: 1px 0 0;
  text-align: center;
  font-size: clamp(20px, 2.2vw, 25px);
  line-height: 1.08;
  letter-spacing: 0.05em;
  font-weight: 800;
  color: #111827;
  font-family: "Bebas Neue", "Open Sans", sans-serif;
}

.lgu-invoice-title span {
  text-decoration: underline;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
}

.lgu-invoice-subtitle {
  margin: 4px auto 0;
  max-width: 760px;
  font-size: 11px;
  line-height: 1.25;
  color: #374151;
  text-align: center;
  text-transform: uppercase;
}

/* META */
.lgu-invoice-meta-grid {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 2px 8px;
  min-width: 0;
  width: min(420px, 100%);
  margin-left: auto;
  font-size: 11px;
  line-height: 1.25;
  font-family: "Open Sans", sans-serif;
  font-weight: 600;
}

.lgu-invoice-meta-grid strong {
  white-space: nowrap;
  font-weight: 800;
  font-family: "Bebas Neue", "Open Sans", sans-serif;
  letter-spacing: 0.06em;
}

.lgu-invoice-meta-grid span {
  min-width: 0;
  word-break: normal;
  overflow-wrap: anywhere;
}

.lgu-invoice-toolbar {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin: 8px 0 10px;
}

.lgu-invoice-details {
  width: 100%;
  margin: 8px 0 10px;
}

.lgu-invoice-body {
  width: 100%;
  min-width: 0;
}

/* ================= TABLE FIX ================= */

.lgu-invoice-body .table-wrap {
  width: 100%;
  overflow: visible;
}

.lgu-invoice-body table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.lgu-invoice-body th,
.lgu-invoice-body td {
  vertical-align: top;
  overflow-wrap: anywhere;
}

.lgu-invoice-body tbody tr.item-group-start td {
  border-top: 1px solid #d31d6e;
}

.lgu-invoice-body tbody tr.line-item-child td {
  border-top: 1px dashed #f3a8c8;
  color: #374151;
}

.lgu-invoice-body tbody tr.line-item-child td.text-right {
  color: #1f2937;
  font-weight: 600;
}

/* ================= BOTTOM ================= */

.lgu-invoice-bottom {
  width: 100%;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: flex-end;
  margin-top: 8px;
  break-inside: avoid;
  page-break-inside: avoid;
}

.lgu-invoice-notice-box {
  border: 1px solid #d1d5db;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  font-size: 12px;
}

.lgu-invoice-footer {
  width: 100%;
  margin-top: 8px;
  background: #1ea5d7;
  color: #fcfcfc;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px 8px;
  font-size: 9px;
  line-height: 1.2;
  font-weight: 700;
  text-align: center;
}

.lgu-invoice-footer span {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media screen and (max-width: 768px) {
  .lgu-invoice-container {
    padding: 10px;
  }

  .lgu-invoice-sheet {
    padding: 14px;
    border-radius: 8px;
  }

  .lgu-invoice-heading {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .lgu-invoice-meta-grid {
    width: 100%;
    max-width: none;
    margin-left: 0;
  }

  .lgu-invoice-footer {
    grid-template-columns: 1fr;
  }
}

@media print {
  /*
    Do not put @page here.
    The useLguInvoicePrintActions() utility controls auto portrait / landscape.
  */

  html,
  body {
    width: 100% !important;
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .print\:hidden,
  .lgu-invoice-toolbar {
    display: none !important;
  }

  .lgu-invoice-page {
    width: 100% !important;
    min-height: 0 !important;
    background: #ffffff !important;
    overflow: visible !important;
  }

  .lgu-invoice-container {
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .lgu-invoice-sheet {
    width: 100% !important;
    max-width: none !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 5mm !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  :global(html.lgu-print-portrait) .lgu-invoice-sheet {
    width: 210mm !important;
    max-width: 210mm !important;
  }

  :global(html.lgu-print-landscape) .lgu-invoice-sheet {
    width: 297mm !important;
    max-width: 297mm !important;
  }

  .lgu-invoice-top {
    gap: 4px !important;
    margin-bottom: 5px !important;
  }

  .lgu-invoice-heading {
    grid-template-columns: 95px minmax(0, 1fr) !important;
    gap: 8px !important;
    align-items: center;
  }

  .lgu-invoice-logo {
      max-height: 60px !important;
  width: auto !important;
  max-width: 280px !important;
  }

  .lgu-invoice-title {
    margin-top: 0 !important;
    font-size: 18px !important;
    line-height: 1 !important;
  }

  .lgu-invoice-subtitle {
    margin-top: 2px !important;
    font-size: 8px !important;
    line-height: 1.1 !important;
  }

  .lgu-invoice-meta-grid {
    width: auto !important;
    max-width: none !important;
    min-width: 0 !important;
    font-size: 8px !important;
    line-height: 1.1 !important;
    gap: 1px 5px !important;
  }

  .lgu-invoice-details {
    margin: 5px 0 6px !important;
  }

  .lgu-invoice-body table {
    table-layout: fixed !important;
    width: 100% !important;
    border-collapse: collapse !important;
  }

  .lgu-invoice-body th,
  .lgu-invoice-body td {
    padding-top: 2px !important;
    padding-bottom: 2px !important;
    line-height: 1.15 !important;
  }

  .lgu-invoice-bottom {
    margin-top: 5px !important;
    gap: 6px !important;
  }

  .lgu-invoice-footer {
    margin-top: 5px !important;
    padding: 3px 6px !important;
    font-size: 7.5px !important;
    line-height: 1.1 !important;
    background: #1ea5d7 !important;
    background-color: #1ea5d7 !important;
  }
}
</style>
