const fs = require('fs');
let code = fs.readFileSync('src/app/wizard/page.tsx', 'utf8');
code = code.replace(
  'import React, { useState, useEffect, Suspense } from "react";',
  'import React, { useState, Suspense } from "react";'
);
fs.writeFileSync('src/app/wizard/page.tsx', code, 'utf8');
console.log('Fixed wizard/page.tsx');
