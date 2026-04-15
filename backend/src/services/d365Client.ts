import { ClientSecretCredential } from '@azure/identity'
import axios, { type AxiosInstance } from 'axios'
import { env } from '../config/env.js'
import type { D365Account, D365Opportunity, D365PhoneCall, D365Annotation, D365Task } from '../types/d365.js'

class D365Client {
  private readonly credential: ClientSecretCredential
  private readonly http: AxiosInstance
  private cachedToken = ''
  private tokenExpiry = 0

  constructor() {
    this.credential = new ClientSecretCredential(
      env.AZURE_TENANT_ID,
      env.AZURE_CLIENT_ID,
      env.AZURE_CLIENT_SECRET
    )

    this.http = axios.create({
      baseURL: `${env.D365_RESOURCE}/api/data/v${env.D365_API_VERSION}/`,
      headers: {
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    this.http.interceptors.request.use(async (config) => {
      config.headers['Authorization'] = `Bearer ${await this.getToken()}`
      return config
    })
  }

  private async getToken(): Promise<string> {
    // Cache with a 60s safety margin before expiry
    if (Date.now() < this.tokenExpiry - 60_000) return this.cachedToken
    const token = await this.credential.getToken(`${env.D365_RESOURCE}/.default`)
    this.cachedToken = token.token
    this.tokenExpiry = token.expiresOnTimestamp
    return this.cachedToken
  }

  async searchAccounts(query: string): Promise<D365Account[]> {
    const sanitized = query.replace(/'/g, "''") // prevent OData injection
    const select = '$select=accountid,name,primarycontactid,telephone1,emailaddress1'
    const top = '$top=10'
    try {
      // Try contains() first (requires full-text search enabled)
      const filter = encodeURIComponent(`contains(name,'${sanitized}')`)
      const res = await this.http.get<{ value: D365Account[] }>(
        `accounts?$filter=${filter}&${select}&${top}`
      )
      return res.data.value
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        // Fallback to startswith() if full-text not available
        const filter = encodeURIComponent(`startswith(name,'${sanitized}')`)
        const res = await this.http.get<{ value: D365Account[] }>(
          `accounts?$filter=${filter}&${select}&${top}`
        )
        return res.data.value
      }
      throw err
    }
  }

  async getOpportunitiesByAccount(accountId: string): Promise<D365Opportunity[]> {
    const filter = encodeURIComponent(
      `_customerid_value eq ${accountId} and statecode eq 0`
    )
    const select = '$select=opportunityid,name,estimatedvalue,estimatedclosedate,stagecode'
    const res = await this.http.get<{ value: D365Opportunity[] }>(
      `opportunities?$filter=${filter}&${select}&$top=20`
    )
    return res.data.value
  }

  async createOpportunity(data: Record<string, unknown>): Promise<{ opportunityid: string }> {
    const res = await this.http.post<{ opportunityid: string }>('opportunities', data, {
      headers: { Prefer: 'return=representation', '$select': 'opportunityid' },
    })
    return res.data
  }

  async updateOpportunity(id: string, data: Record<string, unknown>): Promise<void> {
    await this.http.patch(`opportunities(${id})`, data)
  }

  async createPhoneCallActivity(data: Record<string, unknown>): Promise<D365PhoneCall> {
    const res = await this.http.post<D365PhoneCall>('phonecalls', data, {
      headers: { Prefer: 'return=representation', '$select': 'activityid,subject' },
    })
    return res.data
  }

  async createNote(data: Record<string, unknown>): Promise<D365Annotation> {
    const res = await this.http.post<D365Annotation>('annotations', data, {
      headers: { Prefer: 'return=representation', '$select': 'annotationid' },
    })
    return res.data
  }

  async createTask(data: Record<string, unknown>): Promise<D365Task> {
    const res = await this.http.post<D365Task>('tasks', data, {
      headers: { Prefer: 'return=representation', '$select': 'activityid,subject' },
    })
    return res.data
  }
}

export const d365Client = new D365Client()
