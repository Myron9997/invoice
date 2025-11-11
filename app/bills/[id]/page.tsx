'use client'

import React, { useState, useEffect } from 'react'
import { BillService } from '../../../lib/billService'
import { Bill } from '../../../lib/supabase'
import { ExcelExportService } from '../../../lib/excelExportService'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function BillDetail() {
  const params = useParams()
  const billId = params.id as string
  
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  useEffect(() => {
    if (billId) {
      loadBill()
    }
  }, [billId])

  const loadBill = async () => {
    try {
      setLoading(true)
      const data = await BillService.getBillById(billId)
      setBill(data)
    } catch (err) {
      setError('Failed to load bill. Please check your Supabase configuration.')
      console.error('Error loading bill:', err)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    const element = document.getElementById('bill-preview')
    if (!element) {
      alert("Bill element is not rendered yet. Please try again.")
      return
    }

    setIsExporting(true)

    try {
      const lib = await import("html2pdf.js")
      const html2pdfFn = lib && (lib.default || lib.html2pdf || lib)

      if (typeof html2pdfFn !== "function") {
        throw new Error("html2pdf.js module did not expose the expected function.")
      }

      // Store original styles
      const originalStyles = {
        width: element.style.width,
        maxWidth: element.style.maxWidth,
        padding: element.style.padding,
        margin: element.style.margin,
        overflow: element.style.overflow,
        height: element.style.height,
        maxHeight: element.style.maxHeight,
      }
      
      let parent: HTMLElement | null = null
      let originalParentStyles: { height: string; maxHeight: string; overflow: string } | null = null

      // Remove any height restrictions from parent containers
      parent = element.parentElement
      if (parent) {
        originalParentStyles = {
          height: parent.style.height,
          maxHeight: parent.style.maxHeight,
          overflow: parent.style.overflow
        }
        parent.style.height = 'auto'
        parent.style.maxHeight = 'none'
        parent.style.overflow = 'visible'
      }

      // Apply A4-optimized styles
      element.style.width = "200mm" // A4 width (210mm) - margins (5mm each side)
      element.style.maxWidth = "200mm"
      element.style.padding = "2mm" // Minimal padding for better fit
      element.style.margin = "0"
      element.style.overflow = "visible" // Ensure all content is visible
      element.style.height = "auto" // Ensure height is auto
      element.style.maxHeight = "none" // Remove max-height restrictions

      // Hide all buttons during PDF export
      const buttons = element.querySelectorAll('button')
      buttons.forEach(button => {
        button.style.display = 'none'
      })

      // Add CSS to prevent table row breaks and remove gaps
      const style = document.createElement('style')
      style.id = 'pdf-export-styles'
      style.textContent = `
        @media print {
          @page {
            size: A4;
            margin: 5mm;
          }
          table { page-break-inside: auto !important; }
          tr { page-break-inside: avoid !important; page-break-after: auto !important; }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
          tbody tr { page-break-inside: avoid !important; }
        }
        .quotation-table tr { page-break-inside: avoid !important; }
        .quotation-table thead { display: table-header-group !important; }
        .quotation-table tbody tr { page-break-inside: avoid !important; }
        #bill-preview, [id*="bill-preview"] { 
          overflow: visible !important; 
          height: auto !important; 
          max-height: none !important; 
          page-break-inside: avoid !important;
        }
        .no-page-break {
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        .quotation-box {
          page-break-before: avoid !important;
        }
        body, html { overflow: visible !important; height: auto !important; }
      `
      document.head.appendChild(style)

      // Force a reflow to ensure all content is measured
      void element.offsetHeight
      
      // Calculate content width (don't constrain height - let html2pdf handle page breaks)
      const contentWidth = 200 * 3.7795275591 // Convert mm to pixels (200mm = usable width)
      
      // Small pause to ensure styles/layout settle
      await new Promise((res) => setTimeout(res, 500))

      // A4 dimensions: 210mm x 297mm
      // With 5mm margins on all sides: 200mm x 287mm usable area
      const marginTop = 5
      const marginBottom = 5
      const marginLeft = 5
      const marginRight = 5

      const opt = {
        margin: [marginTop, marginRight, marginBottom, marginLeft], // Top, Right, Bottom, Left margins in mm
        filename: `${bill?.document_title}-${bill?.document_number}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { 
          scale: 0.98, // Slightly reduce scale to ensure content fits
          useCORS: true,
          letterRendering: true,
          width: contentWidth,
          // Don't specify height - let html2canvas capture full content naturally
          windowWidth: contentWidth,
          logging: false,
          allowTaint: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          onclone: (clonedDoc: Document) => {
            // Ensure cloned document has proper styles
            const clonedElement = clonedDoc.getElementById('bill-preview')
            if (clonedElement) {
              const htmlEl = clonedElement as HTMLElement
              htmlEl.style.width = "200mm"
              htmlEl.style.maxWidth = "200mm"
              htmlEl.style.height = "auto"
              htmlEl.style.maxHeight = "none"
              htmlEl.style.overflow = "visible"
              htmlEl.style.padding = "2mm"
              htmlEl.style.margin = "0"
              htmlEl.style.pageBreakInside = "avoid"
            }
            // Keep letter head and main box together
            const letterHead = clonedDoc.querySelector('.no-page-break')
            if (letterHead) {
              const letterEl = letterHead as HTMLElement
              letterEl.style.pageBreakAfter = "avoid"
              letterEl.style.pageBreakInside = "avoid"
            }
            const quotationBox = clonedDoc.querySelector('.quotation-box')
            if (quotationBox) {
              const boxEl = quotationBox as HTMLElement
              boxEl.style.pageBreakBefore = "avoid"
            }
            // Ensure all tables in cloned doc have proper styles
            const tables = clonedDoc.querySelectorAll('.quotation-table')
            tables.forEach(table => {
              const tableEl = table as HTMLElement
              tableEl.style.pageBreakInside = "auto"
            })
            const rows = clonedDoc.querySelectorAll('.quotation-table tr')
            rows.forEach(row => {
              const rowEl = row as HTMLElement
              rowEl.style.pageBreakInside = "avoid"
            })
          }
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait",
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          avoid: ['.quotation-table tr'],
          before: '.page-break-before',
          after: '.page-break-after'
        },
        enableLinks: false
      }

      const worker = html2pdfFn().set(opt).from(element)
      const res = worker.save()
      if (res && typeof res.then === "function") {
        await res
      }

      // Restore original styles
      element.style.width = originalStyles.width || ""
      element.style.maxWidth = originalStyles.maxWidth || ""
      element.style.padding = originalStyles.padding || ""
      element.style.margin = originalStyles.margin || ""
      element.style.overflow = ""
      element.style.height = ""
      element.style.maxHeight = ""

      // Restore parent styles if modified
      if (parent && originalParentStyles) {
        parent.style.height = originalParentStyles.height || ""
        parent.style.maxHeight = originalParentStyles.maxHeight || ""
        parent.style.overflow = originalParentStyles.overflow || ""
      }

      // Restore button visibility
      buttons.forEach(button => {
        button.style.display = ''
      })

    } catch (err) {
      console.error("PDF export error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      alert("Failed to generate PDF. See console for details. " + errorMessage)
    } finally {
      // Remove the style we added
      const addedStyle = document.getElementById('pdf-export-styles')
      if (addedStyle) {
        document.head.removeChild(addedStyle)
      }
      
      setIsExporting(false)
    }
  }

  const downloadExcel = async () => {
    if (!bill) return

    setIsExportingExcel(true)

    try {
      const filename = `${bill.document_title}-${bill.document_number}-${new Date().toISOString().split('T')[0]}.xlsx`
      
      // Export as itemized (one row per item) for individual bills
      ExcelExportService.exportItemizedBills([bill], filename)
      
    } catch (err) {
      console.error("Excel export error:", err)
      alert("Failed to export Excel. Please try again.")
    } finally {
      setIsExportingExcel(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const numberToWords = (num: number): string => {
    if (!num) return "Zero"
    const units = [
      "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
      "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", 
      "Seventeen", "Eighteen", "Nineteen"
    ]
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    const inWords = (n: number): string => {
      if (n < 20) return units[n]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "")
      if (n < 1000) return units[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "")
      if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "")
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "")
      return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "")
    }
    return inWords(num) + " only"
  }

  // Get all unique custom field names across all items
  const getAllCustomFieldNames = () => {
    if (!bill) return []
    const fieldNames = new Set<string>()
    bill.items.forEach(item => {
      if (item.custom_fields) {
        Object.keys(item.custom_fields).forEach(key => {
          if (item.custom_fields?.[key] && item.custom_fields[key].trim() !== '') {
            fieldNames.add(key)
          }
        })
      }
    })
    return Array.from(fieldNames)
  }

  // Calculate total columns for colspan
  const getTotalColumns = () => {
    if (!bill) return 0
    const baseColumns = bill.invoice_type === 'tax-invoice' ? 7 : 5
    const roomTypeColumn = bill.items.some(item => item.room_type && item.room_type.trim() !== '') ? 1 : 0
    const customFieldColumns = getAllCustomFieldNames().length
    return baseColumns + roomTypeColumn + customFieldColumns
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bill...</p>
        </div>
      </div>
    )
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested bill could not be found.'}</p>
          <Link
            href="/bills"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
          >
            Back to Bills List
          </Link>
        </div>
      </div>
    )
  }

  // Apply discount before GST (discount is a percentage)
  const discountPercentage = Number(bill.discount || 0)
  const discountAmount = (bill.total_amount * discountPercentage) / 100
  const subtotalAfterDiscount = bill.total_amount - discountAmount

  // Compute per-item GST breakdown for tax invoices (with discount applied proportionally)
  const itemsWithGst = bill.items.map(item => {
    const itemTotal = Number(item.rooms || 0) * Number(item.rate || 0) * Number(item.nights || 0)
    const itemGstRate = Number(item.gst_rate || 0)
    const itemCgstRate = itemGstRate / 2
    const itemSgstRate = itemGstRate / 2
    
    // Apply discount proportionally to each item
    const itemDiscount = bill.total_amount > 0 ? (itemTotal / bill.total_amount) * discountAmount : 0
    const itemSubtotalAfterDiscount = itemTotal - itemDiscount
    
    const itemCgstAmount = (itemSubtotalAfterDiscount * itemCgstRate) / 100
    const itemSgstAmount = (itemSubtotalAfterDiscount * itemSgstRate) / 100
    const itemGstTotal = itemCgstAmount + itemSgstAmount
    return { ...item, itemTotal, itemDiscount, itemSubtotalAfterDiscount, itemCgstRate, itemSgstRate, itemCgstAmount, itemSgstAmount, itemGstTotal }
  })
  const totalCgstAmount = itemsWithGst.reduce((sum, it) => sum + it.itemCgstAmount, 0)
  const totalSgstAmount = itemsWithGst.reduce((sum, it) => sum + it.itemSgstAmount, 0)
  const totalGstAmount = totalCgstAmount + totalSgstAmount

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">📋 Bill Details</h1>
              <p className="text-gray-600">
                {bill.document_title} #{bill.document_number}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/bills"
                className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-200"
              >
                ← Back to List
              </Link>
              <Link
                href={`/bills/${bill.id}/edit`}
                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-200"
              >
                ✏️ Edit Bill
              </Link>
              <button
                onClick={downloadPDF}
                disabled={isExporting}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
              >
                {isExporting ? '⏳ Exporting...' : '📄 Download PDF'}
              </button>
              <button
                onClick={downloadExcel}
                disabled={isExportingExcel}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50"
              >
                {isExportingExcel ? '⏳ Exporting...' : '📊 Download Excel'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bill Preview */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl" id="bill-preview" style={{ pageBreakInside: 'avoid' }}>
          <div className="bg-white border-2 border-gray-400 text-sm print:w-[210mm] print:max-w-none quotation-box" style={{ pageBreakBefore: 'avoid', pageBreakInside: 'auto' }}>
          {bill.letter_head && (
            <div className="text-center pb-2 font-bold text-lg" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
              {bill.letter_head}
            </div>
          )}
          <div className="text-center pb-2 border-b border-gray-300 font-bold text-base" style={{ marginTop: '0', paddingTop: '0' }}>
            {bill.document_title}
          </div>

          <table className="quotation-table w-full border border-gray-300">
            <tbody>
              <tr>
                <td className="quotation-cell border-r border-gray-300 w-1/2">
                  <div className="font-bold text-sm">{bill.company_name}</div>
                  <div className="text-xs mt-1 whitespace-pre-wrap">{bill.company_address}</div>
                  <div className="text-xs mt-1">GSTIN/UIN: {bill.company_gstin}</div>
                  <div className="text-xs mt-1">E-Mail: {bill.company_email}</div>
                  <div className="text-xs mt-1">Mobile: {bill.company_mobile}</div>
                </td>
                <td className="quotation-cell w-1/2">
                  <table className="quotation-table w-full">
                    <tbody>
                      <tr>
                        <td className="quotation-cell border-r border-b border-gray-300 text-xs">
                          <div className="font-semibold">{bill.document_type}</div>
                          <div>{bill.document_number}</div>
                        </td>
                        <td className="quotation-cell border-b border-gray-300 text-xs">
                          <div className="font-semibold">Dated</div>
                          <div>{bill.dated}</div>
                        </td>
                      </tr>
                      <tr>
                        <td className="quotation-cell border-r border-b border-gray-300 text-xs">
                          <div className="font-semibold">Date of Arrival</div>
                          <div>{bill.arrival}</div>
                        </td>
                        <td className="quotation-cell border-b border-gray-300 text-xs">
                          <div className="font-semibold">Date of Departure</div>
                          <div>{bill.departure}</div>
                        </td>
                      </tr>
                      <tr>
                        <td className="quotation-cell border-r border-gray-300 text-xs">
                          <div className="font-semibold">Place of Supply</div>
                          <div>{bill.place_of_supply}</div>
                        </td>
                        <td className="quotation-cell text-xs">
                          <div className="font-semibold">Mode/Terms of Payment</div>
                          <div>{bill.terms_of_payment}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          

          <table className="quotation-table w-full border-t border-gray-300">
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '50%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="quotation-cell text-xs w-full">
                  <div><strong>Bill To:</strong> {bill.client_bill_to}</div>
                  {bill.client_company_name && <div className="mt-1"><strong>Company:</strong> {bill.client_company_name}</div>}
                  {bill.client_address && <div className="mt-1"><strong>Address:</strong> {bill.client_address}</div>}
                  {bill.client_gst_number && <div className="mt-1"><strong>GST No:</strong> {bill.client_gst_number}</div>}
                  {bill.client_phone_number && <div className="mt-1"><strong>Phone:</strong> {bill.client_phone_number}</div>}
                  {bill.client_email && <div className="mt-1"><strong>Email:</strong> {bill.client_email}</div>}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="quotation-table w-full border border-gray-300">
            <thead>
              <tr>
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '5%' }}>Sl No</th>
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-left" style={{ width: '30%' }}>Description of Goods/Services</th>
                {bill.items.some(item => item.room_type && item.room_type.trim() !== '') && (
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '8%' }}>Room Type</th>
                )}
                {(() => {
                  const customFieldNames = new Set<string>();
                  bill.items.forEach(item => {
                    if (item.custom_fields) {
                      Object.keys(item.custom_fields).forEach(key => {
                        if (item.custom_fields?.[key] && item.custom_fields[key].trim() !== '') {
                          customFieldNames.add(key);
                        }
                      });
                    }
                  });
                  return Array.from(customFieldNames).map(fieldName => (
                    <th key={fieldName} className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '8%' }}>{fieldName}</th>
                  ));
                })()}
                {bill.invoice_type === 'tax-invoice' && (
                  <>
                    <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '7%' }}>HSN/SAC</th>
                    <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '5%' }}>GST Rate</th>
                  </>
                )}
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '7%' }}>Rooms</th>
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '9%' }}>Rate</th>
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '7%' }}>Nights</th>
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '9%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => {
                const hasRoomType = bill.items.some(it => it.room_type && it.room_type.trim() !== '')
                const customFieldNames = new Set<string>();
                bill.items.forEach(it => {
                  if (it.custom_fields) {
                    Object.keys(it.custom_fields).forEach(key => {
                      if (it.custom_fields?.[key] && it.custom_fields[key].trim() !== '') {
                        customFieldNames.add(key);
                      }
                    });
                  }
                });
                return (
                  <tr key={item.id}>
                    <td className="quotation-cell text-center text-xs">{idx + 1}</td>
                    <td className="quotation-cell text-left text-xs break-words">{item.description}</td>
                    {hasRoomType && (
                      <td className="quotation-cell text-center text-xs">{item.room_type && item.room_type.trim() !== '' ? item.room_type : '-'}</td>
                    )}
                    {Array.from(customFieldNames).map(fieldName => (
                      <td key={fieldName} className="quotation-cell text-center text-xs">
                        {item.custom_fields?.[fieldName] && item.custom_fields[fieldName].trim() !== '' ? item.custom_fields[fieldName] : '-'}
                      </td>
                    ))}
                    {bill.invoice_type === 'tax-invoice' && (
                      <>
                        <td className="quotation-cell text-center text-xs">{item.hsn_sac}</td>
                        <td className="quotation-cell text-center text-xs">{item.gst_rate}%</td>
                      </>
                    )}
                    <td className="quotation-cell text-center text-xs">{item.rooms}</td>
                    <td className="quotation-cell text-right text-xs">₹{Number(item.rate).toLocaleString("en-IN")}</td>
                    <td className="quotation-cell text-center text-xs">{item.nights}</td>
                    <td className="quotation-cell text-right text-xs font-semibold">₹{(item.rooms * item.rate * item.nights).toLocaleString("en-IN")}</td>
                  </tr>
                )
              })}
              <tr className="bg-gray-50">
                <td colSpan={getTotalColumns()} className="quotation-cell text-right font-semibold text-xs">Total Amount</td>
                <td className="quotation-cell text-right font-semibold text-xs">₹{bill.total_amount.toLocaleString("en-IN")}</td>
              </tr>
              {discountPercentage > 0 && (
                <tr>
                  <td colSpan={getTotalColumns()} className="quotation-cell text-right text-xs">Discount ({discountPercentage}%)</td>
                  <td className="quotation-cell text-right text-xs">-₹{discountAmount.toLocaleString("en-IN")}</td>
                </tr>
              )}
              {discountPercentage > 0 && (
                <tr className="bg-gray-50">
                  <td colSpan={getTotalColumns()} className="quotation-cell text-right font-semibold text-xs">Subtotal After Discount</td>
                  <td className="quotation-cell text-right font-semibold text-xs">₹{subtotalAfterDiscount.toLocaleString("en-IN")}</td>
                </tr>
              )}
              {bill.invoice_type === 'tax-invoice' && bill.total_gst_amount && bill.grand_total && (
                <>
                  <tr>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-center">CGST</td>
                    {bill.items.some(item => item.room_type && item.room_type.trim() !== '') && (
                      <td className="quotation-cell text-xs text-center">-</td>
                    )}
                    {getAllCustomFieldNames().map(() => (
                      <td key={Math.random()} className="quotation-cell text-xs text-center">-</td>
                    ))}
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-center">{(((bill.total_gst_amount / (subtotalAfterDiscount || bill.total_amount)) * 100) / 2).toFixed(1)}%</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-right">₹{(bill.total_gst_amount / 2).toLocaleString("en-IN")}</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-right">₹{(subtotalAfterDiscount + bill.total_gst_amount / 2).toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-center">SGST</td>
                    {bill.items.some(item => item.room_type && item.room_type.trim() !== '') && (
                      <td className="quotation-cell text-xs text-center">-</td>
                    )}
                    {getAllCustomFieldNames().map(() => (
                      <td key={Math.random()} className="quotation-cell text-xs text-center">-</td>
                    ))}
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-center">{(((bill.total_gst_amount / (subtotalAfterDiscount || bill.total_amount)) * 100) / 2).toFixed(1)}%</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-right">₹{(bill.total_gst_amount / 2).toLocaleString("en-IN")}</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-right">₹{bill.grand_total.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan={getTotalColumns()} className="quotation-cell text-right font-semibold text-xs">G. Total</td>
                    <td className="quotation-cell text-right font-semibold text-sm">₹{bill.grand_total.toLocaleString("en-IN")}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          <table className="quotation-table w-full border-t border-gray-300">
            <tbody>
              <tr>
                <td className="quotation-cell text-xs">
                  <div className="font-semibold text-sm">Amount Chargeable (in words)</div>
                  <div className="italic">{
                    (() => {
                      const effectiveGrandTotal = bill.invoice_type === 'tax-invoice'
                        ? Math.round((bill.grand_total != null ? bill.grand_total : (bill.total_amount + (bill.total_gst_amount || 0))))
                        : bill.total_amount
                      return `Indian Rupee ${numberToWords(effectiveGrandTotal)}`
                    })()
                  }</div>
                </td>
              </tr>
            </tbody>
          </table>

          {bill.invoice_type === 'tax-invoice' && (
            <table className="quotation-table w-full border-t border-gray-300">
              <thead>
                <tr>
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '8%' }}>Sr. No.</th>
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '12%' }}>HSN/SAC</th>
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '15%' }}>Taxable Value</th>
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '10%' }}>Central Tax Rate</th>
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '12%' }}>Central Tax Amount</th>
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '10%' }}>State Tax Rate</th>
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '12%' }}>State Tax Amount</th>
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '10%' }}>Integrated Tax Rate</th>
                  <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '11%' }}>Total Tax Amount</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithGst.map((it, idx) => (
                  <tr key={it.id}>
                    <td className="quotation-cell text-center text-xs">{idx + 1}</td>
                    <td className="quotation-cell text-center text-xs">{it.hsn_sac}</td>
                    <td className="quotation-cell text-right text-xs">₹{it.itemSubtotalAfterDiscount.toLocaleString('en-IN')}</td>
                    <td className="quotation-cell text-center text-xs">{it.itemCgstRate.toFixed(1)}%</td>
                    <td className="quotation-cell text-right text-xs">₹{it.itemCgstAmount.toLocaleString('en-IN')}</td>
                    <td className="quotation-cell text-center text-xs">{it.itemSgstRate.toFixed(1)}%</td>
                    <td className="quotation-cell text-right text-xs">₹{it.itemSgstAmount.toLocaleString('en-IN')}</td>
                    <td className="quotation-cell text-center text-xs">-</td>
                    <td className="quotation-cell text-right text-xs font-semibold">₹{it.itemGstTotal.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td className="quotation-cell text-center text-xs font-bold">Total</td>
                  <td className="quotation-cell text-center text-xs font-bold">-</td>
                  <td className="quotation-cell text-right text-xs font-bold">₹{subtotalAfterDiscount.toLocaleString('en-IN')}</td>
                  <td className="quotation-cell text-center text-xs font-bold">-</td>
                  <td className="quotation-cell text-right text-xs font-bold">₹{totalCgstAmount.toLocaleString('en-IN')}</td>
                  <td className="quotation-cell text-center text-xs font-bold">-</td>
                  <td className="quotation-cell text-right text-xs font-bold">₹{totalSgstAmount.toLocaleString('en-IN')}</td>
                  <td className="quotation-cell text-center text-xs font-bold">-</td>
                  <td className="quotation-cell text-right text-xs font-bold">₹{totalGstAmount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          )}

          <table className="quotation-table w-full border-t border-gray-300" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '50%' }} />
              <col style={{ width: '50%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td className="quotation-cell text-xs" colSpan={2} style={{ padding: '4px 6px' }}>
                  <strong>NOTES</strong>
                  <div className="mt-1 whitespace-pre-wrap">{bill.notes}</div>
                </td>
              </tr>
              <tr>
                <td className="quotation-cell border-r border-gray-300 text-xs" style={{ padding: '4px 6px', verticalAlign: 'top', boxSizing: 'border-box' }}>
                  <strong>TERMS AND CONDITIONS</strong>
                  <div className="mt-1 whitespace-pre-wrap">{bill.terms}</div>
                </td>
                <td className="quotation-cell text-xs text-center font-bold" style={{ padding: '6px', minHeight: '200px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', boxSizing: 'border-box' }}>
                  Authorised Signatory
                </td>
              </tr>
            </tbody>
          </table>
 
          <div className="text-center text-xs py-1 border-t border-gray-300">This is a Computer Generated Invoice</div>
          </div>
        </div>
      </div>
    </div>
  )
}
