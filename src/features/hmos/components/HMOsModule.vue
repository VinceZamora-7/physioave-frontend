<template>
  <main class="app-page-shell">
    <Message v-if="isError" severity="error" class="mb-3"> Something went wrong!</Message>
    <section
      v-else
      class="app-section-card"
    >
      <DataTable
      :value="hmos?.content"
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
              label="Save HMO"
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

      <Column header="Machines">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <Button
              :loading="isLoading"
              severity="primary"
              label="View Machines"
              @click="onViewMachines(slotProps.data)"
            />
          </SkeletonLoader>
        </template>
      </Column>

      <Column header="Techniques">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <Button
              :loading="isLoading"
              severity="primary"
              label="View Techniques"
              @click="onViewTechniques(slotProps.data)"
            />
          </SkeletonLoader>
        </template>
      </Column>

      <Column header="Evaluations">
        <template v-slot:body="slotProps">
          <SkeletonLoader :loading="isLoading">
            <Button
              :loading="isLoading"
              severity="primary"
              label="View Evaluations"
              @click="onViewEvaluations(slotProps.data)"
            />
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
          :totalRecords="hmos?.total_elements"
          :rowsPerPageOptions="rowPerPageOptions"
          @page="onPageChangeDebounceFn($event, refetch)"
        />
      </template>
      </DataTable>
      <HMOForm ref="hmoForm" v-bind="hmoFormProps" @on-submit="onSubmit
"/>
    </section>
  </main>
</template>

<script setup lang="ts">


import {hmoTanstackService} from "@/features/hmos/queries/hmo.tanstack.service";
import {
  defaultFilterDebounce,
  defaultThrottle,
  rowPerPageOptions,
  Status,
  statuses
} from "@/utils/global.type.ts";
import Select from "primevue/select";
import InputIcon from "primevue/inputicon";
import DataTable from "primevue/datatable";
import {Paginator, useConfirm, useToast} from "primevue";
import Column from "primevue/column";
import SkeletonLoader from "@/composables/SkeletonLoader.vue";
import Tag from "primevue/tag";
import Button from "primevue/button";
import IconField from "primevue/iconfield";
import Message from "primevue/message";
import IftaLabel from "primevue/iftalabel";
import Menu from "primevue/menu";
import InputText from "primevue/inputtext";
import {computed, ref, useTemplateRef} from "vue";
import {
  defaultStatus,
  type Pageable,
  type PageableRequest,
  type PageRequestWithNameAndStatus
} from "@/models/paging.ts";
import {usePaginationDebounce} from "@/composables/pagination-debounce.composable.ts";
import type {HMO, HMOEditRequestPayload, HMOSaveRequestParams} from "@/features/hmos/types/hmo";
import {useRefreshToken} from "@/composables/refresh-token.composable.ts";
import {useIsLoading} from "@/composables/tanstack-loader.composable.ts";
import {HMOTanstackKey} from "@/utils/keys/tanstack-key.ts";
import {useThrottleFn, watchDebounced} from "@vueuse/core";
import {useMenuButtons} from "@/composables/menu-buttons.composable.ts";
import type {MenuItem} from "primevue/menuitem";
import {errorToast, infoToast, successToast, warningToast} from "@/utils/toast.util.ts";
import type {APIError} from "@/utils/error-handler.ts";
import {useQueryClient} from "@tanstack/vue-query";
import type {AxiosResponse} from "axios";
import {exportToExcel} from "@/utils/export-excel.util.ts";
import HMOForm from "@/features/hmos/components/HMOForm.vue";
import type {HMOFormProps} from "@/features/hmos/components/hmo.type";
import type {FormSubmitEvent} from "@primevue/forms";
import type {StringSchemaFormState} from "@/schema/global.schema.ts";

const hmoForm = useTemplateRef<InstanceType<typeof HMOForm>>('hmoForm')

const isHMOLoading = useIsLoading(HMOTanstackKey.HMOS)
const isExportLoading = useIsLoading(HMOTanstackKey.HMOS_EXPORT)
const isLoading = computed<boolean>(() => isHMOLoading.value || isExportLoading.value)

const toast = useToast()
const confirm = useConfirm()
const queryClient = useQueryClient()

const {add: addMenu, toggle: toggleMenuButtons} = useMenuButtons()

const selectedHMO = ref<HMO | undefined>()
const selectedSearch = ref<string | undefined>()
const selectedStatus = ref<Status>(defaultStatus)
const {
  page,
  pageSize,
  onPageChangeDebounceFn
} = usePaginationDebounce<Pageable<HMO> | undefined>()

watchDebounced(
  [selectedSearch, selectedStatus],
  async (): Promise<void> => {
    page.value = 1
    await refetch()
  },
  {debounce: defaultFilterDebounce},
)

