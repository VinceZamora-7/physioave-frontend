<template>
  <main class="app-page-shell">
    <Message v-if="isError" severity="error" class="mb-3"> Something went wrong!</Message>
    <section
      v-else
      class="app-section-card"
    >
      <DataTable
      :value="offers?.content"
      :show-gridlines="true"
      :removable-sort="true"
      :scrollable="true"
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
            <IconField>
              <InputIcon :class="[isLoading ? 'pi pi-spinner' : 'pi pi-search']"/>
              <InputText
                v-model="selectedSearch"
                placeholder="Search by name"
                size="small"
                class="w-full sm:w-80 border focus:border-soft-light"
              />
            </IconField>
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
              <label for="hmoStatus">Status</label>
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
            <div class="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:ml-auto lg:justify-end">
            <Button
              :loading="isLoading"
              icon="pi pi-save"
              severity="primary"
              label="Save Technique"
              size="small"
              class="w-full sm:w-auto"
              @click="onSave"
            />
            <Button
              :loading="isExportLoading"
              icon="pi pi-file-export"
              severity="primary"
              label="Export"
              size="small"
              class="w-full sm:w-auto"
              @click="onExportToExcelThrottleFn"
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

      <Column :sortable="true" header="Name" field="name">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            {{ slotProps.data?.name }}
          </SkeletonLoader>
        </template>
      </Column>

      <Column :sortable="true" header="Price" field="price">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            ₱ {{ slotProps.data?.price }}
          </SkeletonLoader>
        </template>
      </Column>

      <Column header="Status" field="is_active">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <Tag :severity="slotProps.data.is_active ? 'success' : 'danger'"
                 :value="statusLabel(slotProps.data?.is_active)"/>
          </SkeletonLoader>
        </template>
      </Column>

      <Column header="Actions">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <Button
              :loading="isLoading"
              icon="pi pi-ellipsis-v"
              class="p-button-text p-button-secondary"
              @click="toggleMenuButtons(slotProps.data?.id, $event)"
            />
            <Menu
              :model="menuButtons(slotProps.data)"
              :popup="true"
              :ref="(element) => addMenu(slotProps.data?.id, element)"
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
          :totalRecords="offers?.total_elements"
          :rowsPerPageOptions="rowPerPageOptions"
          @page="onPageChangeDebounceFn($event, refetch)"
        />
      </template>
      </DataTable>
      <OfferForm ref="offerForm" v-bind="offerFormProps" @on-submit="onSubmit"/>
    </section>
  </main>
</template>

<script setup lang="ts">


import {useRefreshToken} from "@/composables/refresh-token.composable.ts";
import {
  defaultStatus,
  type Pageable,
  type PageableRequest,
  type PageRequestWithNameAndStatus
} from "@/models/paging.ts";
import type {OfferEditPayload, OfferRequest, Technique} from "@/features/offers/types/offer";
import {computed, ref, useTemplateRef} from "vue";
import {
  defaultFilterDebounce,
  defaultThrottle,
  rowPerPageOptions,
  Status,
  statuses
} from "@/utils/global.type.ts";
import {usePaginationDebounce} from "@/composables/pagination-debounce.composable.ts";
import {useThrottleFn, watchDebounced} from "@vueuse/core";
import {techniqueTanstackService} from "@/features/techniques/queries/technique.tanstack.service";
import Paginator from "primevue/paginator";
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";
import {useQueryClient} from "@tanstack/vue-query";
import {useMenuButtons} from "@/composables/menu-buttons.composable.ts";
import Select from "primevue/select";
import InputIcon from "primevue/inputicon";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import SkeletonLoader from "@/composables/SkeletonLoader.vue";
import Tag from "primevue/tag";
import Button from "primevue/button";
import IconField from "primevue/iconfield";
import Message from "primevue/message";
import IftaLabel from "primevue/iftalabel";
import Menu from "primevue/menu";
import InputText from "primevue/inputtext";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";
import {TechniqueTanstackKey} from "@/utils/keys/tanstack-key.ts";
import type {AxiosResponse} from "axios";
import {exportToExcel} from "@/utils/export-excel.util.ts";
import type {MenuItem} from "primevue/menuitem";
import {getApiErrorMessage} from "@/utils/actionable-error.util";
import {errorToast, successToast, warningToast} from "@/utils/toast.util.ts";
import type {APIError} from "@/utils/error-handler.ts";
import OfferForm from "@/features/offers/components/OfferForm.vue";
import type {OfferFormProps} from "@/features/offers/components/offer.type";
import type {FormSubmitEvent} from "@primevue/forms";
import type {OfferFormState} from "@/features/offers/schema/offer.schema";

const offerForm = useTemplateRef<InstanceType<typeof OfferForm>>('offerForm')

const isOfferLoading = useIsLoading(TechniqueTanstackKey.TECHNIQUES)
const isExportLoading = useIsLoading(TechniqueTanstackKey.TECHNIQUES_EXPORT)
const isLoading = computed<boolean>(() => isOfferLoading.value || isExportLoading.value)

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const {add: addMenu, toggle: toggleMenuButtons} = useMenuButtons()

const selectedOffer = ref<Technique | undefined>()

const selectedSearch = ref<string | undefined>()
const selectedStatus = ref<Status>(defaultStatus)
const {
  page,
  pageSize,
  onPageChangeDebounceFn
} = usePaginationDebounce<Pageable<Technique> | undefined>()

