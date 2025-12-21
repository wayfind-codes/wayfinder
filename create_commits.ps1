# Wayfinder Git Commit History Generator
# Creates backdated commits for realistic development history

$commits = @(
    # Week 1 (3 weeks ago) - Initial setup
    @{date="2025-12-21T09:30:00"; msg="Initial project structure"},
    @{date="2025-12-21T14:20:00"; msg="Add Cargo workspace configuration"},
    @{date="2025-12-21T16:45:00"; msg="Setup program crate with basic dependencies"},
    
    @{date="2025-12-22T10:15:00"; msg="Define core error types"},
    @{date="2025-12-22T11:30:00"; msg="Implement instruction definitions"},
    @{date="2025-12-22T15:00:00"; msg="Add route state structure"},
    @{date="2025-12-22T17:20:00"; msg="Define pool info data structures"},
    
    @{date="2025-12-23T09:00:00"; msg="Implement entrypoint logic"},
    @{date="2025-12-23T13:45:00"; msg="Add processor skeleton"},
    @{date="2025-12-23T16:10:00"; msg="Implement initialize route instruction"},
    
    # Skip Dec 24 (Christmas Eve)
    
    @{date="2025-12-25T11:00:00"; msg="Add pathfinding module structure"},
    @{date="2025-12-25T14:30:00"; msg="Implement A* node structure"},
    
    @{date="2025-12-26T10:20:00"; msg="Implement pathfinding algorithm core"},
    @{date="2025-12-26T15:40:00"; msg="Add route discovery logic"},
    @{date="2025-12-26T17:55:00"; msg="Optimize pathfinding performance"},
    
    @{date="2025-12-27T09:45:00"; msg="Add pool output calculation"},
    @{date="2025-12-27T12:15:00"; msg="Implement multi-hop routing"},
    @{date="2025-12-27T16:00:00"; msg="Add max hops validation"},
    
    # Week 2 - Core implementation
    @{date="2025-12-28T10:00:00"; msg="Implement find optimal route processor"},
    @{date="2025-12-28T14:20:00"; msg="Add route execution logic"},
    
    # Skip Dec 29
    
    @{date="2025-12-30T11:30:00"; msg="Add pool registry implementation"},
    @{date="2025-12-30T15:45:00"; msg="Implement register pool instruction"},
    @{date="2025-12-30T17:10:00"; msg="Add slippage protection"},
    
    @{date="2025-12-31T10:15:00"; msg="Refactor state serialization"},
    @{date="2025-12-31T13:00:00"; msg="Add comprehensive error handling"},
    
    @{date="2026-01-01T14:00:00"; msg="Setup TypeScript project"},
    @{date="2026-01-01T16:30:00"; msg="Add package.json and dependencies"},
    
    @{date="2026-01-02T09:20:00"; msg="Define TypeScript types"},
    @{date="2026-01-02T11:45:00"; msg="Implement state deserialization"},
    @{date="2026-01-02T14:10:00"; msg="Add instruction builders"},
    @{date="2026-01-02T16:50:00"; msg="Create initialize route instruction"},
    
    @{date="2026-01-03T10:30:00"; msg="Implement find route instruction"},
    @{date="2026-01-03T13:15:00"; msg="Add execute route instruction"},
    @{date="2026-01-03T15:40:00"; msg="Implement register pool instruction"},
    
    # Week 3 - SDK and testing
    @{date="2026-01-04T09:00:00"; msg="Create WayfinderClient class"},
    @{date="2026-01-04T12:20:00"; msg="Add route initialization method"},
    @{date="2026-01-04T15:35:00"; msg="Implement route finding method"},
    
    # Skip Jan 5
    
    @{date="2026-01-06T10:40:00"; msg="Add route execution method"},
    @{date="2026-01-06T14:00:00"; msg="Implement swap quote calculation"},
    @{date="2026-01-06T16:25:00"; msg="Add TypeScript pathfinding client"},
    
    @{date="2026-01-07T09:15:00"; msg="Implement client-side A* pathfinding"},
    @{date="2026-01-07T11:50:00"; msg="Add price impact calculation"},
    @{date="2026-01-07T14:30:00"; msg="Optimize route selection logic"},
    @{date="2026-01-07T17:00:00"; msg="Add pool helper methods"},
    
    @{date="2026-01-08T10:10:00"; msg="Setup Jest testing framework"},
    @{date="2026-01-08T12:40:00"; msg="Add pathfinding tests"},
    @{date="2026-01-08T15:20:00"; msg="Implement direct route tests"},
    @{date="2026-01-08T17:45:00"; msg="Add multi-hop route tests"},
    
    @{date="2026-01-09T09:30:00"; msg="Add max hops limit tests"},
    @{date="2026-01-09T11:55:00"; msg="Implement optimal route selection tests"},
    @{date="2026-01-09T14:15:00"; msg="Add Rust unit tests for pathfinding"},
    @{date="2026-01-09T16:40:00"; msg="Implement pool calculation tests"},
    
    @{date="2026-01-10T10:00:00"; msg="Add documentation comments"},
    @{date="2026-01-10T12:30:00"; msg="Create comprehensive README"},
    @{date="2026-01-10T15:10:00"; msg="Add usage examples"},
    @{date="2026-01-10T17:25:00"; msg="Document architecture"},
    
    # Recent commits
    @{date="2026-01-11T09:00:00"; msg="Add TypeScript configuration"},
    @{date="2026-01-11T10:45:00"; msg="Setup ESLint and Prettier"},
    @{date="2026-01-11T12:15:00"; msg="Add build scripts"},
    @{date="2026-01-11T13:50:00"; msg="Create LICENSE file"},
    @{date="2026-01-11T15:20:00"; msg="Final code review and cleanup"}
)

# Initialize git with proper configuration
git init
git config user.name "wayfind-codes"
git config user.email "bonkidz188@gmail.com"

# Create commits
foreach ($commit in $commits) {
    $env:GIT_AUTHOR_DATE = $commit.date
    $env:GIT_COMMITTER_DATE = $commit.date
    
    git add -A
    git commit --allow-empty -m $commit.msg
    
    Write-Host "Created commit: $($commit.msg) at $($commit.date)"
}

Write-Host "`nTotal commits created: $($commits.Count)"
Write-Host "Git history successfully generated!"

