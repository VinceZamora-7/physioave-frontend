<template>
  <Dialog
    :visible="visible"
    modal
    :header="editingId ? 'Edit Appointment' : 'Create Appointment'"
    :style="{ width: '108rem', maxWidth: '98vw' }"
    :contentStyle="{ maxHeight: 'calc(100vh - 8rem)', overflow: 'auto' }"
    :draggable="false"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="space-y-6">
      <!-- Simplified Header -->
      <section class="app-appointment-card app-appointment-card-secondary sm:p-5">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div class="min-w-0">
            <h3 class="text-xl font-black sm:text-2xl">
              {{ editingId ? "Update appointment" : "Create appointment" }}
            </h3>
            <p class="mt-1 text-sm text-[rgb(var(--app-fg))]/60">
              Choose the patient, billing path, planned services, care details, and schedule. Time slots are suggestions; manual scheduling is still allowed.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button
              v-if="canCreateFollowUp"
              label="Follow-up"
              icon="pi pi-calendar-plus"
              severity="secondary"
              outlined
              size="small"
              @click="$emit('create-follow-up')"
            />
            <div v-if="isFollowUpMode" class="app-appointment-summary-card px-3 py-2 text-center">
              <span class="block text-[10px] font-black uppercase tracking-widest app-appointment-muted">Follow-up</span>
              <strong class="block text-sm font-black app-appointment-value">Uses existing credit</strong>
            </div>
            <div class="app-appointment-summary-card px-3 py-2 text-center">
              <span class="block text-[10px] font-black uppercase tracking-widest app-appointment-muted">Branch</span>
              <strong class="block text-sm font-black app-appointment-value">{{ selectedClinic?.label || "All branches" }}</strong>
            </div>
            <div class="app-appointment-summary-card px-3 py-2 text-center">
              <span class="block text-[10px] font-black uppercase tracking-widest app-appointment-muted">Services</span>
              <strong class="block text-sm font-black app-appointment-value">{{ selectedServices.length }}</strong>
            </div>
            <div class="app-appointment-summary-card px-3 py-2 text-center">
              <span class="block text-[10px] font-black uppercase tracking-widest app-appointment-muted">Sessions</span>
              <strong class="block text-sm font-black app-appointment-value">{{ sessionCount }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.45fr)]">
        <!-- Section 1: Patient Data -->
        <section class="app-appointment-card sm:p-5">
          <div class="flex items-start justify-between gap-3">
            <FormSectionHeader index="1" title="Patient Data" description="Select the patient, branch, and starting appointment status." />
            <span class="app-appointment-chip font-black uppercase tracking-widest">
              Required
            </span>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div class="space-y-1.5 md:col-span-2 xl:col-span-1">
              <label class="block text-xs font-black uppercase tracking-wider app-form-muted-label">Patient <span class="app-brand-required">*</span></label>
              <Select
                v-model="form.patient_id"
                :options="patientOptions"
                optionLabel="label"
                optionValue="value"
                filter
                fluid
                placeholder="Select patient"
                class="py-3"
              >
                <template #option="{ option }">
                  {{ toTitleCase(option.label) }}
                </template>

                <template #value="{ value }">
                  {{
                    toTitleCase(
                      patientOptions.find(p => p.value === value)?.label || ''
                    )
                  }}
                </template>
              </Select>
              <p class="text-xs font-semibold app-appointment-muted">Required before saving.</p>
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-black uppercase tracking-wider app-form-muted-label">
                Clinic Branch
                <span class="ml-1 text-[10px] normal-case app-appointment-muted">(Uses sidebar branch if available)</span>
              </label>
              <Select
                v-model="form.clinic_id"
                :options="clinicOptions"
                optionLabel="label"
                optionValue="value"
                fluid
                placeholder="Select branch"
                :disabled="Boolean(activeBranchId)"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Status</label>
              <div class="flex min-h-10 items-center rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-3 text-sm font-bold text-[rgb(var(--app-fg))]/75">
                {{ appointmentStatusLabel }}
              </div>
            </div>

            <div class="space-y-2 md:col-span-2 xl:col-span-1">
              <p class="text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Sponsor Billing Eligibility</p>
              <div class="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
                <div
                  v-for="item in sponsorEligibility"
                  :key="item.payerType"
                  :class="[
                    'rounded-xl border px-3 py-2',
                    sponsorEligibilityClass(item.status)
                  ]"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-black text-[rgb(var(--app-fg))]">{{ item.label }}</span>
                    <span class="text-[10px] font-black uppercase">{{ sponsorEligibilityLabel(item.status) }}</span>
                  </div>
                  <p class="mt-1 text-xs leading-4 text-[rgb(var(--app-fg))]/65">{{ item.detail }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 2: Billing Type and Planned Services -->
        <section class="app-appointment-card app-appointment-card-secondary sm:p-5">
          <div class="flex items-start justify-between gap-3">
            <FormSectionHeader
              index="2"
              title="Billing Type and Planned Services"
              description="Pick the billing path first. The service picker will adjust to what that billing type allows."
            />
            <span class="app-appointment-chip font-black uppercase tracking-widest">
              Important
            </span>
          </div>

          <div class="mt-5 space-y-5">
            <!-- Billing Type Cards -->
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <button
                v-for="option in payerOptions"
                :key="String(option.value)"
                type="button"
                :aria-label="`Select ${option.label} billing type`"
                :class="[
                  'group rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg',
                  selectedBillingTypeValue === String(option.value)
                    ? 'border-[rgb(var(--app-active-border))] bg-[rgb(var(--app-active-bg))] shadow-lg ring-2 ring-[rgba(var(--app-focus-ring),0.18)]'
                    : 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] hover:border-[rgb(var(--app-hover-border))] hover:bg-[rgb(var(--app-hover-bg))]'
                ]"
                @click="form.payer_type = option.value; selectBillingType(option.value)"
                @keydown.enter="form.payer_type = option.value; selectBillingType(option.value)"
                @keydown.space="form.payer_type = option.value; selectBillingType(option.value)"
                tabindex="0"
              >
                <div class="flex items-start gap-3">
                  <span
                    :class="[
                            'app-brand-icon h-10 w-10 text-base transition',
                            selectedBillingTypeValue === String(option.value)
                              ? 'bg-[rgb(var(--app-primary))] text-[rgb(var(--app-button-primary-fg))]'
                              : 'app-brand-icon-primary'
                    ]"
                  >
                    <i :class="billingTypeIcon(option.value)" />
                  </span>
                  <div class="min-w-0">
                    <div class="text-sm font-black text-[rgb(var(--app-fg))]">{{ option.label }}</div>
                    <p class="mt-1 line-clamp-3 text-xs leading-5 text-[rgb(var(--app-fg))]/60">
                      {{ billingTypeDescription(option.value) }}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <!-- Selected billing type display -->
            <div
              :class="[
                'rounded-xl border p-4',
                hasSelectedBillingType
                  ? 'border-[rgb(var(--app-active-border))] bg-[rgb(var(--app-active-bg))]'
                  : 'border-[rgb(var(--patient-form-warning-border))] bg-[rgb(var(--patient-form-warning-bg))]'
              ]"
            >
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--app-fg))]/45">Selected billing path</p>
                  <h5 class="mt-1 text-sm font-black text-[rgb(var(--app-fg))]">{{ selectedBillingTypeLabel }}</h5>
                  <p class="mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/65">{{ selectedBillingTypeDescription }}</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
              <!-- Service Category Picker -->
              <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--app-fg))]/45">Service category</p>
                    <h5 class="mt-1 text-base font-black text-[rgb(var(--app-fg))]">{{ currentCategoryLabel }}</h5>
                  </div>
                  <span class="app-appointment-chip font-black">
                    {{ currentServiceOptions.length }} option{{ currentServiceOptions.length === 1 ? "" : "s" }}
                  </span>
                </div>

                <div class="mt-4 space-y-2">
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <button
                      v-for="option in serviceTypeOptions"
                      :key="option.value"
                      type="button"
                      :class="[
                        'rounded-xl border p-3 text-left transition hover:-translate-y-0.5',
                        servicePicker.type === option.value
                          ? 'border-[rgb(var(--app-active-border))] bg-[rgb(var(--app-active-bg))] shadow-md ring-2 ring-[rgba(var(--app-focus-ring),0.18)]'
                          : 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] hover:border-[rgb(var(--app-hover-border))] hover:bg-[rgb(var(--app-hover-bg))]'
                      ]"
                      @click="setServiceType(String(option.value))"
                    >
                      <div class="flex items-start gap-2.5">
                        <span
                          :class="[
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm',
                            servicePicker.type === option.value ? 'bg-[rgb(var(--app-secondary))] text-white' : 'app-brand-icon-secondary'
                          ]"
                        >
                          <i :class="serviceTypeIcon(String(option.value))" />
                        </span>
                        <div class="min-w-0">
                          <div class="text-xs font-black text-[rgb(var(--app-fg))]">{{ option.label }}</div>
                          <p class="mt-1 line-clamp-2 text-[11px] leading-4 text-[rgb(var(--app-fg))]/55">
                            {{ serviceCategoryDescription(option.value) }}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <!-- Service Preview -->
                <div class="mt-4 rounded-xl border border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3">
                  <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <strong class="text-sm text-[rgb(var(--app-fg))]">
                      {{ selectedServiceOption?.label || "No service selected" }}
                    </strong>
                    <span class="text-xs font-bold text-[rgb(var(--app-fg))]/60">{{ selectedServicePriceLabel }}</span>
                  </div>
                  <p class="mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/55">
                    Package quantity is locked to 1.
                  </p>
                </div>
              </section>

              <!-- Service Selection & List -->
              <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
                <div class="my-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_8rem_auto] lg:items-end">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Service</label>
                    <Select
                      v-model="servicePicker.id"
                      :options="currentServiceOptions"
                      optionLabel="label"
                      optionValue="pickerValue"
                      filter
                      fluid
                      placeholder="Select service"
                    />
                  </div>

                  <div class="space-y-1.5">
                    <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Qty</label>
                    <InputNumber
                      v-model="servicePicker.quantity"
                      :min="1"
                      showButtons
                      fluid
                      :disabled="servicePicker.type === 'PACKAGE'"
                    />
                  </div>

                  <Button
                    label="Add"
                    icon="pi pi-plus"
                    :disabled="!servicePicker.id"
                    @click="$emit('add-picked-service')"
                  />
                </div>

                <!-- Selected Services Header -->
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--app-fg))]/45">Planned services</p>
                    <h5 class="mt-1 text-base font-black text-[rgb(var(--app-fg))]">Added to this appointment</h5>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Button
                      label="Use Last Services"
                      icon="pi pi-history"
                      severity="secondary"
                      outlined
                      size="small"
                      :loading="isCopyingLastServices"
                      :disabled="Boolean(editingId) || !form.patient_id || isCopyingLastServices"
                      @click="$emit('use-last-services')"
                    />
                    <span class="app-appointment-chip font-black">
                      {{ selectedServices.length }} selected
                    </span>
                  </div>
                </div>

                <!-- Empty State -->
                <div
                  v-if="!selectedServices.length"
                  class="mt-4 rounded-xl border border-dashed border-[rgb(var(--app-border))] p-6 text-center"
                >
                  <i class="pi pi-plus-circle text-2xl text-[rgb(var(--app-fg))]/40" />
                  <div class="mt-2 text-sm font-semibold text-[rgb(var(--app-fg))]/60">No planned services yet</div>
                  <p class="mt-1 text-xs text-[rgb(var(--app-fg))]/50">Select a billing type and service category above</p>
                </div>

                <!-- Service List -->
                <div class="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                  <article
                    v-for="(service, index) in selectedServices"
                    :key="service.type + '-' + service.value + '-' + index"
                    class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="app-appointment-chip px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            {{ service.typeLabel }}
                          </span>
                          <span class="app-appointment-chip px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            Qty {{ service.quantity }}
                          </span>
                        </div>
                        <div class="mt-2 break-words text-sm font-black text-[rgb(var(--app-fg))]">
                          {{ service.name }}
                        </div>
                        <div
                          v-if="isPackageLikeService(service) && includedServicesForDisplay(service).length"
                          class="mt-1 text-xs font-semibold text-[rgb(var(--app-fg))]/60"
                        >
                          Included qty: {{ sessionQuantityForDisplay(service) }}
                        </div>
                      </div>

                      <Button
                        icon="pi pi-times"
                        text
                        rounded
                        severity="danger"
                        aria-label="Remove service"
                        @click="$emit('remove-selected-service', index)"
                      />
                    </div>

                    <!-- Included Services -->
                    <div
                      v-if="includedServicesForDisplay(service).length"
                      class="mt-3 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3"
                    >
                      <div class="text-[10px] font-black uppercase tracking-widest app-appointment-muted">Included services</div>
                      <div class="mt-2 space-y-1.5">
                        <div
                          v-for="(included, includedIndex) in includedServicesForDisplay(service)"
                          :key="'service.value-' + included.name + '-' + includedIndex"
                          class="flex items-center justify-between gap-3 rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-3 py-1.5 text-xs text-[rgb(var(--app-fg))]"
                        >
                          <span class="min-w-0 truncate font-semibold">{{ included.name }}</span>
                          <strong class="shrink-0 font-black">Qty {{ included.quantity }}</strong>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>
              </section>
            </div>
          </div>
        </section>

        <!-- Section 3: Patient Care and Evaluation Visit -->
        <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-3">
            <FormSectionHeader
              index="3"
              title="Patient Care and Evaluation Visit"
              description="Assign staff and configure visit type. Clinical details are optional."
            />
            <span class="app-appointment-chip font-black uppercase tracking-widest">
              Optional
            </span>
          </div>

          <div class="space-y-6">
            <!-- Group 1: Clinical Staff -->
            <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
              <div class="mb-4 flex items-center gap-2">
                <span class="app-brand-icon app-brand-icon-primary h-8 w-8">
                  <i class="pi pi-users" />
                </span>
                <div>
                  <h4 class="text-sm font-black text-[rgb(var(--app-fg))]">Clinical Staff</h4>
                  <p class="text-xs text-[rgb(var(--app-fg))]/60">Assign physical therapists for this appointment</p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">
                    Main PT
                    <span class="ml-1 text-[10px] normal-case app-brand-required">(Required)</span>
                  </label>
                  <Select
                    v-model="mainPtStaffId"
                    :options="mainPtOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    fluid
                    placeholder="Select Physical Therapist"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Assistant PT</label>
                  <Select
                    v-model="assistantPtStaffId"
                    :options="assistantPtOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    fluid
                    placeholder="Select PT Assistant"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Intern PT</label>
                  <Select
                    v-model="internPtStaffId"
                    :options="internPtOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    fluid
                    placeholder="Select Intern"
                  />
                </div>
              </div>

              <div class="mt-4 space-y-1.5">
                <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Referring Doctor</label>
                <Select
                  v-model="form.referring_staff_id"
                  :options="branchDoctorOptions"
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  filter
                  fluid
                  placeholder="Optional - Select referring doctor if applicable"
                />
              </div>
            </div>

            <!-- Group 2: Visit Configuration -->
            <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
              <div class="mb-4 flex items-center gap-2">
                <span class="app-brand-icon app-brand-icon-secondary h-8 w-8">
                  <i class="pi pi-calendar-check" />
                </span>
                <div>
                  <h4 class="text-sm font-black text-[rgb(var(--app-fg))]">Visit Configuration</h4>
                  <p class="text-xs text-[rgb(var(--app-fg))]/60">Define the type and phase of this visit</p>
                </div>
              </div>

              <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Appointment Type</label>
                  <Select
                    v-model="form.appointment_type_id"
                    :options="appointmentTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    fluid
                    placeholder="Select type"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Visit Phase</label>
                  <Select
                    v-model="form.appointment_phase"
                    :options="phaseOptions"
                    optionLabel="label"
                    optionValue="value"
                    fluid
                    placeholder="Select phase"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Specialty</label>
                  <Select
                    v-model="form.specialty_tag_id"
                    :options="specialtyOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    fluid
                    placeholder="Optional specialty"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Clinic Area</label>
                  <Select
                    v-model="form.treatment_area_id"
                    :options="clinicAreaOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    fluid
                    placeholder="Optional treatment area"
                  />
                </div>
              </div>
            </div>

            <!-- Group 3: Clinical Details (Toggleable) -->
            <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))]">
              <button
                type="button"
                class="flex w-full items-center justify-between p-4 transition hover:bg-[rgb(var(--app-bg))]"
                @click="showClinicalDetails = !showClinicalDetails"
              >
                <div class="flex items-center gap-3">
                  <span class="app-brand-icon app-brand-icon-accent h-8 w-8">
                    <i class="pi pi-file-medical" />
                  </span>
                  <div>
                    <h4 class="text-sm font-black text-[rgb(var(--app-fg))]">Clinical Details</h4>
                    <p class="text-xs text-[rgb(var(--app-fg))]/60">
                      {{ showClinicalDetails ? 'Add diagnosis and notes' : 'Optional - Add diagnosis and notes' }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span
                    v-if="hasClinicalDetails"
                    class="app-appointment-chip px-2 py-0.5 text-[10px] font-black"
                  >
                    Filled
                  </span>
                  <i :class="['pi', showClinicalDetails ? 'pi-chevron-down' : 'pi-chevron-right', 'text-[rgb(var(--app-fg))]/60 transition-transform']" />
                </div>
              </button>

              <div v-show="showClinicalDetails" class="px-4 pb-4">
                <div class="border-t border-[rgb(var(--app-border))] pt-4">
                  <div class="grid grid-cols-1 gap-6">
                    <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
                      <div class="mb-3 flex items-center gap-2">
                        <i class="pi pi-heart text-[rgb(var(--app-fg))]/60" />
                        <h5 class="text-sm font-black text-[rgb(var(--app-fg))]">Doctor Diagnosis</h5>
                      </div>

                      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div class="space-y-1.5">
                          <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Diagnosis</label>
                          <Select
                            v-model="form.medical_diagnose_id"
                            :options="medicalDiagnoseOptions"
                            optionLabel="label"
                            optionValue="value"
                            showClear
                            filter
                            fluid
                            placeholder="Select diagnosis (optional)"
                          />
                        </div>

                        <div class="space-y-1.5">
                          <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Laterality</label>
                          <Select
                            v-model="form.diagnosis_laterality"
                            :options="lateralityOptions"
                            optionLabel="label"
                            optionValue="value"
                            showClear
                            fluid
                            placeholder="Select laterality (optional)"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
                      <div class="mb-3 flex items-center gap-2">
                        <i class="pi pi-comment-dots text-[rgb(var(--app-fg))]/60" />
                        <h5 class="text-sm font-black text-[rgb(var(--app-fg))]">Clinical Notes</h5>
                      </div>

                      <Textarea
                        v-model="form.notes"
                        rows="5"
                        autoResize
                        fluid
                        placeholder="Add clinical observations, special considerations, or scheduling remarks..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Section 4: Schedule -->
        <section class="app-appointment-card app-appointment-card-accent sm:p-5 xl:col-span-2">
          <div class="flex flex-col gap-3 border-b border-[rgb(var(--app-border))] pb-4 lg:flex-row lg:items-start lg:justify-between">
            <FormSectionHeader
              index="4"
              title="Schedule"
              description="Generate sessions, choose available slots, or manually edit any date and time."
              compact
            />

            <div class="app-appointment-chip inline-flex w-fit text-xs font-black">
              {{ sessionCount }} session{{ sessionCount === 1 ? "" : "s" }}
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(20rem,0.7fr)_minmax(0,1.3fr)]">
            <div class="space-y-4">
              <div class="rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">
                <div class="text-sm font-black text-[rgb(var(--app-fg))]">Session Dates</div>
                <div class="mt-1 text-xs app-appointment-muted">
                  Required: {{ sessionCount }} appointment{{ sessionCount === 1 ? "" : "s" }} - Sending {{ form.session_dates?.length || 0 }} date{{ (form.session_dates?.length || 0) === 1 ? "" : "s" }}
                </div>
              </div>

              <label
                v-if="!editingId && !isFollowUpMode"
                class="flex cursor-pointer items-start gap-3 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 text-sm text-[rgb(var(--app-fg))] transition hover:bg-[rgb(var(--app-hover-bg))]"
              >
                <Checkbox
                  v-model="form.add_initial_evaluation_appointment"
                  binary
                  inputId="add-initial-evaluation-appointment"
                  class="mt-0.5 shrink-0"
                />
                <span class="min-w-0">
                  <span class="block font-black">Add initial evaluation appointment</span>
                  <span class="mt-1 block text-xs leading-5 app-appointment-muted">
                    Adds one extra appointment date before the main treatment sessions. Attendance will still consume the selected planned service credit.
                  </span>
                </span>
              </label>

              <div class="flex flex-wrap gap-2">
                <Button
                  label="Add Session"
                  icon="pi pi-plus"
                  size="small"
                  class="app-primary-action"
                  @click="$emit('add-session-date')"
                />
                <Button
                  label="Weekly"
                  icon="pi pi-calendar-plus"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="$emit('generate-session-dates', 'WEEKLY')"
                />
                <Button
                  label="Every Other Day"
                  icon="pi pi-calendar-plus"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="$emit('generate-session-dates', 'EVERY_OTHER_DAY')"
                />
                <Button
                  label="Daily"
                  icon="pi pi-calendar-plus"
                  severity="secondary"
                  outlined
                  size="small"
                  @click="$emit('generate-session-dates', 'DAILY')"
                />
              </div>

              <div class="app-inline-banner text-sm">
                <strong>Two booking options:</strong> click an available slot to auto-fill, or manually edit date/time on any session card.
              </div>
            </div>

            <div class="grid max-h-[30rem] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
              <div
                v-if="!form.session_dates?.length"
                class="rounded-xl border border-dashed border-[rgb(var(--app-border))] p-6 text-center md:col-span-2 2xl:col-span-3"
              >
                <i class="pi pi-calendar-plus text-2xl text-[rgb(var(--app-fg))]/40" />
                <div class="mt-2 text-sm font-semibold text-[rgb(var(--app-fg))]/60">No sessions configured</div>
                <p class="mt-1 text-xs text-[rgb(var(--app-fg))]/50">Set "First Start" time or click a generation button above</p>
              </div>

              <article
                v-for="(_, index) in form.session_dates"
                :key="index"
                :class="[
                  'rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md',
                  activeSessionIndex === index
                    ? 'border-[rgb(var(--app-active-border))] bg-[rgb(var(--app-active-bg))] ring-2 ring-[rgba(var(--app-focus-ring),0.18)]'
                    : 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))]'
                ]"
              >
                <button
                  type="button"
                  class="w-full text-left"
                  @click="selectSession(index)"
                >
                  <span class="text-[10px] font-black uppercase tracking-widest text-[rgb(var(--app-fg))]/45">Session {{ index + 1 }}</span>
                  <strong class="mt-1 block text-sm font-black text-[rgb(var(--app-fg))]">{{ formatSessionDate(form.session_dates[index]) }}</strong>
                  <small class="mt-1 block text-xs font-bold text-[rgb(var(--app-fg))]/60">
                    {{ formatTimeValue(form.session_dates[index]) }} - {{ formatTimeValue(getSessionEnd(form.session_dates[index])) }}
                  </small>
                </button>

                <div class="mt-3 space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Date & Time</label>
                  <DatePicker
                    :modelValue="asDate(form.session_dates[index])"
                    showTime
                    hourFormat="12"
                    showIcon
                    fluid
                    @focus="selectSession(index)"
                    @update:modelValue="setManualSessionDate(index, $event)"
                  />
                </div>

                <Button
                  icon="pi pi-search"
                  size="small"
                  severity="secondary"
                  outlined
                  class="mt-2 w-full"
                  @click="selectSession(index)"
                />

                <Button
                  v-if="index > 0"
                  label="Remove Session"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  text
                  class="mt-1 w-full"
                  @click="$emit('remove-session-date', index)"
                />
              </article>
            </div>
          </div>
        </section>

        <!-- Section 5: Time Slot Availability -->
        <section class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5 xl:col-span-2">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <FormSectionHeader
              index="5"
              title="Time Slot Availability"
              description="Available and taken slots for the active session. Slots are suggestions only."
              compact
            />

            <div class="flex flex-wrap gap-2">
              <span class="app-appointment-chip text-xs font-black">{{ availableSlotCount }} available</span>
              <span class="app-appointment-chip text-xs font-black">{{ takenSlotCount }} taken</span>
            </div>
          </div>

          <div class="mt-4 rounded-xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
            <div class="text-base font-black text-[rgb(var(--app-fg))]">{{ selectedAvailabilityDateLabel }}</div>
            <div class="mt-1 text-xs text-[rgb(var(--app-fg))]/60">{{ availabilityScopeLabel }}</div>
          </div>

          <div v-if="manualScheduleWarnings.length" class="mt-4 grid gap-2">
            <div
              v-for="warning in manualScheduleWarnings"
              :key="warning"
              class="app-brand-warning flex items-start gap-2 text-sm font-semibold"
            >
              <i class="pi pi-exclamation-triangle mt-0.5" />
              <span>{{ warning }}</span>
            </div>
          </div>

          <div v-if="isAvailabilityLoading" class="flex items-center gap-2 py-8 text-sm text-[rgb(var(--app-fg))]/60">
            <i class="pi pi-spin pi-spinner text-[rgb(var(--app-secondary))]" />
            Loading available and taken time slots...
          </div>

          <div
            v-else-if="!availabilitySlots.length"
            class="py-8 text-center text-sm font-semibold text-[rgb(var(--app-fg))]/60"
          >
            <i class="pi pi-calendar-x text-2xl text-[rgb(var(--app-fg))]/40" />
            <div class="mt-2">No slots available for this branch on the selected date</div>
            <p class="mt-1 text-xs">You can still manually set the date and time above</p>
          </div>

          <div v-else class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <article
              v-for="slot in availabilitySlots"
              :key="slot.key"
              :class="[
                'min-h-[7rem] rounded-xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md',
                slot.taken
                  ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-100'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100'
              ]"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="break-words text-sm font-black leading-tight">
                    {{ formatTime(slot.start) }} - {{ formatTime(slot.end) }}
                  </div>
                  <div class="mt-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                    {{ slot.taken ? "Taken" : "Available" }}
                  </div>
                </div>

                <Button
                  v-if="!slot.taken"
                  label="Use"
                  size="small"
                  text
                  rounded
                  @click="setSlotForActiveSession(slot)"
                />
              </div>

              <div v-if="slot.taken" class="mt-2 space-y-1.5">
                <div
                  v-for="appointment in slot.takenBy"
                  :key="appointment.id"
                  class="rounded-lg border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-1.5 text-xs shadow-sm"
                >
                  <div class="font-black">{{ appointment.provider_name || appointment.doctor_name || "Unassigned PT" }}</div>
                  <div class="font-semibold">{{ appointment.patient_name || "Unnamed patient" }}</div>
                  <div class="opacity-75">{{ formatTimeValue(appointment.starts_at) }} - {{ formatTimeValue(appointment.ends_at) }}</div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>
    </div>

    <template #footer>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div v-if="blockingScheduleMessage" class="sm:w-full">
          <div class="app-brand-warning text-left font-semibold">
            <i class="pi pi-exclamation-triangle mr-1 mt-0.5 inline" />
            {{ blockingScheduleMessage }}
          </div>
        </div>

        <div class="flex gap-2 sm:justify-end">
          <Button
            label="Cancel"
            severity="secondary"
            outlined
            @click="$emit('update:visible', false)"
          />

          <Button
            label="Save Appointment"
            icon="pi pi-save"
            :loading="isSaving"
            :disabled="isSaving"
            :pt="ptPrimaryBtn"
            @click="submitSave"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>


