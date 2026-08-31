/**
 * REPOSITORY GUARD HOOK (Antigravity PreToolUse)
 * Intercepts tool calls and strictly blocks operations if:
 * 1. Target is RADWAN but CWD or parameters point to brasilvendas, radwanads-worktree, or unauthorized directories.
 * 2. Destructive git / rm operations are attempted without verification.
 */
const fs = require('fs');

let input = '';
process.stdin.setEncoding('utf-8');

process.stdin.on('data', chunk => {
    input += chunk;
});

process.stdin.on('end', () => {
    try {
        if (!input.trim()) {
            console.log(JSON.stringify({ decision: 'allow' }));
            process.exit(0);
        }

        const payload = JSON.parse(input);
        const toolName = payload.toolCall?.name || '';
        const args = payload.toolCall?.args || {};

        // 1. Check for command execution
        if (toolName === 'run_command') {
            const cmd = (args.CommandLine || '').toLowerCase();
            const cwd = (args.Cwd || '').toLowerCase();

            // Strict Repository Guard: Never operate on brasilvendas or radwanads-worktree
            if (cwd.includes('brasilvendas') || cmd.includes('brasilvendas') || cwd.includes('radwanads-worktree') || cmd.includes('radwanads-worktree')) {
                console.log(JSON.stringify({
                    decision: 'deny',
                    reason: 'BLOCKED BY REPO-GUARD: Operation directed at brasilvendas/worktree is strictly forbidden in RADWAN ADS context.'
                }));
                process.exit(0);
            }

            // Destructive Command Guard
            if (cmd.includes('reset --hard') || cmd.includes('push --force') || cmd.includes('rm -rf /')) {
                console.log(JSON.stringify({
                    decision: 'deny',
                    reason: 'BLOCKED BY SAFETY-GUARD: Destructive git or disk commands require explicit manual execution.'
                }));
                process.exit(0);
            }
        }

        // 2. Check for file write operations
        if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(toolName)) {
            const targetFile = (args.TargetFile || '').toLowerCase();
            if (targetFile.includes('brasilvendas') || targetFile.includes('radwanads-worktree')) {
                console.log(JSON.stringify({
                    decision: 'deny',
                    reason: 'BLOCKED BY REPO-GUARD: File modification inside brasilvendas/worktree is strictly prohibited.'
                }));
                process.exit(0);
            }
        }

        // Allow all other normal safe operations
        console.log(JSON.stringify({ decision: 'allow' }));
        process.exit(0);
    } catch (e) {
        console.log(JSON.stringify({ decision: 'allow', reason: 'Hook parse error fallback' }));
        process.exit(0);
    }
});
