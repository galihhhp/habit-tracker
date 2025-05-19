import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { db } from './services/db'
import router from './router'
import '@/assets/main.css'

db.open().catch(err => {
  console.error('Failed to open database:', err)
})

const app = createApp(App)
app.use(router)
app.mount('#app')
