const fs = require('fs');
const path = require('path');
function copyRecursive(src, dest) {
    const rootFiles = []
    const stats = fs.statSync(src);
    
    if (stats.isDirectory()) {
      // Create destination directory if it doesn't exist
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      
      // Read the directory contents
      const entries = fs.readdirSync(src);
      rootFiles.splice(0, 0, ...entries)
      
      // Recursively copy each entry
      for (const entry of entries) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        copyRecursive(srcPath, destPath);
      }
    } else {
      // Copy file directly
      fs.copyFileSync(src, dest);
    }
    return rootFiles
  }
const main = async () => {
    const dirs = fs.readdirSync('docs').filter(d => /^\d\d-G-/.test(d));
    const ignore = []
    dirs.forEach((d) => {
        copyRecursive(`docs/${d}`, 'src/pages/').forEach(e => ignore.push(e));
    });
    if (process.env.NODE_ENV === 'production') {
      console.log('cleanup docs');
      for (let i = 0; i < 2; i++) {
        dirs.forEach((d) => {
          try {
            fs.rmSync(`docs/${d}`, { recursive: true, force: true });
          } catch (e) {
            console.log('err', e);
          }
        });
      }
    }
    fs.writeFileSync('src/pages/.gitignore', ignore.map(d => `${d}/*`).join('\n'))
}

main()