<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from "vue"
import Button from "primevue/button"
import Checkbox from "primevue/checkbox"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import Select from "primevue/select"
import Textarea from "primevue/textarea"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"

type AppointmentProviderType = "PHYSICAL_THERAPIST" | "PT_ASSISTANT" | "INTERN" | "DOCTOR_CONSULTANT" | string
type SelectOption = {
  label: string
  value: number | string | null
  clinicId?: number | null
  providerType?: AppointmentProviderType | null
  secondaryProviderType?: AppointmentProviderType | null
}
type Option<T extends string | number = string | number> = { label: string; value: T }
type SessionMode = "DAILY" | "EVERY_OTHER_DAY" | "WEEKLY"
type ScheduleAppointment = Record<string, any>
type SponsorEligibilityStatus = "available" | "active" | "missing" | "blocked" | "loading"
type SponsorEligibilityItem = {
  payerType: string
  label: string
  status: SponsorEligibilityStatus
  detail: string
}
type ClinicSchedule = {
  startDay: number
  endDay: number
  startTime: string
  endTime: string
}
type TimeSlot = {
  key: string
  start: Date
  end: Date
  taken: boolean
  takenBy: ScheduleAppointment[]
}

type SamePtTimeConflict = {
  sessionIndex: number
  sessionStart: Date
  sessionEnd: Date
  staffId: number
  staffRole: string
  appointments: ScheduleAppointment[]
}

