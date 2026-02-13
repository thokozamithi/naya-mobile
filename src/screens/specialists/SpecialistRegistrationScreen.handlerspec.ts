// Automated check: Warn if any navigation/button handler is missing in SpecialistRegistrationScreen
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'SpecialistRegistrationScreen.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'setActiveTab',
  'setSaving',
  'navigation.navigate',
];

describe('SpecialistRegistrationScreen handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
