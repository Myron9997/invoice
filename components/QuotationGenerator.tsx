import React, { useState, useRef, useEffect } from "react";
import { BillService } from "../lib/billService";
import { Bill } from "../lib/supabase";

// QuotationGenerator (fixed PDF export)
// - Uses dynamic import of html2pdf.js to avoid SSR/bundler timing issues
// - Guards against missing ref before export
// - Provides user-friendly error handling and a small export-loading state
// - Keeps the same UI/structure you had, with inputs and a generated preview

interface QuotationGeneratorProps {
  initialData?: Bill;
  mode?: 'create' | 'edit';
  billId?: string;
}

export default function QuotationGenerator({ 
  initialData, 
  mode = 'create', 
  billId 
}: QuotationGeneratorProps) {
  const [formVisible, setFormVisible] = useState(true);
  const [invoiceType, setInvoiceType] = useState<'invoice' | 'tax-invoice'>('invoice');
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  // Initialize state with default values or initial data
  const [company, setCompany] = useState({
    name: initialData?.company_name || "PARK GRAND HOSPITALITY",
    address: initialData?.company_address || "H.No: 708 A, Ascona Cana, Benaulim, South-Goa, Goa 403717",
    gstin: initialData?.company_gstin || "30ACEPL2168C1Z8",
    email: initialData?.company_email || "sots.parkgrand@gmail.com",
    mobile: initialData?.company_mobile || "9552433413",
  });

  const [letterHead, setLetterHead] = useState(
    initialData?.letter_head || ""
  );

  const [meta, setMeta] = useState({
    title: initialData?.document_title || "QUOTATION",
    documentType: initialData?.document_type || "Quotation No.",
    quotationNo: initialData?.document_number || "02",
    dated: initialData?.dated || "08/02/2025",
    arrival: initialData?.arrival || "23/02/2025",
    departure: initialData?.departure || "09/03/2025",
    placeOfSupply: initialData?.place_of_supply || "Goa",
    termsOfPayment: initialData?.terms_of_payment || "On Arrival",
  });

  const [client, setClient] = useState({
    billTo: initialData?.client_bill_to || "Mikhail & Elena Medvedeva",
    companyName: initialData?.client_company_name || "",
    address: initialData?.client_address || "",
    gstNumber: initialData?.client_gst_number || "",
    phoneNumber: initialData?.client_phone_number || "9204511935",
    email: initialData?.client_email || "",
  });

  const [items, setItems] = useState(
    initialData?.items?.map(item => ({
      id: item.id,
      description: item.description,
      rooms: item.rooms,
      rate: item.rate,
      nights: item.nights,
      hsnSac: item.hsn_sac,
      gstRate: item.gst_rate,
    })) || [
      {
        id: 1,
        description:
          "Room No. 204 from 23rd February 2025 and Checkout on 9th March 2025 - Grand Royale Palms Benaulim, Goa",
        rooms: 1,
        rate: 1800,
        nights: 14,
        hsnSac: "996311",
        gstRate: 12,
      },
    ]
  );

  const [notes, setNotes] = useState(
    initialData?.notes || "The payment has to be made on arrival at the property. The booking is non cancellable and non-amendable."
  );

  const [terms, setTerms] = useState(
    initialData?.terms || `1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to GOA Jurisdiction only.`
  );

  const [discount, setDiscount] = useState(
    initialData?.discount || 0
  );

  const total = items.reduce(
    (s, it) => s + Number(it.rooms || 0) * Number(it.rate || 0) * Number(it.nights || 0),
    0
  );

  // Apply discount before GST (discount is a percentage)
  const discountPercentage = Number(discount || 0);
  const discountAmount = (total * discountPercentage) / 100;
  const subtotalAfterDiscount = total - discountAmount;

  // GST calculations - calculate GST on discounted amount for each item proportionally
  const itemsWithGst = items.map(item => {
    const itemTotal = Number(item.rooms || 0) * Number(item.rate || 0) * Number(item.nights || 0);
    const itemGstRate = Number(item.gstRate || 0);
    const itemCgstRate = itemGstRate / 2;
    const itemSgstRate = itemGstRate / 2;
    
    // Apply discount proportionally to each item
    const itemDiscount = total > 0 ? (itemTotal / total) * discountAmount : 0;
    const itemSubtotalAfterDiscount = itemTotal - itemDiscount;
    
    const itemCgstAmount = (itemSubtotalAfterDiscount * itemCgstRate) / 100;
    const itemSgstAmount = (itemSubtotalAfterDiscount * itemSgstRate) / 100;
    const itemGstTotal = itemCgstAmount + itemSgstAmount;
    
    return {
      ...item,
      itemTotal,
      itemDiscount,
      itemSubtotalAfterDiscount,
      itemCgstAmount,
      itemSgstAmount,
      itemGstTotal
    };
  });

  // Calculate total GST amounts on discounted subtotal
  const totalCgstAmount = itemsWithGst.reduce((sum, item) => sum + item.itemCgstAmount, 0);
  const totalSgstAmount = itemsWithGst.reduce((sum, item) => sum + item.itemSgstAmount, 0);
  const totalGstAmount = totalCgstAmount + totalSgstAmount;
  const grandTotal = subtotalAfterDiscount + totalGstAmount;

  // For display purposes, use average GST rate
  const avgGstRate = items.length > 0 ? items.reduce((sum, item) => sum + Number(item.gstRate || 0), 0) / items.length : 12;
  const cgstRate = avgGstRate / 2;
  const sgstRate = avgGstRate / 2;

  const numberToWords = (num: number): string => {
    if (!num) return "Zero";
    const units = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const inWords = (n: number): string => {
      if (n < 20) return units[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
      if (n < 1000) return units[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
      if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
      return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
    };
    return inWords(num) + " only";
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now(), description: "", rooms: 1, rate: 0, nights: 1, hsnSac: "", gstRate: 12 },
    ]);
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

  // Save bill to Supabase
  const saveBill = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      const billData: Omit<Bill, 'id' | 'created_at' | 'updated_at'> = {
        invoice_type: invoiceType,
        
        // Company information
        company_name: company.name,
        company_address: company.address,
        company_gstin: company.gstin,
        company_email: company.email,
        company_mobile: company.mobile,
        
        // Document metadata
        letter_head: letterHead || undefined,
        document_title: meta.title,
        document_type: meta.documentType,
        document_number: meta.quotationNo,
        dated: meta.dated,
        arrival: meta.arrival,
        departure: meta.departure,
        place_of_supply: meta.placeOfSupply,
        terms_of_payment: meta.termsOfPayment,
        
        // Client information
        client_bill_to: client.billTo,
        client_company_name: client.companyName || undefined,
        client_address: client.address || undefined,
        client_gst_number: client.gstNumber || undefined,
        client_phone_number: client.phoneNumber || undefined,
        client_email: client.email || undefined,
        
        // Items
        items: items.map(item => ({
          id: item.id,
          description: item.description,
          rooms: item.rooms,
          rate: item.rate,
          nights: item.nights,
          hsn_sac: item.hsnSac,
          gst_rate: item.gstRate
        })),
        
        // Additional information
        notes: notes,
        terms: terms,
        
        // Calculated totals
        total_amount: total,
        discount: discountPercentage > 0 ? discountPercentage : undefined,
        total_gst_amount: invoiceType === 'tax-invoice' ? totalGstAmount : undefined,
        grand_total: invoiceType === 'tax-invoice' ? grandTotal : (discountPercentage > 0 ? subtotalAfterDiscount : total)
      };

      if (mode === 'edit' && billId) {
        // Update existing bill
        await BillService.updateBill(billId, billData);
        setSaveMessage('✅ Bill updated successfully! Redirecting...');
        
        // Redirect to bill detail page after 2 seconds
        setTimeout(() => {
          window.location.href = `/bills/${billId}`;
        }, 2000);
      } else {
        // Create new bill
        await BillService.saveBill(billData);
        setSaveMessage('✅ Bill saved successfully! Showing preview...');
        
        // Show invoice preview after saving
        setTimeout(() => {
          setFormVisible(false);
          setSaveMessage('');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error saving bill:', error);
      setSaveMessage(`❌ Failed to ${mode === 'edit' ? 'update' : 'save'} bill. Please try again.`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-update title and document type based on invoice type
  useEffect(() => {
    if (invoiceType === 'tax-invoice') {
      setMeta(prev => ({ ...prev, title: "TAX INVOICE", documentType: "Invoice No." }));
    } else {
      setMeta(prev => ({ ...prev, title: "QUOTATION", documentType: "Quotation No." }));
    }
  }, [invoiceType]);

  // Download PDF with robust checks and dynamic import
  const downloadPDF = async () => {
    const element = invoiceRef.current;
    if (!element) {
      alert("Invoice element is not rendered yet. Please try again.");
      return;
    }

    setIsExporting(true);

    try {
      // dynamic import so bundlers / SSR don't cause issues
      const lib = await import(/* webpackChunkName: "html2pdf" */ "html2pdf.js");
      const html2pdfFn = lib && (lib.default || lib.html2pdf || lib);

      if (typeof html2pdfFn !== "function") {
        throw new Error("html2pdf.js module did not expose the expected function.");
      }

      // Store original styles
      const originalStyles = {
        width: element.style.width,
        maxWidth: element.style.maxWidth,
        padding: element.style.padding,
        margin: element.style.margin,
      };

      // Apply A4-optimized styles
      element.style.width = "190mm"; // Slightly less than A4 width to account for margins
      element.style.maxWidth = "190mm";
      element.style.padding = "5mm"; // Reduced padding for better fit
      element.style.margin = "0";

      // Hide all buttons during PDF export
      const buttons = element.querySelectorAll('button');
      buttons.forEach(button => {
        button.style.display = 'none';
      });

      // Ensure all child elements respect the width
      const allElements = element.querySelectorAll('*');
      allElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style.width && htmlEl.style.width.includes('%')) {
          // Keep percentage widths
        } else if (htmlEl.style.width && htmlEl.style.width.includes('px')) {
          // Convert px to mm for better PDF rendering
          const pxValue = parseFloat(htmlEl.style.width);
          htmlEl.style.width = `${pxValue * 0.264583}mm`;
        }
      });

      // Small pause to ensure styles/layout settle
      await new Promise((res) => setTimeout(res, 200));

      const opt = {
        margin: [5, 5, 5, 5], // Top, Right, Bottom, Left margins in mm (reduced for better fit)
        filename: `${meta.title}-${meta.quotationNo || "NA"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 1.2, // Reduced scale to fit better on one page
          useCORS: true,
          letterRendering: true,
          width: 190 * 3.7795275591, // Convert mm to pixels for html2canvas
          height: element.scrollHeight,
          windowWidth: 190 * 3.7795275591
        },
        jsPDF: { 
          unit: "mm", 
          format: "a4", 
          orientation: "portrait",
          compress: true
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Call the library
      const worker = html2pdfFn().set(opt).from(element);

      // Save and await if it returns a Promise
      const res = worker.save();
      if (res && typeof res.then === "function") {
        await res;
      }

      // Restore original styles
      element.style.width = originalStyles.width || "";
      element.style.maxWidth = originalStyles.maxWidth || "";
      element.style.padding = originalStyles.padding || "";
      element.style.margin = originalStyles.margin || "";

      // Restore button visibility
      buttons.forEach(button => {
        button.style.display = '';
      });

    } catch (err) {
      console.error("PDF export error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      alert("Failed to generate PDF. See console for details. " + errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  if (formVisible) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Invoice Type Selection */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
              <h2 className="text-white text-base font-semibold mb-2">📋 Select Invoice Type</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    invoiceType === 'invoice' 
                      ? 'bg-white text-blue-600 shadow-lg' 
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                  onClick={() => setInvoiceType('invoice')}
                >
                  📄 Generate Invoice
                </button>
                <button
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                    invoiceType === 'tax-invoice' 
                      ? 'bg-white text-blue-600 shadow-lg' 
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                  onClick={() => setInvoiceType('tax-invoice')}
                >
                  🧾 Generate Tax Invoice
                </button>
              </div>
            </div>

            <div className="p-4 space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">🏢</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Enter your company name" 
                        value={company.name} 
                        onChange={(e) => setCompany({ ...company, name: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN/UIN</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Enter GSTIN/UIN number" 
                        value={company.gstin} 
                        onChange={(e) => setCompany({ ...company, gstin: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Enter company email" 
                        value={company.email} 
                        onChange={(e) => setCompany({ ...company, email: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea 
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-sm" 
                        placeholder="Enter complete company address" 
                        value={company.address} 
                        onChange={(e) => setCompany({ ...company, address: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                      <input 
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Enter company mobile number" 
                        value={company.mobile} 
                        onChange={(e) => setCompany({ ...company, mobile: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">📝</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Letter Head (Company Name Header)</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                    placeholder="Enter company name for header (e.g., PARK GRAND HOSPITALITY)" 
                    value={letterHead} 
                    onChange={(e) => setLetterHead(e.target.value)} 
                  />
                  <p className="text-xs text-gray-500 mt-1">This will appear above the document title in bold, larger text</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Title</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                      placeholder="e.g., QUOTATION, INVOICE, TAX INVOICE, BILL" 
                      value={meta.title} 
                      onChange={(e) => setMeta({ ...meta, title: e.target.value.toUpperCase() })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                      placeholder="e.g., Quotation No., Invoice No., Bill No." 
                      value={meta.documentType} 
                      onChange={(e) => setMeta({ ...meta, documentType: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                      placeholder="e.g., 001, Q-2025-01" 
                      value={meta.quotationNo} 
                      onChange={(e) => setMeta({ ...meta, quotationNo: e.target.value })} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dated</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                      placeholder="DD/MM/YYYY" 
                      value={meta.dated} 
                      onChange={(e) => setMeta({ ...meta, dated: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Arrival</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                      placeholder="DD/MM/YYYY" 
                      value={meta.arrival} 
                      onChange={(e) => setMeta({ ...meta, arrival: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                      placeholder="DD/MM/YYYY" 
                      value={meta.departure} 
                      onChange={(e) => setMeta({ ...meta, departure: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Place of Supply</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                      placeholder="e.g., Goa, Mumbai, Delhi" 
                      value={meta.placeOfSupply} 
                      onChange={(e) => setMeta({ ...meta, placeOfSupply: e.target.value })} 
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Terms of Payment</label>
                    <input 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                      placeholder="e.g., On Arrival, Advance, Net 30" 
                      value={meta.termsOfPayment} 
                      onChange={(e) => setMeta({ ...meta, termsOfPayment: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">👤</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bill To</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Enter client/customer name" 
                        value={client.billTo} 
                        onChange={(e) => setClient({ ...client, billTo: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Enter company name" 
                        value={client.companyName} 
                        onChange={(e) => setClient({ ...client, companyName: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <textarea 
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-sm" 
                        placeholder="Enter complete address" 
                        value={client.address} 
                        onChange={(e) => setClient({ ...client, address: e.target.value })} 
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <input 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Enter GST number" 
                        value={client.gstNumber} 
                        onChange={(e) => setClient({ ...client, gstNumber: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input 
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Enter phone number" 
                        value={client.phoneNumber} 
                        onChange={(e) => setClient({ ...client, phoneNumber: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input 
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                        placeholder="Enter email address" 
                        value={client.email} 
                        onChange={(e) => setClient({ ...client, email: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold text-sm">📦</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Items & Services</h3>
                  </div>
                  <button 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg text-sm" 
                    onClick={addItem}
                  >
                    ➕ Add New Item
                  </button>
                </div>
                
                {items.map((it, index) => (
                  <div key={it.id} className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-base font-semibold text-gray-800">Item #{index + 1}</h4>
                      <button 
                        className="text-red-600 hover:text-red-800 font-medium text-xs bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100 transition-all duration-200" 
                        onClick={() => removeItem(it.id)}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description of Service/Item</label>
                        <textarea 
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white resize-none text-sm" 
                          placeholder="Describe the service/item (e.g., Room booking, Hotel accommodation, etc.)" 
                          value={it.description} 
                          onChange={(e) => updateItem(it.id, "description", e.target.value)} 
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">HSN/SAC Code</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
                            value={it.hsnSac}
                            onChange={(e) => updateItem(it.id, "hsnSac", e.target.value)}
                            placeholder="e.g., 996311"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
                            value={it.gstRate}
                            onChange={(e) => updateItem(it.id, "gstRate", Number(e.target.value || 0))}
                            placeholder="e.g., 12"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">No. of Rooms</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
                            value={it.rooms}
                            onChange={(e) => updateItem(it.id, "rooms", Number(e.target.value || 0))}
                            placeholder="Enter number of rooms"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Room (₹)</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
                            value={it.rate}
                            onChange={(e) => updateItem(it.id, "rate", Number(e.target.value || 0))}
                            placeholder="Enter rate per room"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">No. of Nights</label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
                            value={it.nights}
                            onChange={(e) => updateItem(it.id, "nights", Number(e.target.value || 0))}
                            placeholder="Enter number of nights"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-semibold text-sm">💰</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Discount</h3>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bill Discount (%)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm" 
                    placeholder="Enter discount percentage (e.g., 5 for 5%)" 
                    value={discount || ''} 
                    onChange={(e) => setDiscount(Number(e.target.value || 0))} 
                  />
                  <p className="text-xs text-gray-500 mt-1">Discount will be applied before GST calculation. Example: 5% discount on ₹18,700 = ₹935</p>
                  {discount > 0 && total > 0 && (
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      Discount Amount: ₹{((total * discount) / 100).toLocaleString("en-IN")} (on ₹{total.toLocaleString("en-IN")})
                    </p>
                  )}
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold text-sm">📋</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea 
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-sm" 
                      placeholder="Enter any additional notes or special instructions for the client" 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                    <textarea 
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none text-sm" 
                      placeholder="Enter your terms and conditions (one per line)" 
                      value={terms} 
                      onChange={(e) => setTerms(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Save and Generate Buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                {/* Save Message */}
                {saveMessage && (
                  <div className={`text-center text-sm font-medium px-4 py-2 rounded-lg ${
                    saveMessage.includes('✅') 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {saveMessage}
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={saveBill}
                    disabled={isSaving}
                  >
                    {isSaving 
                      ? (mode === 'edit' ? '💾 Updating...' : '💾 Saving...') 
                      : (mode === 'edit' ? '💾 Update Bill' : '💾 Save & Generate Bill')
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invoice preview
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="w-full max-w-4xl" ref={invoiceRef}>
        {letterHead && (
          <div className="text-center pb-2 font-bold text-lg mb-2" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
            {letterHead}
          </div>
        )}
        <div className="bg-white border-2 border-gray-400 text-sm print:w-[210mm] print:max-w-none quotation-box">
         <div className="text-center pb-2 border-b border-gray-300 font-bold text-base" style={{ marginTop: '0', paddingTop: '0' }}>
           {meta.title}
         </div>

        <table className="quotation-table w-full border border-gray-300">
          <tbody>
            <tr>
              <td className="quotation-cell border-r border-gray-300 w-1/2">
                <div className="font-bold text-sm">{company.name}</div>
                <div className="text-xs mt-1 whitespace-pre-wrap">{company.address}</div>
                <div className="text-xs mt-1">GSTIN/UIN: {company.gstin}</div>
                <div className="text-xs mt-1">E-Mail: {company.email}</div>
                <div className="text-xs mt-1">Mobile: {company.mobile}</div>
              </td>
              <td className="quotation-cell w-1/2">
                <table className="quotation-table w-full">
                  <tbody>
                     <tr>
                       <td className="quotation-cell border-r border-b border-gray-300 text-xs">
                         <div className="font-semibold">{meta.documentType}</div>
                         <div>{meta.quotationNo}</div>
                       </td>
                      <td className="quotation-cell border-b border-gray-300 text-xs">
                        <div className="font-semibold">Dated</div>
                        <div>{meta.dated}</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="quotation-cell border-r border-b border-gray-300 text-xs">
                        <div className="font-semibold">Date of Arrival</div>
                        <div>{meta.arrival}</div>
                      </td>
                      <td className="quotation-cell border-b border-gray-300 text-xs">
                        <div className="font-semibold">Date of Departure</div>
                        <div>{meta.departure}</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="quotation-cell border-r border-gray-300 text-xs">
                        <div className="font-semibold">Place of Supply</div>
                        <div>{meta.placeOfSupply}</div>
                      </td>
                      <td className="quotation-cell text-xs">
                        <div className="font-semibold">Mode/Terms of Payment</div>
                        <div>{meta.termsOfPayment}</div>
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
                <div><strong>Bill To:</strong> {client.billTo}</div>
                {client.companyName && <div className="mt-1"><strong>Company:</strong> {client.companyName}</div>}
                {client.address && <div className="mt-1"><strong>Address:</strong> {client.address}</div>}
                {client.gstNumber && <div className="mt-1"><strong>GST No:</strong> {client.gstNumber}</div>}
                {client.phoneNumber && <div className="mt-1"><strong>Phone:</strong> {client.phoneNumber}</div>}
                {client.email && <div className="mt-1"><strong>Email:</strong> {client.email}</div>}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="quotation-table w-full border border-gray-300">
          <thead>
            <tr>
              <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '6%' }}>Sl No</th>
              <th className="quotation-cell text-xs font-semibold bg-gray-50 text-left" style={{ width: '35%' }}>Description of Goods/Services</th>
              {invoiceType === 'tax-invoice' && (
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
            {items.map((it, idx) => (
              <tr key={it.id}>
                <td className="quotation-cell text-center text-xs">{idx + 1}</td>
                <td className="quotation-cell text-left text-xs break-words">{it.description}</td>
                {invoiceType === 'tax-invoice' && (
                  <>
                    <td className="quotation-cell text-center text-xs">{it.hsnSac}</td>
                    <td className="quotation-cell text-center text-xs">{it.gstRate}%</td>
                  </>
                )}
                <td className="quotation-cell text-center text-xs">{it.rooms}</td>
                <td className="quotation-cell text-right text-xs">₹{Number(it.rate).toLocaleString("en-IN")}</td>
                <td className="quotation-cell text-center text-xs">{it.nights}</td>
                <td className="quotation-cell text-right text-xs font-semibold">₹{(it.rooms * it.rate * it.nights).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td colSpan={invoiceType === 'tax-invoice' ? 7 : 5} className="quotation-cell text-right font-semibold text-xs">Total Amount</td>
              <td className="quotation-cell text-right font-semibold text-xs">₹{total.toLocaleString("en-IN")}</td>
            </tr>
            {discountPercentage > 0 && (
              <tr>
                <td colSpan={invoiceType === 'tax-invoice' ? 7 : 5} className="quotation-cell text-right text-xs">Discount ({discountPercentage}%)</td>
                <td className="quotation-cell text-right text-xs">-₹{discountAmount.toLocaleString("en-IN")}</td>
              </tr>
            )}
            {discountPercentage > 0 && (
              <tr className="bg-gray-50">
                <td colSpan={invoiceType === 'tax-invoice' ? 7 : 5} className="quotation-cell text-right font-semibold text-xs">Subtotal After Discount</td>
                <td className="quotation-cell text-right font-semibold text-xs">₹{subtotalAfterDiscount.toLocaleString("en-IN")}</td>
              </tr>
            )}
            {invoiceType === 'tax-invoice' && (
              <>
                 <tr>
                   <td className="quotation-cell text-xs text-center">-</td>
                   <td className="quotation-cell text-xs text-center">CGST</td>
                   <td className="quotation-cell text-xs text-center">-</td>
                   <td className="quotation-cell text-xs text-center">{cgstRate.toFixed(1)}%</td>
                   <td className="quotation-cell text-xs text-center">-</td>
                   <td className="quotation-cell text-xs text-right">₹{totalCgstAmount.toLocaleString("en-IN")}</td>
                   <td className="quotation-cell text-xs text-center">-</td>
                   <td className="quotation-cell text-xs text-right">₹{(subtotalAfterDiscount + totalCgstAmount).toLocaleString("en-IN")}</td>
                 </tr>
                 <tr>
                   <td className="quotation-cell text-xs text-center">-</td>
                   <td className="quotation-cell text-xs text-center">SGST</td>
                   <td className="quotation-cell text-xs text-center">-</td>
                   <td className="quotation-cell text-xs text-center">{sgstRate.toFixed(1)}%</td>
                   <td className="quotation-cell text-xs text-center">-</td>
                   <td className="quotation-cell text-xs text-right">₹{totalSgstAmount.toLocaleString("en-IN")}</td>
                   <td className="quotation-cell text-xs text-center">-</td>
                   <td className="quotation-cell text-xs text-right">₹{grandTotal.toLocaleString("en-IN")}</td>
                 </tr>
                 <tr className="bg-gray-50">
                   <td colSpan={invoiceType === 'tax-invoice' ? 7 : 5} className="quotation-cell text-right font-semibold text-xs">G. Total</td>
                   <td className="quotation-cell text-right font-semibold text-sm">₹{grandTotal.toLocaleString("en-IN")}</td>
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
                <div className="italic">Indian Rupee {numberToWords(invoiceType === 'tax-invoice' ? grandTotal : (discountPercentage > 0 ? subtotalAfterDiscount : total))}</div>
              </td>
            </tr>
          </tbody>
        </table>

        {invoiceType === 'tax-invoice' && (
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
                  <td className="quotation-cell text-center text-xs">{it.hsnSac}</td>
                  <td className="quotation-cell text-right text-xs">₹{it.itemSubtotalAfterDiscount.toLocaleString("en-IN")}</td>
                  <td className="quotation-cell text-center text-xs">{it.itemCgstAmount > 0 ? (it.gstRate / 2).toFixed(1) : 0}%</td>
                  <td className="quotation-cell text-right text-xs">₹{it.itemCgstAmount.toLocaleString("en-IN")}</td>
                  <td className="quotation-cell text-center text-xs">{it.itemSgstAmount > 0 ? (it.gstRate / 2).toFixed(1) : 0}%</td>
                  <td className="quotation-cell text-right text-xs">₹{it.itemSgstAmount.toLocaleString("en-IN")}</td>
                  <td className="quotation-cell text-center text-xs">-</td>
                  <td className="quotation-cell text-right text-xs font-semibold">₹{it.itemGstTotal.toLocaleString("en-IN")}</td>
                </tr>
              ))}
              <tr className="bg-gray-50">
                <td className="quotation-cell text-center text-xs font-bold">Total</td>
                <td className="quotation-cell text-center text-xs font-bold">-</td>
                <td className="quotation-cell text-right text-xs font-bold">₹{subtotalAfterDiscount.toLocaleString("en-IN")}</td>
                <td className="quotation-cell text-center text-xs font-bold">-</td>
                <td className="quotation-cell text-right text-xs font-bold">₹{totalCgstAmount.toLocaleString("en-IN")}</td>
                <td className="quotation-cell text-center text-xs font-bold">-</td>
                <td className="quotation-cell text-right text-xs font-bold">₹{totalSgstAmount.toLocaleString("en-IN")}</td>
                <td className="quotation-cell text-center text-xs font-bold">-</td>
                <td className="quotation-cell text-right text-xs font-bold">₹{totalGstAmount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>
        )}

        <table className="quotation-table w-full border-t border-gray-300">
          <tbody>
            <tr>
              <td className="quotation-cell border-r border-gray-300 text-xs w-1/2">
                <strong>NOTES</strong>
                <div className="mt-1 whitespace-pre-wrap">{notes}</div>
              </td>
              <td className="quotation-cell text-xs w-1/2 text-right">
                For {company.name}
              </td>
            </tr>
          </tbody>
        </table>

         <table className="quotation-table w-full border-t border-gray-300">
           <tbody>
             <tr>
               <td className="quotation-cell border-r border-gray-300 text-xs w-1/2" style={{ padding: '4px 6px' }}>
                 <strong>TERMS AND CONDITIONS</strong>
                 <div className="mt-1 whitespace-pre-wrap">{terms}</div>
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

         <div className="p-4 text-center space-x-3 print:hidden no-print border-t border-gray-300 bg-gray-50">
           <button 
             className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg" 
             onClick={() => setFormVisible(true)}
           >
             ✏️ Back to Edit
           </button>
           <button 
             className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 shadow-lg" 
             onClick={downloadPDF} 
             disabled={isExporting}
           >
             {isExporting ? "⏳ Preparing PDF..." : "📄 Download PDF"}
           </button>
         </div>
      </div>
    </div>
  );
}
