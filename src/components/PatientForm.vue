<template>
  <Dialog
    v-model:visible="visible"
    :style="{ width: '76rem', maxWidth: '95vw' }"
    header="Add Patient Profile"
    modal
    :draggable="false"
    :resizable="false"
    class="patient-form-dialog"
    @show="onShow"
  >
    <div class="mb-5 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] px-4 py-3">
      <p class="m-0 text-sm">
        <span class="font-semibold">Form guide:</span>
        fields with <span class="font-semibold text-rose-600">*</span> are required.
      </p>
    </div>

    <Form
      ref="form"
      :resolver="resolver"
      @submit="onSubmit"
      class="space-y-6"
    >
      <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 sm:p-5">
        <h3 class="mb-4 text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300">
          Personal Information
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField v-slot="$field" name="first_name">
            <IftaLabel>
              <InputText
                id="first_name"
                v-model="$field.value"
                fluid
                placeholder="Enter first name"
                @blur="$field.value = toNameCase($field.value)"
              />
              <label for="first_name">First Name <span class="text-rose-600">*</span></label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <div class="space-y-2">
            <FormField v-slot="$field" name="middle_name">
              <IftaLabel>
                <InputText
                  id="middle_name"
                  v-model="$field.value"
                  fluid
                  placeholder="Enter middle name"
                  :disabled="noMiddleNameChecked"
                  @blur="$field.value = toNameCase($field.value)"
                />
                <label for="middle_name">
                  Middle Name
                  <span v-if="!noMiddleNameChecked" class="text-rose-600">*</span>
                </label>
                <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
              </IftaLabel>
            </FormField>

            <FormField v-slot="$noMiddleNameField" name="has_no_middle_name">
              <div class="flex items-center gap-2 pl-1">
                <Checkbox
                  input-id="has_no_middle_name_inline"
                  v-model="$noMiddleNameField.value"
                  :binary="true"
                  class="scale-90"
                  @value-change="onNoMiddleNameToggle(Boolean($noMiddleNameField.value))"
                />
                <label for="has_no_middle_name_inline" class="text-xs text-slate-500 dark:text-slate-400">
                  No middle name
                </label>
              </div>
            </FormField>
          </div>

          <FormField v-slot="$field" name="last_name">
            <IftaLabel>
              <InputText
                id="last_name"
                v-model="$field.value"
                fluid
                placeholder="Enter last name"
                @blur="$field.value = toNameCase($field.value)"
              />
              <label for="last_name">Last Name <span class="text-rose-600">*</span></label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="age">
            <IftaLabel>
              <InputNumber
                id="age"
                v-model="$field.value"
                :allow-empty="true"
                mode="decimal"
                fluid
                placeholder="Enter age"
              />
              <label for="age">Age <span class="text-rose-600">*</span></label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

	          <FormField v-slot="$field" name="gender">
	            <IftaLabel>
	              <Select
	                id="gender"
	                v-model="$field.value"
	                :fluid="true"
	                :loading="isLoading"
	                :options="genders"
	                optionLabel="name"
	                placeholder="Select gender"
	                :filter="true"
	                :filter-fields="['name']"
	              />
	              <label for="gender">Gender <span class="text-rose-600">*</span></label>
	              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
	            </IftaLabel>
	          </FormField>

	          <FormField v-slot="$field" name="civil_status">
	            <IftaLabel>
	              <Select
	                id="civil_status"
	                v-model="$field.value"
	                :fluid="true"
	                :loading="isLoading"
	                :options="civilStatuses"
	                optionLabel="name"
	                placeholder="Select civil status"
	                :filter="true"
	                :filter-fields="['name']"
	              />
	              <label for="civil_status">Civil Status <span class="text-rose-600">*</span></label>
	              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
	            </IftaLabel>
	          </FormField>

          <FormField v-slot="$field" name="occupation">
            <IftaLabel>
              <InputText
                id="occupation"
                v-model="$field.value"
                fluid
                placeholder="Enter occupation"
                @blur="$field.value = toNameCase($field.value)"
              />
              <label for="occupation">Occupation (Optional)</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="religion">
            <IftaLabel>
              <Select
                id="religion"
                v-model="$field.value"
                :fluid="true"
                :loading="isLoading"
                :options="religions"
                optionLabel="name"
                placeholder="Select religion"
                :filter="true"
                :filter-fields="['name']"
              />
              <label for="religion">Religion (Optional)</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="referral_channel">
            <IftaLabel>
              <Select
                id="referral_channel"
                v-model="$field.value"
                :fluid="true"
                :options="referralChannelOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select referral category"
              />
              <label for="referral_channel">Referral Category (Optional)</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="mode_of_referral">
            <IftaLabel>
              <Select
                id="mode_of_referral"
                v-model="$field.value"
                :fluid="true"
                :loading="isLoading"
                :options="filteredModeOfReferrals"
                optionLabel="name"
                placeholder="Select referral source"
                :filter="true"
                :filter-fields="['name']"
                :disabled="!selectedReferralChannel"
              />
              <label for="mode_of_referral">Referral Source (Optional)</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$hiddenField" name="referred_by">
            <input v-model="$hiddenField.value" type="hidden">
          </FormField>

          <FormField v-if="isDoctorReferral" v-slot="$field" name="referred_by_staff">
            <IftaLabel>
              <Select
                id="referred_by_staff"
                v-model="$field.value"
                :fluid="true"
                :loading="isLoading"
                :options="doctorReferralOptions"
                optionLabel="name"
                placeholder="Select referring doctor from database"
                :filter="true"
                :filter-fields="['name']"
              />
              <label for="referred_by_staff">Referring Doctor <span class="text-rose-600">*</span></label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>

            <div
              v-if="legacyDoctorReferralName && !$field.value"
              class="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
            >
              Legacy doctor referral on this record: <span class="font-semibold">{{ legacyDoctorReferralName }}</span>.
              Select a doctor from the database to link this referral for future ROI and commission tracking.
            </div>
          </FormField>

          <FormField v-slot="$field" name="clinic">
            <IftaLabel>
              <Select
                id="clinic"
                v-model="$field.value"
                :fluid="true"
                :loading="isLoading"
                :options="availableClinics"
                optionLabel="name"
                placeholder="Select clinic"
                :filter="true"
                :filter-fields="['name']"
              />
              <label for="clinic">Clinic <span class="text-rose-600">*</span></label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>
        </div>
      </section>

      <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 sm:p-5">
        <h3 class="mb-4 text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300">
          Contact Information
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField v-slot="$field" name="phone_number">
            <IftaLabel>
              <InputMask
                id="phone_number"
                v-model="$field.value"
                fluid
                mask="99999999999"
                placeholder="Enter phone number (09XXXXXXXXX)"
              />
              <label for="phone_number">Phone Number <span class="text-rose-600">*</span></label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="email">
            <IftaLabel>
              <InputText
                id="email"
                v-model="$field.value"
                fluid
                type="email"
                placeholder="Enter email"
                v-keyfilter="/^[@_.\-a-zA-Z0-9]+$/"
              />
              <label for="email">Email (Optional)</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="fb_link">
            <IftaLabel>
              <InputText
                id="fb_link"
                v-model="$field.value"
                fluid
                placeholder="Enter Facebook profile link"
              />
              <label for="fb_link">Facebook Link (Optional)</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>
        </div>
      </section>

      <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 sm:p-5">
        <h3 class="mb-4 text-sm font-semibold tracking-wide text-slate-600 dark:text-slate-300">
          Address Information
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FormField v-slot="$field" name="region">
            <IftaLabel>
              <Select
                id="region"
                v-model="$field.value"
                :fluid="true"
                :loading="isLoading"
                :options="availableRegions"
                optionLabel="name"
                placeholder="Select region"
                :filter="true"
                :filter-fields="['name', 'description']"
                @value-change="onRegionChange"
              >
                <template #option="slotProps">
                  <div>{{ slotProps.option?.name }} - {{ slotProps.option?.description }}</div>
                </template>
                <template #value="slotProps">
                  <div v-if="slotProps.value">{{ slotProps.value?.name }} - {{ slotProps.value?.description }}</div>
                  <span v-else>{{ slotProps.placeholder }}</span>
                </template>
              </Select>
              <label for="region">Region</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="province">
            <IftaLabel>
              <Select
                id="province"
                v-model="$field.value"
                :fluid="true"
                :loading="isLoading"
                :options="provinces"
                optionLabel="name"
                placeholder="Select province"
                :filter="true"
                :filter-fields="['name']"
                @value-change="onProvinceChange"
              />
              <label for="province">Province</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="city">
            <IftaLabel>
              <Select
                id="city"
                v-model="$field.value"
                :fluid="true"
                :loading="isLoading"
                :options="cities"
                optionLabel="name"
                placeholder="Select city"
                :filter="true"
                :filter-fields="['name']"
                @value-change="onCityChange"
              />
              <label for="city">City</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="baranggay">
            <IftaLabel>
              <Select
                id="baranggay"
                v-model="$field.value"
                :fluid="true"
                :loading="isLoading"
                :options="baranggays"
                optionLabel="name"
                placeholder="Select barangay"
                :filter="true"
                :filter-fields="['name']"
              />
              <label for="baranggay">Barangay</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>

          <FormField v-slot="$field" name="details">
            <IftaLabel>
              <InputText
                id="details"
                v-model="$field.value"
                fluid
                placeholder="House no., street, landmark, etc."
                @blur="$field.value = toNameCase($field.value)"
              />
              <label for="details">Address Details (Optional)</label>
              <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error.message }}</Message>
            </IftaLabel>
          </FormField>
        </div>
      </section>

      <div class="flex justify-end gap-2 pt-1">
        <Button :loading="isLoading" label="Cancel" type="button" severity="secondary" outlined @click="onClose" />
        <Button
          :loading="isLoading"
          :label="buttonProps.label"
          :icon="buttonProps.icon"
          :severity="buttonProps.severity"
          :pt="ptModalPrimaryBtn"
          type="submit"
        />
      </div>
    </Form>
  </Dialog>
