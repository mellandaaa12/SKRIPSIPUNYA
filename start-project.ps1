# Script otomasi PowerShell untuk memulai project Supabase + Vite
# Usage: .\start-project.ps1

Write-Host "🚀 Memulai otomasi project..." -ForegroundColor Green

# Cek apakah Supabase CLI terinstall
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI terinstall" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI tidak terinstall. Silakan install terlebih dahulu:" -ForegroundColor Red
    Write-Host "npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

# Cek status Supabase
Write-Host "📋 Mengecek status Supabase..." -ForegroundColor Blue
try {
    $status = supabase status
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Supabase sudah berjalan. Memulai development server..." -ForegroundColor Green
        npm run dev
    } else {
        Write-Host "🔄 Memulai Supabase dan development server..." -ForegroundColor Yellow
        supabase start; npm run dev
    }
} catch {
    Write-Host "🔄 Memulai Supabase dan development server..." -ForegroundColor Yellow
    supabase start; npm run dev
}
