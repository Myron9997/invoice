'use client'

import React, { useState, useEffect } from 'react'
import { BillService } from '../../lib/billService'
import { BillSummary, Bill } from '../../lib/supabase'
import { ExcelExportService } from '../../lib/excelExportService'
import Link from 'next/link'

export default function BillsList() {
  const [bills, setBills] = useState<BillSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredBills, setFilteredBills] = useState<BillSummary[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'summary' | 'detailed' | 'comprehensive' | 'complete' | 'itemized'>('summary')
  const [exportingPdfId, setExportingPdfId] = useState<string | null>(null)

  useEffect(() => {
    loadBills()
  }, [])

  useEffect(() => {
    let filtered = bills

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(bill =>
        bill.client_bill_to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.document_number.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply date range filter
    if (startDate && endDate) {
      filtered = filtered.filter(bill => {
        const billDate = new Date(bill.dated.split('/').reverse().join('-'))
        const start = new Date(startDate)
        const end = new Date(endDate)
        return billDate >= start && billDate <= end
      })
    }

    setFilteredBills(filtered)
  }, [searchQuery, bills, startDate, endDate])

  const loadBills = async () => {
    try {
      setLoading(true)
      const data = await BillService.getAllBills()
      setBills(data)
      setFilteredBills(data)
    } catch (err) {
      setError('Failed to load bills. Please check your Supabase configuration.')
      console.error('Error loading bills:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteBill = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return

    try {
      await BillService.deleteBill(id)
      setBills(prev => prev.filter(bill => bill.id !== id))
      setFilteredBills(prev => prev.filter(bill => bill.id !== id))
    } catch (err) {
      setError('Failed to delete bill')
      console.error('Error deleting bill:', err)
    }
  }

  // Excel export functions
  const exportToExcel = async () => {
    if (filteredBills.length === 0) {
      alert('No bills to export')
      return
    }

    setIsExporting(true)
    try {
      const filename = `bills_${startDate || 'all'}_to_${endDate || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`
      
      if (exportType === 'summary') {
        ExcelExportService.exportBillsSummary(filteredBills, filename)
      } else if (exportType === 'detailed') {
        // For detailed export, we need full bill data
        const detailedBills: Bill[] = []
        for (const bill of filteredBills) {
          const fullBill = await BillService.getBillById(bill.id)
          detailedBills.push(fullBill)
        }
        ExcelExportService.exportDetailedBills(detailedBills, filename)
      } else if (exportType === 'comprehensive') {
        // For comprehensive export, we need full bill data
        const detailedBills: Bill[] = []
        for (const bill of filteredBills) {
          const fullBill = await BillService.getBillById(bill.id)
          detailedBills.push(fullBill)
        }
        ExcelExportService.exportComprehensiveReport(detailedBills, filename)
      } else if (exportType === 'complete') {
        // For complete export, we need full bill data
        const detailedBills: Bill[] = []
        for (const bill of filteredBills) {
          const fullBill = await BillService.getBillById(bill.id)
          detailedBills.push(fullBill)
        }
        ExcelExportService.exportCompleteBills(detailedBills, filename)
      } else if (exportType === 'itemized') {
        // For itemized export, we need full bill data
        const detailedBills: Bill[] = []
        for (const bill of filteredBills) {
          const fullBill = await BillService.getBillById(bill.id)
          detailedBills.push(fullBill)
        }
        ExcelExportService.exportItemizedBills(detailedBills, filename)
      }
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export bills. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const clearDateFilter = () => {
    setStartDate('')
    setEndDate('')
  }

  const downloadBillExcel = async (billId: string) => {
    setExportingPdfId(billId)
    
    try {
      // Get the full bill data
      const bill = await BillService.getBillById(billId)
      
      // Generate filename with date
      const filename = `${bill.document_title}-${bill.document_number}-${new Date().toISOString().split('T')[0]}.xlsx`
      
      // Export as itemized (one row per item) for individual bills with all information
      ExcelExportService.exportItemizedBills([bill], filename)
      
    } catch (err) {
      console.error("Excel export error:", err)
      alert("Failed to export Excel. Please try again.")
    } finally {
      setExportingPdfId(null)
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bills...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">📋 Saved Bills</h1>
                <p className="text-blue-100">Manage and view all your saved invoices and quotations</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Link
                  href="/"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 shadow-lg"
                >
                  ➕ Create New Bill
                </Link>
              </div>
            </div>
          </div>

          {/* Search, Filters and Stats */}
          <div className="p-6 border-b border-gray-200 space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by client name or document number..."
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔍</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {filteredBills.length} of {bills.length} bills
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">📅 Filter by Date:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                />
                <span className="text-gray-500 self-center">to</span>
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={clearDateFilter}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Excel Export Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">📊 Export to Excel:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as 'summary' | 'detailed' | 'comprehensive' | 'complete' | 'itemized')}
                >
                  <option value="summary">Summary Report</option>
                  <option value="detailed">Detailed Report</option>
                  <option value="comprehensive">Comprehensive Report</option>
                  <option value="complete">Complete Report (All Fields)</option>
                  <option value="itemized">Itemized Report (One Row Per Item)</option>
                </select>
                <button
                  onClick={exportToExcel}
                  disabled={isExporting || filteredBills.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      📈 Export Excel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchQuery ? 'No bills found' : 'No bills saved yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first bill to get started'
              }
            </p>
            {!searchQuery && (
              <Link
                href="/"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create Your First Bill
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBills.map((bill) => (
              <div key={bill.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Bill Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          bill.invoice_type === 'tax-invoice' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {bill.invoice_type === 'tax-invoice' ? '🧾 Tax Invoice' : '📄 Invoice'}
                        </span>
                        <span className="text-sm text-gray-500">
                          #{bill.document_number}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {bill.document_title}
                      </h3>
                      
                      <p className="text-gray-600 mb-2">
                        <strong>Client:</strong> {bill.client_bill_to}
                      </p>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span><strong>Date:</strong> {formatDate(bill.dated)}</span>
                        <span><strong>Created:</strong> {formatDate(bill.created_at)}</span>
                      </div>
                    </div>

                    {/* Amount and Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-end gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatAmount(bill.grand_total || bill.total_amount)}
                        </div>
                        {bill.grand_total && bill.grand_total !== bill.total_amount && (
                          <div className="text-sm text-gray-500">
                            Base: {formatAmount(bill.total_amount)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Link
                          href={`/bills/${bill.id}`}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 text-sm"
                        >
                          👁️ View
                        </Link>
                        <Link
                          href={`/bills/${bill.id}/edit`}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 text-sm"
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => downloadBillExcel(bill.id)}
                          disabled={exportingPdfId === bill.id}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all duration-200 text-sm disabled:opacity-50"
                        >
                          {exportingPdfId === bill.id ? '⏳ Exporting...' : '📊 Excel'}
                        </button>
                        <button
                          onClick={() => deleteBill(bill.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 text-sm"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
