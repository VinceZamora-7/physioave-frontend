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
    <div class="space-y-5">
      <section class="overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-800 p-4 text-white shadow-2xl shadow-slate-950/10 sm:p-5">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(8rem,11rem))] lg:items-center">
          <div class="min-w-0">
            <p class="text-xs font-black uppercase tracking-[0.22em] text-white/55">Appointment form</p>
            <h3 class="mt-1 text-xl font-black sm:text-2xl">
              {{ editingId ? "Update appointment" : "Create appointment" }}
            </h3>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Choose the patient, billing path, planned services, care details, and schedule. Time slots are suggestions; manual scheduling is still allowed.
            </p>
          </div>

          <div class="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
            <span class="block text-[0.65rem] font-black uppercase tracking-widest text-white/55">Branch</span>
            <strong class="mt-1 block truncate text-sm font-black text-white">{{ selectedClinic?.label || "All branches" }}</strong>
          </div>

          <div class="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
            <span class="block text-[0.65rem] font-black uppercase tracking-widest text-white/55">Services</span>
            <strong class="mt-1 block text-sm font-black text-white">{{ selectedServices.length }}</strong>
          </div>

          <div class="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15 backdrop-blur">
            <span class="block text-[0.65rem] font-black uppercase tracking-widest text-white/55">Sessions</span>
            <strong class="mt-1 block text-sm font-black text-white">{{ sessionCount }}</strong>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(18rem,0.85fr)_minmax(0,1.45fr)]">
        <section class="rounded-[1.5rem] border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5">
          <FormSectionHeader index="1" title="Patient Data" description="Select the patient, branch, and starting appointment status." />

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
            <div class="space-y-1.5 md:col-span-2 xl:col-span-1">
              <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Patient</label>
              <Select
                v-model="form.patient_id"
                :options="patientOptions"
                optionLabel="label"
                optionValue="value"
                filter
                fluid
                placeholder="Select patient"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Clinic Branch</label>
              <Select
                v-model="form.clinic_id"
                :options="clinicOptions"
                optionLabel="label"
                optionValue="value"
                fluid
                placeholder="Uses sidebar branch"
                :disabled="Boolean(activeBranchId)"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Status</label>
              <div class="flex min-h-10 items-center rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] px-3 text-sm font-bold text-[rgb(var(--app-fg))]/75">
                {{ appointmentStatusLabel }}
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-[1.5rem] border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5">
          <FormSectionHeader
            index="2"
            title="Billing Type and Planned Services"
            description="Pick the billing path first. The service picker will adjust to what that billing type allows."
          />

          <div class="space-y-5">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
              <button
                v-for="option in payerOptions"
                :key="String(option.value)"
                type="button"
                :class="[
                  'group rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg',
                  selectedBillingTypeValue === String(option.value)
                    ? 'border-violet-400 bg-violet-500/10 shadow-lg shadow-violet-500/10 ring-2 ring-violet-400/20'
                    : 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] hover:border-violet-300/70'
                ]"
                @click="selectBillingType(option.value)"
              >
                <div class="flex items-start gap-3">
                  <span
                    :class="[
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base transition',
                      selectedBillingTypeValue === String(option.value)
                        ? 'bg-violet-600 text-white'
                        : 'bg-white/70 text-violet-700 ring-1 ring-violet-100 group-hover:bg-violet-50'
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

            <div
              :class="[
                'rounded-2xl border p-4',
                hasSelectedBillingType
                  ? 'border-violet-200 bg-violet-50/70 dark:bg-violet-950/20'
                  : 'border-amber-200 bg-amber-50/80 dark:bg-amber-950/20'
              ]"
            >
              <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-xs font-black uppercase tracking-widest text-[rgb(var(--app-fg))]/45">Selected billing path</p>
                  <h5 class="mt-1 text-sm font-black text-[rgb(var(--app-fg))]">{{ selectedBillingTypeLabel }}</h5>
                  <p class="mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/65">{{ selectedBillingTypeDescription }}</p>
                </div>

                <div class="min-w-[14rem] space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Fallback Select</label>
                  <Select
                    v-model="form.payer_type"
                    :options="payerOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    fluid
                    placeholder="Select billing type"
                  />
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
              <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
                <div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p class="text-xs font-black uppercase tracking-widest text-[rgb(var(--app-fg))]/45">Service picker</p>
                    <h5 class="mt-1 text-base font-black text-[rgb(var(--app-fg))]">{{ currentCategoryLabel }}</h5>
                  </div>
                  <span class="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[rgb(var(--app-fg))]/60 ring-1 ring-[rgb(var(--app-border))]">
                    {{ currentServiceOptions.length }} option{{ currentServiceOptions.length === 1 ? "" : "s" }}
                  </span>
                </div>

                <div class="mt-4 space-y-2">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Choose category</label>
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <button
                      v-for="option in serviceTypeOptions"
                      :key="option.value"
                      type="button"
                      :class="[
                        'rounded-2xl border p-3 text-left transition hover:-translate-y-0.5',
                        servicePicker.type === option.value
                          ? 'border-cyan-400 bg-cyan-500/10 shadow-md shadow-cyan-500/10 ring-2 ring-cyan-400/20'
                          : 'border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] hover:border-cyan-300/70'
                      ]"
                      @click="setServiceType(String(option.value))"
                    >
                      <div class="flex items-start gap-2.5">
                        <span
                          :class="[
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm',
                            servicePicker.type === option.value ? 'bg-cyan-600 text-white' : 'bg-cyan-50 text-cyan-700'
                          ]"
                        >
                          <i :class="serviceTypeIcon(String(option.value))" />
                        </span>
                        <div class="min-w-0">
                          <div class="text-xs font-black text-[rgb(var(--app-fg))]">{{ option.label }}</div>
                          <div class="mt-1 inline-flex rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/50">
                            {{ serviceTypeBadge(option.value) }}
                          </div>
                          <p class="mt-1 line-clamp-2 text-[11px] leading-4 text-[rgb(var(--app-fg))]/55">
                            {{ serviceCategoryDescription(option.value) }}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>



                <div class="mt-4 rounded-2xl border border-dashed border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-3">
                  <p class="text-xs font-black uppercase tracking-widest text-[rgb(var(--app-fg))]/45">Preview</p>
                  <div class="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <strong class="text-sm text-[rgb(var(--app-fg))]">
                      {{ selectedServiceOption?.label || "No service selected" }}
                    </strong>
                    <span class="text-xs font-bold text-[rgb(var(--app-fg))]/60">{{ selectedServicePriceLabel }}</span>
                  </div>
                  <p class="mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/55">
                    Package quantity is locked to 1. Appointment sessions still follow the bundle, individual, or included service quantity.
                  </p>
                </div>
              </section>

              <section class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4">

                      <div class="my-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_8rem_auto] lg:items-end">
                  <div class="space-y-1.5">
                    <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Service</label>
                    <Select
                      v-model="servicePicker.id"
                      :options="currentServiceOptions"
                      optionLabel="label"
                      optionValue="value"
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
                    label="Add Service"
                    icon="pi pi-plus"
                    :disabled="!servicePicker.id"
                    @click="$emit('add-picked-service')"
                  />
                </div>
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xs font-black uppercase tracking-widest text-[rgb(var(--app-fg))]/45">Selected services</p>
                    <h5 class="mt-1 text-base font-black text-[rgb(var(--app-fg))]">Planned for this appointment</h5>
                  </div>
                  <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {{ selectedServices.length }} selected
                  </span>
                </div>

                <div class="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                  <div
                    v-if="!selectedServices.length"
                    class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] p-6 text-center text-sm font-semibold text-[rgb(var(--app-fg))]/55"
                  >
                    No planned services selected yet. Start by choosing a billing type and service category.
                  </div>

                  <article
                    v-for="(service, index) in selectedServices"
                    :key="`${service.type}-${service.value}-${index}`"
                    class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-3"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55 ring-1 ring-[rgb(var(--app-border))]">
                            {{ service.typeLabel }}
                          </span>
                          <span class="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-700">
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
                          Appointment sessions: {{ sessionQuantityForDisplay(service) }} from included bundle/individual services.
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

                    <div
                      v-if="includedServicesForDisplay(service).length"
                      class="mt-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3 dark:border-cyan-900/50 dark:bg-cyan-950/20"
                    >
                      <div class="text-[10px] font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">Included services</div>
                      <div class="mt-2 space-y-1.5">
                        <div
                          v-for="(included, includedIndex) in includedServicesForDisplay(service)"
                          :key="`${service.value}-${included.name}-${includedIndex}`"
                          class="flex items-center justify-between gap-3 rounded-xl bg-white/75 px-3 py-2 text-xs text-[rgb(var(--app-fg))] ring-1 ring-cyan-100 dark:bg-slate-900/40 dark:ring-cyan-900/40"
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

        <section class="rounded-[1.5rem] border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5 xl:col-span-2">
          <FormSectionHeader
            index="3"
            title="Patient Care and Evaluation Visit"
            description="Assign clinical staff, visit details, diagnosis, laterality, and appointment notes."
          />

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div class="space-y-1.5">
              <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">PT</label>
              <Select
                v-model="form.primary_provider_staff_id"
                :options="ptOptions"
                optionLabel="label"
                optionValue="value"
                showClear
                filter
                fluid
                placeholder="Select PT"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Referring Doctor</label>
              <Select
                v-model="form.referring_staff_id"
                :options="doctorOptions"
                optionLabel="label"
                optionValue="value"
                showClear
                filter
                fluid
                placeholder="Optional"
              />
            </div>

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
                placeholder="Optional"
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
                placeholder="Optional"
              />
            </div>

            <div class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4 md:col-span-2 xl:col-span-2">
              <div class="text-sm font-black text-[rgb(var(--app-fg))]">Doctor Diagnosis Details</div>
              <div class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Doctor Diagnosis</label>
                  <Select
                    v-model="form.medical_diagnose_id"
                    :options="medicalDiagnoseOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    filter
                    fluid
                    placeholder="Optional"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Doctor Laterality</label>
                  <Select
                    v-model="form.diagnosis_laterality"
                    :options="lateralityOptions"
                    optionLabel="label"
                    optionValue="value"
                    showClear
                    fluid
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4 md:col-span-2 xl:col-span-1">
              <div class="flex items-start gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-600 text-white">
                  <i class="pi pi-file-edit" />
                </span>
                <div class="min-w-0">
                  <div class="text-sm font-black text-[rgb(var(--app-fg))]">Notes</div>
                  <p class="mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/55">Optional clinical or scheduling remarks.</p>
                </div>
              </div>

              <Textarea
                v-model="form.notes"
                rows="7"
                autoResize
                fluid
                class="mt-3"
                placeholder="Optional appointment notes"
              />
            </div>
          </div>
        </section>

        <section class="rounded-[1.5rem] border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5 xl:col-span-2">
          <div class="flex flex-col gap-3 border-b border-[rgb(var(--app-border))] pb-4 lg:flex-row lg:items-start lg:justify-between">
            <FormSectionHeader
              index="4"
              title="Schedule"
              description="Generate sessions, choose available slots, or manually edit any date and time."
              compact
            />

            <div class="inline-flex w-fit rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-black text-fuchsia-700 ring-1 ring-fuchsia-200">
              {{ sessionCount }} session{{ sessionCount === 1 ? "" : "s" }}
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(20rem,0.7fr)_minmax(0,1.3fr)]">
            <div class="space-y-4">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">First Start</label>
                  <DatePicker
                    v-model="form.starts_at"
                    showTime
                    hourFormat="12"
                    showIcon
                    fluid
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">First End</label>
                  <DatePicker
                    v-model="form.ends_at"
                    showTime
                    hourFormat="12"
                    showIcon
                    fluid
                  />
                  <div class="text-xs leading-5 text-[rgb(var(--app-fg))]/50">This duration becomes the default for other sessions.</div>
                </div>
              </div>

              <div class="rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
                <div class="text-sm font-black text-[rgb(var(--app-fg))]">Session Dates</div>
                <div class="mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/60">
                  Required: {{ sessionCount }} appointment{{ sessionCount === 1 ? "" : "s" }} · Sending {{ form.session_dates?.length || 0 }} date{{ (form.session_dates?.length || 0) === 1 ? "" : "s" }}
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
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

              <div class="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4 text-sm leading-6 text-cyan-900 dark:border-cyan-900/50 dark:bg-cyan-950/20 dark:text-cyan-100">
                <strong>Two booking options:</strong> click an available slot to auto-fill the active session, or manually edit the date and time on any session card.
              </div>
            </div>

            <div class="grid max-h-[30rem] grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
              <div
                v-if="!form.session_dates?.length"
                class="rounded-2xl border border-dashed border-[rgb(var(--app-border))] p-6 text-center text-sm font-semibold text-[rgb(var(--app-fg))]/55 md:col-span-2 2xl:col-span-3"
              >
                No session dates yet. Select First Start or generate session dates.
              </div>

              <article
                v-for="(_, index) in form.session_dates"
                :key="index"
                :class="[
                  'rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md',
                  activeSessionIndex === index
                    ? 'border-fuchsia-400 bg-fuchsia-500/10 ring-2 ring-fuchsia-400/20'
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
                  <label class="block text-xs font-black uppercase tracking-wider text-[rgb(var(--app-fg))]/55">Manual Date and Time</label>
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
                  label="Check Slots"
                  icon="pi pi-search"
                  size="small"
                  severity="secondary"
                  outlined
                  class="mt-2 w-full"
                  @click="selectSession(index)"
                />
              </article>
            </div>
          </div>
        </section>

        <section class="rounded-[1.5rem] border border-[rgb(var(--app-border))] bg-[rgb(var(--app-card))] p-4 shadow-sm sm:p-5 xl:col-span-2">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <FormSectionHeader
              index="5"
              title="Time Slot Availability"
              description="Available and taken slots for the active session. Slots are suggestions only."
              compact
            />

            <div class="flex flex-wrap gap-2">
              <span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">{{ availableSlotCount }} available</span>
              <span class="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700 ring-1 ring-rose-200">{{ takenSlotCount }} taken</span>
            </div>
          </div>

          <div class="mt-4 rounded-2xl border border-[rgb(var(--app-border))] bg-[rgb(var(--app-bg-soft))] p-4">
            <div class="text-base font-black text-[rgb(var(--app-fg))]">{{ selectedAvailabilityDateLabel }}</div>
            <div class="mt-1 text-xs leading-5 text-[rgb(var(--app-fg))]/60">{{ availabilityScopeLabel }}</div>
          </div>

          <div v-if="manualScheduleWarnings.length" class="mt-4 grid gap-2">
            <div
              v-for="warning in manualScheduleWarnings"
              :key="warning"
              class="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"
            >
              <i class="pi pi-exclamation-triangle mt-0.5" />
              <span>{{ warning }}</span>
            </div>
          </div>

          <div v-if="isAvailabilityLoading" class="flex items-center gap-2 py-8 text-sm text-[rgb(var(--app-fg))]/60">
            <i class="pi pi-spin pi-spinner text-violet-500" />
            Loading available and taken time slots...
          </div>

          <div
            v-else-if="!availabilitySlots.length"
            class="py-8 text-sm font-semibold text-[rgb(var(--app-fg))]/60"
          >
            No slots are available for this branch schedule on the selected date. You can still manually set the date and time above.
          </div>

          <div v-else class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <article
              v-for="slot in availabilitySlots"
              :key="slot.key"
              :class="[
                'min-h-[7rem] rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:shadow-md',
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
                  class="rounded-xl bg-white/70 p-2 text-xs leading-5 shadow-sm ring-1 ring-black/5 dark:bg-slate-950/30"
                >
                  <div class="font-black">{{ appointment.provider_name || appointment.doctor_name || "Unassigned PT" }}</div>
                  <div class="break-words font-semibold">{{ appointment.patient_name || "Unnamed patient" }}</div>
                  <div class="opacity-75">{{ formatTimeValue(appointment.starts_at) }} - {{ formatTimeValue(appointment.ends_at) }}</div>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>
    </div>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
          :pt="ptPrimaryBtn"
          @click="$emit('save')"
        />
      </div>
    </template>
  </Dialog>
