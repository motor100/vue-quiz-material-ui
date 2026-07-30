import { createApp } from 'vue'
import App from './App.vue'

// Vuetify
import '@mdi/font/css/materialdesignicons.css' // Стили для чекбоксов
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

  // Локальный шрифт для всех Vuetify компонентов
  defaults: {
    global: {
      style: [{ fontFamily: 'Inter, sans-serif' }]
    }
  }
})


createApp(App).use(vuetify).use(createRulesPlugin({ /* options */ }, vuetify.locale)).mount('#app')

// createApp(App).mount('#app')
