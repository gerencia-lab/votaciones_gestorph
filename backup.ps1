$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupName = "Votaciones-gestorph_backup_$timestamp.zip"
$source = ".\"
$destination = "..\$backupName"

Write-Host "Creating backup: $destination"
Compress-Archive -Path ".\*" -DestinationPath $destination -Force
Write-Host "Backup created successfully at: $destination"