</template>

<script setup lang="ts">
import type { PatientFormEmits, PatientFormProps } from "@/components/patient.type.ts";
import { computed, ref, toRefs, useTemplateRef, watch } from "vue";
import { useToggle, watchDebounced } from "@vueuse/core";
import { Form, FormField, type FormInstance, type FormSubmitEvent } from "@primevue/forms";
import { zodResolver } from "@primevue/forms/resolvers/zod";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import IftaLabel from "primevue/iftalabel";
import Message from "primevue/message";
import Select from "primevue/select";
import InputMask from "primevue/inputmask";
import Checkbox from "primevue/checkbox";
import { ptModalPrimaryBtn } from "@/features/shared/table-header.styles";
import type { GooglePlaceAddress } from "@/components/GooglePlacesAutocomplete.vue";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete.vue";
import type {
  Baranggay,
  BaranggayRequestPayload,
  City,
  CityRequestPayload,
  Province,
  ProvinceRequestPayload,
  Region,
  RegionRequestPayload
} from "@/models/philippine-location.ts";
import type { Lookup } from "@/models/global.model.ts";
import { defaultPage, defaultPageSize, type Pageable } from "@/models/paging.ts";
import { type PatientFormState, patientSchema } from "@/schema/patient.schema.ts";
import type { ModeOfReferral, ReferralChannel } from "@/models/reference.ts";
import {
  defaultDraftDebounce,
  defaultDraftMaxWaitDebounce,
  type DialogExpose
} from "@/utils/global.type.ts";
import {
  philippineLocationTanstackService
} from "@/services/philippine-location.tanstack.service.ts";
import { clinicTanstackService } from "@/features/clinics/queries/clinic.tanstack.service";
import { clinicService } from "@/features/clinics/api/clinic.service";
import { Status } from "@/utils/global.type.ts";

