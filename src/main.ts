import './assets/styles/index.css'
import 'primeicons/primeicons.css'


import {createApp} from 'vue'
import {createPinia} from 'pinia'

import App from "./App.vue"
import router from "./app/router"

import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import KeyFilter from 'primevue/keyfilter'
import Ripple from 'primevue/ripple'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
import {VueQueryPlugin} from "@tanstack/vue-query";
import {primeVuePreset} from "@/theme/primevue-preset"

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: primeVuePreset,
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