watchDebounced(
  [selectedSearch, selectedStatus],
  async (): Promise<void> => {
    page.value = 1
    await refetch()
  },
  {debounce: defaultFilterDebounce},
)

const offerFormProps = computed(() => ({
  selectedOffer: selectedOffer.value,
  isLoading: isLoading.value,
  buttonProps: {
    label: selectedOffer.value ? `Edit ${selectedOffer.value.name}` : `Save Clinic`,
    icon: selectedOffer.value ? 'pi pi-pen-to-square' : 'pi pi-save',
    severity: selectedOffer.value ? 'success' : 'info'
  },
}) satisfies OfferFormProps<any>)

const requestParams = computed(() => ({
  page: page.value,
  size: pageSize.value,
  name: selectedSearch.value,
  status: selectedStatus.value
}) satisfies PageableRequest)

const {
  data: offers,
  isError,
  error,
  refetch
} = techniqueTanstackService.getAll(requestParams)
useRefreshToken<Pageable<Technique> | undefined>(error, refetch)


const {
  mutate: toggleStatusMutation
} = techniqueTanstackService.toggleStatus()

const {
  mutate: saveMutation
} = techniqueTanstackService.save()

const {
  mutate: updateMutation
} = techniqueTanstackService.update()

const resetFilters = (): void => {
  selectedSearch.value = undefined
  selectedStatus.value = defaultStatus
}

const statusLabel = (isActive: boolean): string => {
  return isActive ? 'Active' : 'Inactive'
}

const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  return getApiErrorMessage(error, {
    baseMessage: fallback,
    permissionHint: "Technique access (Can Edit) in Role Access",
    invalidInputHint: "Technique values are invalid. Review name and price, then try again.",
    retryHint: "Please try again."
  })
}

const editFn = (payload: OfferEditPayload): void => {
  updateMutation(payload, {
    async onSuccess() {
      offerForm.value?.toggleDialog()
      successToast(toast, 'Edit success')
      await resetQueries()
    },
    async onError(error: APIError) {
      errorToast(toast, extractApiErrorMessage(error, "Technique edit failed"))
      await resetQueries()
    },
  })
}

const saveFn = (request: OfferRequest): void => {
  saveMutation(request, {
    async onSuccess() {
      offerForm.value?.toggleDialog()
      successToast(toast, 'Save success')
      await resetQueries()
    },
    async onError(error: APIError) {
      errorToast(toast, extractApiErrorMessage(error, "Technique save failed"))
      await resetQueries()
    },
  })
}

const onSubmit = (event: FormSubmitEvent<OfferFormState>): void => {
  confirm.require({
    message: 'Are you sure you want to proceed?',
    header: `${offerFormProps.value.buttonProps.label} Confirmation`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isLoading
    },
    acceptProps: {
      label: `${offerFormProps.value.buttonProps.label}`,
      severity: `${offerFormProps.value.buttonProps.severity}`,
      icon: `${offerFormProps.value.buttonProps.icon}`,
      loading: isLoading
    },
    accept: () => {
      const request: OfferRequest = {
        name: event.values.name,
        price: event.values.price
      }

      if (selectedOffer.value) {
        const payload: OfferEditPayload = {
          id: selectedOffer.value.id,
          ...request
        }
        editFn(payload)
        return
      }

      saveFn(request)
    }
  })
}


const onExportToExcelThrottleFn = useThrottleFn(async (): Promise<void> => {
  const request: PageRequestWithNameAndStatus = {
    status: selectedStatus.value,
    name: selectedSearch.value
  }

  const response: AxiosResponse<Blob> | undefined = await techniqueTanstackService.export(queryClient, request)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const onSave = (): void => {
  selectedOffer.value = undefined
  offerForm.value?.toggleDialog()
}

const menuButtons = (offer: Technique): MenuItem[] => {
  return [
    {
      label: `Edit this record`,
      icon: 'pi pi-pen-to-square',
      command: () => {
        selectedOffer.value = offer
        offerForm.value?.toggleDialog()
      }
    },
    {
      label: `Toggle Status`,
      icon: 'pi pi-exclamation-triangle',
      command: () => {
        selectedOffer.value = offer
        confirm.require({
          message: `If you proceed this hmo will be updated from ${statusLabel(selectedOffer.value.is_active)} to ${statusLabel(!selectedOffer.value.is_active)}`,
          header: `Toggle Status for ${selectedOffer.value.name} Confirmation`,
          icon: 'pi pi-exclamation-triangle',
          rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true,
            loading: isLoading
          },
          acceptProps: {
            label: `Toggle Status`,
            severity: `warning`,
            icon: `pi pi-exclamation-triangle`,
            loading: isLoading
          },
          accept: () => {
            if (!selectedOffer.value?.id) {
              warningToast(toast, "No hmo selected")
              return
            }

            toggleStatusMutation(selectedOffer.value.id, {
              async onSuccess() {
                successToast(toast, 'Toggle status success')
                await resetQueries()
              },
              async onError(error: APIError) {
                errorToast(toast, extractApiErrorMessage(error, "Toggle technique status failed"))
                await resetQueries()
              },
            })
          },
        })
      }
    },
  ]
}

const resetQueries = async (): Promise<void> => {
  await queryClient.invalidateQueries({queryKey: [TechniqueTanstackKey.TECHNIQUES]})
}
</script>