</template>


<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from "vue"
import Button from "primevue/button"
import DatePicker from "primevue/datepicker"
import Dialog from "primevue/dialog"
import InputNumber from "primevue/inputnumber"
import Select from "primevue/select"
import Textarea from "primevue/textarea"
import { ptPrimaryBtn } from "@/features/shared/table-header.styles"

type SelectOption = { label: string; value: number | string | null }
type Option<T extends string | number = string | number> = { label: string; value: T }
type SessionMode = "DAILY" | "EVERY_OTHER_DAY" | "WEEKLY"
type ScheduleAppointment = Record<string, any>
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
            class: "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-950/10"
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

defineEmits<{
  "update:visible": [value: boolean]
  "generate-session-dates": [mode: SessionMode]
  "add-picked-service": []
  "remove-selected-service": [index: number]
  save: []
}>()

const selectedBillingTypeValue = computed(() => String(props.form.payer_type ?? ""))

const selectBillingType = (value: string | number | null): void => {
  props.form.payer_type = value
  props.servicePicker.id = null
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
  if (type === "ADD_ON_MACHINE") return "Machine add-on attached to the visit or package."
  if (type === "ADD_ON_TECHNIQUE") return "Technique add-on attached to the visit or package."
  if (type === "ADD_ON_HOME_SERVICE") return "Home service add-on for non-clinic visits."
  return "Service option available for the selected billing type."
}

