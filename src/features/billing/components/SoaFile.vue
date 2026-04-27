<template>
  <div class="soa-container">
    <div class="soa-header">
      <h2>Statement of Account (SOA)</h2>
      <div class="soa-actions">
        <Button v-if="showPrint" icon="pi pi-print" label="Print" @click="printSOA" />
      </div>
    </div>
    <table class="soa-table">
      <thead>
        <tr>
          <th>ITEM No.</th>
          <th>PATIENT NAME</th>
          <th>REFERENCE NO.</th>
          <th>PROGRAM STATUS</th>
          <th>TREATMENT DATE</th>
          <th>PT SERVICE RENDERED</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, idx) in rows" :key="row.referenceNo + idx">
          <td>{{ idx + 1 }}</td>
          <td class="patient">{{ row.patientName }}</td>
          <td>{{ row.referenceNo }}</td>
          <td>{{ row.programStatus }}</td>
          <td>{{ row.treatmentDate }}</td>
          <td>{{ row.ptService }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { defineProps } from 'vue'

interface SoaRow {
  patientName: string
  referenceNo: string
  programStatus: string
  treatmentDate: string
  ptService: string
}

defineProps<{
  rows: SoaRow[]
  showPrint?: boolean
}>()

const printSOA = () => {
  const printContent = document.querySelector('.soa-container')?.innerHTML
  const win = window.open('', '_blank')
  if (!win || !printContent) return
  win.document.write(`
    <html>
    <head>
      <title>SOA - Statement of Account</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; }
        h2 { margin-bottom: 8px; }
        table { border-collapse: collapse; width: 100%; margin-top: 16px; }
        th, td { border: 1px solid #888; padding: 6px 10px; font-size: 13px; }
        th { background: #f0f0f0; }
        tr:nth-child(even) { background: #fafafa; }
        .patient { font-weight: bold; }
      </style>
    </head>
    <body>
      ${printContent}
    </body>
    </html>
  `)
  win.document.close()
  win.print()
}
</script>

<style scoped>
.soa-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  padding: 32px 24px;
  max-width: 900px;
  margin: 0 auto;
}
.soa-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.soa-table {
  width: 100%;
  margin-top: 16px;
}
.soa-table th, .soa-table td {
  border: 1px solid #888;
  padding: 6px 10px;
  font-size: 13px;
}
.soa-table th {
  background: #f0f0f0;
}
.soa-table tr:nth-child(even) {
  background: #fafafa;
}
.patient {
  font-weight: bold;
}
.soa-actions {
  margin-left: auto;
}
</style>
