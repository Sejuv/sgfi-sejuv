export interface SystemEntity {
  id: string
  name: string
  fullName: string
  documentNumber: string
  address: string
  phone: string
  email: string
  website?: string
  logoUrl?: string
  brasaoUrl?: string
}

export interface SystemConfig {
  headerText: string
  footerText: string
  logoUrl?: string
  brasaoUrl?: string
  entityId?: string
}
