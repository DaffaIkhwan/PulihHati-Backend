# Render Deployment Guide - Free Alternative

## 🚀 **Why Render?**

Render is the easiest free alternative to Vercel for backend APIs:
- ✅ **Completely FREE** for basic usage
- ✅ **No configuration files** needed
- ✅ **Automatic HTTPS** domains
- ✅ **PostgreSQL database** available
- ✅ **GitHub integration**
- ✅ **No credit card** required

## 📋 **Super Simple Deployment**

### **1. Deploy Backend to Render**

1. **Go to [render.com](https://render.com)**
2. **Sign up** with GitHub account
3. **Click "New +"** → "Web Service"
4. **Connect GitHub repository** (PulihHati-Backend)
5. **Configure deployment:**
   ```
   Name: pulih-hati-backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```
6. **Click "Create Web Service"**

### **2. Add PostgreSQL Database**

1. **In Render dashboard**, click "New +" → "PostgreSQL"
2. **Configure database:**
   ```
   Name: pulih-hati-db
   Database: pulih_hati
   User: pulih_hati_user
   ```
3. **Click "Create Database"**

### **3. Configure Environment Variables**

In your web service → Environment tab:

```bash
# Database (copy from PostgreSQL service)
DATABASE_URL=postgresql://user:pass@host:port/db

# Or individual variables:
PG_HOST=your-render-db-host
PG_PORT=5432
PG_DATABASE=pulih_hati
PG_USER=pulih_hati_user
PG_PASSWORD=your-generated-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d

# Node Environment
NODE_ENV=production
```

### **4. Update Frontend**

After deployment, Render gives you URL like:
`https://pulih-hati-backend.onrender.com`

Update frontend `.env`:
```bash
# Use Render backend
VITE_API_BASE_URL=https://pulih-hati-backend.onrender.com/api
```

## 🔧 **No Code Changes Needed!**

Your existing backend code works perfectly with Render:
- ✅ **package.json** already correct
- ✅ **server.js** already compatible
- ✅ **Environment variables** work as-is
- ✅ **Database connection** works automatically

## 🧪 **Testing Render Deployment**

After deployment (takes ~5 minutes):

```bash
# Test health endpoint
curl https://pulih-hati-backend.onrender.com/health

# Should return JSON response
```

## 💰 **Render Pricing**

- **Free Tier**: 
  - 750 hours/month (enough for development)
  - Automatic sleep after 15 minutes of inactivity
  - Wakes up automatically on request
- **Paid Plans**: Start at $7/month for always-on

## ⚡ **Quick Start (5 Minutes)**

1. **Go to render.com** → Sign up with GitHub
2. **New Web Service** → Connect your backend repo
3. **New PostgreSQL** → Create database
4. **Copy database URL** → Add to web service environment
5. **Add JWT_SECRET** environment variable
6. **Deploy!**

## 🎯 **Expected Timeline**

- **Setup**: 2 minutes
- **Deployment**: 3-5 minutes
- **Testing**: 1 minute
- **Frontend update**: 30 seconds

**Total: ~10 minutes to working backend!**

## 🔄 **Migration Steps**

### **From Localhost to Render:**

1. **Deploy backend** to Render (5 minutes)
2. **Get Render URL** (e.g., `https://pulih-hati-backend.onrender.com`)
3. **Update frontend** `.env`:
   ```bash
   VITE_API_BASE_URL=https://pulih-hati-backend.onrender.com/api
   ```
4. **Restart frontend** development server
5. **Test all features**

## 🎉 **Success Indicators**

You'll know it's working when:
- ✅ **Render dashboard** shows "Live" status
- ✅ **Health endpoint** returns JSON
- ✅ **Frontend backend status** shows green
- ✅ **Login/register** works
- ✅ **All API calls** successful

## 🚨 **Important Notes**

### **Free Tier Limitations:**
- **Sleeps after 15 minutes** of inactivity
- **Cold start** takes ~30 seconds to wake up
- **Perfect for development** and testing

### **Database:**
- **PostgreSQL included** in free tier
- **Automatic backups**
- **Connection pooling** handled automatically

## 📞 **Recommended Action**

**Try Render immediately** - it's the fastest solution:

1. **Go to render.com** right now
2. **Deploy in 5 minutes**
3. **Update frontend** with new URL
4. **Test everything**

This will solve your deployment issue immediately while keeping the flexible configuration system we built!

## 🔗 **Useful Links**

- [Render.com](https://render.com)
- [Render Node.js Guide](https://render.com/docs/node-express-app)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
