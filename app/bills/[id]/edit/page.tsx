'use client'

import React, { useState, useEffect } from 'react'
import { BillService } from '../../../../lib/billService'
import { Bill } from '../../../../lib/supabase'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import QuotationGenerator from '../../../../components/QuotationGenerator'

export default function BillEdit() {
  const params = useParams()
  const billId = params.id as string
  
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bill for editing...</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">✏️ Edit Bill</h1>
              <p className="text-sm text-gray-600">
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
                href={`/bills/${bill.id}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200"
              >
                👁️ View Bill
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <QuotationGenerator 
          initialData={bill}
          mode="edit"
          billId={billId}
        />
      </div>
    </div>
  )
}
