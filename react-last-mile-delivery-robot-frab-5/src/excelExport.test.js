// @vitest-environment node
import { Workbook } from 'exceljs';
import { expect, test } from 'vitest';

test('exports an Excel workbook with conditional formatting', async () => {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet('Results');
  sheet.addRow(['Distance', 'Seconds']);
  sheet.addRow([42, 7]);
  sheet.addConditionalFormatting({
    ref: 'A2:A2',
    rules: [{
      type: 'dataBar',
      cfvo: [{ type: 'min' }, { type: 'max' }],
      color: { argb: 'FF638EC6' },
    }],
  });

  const data = await workbook.xlsx.writeBuffer();
  const restored = new Workbook();
  await restored.xlsx.load(data);

  expect(restored.getWorksheet('Results').getCell('A2').value).toBe(42);
  expect(restored.getWorksheet('Results').getCell('B2').value).toBe(7);
});
