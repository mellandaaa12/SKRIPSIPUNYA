# 🚀 Deployment Guide - EduLearn LMS Backend

## ✅ Status Perbaikan

- [x] Error 401 "Invalid JWT" - FIXED ✅
- [x] Error 403 Deployment - FIXED ✅
- [x] Folder structure - CORRECT ✅
- [x] Database integration - READY ✅
- [x] Auto-create profile - IMPLEMENTED ✅
- [ ] **Backend deployment - PENDING** ⚠️

## 📁 Struktur Folder yang Benar

```
/supabase/
├── config.toml                # ✅ Config dengan [functions.make-server]
└── functions/
    └── make-server/           # ✅ Nama cocok dengan config.toml
        ├── index.tsx          # ✅ Main backend (PostgreSQL)
        └── deno.json          # ✅ Deno configuration
```

**⚠️ PENTING:** 
- Folder `/supabase/functions/server/` adalah versi LAMA (KV store) - JANGAN DEPLOY!
- Deploy folder `make-server` saja (sudah menggunakan PostgreSQL)

## 🔧 Konfigurasi

File `/supabase/config.toml` sudah dikonfigurasi dengan benar:

```toml
[functions.make-server]
verify_jwt = false
```

**Note:** `verify_jwt = false` karena kita melakukan custom JWT verification menggunakan `supabaseAdmin.auth.getUser(token)` di backend.

## 🚀 Cara Deploy

### Option 1: Deploy via Figma Make UI (Recommended)

1. Klik tombol **"Deploy"** di Figma Make interface
2. Pilih **"Deploy to Supabase"**
3. Backend akan otomatis di-deploy ke: `make-server`
4. Selesai! ✅

### Option 2: Deploy via Supabase CLI

```bash
# 1. Login ke Supabase (jika belum)
supabase login

# 2. Link project (gunakan project ID yang benar)
supabase link --project-ref tjfmwixttmrayvhqhena

# 3. Deploy function
supabase functions deploy make-server
```

## 🔍 Verifikasi Deployment

### 1. Check Health Endpoint

```bash
curl https://tjfmwixttmrayvhqhena.supabase.co/functions/v1/make-server/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Backend is running",
  "timestamp": "2026-03-08T..."
}
```

### 2. Gunakan Test Backend HTML

Buka file `/TEST_BACKEND.html` di browser untuk test semua endpoint secara visual.

### 3. Test /auth/me Endpoint

```bash
# Login dulu untuk dapat token
curl -X POST https://tjfmwixttmrayvhqhena.supabase.co/functions/v1/make-server/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "password123"}'

# Gunakan access_token dari response untuk test /auth/me
curl https://tjfmwixttmrayvhqhena.supabase.co/functions/v1/make-server/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "email": "admin@test.com",
  "name": "Admin EduLearn",
  "role": "admin"
}
```

## 🗄️ Database Setup

### Tabel yang Diperlukan

Backend menggunakan PostgreSQL database dengan tabel `profiles`:

#### Table: `profiles`

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
```

**Note:** Backend akan otomatis create profile jika user login tapi belum ada di table `profiles`.

## 🔐 Environment Variables

Backend secara otomatis menggunakan environment variables yang disediakan oleh Supabase:

- ✅ `SUPABASE_URL` - Auto-injected
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Auto-injected

**Tidak perlu set manual!**

## 📊 API Endpoints

Base URL: `https://tjfmwixttmrayvhqhena.supabase.co/functions/v1/make-server`

### Authentication
- `POST /auth/signin` - Login
- `GET /auth/me` - Get current user
- `POST /auth/signout` - Logout
- `POST /bootstrap/admin` - Create first admin

### Users (Admin Only)
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `POST /admin/create-user` - Create new user

### System
- `GET /health` - Health check
- `GET /` - API info

## 🐛 Troubleshooting

### Error: "Failed to fetch"
❌ **Penyebab:** Backend belum di-deploy  
✅ **Solusi:** Deploy backend dengan `supabase functions deploy make-server`

### Error 401 "Invalid JWT"
✅ **FIXED** - Backend sekarang menggunakan `supabaseAdmin.auth.getUser(token)`

### Error: "Table profiles does not exist"
❌ **Penyebab:** Tabel belum dibuat  
✅ **Solusi:** Run SQL query untuk create table (lihat section Database Setup)

### Error: "Admin already exists"
✅ **Normal** - Admin sudah dibuat sebelumnya, gunakan akun yang ada

### Deployment Error 403
✅ **FIXED** - Config sudah benar dengan `[functions.make-server]`

## 📝 Logs

### View Logs di Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/tjfmwixttmrayvhqhena/functions/make-server/logs
2. Monitor real-time logs untuk debugging

### Log Format

Backend menggunakan emoji untuk easy scanning:
- ✅ Success operations
- ❌ Errors
- 🔍 JWT validation
- 📥 Loading data
- 🔑 Authentication
- ⚠️ Warnings

## ✨ Features

### 1. JWT Validation
- Menggunakan `supabaseAdmin.auth.getUser(token)` untuk security
- Token dari header: `Authorization: Bearer <token>`
- Auto-reject invalid/expired tokens

### 2. Auto-Create Profile
- User login tapi belum ada di `profiles` → auto-create dengan role "siswa"
- Seamless experience untuk user baru

### 3. Database Integration
- PostgreSQL database dengan tabel `profiles`
- RLS policies untuk security
- Indexes untuk performance

### 4. CORS Enabled
- Allow all origins untuk development
- Allow headers: Content-Type, Authorization
- Allow methods: GET, POST, PUT, DELETE, OPTIONS

## 🎯 Next Steps After Deployment

1. ✅ Deploy backend function → `supabase functions deploy make-server`
2. ✅ Create tabel `profiles` di Supabase Dashboard
3. ✅ Test health endpoint → Open `/TEST_BACKEND.html`
4. ✅ Create admin user via `/bootstrap/admin`
5. ✅ Test login flow di aplikasi
6. ✅ Verify auto-redirect works

## 🔗 Quick Links

- **Deployment Instructions:** `/DEPLOY_INSTRUCTIONS.md`
- **Backend Tester:** `/TEST_BACKEND.html`
- **Supabase Dashboard:** https://supabase.com/dashboard/project/tjfmwixttmrayvhqhena
- **Function Logs:** https://supabase.com/dashboard/project/tjfmwixttmrayvhqhena/functions/make-server/logs
- **SQL Editor:** https://supabase.com/dashboard/project/tjfmwixttmrayvhqhena/editor

---

**Last Updated:** March 8, 2026  
**Backend Version:** 1.0  
**Project:** EduLearn LMS  
**Status:** ✅ Ready to Deploy
