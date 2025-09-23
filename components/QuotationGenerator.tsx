import React, { useState, useRef } from "react";

// QuotationGenerator (fixed PDF export)
// - Uses dynamic import of html2pdf.js to avoid SSR/bundler timing issues
// - Guards against missing ref before export
// - Provides user-friendly error handling and a small export-loading state
// - Keeps the same UI/structure you had, with inputs and a generated preview

export default function QuotationGenerator() {
  const [formVisible, setFormVisible] = useState(true);
  const invoiceRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const [company, setCompany] = useState({
    name: "PARK GRAND HOSPITALITY",
    address: "H.No: 708 A, Ascona Cana, Benaulim, South-Goa, Goa 403717",
    gstin: "30ACEPL2168C1Z8",
    email: "sots.parkgrand@gmail.com",
    mobile: "9552433413",
  });

  const [meta, setMeta] = useState({
    quotationNo: "02",
    dated: "08/02/2025",
    arrival: "23/02/2025",
    departure: "09/03/2025",
    placeOfSupply: "Goa",
    termsOfPayment: "On Arrival",
  });

  const [client, setClient] = useState({
    billTo: "Mikhail & Elena Medvedeva",
    mobile: "9204511935",
  });

  const [items, setItems] = useState([
    {
      id: 1,
      description:
        "Room No. 204 from 23rd February 2025 and Checkout on 9th March 2025 - Grand Royale Palms Benaulim, Goa",
      rooms: 1,
      rate: 1800,
      nights: 14,
    },
  ]);

  const [notes, setNotes] = useState(
    "The payment has to be made on arrival at the property. The booking is non cancellable and non-amendable."
  );

  const [terms, setTerms] = useState(
    `1. Goods once sold will not be taken back or exchanged\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] Jurisdiction only.`
  );

  const total = items.reduce(
    (s, it) => s + Number(it.rooms || 0) * Number(it.rate || 0) * Number(it.nights || 0),
    0
  );

  const numberToWords = (num) => {
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

    const inWords = (n) => {
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
      { id: Date.now(), description: "", rooms: 1, rate: 0, nights: 1 },
    ]);
  };

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

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
      element.style.padding = "10mm";
      element.style.margin = "0";

      // Hide all buttons during PDF export
      const buttons = element.querySelectorAll('button');
      buttons.forEach(button => {
        button.style.display = 'none';
      });

      // Ensure all child elements respect the width
      const allElements = element.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.style.width && el.style.width.includes('%')) {
          // Keep percentage widths
        } else if (el.style.width && el.style.width.includes('px')) {
          // Convert px to mm for better PDF rendering
          const pxValue = parseFloat(el.style.width);
          el.style.width = `${pxValue * 0.264583}mm`;
        }
      });

      // Small pause to ensure styles/layout settle
      await new Promise((res) => setTimeout(res, 200));

      const opt = {
        margin: [10, 10, 10, 10], // Top, Right, Bottom, Left margins in mm
        filename: `Quotation-${meta.quotationNo || "NA"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { 
          scale: 1.5, // Reduced scale to prevent overflow
          useCORS: true,
          letterRendering: true,
          width: 190 * 3.7795275591, // Convert mm to pixels for html2canvas
          height: element.scrollHeight
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
      alert("Failed to generate PDF. See console for details. " + (err && err.message ? err.message : ""));
    } finally {
      setIsExporting(false);
    }
  };

  if (formVisible) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-xl font-semibold">Quotation Input Form</h2>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input className="border p-2 w-full" placeholder="Enter your company name" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium">Address</label>
          <textarea className="border p-2 w-full" placeholder="Enter complete company address" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium">GSTIN/UIN</label>
          <input className="border p-2 w-full" placeholder="Enter GSTIN/UIN number" value={company.gstin} onChange={(e) => setCompany({ ...company, gstin: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input className="border p-2 w-full" placeholder="Enter company email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm font-medium">Mobile</label>
          <input className="border p-2 w-full" placeholder="Enter company mobile number" value={company.mobile} onChange={(e) => setCompany({ ...company, mobile: e.target.value })} />
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm">Quotation No</label>
            <input className="border p-2 w-full" placeholder="e.g., 001, Q-2025-01" value={meta.quotationNo} onChange={(e) => setMeta({ ...meta, quotationNo: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Dated</label>
            <input className="border p-2 w-full" placeholder="DD/MM/YYYY" value={meta.dated} onChange={(e) => setMeta({ ...meta, dated: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Arrival</label>
            <input className="border p-2 w-full" placeholder="DD/MM/YYYY" value={meta.arrival} onChange={(e) => setMeta({ ...meta, arrival: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Departure</label>
            <input className="border p-2 w-full" placeholder="DD/MM/YYYY" value={meta.departure} onChange={(e) => setMeta({ ...meta, departure: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Place of Supply</label>
            <input className="border p-2 w-full" placeholder="e.g., Goa, Mumbai, Delhi" value={meta.placeOfSupply} onChange={(e) => setMeta({ ...meta, placeOfSupply: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Terms of Payment</label>
            <input className="border p-2 w-full" placeholder="e.g., On Arrival, Advance, Net 30" value={meta.termsOfPayment} onChange={(e) => setMeta({ ...meta, termsOfPayment: e.target.value })} />
          </div>
        </div>

        {/* Client */}
        <div>
          <label className="block text-sm">Bill To</label>
          <input className="border p-2 w-full" placeholder="Enter client/customer name" value={client.billTo} onChange={(e) => setClient({ ...client, billTo: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm">Mobile</label>
          <input className="border p-2 w-full" placeholder="Enter client mobile number" value={client.mobile} onChange={(e) => setClient({ ...client, mobile: e.target.value })} />
        </div>

        {/* Items */}
        <div>
          <label className="block text-sm font-medium">Items</label>
          {items.map((it) => (
            <div key={it.id} className="border p-3 rounded mb-3 bg-gray-50">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description of Service/Item</label>
                <textarea 
                  className="w-full border p-2 rounded" 
                  placeholder="Describe the service/item (e.g., Room booking, Hotel accommodation, etc.)" 
                  value={it.description} 
                  onChange={(e) => updateItem(it.id, "description", e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">No. of Rooms</label>
                  <input
                    type="number"
                    className="border p-2 w-full rounded"
                    value={it.rooms}
                    onChange={(e) => updateItem(it.id, "rooms", Number(e.target.value || 0))}
                    placeholder="Enter number of rooms"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Rate per Room (₹)</label>
                  <input
                    type="number"
                    className="border p-2 w-full rounded"
                    value={it.rate}
                    onChange={(e) => updateItem(it.id, "rate", Number(e.target.value || 0))}
                    placeholder="Enter rate per room"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">No. of Nights</label>
                  <input
                    type="number"
                    className="border p-2 w-full rounded"
                    value={it.nights}
                    onChange={(e) => updateItem(it.id, "nights", Number(e.target.value || 0))}
                    placeholder="Enter number of nights"
                  />
                </div>
              </div>
              <button className="text-red-600 text-xs mt-2 hover:text-red-800" onClick={() => removeItem(it.id)}>Remove Item</button>
            </div>
          ))}
          <button className="bg-slate-800 text-white px-4 py-2 text-sm rounded hover:bg-slate-900" onClick={addItem}>+ Add New Item</button>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm">Notes</label>
          <textarea className="border p-2 w-full" placeholder="Enter any additional notes or special instructions for the client" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {/* Terms */}
        <div>
          <label className="block text-sm">Terms & Conditions</label>
          <textarea className="border p-2 w-full" placeholder="Enter your terms and conditions (one per line)" value={terms} onChange={(e) => setTerms(e.target.value)} />
        </div>

        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => setFormVisible(false)}>Generate Invoice</button>
      </div>
    );
  }

  // Invoice preview
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="w-full max-w-4xl bg-white border-2 border-gray-400 text-sm print:w-[210mm] print:max-w-none quotation-box" ref={invoiceRef}>
        <div className="text-center py-1 border-b border-gray-300 font-semibold">QUOTATION</div>

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
                        <div className="font-semibold">Quotation No.</div>
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
              <td className="quotation-cell border-r border-gray-300 text-xs w-2/3">
                <strong>Bill To:</strong> {client.billTo}
              </td>
              <td className="quotation-cell text-xs w-1/3">
                <strong>Mobile:</strong> {client.mobile}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="quotation-table w-full border border-gray-300">
          <thead>
            <tr>
              <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '8%' }}>Sl No</th>
              <th className="quotation-cell text-xs font-semibold bg-gray-50 text-left" style={{ width: '50%' }}>Description of Goods/Services</th>
              <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '10%' }}>Rooms</th>
              <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '12%' }}>Rate</th>
              <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '10%' }}>Nights</th>
              <th className="quotation-cell text-xs font-semibold bg-gray-50 text-center" style={{ width: '10%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={it.id}>
                <td className="quotation-cell text-center text-xs">{idx + 1}</td>
                <td className="quotation-cell text-left text-xs break-words">{it.description}</td>
                <td className="quotation-cell text-center text-xs">{it.rooms}</td>
                <td className="quotation-cell text-right text-xs">₹{Number(it.rate).toLocaleString("en-IN")}</td>
                <td className="quotation-cell text-center text-xs">{it.nights}</td>
                <td className="quotation-cell text-right text-xs font-semibold">₹{(it.rooms * it.rate * it.nights).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td colSpan={5} className="quotation-cell text-right font-bold text-sm">Total Amount</td>
              <td className="quotation-cell text-right font-bold text-sm">₹{total.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        <table className="quotation-table w-full border-t border-gray-300">
          <tbody>
            <tr>
              <td className="quotation-cell text-xs">
                <div className="font-semibold text-sm">Amount Chargeable (in words)</div>
                <div className="italic">Indian Rupee {numberToWords(total)}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <table className="quotation-table w-full border-t border-gray-300">
          <tbody>
            <tr>
              <td className="quotation-cell border-r border-gray-300 text-xs w-2/3">
                <strong>NOTES</strong>
                <div className="mt-1 whitespace-pre-wrap">{notes}</div>
              </td>
              <td className="quotation-cell text-xs w-1/3 text-right">
                For {company.name}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="quotation-table w-full border-t border-gray-300">
          <tbody>
            <tr>
              <td className="quotation-cell border-r border-gray-300 text-xs w-2/3">
                <strong>TERMS AND CONDITIONS</strong>
                <div className="mt-1 whitespace-pre-wrap">{terms}</div>
              </td>
              <td className="quotation-cell text-xs w-1/3 text-right">
                Authorised Signatory
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-center text-xs py-1 border-t border-gray-300">This is a Computer Generated Invoice</div>

        <div className="p-2 text-center space-x-2 print:hidden no-print border-t border-gray-300">
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setFormVisible(true)}>Back to Edit</button>
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={downloadPDF} disabled={isExporting}>{isExporting ? "Preparing PDF..." : "Download PDF"}</button>
        </div>
      </div>
    </div>
  );
}
