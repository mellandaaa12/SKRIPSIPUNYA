# 🎓 EduLearn LMS - Learning Management System

**Platform Media Pembelajaran dengan Progressive Learning & Project-Based Learning (PJBL)**

[![Status](https://img.shields.io/badge/status-production--ready-success)]()
[![Backend](https://img.shields.io/badge/backend-supabase-green)]()
[![Frontend](https://img.shields.io/badge/frontend-react-blue)]()
[![TypeScript](https://img.shields.io/badge/typescript-5.0-blue)]()

---

## 🎯 Overview

EduLearn adalah platform Learning Management System (LMS) yang dirancang khusus untuk pembelajaran berbasis proyek dengan sistem Progressive Learning dan monitoring manual oleh guru.

### ✨ Key Features

#### **1. Progressive Learning (Materi)**
- 📚 Step-by-step content (Baca → Quiz → Repeat)
- ✅ Auto-grading quiz dengan instant feedback
- 🎯 Sequential learning path
- 📊 Progress tracking per siswa

#### **2. Project-Based Learning (PJBL - 8 Sintaks)**
1. 🎯 Orientasi Pada Masalah
2. 👥 Pembagian Kelompok
3. 📋 Mengorganisir Siswa
4. 🔍 Membimbing Penyelidikan
5. 📝 Membuat Laporan
6. 💡 Mempresentasikan
7. ✍️ Mengevaluasi
8. 🏆 Submit Akhir

#### **3. Role-Based System**
- 👨‍💼 **Admin** - Kelola pengguna, kelas, sistem
- 👨‍🏫 **Guru** - Buat materi, monitor progress, beri nilai
- 👨‍🎓 **Siswa** - Belajar materi, kerjakan project, submit tugas

#### **4. Advanced Features**
- 🌙 Dark Mode
- 🌍 Multi-language (Indonesian/English)
- 🔊 Sound Effects
- 📱 Responsive Design (1440x1024px optimized)
- 🔒 Role-based Access Control (RLS)
- 💾 Real-time Data Sync

---

## 🚀 Quick Start

### **⚡ 5-Minute Setup**

1. **Deploy Backend**
   ```bash
   # See QUICK_START.md for detailed instructions
   supabase functions deploy server --no-verify-jwt
   ```

2. **Bootstrap Admin**
   ```javascript
   // Run in browser console or use /BOOTSTRAP_ADMIN.html
   fetch('https://tjfmwixttmrayvhqhena.supabase.co/functions/v1/server/bootstrap/admin', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       name: 'Administrator',
       email: 'admin@sekolah.com',
       password: 'admin123456'
     })
   }).then(r => r.json()).then(console.log);
   ```

3. **Login & Start**
   - Go to `/login`
   - Email: `admin@sekolah.com`
   - Password: `admin123456`
   - ✅ Dashboard ready!

**📖 Full setup guide:** See `/QUICK_START.md`

---

## 📁 Project Structure

```
/
├── src/app/
│   ├── components/        # React components
│   │   ├── SideBarAdmin.tsx
│   │   ├── SideBarGuru.tsx
│   │   ├── SideBarMurid.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── ...
│   ├── context/          # React Context (Auth, Settings)
│   │   ├── AuthContext.tsx
│   │   └── SettingsContext.tsx
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx         # Siswa
│   │   ├── DashboardAdmin.tsx
│   │   ├── DashboardGuru.tsx
│   │   ├── Pembelajaran.tsx
│   │   ├── ProgressiveLearning.tsx
│   │   ├── DaftarProject.tsx
│   │   └── ...
│   ├── utils/            # Utilities
│   │   ├── api.ts        # API calls
│   │   └── supabase.ts   # Supabase client
│   ├── routes.tsx        # React Router config
│   └── App.tsx           # Root component
│
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx      # Main backend
│           └── kv_store.tsx   # KV storage
│
├── public/              # Static assets
├── imports/            # Figma imported assets
│
└── Documentation/
    ├── QUICK_START.md
    ├── DEPLOY_VIA_DASHBOARD.md
    ├── JWT_FIX_COMPLETE.md
    ├── LOGIN_TEST_GUIDE.md
    └── ...
```

---

## 🛠️ Tech Stack

### **Frontend**
- ⚛️ React 18 + TypeScript
- 🎨 Tailwind CSS v4
- 🚦 React Router v7 (Data Mode)
- 🎬 Motion (Framer Motion fork)
- 🔔 Sonner (Toast notifications)
- 🎯 Lucide React (Icons)

### **Backend**
- 🚀 Supabase Edge Functions (Deno)
- 🗄️ PostgreSQL (Supabase)
- 🔐 Supabase Auth (JWT)
- 💾 KV Store (Deno)
- 🌐 Hono Framework

### **Development**
- 📦 Vite
- 🔨 TypeScript
- 🎨 PostCSS
- 📝 ESLint

---

## 📚 Documentation

### **Setup & Deployment**
- 📖 [Quick Start Guide](QUICK_START.md)
- 🚀 [Deploy via Dashboard](DEPLOY_VIA_DASHBOARD.md)
- 💻 [Deploy via CLI](DEPLOY_FUNCTION_FIX.md)
- 🔧 [Deploy Scripts](deploy.sh) (Bash) / [deploy.ps1](deploy.ps1) (PowerShell)

### **Authentication & Security**
- 🔐 [JWT Validation Fix](JWT_FIX_COMPLETE.md)
- 🧪 [Login Testing Guide](LOGIN_TEST_GUIDE.md)
- 👤 [Bootstrap Admin Guide](BOOTSTRAP_ADMIN_GUIDE.md)

### **API Documentation**
- 📡 [Backend API Reference](API_DOCUMENTATION.md)
- 🔗 [Endpoint List](ENDPOINT_LIST.md)

### **Testing Tools**
- 🧪 [test-login.html](test-login.html) - Interactive login tester
- 🔧 [BOOTSTRAP_ADMIN.html](BOOTSTRAP_ADMIN.html) - Admin bootstrap tool

---

## 🎯 User Flows

### **Admin Flow** (5 Pages)
```
Login → Dashboard Admin → Kelola Kelas → Kelola Guru → Kelola Siswa → Settings
```

**Key Tasks:**
- ➕ Create guru/siswa accounts
- 📚 Manage classes
- 👥 View all users
- ⚙️ System configuration

### **Guru Flow** (9 Pages)
```
Login → Dashboard Guru → Kelas → Detail Kelas → Materi/Project Management → 
Monitor Progress → Forum Diskusi → Data Siswa → Settings
```

**Key Tasks:**
- 📝 Create materi (Progressive Learning)
- 🎯 Create project (PJBL 8 Sintaks)
- 📊 Monitor student progress
- ✅ Grade submissions manually
- 💬 Forum moderation

### **Siswa Flow** (11 Pages)
```
Login → Dashboard → Pembelajaran → Detail Materi → Baca/Quiz → 
Project → PJBL Stages → Forum → Schedule → Settings
```

**Key Tasks:**
- 📚 Learn materials step-by-step
- ✍️ Complete quizzes (auto-graded)
- 👥 Work on group projects (8 stages)
- 📝 Submit assignments
- 💬 Participate in forums

---

## 🔐 Authentication System

### **Admin-Controlled Registration**
- ❌ No self-registration
- ✅ All accounts created by admin
- 👤 Role assigned at creation (admin/guru/siswa)

### **Login Flow**
```
1. User enters credentials
2. Supabase Auth validates
3. Backend validates JWT with admin client
4. Load user data from KV store
5. Auto-redirect based on role:
   - admin → /dashboard-admin
   - guru → /dashboard-guru
   - siswa → /
```

### **Session Management**
- 🔑 JWT tokens (1 hour expiry)
- 🔄 Auto-refresh enabled
- 💾 Persistent sessions (localStorage)
- 🔒 Role-based access control on all routes

---

## 📊 Database Schema

### **Key Tables (via KV Store)**

```typescript
// User
user:{userId} → {
  id: string
  email: string
  name: string
  role: 'admin' | 'guru' | 'siswa'
  avatar: string | null
  avatarColor: string
  classId?: string
  status: string
  createdAt: string
}

// Class
class:{classId} → {
  id: string
  name: string
  description: string
  createdBy: string
  createdAt: string
}

// Material (Progressive Learning)
material:{materialId} → {
  id: string
  title: string
  description: string
  createdBy: string
  steps: Array<{
    id: string
    type: 'content' | 'quiz'
    title: string
    content?: string
    questions?: Array<Question>
  }>
}

// Project (PJBL)
project:{projectId} → {
  id: string
  title: string
  description: string
  createdBy: string
  stages: Array<{
    id: string
    name: string
    description: string
    status: 'pending' | 'in_progress' | 'completed'
  }>
}

// Todo
todo:{userId}:{todoId} → {
  id: string
  userId: string
  title: string
  completed: boolean
  createdAt: string
}
```

---

## 🎨 Design System

### **Colors**
```css
Primary: #1294f2 (Blue)
Success: #46bd84 (Green)
Warning: #ffcb14 (Yellow)
Danger: #dc2626 (Red)
Dark: #1e293b
Light: #f8fafc
```

### **Typography**
- **Headings:** Lato (Bold/ExtraBold)
- **Body:** Poppins (Regular/Medium)
- **UI Elements:** Inter

### **Layout**
- **Desktop:** 1440x1024px (fixed positioning)
- **Sidebar:** 360px width
- **Main Content:** Fluid within constraints
- **Components:** Consistent spacing & shadows

---

## 🧪 Testing

### **Automated Tests**

Run test page:
```bash
# Open in browser
/test-login.html
```

**Tests included:**
- ✅ Backend health check
- ✅ Bootstrap admin
- ✅ Login flow
- ✅ JWT validation
- ✅ User data loading

### **Manual Testing Checklist**

**Admin:**
- [ ] Login as admin
- [ ] Create guru account
- [ ] Create siswa account
- [ ] Manage classes
- [ ] View user lists

**Guru:**
- [ ] Login as guru
- [ ] Create materi (Progressive Learning)
- [ ] Create project (PJBL)
- [ ] Monitor student progress
- [ ] Grade submissions

**Siswa:**
- [ ] Login as siswa
- [ ] Access materi
- [ ] Complete quiz (auto-grading)
- [ ] Join project group
- [ ] Submit assignments

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Deploy Error 403**
**Solution:** Use dashboard deployment or CLI
- See: `/DEPLOY_VIA_DASHBOARD.md`
- Or: `/DEPLOY_FUNCTION_FIX.md`

#### **2. JWT Validation Error**
**Solution:** ✅ Already fixed!
- Backend uses `supabaseAdmin` for validation
- See: `/JWT_FIX_COMPLETE.md`

#### **3. Login Loop**
**Solution:**
```javascript
// Clear session
await supabase.auth.signOut();
localStorage.clear();
// Try login again
```

#### **4. Wrong Redirect**
**Solution:**
- Check user role in console logs
- Verify ProtectedRoute allowedRoles
- Hard refresh browser (Ctrl+Shift+R)

---

## 🔄 Update Log

### **v1.0 - Production Ready** (Current)
- ✅ JWT validation fixed
- ✅ Login flow working
- ✅ Role-based redirect
- ✅ Empty state for new accounts
- ✅ All 3 user flows complete (25 pages total)
- ✅ Progressive Learning system
- ✅ PJBL 8-stage system
- ✅ Settings (dark mode, language, sound)
- ✅ Full documentation

---

## 📞 Support

### **Documentation**
All guides available in project root:
- Quick Start
- Deployment guides
- Testing guides
- API documentation

### **Test Tools**
- Interactive test page: `/test-login.html`
- Bootstrap tool: `/BOOTSTRAP_ADMIN.html`

### **Scripts**
- Bash: `/deploy.sh`
- PowerShell: `/deploy.ps1`

---

## 📄 License

**Educational Project**  
Created for learning management and educational purposes.

---

## 👥 Credits

**Built with:**
- React + TypeScript
- Supabase
- Tailwind CSS
- Motion (Framer Motion)
- React Router
- Hono Framework

**Design:**
- Figma imported components
- Custom LMS interface
- Responsive layouts

---

## 🎉 Get Started

```bash
# 1. Deploy backend
supabase functions deploy server --no-verify-jwt

# 2. Bootstrap admin
# Use /BOOTSTRAP_ADMIN.html or run fetch in console

# 3. Login
# Go to /login with admin credentials

# 4. Start using!
# Create guru/siswa accounts and begin learning
```

**📚 Happy Learning! 🚀**

---

**Made with ❤️ for Education**
