import type {QueryClient} from "@tanstack/vue-query"
import {
  billingPhase1Service,
  type BillingContext
} from "@/features/billing/api/billing-phase1.service"
import {BillingTanstackKey} from "@/utils/keys/tanstack-key"

export const billingContextTanstackService = {
  fetchContext(
    queryClient: QueryClient,
    billingId: number,
    key: BillingTanstackKey = BillingTanstackKey.BILLING_CONTEXT
  ) {
    return queryClient.fetchQuery<BillingContext | undefined>({
      queryKey: [key, billingId],
      queryFn: () => billingPhase1Service.getContext(billingId),
      staleTime: 1000 * 60 * 5,
    })
  },
}
