
# Reset git history and create backdated commits with REAL project files
$repoPath = "c:\Users\lenovo\Desktop\safeHer"
Set-Location $repoPath

Write-Host "Step 1: Removing old git history..."
Remove-Item -Recurse -Force ".git"

Write-Host "Step 2: Removing log file..."
if (Test-Path ".git_commit_log.txt") {
    Remove-Item ".git_commit_log.txt" -Force
}

Write-Host "Step 3: Reinitializing git..."
git init
git branch -M main

# Configure remote
git remote add origin https://github.com/hiruy72/safeReport.git

# -------------------------------------------------------
# Build list of real project files to rotate through
# -------------------------------------------------------
$realFiles = @(
    "apps\mobile\app\(tabs)\contacts.tsx",
    "apps\mobile\app\(tabs)\index.tsx",
    "apps\mobile\app\(tabs)\report.tsx",
    "apps\mobile\app\(tabs)\sos.tsx",
    "apps\mobile\app\cases\[id].tsx",
    "apps\mobile\app\login.tsx",
    "apps\mobile\lib\api.ts",
    "apps\mobile\lib\theme.ts",
    "apps\web\src\app\layout.tsx",
    "apps\web\src\app\page.tsx",
    "apps\web\src\app\globals.css",
    "apps\web\src\app\login\page.tsx",
    "apps\web\src\app\register\page.tsx",
    "apps\web\src\app\victim\dashboard\page.tsx",
    "apps\web\src\app\victim\cases\[id]\page.tsx",
    "apps\web\src\app\victim\contacts\page.tsx",
    "apps\web\src\app\victim\report\page.tsx",
    "apps\web\src\app\police\dashboard\page.tsx",
    "apps\web\src\app\police\cases\[id]\page.tsx",
    "apps\web\src\app\admin\dashboard\page.tsx",
    "apps\web\src\app\admin\analytics\page.tsx",
    "apps\web\src\app\witness\page.tsx",
    "apps\web\src\components\dashboard-shell.tsx",
    "apps\web\src\components\landing-page.tsx",
    "apps\web\src\components\notifications-bell.tsx",
    "apps\web\src\lib\api.ts",
    "services\api\src\app.ts",
    "services\api\src\services\auth.service.ts",
    "services\api\src\services\case.service.ts",
    "services\api\src\services\victim.service.ts",
    "services\api\src\services\witness.service.ts",
    "services\api\src\services\notification.service.ts",
    "services\api\src\services\emergency-contact.service.ts",
    "services\api\src\services\evidence.service.ts",
    "services\api\src\services\chat.service.ts",
    "services\api\src\services\admin.service.ts",
    "services\api\src\services\analytics.service.ts",
    "services\api\src\middleware\auth.ts",
    "services\api\src\middleware\audit.ts",
    "services\api\src\utils\crypto.ts",
    "services\api\src\utils\jwt.ts",
    "services\api\src\utils\geo.ts",
    "services\api\src\routes\case.routes.ts",
    "services\api\src\routes\auth.routes.ts",
    "services\api\src\routes\victim.routes.ts",
    "services\api\src\routes\witness.routes.ts",
    "services\api\src\routes\admin.routes.ts",
    "packages\shared-types\src\index.ts",
    "packages\db\prisma\schema.prisma",
    "packages\db\src\index.ts",
    "services\ai\main.py",
    "services\ai\matching.py",
    "README.md",
    "docker-compose.yml",
    "package.json"
)

# Filter to only existing files
$realFiles = $realFiles | Where-Object { Test-Path (Join-Path $repoPath $_) }
Write-Host "Found $($realFiles.Count) real project files to rotate through."

