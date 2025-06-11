# 🚀 Deploy Backend ke Railway - STEP BY STEP

## ✅ **Mengapa Railway?**
- ✅ **GRATIS** sampai $5/bulan usage
- ✅ **Mudah setup** - hanya 5 menit
- ✅ **Auto-deploy** dari GitHub
- ✅ **Perfect untuk Express.js**
- ✅ **Built-in database** (PostgreSQL gratis)
- ✅ **No serverless complexity**

## 📋 **LANGKAH DEMI LANGKAH**

### **Step 1: Buka Railway**
1. Buka https://railway.app
2. Klik "Start a New Project"
3. Login dengan GitHub account

### **Step 2: Deploy from GitHub**
1. Pilih "Deploy from GitHub repo"
2. Pilih repository "PulihHati-Backend"
3. Klik "Deploy Now"

### **Step 3: Konfigurasi Environment Variables**
Setelah deploy, tambahkan environment variables:
```
NODE_ENV=production
JWT_SECRET=pulih-hati-super-secret-key-for-production-2024
JWT_EXPIRE=30d
PORT=3000
```

### **Step 4: Tunggu Deploy Selesai**
- Railway akan build otomatis (3-5 menit)
- Anda akan dapat URL seperti: `https://pulih-hati-backend-production.up.railway.app`

### **Step 5: Test Backend**
```bash
curl https://your-railway-url.up.railway.app/health
```

### **Step 6: Update Frontend**
Update file `.env`:
```
VITE_API_BASE_URL=https://your-railway-url.up.railway.app/api
```

## 🎯 **KEUNGGULAN RAILWAY**
- ✅ **Zero configuration** - langsung jalan
- ✅ **Persistent storage** - tidak seperti serverless
- ✅ **Real-time logs** - mudah debug
- ✅ **Custom domains** - bisa pakai domain sendiri
- ✅ **Auto SSL** - HTTPS otomatis

## ⏱️ **Timeline**
- Setup: 2 menit
- Deploy: 3-5 menit
- Testing: 1 menit
- **Total: 6-8 menit**

## 🔧 **Tidak Perlu Ubah Code**
Backend Anda sudah siap deploy ke Railway tanpa perubahan code apapun!
