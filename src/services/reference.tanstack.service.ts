import {type QueryClient} from "@tanstack/vue-query";
import {createReferenceService, type ReferenceService} from "@/services/reference.service.ts";
import type {Reference} from "@/models/reference.ts";
import type {Pageable} from "@/models/paging.ts";
import type {ReferenceTanstackKey} from "@/utils/keys/tanstack-key.ts";

export const createReferenceQueryService = <T extends Reference>(queryClient: QueryClient, key: ReferenceTanstackKey, params: Record<string, any>) => {
  const referenceService: ReferenceService<T> = createReferenceService<T>(key)
  return queryClient.fetchQuery<Pageable<T> | undefined>({
    queryKey: [key, params],
    queryFn: () => referenceService.getAll(params),
    retry: 2
  })
}
