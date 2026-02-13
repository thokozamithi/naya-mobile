// Automated check: Warn if any navigation/button handler is missing in UpgradeScreen
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'UpgradeScreen.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'navigation.navigate',
  'setSelectedPlan',
  'setSelectedPayment',
  'setSubmitting',
  'createSubscription',
];

describe('UpgradeScreen handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
