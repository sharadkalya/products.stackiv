/**
 * Complete Verification Script
 * 
 * This script runs a full end-to-end verification of the Odoo sync:
 * 1. Clears all existing data
 * 2. Runs complete sync
 * 3. Verifies results
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCRIPTS_DIR = __dirname;

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function runScript(scriptName) {
    return new Promise((resolve, reject) => {
        log(`\n${'═'.repeat(70)}`, 'cyan');
        log(`RUNNING: ${scriptName}`, 'bright');
        log('═'.repeat(70), 'cyan');

        const scriptPath = path.join(SCRIPTS_DIR, scriptName);
        const child = spawn('npx', ['tsx', scriptPath], {
            stdio: 'inherit',
            shell: true,
        });

        child.on('close', (code) => {
            if (code === 0) {
                log(`\n✓ ${scriptName} completed successfully`, 'green');
                resolve();
            } else {
                log(`\n✗ ${scriptName} failed with code ${code}`, 'red');
                reject(new Error(`${scriptName} failed with code ${code}`));
            }
        });

        child.on('error', (error) => {
            log(`\n✗ ${scriptName} error: ${error.message}`, 'red');
            reject(error);
        });
    });
}

async function main() {
    const startTime = Date.now();

    log('\n╔════════════════════════════════════════════════════════════════════╗', 'bright');
    log('║         COMPLETE ODOO SYNC VERIFICATION SUITE                     ║', 'bright');
    log('╚════════════════════════════════════════════════════════════════════╝', 'bright');

    try {
        // Step 1: Clear existing data
        log('\n📋 Step 1/3: Clearing existing data...', 'yellow');
        await runScript('clear-data.js');

        // Wait a moment for database to settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 2: Run complete sync
        log('\n📋 Step 2/3: Running complete sync...', 'yellow');
        await runScript('test-complete-sync.js');

        // Wait a moment for database to settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 3: Verify results
        log('\n📋 Step 3/3: Verifying results...', 'yellow');
        await runScript('test-verify-records.js');

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        log('\n' + '═'.repeat(70), 'green');
        log('✓ COMPLETE VERIFICATION PASSED', 'green');
        log('═'.repeat(70), 'green');
        log(`\nTotal duration: ${duration} seconds`, 'cyan');
        log('\nAll steps completed successfully!', 'green');
        log('The v3 cursor-based sync implementation is working correctly.\n', 'green');

        process.exit(0);

    } catch (error) {
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        log('\n' + '═'.repeat(70), 'red');
        log('✗ VERIFICATION FAILED', 'red');
        log('═'.repeat(70), 'red');
        log(`\nTotal duration: ${duration} seconds`, 'cyan');
        log(`\nError: ${error.message}`, 'red');
        log('\nPlease review the output above for details.\n', 'yellow');

        process.exit(1);
    }
}

main();
