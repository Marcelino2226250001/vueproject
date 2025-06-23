import { reactive } from 'vue'

export const authState = reactive({
  user: JSON.parse(localStorage.getItem('user')) || null
})

export function setUser(user) {
  authState.user = user
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearUser() {
  authState.user = null
  localStorage.removeItem('user')
}
