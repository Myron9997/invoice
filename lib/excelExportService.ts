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
      'Created Date': new Date(bill.created_at).toLocaleDateString('en-IN'),
      'Created Time': new Date(bill.created_at).toLocaleTimeString('en-IN')
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

  // Export detailed bill data to Excel
  static exportDetailedBills(bills: Bill[], filename: string = 'bills_detailed.xlsx') {
    const worksheetData = bills.map((bill, index) => ({
      'S.No': index + 1,
      'Document Type': bill.invoice_type === 'tax-invoice' ? 'Tax Invoice' : 'Invoice',
      'Document Title': bill.document_title,
      'Document Number': bill.document_number,
      'Date': bill.dated,
      'Arrival Date': bill.arrival,
      'Departure Date': bill.departure,
      'Place of Supply': bill.place_of_supply,
      'Payment Terms': bill.terms_of_payment,
      
      // Company Information
      'Company Name': bill.company_name,
      'Company Address': bill.company_address,
      'Company GSTIN': bill.company_gstin,
      'Company Email': bill.company_email,
      'Company Mobile': bill.company_mobile,
      
      // Client Information
      'Client Name': bill.client_bill_to,
      'Client Company': bill.client_company_name || '',
      'Client Address': bill.client_address || '',
      'Client GST': bill.client_gst_number || '',
      'Client Phone': bill.client_phone_number || '',
      'Client Email': bill.client_email || '',
      
      // Financial Information
      'Total Amount': bill.total_amount,
      'GST Amount': bill.total_gst_amount || 0,
      'Grand Total': bill.grand_total || bill.total_amount,
      
      // Items Summary
      'Items Count': bill.items.length,
      'Total Rooms': bill.items.reduce((sum, item) => sum + item.rooms, 0),
      'Total Nights': bill.items.reduce((sum, item) => sum + item.nights, 0),
      
      // Additional Information
      'Notes': bill.notes,
      'Terms': bill.terms,
      
      // Metadata
      'Created Date': new Date(bill.created_at).toLocaleDateString('en-IN'),
      'Created Time': new Date(bill.created_at).toLocaleTimeString('en-IN'),
      'Updated Date': bill.updated_at ? new Date(bill.updated_at).toLocaleDateString('en-IN') : ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    
    // Set column widths
    const columnWidths = [
      { wch: 5 },   // S.No
      { wch: 15 },  // Document Type
      { wch: 20 },  // Document Title
      { wch: 15 },  // Document Number
      { wch: 12 },  // Date
      { wch: 12 },  // Arrival Date
      { wch: 12 },  // Departure Date
      { wch: 15 },  // Place of Supply
      { wch: 15 },  // Payment Terms
      { wch: 25 },  // Company Name
      { wch: 30 },  // Company Address
      { wch: 20 },  // Company GSTIN
      { wch: 25 },  // Company Email
      { wch: 15 },  // Company Mobile
      { wch: 25 },  // Client Name
      { wch: 25 },  // Client Company
      { wch: 30 },  // Client Address
      { wch: 20 },  // Client GST
      { wch: 15 },  // Client Phone
      { wch: 25 },  // Client Email
      { wch: 15 },  // Total Amount
      { wch: 15 },  // GST Amount
      { wch: 15 },  // Grand Total
      { wch: 12 },  // Items Count
      { wch: 12 },  // Total Rooms
      { wch: 12 },  // Total Nights
      { wch: 30 },  // Notes
      { wch: 30 },  // Terms
      { wch: 12 },  // Created Date
      { wch: 12 },  // Created Time
      { wch: 12 }   // Updated Date
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
      'Created Date': new Date(bill.created_at).toLocaleDateString('en-IN')
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
      'Created Date': new Date(bill.created_at).toLocaleDateString('en-IN')
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
}
