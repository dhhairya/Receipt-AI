# 📄 ReceiptAI — Smart Payment Receipt Generator

> AI-powered receipt generator with drag-and-drop field positioning, signature management, and instant PDF/JPG export.

![License](https://img.shields.io/badge/license-MIT-7c6bc4)
![HTML](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)

---

## ✨ Features

- **🧾 Template Upload** — Upload any blank receipt/voucher image (JPG, PNG)
- **🔍 Smart Field Detection** — Auto-detects common receipt fields (Name, Amount, Date, Receipt No., Mobile, Purpose) with English & Hindi labels
- **✍️ Signature Manager** — Upload, store, and select multiple signatures
- **🖱️ Drag & Drop** — Reposition field values and signatures directly on the receipt preview (mouse + touch support)
- **💰 Auto Amount-to-Words** — Converts numeric amounts to Indian-style words (Lakh, Crore, Paise)
- **📥 Export** — Download completed receipts as JPG or PDF
- **📚 Record Keeping** — Save, search, and browse generated receipts locally
- **📱 Responsive** — Works on desktop, tablet, and mobile devices
- **🎨 Beautiful UI** — Pastel glassmorphism design with smooth animations

## 🚀 Quick Start

### Option 1: Open Locally
Simply open `index.html` in any modern browser — no server required!

### Option 2: Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SrishtiRai03/receipt-ai)

### Option 3: Deploy to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/SrishtiRai03/receipt-ai)

### Option 4: GitHub Pages
1. Go to repo **Settings** → **Pages**
2. Set source to **Deploy from a branch**
3. Select `main` branch, root `/`
4. Click Save — your site will be live at `https://SrishtiRai03.github.io/receipt-ai/`

## 📁 Project Structure

```
receipt-ai/
├── index.html          # Main application page
├── css/
│   └── styles.css      # Design system & all styles
├── js/
│   └── app.js          # Application logic
├── assets/
│   └── favicon.svg     # App favicon
├── vercel.json         # Vercel deployment config
├── netlify.toml        # Netlify deployment config
├── .gitignore
├── LICENSE
└── README.md
```

## 🔧 How It Works

1. **Upload** a blank receipt template image
2. **AI Detection** automatically identifies and places 7 common fields
3. **Fill in** the form — amount auto-converts to words
4. **Drag** field labels and signature to precise positions on the receipt
5. **Select** a signature from your signature library
6. **Download** as JPG or PDF, or save to local records

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 semantic markup |
| Styling | Vanilla CSS with custom properties |
| Logic | Vanilla JavaScript (ES6+) |
| PDF Export | [jsPDF](https://github.com/parallax/jsPDF) via CDN |
| Fonts | Google Fonts (Playfair Display, DM Sans) |
| Storage | Browser localStorage |

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

Built with ❤️ by [SrishtiRai03](https://github.com/SrishtiRai03)
