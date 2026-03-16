# 한국 주식 차트 서버 (PowerShell HTTP 서버)
$ErrorActionPreference = 'Stop'

$port = 3000
$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$publicPath = Join-Path $rootPath "public"

$http = [System.Net.HttpListener]::new()
$http.Prefixes.Add("http://localhost:$port/")
$http.Start()

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  한국 주식 차트 서버 시작!" -ForegroundColor Green
Write-Host "  http://localhost:$port" -ForegroundColor Yellow
Write-Host "  종료: Ctrl+C" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 브라우저 자동 오픈
Start-Process "http://localhost:$port"

$yahooHeaders = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
    'Accept'     = 'application/json'
    'Referer'    = 'https://finance.yahoo.com'
}

function Get-MimeType($ext) {
    switch ($ext) {
        '.html' { 'text/html; charset=utf-8' }
        '.css'  { 'text/css; charset=utf-8' }
        '.js'   { 'application/javascript; charset=utf-8' }
        '.json' { 'application/json; charset=utf-8' }
        '.ico'  { 'image/x-icon' }
        default { 'application/octet-stream' }
    }
}

while ($http.IsListening) {
    try {
        $ctx = $http.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        $res.Headers.Add('Access-Control-Allow-Origin', '*')

        $urlPath = $req.Url.AbsolutePath

        # ── API: 차트 데이터 ──────────────────────────────────
        if ($urlPath -match '^/api/chart/(.+)$') {
            $symbol   = [uri]::UnescapeDataString($Matches[1])
            $range    = if ($req.QueryString['range']) { $req.QueryString['range'] } else { '1mo' }
            $interval = if ($req.QueryString['interval']) { $req.QueryString['interval'] } else { '1d' }

            try {
                $apiUrl = "https://query1.finance.yahoo.com/v8/finance/chart/$([uri]::EscapeDataString($symbol))?range=$range&interval=$interval&includePrePost=false"
                $data   = Invoke-RestMethod -Uri $apiUrl -Headers $yahooHeaders -TimeoutSec 15
                $result = $data.chart.result[0]
                $ts     = $result.timestamp
                $q      = $result.indicators.quote[0]
                $meta   = $result.meta

                $candles = for ($i = 0; $i -lt $ts.Count; $i++) {
                    if ($null -ne $q.open[$i] -and $null -ne $q.close[$i]) {
                        @{
                            time   = $ts[$i]
                            open   = [math]::Round($q.open[$i], 4)
                            high   = [math]::Round($q.high[$i], 4)
                            low    = [math]::Round($q.low[$i], 4)
                            close  = [math]::Round($q.close[$i], 4)
                            volume = [long]$q.volume[$i]
                        }
                    }
                }

                $payload = @{
                    symbol    = $meta.symbol
                    price     = $meta.regularMarketPrice
                    prevClose = $meta.chartPreviousClose
                    currency  = $meta.currency
                    candles   = $candles
                } | ConvertTo-Json -Depth 5

                $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
                $res.ContentType = 'application/json; charset=utf-8'
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host "[OK]  $symbol $range" -ForegroundColor Green
            } catch {
                $errJson = '{"error":"' + $_.Exception.Message + '"}'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($errJson)
                $res.StatusCode = 500
                $res.ContentType = 'application/json'
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
                Write-Host "[ERR] $symbol : $($_.Exception.Message)" -ForegroundColor Red
            }
        }

        # ── API: 종목 검색 ────────────────────────────────────
        elseif ($urlPath -eq '/api/search') {
            $q = $req.QueryString['q']
            try {
                $apiUrl = "https://query1.finance.yahoo.com/v1/finance/search?q=$([uri]::EscapeDataString($q))&quotesCount=10&newsCount=0"
                $data   = Invoke-RestMethod -Uri $apiUrl -Headers $yahooHeaders -TimeoutSec 10
                $items  = $data.quotes | Where-Object {
                    $_.symbol -and ($_.symbol -match '\.(KS|KQ)$')
                } | ForEach-Object {
                    @{ symbol = $_.symbol; name = if ($_.longname) { $_.longname } else { $_.shortname } }
                }
                $payload = ($items | ConvertTo-Json -Depth 3)
                if (-not $payload) { $payload = '[]' }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
                $res.ContentType = 'application/json; charset=utf-8'
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('[]')
                $res.ContentType = 'application/json'
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }

        # ── 정적 파일 서빙 ─────────────────────────────────────
        else {
            $filePath = if ($urlPath -eq '/') {
                Join-Path $publicPath "index.html"
            } else {
                Join-Path $publicPath $urlPath.TrimStart('/')
            }

            if (Test-Path $filePath -PathType Leaf) {
                $ext   = [System.IO.Path]::GetExtension($filePath)
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $res.ContentType = Get-MimeType $ext
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $res.StatusCode = 404
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
                $res.ContentLength64 = $bytes.Length
                $res.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }

        $res.OutputStream.Close()
    } catch {
        # 연결 끊김 등 무시
    }
}