const form = useTemplateRef<FormInstance>("form")

const provinces = ref<Province[]>([])
const cities = ref<City[]>([])
const baranggays = ref<Baranggay[]>([])
const fallbackRegions = ref<Region[]>([])
const fallbackClinics = ref<Lookup[]>([])
const googleAddressInput = ref<string>("")

const emit = defineEmits<PatientFormEmits>()
const props = defineProps<PatientFormProps>()
const {
  selectedPatient,
  genders,
  civilStatuses,
  religions,
  modeOfReferrals,
  clinics,
  doctors,
  regions
} = toRefs(props)

const [visible, toggle] = useToggle()
const isEditing = computed<boolean>(() => !!selectedPatient.value)

const resolver = ref(zodResolver(patientSchema))
const noMiddleNameChecked = computed<boolean>(() => Boolean((form.value?.states as any)?.has_no_middle_name?.value))
const availableRegions = computed<Region[]>(() => regions.value?.length ? regions.value : fallbackRegions.value)
const availableClinics = computed<Lookup[]>(() => clinics.value?.length ? clinics.value : fallbackClinics.value)
const referralChannelOptions: Array<{ label: string; value: ReferralChannel }> = [
  { label: "Online", value: "ONLINE" },
  { label: "Offline", value: "OFFLINE" }
]
const doctorReferralOptions = computed<Lookup[]>(() =>
  [...(doctors.value ?? [])].sort((left, right) => left.name.localeCompare(right.name))
)
const selectedReferralChannel = computed<ReferralChannel | undefined>(() => {
  const value = form.value?.states?.referral_channel?.value
  return value === "ONLINE" || value === "OFFLINE" ? value : undefined
})
const selectedModeOfReferral = computed<ModeOfReferral | undefined>(() => {
  return form.value?.states?.mode_of_referral?.value as ModeOfReferral | undefined
})
const selectedReferringDoctor = computed<Lookup | undefined>(() => {
  return form.value?.states?.referred_by_staff?.value as Lookup | undefined
})
const filteredModeOfReferrals = computed<ModeOfReferral[]>(() => {
  const channel = selectedReferralChannel.value
  if (!channel) return []
  return (modeOfReferrals.value ?? []).filter((mode) => mode.referral_channel === channel)
})
const isDoctorReferral = computed<boolean>(() => {
  return String(selectedModeOfReferral.value?.name ?? "").trim().toLowerCase() === "doctor referral"
})
const legacyDoctorReferralName = computed<string>(() => {
  if (selectedPatient.value?.referred_by_staff_id) return ""
  return String(selectedPatient.value?.referred_by ?? "").trim()
})

