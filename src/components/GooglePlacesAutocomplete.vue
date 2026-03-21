<template>
  <div class="space-y-2">
    <input
      ref="inputRef"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
      @input="onInput"
    />
    <Message v-if="errorMessage" severity="warn" size="small" variant="simple">
      {{ errorMessage }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import Message from "primevue/message";
import { onMounted, ref } from "vue";

export interface GooglePlaceAddress {
  formattedAddress?: string;
  region?: string;
  province?: string;
  city?: string;
  baranggay?: string;
  postalCode?: string;
}

interface Props {
  modelValue?: string;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  placeholder: "Search address via Google Places",
  disabled: false
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  placechanged: [value: GooglePlaceAddress];
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const errorMessage = ref<string>("");

const onInput = (event: Event): void => {
  const input = event.target as HTMLInputElement | null;
  emit("update:modelValue", input?.value ?? "");
};

const getComponent = (components: Array<any>, type: string): string | undefined => {
  const component = components.find((item) => item.types?.includes(type));
  return component?.long_name;
};

onMounted(async () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    errorMessage.value = "Google Places is disabled. Set VITE_GOOGLE_MAPS_API_KEY to enable it.";
    return;
  }

  try {
    setOptions({
      key: apiKey,
      v: "weekly"
    });
    await importLibrary("places");

    const rawInput = inputRef.value;
    const maps = (window as any).google?.maps;
    if (!rawInput || !maps?.places?.Autocomplete) {
      errorMessage.value = "Failed to initialize Google Places autocomplete.";
      return;
    }

    const autocomplete = new maps.places.Autocomplete(rawInput, {
      fields: ["formatted_address", "address_components"],
      componentRestrictions: { country: "ph" },
      types: ["address"]
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const components = place?.address_components ?? [];

      const parsed: GooglePlaceAddress = {
        formattedAddress: place?.formatted_address,
        region: getComponent(components, "administrative_area_level_1"),
        province: getComponent(components, "administrative_area_level_2"),
        city: getComponent(components, "locality") ?? getComponent(components, "administrative_area_level_3"),
        baranggay: getComponent(components, "sublocality_level_1") ?? getComponent(components, "sublocality"),
        postalCode: getComponent(components, "postal_code")
      };

      emit("update:modelValue", parsed.formattedAddress ?? "");
      emit("placechanged", parsed);
    });
  } catch {
    errorMessage.value = "Unable to load Google Places API. Verify your key and restrictions.";
  }
});
</script>
