// Automated check: Warn if any navigation/button handler is missing in RoleSelectionScreen
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'RoleSelectionScreen.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'navigation.navigate',
  'handleRoleSelect',
  'handleSignOut',
];

describe('RoleSelectionScreen handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
