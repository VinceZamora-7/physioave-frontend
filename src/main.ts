import './assets/styles/index.css'
import 'primeicons/primeicons.css'
import "@/assets/styles/scrollbar.css"


import {createApp} from 'vue'
import {createPinia} from 'pinia'

import "./assets/styles/index.css"
import App from "./App.vue"
import router from "./app/router"

import {ConfirmationService, KeyFilter, Ripple, ToastService, Tooltip} from "primevue";
import PrimeVue from 'primevue/config'
import {definePreset} from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import {VueQueryPlugin} from "@tanstack/vue-query";


const DefaultPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        primary: {
          color: '#1A4568',
          inverseColor: '#ffffff',
          hoverColor: '#3e92cc',
          activeColor: '#0F2236',
        },
      },
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: DefaultPreset,
    options: {
      darkModeSelector: 'html.dark', // ✅ PrimeVue will follow html.dark
      cssLayer: {
        name: 'primevue',
        order: 'theme, base, primevue',
      },
    },
  },
})


app.use(ConfirmationService)
app.use(ToastService)
app.use(VueQueryPlugin)

app.directive('tooltip', Tooltip)
app.directive('ripple', Ripple)
app.directive('keyfilter', KeyFilter)

app.mount('#app')
