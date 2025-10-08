import { supabase, Bill, BillSummary } from './supabase'

export class BillService {
  // Save a new bill
  static async saveBill(bill: Omit<Bill, 'id' | 'created_at' | 'updated_at'>): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .insert([bill])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save bill: ${error.message}`)
    }

    return data
  }

  // Update an existing bill
  static async updateBill(id: string, bill: Partial<Bill>): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .update({ ...bill, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update bill: ${error.message}`)
    }

    return data
  }

  // Get all bills (summary view)
  static async getAllBills(): Promise<BillSummary[]> {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        id,
        created_at,
        invoice_type,
        document_title,
        document_number,
        dated,
        client_bill_to,
        total_amount,
        grand_total
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch bills: ${error.message}`)
    }

    return data || []
  }

  // Get a specific bill by ID
  static async getBillById(id: string): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch bill: ${error.message}`)
    }

    return data
  }

  // Delete a bill
  static async deleteBill(id: string): Promise<void> {
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete bill: ${error.message}`)
    }
  }

  // Search bills by client name or document number
  static async searchBills(query: string): Promise<BillSummary[]> {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        id,
        created_at,
        invoice_type,
        document_title,
        document_number,
        dated,
        client_bill_to,
        total_amount,
        grand_total
      `)
      .or(`client_bill_to.ilike.%${query}%,document_number.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to search bills: ${error.message}`)
    }

    return data || []
  }

  // Get bills by date range
  static async getBillsByDateRange(startDate: string, endDate: string): Promise<BillSummary[]> {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        id,
        created_at,
        invoice_type,
        document_title,
        document_number,
        dated,
        client_bill_to,
        total_amount,
        grand_total
      `)
      .gte('dated', startDate)
      .lte('dated', endDate)
      .order('dated', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch bills by date range: ${error.message}`)
    }

    return data || []
  }
}
