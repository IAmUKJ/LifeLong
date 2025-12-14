# Where to Run Commands - LifeLong Project

## 📁 Project Structure
```
LifeLong/                    ← ROOT FOLDER (Main folder)
├── backend/                 ← Backend code (no package.json here)
├── frontend/                ← Frontend code (has its own package.json)
└── package.json             ← Root package.json (controls both)
```

---

## ✅ RECOMMENDED: Run from ROOT Folder (LifeLong)

**Navigate to the LifeLong folder first:**
```bash
cd "C:\Users\Utkarsh kumar jha\Desktop\LifeLong"
```

### Then run these commands:

#### 1. Install Dependencies (First Time Only)
```bash
npm run install-all
```
📍 **Location**: Run from `LifeLong` folder (root)

#### 2. Run Both Backend + Frontend Together
```bash
npm run dev
```
📍 **Location**: Run from `LifeLong` folder (root)

This will start:
- Backend on port 5000
- Frontend on port 3000

---

## 🔄 Alternative: Run Separately

### Option A: From ROOT Folder

**Run Backend only:**
```bash
npm run server
```
📍 **Location**: Run from `LifeLong` folder (root)

**Run Frontend only:**
```bash
npm run client
```
📍 **Location**: Run from `LifeLong` folder (root)

---

### Option B: From Individual Folders

**Run Backend only:**
```bash
cd backend
node server.js
```
📍 **Location**: Run from `backend` folder

**Run Frontend only:**
```bash
cd frontend
npm start
```
📍 **Location**: Run from `frontend` folder

---

## 📋 Quick Reference Table

| Command | Where to Run | What It Does |
|---------|-------------|--------------|
| `npm run install-all` | **LifeLong** (root) | Installs all dependencies |
| `npm run dev` | **LifeLong** (root) | Runs both backend + frontend |
| `npm run server` | **LifeLong** (root) | Runs backend only |
| `npm run client` | **LifeLong** (root) | Runs frontend only |
| `node server.js` | **backend** folder | Runs backend only |
| `npm start` | **frontend** folder | Runs frontend only |

---

## 🎯 Easiest Way (Recommended)

**Always run from the LifeLong root folder:**

1. Open terminal/command prompt
2. Navigate to: `cd "C:\Users\Utkarsh kumar jha\Desktop\LifeLong"`
3. Run: `npm run dev`

That's it! Both servers will start automatically.

---

## ⚠️ Important Notes

- **Backend doesn't have its own package.json** - it uses the root one
- **Frontend has its own package.json** - but you can control it from root too
- **All npm scripts in root package.json** are designed to be run from the root folder
- The root scripts automatically handle navigating to the correct folders

---

## 🔍 How to Check You're in the Right Folder

**Windows PowerShell:**
```powershell
pwd
# Should show: C:\Users\Utkarsh kumar jha\Desktop\LifeLong
```

**Check if package.json exists:**
```bash
ls package.json
# Should show the file
```

If you see `package.json` with scripts like `"dev"`, `"server"`, `"client"`, you're in the right place!

