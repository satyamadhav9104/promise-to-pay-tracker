# PowerShell script to fire Razorpay test webhook for live video demo
param (
    [string]$InvoiceId = "INV-1002",
    [string]$Url = "http://127.0.0.1:8000/api/webhooks/razorpay"
)

Write-Host "🚀 Firing Razorpay Webhook for $InvoiceId..." -ForegroundColor Cyan

$body = @{
    event = "payment.captured"
    payload = @{
        payment = @{
            entity = @{
                id = "pay_LIVE_DEMO_998877"
                amount = 1250000
                currency = "INR"
                status = "captured"
                method = "upi"
                description = "Payment for $InvoiceId"
                notes = @{
                    invoice_id = $InvoiceId
                }
            }
        }
    }
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri $Url -Method Post -ContentType "application/json" -Body $body
    Write-Host "✅ Webhook Response:" -ForegroundColor Green
    $response | ConvertTo-Json
    Write-Host "🎉 Status updated to PAID live!" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