const FormSectionHeader = defineComponent({
  name: "FormSectionHeader",
  props: {
    index: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    compact: { type: Boolean, default: false }
  },
  setup(componentProps) {
    return () => h(
      "div",
      {
        class: [
          "flex items-start gap-3",
          componentProps.compact ? "mb-0" : "mb-4"
        ]
      },
      [
        h(
          "span",
          {
            class: "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--app-primary))] text-sm font-black text-[rgb(var(--app-button-primary-fg))] shadow-lg shadow-black/10"
          },
          componentProps.index
        ),
        h("div", { class: "min-w-0" }, [
          h("h4", { class: "text-base font-black text-[rgb(var(--app-fg))]" }, componentProps.title),
          h("p", { class: "mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/60" }, componentProps.description)
        ])
      ]
    )
  }
})

const props = defineProps<{
  visible: boolean
  editingId: number | null
  isSaving: boolean
  isCopyingLastServices: boolean
  isFollowUpMode?: boolean
  canCreateFollowUp?: boolean
  form: Record<string, any>
  sessionCount: number
  selectedClinic: SelectOption | null
  selectedClinicSchedule: ClinicSchedule | null
  selectedServices: Array<Record<string, any>>
  patientOptions: SelectOption[]
  clinicOptions: SelectOption[]
  activeBranchId: number | null
  ptOptions: SelectOption[]
  doctorOptions: SelectOption[]
  payerOptions: Option[]
  sponsorEligibility: SponsorEligibilityItem[]
  appointmentTypeOptions: SelectOption[]
  appointmentStatusLabel: string
  phaseOptions: Option[]
  specialtyOptions: SelectOption[]
  clinicAreaOptions: SelectOption[]
  medicalDiagnoseOptions: SelectOption[]
  lateralityOptions: Option[]
  serviceTypeOptions: Option[]
  servicePicker: Record<string, any>
  currentServiceOptions: Array<Record<string, any>>
  scheduleAppointments: ScheduleAppointment[]
  isAvailabilityLoading: boolean
}>()

