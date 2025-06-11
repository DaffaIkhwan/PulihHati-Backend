# Environment Variables untuk Render Deployment

## 🔧 **Environment Variables yang Diperlukan**

Saat setup di Render.com, tambahkan environment variables berikut:

### **1. Basic Configuration**
```
NODE_ENV = production
PORT = 10000
```

### **2. JWT Configuration**
```
JWT_SECRET = your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE = 30d
```

### **3. Database Configuration (Jika Menggunakan Database)**
```
PG_HOST = your-database-host
PG_PORT = 5432
PG_DATABASE = your-database-name
PG_USER = your-database-user
PG_PASSWORD = your-database-password
```

### **4. Cloudinary Configuration (Jika Menggunakan Upload Gambar)**
```
CLOUDINARY_CLOUD_NAME = your-cloudinary-cloud-name
CLOUDINARY_API_KEY = your-cloudinary-api-key
CLOUDINARY_API_SECRET = your-cloudinary-api-secret
```

## 📝 **Cara Menambahkan di Render:**

1. **Saat Setup Awal:**
   - Klik "Advanced" saat membuat web service
   - Tambahkan satu per satu environment variable

2. **Setelah Deploy:**
   - Masuk ke dashboard service Anda
   - Klik tab "Environment"
   - Klik "Add Environment Variable"
   - Masukkan key dan value
   - Klik "Save Changes"

## ⚠️ **Penting:**
- **JWT_SECRET** harus berupa string yang panjang dan random
- Jangan gunakan spasi dalam nilai environment variables
- Setelah menambah/mengubah env vars, service akan restart otomatis

## 🎯 **Minimal Setup untuk Testing:**
Untuk testing awal, cukup tambahkan:
```
NODE_ENV = production
JWT_SECRET = pulih-hati-super-secret-key-for-development-only
PORT = 10000
```

Database dan Cloudinary bisa ditambahkan nanti sesuai kebutuhan.
