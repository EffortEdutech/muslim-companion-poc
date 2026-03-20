\
    param(
      [Parameter(Mandatory=$true)]
      [string]$SourceRoot,

      [string]$TargetRoot = ".\content\hadith\db"
    )

    Write-Host "SourceRoot: $SourceRoot"
    Write-Host "TargetRoot: $TargetRoot"

    $pairs = @(
      @{ From = Join-Path $SourceRoot "by_book";    To = Join-Path $TargetRoot "by_book" },
      @{ From = Join-Path $SourceRoot "by_chapter"; To = Join-Path $TargetRoot "by_chapter" }
    )

    foreach ($pair in $pairs) {
      if (Test-Path $pair.From) {
        New-Item -ItemType Directory -Force -Path $pair.To | Out-Null
        Copy-Item -Path (Join-Path $pair.From "*") -Destination $pair.To -Recurse -Force
        Write-Host "Copied: $($pair.From) -> $($pair.To)"
      } else {
        Write-Warning "Missing source folder: $($pair.From)"
      }
    }

    Write-Host "Import completed."
