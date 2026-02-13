// Automated check: Warn if any navigation/button handler is missing in RegisterScreen
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'RegisterScreen.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'navigation.navigate',
  'handleRegister',
];

describe('RegisterScreen handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
