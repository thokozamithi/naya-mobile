// Automated check: Warn if any navigation/button handler is missing in SpecialistProfileScreen
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'SpecialistProfileScreen.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'handleHire',
  'handleMessage',
  'navigation.navigate',
  'setActiveTab',
];

describe('SpecialistProfileScreen handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
