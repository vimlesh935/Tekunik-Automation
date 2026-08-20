$path = "c:\Users\visha\Desktop\Tekunik\Automation\frontend\src\pages\AdminPanel.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$text = [System.Text.Encoding]::UTF8.GetString($bytes)

$idx = $text.IndexOf("const fetchAllProducts = useCallback")
Write-Host "First occurrence at index: $idx"
Write-Host "Context bytes around it:"
$ctx = $text.Substring([Math]::Max(0,$idx-4), 200)
$ctxBytes = [System.Text.Encoding]::UTF8.GetBytes($ctx)
Write-Host ($ctxBytes | ForEach-Object { $_.ToString("X2") }) -Separator " "
