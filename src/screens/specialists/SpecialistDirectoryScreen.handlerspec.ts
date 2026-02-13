// Automated check: Warn if any navigation/button handler is missing in SpecialistDirectoryScreen
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'SpecialistDirectoryScreen.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'navigation.navigate',
  'handleContact',
];

describe('SpecialistDirectoryScreen handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
