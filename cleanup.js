const fs = require('fs');
const path = require('path');
function rootFiles(src) {
    const stats = fs.statSync(src);    
    if (stats.isDirectory()) {
      // Read the directory contents
      return fs.readdirSync(src);
    }
    return []
  }
const main = async () => {
  try {
      const dirs = fs.readdirSync('docs').filter(d => d.startsWith('G-'));
      const toRemove = dirs.flatMap(d => rootFiles(`docs/${d}`));
      toRemove.forEach((d) => {
        fs.rmSync(`src/pages/${d}`, {recursive: true, force: true})
      });
    } catch (e) {
      console.error('Error during cleanup', e)
    }
}

main()