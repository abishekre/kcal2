const fs = require('fs');
const glob = require('glob');

function removeUnused(path, replacements) {
  try {
    let content = fs.readFileSync(path, 'utf8');
    for (const [pattern, replacement] of replacements) {
      content = content.replace(pattern, replacement);
    }
    fs.writeFileSync(path, content);
  } catch (err) {
    console.error(`Skipping ${path}: ${err}`);
  }
}

removeUnused('scripts/seedSupabase.js', [
  [/const path = require\('path'\);\n/g, '']
]);

removeUnused('src/App.jsx', [
  [/import React, { useEffect, useState } from 'react';/, "import { useEffect, useState } from 'react';"],
  [/import { motion, AnimatePresence } from 'framer-motion';\n/, ""]
]);

const reactImports = [
  'src/__tests__/CustomMealSheet.test.jsx',
  'src/__tests__/DateNavigator.test.jsx',
  'src/__tests__/MealSection.test.jsx',
  'src/__tests__/QuickCalsSheet.test.jsx',
  'src/__tests__/RobotBanner.test.jsx',
  'src/components/Core/BottomNav.jsx',
  'src/components/Core/DateNavigator.jsx',
  'src/components/Core/TactileStepper.jsx',
  'src/components/Dashboard/CompactMacroBar.jsx',
  'src/components/Dashboard/MacroRing.jsx',
  'src/components/Dashboard/MealSection.jsx',
  'src/components/Sheets/QuickCalsSheet.jsx',
  'src/pages/Onboarding.jsx'
];

reactImports.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/import React(?:, { [^}]+ })? from 'react';/, (match) => {
      if (match.includes('{')) return match.replace(/React, /, '');
      return '';
    });
    content = content.replace(/import React from 'react';\n/, '');
    fs.writeFileSync(file, content);
  } catch (err) {}
});

removeUnused('src/__tests__/insights.test.js', [
  [/import { describe, it, expect } from 'vitest';/, "import { describe, it, expect, vi } from 'vitest';"]
]);

removeUnused('src/components/Sheets/CustomFoodSheet.jsx', [
  [/import { Plus, X, Search, Check } from 'lucide-react';/, "import { useState } from 'react';\nimport { Plus, X, Search, Check } from 'lucide-react';"]
]);

removeUnused('src/components/Sheets/CustomMealSheet.jsx', [
  [/import { Plus, X, Check } from 'lucide-react';/, "import { useState } from 'react';\nimport { Plus, X, Check } from 'lucide-react';"]
]);

removeUnused('src/components/Sheets/SettingsSheet.jsx', [
  [/import { motion, AnimatePresence } from 'framer-motion';\n/, ""],
  [/const activeSheet = useAppStore\(state => state\.activeSheet\);\n/, ""],
  [/const setActiveSheet = useAppStore\(state => state\.setActiveSheet\);\n/, ""]
]);

removeUnused('src/components/Sheets/TemplateSheet.jsx', [
  [/import { X, Save, Copy, Plus, Check } from 'lucide-react';/, "import { X, Save, Copy, Check } from 'lucide-react';"]
]);

removeUnused('src/components/Sheets/WeightLogSheet.jsx', [
  [/import { useState, useEffect } from 'react';/, "import { useState } from 'react';"]
]);

removeUnused('src/pages/ProgressPage.jsx', [
  [/import { ArrowLeft, TrendingDown, TrendingUp, Activity, Plus, Flame, Target, Calendar } from 'lucide-react';/, "import { TrendingDown, TrendingUp, Plus, Flame, Target, Calendar } from 'lucide-react';"],
  [/import { formatDateShort } from '\.\.\/utils\/dates';\n/, ""]
]);
