\
    param(
      [string]$Root = ".\content\hadith\db"
    )

    $required = @(
      "by_book\the_9_books",
      "by_book\other_books",
      "by_book\forties",
      "by_chapter\the_9_books",
      "by_chapter\other_books",
      "by_chapter\forties"
    )

    $missing = @()

    foreach ($rel in $required) {
      $path = Join-Path $Root $rel
      if (-not (Test-Path $path)) {
        $missing += $path
      }
    }

    if ($missing.Count -gt 0) {
      Write-Host "Missing folders:"
      $missing | ForEach-Object { Write-Host " - $_" }
      exit 1
    }

    Write-Host "Layout looks valid."
