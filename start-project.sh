#!/bin/bash

# Script otomasi untuk memulai project Supabase + Vite
# Usage: ./start-project.sh

echo "🚀 Memulai otomasi project..."

# Cek apakah Supabase CLI terinstall
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI tidak terinstall. Silakan install terlebih dahulu:"
    echo "npm install -g supabase"
    exit 1
fi

# Cek status Supabase
echo "📋 Mengecek status Supabase..."
supabase status

if [ $? -eq 0 ]; then
    echo "✅ Supabase sudah berjalan. Memulai development server..."
    npm run dev
else
    echo "🔄 Memulai Supabase dan development server..."
    supabase start && npm run dev
fi
