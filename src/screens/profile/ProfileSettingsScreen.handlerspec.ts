// Automated check: Warn if any navigation/button handler is missing in ProfileSettingsScreen
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'ProfileSettingsScreen.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'onLogoPress',
  'onRoleSwitch',
  'onSignOut',
  'navigation.navigate',
];

describe('ProfileSettingsScreen handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
