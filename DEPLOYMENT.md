# Railway Deployment Guide for ILES

This guide walks you through deploying the ILES application (Django backend + React frontend) on Railway for free demonstration purposes.

## Prerequisites

1. A [Railway account](https://railway.app) (sign up with GitHub)
2. Your code pushed to a GitHub repository
3. Basic understanding of environment variables

## Railway Free Tier

Railway offers **$5 free credit per month**, which is sufficient for demonstration purposes. Both services will be deployed on the same project.

## Deployment Steps

### 1. Push Your Code to GitHub

Make sure all changes are committed and pushed:

```bash
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

### 2. Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your ILES repository
5. Railway will detect your project structure

### 3. Deploy the Backend (Django)

#### Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically create a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically set

#### Configure Backend Service

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `chmod +x railway.sh && ./railway.sh`
   - **Start Command**: `gunicorn config.wsgi --bind 0.0.0.0:$PORT`

#### Set Environment Variables

In the backend service settings, add these variables:

```env
SECRET_KEY=your-very-secure-random-secret-key-here
DEBUG=False
ALLOWED_HOSTS=*.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend-url.railway.app
PYTHON_VERSION=3.11.0
```

**Important:**
- Generate a secure SECRET_KEY (use Django's `get_random_secret_key()` or a password generator)
- The `DATABASE_URL` is automatically provided by Railway when you add PostgreSQL
- Update `CORS_ALLOWED_ORIGINS` after deploying frontend (step 4)

#### Generate a Secret Key

Run this locally to generate a secure secret key:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 4. Deploy the Frontend (React)

#### Add Frontend Service

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo again
2. Configure the service:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`

#### Set Frontend Environment Variables

In the frontend service settings, add:

```env
VITE_API_URL=https://your-backend-url.railway.app/api/v1
```

**Note:** Replace `your-backend-url` with your actual backend Railway URL (found in backend service settings).

### 5. Update CORS Settings

After both services are deployed:

1. Copy your frontend URL from Railway (e.g., `https://iles-frontend.railway.app`)
2. Go to backend service settings
3. Update `CORS_ALLOWED_ORIGINS` environment variable:
   ```
   https://your-frontend-url.railway.app
   ```
4. The backend will automatically restart

### 6. Verify Deployment

1. Open your frontend URL
2. Try registering a new user
3. Test the login functionality
4. Verify all features work correctly

## Service URLs

After deployment, you'll have:

- **Backend API**: `https://iles-backend-xxx.railway.app`
- **Frontend**: `https://iles-frontend-xxx.railway.app`
- **PostgreSQL**: Internal Railway URL (automatically configured)

## Monitoring & Logs

- View logs in real-time from the Railway dashboard
- Monitor usage and credits in the project settings
- Set up notifications for deployment failures

## Cost Management

Railway free tier includes:
- **$5 free credit per month**
- Automatic sleep after inactivity (saves resources)
- Usage tracking in dashboard

**Estimated monthly usage for demo:**
- Backend: ~$2-3/month (with light traffic)
- Frontend: ~$1-2/month
- PostgreSQL: Included in backend cost

## Troubleshooting

### Backend Issues

**500 Error:**
- Check logs in Railway dashboard
- Verify all environment variables are set
- Ensure SECRET_KEY is set
- Check DATABASE_URL is present

**Database Connection Failed:**
- Verify PostgreSQL is added to project
- Check DATABASE_URL environment variable
- Ensure migrations ran successfully (check build logs)

**Static Files Not Loading:**
- Verify WhiteNoise is in MIDDLEWARE
- Check that `collectstatic` ran in build script
- Review build logs for errors

### Frontend Issues

**API Calls Failing:**
- Verify VITE_API_URL points to correct backend URL
- Check CORS settings in backend
- Ensure backend is running (check Railway dashboard)

**Build Fails:**
- Check Node.js version compatibility
- Verify all dependencies are in package.json
- Review build logs in Railway

### CORS Errors

If you see CORS errors in browser console:
1. Verify backend `CORS_ALLOWED_ORIGINS` includes your frontend URL
2. Ensure no trailing slashes in URLs
3. Check that `corsheaders` middleware is properly configured
4. Restart backend service after updating environment variables

## Alternative: Deploy with One Command

You can also use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy backend
cd backend
railway up

# Deploy frontend
cd ../frontend
railway up
```

## Updating Your Deployment

To update after making changes:

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. Railway automatically redeploys on push (if auto-deploy is enabled)

Or manually trigger deployment:
- Go to Railway dashboard
- Click on service → **"Deploy"** → **"Redeploy"**

## Security Best Practices

1. ✅ Never commit `.env` files to Git
2. ✅ Use strong SECRET_KEY in production
3. ✅ Keep DEBUG=False in production
4. ✅ Regularly update dependencies
5. ✅ Monitor Railway usage to avoid surprise charges
6. ✅ Set up proper CORS origins (don't use wildcards)

## Next Steps

After successful deployment:

1. **Custom Domain** (Optional): Add a custom domain in Railway settings
2. **Monitoring**: Set up error tracking (Sentry, Rollbar)
3. **Backups**: Railway provides automatic database backups
4. **CI/CD**: Railway auto-deploys on git push (enabled by default)

## Support

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Django Docs**: https://docs.djangoproject.com

## Cleanup

To remove the deployment:

1. Go to Railway dashboard
2. Select your project
3. Click **"Settings"** → **"Delete Project"**

---

**Happy Deploying! 🚀**
