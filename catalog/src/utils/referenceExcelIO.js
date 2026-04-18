/**
 * Export / import reference dataset child tables as Excel (.xlsx).
 * One worksheet per table; first row = column headers; following rows = data.
 */

import * as XLSX from 'xlsx';

/** Excel sheet name cannot contain: \ / ? * [ ] : */
const INVALID_SHEET_CHARS = /[\u005C\u002F\u002A\u003F\u005B\u005D\u003A]/g;

function sanitizeSheetName(name, index) {
  let s = String(name || 'Table')
    .replace(INVALID_SHEET_CHARS, '_')
    .trim()
    .slice(0, 31);
  if (!s) s = `Table_${index + 1}`;
  return s;
}

function sanitizeFilename(name) {
  return String(name || 'reference')
    .replace(/[^\w-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80) || 'reference';
}

function deriveColumnsFromTable(table) {
  if (!table) return [];
  const declared = Array.isArray(table.columns)
    ? table.columns.filter(Boolean).map(String)
    : [];
  if (declared.length) return declared;
  const sample = table.rows?.[0];
  return sample && typeof sample === 'object' ? Object.keys(sample) : [];
}

/**
 * @param {{ name?: string, id?: string }} ref
 * @param {Array<{ id?: string, name?: string, columns?: string[], rows?: object[] }>} childTables
 */
export function exportReferenceDatasetToExcel(ref, childTables) {
  const tables = Array.isArray(childTables) ? childTables : [];
  const wb = XLSX.utils.book_new();
  const usedNames = new Set();

  tables.forEach((table, index) => {
    const cols = deriveColumnsFromTable(table);
    const rows = Array.isArray(table.rows) ? table.rows : [];
    const headerRow = cols.length ? cols : ['_empty'];
    const dataRows = rows.map((r) => headerRow.map((c) => (r && r[c] != null ? r[c] : '')));
    const aoa = [headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    let baseName = sanitizeSheetName(table.name || table.id, index);
    let name = baseName;
    let n = 2;
    while (usedNames.has(name)) {
      const suffix = `_${n++}`;
      name = `${baseName.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`;
    }
    usedNames.add(name);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['_empty'], ['']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Empty');
  }

  const fname = `${sanitizeFilename(ref?.name || ref?.id)}_reference.xlsx`;
  XLSX.writeFile(wb, fname);
}

/**
 * @param {File} file
 * @returns {Promise<Array<{ id: string, name: string, columns: string[], rows: object[], rowCount: number }>>}
 */
export function importReferenceExcelFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: false });
        if (!wb.SheetNames?.length) {
          reject(new Error('The workbook has no sheets.'));
          return;
        }
        const tables = [];
        wb.SheetNames.forEach((sheetName, idx) => {
          const ws = wb.Sheets[sheetName];
          const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
          if (!aoa.length) return;
          const rawHeader = aoa[0].map((h) => String(h ?? '').trim());
          const headers = rawHeader.map((h, i) => h || `column_${i + 1}`);
          const bodyRows = aoa.slice(1).map((row) => {
            const o = {};
            headers.forEach((h, i) => {
              o[h] = row[i] != null && row[i] !== '' ? row[i] : '';
            });
            return o;
          });
          const id = `herd_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 9)}`;
          tables.push({
            id,
            name: sheetName,
            columns: headers,
            rows: bodyRows,
            rowCount: bodyRows.length,
          });
        });
        if (!tables.length) {
          reject(new Error('No data found in the workbook.'));
          return;
        }
        resolve(tables);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsArrayBuffer(file);
  });
}
