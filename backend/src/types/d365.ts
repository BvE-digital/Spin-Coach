export interface D365Account {
  accountid: string
  name: string
  primarycontactid?: string
  telephone1?: string
  emailaddress1?: string
}

export interface D365Opportunity {
  opportunityid: string
  name: string
  description?: string
  estimatedvalue?: number
  estimatedclosedate?: string
  stagecode?: number
  'customerid_account@odata.bind'?: string
}

export interface D365PhoneCall {
  activityid: string
  subject: string
  description?: string
  actualstart?: string
  actualend?: string
}

export interface D365Annotation {
  annotationid: string
  subject?: string
  notetext?: string
}

export interface D365Task {
  activityid: string
  subject: string
  scheduledend?: string
}
