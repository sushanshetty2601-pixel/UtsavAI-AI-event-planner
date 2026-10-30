const fs = require('fs');

// Fix seating.test.ts
let seating = fs.readFileSync('src/lib/__tests__/seating.test.ts', 'utf8');
seating = seating.replace('dietary: "veg",', 'dietary: "vegetarian",');
fs.writeFileSync('src/lib/__tests__/seating.test.ts', seating, 'utf8');
console.log('Fixed seating.test.ts');

// Fix ai-intent.test.ts
let aiIntent = fs.readFileSync('src/lib/__tests__/ai-intent.test.ts', 'utf8');
aiIntent = aiIntent.replace(/contactPerson: "([^"]+)",\s*phone: "([^"]+)",\s*email: "([^"]+)",/g, 'contactName: "$1", contactPhone: "$2", contactEmail: "$3",');
fs.writeFileSync('src/lib/__tests__/ai-intent.test.ts', aiIntent, 'utf8');
console.log('Fixed ai-intent.test.ts');
