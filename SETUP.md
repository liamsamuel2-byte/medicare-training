# Medicare Training Portal — Setup & Deployment Guide

## Step 1: Set Up the Database (Neon — Free)

1. Go to https://neon.tech and create a free account
2. Create a new project (name it "medicare-training")
3. Copy the **Connection string** (looks like `postgresql://user:pass@host/db?sslmode=require`)
4. Save it — you'll need it in Step 3

## Step 2: Set Up Video Storage (Cloudinary — Free)

1. Go to https://cloudinary.com and create a free account
2. From your Dashboard, copy:
   - **Cloud name**
   - **API Key**
   - **API Secret**

## Step 3: Set Up Vercel (Free Hosting)

1. Go to https://github.com and create a new repository called `medicare-training`
2. In your project folder, run:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/medicare-training.git
   git push -u origin main
   ```
3. Go to https://vercel.com and sign in with GitHub
4. Click **"Add New Project"** → import your `medicare-training` repo
5. Under **Environment Variables**, add these before deploying:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string from Step 1 |
   | `NEXTAUTH_SECRET` | Any random 32+ character string (generate at https://generate-secret.vercel.app/32) |
   | `NEXTAUTH_URL` | Your Vercel URL (e.g. `https://medicare-training.vercel.app`) — you can update this after first deploy |
   | `CLOUDINARY_CLOUD_NAME` | From Step 2 |
   | `CLOUDINARY_API_KEY` | From Step 2 |
   | `CLOUDINARY_API_SECRET` | From Step 2 |

6. Click **Deploy**

## Step 4: Set Up the Database Tables

After deploy, run these commands from your local project folder with the DATABASE_URL set in your `.env`:

```bash
# Push the schema to your Neon database
npm run db:push

# Create the first admin and manager accounts
npm run db:seed
```

This creates:
- **Admin:** admin@company.com / admin123
- **Manager:** manager@company.com / manager123

**Change these passwords immediately after first login** (go to Admin → Users).

## Step 5: Add the Correct NEXTAUTH_URL

After Vercel gives you a URL (like `https://medicare-training-abc123.vercel.app`):
1. Go to Vercel → your project → Settings → Environment Variables
2. Update `NEXTAUTH_URL` to your actual URL
3. Redeploy (Vercel → Deployments → click the three dots → Redeploy)

---

## How to Use the Portal

### As a Manager
- Log in at your Vercel URL
- You'll land on the **Admin Dashboard** automatically
- Go to **Projects** to create your first course (e.g. "Medicare 101")
- Add chapters, upload videos, write quizzes
- Drag chapters to reorder them
- Go to **Users** to create agent accounts
- Go to **Reports** to see quiz scores

### As an Agent
- Log in at your Vercel URL
- You'll see all available training courses
- Chapters unlock one at a time — must watch full video before quiz
- Scores are saved automatically

### Sharing a Specific Project
Each project has a unique link like `https://yourapp.vercel.app/train/TOKEN`
- Copy this from the project page in admin
- Send via email — agents log in and go straight to that course

---

## Adding New Training Courses Later
1. Admin → Projects → New Project
2. Add chapters and upload videos
3. Share the unique `/train/TOKEN` link
