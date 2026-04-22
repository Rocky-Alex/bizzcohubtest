const fs = require('fs');
const p = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = p.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('route.ts')) results.push(file);
        }
    });
    return results;
}

const files = walk('src/app/api');

files.forEach(f => {
    let c = fs.readFileSync(f, 'utf8');
    let changed = false;

    // Regex for Next.js route parameter signature
    const regex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*(?:_?req|request)\s*:\s*(?:Next)?Request\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{[^}]+\}\s*\}\s*\)/g;

    if (c.match(regex)) {
        c = c.replace(regex, (match, method) => {
            let reqName = match.includes('_req') ? '_req' : (match.includes('request') ? 'request' : 'req');
            let reqType = match.includes('NextRequest') ? 'NextRequest' : 'Request';
            return `export async function ${method}(${reqName}: ${reqType}, context: any)`;
        });

        // Try replacing const id = params.id
        c = c.replace(/const\s+(\w+)\s*=\s*params\.(\w+);/g, 'const params = await Promise.resolve(context.params);\n        const $1 = params.$2;');
        // Try replacing const { id } = params
        c = c.replace(/const\s+\{\s*([^}]+)\s*\}\s*=\s*params;/g, 'const params = await Promise.resolve(context.params);\n        const { $1 } = params;');
        // Sometimes it's passed as parseInt(params.id) directly
        c = c.replace(/parseInt\s*\(\s*params\.id\s*\)/g, '(await Promise.resolve(context.params)).id');

        changed = true;
    }

    if (changed) {
        console.log("Fixed", f);
        fs.writeFileSync(f, c);
    }
});
