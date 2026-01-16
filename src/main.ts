import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify } from 'quasar'

import App from './App.vue'
import router from './router'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'
// Import Quasar css
import 'quasar/src/css/index.sass'

const app = createApp(App)

// UI Framework
app.use(Quasar, {
  plugins: {
    Notify
  },
  config: {}
})

app.use(createPinia())
app.use(router)

app.mount('#app')
