# Quick Render Deployment Guide

## 🚀 **Why Render Instead of Vercel?**

Vercel is experiencing persistent `FUNCTION_INVOCATION_FAILED` errors. Render is:
- ✅ **More reliable** for Node.js/Express apps
- ✅ **Free tier** available
- ✅ **No serverless complexity** - runs as regular Node.js app
- ✅ **Better for database connections**

## 📋 **Quick Setup Steps**

### **1. Go to Render.com**
1. Visit [render.com](https://render.com)
2. Sign up with GitHub account
3. Connect your GitHub repository

### **2. Create Web Service**
1. Click "New +" → "Web Service"
2. Select your `PulihHati-Backend` repository
3. Configure:
   - **Name**: `pulih-hati-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### **3. Environment Variables**
Add these in Render dashboard:
```
NODE_ENV=production
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=30d

# Database (if you have one)
PG_HOST=your-db-host
PG_PORT=5432
PG_DATABASE=your-db-name
PG_USER=your-db-user
PG_PASSWORD=your-db-password
```

### **4. Deploy**
- Render will automatically deploy
- You'll get a URL like: `https://pulih-hati-backend.onrender.com`

### **5. Update Frontend**
Update `.env` file:
```bash
# Use Render backend
VITE_API_BASE_URL=https://pulih-hati-backend.onrender.com/api
```

## 🎯 **Expected Result**
- ✅ Working API endpoints
- ✅ No FUNCTION_INVOCATION_FAILED errors
- ✅ Reliable deployment
- ✅ Easy to manage

## 🔧 **No Code Changes Needed**
The existing backend code will work perfectly with Render without any modifications.

## ⏱️ **Timeline**
- Setup: 5-10 minutes
- First deployment: 5-10 minutes
- Total: ~15 minutes

This should resolve all the Vercel deployment issues permanently.