const toNameCase = (input: string | undefined | null): string => {
  if (!input) return ""
  return input
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(part => part ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}` : "")
    .join(" ")
}

const onNoMiddleNameToggle = (checked: boolean): void => {
  if (!checked) return
  form.value?.setFieldValue("middle_name", undefined)
}

const onGooglePlaceChanged = (place: GooglePlaceAddress): void => {
  const formatted = place.formattedAddress?.trim()
  if (!formatted) return
  form.value?.setFieldValue("details", formatted)
}

watch(selectedReferralChannel, (nextChannel) => {
  const currentMode = selectedModeOfReferral.value
  if (currentMode && currentMode.referral_channel !== nextChannel) {
    form.value?.setFieldValue("mode_of_referral", null)
  }
})

watch(selectedModeOfReferral, (nextMode) => {
  if (nextMode?.referral_channel && selectedReferralChannel.value !== nextMode.referral_channel) {
    form.value?.setFieldValue("referral_channel", nextMode.referral_channel)
  }

  if (String(nextMode?.name ?? "").trim().toLowerCase() !== "doctor referral") {
    form.value?.setFieldValue("referred_by_staff", null)
    form.value?.setFieldValue("referred_by", undefined)
  }
})

watch(selectedReferringDoctor, (nextDoctor) => {
  if (nextDoctor?.name) {
    form.value?.setFieldValue("referred_by", nextDoctor.name)
    return
  }

  if (isDoctorReferral.value && legacyDoctorReferralName.value) {
    form.value?.setFieldValue("referred_by", legacyDoctorReferralName.value)
    return
  }

  form.value?.setFieldValue("referred_by", undefined)
})

const onRegionChange = async (region: Region): Promise<void> => {
  if (!region?.id) {
    provinces.value = []
    cities.value = []
    baranggays.value = []
    const fields: (keyof PatientFormState)[] = ["province", "city", "baranggay"]
    for (const field of fields) {
      form.value?.setFieldValue(field, null)
    }
    return
  }
  await onRegionChangeFn(region.id)
}

const onProvinceChange = async (province: Province): Promise<void> => {
  if (!province?.region_id || !province?.id) {
    cities.value = []
    baranggays.value = []
    return
  }
  await onProvinceChangeFn(province.region_id, province.id)
}

const onCityChange = async (city: City): Promise<void> => {
  if (!city?.region_id || !city?.province_id || !city?.id) {
    baranggays.value = []
    return
  }
  await onCityChangeFn(city.region_id, city.province_id, city.id)
}

const onRegionChangeFn = async (regionId: number): Promise<void> => {
  const request: ProvinceRequestPayload = {
    region_id: regionId,
    page_request: {
      page: defaultPage,
      size: defaultPageSize,
      name: undefined
    }
  }

  const fetchedProvinces: Pageable<Province> | undefined = await philippineLocationTanstackService.getAllProvinces(props.queryClient, request)
  provinces.value = fetchedProvinces?.content ?? []
  cities.value = []
  baranggays.value = []

  const fields: (keyof PatientFormState)[] = ["province", "city", "baranggay"]
  for (const field of fields) {
    form.value?.setFieldValue(field, null)
  }
}

const onProvinceChangeFn = async (regionId: number, provinceId: number): Promise<void> => {
  const request: CityRequestPayload = {
    region_id: regionId,
    province_id: provinceId,
    page_request: {
      page: defaultPage,
      size: defaultPageSize,
      name: undefined
    }
  }

  const fetchedCities: Pageable<City> | undefined = await philippineLocationTanstackService.getAllCities(props.queryClient, request)
  cities.value = fetchedCities?.content ?? []
  baranggays.value = []

  const fields: (keyof PatientFormState)[] = ["city", "baranggay"]
  for (const field of fields) {
    form.value?.setFieldValue(field, null)
  }
}

const onCityChangeFn = async (regionId: number, provinceId: number, cityId: number): Promise<void> => {
  const request: BaranggayRequestPayload = {
    region_id: regionId,
    province_id: provinceId,
    city_id: cityId,
    page_request: {
      page: defaultPage,
      size: defaultPageSize,
      name: undefined
    }
  }

  const fetchedBaranggays: Pageable<Baranggay> | undefined = await philippineLocationTanstackService.getAllBaranggays(props.queryClient, request)
  baranggays.value = fetchedBaranggays?.content ?? []

  const field: keyof PatientFormState = "baranggay"
  form.value?.setFieldValue(field, null)
}

const onShow = async (): Promise<void> => {
  await ensureClinicsLoaded()
  await ensureRegionsLoaded()
  if (!isEditing.value) {
    await populateOnDraft()
    return
  }
  await populateOnEdit()
}

const ensureClinicsLoaded = async (): Promise<void> => {
  if (clinics.value?.length || fallbackClinics.value.length) return
  try {
    const fetchedClinics = await clinicTanstackService.getAllLookup(props.queryClient, defaultPage, undefined)
    fallbackClinics.value = fetchedClinics?.content ?? []
    if (fallbackClinics.value.length) return
  } catch {
    // fallback to read endpoint
  }

  const fetchedClinics = await clinicService.getAll({
    page: defaultPage,
    size: defaultPageSize,
    status: Status.ACTIVE,
    name: undefined
  })
  fallbackClinics.value = (fetchedClinics?.content ?? []).map(clinic => ({
    id: clinic.id,
    name: clinic.name
  }))
}

const ensureRegionsLoaded = async (): Promise<void> => {
  if (regions.value?.length || fallbackRegions.value.length) return

  const request: RegionRequestPayload = {
    page_request: {
      page: defaultPage,
      size: defaultPageSize,
      name: undefined
    }
  }
  const fetchedRegions: Pageable<Region> | undefined = await philippineLocationTanstackService.getAllRegions(props.queryClient, request)
  fallbackRegions.value = fetchedRegions?.content ?? []
}

const populateOnEdit = async (): Promise<void> => {
  const regionId: number | undefined = selectedPatient.value?.region_id
  const provinceId: number | undefined = selectedPatient.value?.province_id
  const cityId: number | undefined = selectedPatient.value?.city_id
  if (regionId && provinceId && cityId) {
    await Promise.all([
      onRegionChangeFn(regionId),
      onProvinceChangeFn(regionId, provinceId),
      onCityChangeFn(regionId, provinceId, cityId)
    ])
  }

  const initialValues: Partial<PatientFormState> = {
    first_name: selectedPatient.value?.first_name,
    middle_name: selectedPatient.value?.middle_name,
    has_no_middle_name: !selectedPatient.value?.middle_name,
    last_name: selectedPatient.value?.last_name,
    age: selectedPatient.value?.age,
    gender: genders.value?.find(g => g.id === selectedPatient.value?.gender_id),
    civil_status: civilStatuses.value?.find(cs => cs.id === selectedPatient.value?.civil_status_id),
    occupation: selectedPatient.value?.occupation,
    religion: religions.value?.find(r => r.id === selectedPatient.value?.religion_id),
    referral_channel: selectedPatient.value?.mode_of_referral_channel,
    mode_of_referral: modeOfReferrals.value?.find(mor => mor.id === selectedPatient.value?.mode_of_referral_id),
    referred_by: selectedPatient.value?.referred_by,
    referred_by_staff: doctorReferralOptions.value.find(doctor => doctor.id === selectedPatient.value?.referred_by_staff_id),
    clinic: availableClinics.value?.find(c => c.id === selectedPatient.value?.clinic_id),
    phone_number: selectedPatient.value?.phone_number,
    email: selectedPatient.value?.email,
    fb_link: selectedPatient.value?.fb_link,
    region: availableRegions.value?.find(r => r.id === selectedPatient.value?.region_id),
    province: provinces.value?.find(p => p.id === selectedPatient.value?.province_id),
    city: cities.value?.find(c => c.id === selectedPatient.value?.city_id),
    baranggay: baranggays.value?.find(b => b.id === selectedPatient.value?.baranggay_id),
    details: selectedPatient.value?.details
  }

  form.value?.setValues(initialValues)
}

const populateOnDraft = async (): Promise<void> => {
  const draft: PatientFormState | undefined = await props.draftService.get()
  if (!draft) return

  if (draft.region) await onRegionChangeFn(draft.region.id)
  if (draft.province) await onProvinceChangeFn(draft.province.region_id, draft.province.id)
  if (draft.city) await onCityChangeFn(draft.city.region_id, draft.city.province_id, draft.city.id)

  form.value?.setValues({
    ...draft,
    referral_channel: draft.referral_channel ?? (draft.mode_of_referral as ModeOfReferral | undefined)?.referral_channel,
    has_no_middle_name: draft.has_no_middle_name ?? !draft.middle_name
  })
}

const onSubmit = (event: FormSubmitEvent): void => {
  if (!event.valid) return
  if (event.values?.has_no_middle_name) {
    event.values.middle_name = undefined
  }
  emit("onSubmit", event)
}

const onClose = (): void => {
  toggle()
  emit("onClose")
}

watchDebounced(() => form.value?.states, async (newValues): Promise<void> => {
  if (isEditing.value) return
  await props.draftService.save(newValues)
}, {
  debounce: defaultDraftDebounce,
  maxWait: defaultDraftMaxWaitDebounce,
  deep: true,
  flush: "post"
})

defineExpose<DialogExpose>({
  toggleDialog: toggle
})
</script>