const serviceTypeBadge = (value: unknown): string => {
  const type = String(value ?? "")
  if (type === "PACKAGE") return "Package"
  if (type === "BUNDLE") return "Bundle"
  if (type.includes("ADD_ON")) return "Add-on"
  if (type === "EVALUATION") return "Evaluation"
  return "Individual"
}

const currentCategoryLabel = computed(() =>
  props.serviceTypeOptions.find(option => String(option.value) === String(props.servicePicker.type))?.label ?? "Select category"
)

const selectedServiceOption = computed(() =>
  props.currentServiceOptions.find(option => Number(option.value) === Number(props.servicePicker.id)) ?? null
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


const SLOT_STEP_MINUTES = 30
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
  const selectedPt = props.ptOptions.find(option => Number(option.value) === Number(props.form.primary_provider_staff_id))
  if (selectedPt?.label) return `Checking PT: ${selectedPt.label}`
  return "Checking branch schedule"
})

const matchesSelectedClinic = (appointment: ScheduleAppointment): boolean => {
  if (!props.form.clinic_id) return true
  return Number(appointment.clinic_id) === Number(props.form.clinic_id)
}

const appointmentProviderId = (appointment: ScheduleAppointment): number | null => {
  const value = appointment.primary_provider_staff_id ?? appointment.provider_staff_id ?? appointment.doctor_id
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

const matchesSelectedPt = (appointment: ScheduleAppointment): boolean => {
  if (!props.form.primary_provider_staff_id) return true
  return appointmentProviderId(appointment) === Number(props.form.primary_provider_staff_id)
}

const isCanceledAppointment = (appointment: ScheduleAppointment): boolean => {
  const status = String(appointment.appointment_status ?? appointment.attendance_status ?? "").toUpperCase()
  return status.includes("CANCEL") || status.includes("NO SHOW") || status.includes("NO_SHOW")
}

const appointmentsForSelectedSession = computed(() => {
  const selectedKey = dateKey(selectedSessionDate.value)

  return props.scheduleAppointments.filter(appointment => {
    if (Number(appointment.id) === Number(props.editingId)) return false
    if (isCanceledAppointment(appointment)) return false

    const startsAt = asDate(appointment.starts_at)
    if (!startsAt || dateKey(startsAt) !== selectedKey) return false

    return matchesSelectedClinic(appointment) && matchesSelectedPt(appointment)
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

const manualScheduleWarnings = computed(() => {
  const warnings: string[] = []

  if (!isSelectedSessionOnClinicDay.value) {
    warnings.push("Selected date is outside this clinic's regular schedule.")
  }

  if (!isSelectedManualTimeWithinClinicHours.value) {
    warnings.push("Selected time is outside clinic operating hours.")
  }

  if (overlappingManualAppointments.value.length) {
    warnings.push("Selected manual time overlaps with another appointment for this branch or PT.")
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

watch(
  () => props.form.starts_at,
  (value) => {
    const start = asDate(value)
    if (!start) return

    ensureSessionDatesArray()

    const firstSession = asDate(props.form.session_dates[0])
    if (!firstSession || firstSession.getTime() !== start.getTime()) {
      props.form.session_dates[0] = new Date(start)
    }

    const end = asDate(props.form.ends_at)
    if (!end || end.getTime() <= start.getTime()) {
      props.form.ends_at = new Date(start.getTime() + DEFAULT_DURATION_MS)
    }
  }
)
</script>
