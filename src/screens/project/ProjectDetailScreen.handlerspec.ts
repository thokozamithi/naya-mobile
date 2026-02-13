// Automated check: Warn if any navigation/button handler is missing in ProjectDetailScreen
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'ProjectDetailScreen.tsx');
const code = fs.readFileSync(filePath, 'utf8');

const requiredHandlers = [
  'navigation.navigate',
  'navigation.goBack',
  'handleEditProject',
  'handleUpdateProgress',
  'handleAddUpdate',
];

describe('ProjectDetailScreen handler detector', () => {
  requiredHandlers.forEach(handler => {
    it(`should have handler: ${handler}`, () => {
      expect(code.includes(handler)).toBe(true);
    });
  });
});
