# Vercel Deployment Guide for PulihHati Backend

## 🚀 Quick Deployment Steps

### 1. **Prepare Backend for Vercel**

✅ **Files Added/Modified:**
- `vercel.json` - Vercel configuration (simplified)
- `config/db-vercel.js` - Simplified database config for serverless
- `server.js` - Updated for Vercel compatibility
- `test-vercel-deployment.cjs` - Deployment testing script

### 2. **Deploy to Vercel**

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from backend directory
cd PulihHati-Backend
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? [your-username]
# - Link to existing project? N
# - Project name: pulih-hati-backend
# - Directory: ./
# - Override settings? N
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `PulihHati-Backend` folder
5. Click "Deploy"

### 3. **Configure Environment Variables**

In Vercel Dashboard → Project Settings → Environment Variables, add:

```bash
# Database Configuration
PG_HOST=your-database-host
PG_PORT=5432
PG_DATABASE=your-database-name
PG_USER=your-database-user
PG_PASSWORD=your-database-password

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=30d

# Cloudinary Configuration (if using)
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Node Environment
NODE_ENV=production
```

### 4. **Update Frontend Configuration**

After successful deployment, update frontend `.env`:

```bash
# Use the deployed backend URL
VITE_API_BASE_URL=https://pulih-hati-backend.vercel.app/api
```

## 🔧 Vercel Configuration Explained

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/health",
      "dest": "/api/index.js"
    },
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

### `api/index.js`
```javascript
// Vercel API entry point
const app = require('../app');
module.exports = app;
```

## 🧪 Testing Deployment

After deployment, test these endpoints:

```bash
# Health check
curl https://pulih-hati-backend.vercel.app/health

# API endpoints
curl https://pulih-hati-backend.vercel.app/api/auth/health
```

## 🐛 Common Issues & Solutions

### Issue 1: 404 Not Found
**Cause:** Missing `vercel.json` or incorrect routing
**Solution:** Ensure `vercel.json` exists with correct routes

### Issue 2: Environment Variables Not Working
**Cause:** Variables not set in Vercel dashboard
**Solution:** Add all required env vars in Vercel project settings

### Issue 3: Database Connection Failed
**Cause:** Database not accessible from Vercel
**Solution:** 
- Use cloud database (PostgreSQL on Railway, Supabase, etc.)
- Ensure database allows external connections
- Check connection string format

### Issue 4: Function Timeout
**Cause:** Database queries taking too long
**Solution:** 
- Optimize database queries
- Increase function timeout in `vercel.json`
- Use connection pooling

## 📋 Deployment Checklist

- [ ] `vercel.json` configuration file created
- [ ] `api/index.js` entry point created
- [ ] Environment variables configured in Vercel
- [ ] Database accessible from Vercel
- [ ] CORS configured for frontend domain
- [ ] Health endpoint responding
- [ ] API endpoints working
- [ ] Frontend updated with new backend URL

## 🔗 Useful Commands

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs [deployment-url]

# Remove deployment
vercel rm [project-name]

# Set environment variable
vercel env add [VAR_NAME]
```

## 📞 Next Steps

1. **Deploy backend** using steps above
2. **Test all endpoints** to ensure they work
3. **Update frontend** with new backend URL
4. **Test full application** end-to-end
5. **Monitor logs** for any issues

## 🌐 Alternative Deployment Options

If Vercel doesn't work well:
- **Railway**: Great for Node.js + PostgreSQL
- **Render**: Free tier with good database support
- **Heroku**: Classic PaaS (paid plans only now)
- **DigitalOcean App Platform**: Simple deployment
