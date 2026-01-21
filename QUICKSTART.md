# PBL by GyanSetu - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables

#### Option A: Use Local MongoDB (Easiest for Testing)

1. Install MongoDB locally or use MongoDB Atlas (free tier)
2. The `.env` file in `server/` is already configured for local MongoDB
3. If using local MongoDB, make sure it's running on port 27017

#### Option B: Use MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Open `server/.env` and replace the `MONGODB_URI` line:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pbl_db?retryWrites=true&w=majority
   ```

#### Configure Cloudinary (Optional - for file uploads)

1. Go to [Cloudinary](https://cloudinary.com)
2. Create a free account
3. From the dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret
4. Update `server/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Step 3: Start the Application

#### Terminal 1 - Backend Server
```bash
cd server
npm run dev
```

You should see:
```
✅ MongoDB Connected: ...
✅ Cloudinary Connected (if configured)
🚀 Server running on port 5000
📚 PBL by GyanSetu API ready!
```

#### Terminal 2 - Frontend Client
```bash
cd client
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

### Step 4: Test the Application

1. Open your browser to `http://localhost:3000`
2. Click "Register here"
3. Create a Teacher account:
   - Name: Test Teacher
   - Email: teacher@test.com
   - Password: password123
   - Role: Teacher
4. You should be redirected to the Teacher Dashboard!

---

## 🧪 Testing the Connection

### Test 1: Registration & Login

**Register a Teacher:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Teacher",
    "email": "teacher@example.com",
    "password": "password123",
    "role": "Teacher"
  }'
```

**Register a Student:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Student",
    "email": "student@example.com",
    "password": "password123",
    "role": "Student"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
```

Copy the `token` from the response for the next tests.

### Test 2: Create a Project (Teacher Only)

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Web Development Project",
    "description": "Build a full-stack web application",
    "deadline": "2024-12-31"
  }'
```

### Test 3: Get Projects

```bash
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Troubleshooting

### Backend won't start

**Error: "Cannot find module"**
```bash
cd server
npm install
```

**Error: "MongoDB connection failed"**
- Check your MongoDB URI in `server/.env`
- Make sure MongoDB is running (if using local)
- Check your network connection (if using Atlas)
- Whitelist your IP in MongoDB Atlas

**Error: "Port 5000 already in use"**
- Change PORT in `server/.env` to 5001
- Update `VITE_API_URL` in `client/.env` to `http://localhost:5001`

### Frontend won't start

**Error: "Cannot find module"**
```bash
cd client
npm install
```

**Error: "Failed to fetch"**
- Make sure backend is running on port 5000
- Check `VITE_API_URL` in `client/.env`
- Check browser console for CORS errors

### CORS Errors

If you see CORS errors in the browser console, the backend is already configured to allow all origins in development mode. If issues persist:

1. Check that backend is running
2. Verify the API URL in `client/.env`
3. Clear browser cache and reload

---

## 📱 Using the Application

### As a Teacher:

1. **Register/Login** as Teacher
2. **Create Projects** from the dashboard
3. **Add Tasks** to projects (coming soon - Kanban board)
4. **Assign Students** to projects
5. **View Analytics** to monitor student activity

### As a Student:

1. **Register/Login** as Student
2. **View Assigned Tasks** on your dashboard
3. **Upload Evidence** (photos/videos) for tasks
4. **Link GitHub Repos** to show your code
5. **Track Progress** on your projects

---

## 🎯 Next Steps

Once you have the basic connection working:

1. ✅ Test registration and login
2. ✅ Create a project as a teacher
3. ⏳ Implement Kanban board (see `next_steps.md`)
4. ⏳ Add file upload UI
5. ⏳ Build GitHub integration UI
6. ⏳ Create analytics dashboard

---

## 📚 Useful Commands

```bash
# Start both frontend and backend (from root)
npm run dev

# Start only backend
npm run server

# Start only frontend
npm run client

# Install all dependencies
npm run install-all

# Build frontend for production
cd client && npm run build
```

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the console output for error messages
2. Verify all environment variables are set correctly
3. Make sure all dependencies are installed
4. Check that MongoDB is accessible
5. Review the error messages - they usually tell you what's wrong!

---

## ✅ Success Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Dashboard loads after login
- [ ] Can logout and login again

Once all these are checked, you're ready to build the remaining features! 🚀
