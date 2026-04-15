import axios from 'axios'
import { msalInstance, loginRequest } from '../config/msalConfig'

const DEMO_MODE = !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === ''

export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30_000,
})

apiClient.interceptors.request.use(async (config) => {
  if (DEMO_MODE) return config // No auth header needed in demo mode
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length > 0) {
    try {
      const result = await msalInstance.acquireTokenSilent({
        scopes: loginRequest.scopes,
        account: accounts[0],
      })
      config.headers['Authorization'] = `Bearer ${result.accessToken}`
    } catch {
      // Silent token acquisition failed — let request proceed; backend will 401
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        await msalInstance.acquireTokenRedirect({
          scopes: loginRequest.scopes,
          account: accounts[0],
        })
      }
    }
    return Promise.reject(err)
  }
)
