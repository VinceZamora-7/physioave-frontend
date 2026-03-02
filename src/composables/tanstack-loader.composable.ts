import {computed, type ComputedRef} from "vue";
import {useIsFetching, useIsMutating} from "@tanstack/vue-query";

export const useIsLoading = (key: string): ComputedRef<boolean> => {
  const isFetching = useIsFetching({queryKey: [key]})
  const isMutating = useIsMutating({mutationKey: [key]})
  return computed<boolean>(() => isFetching.value > 0 || isMutating.value > 0)
}