// Toggle state
const showClinicalDetails = ref(false)

// Check if clinical details have been filled
const hasClinicalDetails = computed(() =>
  Boolean(
    props.form.medical_diagnose_id
    || props.form.diagnosis_laterality
    || props.form.notes
  )
)

const emit = defineEmits<{
  "update:visible": [value: boolean]
  "generate-session-dates": [mode: SessionMode]
  "add-session-date": []
  "remove-session-date": [index: number]
  "add-picked-service": []
  "remove-selected-service": [index: number]
  "use-last-services": []
  "create-follow-up": []
  save: []
}>()

const selectedBillingTypeValue = computed(() => String(props.form.payer_type ?? ""))

const selectBillingType = (value: string | number | null): void => {
  props.form.payer_type = value
  props.servicePicker.id = null
}

const sponsorEligibilityLabel = (status: SponsorEligibilityStatus): string => {
  if (status === "active") return "Active"
  if (status === "available") return "Open"
  if (status === "blocked") return "Blocked"
  if (status === "loading") return "Checking"
  return "Missing"
}

const sponsorEligibilityClass = (status: SponsorEligibilityStatus): string => {
  if (status === "active" || status === "available") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
  if (status === "blocked") return "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/20"
  if (status === "loading") return "border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-950/20"
  return "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20"
}

