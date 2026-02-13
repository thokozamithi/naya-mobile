// Automated check: Warn if any navigation/button handler is missing in EmployeeDashboard
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'EmployeeDashboard.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'onLogoPress',
  'onRoleSwitch',
  'onSignOut',
  'navigation.navigate',
];

describe('EmployeeDashboard handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