const hmoFormProps = computed(() => ({
  selectedHMO: selectedHMO.value,
  isLoading: isLoading.value,
  buttonProps: {
    label: selectedHMO.value ? `Edit ${selectedHMO.value.name}` : `Save Clinic`,
    icon: selectedHMO.value ? 'pi pi-pen-to-square' : 'pi pi-save',
    severity: selectedHMO.value ? 'success' : 'info'
  },
}) satisfies HMOFormProps)

const {
  mutate: toggleStatusMutation
} = hmoTanstackService.toggleStatus()

const {
  mutate: saveMutation
} = hmoTanstackService.save()

const {
  mutate: updateMutation
} = hmoTanstackService.update()

const requestParams = computed(() => ({
  page: page.value,
  size: pageSize.value,
  name: selectedSearch.value,
  status: selectedStatus.value
}) satisfies PageableRequest)

const {
  data: hmos,
  isError,
  error,
  refetch
} = hmoTanstackService.getAll(requestParams)
useRefreshToken<Pageable<HMO> | undefined>(error, refetch)

const resetFilters = (): void => {
  selectedSearch.value = undefined
  selectedStatus.value = defaultStatus
}

const statusLabel = (isActive: boolean): string => {
  return isActive ? 'Active' : 'Inactive'
}

const editFn = (name: string): void => {
  if (!selectedHMO.value?.id) {
    warningToast(toast, "No clinic selected")
    return
  }

  const payload: HMOEditRequestPayload = {
    id: selectedHMO.value.id,
    name: name
  }

  updateMutation(payload, {
    async onSuccess() {
      hmoForm.value?.toggleDialog()
      successToast(toast, 'Edit success')
      await resetQueries()
    },
    async onError(error: APIError) {
      errorToast(toast, `Edit failed ${error.message}`)
      await resetQueries()
    },
  })
}

const saveFn = (name: string): void => {
  const params: HMOSaveRequestParams = {
    name: name,
  }

  saveMutation(params, {
    async onSuccess() {
      hmoForm.value?.toggleDialog()
      successToast(toast, 'Save success')
      await resetQueries()
    },
    async onError(error: APIError) {
      errorToast(toast, `Save failed ${error.message}`)
      await resetQueries()
    },
  })
}

const onSubmit = (event: FormSubmitEvent<StringSchemaFormState>): void => {
  confirm.require({
    message: 'Are you sure you want to proceed?',
    header: `${hmoFormProps.value.buttonProps.label} Confirmation`,
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
      loading: isLoading
    },
    acceptProps: {
      label: `${hmoFormProps.value.buttonProps.label}`,
      severity: `${hmoFormProps.value.buttonProps.severity}`,
      icon: `${hmoFormProps.value.buttonProps.icon}`,
      loading: isLoading
    },
    accept: () => {
      if (selectedHMO.value) {
        editFn(event.values.name)
        return
      }

      saveFn(event.values.name)
    }
  })
}

const onSave = (): void => {
  selectedHMO.value = undefined
  hmoForm.value?.toggleDialog()
}

const menuButtons = (hmo: HMO): MenuItem[] => {
  return [
    {
      label: `Edit this record`,
      icon: 'pi pi-pen-to-square',
      command: () => {
        selectedHMO.value = hmo
        hmoForm.value?.toggleDialog()
      }
    },
    {
      label: `Toggle Status`,
      icon: 'pi pi-exclamation-triangle',
      command: () => {
        selectedHMO.value = hmo
        confirm.require({
          message: `If you proceed this hmo will be updated from ${statusLabel(selectedHMO.value.is_active)} to ${statusLabel(!selectedHMO.value.is_active)}`,
          header: `Toggle Status for ${selectedHMO.value.name} Confirmation`,
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
            if (!selectedHMO.value?.id) {
              warningToast(toast, "No hmo selected")
              return
            }

            toggleStatusMutation(selectedHMO.value.id, {
              async onSuccess() {
                successToast(toast, 'Toggle status success')
                await resetQueries()
              },
              async onError(error: APIError) {
                errorToast(toast, `Toggle status failed ${error.message}`)
                await resetQueries()
              },
            })
          },
        })
      }
    },
  ]
}

const onExportToExcelThrottleFn = useThrottleFn(async (): Promise<void> => {
  const request: PageRequestWithNameAndStatus = {
    status: selectedStatus.value,
    name: selectedSearch.value
  }

  const response: AxiosResponse<Blob> | undefined = await hmoTanstackService.export(queryClient, request)
  if (!response) return
  exportToExcel(response)
}, defaultThrottle)

const resetQueries = async (): Promise<void> => {
  await queryClient.invalidateQueries({queryKey: [HMOTanstackKey.HMOS]})
}

const onViewMachines = (hmo: HMO): void => {
  infoToast(toast, "Not implemented yet")
}

const onViewTechniques = (hmo: HMO): void => {
  infoToast(toast, "Not implemented yet")
}

const onViewEvaluations = (hmo: HMO): void => {
  infoToast(toast, "Not implemented yet")
}
</script>



