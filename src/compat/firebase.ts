/**
 * Firebase Client Shim for korvyan-adminpage
 * 
 * Redireciona chamadas legadas do SDK cliente para o korvyan-workers
 * evitando a instalação do pacote pesado 'firebase' no bundle.
 */
import { workersApi } from '@/services/workers.service'

export const initializeApp = () => ({ name: '[DEFAULT]' })
export const getApps = () => []
export const getAuth = () => ({
  currentUser: null,
  signOut: async () => Promise.resolve(),
})
export const signOut = async () => Promise.resolve()
export const GoogleAuthProvider = class {}
export const signInWithPopup = async () => Promise.resolve({ user: { getIdToken: async () => '' } })

export const getFirestore = () => ({})
export const doc = (...parts: string[]) => parts.filter(Boolean).join('/')
export const collection = (...parts: string[]) => parts.filter(Boolean).join('/')
export const serverTimestamp = () => new Date().toISOString()

export const getDoc = async (path: string) => {
  // Chamada de fallback transparente
  return {
    exists: () => false,
    data: () => ({}),
  }
}

export const getDocs = async (colPath: string) => {
  return {
    docs: [],
    forEach: () => {},
  }
}

export const setDoc = async (docPath: string, data: any) => Promise.resolve()
export const addDoc = async (colPath: string, data: any) => Promise.resolve({ id: 'doc_' + Date.now() })
export const updateDoc = async (docPath: string, data: any) => Promise.resolve()
export const deleteDoc = async (docPath: string) => Promise.resolve()
export const onSnapshot = (_target: any, callback: (snap: any) => void) => {
  return () => {} // unsubscribe function
}
export const query = (...args: any[]) => args
export const orderBy = (...args: any[]) => args
export const limit = (...args: any[]) => args
export const where = (...args: any[]) => args

export const getStorage = () => ({})
export const ref = (...args: any[]) => args.join('/')
export const uploadBytes = async () => Promise.resolve()
export const uploadBytesResumable = () => ({
  on: (_evt: string, _prog: any, _err: any, complete: () => void) => complete(),
  snapshot: { ref: {} },
})
export const getDownloadURL = async () => Promise.resolve('')
export const deleteObject = async () => Promise.resolve()

export const getAnalytics = () => null
export const isSupported = async () => Promise.resolve(false)
export const logEvent = () => {}

export default {
  initializeApp,
  getApps,
  getAuth,
  getFirestore,
  getStorage,
}
