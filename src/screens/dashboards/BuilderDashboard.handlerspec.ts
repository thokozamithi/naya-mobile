// Automated check: Warn if any navigation/button handler is missing in BuilderDashboard
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'BuilderDashboard.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'onLogoPress',
  'onRoleSwitch',
  'onSignOut',
  'navigation.navigate',
];

describe('BuilderDashboard handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
