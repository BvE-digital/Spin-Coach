import { apiClient } from './apiClient'
import type { D365AccountResult, D365OpportunityResult } from '../types/d365'

export const d365Service = {
  async searchAccounts(query: string): Promise<D365AccountResult[]> {
    if (query.trim().length < 2) return []
    const res = await apiClient.get<{ value: D365AccountResult[] }>('/d365/accounts', {
      params: { q: query },
    })
    return res.data.value
  },

  async getOpportunities(accountId: string): Promise<D365OpportunityResult[]> {
    const res = await apiClient.get<{ value: D365OpportunityResult[] }>('/d365/opportunities', {
      params: { accountId },
    })
    return res.data.value
  },
}
