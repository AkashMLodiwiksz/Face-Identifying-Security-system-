$env:PATH = "C:\Program Files\nodejs;$env:PATH"

Write-Host "[1/2] Starting Flask Backend..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$PSScriptRoot\backend`" && python app.py"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting React Frontend..." -ForegroundColor Green
Set-Location "$PSScriptRoot\frontend-react"
npm run dev
