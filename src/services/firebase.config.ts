/**
 * firebase.config.ts — Adaptador para o korvyan-workers
 * 
 * O painel Master korvyan-adminpage NÃO utiliza mais o SDK cliente do Firebase no browser.
 * Todas as chamadas de banco e storage são redirecionadas para o backend korvyan-workers.
 */
import { workersApi } from './workers.service'

export const firebaseApp = {
  name: '[DEFAULT]',
  options: {},
}

export const auth = {
  currentUser: null,
  signOut: async () => Promise.resolve(),
}

export const db = {}
export const storage = {}
export const analytics = null

export { workersApi }