const billingTypeIcon = (value: unknown): string => {
  const type = String(value ?? "")
  if (type === "SELF_PAY_SINGLE") return "pi pi-wallet"
  if (type === "SELF_PAY_PACKAGE") return "pi pi-box"
  if (type === "HMO") return "pi pi-id-card"
  if (type === "LGU") return "pi pi-building"
  return "pi pi-credit-card"
}

const billingTypeDescription = (value: unknown): string => {
  const type = String(value ?? "")
  if (type === "SELF_PAY_SINGLE") return "Use for per-visit cash services, bundles, machines, techniques, evaluation, and add-ons."
  if (type === "SELF_PAY_PACKAGE") return "Use for one package bill shared by all sessions. Add-ons can still be attached."
  if (type === "HMO") return "Use for claim-based sessions that need approval, LOA, or HMO documentation."
  if (type === "LGU") return "Use for LGU-sponsored package/session claims using contract or drop-out rates."
  return "Select a billing type first so the service list shows the correct choices."
}

const selectedBillingTypeLabel = computed(() =>
  props.payerOptions.find(option => String(option.value) === selectedBillingTypeValue.value)?.label ?? "No billing type selected"
)

const selectedBillingTypeDescription = computed(() => billingTypeDescription(props.form.payer_type))

const serviceCategoryDescription = (value: unknown): string => {
  const type = String(value ?? "")
  if (type === "PACKAGE") return "Multi-session plan. Package quantity stays 1; sessions come from included services."
  if (type === "BUNDLE") return "Grouped services with its own quantity/session count."
  if (type === "MACHINE") return "Machine-based individual service."
  if (type === "TECHNIQUE") return "Hands-on treatment or therapy technique."
  if (type === "EVALUATION") return "Evaluation, re-evaluation, or assessment service."
  if (type === "ADD_ON_MACHINE" || type === "ADD_ON_TECHNIQUE") return "All service add-ons attached to the visit or package."
  if (type === "ADD_ON_HOME_SERVICE") return "Home care add-ons for non-clinic visits."
  return "Service option available for the selected billing type."
}

