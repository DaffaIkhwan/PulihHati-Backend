# 🚀 Deploy Backend ke Render - STEP BY STEP

## ✅ **Mengapa Render?**
- ✅ **GRATIS** untuk 750 jam/bulan
- ✅ **Mudah setup** - 5 menit
- ✅ **Auto-deploy** dari GitHub
- ✅ **Perfect untuk Node.js**
- ✅ **Built-in database** (PostgreSQL gratis)

## 📋 **LANGKAH DEMI LANGKAH**

### **Step 1: Buka Render**
1. Buka https://render.com
2. Klik "Get Started for Free"
3. Login dengan GitHub account

### **Step 2: Create Web Service**
1. Klik "New +" → "Web Service"
2. Connect GitHub repository "PulihHati-Backend"
3. Konfigurasi:
   ```
   Name: pulih-hati-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

### **Step 3: Environment Variables**
Tambahkan di Advanced settings:
```
NODE_ENV=production
JWT_SECRET=pulih-hati-super-secret-key-for-production-2024
JWT_EXPIRE=30d
```

### **Step 4: Deploy**
1. Klik "Create Web Service"
2. Tunggu build selesai (5-10 menit)
3. Anda akan dapat URL seperti: `https://pulih-hati-backend.onrender.com`

### **Step 5: Test Backend**
```bash
curl https://your-render-url.onrender.com/health
```

### **Step 6: Update Frontend**
Update file `.env`:
```
VITE_API_BASE_URL=https://your-render-url.onrender.com/api
```

## 🎯 **KEUNGGULAN RENDER**
- ✅ **Zero downtime** deploys
- ✅ **Auto SSL** certificates
- ✅ **Custom domains** support
- ✅ **Easy scaling**

## ⏱️ **Timeline**
- Setup: 3 menit
- Deploy: 5-10 menit
- Testing: 1 menit
- **Total: 9-14 menit**