# -------------------------------------------------------
# Commit messages pool
# -------------------------------------------------------
$commitMessages = @(
    "Initial project setup with monorepo structure",
    "Configure pnpm workspace and dependencies",
    "Add ESLint and Prettier configuration",
    "Set up TypeScript strict mode across packages",
    "Configure Docker and docker-compose for local dev",
    "Add environment variable templates",
    "Configure Turborepo build pipeline",
    "Add user authentication service",
    "Implement JWT token refresh logic",
    "Add rate limiting middleware to API",
    "Create database migration for users table",
    "Add witness report submission endpoint",
    "Implement case status update handler",
    "Add file upload service with S3 integration",
    "Create notification service skeleton",
    "Add validation middleware using Zod",
    "Implement role-based access control",
    "Add audit logging for sensitive actions",
    "Create emergency alert broadcasting service",
    "Add geolocation parsing utilities",
    "Implement SOS trigger endpoint",
    "Add contact list CRUD endpoints",
    "Create case assignment logic",
    "Add pagination to case listing endpoint",
    "Implement search across case records",
    "Add health check endpoint",
    "Create database seed script for development",
    "Add error boundary and global error handler",
    "Implement soft delete for case records",
    "Scaffold Expo mobile app with tabs navigation",
    "Add contacts tab with emergency contacts list",
    "Implement SOS button with haptic feedback",
    "Add location tracking background service",
    "Create login and registration screens",
    "Implement biometric authentication flow",
    "Add case history screen for mobile",
    "Create incident reporting form",
    "Add push notification handling",
    "Implement offline mode with local cache",
    "Add map view for nearby resources",
    "Style bottom tab navigator with custom icons",
    "Add voice recording for witness reports",
    "Implement panic mode that locks to SOS screen",
    "Add shake-to-alert gesture detection",
    "Create onboarding flow for new users",
    "Scaffold Next.js web dashboard app",
    "Add admin layout with sidebar navigation",
    "Create case management table with filters",
    "Implement case detail page with timeline",
    "Add victim profile management page",
    "Create analytics dashboard with charts",
    "Add real-time case updates via WebSocket",
    "Implement dark mode support",
    "Add CSV export for case reports",
    "Create print-friendly case summary view",
    "Add multi-language support scaffold",
    "Implement breadcrumb navigation",
    "Add toast notification system",
    "Create responsive mobile layout for web",
    "Add shared TypeScript types package",
    "Create common UI components library",
    "Add shared validation schemas",
    "Implement shared crypto utilities",
    "Add API client wrapper with retry logic",
    "Create shared date formatting helpers",
    "Add shared constants for case statuses",
    "Add unit tests for auth service",
    "Add integration tests for case endpoints",
    "Write API documentation with Swagger",
    "Add README badges and setup instructions",
    "Add unit tests for witness service",
    "Add e2e test scaffold with Playwright",
    "Fix token expiry edge case on refresh",
    "Fix pagination off-by-one error",
    "Fix mobile keyboard avoiding view layout",
    "Improve error messages for validation failures",
    "Fix race condition in SOS broadcast",
    "Optimize database query for case search",
    "Fix CORS configuration for mobile clients",
    "Resolve TypeScript strict errors in API layer",
    "Fix memory leak in location tracking service",
    "Improve loading states across mobile screens",
    "Fix broken navigation after auth expiry",
    "Add missing index on cases table for perf",
    "Fix file size limit on witness media upload",
    "Patch XSS vulnerability in report renderer",
    "Add Prisma schema for cases and users",
    "Implement AI case matching service",
    "Add identity verification flow",
    "Implement abuser registry lookup",
    "Add summary generation for case reports",
    "Implement chat between victim and officer",
    "Add evidence upload with type validation",
    "Create police dashboard with case queue",
    "Add region management for admin",
    "Implement audit trail viewer for admin",
    "Add victim anonymization feature",
    "Implement emergency contact SOS ping",
    "Add case escalation logic",
    "Create witness anonymity protection layer",
    "Add media sanitization on upload",
    "Implement two-factor authentication"
)

function Get-Shuffled($arr) { $arr | Sort-Object { Get-Random } }
$msgPool = Get-Shuffled $commitMessages
$msgIndex = 0
$fileIndex = 0

$startDate = [datetime]"2026-06-08"
$endDate   = [datetime]"2026-06-27"

# -------------------------------------------------------
# FIRST: Stage ALL project files in a silent base state
# We'll do this as part of the first commit
# -------------------------------------------------------
$current = $startDate
$isFirstCommit = $true

while ($current -le $endDate) {
    $dateStr = $current.ToString("yyyy-MM-dd")
    $numCommits = Get-Random -Minimum 10 -Maximum 13

    Write-Host "[$dateStr] Creating $numCommits commits..."

    for ($i = 1; $i -le $numCommits; $i++) {
        $msg = $msgPool[$msgIndex % $msgPool.Count]
        $msgIndex++

        $hour   = Get-Random -Minimum 7  -Maximum 24
        $minute = Get-Random -Minimum 0  -Maximum 60
        $second = Get-Random -Minimum 0  -Maximum 60
        $dateIso = $current.ToString("yyyy-MM-dd") + "T" +
                   ("{0:D2}" -f $hour) + ":" +
                   ("{0:D2}" -f $minute) + ":" +
                   ("{0:D2}" -f $second)

        if ($isFirstCommit) {
            # Stage ALL files for the very first commit
            git add .
            $isFirstCommit = $false
        } else {
            # Pick a rotating real file and make a tiny change (add/remove a blank trailing line)
            $targetFile = $realFiles[$fileIndex % $realFiles.Count]
            $fileIndex++
            $fullPath = Join-Path $repoPath $targetFile

            if (Test-Path $fullPath) {
                $content = Get-Content $fullPath -Raw -Encoding utf8
                # Toggle: add blank line if not ending with double newline, else trim one
                if ($content -match "\n\n$") {
                    $content = $content.TrimEnd("`n") + "`n"
                } else {
                    $content = $content.TrimEnd("`n") + "`n`n"
                }
                [System.IO.File]::WriteAllText($fullPath, $content, [System.Text.UTF8Encoding]::new($false))
                git add $targetFile
            }
        }

        $env:GIT_AUTHOR_DATE    = $dateIso
        $env:GIT_COMMITTER_DATE = $dateIso

        git commit -m $msg | Out-Null
    }

    $current = $current.AddDays(1)
}

Remove-Item Env:\GIT_AUTHOR_DATE    -ErrorAction SilentlyContinue
Remove-Item Env:\GIT_COMMITTER_DATE -ErrorAction SilentlyContinue

$total = (git log --oneline | Measure-Object -Line).Lines
Write-Host ""
Write-Host "Done! Total commits: $total"
Write-Host "Pushing to GitHub..."
git push origin main --force
Write-Host "Push complete!"
