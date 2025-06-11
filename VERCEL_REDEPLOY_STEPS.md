# Vercel Re-deployment Steps

## 🔧 **Files Updated**

✅ **vercel.json** - Simplified configuration
✅ **api/index.js** - Serverless entry point  
✅ **api/test.js** - Simple test endpoint

## 🚀 **Re-deployment Steps**

### **1. Push Changes to GitHub**
```bash
cd PulihHati-Backend
git add .
git commit -m "Fix Vercel configuration"
git push origin main
```

### **2. Trigger Re-deployment**

#### **Option A: Automatic (Recommended)**
- Vercel will auto-deploy when you push to GitHub
- Check Vercel dashboard for deployment status

#### **Option B: Manual via Vercel CLI**
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy
vercel --prod
```

#### **Option C: Manual via Dashboard**
1. Go to Vercel Dashboard
2. Find your project
3. Click "Deployments" tab
4. Click "Redeploy" on latest deployment

### **3. Test Endpoints After Deployment**

#### **Test Simple Endpoint:**
```bash
curl https://pulih-hati-backend.vercel.app/api/test
```
**Expected Response:**
```json
{
  "message": "Vercel backend is working!",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "method": "GET",
  "url": "/api/test"
}
```

#### **Test Health Endpoint:**
```bash
curl https://pulih-hati-backend.vercel.app/health
```

#### **Test API Endpoint:**
```bash
curl https://pulih-hati-backend.vercel.app/api
```

## 🎯 **Expected Results**

After successful deployment:
- ✅ **Test endpoint** returns JSON response
- ✅ **Health endpoint** works
- ✅ **API endpoints** accessible
- ✅ **No more 404 errors**

## 🔍 **Troubleshooting**

### **If Still Getting 404:**

1. **Check Vercel Build Logs:**
   - Go to Vercel Dashboard
   - Click on your project
   - Check "Functions" tab for errors

2. **Check Environment Variables:**
   - Ensure all required env vars are set
   - Especially database connection variables

3. **Try Alternative URL Structure:**
   ```bash
   # Try these URLs:
   https://pulih-hati-backend.vercel.app/api/test
   https://pulih-hati-backend.vercel.app/api/index
   https://pulih-hati-backend.vercel.app/
   ```

### **If Build Fails:**

1. **Check package.json:**
   ```json
   {
     "engines": {
       "node": "18.x"
     }
   }
   ```

2. **Check dependencies:**
   - Ensure all dependencies are in package.json
   - No missing modules

## 📱 **Update Frontend After Success**

Once backend is working:

```bash
# Update .env
VITE_API_BASE_URL=https://pulih-hati-backend.vercel.app/api

# Restart frontend
npm run dev
```

## 🚨 **Backup Plan**

If Vercel still doesn't work after this:

### **Option 1: Use Render (Free & Easy)**
1. Go to render.com
2. Deploy from GitHub
3. Get URL like: `https://pulih-hati-backend.onrender.com`

### **Option 2: Use Railway**
1. Go to railway.app  
2. Deploy from GitHub
3. Get URL like: `https://pulih-hati-backend.up.railway.app`

### **Option 3: Use Localhost**
```bash
# Keep using local development
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📞 **Next Steps**

1. **✅ Push changes** to GitHub
2. **⏱️ Wait for deployment** (2-5 minutes)
3. **🧪 Test endpoints** with curl
4. **🔄 Update frontend** if working
5. **🎉 Celebrate** when it works!

## 🔗 **Quick Test Commands**

```bash
# Test after deployment
curl https://pulih-hati-backend.vercel.app/api/test

# If working, update frontend:
# In PulihHati-Frontend/.env:
VITE_API_BASE_URL=https://pulih-hati-backend.vercel.app/api
```
