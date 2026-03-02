<template>
  <Dialog
    v-model:visible="visible"
    :style="{ width: '80rem' }"
    :header="buttonProps.label"
    modal
    :draggable="false"
    :resizable="false"
    @show="onShow"
  >
    <Form :resolver="resolver" @submit="onSubmit"
          class="flex flex-col gap-2"
          ref="form">
      <FormField v-slot="$field" name="first_name">
        <IftaLabel>
          <InputText
            id="first_name"
            v-model="$field.value"
            @blur="$field.value = toNameCase($field.value)"
            fluid
            placeholder="Enter first name"
          />
          <label for="first_name">First name</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="middle_name">
        <IftaLabel>
          <InputText
            id="middle_name"
            v-model="$field.value"
            @blur="$field.value = toNameCase($field.value)"
            fluid
            placeholder="Enter middle name"
          />
          <label for="middle_name">Middle name</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="last_name">
        <IftaLabel>
          <InputText
            id="last_name"
            v-model="$field.value"
            @blur="$field.value = toNameCase($field.value)"
            fluid
            placeholder="Enter last name"
          />
          <label for="last_name">Last name</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="age">
        <IftaLabel>
          <InputNumber
            id="age"
            :allow-empty="true"
            input-id="integeronly"
            mode="decimal"
            fluid
            :placeholder="`Enter age`"
          />
          <label for="age">Age</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="gender">
        <IftaLabel>
          <Select
            id="gender"
            :fluid="true"
            :loading="isLoading"
            :options="genders"
            placeholder="Select Gender"
            :filter="true"
            :filter-fields="['name']">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="gender">Gender</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="civil_status">
        <IftaLabel>
          <Select
            id="civil_status"
            :fluid="true"
            :loading="isLoading"
            :options="civilStatuses"
            placeholder="Select civil status"
            :filter="true"
            :filter-fields="['name']">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="civil_status">Civil status</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="occupation">
        <IftaLabel>
          <InputText
            id="occupation"
            v-model="$field.value"
            @blur="$field.value = toNameCase($field.value)"
            fluid
            placeholder="Enter occupation"
          />
          <label for="occupation">Occupation</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="religion">
        <IftaLabel>
          <Select
            id="religion"
            :fluid="true"
            :loading="isLoading"
            :options="religions"
            placeholder="Select religion"
            :filter="true"
            :filter-fields="['name']">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="religion">Religion</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="mode_of_referral">
        <IftaLabel>
          <Select
            id="mode_of_referral"
            :fluid="true"
            :loading="isLoading"
            :options="modeOfReferrals"
            placeholder="Select mode of referral"
            :filter="true"
            :filter-fields="['name']">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="mode_of_referral">Mode of referral</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="clinic">
        <IftaLabel>
          <Select
            id="clinic"
            :fluid="true"
            :loading="isLoading"
            :options="clinics"
            placeholder="Select clinic"
            :filter="true"
            :filter-fields="['name']">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="clinic">Clinic</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="referred_by">
        <IftaLabel>
          <Select
            id="referred_by"
            v-model="$field.value"
            :fluid="true"
            :loading="isLoading"
            :options="doctorReferralOptions"
            optionLabel="name"
            optionValue="name"
            placeholder="Select doctor referral"
            :filter="true"
            :filter-fields="['name']"
          />
          <label for="referred_by">Doctor referral</label>
          <div class="mt-2 flex gap-2">
            <InputText
              v-model="newDoctorReferral"
              class="w-full"
              placeholder="Add doctor not in list"
              @keyup.enter="addDoctorReferral($field)"
            />
            <Button type="button" label="Add New" icon="pi pi-plus" @click="addDoctorReferral($field)" />
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="email">
        <IftaLabel>
          <InputText
            id="email"
            fluid
            placeholder="Enter email (example@gmail.com)"
            type="email"
            v-model="$field.value"
            v-keyfilter="/^[@_.\-a-zA-Z0-9]+$/"
          />
          <label for="email">Email</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple"
          >{{ $field.error?.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="phone_number">
        <IftaLabel>
          <InputMask
            fluid
            id="phone_number"
            mask="99999999999"
            placeholder="Enter phone number (0999 999 9999)"
            v-model="$field.value"
          />
          <label for="phone_number">Phone number</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple"
          >{{ $field.error?.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="fb_link">
        <IftaLabel>
          <InputText
            id="fb_link"
            v-model="$field.value"
            fluid
            placeholder="Enter facebook link"
          />
          <label for="fb_link">Facebook link</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="region">
        <IftaLabel>
          <Select
            @value-change="onRegionChange"
            id="region"
            :fluid="true"
            :loading="isLoading"
            :options="regions"
            placeholder="Select region"
            :filter="true"
            :filter-fields="['name']">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }} - {{ slotProps.value.description }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }} - {{ slotProps.option.description }}</div>
              </div>
            </template>
          </Select>
          <label for="region">Region</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="province">
        <IftaLabel>
          <Select
            @value-change="onProvinceChange"
            id="province"
            :fluid="true"
            :loading="isLoading"
            :options="provinces"
            placeholder="Select province"
            :filter="true"
            :filter-fields="['name']">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="province">Province</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="city">
        <IftaLabel>
          <Select
            @value-change="onCityChange"
            id="city"
            :fluid="true"
            :loading="isLoading"
            :options="cities"
            placeholder="Select cities"
            :filter="true"
            :filter-fields="['name']">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="city">City</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="baranggay">
        <IftaLabel>
          <Select
            id="baranggay"
            :fluid="true"
            :loading="isLoading"
            :options="baranggays"
            placeholder="Select baranggay"
            :filter="true"
            :filter-fields="['name']">
            <template v-slot:value="slotProps">
              <div v-if="slotProps.value" class="flex items-center">
                <div>{{ slotProps.value?.name }}</div>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template v-slot:option="slotProps">
              <div class="flex items-center">
                <div>{{ slotProps.option?.name }}</div>
              </div>
            </template>
          </Select>
          <label for="baranggay">Baranggay</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <FormField v-slot="$field" name="details">
        <IftaLabel>
          <InputText
            id="details"
            v-model="$field.value"
            @blur="$field.value = toNameCase($field.value)"
            fluid
            placeholder="Enter address details"
          />
          <label for="details">Address details</label>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">
            {{ $field.error.message }}
          </Message>
        </IftaLabel>
      </FormField>

      <div class="flex justify-end gap-2 mt-4">
        <Button :loading="isLoading" label="Cancel" type="button" @click="onClose"/>
        <Button
          :loading="isLoading"
          :label="buttonProps.label"
          :icon="buttonProps.icon"
          :severity="buttonProps.severity"
          type="submit"
        />
      </div>
    </Form>
  </Dialog>
</template>

<script setup lang="ts">
import type {PatientFormEmits, PatientFormProps,} from "@/components/patient.type.ts";
import {computed, ref, toRefs, useTemplateRef} from "vue";
import {useToggle, watchDebounced} from "@vueuse/core";
import {Form, FormField, type FormInstance, type FormSubmitEvent} from "@primevue/forms";
import {zodResolver} from "@primevue/forms/resolvers/zod";
import Dialog from "primevue/dialog";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import IftaLabel from "primevue/iftalabel";
import Message from "primevue/message";
import Select from "primevue/select";
import InputMask from "primevue/inputmask";
import type {
  Baranggay,
  BaranggayRequestPayload,
  City,
  CityRequestPayload,
  Province,
  ProvinceRequestPayload,
  Region
} from "@/models/philippine-location.ts";
import {defaultPage, defaultPageSize, type Pageable} from "@/models/paging.ts";
import {type PatientFormState, patientSchema} from "@/schema/patient.schema.ts";
import {
  defaultDraftDebounce,
  defaultDraftMaxWaitDebounce,
  type DialogExpose
} from "@/utils/global.type.ts";
import {
  philippineLocationTanstackService
} from "@/services/philippine-location.tanstack.service.ts";

const form = useTemplateRef<FormInstance>('form')

const provinces = ref<Province[]>([])
const cities = ref<City[]>([])
const baranggays = ref<Baranggay[]>([])
const customDoctors = ref<Array<{ id: number; name: string }>>([])
const newDoctorReferral = ref<string>("")

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
  regions,
} = toRefs(props)

