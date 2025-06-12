# PulihHati Backend API

PulihHati adalah RESTful API untuk aplikasi kesehatan mental berbasis web. Backend dibangun dengan Express.js dan menggunakan PostgreSQL sebagai basis data utama.

## 🚀 Fitur Utama

- Autentikasi dan manajemen pengguna
- SafeSpace: Postingan, komentar, likes, dan bookmarks
- Pelacakan mood harian
- Chatbot konsultasi berbasis AI
- Sistem notifikasi
- Upload avatar dan statistik profil
- Dokumentasi API menggunakan Swagger

---

## 🛠️ Cara Menjalankan Server Lokal

### 1. Clone Repositori
```bash
git clone https://github.com/DaffaIkhwan/PulihHati-Backend.git
cd PulihHati-Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Buat File `.env`
Contoh isi file `.env`:

```
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/pulihhati
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
```

### 4. Jalankan Server
Untuk development (otomatis restart saat file diubah):
```bash
npm run dev
```

Untuk production:
```bash
npm start
```

---

## 📖 Dokumentasi API (Swagger)

Swagger UI tersedia di route berikut:

```
http://localhost:5000/api-docs
```

Pastikan kamu sudah meletakkan file Swagger YAML di `docs/swagger.yaml`, dan di `server.js` sudah ditambahkan middleware berikut:

```js
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./docs/swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

---

## 🧪 Testing

Untuk menjalankan unit test:
```bash
npm test
```

---

## 📂 Struktur Direktori Utama

```
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── docs/                # Swagger documentation (YAML)
├── server.js
└── .env.example
```

---

## 🤝 Kontribusi

Kontribusi terbuka untuk siapa saja. Jangan lupa buat branch baru dan pull request bila ingin menambahkan fitur atau memperbaiki bug.

```
git checkout -b fitur-baru
```

---

## 📝 Lisensi

MIT License © 2025 PulihHati Team
