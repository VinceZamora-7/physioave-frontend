<template>
  <main class="app-page-shell">
    <Message v-if="isError" severity="error" class="mb-3"> Something went wrong!</Message>
    <section
      v-else
      class="app-section-card"
    >
      <DataTable
      :value="refreshTokens?.content"
      show-gridlines
      :removableSort="true"
      scrollable
      :pt="{
        root: { class: 'flex flex-col h-full' },
        column: {
          headerCell: {
            class: 'text-center',
          },
          bodyCell: { class: 'text-center' },
          columnTitle: { class: 'mx-auto font-semibold' },
        },

      }"
    >
      <template v-slot:header>
        <section class="flex flex-col gap-3 text-[rgb(var(--app-fg))]">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <IftaLabel class="w-full sm:w-60">
              <Select
                v-model="selectedStatus"
                :fluid="true"
                :loading="isLoading"
                :options="statuses"
                :filter="true"
                class="w-full">
                <template v-slot:value="slotProps">
                  <div v-if="slotProps.value" class="flex items-center">
                    <div>{{ slotProps.value }}</div>
                  </div>
                  <span v-else>
                {{ slotProps.placeholder }}
              </span>
                </template>
                <template v-slot:option="slotProps">
                  <div class="flex items-center">
                    <div>{{ slotProps.option }}</div>
                  </div>
                </template>
              </Select>
              <label for="patientStatus">Status</label>
            </IftaLabel>
            <Button
              label="Reset filters"
              variant="outlined"
              size="small"
              class="w-full sm:w-auto"
              :loading="isLoading"
              icon="pi pi-filter-slash"
              @click="resetFilters"
            />
            </div>
          </div>
          <div class="h-px w-full bg-[rgb(var(--app-border))] opacity-80" />
        </section>
      </template>

      <template v-slot:empty>
        <div class="text-center font-bold text-2xl">
          <SkeletonLoader :loading="isLoading">
            <span>No records found.</span>
          </SkeletonLoader>
        </div>
      </template>

      <Column :sortable="true" header="Expires at" field="expires_at">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <Tag :severity="'info'"
                 :value="slotProps.data?.expires_at_formatted"/>
          </SkeletonLoader>
        </template>
      </Column>

      <Column :sortable="true" header="Revoked at" field="revoked_at">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <Tag :severity="slotProps.data.is_revoked ? 'danger' : 'success'"
                 :value="slotProps.data.is_revoked ? `${slotProps.data?.revoked_at_formatted} (invalid)` : 'valid' "/>
          </SkeletonLoader>
        </template>
      </Column>

      <Column header="Actions">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <i v-tooltip.left="'This token is already been revoked'"
               class="pi pi-exclamation-circle" v-if="slotProps.data?.is_revoked"></i>
            <Button
              v-else
              @click="onRevoke(slotProps.data)"
              :loading="isLoading"
              label="Revoke"
              icon="pi pi-trash"
              severity="danger"
              type="button"
            />
          </SkeletonLoader>
        </template>
      </Column>

      <template v-slot:footer>
        <Paginator
          current-page-report-template="Showing {first} to {last} of {totalRecords} records (Page {currentPage} of {totalPages})"
          template="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown JumpToPageInput"
          :first="(page - 1) * pageSize"
          :rows="pageSize"
          :totalRecords="refreshTokens?.total_elements"
          :rowsPerPageOptions="rowPerPageOptions"
          @page="onPageChangeDebounceFn($event, refetch)"
        />
      </template>
      </DataTable>
    </section>
  </main>
</template>

<script setup lang="ts">
import Message from "primevue/message";

import {useRefreshToken} from "@/composables/refresh-token.composable.ts";
import DataTable from "primevue/datatable";
import SkeletonLoader from "@/composables/SkeletonLoader.vue";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";
import {defaultFilterDebounce, rowPerPageOptions, Status, statuses} from "@/utils/global.type.ts";
import Select from "primevue/select";
import IftaLabel from "primevue/iftalabel";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import type {RefreshToken} from "@/features/refresh-tokens/types/refresh-token";
import {errorToast, successToast} from "@/utils/toast.util.ts";
import type {APIError} from "@/utils/error-handler.ts";
import {useQueryClient} from "@tanstack/vue-query";
import {Paginator, useConfirm, useToast} from "primevue";
import {usePaginationDebounce} from "@/composables/pagination-debounce.composable.ts";
import {defaultStatus, type Pageable, type PageRequestWithStatus} from "@/models/paging.ts";
import {watchDebounced} from "@vueuse/core";
import {computed, ref} from "vue";
import {RefreshTokenTanstackKey} from "@/utils/keys/tanstack-key.ts";
import {refreshTokenTanstackService} from "@/features/refresh-tokens/queries/refresh-token.tanstack.service";

const queryClient = useQueryClient()
const toast = useToast()
const confirm = useConfirm()

const isLoading = useIsLoading(RefreshTokenTanstackKey.REFRESH_TOKENS)

const selectedStatus = ref<Status>(defaultStatus)
const {
  page,
  pageSize,
  onPageChangeDebounceFn
} = usePaginationDebounce<Pageable<RefreshToken> | undefined>()

watchDebounced(
  [selectedStatus],
  async (): Promise<void> => {
    page.value = 1
    await refetch()
  },
  {debounce: defaultFilterDebounce}
)

const resetFilters = (): void => {
  selectedStatus.value = defaultStatus
}

const pageRequestWithStatus = computed(() => ({
  page: page.value,
  size: pageSize.value,
  status: selectedStatus.value
}) satisfies PageRequestWithStatus)

const {
  data: refreshTokens,
  isError,
  error,
  refetch
} = refreshTokenTanstackService.getAll(pageRequestWithStatus)
useRefreshToken<Pageable<RefreshToken> | undefined>(error, refetch)

const {mutate} = refreshTokenTanstackService.delete()

const onRevoke = (refreshToken: RefreshToken): void => {
  confirm.require({
    message: `Are you sure you want to revoke this refresh token? The user will be logged out from this session and will need to log in again.`,
    header: `Revoke Token Confirmation`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isLoading
    },
    acceptProps: {
      label: `Revoke Token`,
      severity: `danger`,
      icon: `pi pi-ban`,
      loading: isLoading
    },
    accept: (): void => {
      mutate(refreshToken.id, {
        async onSuccess(): Promise<void> {
          successToast(toast, 'Token revoked successfully')
          await resetQueries()
        },
        async onError(error: APIError): Promise<void> {
          errorToast(toast, `Failed to revoke token: ${error.message}`)
          await resetQueries()
        },
      })
    },
  })
}

const resetQueries = async (): Promise<void> => {
  await queryClient.invalidateQueries({queryKey: [RefreshTokenTanstackKey.REFRESH_TOKENS]})
}
</script>


