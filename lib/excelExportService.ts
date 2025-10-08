import * as XLSX from 'xlsx'
import { BillSummary, Bill } from './supabase'

export class ExcelExportService {
  // Export bills summary to Excel
  static exportBillsSummary(bills: BillSummary[], filename: string = 'bills_summary.xlsx') {
    const worksheetData = bills.map((bill, index) => ({
      'S.No': index + 1,
      'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
      'Document Title': bill.document_title,
      'Document Number': bill.document_number,
      'Date': bill.dated,
      'Client Name': bill.client_bill_to,
      'Total Amount': bill.total_amount,
      'Grand Total': bill.grand_total || bill.total_amount,
      'Created Date': bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : '',
      'Created Time': bill.created_at ? new Date(bill.created_at).toLocaleTimeString('en-IN') : ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    
    // Set column widths
    const columnWidths = [
      { wch: 5 },   // S.No
      { wch: 15 },  // Document Type
      { wch: 20 },  // Document Title
      { wch: 15 },  // Document Number
      { wch: 12 },  // Date
      { wch: 25 },  // Client Name
      { wch: 15 },  // Total Amount
      { wch: 15 },  // Grand Total
      { wch: 12 },  // Created Date
      { wch: 12 }   // Created Time
    ]
    worksheet['!cols'] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bills Summary')
    
    XLSX.writeFile(workbook, filename)
  }

  // Export detailed bill data to Excel with ALL fields and separate item columns
  static exportDetailedBills(bills: Bill[], filename: string = 'bills_detailed.xlsx') {
    // Create a comprehensive dataset with separate columns for each item
    const worksheetData: any[] = []
    
    bills.forEach((bill, billIndex) => {
      // If bill has no items, create one row with basic info
      if (bill.items.length === 0) {
        worksheetData.push({
          'S.No': billIndex + 1,
          'Bill ID': bill.id || '',
          
          // Document Information
          'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
          'Document Title': bill.document_title,
          'Document Number': bill.document_number,
          'Document Date': bill.dated,
          'Check-in Date': bill.arrival,
          'Check-out Date': bill.departure,
          'Place of Supply': bill.place_of_supply,
          'Payment Terms': bill.terms_of_payment,
          
          // Company Information
          'Company Name': bill.company_name,
          'Company Address': bill.company_address,
          'Company GSTIN': bill.company_gstin,
          'Company Email': bill.company_email,
          'Company Mobile': bill.company_mobile,
          
          // Client Information
          'Client Bill To': bill.client_bill_to,
          'Client Company Name': bill.client_company_name || '',
          'Client Address': bill.client_address || '',
          'Client GST Number': bill.client_gst_number || '',
          'Client Phone Number': bill.client_phone_number || '',
          'Client Email': bill.client_email || '',
          
          // Item Information (Empty)
          'Item 1 Description': '',
          'Item 1 Rooms': '',
          'Item 1 Rate per Room': '',
          'Item 1 Nights': '',
          'Item 1 HSN/SAC': '',
          'Item 1 GST Rate (%)': '',
          'Item 1 Subtotal (Excl. GST)': '',
          
          'Item 2 Description': '',
          'Item 2 Rooms': '',
          'Item 2 Rate per Room': '',
          'Item 2 Nights': '',
          'Item 2 HSN/SAC': '',
          'Item 2 GST Rate (%)': '',
          'Item 2 Subtotal (Excl. GST)': '',
          
          'Item 3 Description': '',
          'Item 3 Rooms': '',
          'Item 3 Rate per Room': '',
          'Item 3 Nights': '',
          'Item 3 HSN/SAC': '',
          'Item 3 GST Rate (%)': '',
          'Item 3 Subtotal (Excl. GST)': '',
          
          // Financial Information
          'Bill Subtotal (Excl. GST)': bill.total_amount,
          'Bill Total GST Amount': bill.invoice_type === 'tax-invoice' ? (bill.total_gst_amount || 0) : '',
          'Bill Grand Total (Incl. GST)': bill.invoice_type === 'tax-invoice' ? (bill.grand_total || (bill.total_amount + (bill.total_gst_amount || 0))) : bill.total_amount,
          
          // Additional Information
          'Notes': bill.notes,
          'Terms and Conditions': bill.terms,
          
          // Database Metadata
          'Created Date': bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : '',
          'Created Time': bill.created_at ? new Date(bill.created_at).toLocaleTimeString('en-IN') : '',
          'Updated Date': bill.updated_at ? new Date(bill.updated_at).toLocaleDateString('en-IN') : '',
          'Updated Time': bill.updated_at ? new Date(bill.updated_at).toLocaleTimeString('en-IN') : ''
        })
      } else {
        // Create one row per item, with bill info repeated
        bill.items.forEach((item, itemIndex) => {
          worksheetData.push({
            'S.No': billIndex + 1,
            'Bill ID': bill.id || '',
            
            // Document Information
            'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
            'Document Title': bill.document_title,
            'Document Number': bill.document_number,
            'Document Date': bill.dated,
            'Check-in Date': bill.arrival,
            'Check-out Date': bill.departure,
            'Place of Supply': bill.place_of_supply,
            'Payment Terms': bill.terms_of_payment,
            
            // Company Information
            'Company Name': bill.company_name,
            'Company Address': bill.company_address,
            'Company GSTIN': bill.company_gstin,
            'Company Email': bill.company_email,
            'Company Mobile': bill.company_mobile,
            
            // Client Information
            'Client Bill To': bill.client_bill_to,
            'Client Company Name': bill.client_company_name || '',
            'Client Address': bill.client_address || '',
            'Client GST Number': bill.client_gst_number || '',
            'Client Phone Number': bill.client_phone_number || '',
            'Client Email': bill.client_email || '',
            
            // Item Information (Current Item)
            'Item 1 Description': itemIndex === 0 ? item.description : '',
            'Item 1 Rooms': itemIndex === 0 ? item.rooms : '',
            'Item 1 Rate per Room': itemIndex === 0 ? item.rate : '',
            'Item 1 Nights': itemIndex === 0 ? item.nights : '',
            'Item 1 HSN/SAC': itemIndex === 0 ? (bill.invoice_type === 'tax-invoice' ? item.hsn_sac : '') : '',
            'Item 1 GST Rate (%)': itemIndex === 0 ? (bill.invoice_type === 'tax-invoice' ? item.gst_rate : '') : '',
            'Item 1 Subtotal (Excl. GST)': itemIndex === 0 ? (item.rooms * item.rate * item.nights) : '',
            
            'Item 2 Description': itemIndex === 1 ? item.description : '',
            'Item 2 Rooms': itemIndex === 1 ? item.rooms : '',
            'Item 2 Rate per Room': itemIndex === 1 ? item.rate : '',
            'Item 2 Nights': itemIndex === 1 ? item.nights : '',
            'Item 2 HSN/SAC': itemIndex === 1 ? (bill.invoice_type === 'tax-invoice' ? item.hsn_sac : '') : '',
            'Item 2 GST Rate (%)': itemIndex === 1 ? (bill.invoice_type === 'tax-invoice' ? item.gst_rate : '') : '',
            'Item 2 Subtotal (Excl. GST)': itemIndex === 1 ? (item.rooms * item.rate * item.nights) : '',
            
            'Item 3 Description': itemIndex === 2 ? item.description : '',
            'Item 3 Rooms': itemIndex === 2 ? item.rooms : '',
            'Item 3 Rate per Room': itemIndex === 2 ? item.rate : '',
            'Item 3 Nights': itemIndex === 2 ? item.nights : '',
            'Item 3 HSN/SAC': itemIndex === 2 ? (bill.invoice_type === 'tax-invoice' ? item.hsn_sac : '') : '',
            'Item 3 GST Rate (%)': itemIndex === 2 ? (bill.invoice_type === 'tax-invoice' ? item.gst_rate : '') : '',
            'Item 3 Subtotal (Excl. GST)': itemIndex === 2 ? (item.rooms * item.rate * item.nights) : '',
            
            // Financial Information (Only on first item row)
            'Bill Subtotal (Excl. GST)': itemIndex === 0 ? bill.total_amount : '',
            'Bill Total GST Amount': itemIndex === 0 ? (bill.invoice_type === 'tax-invoice' ? (bill.total_gst_amount || 0) : '') : '',
            'Bill Grand Total (Incl. GST)': itemIndex === 0 ? (bill.invoice_type === 'tax-invoice' ? (bill.grand_total || (bill.total_amount + (bill.total_gst_amount || 0))) : bill.total_amount) : '',
            
            // Additional Information (Only on first item row)
            'Notes': itemIndex === 0 ? bill.notes : '',
            'Terms and Conditions': itemIndex === 0 ? bill.terms : '',
            
            // Database Metadata (Only on first item row)
            'Created Date': itemIndex === 0 ? (bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : '') : '',
            'Created Time': itemIndex === 0 ? (bill.created_at ? new Date(bill.created_at).toLocaleTimeString('en-IN') : '') : '',
            'Updated Date': itemIndex === 0 ? (bill.updated_at ? new Date(bill.updated_at).toLocaleDateString('en-IN') : '') : '',
            'Updated Time': itemIndex === 0 ? (bill.updated_at ? new Date(bill.updated_at).toLocaleTimeString('en-IN') : '') : ''
          })
        })
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    
    // Set column widths for ALL fields including separate item columns
    const columnWidths = [
      { wch: 5 },   // S.No
      { wch: 20 },  // Bill ID
      { wch: 15 },  // Document Type
      { wch: 20 },  // Document Title
      { wch: 15 },  // Document Number
      { wch: 12 },  // Document Date
      { wch: 12 },  // Arrival Date
      { wch: 12 },  // Departure Date
      { wch: 15 },  // Place of Supply
      { wch: 15 },  // Payment Terms
      { wch: 25 },  // Company Name
      { wch: 30 },  // Company Address
      { wch: 20 },  // Company GSTIN
      { wch: 25 },  // Company Email
      { wch: 15 },  // Company Mobile
      { wch: 25 },  // Client Bill To
      { wch: 25 },  // Client Company Name
      { wch: 30 },  // Client Address
      { wch: 20 },  // Client GST Number
      { wch: 15 },  // Client Phone Number
      { wch: 25 },  // Client Email
      
      // Item 1 Columns
      { wch: 30 },  // Item 1 Description
      { wch: 10 },  // Item 1 Rooms
      { wch: 12 },  // Item 1 Rate
      { wch: 10 },  // Item 1 Nights
      { wch: 15 },  // Item 1 HSN/SAC
      { wch: 12 },  // Item 1 GST Rate
      { wch: 15 },  // Item 1 Total
      
      // Item 2 Columns
      { wch: 30 },  // Item 2 Description
      { wch: 10 },  // Item 2 Rooms
      { wch: 12 },  // Item 2 Rate
      { wch: 10 },  // Item 2 Nights
      { wch: 15 },  // Item 2 HSN/SAC
      { wch: 12 },  // Item 2 GST Rate
      { wch: 15 },  // Item 2 Total
      
      // Item 3 Columns
      { wch: 30 },  // Item 3 Description
      { wch: 10 },  // Item 3 Rooms
      { wch: 12 },  // Item 3 Rate
      { wch: 10 },  // Item 3 Nights
      { wch: 15 },  // Item 3 HSN/SAC
      { wch: 12 },  // Item 3 GST Rate
      { wch: 15 },  // Item 3 Total
      
      // Financial Information
      { wch: 15 },  // Total Amount
      { wch: 15 },  // Total GST Amount
      { wch: 15 },  // Grand Total
      
      // Additional Information
      { wch: 30 },  // Notes
      { wch: 30 },  // Terms and Conditions
      
      // Database Metadata
      { wch: 12 },  // Created Date
      { wch: 12 },  // Created Time
      { wch: 12 },  // Updated Date
      { wch: 12 }   // Updated Time
    ]
    worksheet['!cols'] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Detailed Bills')
    
    XLSX.writeFile(workbook, filename)
  }

  // Export items details to separate sheet
  static exportItemsDetails(bills: Bill[], filename: string = 'bills_items.xlsx') {
    const itemsData: any[] = []
    
    bills.forEach((bill, billIndex) => {
      bill.items.forEach((item, itemIndex) => {
        itemsData.push({
          'Bill S.No': billIndex + 1,
          'Document Number': bill.document_number,
          'Client Name': bill.client_bill_to,
          'Date': bill.dated,
          'Item S.No': itemIndex + 1,
          'Description': item.description,
          'HSN/SAC Code': item.hsn_sac,
          'GST Rate (%)': item.gst_rate,
          'No. of Rooms': item.rooms,
          'Rate per Room': item.rate,
          'No. of Nights': item.nights,
          'Item Total': item.rooms * item.rate * item.nights,
          'CGST Amount': (item.rooms * item.rate * item.nights * item.gst_rate / 100) / 2,
          'SGST Amount': (item.rooms * item.rate * item.nights * item.gst_rate / 100) / 2,
          'Total GST': item.rooms * item.rate * item.nights * item.gst_rate / 100,
          'Item Grand Total': item.rooms * item.rate * item.nights * (1 + item.gst_rate / 100)
        })
      })
    })

    const worksheet = XLSX.utils.json_to_sheet(itemsData)
    
    // Set column widths
    const columnWidths = [
      { wch: 10 },  // Bill S.No
      { wch: 15 },  // Document Number
      { wch: 25 },  // Client Name
      { wch: 12 },  // Date
      { wch: 10 },  // Item S.No
      { wch: 40 },  // Description
      { wch: 15 },  // HSN/SAC Code
      { wch: 12 },  // GST Rate
      { wch: 12 },  // No. of Rooms
      { wch: 15 },  // Rate per Room
      { wch: 12 },  // No. of Nights
      { wch: 15 },  // Item Total
      { wch: 15 },  // CGST Amount
      { wch: 15 },  // SGST Amount
      { wch: 15 },  // Total GST
      { wch: 18 }   // Item Grand Total
    ]
    worksheet['!cols'] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Items Details')
    
    XLSX.writeFile(workbook, filename)
  }

  // Export comprehensive report with multiple sheets
  static exportComprehensiveReport(bills: Bill[], filename: string = 'bills_comprehensive_report.xlsx') {
    const workbook = XLSX.utils.book_new()
    
    // Summary Sheet
    const summaryData = bills.map((bill, index) => ({
      'S.No': index + 1,
      'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
      'Document Number': bill.document_number,
      'Date': bill.dated,
      'Client Name': bill.client_bill_to,
      'Total Amount': bill.total_amount,
      'Grand Total': bill.grand_total || bill.total_amount,
      'Created Date': bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : ''
    }))
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    summarySheet['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, 
      { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }
    ]
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    
    // Detailed Sheet
    const detailedData = bills.map((bill, index) => ({
      'S.No': index + 1,
      'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
      'Document Number': bill.document_number,
      'Date': bill.dated,
      'Client Name': bill.client_bill_to,
      'Client Company': bill.client_company_name || '',
      'Client Phone': bill.client_phone_number || '',
      'Client Email': bill.client_email || '',
      'Total Amount': bill.total_amount,
      'GST Amount': bill.total_gst_amount || 0,
      'Grand Total': bill.grand_total || bill.total_amount,
      'Items Count': bill.items.length,
      'Notes': bill.notes,
      'Created Date': bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : ''
    }))
    
    const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
    detailedSheet['!cols'] = [
      { wch: 5 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, 
      { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 25 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      { wch: 30 }, { wch: 12 }
    ]
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Detailed')
    
    // Items Sheet
    const itemsData: any[] = []
    bills.forEach((bill, billIndex) => {
      bill.items.forEach((item, itemIndex) => {
        itemsData.push({
          'Bill S.No': billIndex + 1,
          'Document Number': bill.document_number,
          'Client Name': bill.client_bill_to,
          'Item S.No': itemIndex + 1,
          'Description': item.description,
          'Rooms': item.rooms,
          'Rate': item.rate,
          'Nights': item.nights,
          'Total': item.rooms * item.rate * item.nights,
          'GST Rate': item.gst_rate,
          'GST Amount': item.rooms * item.rate * item.nights * item.gst_rate / 100
        })
      })
    })
    
    const itemsSheet = XLSX.utils.json_to_sheet(itemsData)
    itemsSheet['!cols'] = [
      { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 10 },
      { wch: 40 }, { wch: 8 }, { wch: 10 }, { wch: 8 },
      { wch: 12 }, { wch: 10 }, { wch: 12 }
    ]
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Items')
    
    XLSX.writeFile(workbook, filename)
  }

  // Export COMPLETE bill data with every single field and separate item columns
  static exportCompleteBills(bills: Bill[], filename: string = 'bills_complete.xlsx') {
    // Create a comprehensive dataset with separate columns for each item
    const worksheetData: any[] = []
    
    bills.forEach((bill, billIndex) => {
      // If bill has no items, create one row with basic info
      if (bill.items.length === 0) {
        worksheetData.push({
          'S.No': billIndex + 1,
          'Bill ID': bill.id || '',
          
          // Document Information (Every Field)
          'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
          'Document Title': bill.document_title,
          'Document Type Label': bill.document_type,
          'Document Number': bill.document_number,
          'Document Date': bill.dated,
          'Check-in Date': bill.arrival,
          'Check-out Date': bill.departure,
          'Place of Supply': bill.place_of_supply,
          'Payment Terms': bill.terms_of_payment,
          
          // Company Information (Every Field)
          'Company Name': bill.company_name,
          'Company Address': bill.company_address,
          'Company GSTIN': bill.company_gstin,
          'Company Email': bill.company_email,
          'Company Mobile': bill.company_mobile,
          
          // Client Information (Every Field)
          'Client Bill To': bill.client_bill_to,
          'Client Company Name': bill.client_company_name || '',
          'Client Address': bill.client_address || '',
          'Client GST Number': bill.client_gst_number || '',
          'Client Phone Number': bill.client_phone_number || '',
          'Client Email': bill.client_email || '',
          
          // Item Information (Empty)
          'Item 1 Description': '',
          'Item 1 Rooms': '',
          'Item 1 Rate': '',
          'Item 1 Nights': '',
          'Item 1 HSN/SAC': '',
          'Item 1 GST Rate': '',
          'Item 1 Total': '',
          'Item 1 GST Amount': '',
          'Item 1 Grand Total': '',
          
          'Item 2 Description': '',
          'Item 2 Rooms': '',
          'Item 2 Rate': '',
          'Item 2 Nights': '',
          'Item 2 HSN/SAC': '',
          'Item 2 GST Rate': '',
          'Item 2 Total': '',
          'Item 2 GST Amount': '',
          'Item 2 Grand Total': '',
          
          'Item 3 Description': '',
          'Item 3 Rooms': '',
          'Item 3 Rate': '',
          'Item 3 Nights': '',
          'Item 3 HSN/SAC': '',
          'Item 3 GST Rate': '',
          'Item 3 Total': '',
          'Item 3 GST Amount': '',
          'Item 3 Grand Total': '',
          
          // Financial Information (Every Field)
          'Total Amount': bill.total_amount,
          'Total GST Amount': bill.total_gst_amount || 0,
          'Grand Total': bill.grand_total || (bill.total_amount + (bill.total_gst_amount || 0)),
          
          // Items Analysis (Every Field)
          'Items Count': bill.items.length,
          'Total Rooms': bill.items.reduce((sum, item) => sum + item.rooms, 0),
          'Total Nights': bill.items.reduce((sum, item) => sum + item.nights, 0),
          'Average Rate': bill.items.length > 0 ? bill.items.reduce((sum, item) => sum + item.rate, 0) / bill.items.length : 0,
          'Total Item Amount': bill.items.reduce((sum, item) => sum + (item.rooms * item.rate * item.nights), 0),
          'Average GST Rate': bill.items.length > 0 ? bill.items.reduce((sum, item) => sum + item.gst_rate, 0) / bill.items.length : 0,
          
          // Additional Information (Every Field)
          'Notes': bill.notes,
          'Terms and Conditions': bill.terms,
          
          // Database Metadata (Every Field)
          'Created Date': bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : '',
          'Created Time': bill.created_at ? new Date(bill.created_at).toLocaleTimeString('en-IN') : '',
          'Updated Date': bill.updated_at ? new Date(bill.updated_at).toLocaleDateString('en-IN') : '',
          'Updated Time': bill.updated_at ? new Date(bill.updated_at).toLocaleTimeString('en-IN') : '',
          
          // Additional Technical Fields
          'Invoice Type Code': bill.invoice_type,
          'Created At Timestamp': bill.created_at || '',
          'Updated At Timestamp': bill.updated_at || ''
        })
      } else {
        // Create one row per item, with bill info repeated
        bill.items.forEach((item, itemIndex) => {
          const itemTotal = item.rooms * item.rate * item.nights
          const itemGstAmount = (itemTotal * item.gst_rate) / 100
          const itemGrandTotal = itemTotal + itemGstAmount
          
          worksheetData.push({
            'S.No': billIndex + 1,
            'Bill ID': bill.id || '',
            
            // Document Information (Every Field)
            'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
            'Document Title': bill.document_title,
            'Document Type Label': bill.document_type,
            'Document Number': bill.document_number,
            'Document Date': bill.dated,
            'Check-in Date': bill.arrival,
            'Check-out Date': bill.departure,
            'Place of Supply': bill.place_of_supply,
            'Payment Terms': bill.terms_of_payment,
            
            // Company Information (Every Field)
            'Company Name': bill.company_name,
            'Company Address': bill.company_address,
            'Company GSTIN': bill.company_gstin,
            'Company Email': bill.company_email,
            'Company Mobile': bill.company_mobile,
            
            // Client Information (Every Field)
            'Client Bill To': bill.client_bill_to,
            'Client Company Name': bill.client_company_name || '',
            'Client Address': bill.client_address || '',
            'Client GST Number': bill.client_gst_number || '',
            'Client Phone Number': bill.client_phone_number || '',
            'Client Email': bill.client_email || '',
            
            // Item Information (Current Item)
            'Item 1 Description': itemIndex === 0 ? item.description : '',
            'Item 1 Rooms': itemIndex === 0 ? item.rooms : '',
            'Item 1 Rate': itemIndex === 0 ? item.rate : '',
            'Item 1 Nights': itemIndex === 0 ? item.nights : '',
            'Item 1 HSN/SAC': itemIndex === 0 ? item.hsn_sac : '',
            'Item 1 GST Rate': itemIndex === 0 ? item.gst_rate : '',
            'Item 1 Total': itemIndex === 0 ? itemTotal : '',
            'Item 1 GST Amount': itemIndex === 0 ? itemGstAmount : '',
            'Item 1 Grand Total': itemIndex === 0 ? itemGrandTotal : '',
            
            'Item 2 Description': itemIndex === 1 ? item.description : '',
            'Item 2 Rooms': itemIndex === 1 ? item.rooms : '',
            'Item 2 Rate': itemIndex === 1 ? item.rate : '',
            'Item 2 Nights': itemIndex === 1 ? item.nights : '',
            'Item 2 HSN/SAC': itemIndex === 1 ? item.hsn_sac : '',
            'Item 2 GST Rate': itemIndex === 1 ? item.gst_rate : '',
            'Item 2 Total': itemIndex === 1 ? itemTotal : '',
            'Item 2 GST Amount': itemIndex === 1 ? itemGstAmount : '',
            'Item 2 Grand Total': itemIndex === 1 ? itemGrandTotal : '',
            
            'Item 3 Description': itemIndex === 2 ? item.description : '',
            'Item 3 Rooms': itemIndex === 2 ? item.rooms : '',
            'Item 3 Rate': itemIndex === 2 ? item.rate : '',
            'Item 3 Nights': itemIndex === 2 ? item.nights : '',
            'Item 3 HSN/SAC': itemIndex === 2 ? item.hsn_sac : '',
            'Item 3 GST Rate': itemIndex === 2 ? item.gst_rate : '',
            'Item 3 Total': itemIndex === 2 ? itemTotal : '',
            'Item 3 GST Amount': itemIndex === 2 ? itemGstAmount : '',
            'Item 3 Grand Total': itemIndex === 2 ? itemGrandTotal : '',
            
            // Financial Information (Only on first item row)
            'Total Amount': itemIndex === 0 ? bill.total_amount : '',
            'Total GST Amount': itemIndex === 0 ? (bill.total_gst_amount || 0) : '',
            'Grand Total': itemIndex === 0 ? (bill.grand_total || (bill.total_amount + (bill.total_gst_amount || 0))) : '',
            
            // Items Analysis (Only on first item row)
            'Items Count': itemIndex === 0 ? bill.items.length : '',
            'Total Rooms': itemIndex === 0 ? bill.items.reduce((sum, item) => sum + item.rooms, 0) : '',
            'Total Nights': itemIndex === 0 ? bill.items.reduce((sum, item) => sum + item.nights, 0) : '',
            'Average Rate': itemIndex === 0 ? (bill.items.length > 0 ? bill.items.reduce((sum, item) => sum + item.rate, 0) / bill.items.length : 0) : '',
            'Total Item Amount': itemIndex === 0 ? bill.items.reduce((sum, item) => sum + (item.rooms * item.rate * item.nights), 0) : '',
            'Average GST Rate': itemIndex === 0 ? (bill.items.length > 0 ? bill.items.reduce((sum, item) => sum + item.gst_rate, 0) / bill.items.length : 0) : '',
            
            // Additional Information (Only on first item row)
            'Notes': itemIndex === 0 ? bill.notes : '',
            'Terms and Conditions': itemIndex === 0 ? bill.terms : '',
            
            // Database Metadata (Only on first item row)
            'Created Date': itemIndex === 0 ? (bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : '') : '',
            'Created Time': itemIndex === 0 ? (bill.created_at ? new Date(bill.created_at).toLocaleTimeString('en-IN') : '') : '',
            'Updated Date': itemIndex === 0 ? (bill.updated_at ? new Date(bill.updated_at).toLocaleDateString('en-IN') : '') : '',
            'Updated Time': itemIndex === 0 ? (bill.updated_at ? new Date(bill.updated_at).toLocaleTimeString('en-IN') : '') : '',
            
            // Additional Technical Fields (Only on first item row)
            'Invoice Type Code': itemIndex === 0 ? bill.invoice_type : '',
            'Created At Timestamp': itemIndex === 0 ? (bill.created_at || '') : '',
            'Updated At Timestamp': itemIndex === 0 ? (bill.updated_at || '') : ''
          })
        })
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    
    // Set column widths for ALL fields including separate item columns
    const columnWidths = [
      { wch: 5 },   // S.No
      { wch: 20 },  // Bill ID
      { wch: 15 },  // Document Type
      { wch: 20 },  // Document Title
      { wch: 18 },  // Document Type Label
      { wch: 15 },  // Document Number
      { wch: 12 },  // Document Date
      { wch: 12 },  // Arrival Date
      { wch: 12 },  // Departure Date
      { wch: 15 },  // Place of Supply
      { wch: 15 },  // Payment Terms
      { wch: 25 },  // Company Name
      { wch: 30 },  // Company Address
      { wch: 20 },  // Company GSTIN
      { wch: 25 },  // Company Email
      { wch: 15 },  // Company Mobile
      { wch: 25 },  // Client Bill To
      { wch: 25 },  // Client Company Name
      { wch: 30 },  // Client Address
      { wch: 20 },  // Client GST Number
      { wch: 15 },  // Client Phone Number
      { wch: 25 },  // Client Email
      
      // Item 1 Columns
      { wch: 30 },  // Item 1 Description
      { wch: 10 },  // Item 1 Rooms
      { wch: 12 },  // Item 1 Rate
      { wch: 10 },  // Item 1 Nights
      { wch: 15 },  // Item 1 HSN/SAC
      { wch: 12 },  // Item 1 GST Rate
      { wch: 15 },  // Item 1 Total
      { wch: 15 },  // Item 1 GST Amount
      { wch: 15 },  // Item 1 Grand Total
      
      // Item 2 Columns
      { wch: 30 },  // Item 2 Description
      { wch: 10 },  // Item 2 Rooms
      { wch: 12 },  // Item 2 Rate
      { wch: 10 },  // Item 2 Nights
      { wch: 15 },  // Item 2 HSN/SAC
      { wch: 12 },  // Item 2 GST Rate
      { wch: 15 },  // Item 2 Total
      { wch: 15 },  // Item 2 GST Amount
      { wch: 15 },  // Item 2 Grand Total
      
      // Item 3 Columns
      { wch: 30 },  // Item 3 Description
      { wch: 10 },  // Item 3 Rooms
      { wch: 12 },  // Item 3 Rate
      { wch: 10 },  // Item 3 Nights
      { wch: 15 },  // Item 3 HSN/SAC
      { wch: 12 },  // Item 3 GST Rate
      { wch: 15 },  // Item 3 Total
      { wch: 15 },  // Item 3 GST Amount
      { wch: 15 },  // Item 3 Grand Total
      
      // Financial Information
      { wch: 15 },  // Total Amount
      { wch: 15 },  // Total GST Amount
      { wch: 15 },  // Grand Total
      
      // Items Analysis
      { wch: 12 },  // Items Count
      { wch: 12 },  // Total Rooms
      { wch: 12 },  // Total Nights
      { wch: 15 },  // Average Rate
      { wch: 15 },  // Total Item Amount
      { wch: 15 },  // Average GST Rate
      
      // Additional Information
      { wch: 30 },  // Notes
      { wch: 30 },  // Terms and Conditions
      
      // Database Metadata
      { wch: 12 },  // Created Date
      { wch: 12 },  // Created Time
      { wch: 12 },  // Updated Date
      { wch: 12 },  // Updated Time
      
      // Additional Technical Fields
      { wch: 20 },  // Invoice Type Code
      { wch: 20 },  // Created At Timestamp
      { wch: 20 }   // Updated At Timestamp
    ]
    worksheet['!cols'] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Complete Bills Data')
    
    XLSX.writeFile(workbook, filename)
  }

  // Export with separate rows for each item (most detailed)
  static exportItemizedBills(bills: Bill[], filename: string = 'bills_itemized.xlsx') {
    const worksheetData: any[] = []
    
    bills.forEach((bill, billIndex) => {
      if (bill.items.length === 0) {
        // Bill with no items
        worksheetData.push({
          'S.No': billIndex + 1,
          'Bill ID': bill.id || '',
          'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
          'Document Title': bill.document_title,
          'Document Number': bill.document_number,
          'Document Date': bill.dated,
          'Check-in Date': bill.arrival,
          'Check-out Date': bill.departure,
          'Place of Supply': bill.place_of_supply,
          'Payment Terms': bill.terms_of_payment,
          
          // Company Information
          'Company Name': bill.company_name,
          'Company Address': bill.company_address,
          'Company GSTIN': bill.company_gstin,
          'Company Email': bill.company_email,
          'Company Mobile': bill.company_mobile,
          
          // Client Information
          'Client Bill To': bill.client_bill_to,
          'Client Company Name': bill.client_company_name || '',
          'Client Address': bill.client_address || '',
          'Client GST Number': bill.client_gst_number || '',
          'Client Phone Number': bill.client_phone_number || '',
          'Client Email': bill.client_email || '',
          
          // Item Details (Empty)
          'Item Description': '',
          'Item Rooms': '',
          'Item Rate per Room': '',
          'Item Nights': '',
          'Item HSN/SAC': '',
          'Item GST Rate (%)': '',
          'Item Subtotal (Excl. GST)': '',
          'Item GST Amount': '',
          'Item Total (Incl. GST)': '',
          
          // Bill Totals
          'Bill Subtotal (Excl. GST)': bill.total_amount,
          'Bill Total GST Amount': bill.invoice_type === 'tax-invoice' ? (bill.total_gst_amount || 0) : '',
          'Bill Grand Total (Incl. GST)': bill.invoice_type === 'tax-invoice' ? (bill.grand_total || (bill.total_amount + (bill.total_gst_amount || 0))) : bill.total_amount,
          
          // Additional Information
          'Notes': bill.notes,
          'Terms and Conditions': bill.terms,
          
          // Metadata
          'Created Date': bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : '',
          'Created Time': bill.created_at ? new Date(bill.created_at).toLocaleTimeString('en-IN') : '',
          'Updated Date': bill.updated_at ? new Date(bill.updated_at).toLocaleDateString('en-IN') : '',
          'Updated Time': bill.updated_at ? new Date(bill.updated_at).toLocaleTimeString('en-IN') : ''
        })
      } else {
        // Create one row per item
        bill.items.forEach((item, itemIndex) => {
          const itemTotal = item.rooms * item.rate * item.nights
          const itemGstAmount = (itemTotal * item.gst_rate) / 100
          const itemGrandTotal = itemTotal + itemGstAmount
          
          worksheetData.push({
            'S.No': billIndex + 1,
            'Bill ID': bill.id || '',
            'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
            'Document Title': bill.document_title,
            'Document Number': bill.document_number,
            'Document Date': bill.dated,
            'Check-in Date': bill.arrival,
            'Check-out Date': bill.departure,
            'Place of Supply': bill.place_of_supply,
            'Payment Terms': bill.terms_of_payment,
            
            // Company Information
            'Company Name': bill.company_name,
            'Company Address': bill.company_address,
            'Company GSTIN': bill.company_gstin,
            'Company Email': bill.company_email,
            'Company Mobile': bill.company_mobile,
            
            // Client Information
            'Client Bill To': bill.client_bill_to,
            'Client Company Name': bill.client_company_name || '',
            'Client Address': bill.client_address || '',
            'Client GST Number': bill.client_gst_number || '',
            'Client Phone Number': bill.client_phone_number || '',
            'Client Email': bill.client_email || '',
            
            // Item Details (Current Item)
            'Item Description': item.description,
            'Item Rooms': item.rooms,
            'Item Rate per Room': item.rate,
            'Item Nights': item.nights,
            'Item HSN/SAC': bill.invoice_type === 'tax-invoice' ? item.hsn_sac : '',
            'Item GST Rate (%)': bill.invoice_type === 'tax-invoice' ? item.gst_rate : '',
            'Item Subtotal (Excl. GST)': bill.invoice_type === 'tax-invoice' ? itemTotal : itemTotal,
            'Item GST Amount': bill.invoice_type === 'tax-invoice' ? itemGstAmount : '',
            'Item Total (Incl. GST)': bill.invoice_type === 'tax-invoice' ? itemGrandTotal : itemTotal,
            
            // Bill Totals (Only on first item row)
            'Bill Subtotal (Excl. GST)': itemIndex === 0 ? bill.total_amount : '',
            'Bill Total GST Amount': itemIndex === 0 ? (bill.invoice_type === 'tax-invoice' ? (bill.total_gst_amount || 0) : '') : '',
            'Bill Grand Total (Incl. GST)': itemIndex === 0 ? (bill.invoice_type === 'tax-invoice' ? (bill.grand_total || (bill.total_amount + (bill.total_gst_amount || 0))) : bill.total_amount) : '',
            
            // Additional Information (Only on first item row)
            'Notes': itemIndex === 0 ? bill.notes : '',
            'Terms and Conditions': itemIndex === 0 ? bill.terms : '',
            
            // Metadata (Only on first item row)
            'Created Date': itemIndex === 0 ? (bill.created_at ? new Date(bill.created_at).toLocaleDateString('en-IN') : '') : '',
            'Created Time': itemIndex === 0 ? (bill.created_at ? new Date(bill.created_at).toLocaleTimeString('en-IN') : '') : '',
            'Updated Date': itemIndex === 0 ? (bill.updated_at ? new Date(bill.updated_at).toLocaleDateString('en-IN') : '') : '',
            'Updated Time': itemIndex === 0 ? (bill.updated_at ? new Date(bill.updated_at).toLocaleTimeString('en-IN') : '') : ''
          })
        })
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    
    // Set column widths
    const columnWidths = [
      { wch: 5 },   // S.No
      { wch: 20 },  // Bill ID
      { wch: 15 },  // Document Type
      { wch: 20 },  // Document Title
      { wch: 15 },  // Document Number
      { wch: 12 },  // Document Date
      { wch: 12 },  // Check-in Date
      { wch: 12 },  // Check-out Date
      { wch: 15 },  // Place of Supply
      { wch: 15 },  // Payment Terms
      { wch: 25 },  // Company Name
      { wch: 30 },  // Company Address
      { wch: 20 },  // Company GSTIN
      { wch: 25 },  // Company Email
      { wch: 15 },  // Company Mobile
      { wch: 25 },  // Client Bill To
      { wch: 25 },  // Client Company Name
      { wch: 30 },  // Client Address
      { wch: 20 },  // Client GST Number
      { wch: 15 },  // Client Phone Number
      { wch: 25 },  // Client Email
      { wch: 30 },  // Item Description
      { wch: 10 },  // Item Rooms
      { wch: 15 },  // Item Rate per Room
      { wch: 10 },  // Item Nights
      { wch: 15 },  // Item HSN/SAC
      { wch: 15 },  // Item GST Rate (%)
      { wch: 20 },  // Item Subtotal (Excl. GST)
      { wch: 15 },  // Item GST Amount
      { wch: 20 },  // Item Total (Incl. GST)
      { wch: 20 },  // Bill Subtotal (Excl. GST)
      { wch: 18 },  // Bill Total GST Amount
      { wch: 20 },  // Bill Grand Total (Incl. GST)
      { wch: 30 },  // Notes
      { wch: 30 },  // Terms and Conditions
      { wch: 12 },  // Created Date
      { wch: 12 },  // Created Time
      { wch: 12 },  // Updated Date
      { wch: 12 }   // Updated Time
    ]
    worksheet['!cols'] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Itemized Bills')
    
    XLSX.writeFile(workbook, filename)
  }
}
