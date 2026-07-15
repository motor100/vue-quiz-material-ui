import { createApp } from 'vue'
import App from './App.vue'

// Vuetify
import '@mdi/font/css/materialdesignicons.css' // Стили для чекбокса
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
// import './styles/settings.scss'

//import { useRules } from 'vuetify/labs/rules'
import { createRulesPlugin } from 'vuetify/labs/rules'
//import { aliases, mdi } from 'vuetify/iconsets/mdi'

// Translations provided by Vuetify
import { ru } from 'vuetify/locale'

import DateFnsAdapter from '@date-io/date-fns'
import ruRU from 'date-fns/locale/ru'


//const rules = useRules()


// Register Vuetify as plugin
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light', // 'system' | 'light' | 'dark'
  },

  locale: {
    locale: ru,
    messages: { ru },
  },

  date: {
    adapter: DateFnsAdapter,
    locale: {
      en: ruRU,
      ru: ruRU,
    },
  },
})


createApp(App).use(vuetify).use(createRulesPlugin({ /* options */ }, vuetify.locale)).mount('#app')

// createApp(App).mount('#app')
