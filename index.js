import { generateReport}  from 'lighthouse';
import lighthouse  from 'lighthouse';
const fs = require('fs');


async function runLighthouse(url, path) {
    const { lhr } = await lighthouse(url, {
        port: 9222, // Change to your Chrome's remote debugging port
        output: 'html',
        logLevel: 'verbose',
    });
    // Generate and write the report
    const html = generateReport(lhr, 'html');
    writeFileSync(path, html);
}

const arg1 = process.argv[2];
const arg2 = process.argv[3];
console.log('Argument 1:', arg1);
console.log('Argument 2:', arg2);
await runLighthouse(arg1, arg2)