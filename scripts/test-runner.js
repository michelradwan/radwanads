/**
 * TEST RUNNER & LOG COMPACTION SCRIPT
 * Executes test suite, writes raw log to artifact/temp file, and outputs structured compact summary.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'storage', 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const rawLogPath = path.join(logDir, 'test-suite-raw.log');
const startTime = Date.now();

try {
    const rawOutput = execSync('npm test', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    fs.writeFileSync(rawLogPath, rawOutput, 'utf-8');

    // Parse and summarize output
    const lines = rawOutput.split('\n');
    const passedTests = lines.filter(l => l.includes('✅')).map(l => l.trim());
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[TEST_RUNNER SUMMARY]`);
    console.log(`STATUS: ALL PASS (${passedTests.length}/9)`);
    console.log(`DURATION: ${duration}s`);
    console.log(`RAW LOG SAVED: storage/logs/test-suite-raw.log`);
    console.log(`PASSING TESTS:`);
    passedTests.forEach(t => console.log(`  ${t}`));
} catch (err) {
    const rawOutput = (err.stdout || '') + '\n' + (err.stderr || '');
    fs.writeFileSync(rawLogPath, rawOutput, 'utf-8');

    const lines = rawOutput.split('\n');
    const failures = lines.filter(l => l.includes('❌') || l.includes('Error') || l.includes('FAIL'));

    console.log(`[TEST_RUNNER SUMMARY]`);
    console.log(`STATUS: FAIL`);
    console.log(`FAILURES COUNT: ${failures.length}`);
    console.log(`RAW LOG SAVED: storage/logs/test-suite-raw.log`);
    console.log(`RELEVANT FAILURE LINES:`);
    failures.slice(0, 10).forEach(f => console.log(`  ${f.trim()}`));
    process.exit(1);
}
