<template>
  <PromosOffersWorkbench
    title="LGU"
    description="This page is reserved for LGU-funded pricing, monthly budget controls, rollover handling, and session-based utilization tracking."
    pricingModel="Budget-Governed Program Pricing"
    pricingNote="Rendered sessions should consume LGU allocation and support dropout adjustments, rollover amounts, and month-end billing totals."
    operationalFocus="Budget and Session Control"
    operationalNote="This area will coordinate session sequencing, patient eligibility, and billing adjustments under LGU rules."
    nextMilestone="LGU dashboard and ledger"
    milestoneNote="The next build step is adding budget cards, utilization summaries, and allocation-aware billing actions."
    :checklist="[
      'Set monthly base budget and rollover.',
      'Track session consumption against LGU allocation.',
      'Prevent treatment logging past approved limits.',
      'Generate adjustment charges for dropouts.'
    ]"
  />
</template>

<script setup lang="ts">
import PromosOffersWorkbench from "@/features/promos-offers/components/PromosOffersWorkbench.vue"
</script>
