const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const pkg = require('./package.json');

console.log(`${pkg.name} ${pkg.version} (${pkg.author})${os.EOL}`);

const patchFile = process.argv[2] || '';
const validPatchFile = 
  patchFile &&
  fs.existsSync(patchFile) &&
  patchFile.endsWith('.patch');

if (!validPatchFile) {
    console.log(`No patch file found.`);
    process.exit(1);
}

const readInterface = readline.createInterface({
    input: fs.createReadStream(patchFile),
    output: null,
    console: false
});

let patchNum = 0;
let patchPath = '';
let patchContent = [];

readInterface.on('line', function (line) {
    if (line.startsWith('diff --git')) {
        if (patchNum) {
            console.log(`Creating patch ${patchNum} (${patchPath})`);
            fs.writeFileSync(patchPath, `${patchContent.join('\n')}\n`);
            patchContent = [];
        }
        patchNum++;
        const pathMatcher = /diff --git a\/(.+) b\/(.+)/;
        const pathMatches = line.match(pathMatcher);
        const dir = path.parse(pathMatches[1]).dir;
        fs.mkdirSync(dir, { recursive: true });
        patchPath = `${pathMatches[1]}.patch`;
        patchContent.push(line);
    } else {
        if (patchNum) {
            patchContent.push(line);
        }
    }
});

readInterface.on('close', function () {
    if (patchNum) {
        console.log(`Creating patch ${patchNum} (${patchPath})`);
        fs.writeFileSync(patchPath, patchContent.join('\n'));
        patchContent = [];
    }
});