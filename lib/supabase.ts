import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Bill {
  id?: string
  created_at?: string
  updated_at?: string
  invoice_type: 'invoice' | 'tax-invoice'
  
  // Company information
  company_name: string
  company_address: string
  company_gstin: string
  company_email: string
  company_mobile: string
  
  // Document metadata
  letter_head?: string
  document_title: string
  document_type: string
  document_number: string
  dated: string
  arrival: string
  departure: string
  place_of_supply: string
  terms_of_payment: string
  
  // Client information
  client_bill_to: string
  client_company_name?: string
  client_address?: string
  client_gst_number?: string
  client_phone_number?: string
  client_email?: string
  
  // Items
  items: Array<{
    id: number
    description: string
    room_type?: string
    rooms: number
    rate: number
    nights: number
    hsn_sac: string
    gst_rate: number
    custom_fields?: Record<string, string> // Dynamic custom fields like { "FTO": "12345", "License": "ABC123" }
  }>
  
  // Additional information
  notes: string
  terms: string
  
  // Calculated totals
  total_amount: number
  discount?: number
  total_gst_amount?: number
  grand_total?: number
}

export interface BillSummary {
  id: string
  created_at: string
  invoice_type: 'invoice' | 'tax-invoice'
  document_title: string
  document_number: string
  dated: string
  client_bill_to: string
  total_amount: number
  grand_total?: number
}
