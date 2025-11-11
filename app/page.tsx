'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const QuotationGenerator = dynamic(() => import('@/components/QuotationGenerator'), {
  ssr: false,
})

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📋 Invoice Generator</h1>
              <p className="text-sm text-gray-600">Create, save, and manage professional invoices and quotations</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/bills"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg"
              >
                📄 View Saved Bills
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <QuotationGenerator mode="create" />
      </div>
    </main>
  )
}
