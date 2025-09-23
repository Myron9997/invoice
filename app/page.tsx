'use client'

import QuotationGenerator from '@/components/QuotationGenerator'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Professional Invoice Generator
        </h1>
        <QuotationGenerator />
      </div>
    </main>
  )
}
