'use client'

import React, { useState, useEffect } from 'react'
import { BillService } from '../../../lib/billService'
import { Bill } from '../../../lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function BillDetail() {
  const params = useParams()
  const billId = params.id as string
  
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

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

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `${bill?.document_title}-${bill?.document_number}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          letterRendering: true,
          width: 190 * 3.7795275591,
          height: element.scrollHeight
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait",
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      }

      const worker = html2pdfFn().set(opt).from(element)
      const res = worker.save()
      if (res && typeof res.then === "function") {
        await res
      }

    } catch (err) {
      console.error("PDF export error:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      alert("Failed to generate PDF. See console for details. " + errorMessage)
    } finally {
      setIsExporting(false)
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
            <div className="flex gap-3">
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
            </div>
          </div>
        </div>
      </div>

      {/* Bill Preview */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl bg-white border-2 border-gray-400 text-sm print:w-[210mm] print:max-w-none quotation-box" id="bill-preview">
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
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '6%' }}>Sl No</th>
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-left" style={{ width: '35%' }}>Description of Goods/Services</th>
                {bill.invoice_type === 'tax-invoice' && (
                  <>
                    <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '8%' }}>HSN/SAC</th>
                    <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '6%' }}>GST Rate</th>
                  </>
                )}
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '8%' }}>Rooms</th>
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '10%' }}>Rate</th>
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '8%' }}>Nights</th>
                <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '10%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="quotation-cell text-center text-xs">{idx + 1}</td>
                  <td className="quotation-cell text-left text-xs break-words">{item.description}</td>
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
              ))}
              <tr className="bg-gray-50">
                <td colSpan={bill.invoice_type === 'tax-invoice' ? 7 : 5} className="quotation-cell text-right font-semibold text-xs">Total Amount</td>
                <td className="quotation-cell text-right font-semibold text-xs">₹{bill.total_amount.toLocaleString("en-IN")}</td>
              </tr>
              {bill.invoice_type === 'tax-invoice' && bill.total_gst_amount && bill.grand_total && (
                <>
                  <tr>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-center">CGST</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-center">6.0%</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-right">₹{(bill.total_gst_amount / 2).toLocaleString("en-IN")}</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-right">₹{(bill.total_amount + bill.total_gst_amount / 2).toLocaleString("en-IN")}</td>
                  </tr>
                  <tr>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-center">SGST</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-center">6.0%</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-right">₹{(bill.total_gst_amount / 2).toLocaleString("en-IN")}</td>
                    <td className="quotation-cell text-xs text-center">-</td>
                    <td className="quotation-cell text-xs text-right">₹{bill.grand_total.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td colSpan={7} className="quotation-cell text-right font-semibold text-xs">G. Total</td>
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
                  <div className="italic">Indian Rupee {numberToWords(bill.grand_total || bill.total_amount)}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="quotation-table w-full border-t border-gray-300">
            <tbody>
              <tr>
                <td className="quotation-cell border-r border-gray-300 text-xs w-1/2">
                  <strong>NOTES</strong>
                  <div className="mt-1 whitespace-pre-wrap">{bill.notes}</div>
                </td>
                <td className="quotation-cell text-xs w-1/2 text-right">
                  For {bill.company_name}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="quotation-table w-full border-t border-gray-300">
            <tbody>
              <tr>
                <td className="quotation-cell border-r border-gray-300 text-xs w-1/2" style={{ padding: '4px 6px' }}>
                  <strong>TERMS AND CONDITIONS</strong>
                  <div className="mt-1 whitespace-pre-wrap">{bill.terms}</div>
                </td>
                <td className="quotation-cell text-xs w-1/2 text-center font-bold" style={{ paddingTop: '100px', paddingBottom: '100px', paddingLeft: '6px', paddingRight: '6px', minHeight: '200px', height: '200px' }}>
                  <div style={{ marginTop: '10px', marginBottom: '40px' }}>
                    Authorised Signatory
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="text-center text-xs py-1 border-t border-gray-300">This is a Computer Generated Invoice</div>
        </div>
      </div>
    </div>
  )
}
