export interface D365AccountResult {
  accountid: string
  name: string
  primarycontactid?: string
  telephone1?: string
}

export interface D365OpportunityResult {
  opportunityid: string
  name: string
  statecode: number
  estimatedvalue?: number
  estimatedclosedate?: string
}

export interface D365SyncRequest {
  session: import('./session').Session
}

export interface D365SyncResponse {
  success: boolean
  d365Ids: {
    opportunityId?: string
    phoneCallId?: string
    noteId?: string
    taskIds?: string[]
  }
  error?: string
}
