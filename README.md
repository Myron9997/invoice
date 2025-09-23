# Invoice Generator

A professional invoice and quotation generator built with Next.js, React, and Tailwind CSS. This application allows you to create, customize, and export invoices as PDF files.

## Features

- 📝 **Dynamic Form Input**: Fill in company details, client information, and itemized services
- 🎨 **Professional Design**: Clean, printable invoice layout with proper formatting
- 📄 **PDF Export**: Generate high-quality PDF invoices using html2pdf.js
- 💰 **Automatic Calculations**: Automatic total calculation and amount in words conversion
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Fast Performance**: Built with Next.js for optimal performance

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **PDF Generation**: html2pdf.js
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd invoice-generator
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

### Option 2: Deploy via GitHub

1. Push your code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically detect it's a Next.js project and deploy

### Option 3: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Upload your project folder
4. Vercel will automatically configure and deploy

## Usage

1. **Fill in Company Details**: Enter your company name, address, GSTIN, email, and mobile number
2. **Add Quotation Information**: Set quotation number, dates, arrival/departure dates, place of supply, and payment terms
3. **Enter Client Details**: Add bill-to information and client mobile number
4. **Add Items**: Describe services, set number of rooms, rate per room, and number of nights
5. **Add Notes and Terms**: Include any additional notes and terms & conditions
6. **Generate Invoice**: Click "Generate Invoice" to preview the formatted invoice
7. **Export PDF**: Click "Download PDF" to save the invoice as a PDF file

## Customization

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

## File Structure

```
invoice-generator/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── QuotationGenerator.tsx
├── public/
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the maintainers.
