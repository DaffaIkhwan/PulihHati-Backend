# 🚀 Frontend Setup Guide untuk Profile Component

## Masalah yang Ditemukan
- Profile component ada di backend project
- Tidak ada frontend project structure
- Import Navbar dan routing tidak tersedia

## Solusi: Setup Frontend Project

### 1. Buat Frontend Project Baru
```bash
# Di folder terpisah dari backend
npx create-react-app pulih-hati-frontend
cd pulih-hati-frontend

# Install dependencies yang diperlukan
npm install react-router-dom lucide-react axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Setup Tailwind CSS
Edit `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Edit `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Struktur Folder Frontend
```
pulih-hati-frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Profile.jsx
│   │   ├── MoodTracker.jsx
│   │   └── ...
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── SignIn.jsx
│   │   └── ...
│   ├── App.js
│   ├── index.js
│   └── ...
├── public/
└── package.json
```

### 4. Buat Component Navbar
File: `src/components/Navbar.jsx`

### 5. Setup Router
File: `src/App.js`

### 6. Copy Profile Component
Copy `Profile-clean.jsx` ke `src/components/Profile.jsx`

### 7. Test Profile Page
- Start backend: `npm start` (di folder backend)
- Start frontend: `npm start` (di folder frontend)
- Akses: `http://localhost:3000/profile`

## Quick Fix: Buat Navbar Component

Jika ingin test Profile component langsung, buat file Navbar.jsx sederhana.
