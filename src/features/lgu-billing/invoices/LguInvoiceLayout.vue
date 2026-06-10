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
  padding: 12px 16px 10px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  font-family: "Open Sans", "Segoe UI", Tahoma, Arial, sans-serif;
  color: #000000;
}

/* HEADER */
.lgu-invoice-top {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.lgu-invoice-heading {
  width: 100%;
  min-width: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.lgu-invoice-logo {
  display: block;
  max-height: 92px;
  width: auto;
  flex-shrink: 0;
}

.lgu-invoice-title-block {
  width: 100%;
  text-align: center;
}

/* TITLE */
.lgu-invoice-title {
  width: 100%;
  margin: 2px 0 0;
  text-align: center;
  font-size: clamp(20px, 2.2vw, 24px);
  line-height: 1.1;
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
  font-size: 12px;
  line-height: 1.35;
  color: #374151;
  text-align: center;
  text-transform: uppercase;
}

/* META */
.lgu-invoice-meta-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 2px 8px;
  min-width: min(320px, 100%);
  max-width: 420px;
  font-size: 12px;
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
  word-break: break-word;
  overflow-wrap: anywhere;
}

.lgu-invoice-toolbar {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin: 8px 0 10px;
}

.lgu-invoice-details {
  margin: 15px 0px;
  width: 100%;
}

.lgu-invoice-body {
  width: 100%;
}

.lgu-invoice-body table {
  width: 100%;
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
  margin-top: 1px;
}

.lgu-invoice-notice-box {
  border: 1px solid #d1d5db;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  font-size: 12px;
}

.lgu-invoice-footer {
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

  .lgu-invoice-heading {
    flex-direction: column;
    gap: 8px;
  }

  .lgu-invoice-meta-grid {
    width: 100%;
    max-width: none;
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

  body {
    background: #ffffff !important;
    padding: 0 !important;
    margin: 0 !important;
  }

.print\:hidden,
.lgu-invoice-toolbar {
  display: none !important;
}

  .lgu-invoice-page {
    width: auto !important;
    min-width: 0 !important;
    max-width: none !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    background: #ffffff !important;
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
    min-width: 0 !important;
    min-height: 0 !important;
    height: auto !important;
    margin: 0 auto !important;
    padding: 5mm !important;
    border: none !important;
    background: #ffffff !important;
    box-shadow: none !important;
  }

  .lgu-invoice-top {
    width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
    margin-bottom: 5px !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .lgu-invoice-heading {
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }

  .lgu-invoice-logo {
    max-height: 42px !important;
    width: auto !important;
    flex-shrink: 0 !important;
  }

  .lgu-invoice-title-block {
    width: 100% !important;
    text-align: center !important;
  }

  .lgu-invoice-title {
    margin: 1px 0 0 !important;
    width: 100% !important;
    text-align: center !important;
    font-size: 20px !important;
    line-height: 1.1 !important;
  }


  .lgu-invoice-meta-grid {
    gap: 1px 5px !important;
    min-width: 180px !important;
    max-width: 260px !important;
    width: auto !important;
    padding-top: 0 !important;
    font-size: 10px !important;
    line-height: 1.15 !important;
  }

  .lgu-invoice-details {
    margin-top: 5px !important;
  }

  .lgu-invoice-divider {
    border-top: 2px solid #d31d6e !important;
    margin-top: 5px !important;
    margin-bottom: 3px !important;
  }

  .lgu-invoice-bottom {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
      margin-top: 1px !important;
  }

  .lgu-invoice-footer {
    margin-top: 1px !important;
    padding: 3px 6px !important;
    font-size: 7.5px !important;
    background: #1ea5d7 !important;
    background-color: #1ea5d7 !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
    color: #fcfcfc !important;
  }

  html.lgu-print-portrait .lgu-invoice-heading,
  html.lgu-print-landscape .lgu-invoice-heading {
    flex-direction: row !important;
  }

  html.lgu-print-portrait .lgu-invoice-title,
  html.lgu-print-landscape .lgu-invoice-title {
    text-align: center !important;
  }

  html.lgu-print-portrait .lgu-invoice-meta-grid {
    max-width: 230px !important;
  }

  html.lgu-print-landscape .lgu-invoice-meta-grid {
    max-width: 300px !important;
  }
}

</style>