const currentCategoryLabel = computed(() =>
  props.serviceTypeOptions.find(option => String(option.value) === String(props.servicePicker.type))?.label ?? "Select category"
)

const selectedServiceOption = computed(() =>
  props.currentServiceOptions.find(option => String(option.pickerValue) === String(props.servicePicker.id)) ?? null
)

const formatMoney = (value: unknown): string => {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount) || amount <= 0) return "Price not set"

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2
  }).format(amount)
}

const selectedServicePriceLabel = computed(() =>
  selectedServiceOption.value ? formatMoney(selectedServiceOption.value.price) : "Select a service to preview price"
)

const hasSelectedBillingType = computed(() => Boolean(props.form.payer_type))

const formBranchId = computed(() =>
  props.form.clinic_id ?? props.activeBranchId ?? null
)

const optionMatchesFormBranch = (option: SelectOption): boolean =>
  !formBranchId.value || Number(option.clinicId) === Number(formBranchId.value)

const branchPtOptions = computed(() =>
  props.ptOptions.filter(optionMatchesFormBranch)
)

const branchDoctorOptions = computed(() =>
  props.doctorOptions.filter(optionMatchesFormBranch)
)

const providerOptionMatchesType = (option: SelectOption, providerType: AppointmentProviderType): boolean =>
  option.providerType === providerType || option.secondaryProviderType === providerType

const mainPtOptions = computed(() =>
  branchPtOptions.value.filter(option => providerOptionMatchesType(option, "PHYSICAL_THERAPIST"))
)

const assistantPtOptions = computed(() =>
  branchPtOptions.value.filter(option => providerOptionMatchesType(option, "PT_ASSISTANT"))
)

const internPtOptions = computed(() =>
  branchPtOptions.value.filter(option => providerOptionMatchesType(option, "INTERN"))
)

const selectedProviderMatchesType = (fieldName: string, providerType: AppointmentProviderType): boolean =>
  branchPtOptions.value.some(option =>
    Number(option.value) === Number(props.form[fieldName])
    && providerOptionMatchesType(option, providerType)
  )

const mainPtStaffId = computed({
  get: () => selectedProviderMatchesType("primary_provider_staff_id", "PHYSICAL_THERAPIST") ? props.form.primary_provider_staff_id : null,
  set: value => {
    props.form.primary_provider_staff_id = value
  }
})

const assistantPtStaffId = computed({
  get: () => selectedProviderMatchesType("assistant_provider_staff_id", "PT_ASSISTANT") ? props.form.assistant_provider_staff_id : null,
  set: value => {
    props.form.assistant_provider_staff_id = value
  }
})

const internPtStaffId = computed({
  get: () => selectedProviderMatchesType("intern_provider_staff_id", "INTERN") ? props.form.intern_provider_staff_id : null,
  set: value => {
    props.form.intern_provider_staff_id = value
  }
})


const SLOT_STEP_MINUTES = 60
const DEFAULT_DURATION_MS = 60 * 60 * 1000
const MIN_DURATION_MS = 15 * 60 * 1000

const activeSessionIndex = ref(0)

const asDate = (value: unknown): Date | null => {
  if (!value) return null
  const date = value instanceof Date ? new Date(value) : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

const dateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

const formatTime = (value: Date): string =>
  value.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })

const formatTimeValue = (value: unknown): string => {
  const date = asDate(value)
  return date ? formatTime(date) : "--"
}

const isPackageLikeService = (service: Record<string, any>): boolean =>
  service.type === "PACKAGE" || service.type === "BUNDLE"

const includedServicesForDisplay = (service: Record<string, any>): Array<{ name: string; quantity: number }> => {
  const items = Array.isArray(service.includedServices) ? service.includedServices : []

  return items
    .map(item => ({
      name: String(item?.name ?? item?.service_name ?? item?.label ?? "Included service"),
      quantity: Math.max(1, Number(item?.quantity ?? item?.qty ?? item?.sessions ?? item?.session_count ?? 1))
    }))
    .filter(item => item.name.trim().length > 0)
}

const sessionQuantityForDisplay = (service: Record<string, any>): number => {
  const explicitSessionQuantity = Number(service.sessionQuantity ?? 0)
  if (Number.isFinite(explicitSessionQuantity) && explicitSessionQuantity > 0) {
    return explicitSessionQuantity
  }

  const includedQuantities = includedServicesForDisplay(service).map(item => item.quantity)
  if (includedQuantities.length) return Math.max(...includedQuantities)

  return Math.max(1, Number(service.quantity ?? 1))
}

const formatSessionDate = (value: unknown): string => {
  const date = asDate(value)
  return date
    ? date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "No date"
}

const timeToMinutes = (value?: string | null, fallback = 0): number => {
  const [hours, minutes] = String(value ?? "").split(":").map(part => Number(part))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback
  return hours * 60 + minutes
}

