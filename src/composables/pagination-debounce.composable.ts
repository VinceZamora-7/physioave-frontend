import {ref} from "vue";
import {useDebounceFn} from "@vueuse/core";
import type {PageState} from "primevue";
import type {QueryObserverResult, RefetchOptions} from "@tanstack/vue-query";

export const usePaginationDebounce = <TData>(ms: number = 1000) => {
  const page = ref<number>(1)
  const pageSize = ref<number>(5)

  const onPageChangeDebounceFn = useDebounceFn(async (event: PageState, refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<TData>>): Promise<void> => {
    const selectedPage: number = event.page + 1
    if (page.value === selectedPage && pageSize.value === event.rows) return

    page.value = selectedPage
    pageSize.value = event.rows
    await refetch()
  }, ms)

  return {
    page,
    pageSize,
    onPageChangeDebounceFn
  }
}
