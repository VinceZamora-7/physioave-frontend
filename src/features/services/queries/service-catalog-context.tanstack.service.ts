import type { QueryClient } from "@tanstack/vue-query";
import {
  serviceCatalogContextService,
  type ServiceCatalogContext,
  type ServiceCatalogContextParams,
} from "@/features/services/api/service-catalog-context.service";
import { ServiceCatalogTanstackKey } from "@/utils/keys/tanstack-key";

export const serviceCatalogContextTanstackService = {
  fetchContext(
    queryClient: QueryClient,
    params: ServiceCatalogContextParams = {},
    key: ServiceCatalogTanstackKey = ServiceCatalogTanstackKey.SERVICE_CATALOG_CONTEXT
  ) {
    const scope = params.scope ?? "GLOBAL";
    const hmoId = params.hmo_id ?? null;
    return queryClient.fetchQuery<ServiceCatalogContext | undefined>({
      queryKey: [key, scope, hmoId],
      queryFn: () => serviceCatalogContextService.getContext({ scope, hmo_id: hmoId }),
      staleTime: 1000 * 60 * 5,
    });
  },
};
