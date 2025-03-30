const fs = require('fs');
const path = require('path');
const randomBytes = require('crypto').randomBytes;

// For alphanumeric only
function generateSecureAlphanumeric(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const bytes = randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  
  return result;
}
const GROUPS = ['G-1', 'G-2', 'G-3', 'G-4', 'G-5', 'G-6', 'G-7', 'G-8', 'G-9', 'G-10'];
const usedRoutes = new Set();
const URLS = GROUPS.reduce((acc, curr) => {
  const routes = Array(6).fill(null).map(() => generateSecureAlphanumeric());
  while (routes.some(r => usedRoutes.has(r))) {
    console.log('recalc')
    routes.splice(0, routes.length, Array(routes.length).fill(null).map(() => generateSecureAlphanumeric()))
  }
  routes.forEach(r => usedRoutes.add(r));
  acc[curr] = routes;
  return acc;
}, {});
console.log(JSON.stringify(URLS, null, 2))
const main = async () => {
    GROUPS.forEach((group, idx) => {
      const groupRoot = `docs/${group}`
      // fs.writeFileSync(`${groupRoot}/index.mdx`, `# Gruppe ${group}\n`);
      const routes = URLS[group];
      routes.forEach((r, idx) => {
        fs.mkdirSync(`${groupRoot}/${r}`, { recursive: true });
        const content = idx === 0 
          ? '# Rätsel' 
          : idx === 1 
            ? '# Richtige Antwort\n\nDu hast die richtige Antwort gefunden 🥳\n## Lösung\n\n## Hintergrundinformationen zum Rätsel\n\n## Nächstes Rätsel' 
            : `# Falsche Antwort 😑\n\nZurück zum [Rästel](https://mint-26e.gbsl.website/${routes[0]})`

        fs.writeFileSync(`${groupRoot}/${r}/index.mdx`, content);
      })
    });
}

main()