const dayNumber = (date: Date): number => {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

const isDayWithinClinicSchedule = (date: Date): boolean => {
  if (!props.selectedClinicSchedule) return true

  const day = dayNumber(date)
  const startDay = Number(props.selectedClinicSchedule.startDay)
  const endDay = Number(props.selectedClinicSchedule.endDay)

  if (!Number.isFinite(startDay) || !Number.isFinite(endDay)) return true
  if (startDay <= endDay) return day >= startDay && day <= endDay

  return day >= startDay || day <= endDay
}

const selectedSessionDate = computed(() => {
  const sessionDate = asDate(props.form.session_dates?.[activeSessionIndex.value])
  return sessionDate ?? asDate(props.form.starts_at) ?? new Date()
})

const selectedAvailabilityDateLabel = computed(() =>
  selectedSessionDate.value.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
)

const selectedSessionEnd = computed(() => getSessionEnd(selectedSessionDate.value))

const slotDurationMs = computed(() => {
  const startsAt = asDate(props.form.starts_at)
  const endsAt = asDate(props.form.ends_at)

  if (!startsAt || !endsAt) return DEFAULT_DURATION_MS

  return Math.max(MIN_DURATION_MS, endsAt.getTime() - startsAt.getTime())
})

const clinicStartMinute = computed(() => timeToMinutes(props.selectedClinicSchedule?.startTime, 7 * 60))
const clinicEndMinute = computed(() => timeToMinutes(props.selectedClinicSchedule?.endTime, 19 * 60))

const selectedClinicStart = computed(() => {
  const date = new Date(selectedSessionDate.value)
  date.setHours(Math.floor(clinicStartMinute.value / 60), clinicStartMinute.value % 60, 0, 0)
  return date
})

const selectedClinicEnd = computed(() => {
  const date = new Date(selectedSessionDate.value)
  date.setHours(Math.floor(clinicEndMinute.value / 60), clinicEndMinute.value % 60, 0, 0)
  return date
})

const isSelectedSessionOnClinicDay = computed(() => isDayWithinClinicSchedule(selectedSessionDate.value))

const isSelectedManualTimeWithinClinicHours = computed(() => {
  const start = selectedSessionDate.value
  const end = selectedSessionEnd.value

  if (!start || !end) return true

  return start.getTime() >= selectedClinicStart.value.getTime()
    && end.getTime() <= selectedClinicEnd.value.getTime()
})

const availabilityScopeLabel = computed(() => {
  const selectedPt = branchPtOptions.value.find(option => Number(option.value) === Number(props.form.primary_provider_staff_id))
  if (selectedPt?.label) return `Checking PT: ${selectedPt.label}`
  return "Checking branch schedule"
})

const matchesSelectedClinic = (appointment: ScheduleAppointment): boolean => {
  if (!props.form.clinic_id) return true
  return Number(appointment.clinic_id) === Number(props.form.clinic_id)
}

const numericId = (value: unknown): number | null => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null
}

const appointmentProviderId = (appointment: ScheduleAppointment): number | null =>
  numericId(appointment.primary_provider_staff_id ?? appointment.provider_staff_id ?? appointment.doctor_id)

const appointmentStaffIds = (appointment: ScheduleAppointment): number[] => {
  const ids = [
    appointment.primary_provider_staff_id,
    appointment.provider_staff_id,
    appointment.doctor_id,
    appointment.assistant_provider_staff_id,
    appointment.intern_provider_staff_id
  ]
    .map(numericId)
    .filter((id): id is number => id !== null)

  return Array.from(new Set(ids))
}

const matchesSelectedPt = (appointment: ScheduleAppointment): boolean => {
  if (!props.form.primary_provider_staff_id) return true
  return appointmentStaffIds(appointment).includes(Number(props.form.primary_provider_staff_id))
}

const isCanceledAppointment = (appointment: ScheduleAppointment): boolean => {
  const status = String(appointment.appointment_status ?? appointment.attendance_status ?? "").toUpperCase()
  return status.includes("CANCEL") || status.includes("NO SHOW") || status.includes("NO_SHOW")
}

const appointmentsForSelectedSession = computed(() => {
  const selectedKey = dateKey(selectedSessionDate.value)
  const hasSelectedPt = Boolean(props.form.primary_provider_staff_id)

  return props.scheduleAppointments.filter(appointment => {
    if (Number(appointment.id) === Number(props.editingId)) return false
    if (isCanceledAppointment(appointment)) return false

    const startsAt = asDate(appointment.starts_at)
    if (!startsAt || dateKey(startsAt) !== selectedKey) return false

    if (hasSelectedPt) {
      return matchesSelectedPt(appointment)
    }

    return matchesSelectedClinic(appointment)
  })
})

const overlaps = (leftStart: Date, leftEnd: Date, rightStart: Date, rightEnd: Date): boolean =>
  leftStart.getTime() < rightEnd.getTime() && rightStart.getTime() < leftEnd.getTime()

const overlappingManualAppointments = computed(() => {
  const start = selectedSessionDate.value
  const end = selectedSessionEnd.value
  if (!start || !end) return []

  return appointmentsForSelectedSession.value.filter(appointment => {
    const appointmentStart = asDate(appointment.starts_at)
    const appointmentEnd = asDate(appointment.ends_at)
    return appointmentStart && appointmentEnd && overlaps(start, end, appointmentStart, appointmentEnd)
  })
})

const selectedStaffAssignments = computed(() => {
  const assignments = [
    { staffId: numericId(props.form.primary_provider_staff_id), staffRole: "Main PT" },
    { staffId: numericId(props.form.assistant_provider_staff_id), staffRole: "Assistant PT" },
    { staffId: numericId(props.form.intern_provider_staff_id), staffRole: "Intern PT" }
  ]

  return assignments.filter((assignment): assignment is { staffId: number; staffRole: string } =>
    assignment.staffId !== null
  )
})

const samePtTimeConflicts = computed<SamePtTimeConflict[]>(() => {
  if (!selectedStaffAssignments.value.length) return []

  const sessionDates = Array.isArray(props.form.session_dates)
    ? props.form.session_dates
    : []

  const conflicts: SamePtTimeConflict[] = []

  sessionDates.forEach((sessionDate, sessionIndex) => {
    const sessionStart = asDate(sessionDate)
    if (!sessionStart) return

    const sessionEnd = new Date(sessionStart.getTime() + slotDurationMs.value)
    const selectedKey = dateKey(sessionStart)

    selectedStaffAssignments.value.forEach(assignment => {
      const appointments = props.scheduleAppointments.filter(appointment => {
        if (Number(appointment.id) === Number(props.editingId)) return false
        if (isCanceledAppointment(appointment)) return false
        if (!appointmentStaffIds(appointment).includes(assignment.staffId)) return false

        const appointmentStart = asDate(appointment.starts_at)
        const appointmentEnd = asDate(appointment.ends_at)

        if (!appointmentStart || !appointmentEnd) return false
        if (dateKey(appointmentStart) !== selectedKey) return false

        return overlaps(sessionStart, sessionEnd, appointmentStart, appointmentEnd)
      })

      if (!appointments.length) return

      conflicts.push({
        sessionIndex,
        sessionStart,
        sessionEnd,
        staffId: assignment.staffId,
        staffRole: assignment.staffRole,
        appointments
      })
    })
  })

  return conflicts
})

