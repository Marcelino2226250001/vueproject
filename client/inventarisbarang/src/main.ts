import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import axios from 'axios';



import vuetify from './plugins/vuetify'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const app = createApp(App)

//axios.defaults.baseURL = 'https://vueproject-production.up.railway.app';
axios.defaults.baseURL = '/api';
console.log('✅ BASE URL:', import.meta.env.VITE_API_URL);
axios.defaults.withCredentials = true;
app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