const [visible, toggle] = useToggle()
const isEditing = computed<boolean>(() => !!selectedPatient.value)

const resolver = ref(zodResolver(patientSchema))
const doctorReferralOptions = computed(() => [...(doctors.value ?? []), ...customDoctors.value])

const toNameCase = (input: string | undefined | null): string => {
  if (!input) return ""
  return input
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map(part => part ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}` : "")
    .join(" ")
}

const addDoctorReferral = (field: { value: unknown }): void => {
  const normalized = toNameCase(newDoctorReferral.value)
  if (!normalized) return

  const exists = doctorReferralOptions.value.some(option => option.name.toLowerCase() === normalized.toLowerCase())
  if (!exists) {
    customDoctors.value = [
      ...customDoctors.value,
      {id: Date.now(), name: normalized}
    ]
  }
  field.value = normalized
  newDoctorReferral.value = ""
}

const onRegionChange = async (region: Region): Promise<void> => {
  await onRegionChangeFn(region?.id)
}

const onProvinceChange = async (province: Province): Promise<void> => {
  await onProvinceChangeFn(province.region_id, province.id)
}

const onCityChange = async (city: City): Promise<void> => {
  await onCityChangeFn(city.region_id, city.province_id, city.id)
}

const onRegionChangeFn = async (regionId: number): Promise<void> => {
  const request: ProvinceRequestPayload = {
    region_id: regionId,
    page_request: {
      page: defaultPage,
      size: defaultPageSize,
      name: undefined
    },
  }

  const fetchedProvinces: Pageable<Province> | undefined = await philippineLocationTanstackService.getAllProvinces(props.queryClient, request)
  provinces.value = fetchedProvinces?.content ?? []
  cities.value = []
  baranggays.value = []

  const fields: (keyof PatientFormState)[] = ['province', 'city', 'baranggay']
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
    },
  }

  const fetchedCities: Pageable<City> | undefined = await philippineLocationTanstackService.getAllCities(props.queryClient, request)
  cities.value = fetchedCities?.content ?? []
  baranggays.value = []

  const fields: (keyof PatientFormState)[] = ['city', 'baranggay']
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
    },
  }

  const fetchedBaranggays: Pageable<Baranggay> | undefined = await philippineLocationTanstackService.getAllBaranggays(props.queryClient, request)
  baranggays.value = fetchedBaranggays?.content ?? []

  const field: keyof PatientFormState = 'baranggay'
  form.value?.setFieldValue(field, null)
}

/**
 * When saving fetch the APIs and populate when there's draft values
 * When editing fetch the APIs and populate from the currently selected values
 */
const onShow = async (): Promise<void> => {
  if (!isEditing.value) {
    await populateOnDraft()
    return
  }
  await populateOnEdit()
}

const populateOnEdit = async (): Promise<void> => {
  const regionId: number | undefined = selectedPatient.value?.region_id
  const provinceId: number | undefined = selectedPatient.value?.province_id
  const cityId: number | undefined = selectedPatient.value?.city_id
  if (!regionId || !provinceId || !cityId) return

  await Promise.all([
    onRegionChangeFn(regionId),
    onProvinceChangeFn(regionId, provinceId),
    onCityChangeFn(regionId, provinceId, cityId)
  ])

  const initialValues: Partial<PatientFormState> = {
    first_name: selectedPatient.value?.first_name,
    middle_name: selectedPatient.value?.middle_name,
    last_name: selectedPatient.value?.last_name,
    age: selectedPatient.value?.age,
    gender: genders.value?.find(g => g.id === selectedPatient.value?.gender_id),
    civil_status: civilStatuses.value?.find(cs => cs.id === selectedPatient.value?.civil_status_id),
    occupation: selectedPatient.value?.occupation,
    religion: religions.value?.find(r => r.id === selectedPatient.value?.religion_id),
    mode_of_referral: modeOfReferrals.value?.find(mor => mor.id === selectedPatient.value?.mode_of_referral_id),
    referred_by: selectedPatient.value?.referred_by,
    clinic: clinics.value?.find(c => c.id === selectedPatient.value?.clinic_id),

    // Contact information
    phone_number: selectedPatient.value?.phone_number,
    email: selectedPatient.value?.email,
    fb_link: selectedPatient.value?.fb_link,

    // Address information
    region: regions.value?.find(r => r.id === selectedPatient.value?.region_id),
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

  if (draft.region)
    await onRegionChangeFn(draft.region.id)

  if (draft.province)
    await onProvinceChangeFn(draft.province.region_id, draft.province.id)

  if (draft.city)
    await onCityChangeFn(draft.city.region_id, draft.city.province_id, draft.city.id)

  form.value?.setValues(draft)
}

const onSubmit = (event: FormSubmitEvent): void => {
  if (!event.valid) return
  emit('onSubmit', event)
}

const onClose = (): void => {
  toggle()
  emit('onClose')
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
  toggleDialog: toggle,
})
</script>
