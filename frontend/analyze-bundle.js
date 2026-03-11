// Script per analizzare dimensioni bundle e trovare dipendenze pesanti
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Analisi dipendenze frontend...\n');

// Leggi package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')
);

const allDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

// Dimensioni approssimative note (in KB)
const knownSizes = {
  'react': 130,
  'react-dom': 130,
  'react-router-dom': 50,
  'bootstrap': 200,
  '@stripe/stripe-js': 90,
  '@stripe/react-stripe-js': 25,
  'axios': 30,
  'date-fns': 300, // ⚠️ PESANTE
  'lodash': 530, // ⚠️ MOLTO PESANTE
  'moment': 230, // ⚠️ DEPRECATO
  'recharts': 450, // ⚠️ PESANTE
  '@sentry/react': 80,
  'react-icons': 150,
  'react-bootstrap': 120,
  'framer-motion': 180,
  '@tanstack/react-query': 50,
  'zod': 60
};

console.log('📦 DIPENDENZE INSTALLATE:\n');

let totalEstimatedSize = 0;
let heavyDeps = [];

Object.keys(allDeps).forEach(dep => {
  const size = knownSizes[dep] || 0;
  totalEstimatedSize += size;
  
  if (size > 100) {
    heavyDeps.push({ name: dep, size });
  }
  
  const sizeInfo = size > 0 ? `~${size}KB` : '?KB';
  const warning = size > 200 ? ' ⚠️ PESANTE' : '';
  console.log(`  ${dep}: ${sizeInfo}${warning}`);
});

console.log(`\n📊 STIMA TOTALE: ~${totalEstimatedSize}KB`);

if (heavyDeps.length > 0) {
  console.log('\n🚨 DIPENDENZE PESANTI (>100KB):');
  heavyDeps.sort((a, b) => b.size - a.size);
  heavyDeps.forEach(dep => {
    console.log(`  ${dep.name}: ${dep.size}KB`);
  });
}

// Suggerimenti sostituzione
console.log('\n💡 POSSIBILI OTTIMIZZAZIONI:\n');

if (allDeps['moment']) {
  console.log('  ❌ moment (230KB) → ✅ date-fns (30KB con tree-shaking)');
}

if (allDeps['lodash']) {
  console.log('  ❌ lodash (530KB) → ✅ lodash-es (tree-shakeable)');
  console.log('     O usa funzioni native ES6+');
}

if (allDeps['recharts']) {
  console.log('  ℹ️  recharts (450KB) - considera lazy loading dei grafici');
}

if (allDeps['date-fns']) {
  console.log('  ✅ date-fns - usa solo le funzioni necessarie con import specifici:');
  console.log('     import { format, parseISO } from \'date-fns\';');
}

if (allDeps['react-icons']) {
  console.log('  ⚠️  react-icons - importa solo le icone usate:');
  console.log('     import { FaUser } from \'react-icons/fa\'; // NO import * as Icons');
}

console.log('\n🔧 COMANDI UTILI:\n');
console.log('  npm run build                    # Compila per produzione');
console.log('  npx vite-bundle-visualizer       # Visualizza bundle size');
console.log('  npx depcheck                     # Trova dipendenze inutilizzate');
console.log('  npx npm-check-updates -u         # Aggiorna dipendenze');

console.log('\n✅ Analisi completata!\n');
