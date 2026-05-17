# 🚀 Deploy Supabase Function - EduLearn LMS
# PowerShell script for Windows

$PROJECT_REF = "tjfmwixttmrayvhqhena"
$FUNCTION_NAME = "server"

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  🚀 EduLearn LMS - Function Deployment" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✅ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Supabase CLI:"
    Write-Host ""
    Write-Host "  Via Scoop:"
    Write-Host "    scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    Write-Host "    scoop install supabase"
    Write-Host ""
    Write-Host "  Via npm:"
    Write-Host "    npm install -g supabase"
    Write-Host ""
    exit 1
}

Write-Host ""

# Check if logged in
try {
    supabase projects list 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Host "✅ Logged in to Supabase" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Not logged in to Supabase" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Logging in..."
    supabase login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Link project
Write-Host "🔗 Linking to project..." -ForegroundColor Blue
supabase link --project-ref $PROJECT_REF
Write-Host "✅ Project linked" -ForegroundColor Green
Write-Host ""

# Check function exists
if (-not (Test-Path "supabase/functions/$FUNCTION_NAME")) {
    Write-Host "❌ Function directory not found: supabase/functions/$FUNCTION_NAME" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please make sure the function exists at:"
    Write-Host "  supabase/functions/$FUNCTION_NAME/index.tsx"
    Write-Host ""
    exit 1
}

Write-Host "✅ Function directory found" -ForegroundColor Green
Write-Host ""

# Deploy function
Write-Host "📦 Deploying function '$FUNCTION_NAME'..." -ForegroundColor Blue
Write-Host ""

supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_REF --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
    Write-Host "  ✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "Function URL:" -ForegroundColor Blue
    Write-Host "  https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME"
    Write-Host ""
    Write-Host "Health Check:" -ForegroundColor Blue
    Write-Host "  curl https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/health"
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Blue
    Write-Host "  1. Test health endpoint"
    Write-Host "  2. Bootstrap admin account"
    Write-Host "  3. Test login"
    Write-Host ""
    
    # Test health endpoint
    Write-Host "🧪 Testing health endpoint..." -ForegroundColor Blue
    Start-Sleep -Seconds 2
    
    try {
        $response = Invoke-RestMethod -Uri "https://$PROJECT_REF.supabase.co/functions/v1/$FUNCTION_NAME/health" -Method Get
        if ($response.status -eq "ok") {
            Write-Host "✅ Health check passed!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Your backend is ready to use!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Health check failed. The function may need a moment to start." -ForegroundColor Yellow
        Write-Host "   Try again in a few seconds."
    }
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Red
    Write-Host "  ❌ DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check function logs:"
    Write-Host "     supabase functions logs $FUNCTION_NAME"
    Write-Host ""
    Write-Host "  2. Verify function syntax:"
    Write-Host "     Check supabase/functions/$FUNCTION_NAME/index.tsx"
    Write-Host ""
    Write-Host "  3. Check Supabase dashboard:"
    Write-Host "     https://app.supabase.com/project/$PROJECT_REF/functions"
    Write-Host ""
    exit 1
}
