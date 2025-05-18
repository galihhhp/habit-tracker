import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { db } from './services/db'

db.open().catch(err => {
  console.error('Failed to open database:', err)
})

createApp(App).mount('#app')
