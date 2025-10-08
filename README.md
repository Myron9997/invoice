# Invoice Generator with Supabase Backend

A professional invoice and quotation generator with bill storage and management capabilities, built with Next.js, React, TypeScript, and Supabase.

## 🚀 Features

- 📝 **Dynamic Form Input**: Fill in company details, client information, and itemized services
- 🎨 **Professional Design**: Clean, printable invoice layout with proper formatting
- 📄 **PDF Export**: Generate high-quality PDF invoices using html2pdf.js
- 💰 **Automatic Calculations**: Automatic total calculation and amount in words conversion
- 💾 **Bill Storage**: Save bills to Supabase database for future reference
- 📋 **Bill Management**: View, edit, and delete saved bills
- 🔍 **Search & Filter**: Search bills by client name or document number
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast Performance**: Built with Next.js for optimal performance

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **PDF Generation**: html2pdf.js
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd invoice-generator
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Set Up Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Create Database Schema**:
   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Create bills table
   CREATE TABLE bills (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     
     -- Invoice type
     invoice_type TEXT NOT NULL CHECK (invoice_type IN ('invoice', 'tax-invoice')),
     
     -- Company information
     company_name TEXT NOT NULL,
     company_address TEXT NOT NULL,
     company_gstin TEXT NOT NULL,
     company_email TEXT NOT NULL,
     company_mobile TEXT NOT NULL,
     
     -- Document metadata
     document_title TEXT NOT NULL,
     document_type TEXT NOT NULL,
     document_number TEXT NOT NULL,
     dated TEXT NOT NULL,
     arrival TEXT NOT NULL,
     departure TEXT NOT NULL,
     place_of_supply TEXT NOT NULL,
     terms_of_payment TEXT NOT NULL,
     
     -- Client information
     client_bill_to TEXT NOT NULL,
     client_company_name TEXT,
     client_address TEXT,
     client_gst_number TEXT,
     client_phone_number TEXT,
     client_email TEXT,
     
     -- Items (stored as JSONB)
     items JSONB NOT NULL,
     
     -- Additional information
     notes TEXT NOT NULL,
     terms TEXT NOT NULL,
     
     -- Calculated totals
     total_amount DECIMAL(10,2) NOT NULL,
     total_gst_amount DECIMAL(10,2),
     grand_total DECIMAL(10,2)
   );

   -- Create indexes for better performance
   CREATE INDEX idx_bills_created_at ON bills(created_at DESC);
   CREATE INDEX idx_bills_client_bill_to ON bills(client_bill_to);
   CREATE INDEX idx_bills_document_number ON bills(document_number);
   CREATE INDEX idx_bills_invoice_type ON bills(invoice_type);

   -- Enable Row Level Security (RLS)
   ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

   -- Create a policy that allows all operations (you can customize this based on your needs)
   CREATE POLICY "Allow all operations on bills" ON bills
   FOR ALL USING (true);
   ```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### Creating Bills

1. **Fill in Company Details**: Enter your company name, address, GSTIN, email, and mobile number
2. **Select Invoice Type**: Choose between Invoice or Tax Invoice
3. **Add Document Information**: Set document number, dates, arrival/departure dates, place of supply, and payment terms
4. **Enter Client Details**: Add bill-to information, company name, address, GST number, phone, and email
5. **Add Items**: Describe services, set number of rooms, rate per room, and number of nights
6. **Add Notes and Terms**: Include any additional notes and terms & conditions
7. **Save Bill**: Click "💾 Save Bill" to store the bill in Supabase
8. **Generate Invoice**: Click "🚀 Generate Invoice" to preview the formatted invoice
9. **Export PDF**: Click "📄 Download PDF" to save the invoice as a PDF file

### Managing Bills

1. **View All Bills**: Click "📄 View Saved Bills" from the main page
2. **Search Bills**: Use the search bar to find bills by client name or document number
3. **View Bill Details**: Click "👁️ View" to see the full bill
4. **Edit Bills**: Click "✏️ Edit" to modify an existing bill
5. **Delete Bills**: Click "🗑️ Delete" to remove a bill (with confirmation)

## 🗂️ File Structure

```
invoice-generator/
├── app/
│   ├── bills/
│   │   ├── page.tsx              # Bills list page
│   │   └── [id]/
│   │       └── page.tsx          # Bill detail page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Main page
├── components/
│   └── QuotationGenerator.tsx    # Main invoice generator component
├── lib/
│   ├── supabase.ts               # Supabase client and types
│   └── billService.ts            # Bill database operations
├── types/
│   └── html2pdf.d.ts
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🔧 Customization

### Company Information

Update the default company details in `components/QuotationGenerator.tsx`:

```typescript
const [company, setCompany] = useState({
  name: "YOUR COMPANY NAME",
  address: "YOUR COMPANY ADDRESS",
  gstin: "YOUR GSTIN",
  email: "your-email@company.com",
  mobile: "your-mobile-number",
});
```

### Default Terms

Modify the default terms and conditions:

```typescript
const [terms, setTerms] = useState(
  `1. Your custom terms here\n2. More terms here.`
);
```

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**: Push your code to a GitHub repository
2. **Connect to Vercel**: Go to [vercel.com](https://vercel.com) and import your repository
3. **Add Environment Variables**: Add your Supabase credentials in Vercel's environment variables
4. **Deploy**: Vercel will automatically deploy your application

### Environment Variables for Production

Make sure to set these in your deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## 🔒 Security Considerations

- The current setup uses a simple RLS policy that allows all operations
- For production, consider implementing proper authentication and more restrictive policies
- Review Supabase's security documentation for best practices

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**:
   - Verify your environment variables are correct
   - Check that your Supabase project is active
   - Ensure the database schema is properly set up

2. **PDF Export Issues**:
   - Make sure html2pdf.js is properly installed
   - Check browser console for any JavaScript errors
   - Try refreshing the page and attempting export again

3. **Bill Not Saving**:
   - Check Supabase logs for any database errors
   - Verify RLS policies are correctly configured
   - Ensure all required fields are filled

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review Supabase documentation
3. Open an issue on GitHub
4. Contact the maintainers

---

**Happy invoicing! 🎉**