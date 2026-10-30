const fs = require('fs');

let chat = fs.readFileSync('src/app/api/chat/route.ts', 'utf8');

// 1. Add import
const oldImport = 'import { GoogleGenAI } from "@google/genai";';
const newImport = `import { GoogleGenAI } from "@google/genai";
import { parseAllocationIntent, parsePaymentIntent } from "@/lib/ai-intent";`;
chat = chat.replace(oldImport, newImport);

// 2. Remove parseAllocationIntent and parsePaymentIntent definitions
const startMarker = '    // Helper: Parse budget allocation intent and extract structured categories';
const endMarker = '    if (apiKey) {';

const startIdx = chat.indexOf(startMarker);
const endIdx = chat.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  chat = chat.slice(0, startIdx) + chat.slice(endIdx);
  // Update invocations to pass currencySymbol
  chat = chat.replace(/parseAllocationIntent\(message, event\?\.budget \|\| 50000\)/g, 'parseAllocationIntent(message, event?.budget || 50000, currencySymbol)');
  chat = chat.replace(/parsePaymentIntent\(message, currentVendors\)/g, 'parsePaymentIntent(message, currentVendors, currencySymbol)');

  fs.writeFileSync('src/app/api/chat/route.ts', chat, 'utf8');
  console.log('Successfully refactored src/app/api/chat/route.ts');
} else {
  console.error('Markers not found in src/app/api/chat/route.ts');
  process.exit(1);
}