const hasSamePtTimeConflict = computed(() => samePtTimeConflicts.value.length > 0)

const blockingScheduleMessage = computed(() => {
  const conflict = samePtTimeConflicts.value[0]
  if (!isSelectedSessionOnClinicDay.value) {
    return "Cannot save. Selected date is outside this clinic's regular schedule."
  }

  if (!isSelectedManualTimeWithinClinicHours.value) {
    return "Cannot save. Selected time is outside clinic operating hours."
  }

  if (!conflict) return ""

  const appointment = conflict.appointments[0]
  const patientName = appointment?.patient_name || "another patient"
  const ptName = appointment?.provider_name || appointment?.doctor_name || conflict.staffRole || "selected staff"

  return `Cannot save. Session ${conflict.sessionIndex + 1} overlaps with ${ptName}'s existing appointment for ${patientName} from ${formatTimeValue(appointment?.starts_at)} to ${formatTimeValue(appointment?.ends_at)}.`
})

const manualScheduleWarnings = computed(() => {
  const warnings: string[] = []

  if (!isSelectedSessionOnClinicDay.value) {
    warnings.push("Selected date is outside this clinic's regular schedule.")
  }

  if (!isSelectedManualTimeWithinClinicHours.value) {
    warnings.push("Selected time is outside clinic operating hours.")
  }

  if (overlappingManualAppointments.value.length) {
    warnings.push(
      props.form.primary_provider_staff_id
        ? "Selected manual time overlaps with another appointment for the selected PT."
        : "Selected manual time overlaps with another appointment in this branch."
    )
  }

  return warnings
})

const availabilitySlots = computed<TimeSlot[]>(() => {
  if (!isSelectedSessionOnClinicDay.value) return []

  const base = new Date(selectedSessionDate.value)
  base.setHours(0, 0, 0, 0)

  const closingTime = new Date(base)
  closingTime.setHours(Math.floor(clinicEndMinute.value / 60), clinicEndMinute.value % 60, 0, 0)

  const slots: TimeSlot[] = []

  for (let minutes = clinicStartMinute.value; minutes < clinicEndMinute.value; minutes += SLOT_STEP_MINUTES) {
    const start = new Date(base)
    start.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)

    const end = new Date(start.getTime() + slotDurationMs.value)
    if (end.getTime() > closingTime.getTime()) continue

    const takenBy = appointmentsForSelectedSession.value.filter(appointment => {
      const appointmentStart = asDate(appointment.starts_at)
      const appointmentEnd = asDate(appointment.ends_at)
      return appointmentStart && appointmentEnd && overlaps(start, end, appointmentStart, appointmentEnd)
    })

    slots.push({
      key: `${dateKey(start)}-${String(start.getHours()).padStart(2, "0")}-${String(start.getMinutes()).padStart(2, "0")}`,
      start,
      end,
      taken: takenBy.length > 0,
      takenBy
    })
  }

  return slots
})

const availableSlotCount = computed(() => availabilitySlots.value.filter(slot => !slot.taken).length)
const takenSlotCount = computed(() => availabilitySlots.value.filter(slot => slot.taken).length)

const ensureSessionDatesArray = (): void => {
  if (!Array.isArray(props.form.session_dates)) props.form.session_dates = []
}

const selectSession = (index: number): void => {
  activeSessionIndex.value = index
}

const getSessionEnd = (value: unknown): Date | null => {
  const start = asDate(value)
  if (!start) return null
  return new Date(start.getTime() + slotDurationMs.value)
}

const setManualSessionDate = (index: number, value: unknown): void => {
  const date = asDate(value)
  if (!date) return

  ensureSessionDatesArray()
  props.form.session_dates[index] = date
  activeSessionIndex.value = index

  if (index === 0) {
    props.form.starts_at = new Date(date)
    props.form.ends_at = new Date(date.getTime() + slotDurationMs.value)
  }
}

const setSlotForActiveSession = (slot: TimeSlot): void => {
  ensureSessionDatesArray()

  props.form.session_dates[activeSessionIndex.value] = new Date(slot.start)

  if (activeSessionIndex.value === 0) {
    props.form.starts_at = new Date(slot.start)
    props.form.ends_at = new Date(slot.end)
  }
}

const submitSave = (): void => {
  if (blockingScheduleMessage.value) {
    const conflict = samePtTimeConflicts.value[0]

    if (conflict) {
      activeSessionIndex.value = conflict.sessionIndex
    }

    return
  }

  emit("save")
}

const handleServiceTypeChange = (): void => {
  props.servicePicker.id = null
  if (props.servicePicker.type === "PACKAGE") props.servicePicker.quantity = 1
}

const setServiceType = (type: string): void => {
  props.servicePicker.type = type
  handleServiceTypeChange()
}

const serviceTypeIcon = (type: string): string => {
  if (type === "PACKAGE") return "pi pi-box"
  if (type === "BUNDLE") return "pi pi-th-large"
  if (type === "ADD_ON_MACHINE" || type === "ADD_ON_TECHNIQUE") return "pi pi-plus"
  if (type.includes("MACHINE")) return "pi pi-cog"
  if (type.includes("TECHNIQUE")) return "pi pi-heart"
  if (type.includes("EVALUATION")) return "pi pi-clipboard"
  if (type.includes("HOME")) return "pi pi-home"
  return "pi pi-plus"
}


watch(
  () => props.serviceTypeOptions.map(option => String(option.value)).join("|"),
  () => {
    const allowed = props.serviceTypeOptions.some(option => String(option.value) === String(props.servicePicker.type))
    if (!allowed && props.serviceTypeOptions[0]) {
      props.servicePicker.type = props.serviceTypeOptions[0].value
      props.servicePicker.id = null
    }
  }
)

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) activeSessionIndex.value = 0
  }
)

watch(
  () => props.form.session_dates?.length ?? 0,
  (length) => {
    if (!length) {
      activeSessionIndex.value = 0
      return
    }

    if (activeSessionIndex.value > length - 1) {
      activeSessionIndex.value = length - 1
    }
  }
)

const toTitleCase = (text: string): string =>
  text
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase())

// Parent AppointmentsModule owns starts_at / ends_at synchronization.
// Do not watch props.form.starts_at here and mutate props.form.session_dates,
// because that can fight the parent watcher and cause Maximum recursive updates.
</script>
