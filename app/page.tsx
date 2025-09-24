'use client'

import QuotationGenerator from '@/components/QuotationGenerator'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        <QuotationGenerator />
      </div>
    </main>
  )
}
