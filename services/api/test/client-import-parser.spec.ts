import * as XLSX from 'xlsx';
import {
  analyzeClientSpreadsheet,
  detectHeaderRowIndex,
  normalizePhone,
  suggestColumnMapping,
} from '../src/modules/admin-master/client-import-parser';

/**
 * Reproduz o padrão real de export do AZ, byte a byte igual ao que o
 * arquivo real da Mix tem (confirmado lendo o arquivo real com a lib xlsx
 * diretamente) - "Módulo:" e o nome do módulo na MESMA linha, colunas de
 * dado com células vazias intercaladas (indício de merge de célula no
 * Excel original).
 */
function buildAzStyleClientBuffer(rows: (string | number)[][]): Buffer {
  const aoa = [
    ['MIX CONCEPT HAIR'],
    ['Clientes com E-Mail e Telefone'],
    ['Módulo:', 'Cadastros de Clientes'],
    ['Código', 'Nome', '', '', 'E-Mail', '', '', '', 'Telefones', ''],
    ...rows,
  ];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('client-import-parser', () => {
  describe('detectHeaderRowIndex', () => {
    it('skips report-title rows and finds the real header row', () => {
      const rows = [
        ['MIX CONCEPT HAIR'],
        ['Clientes com E-Mail e Telefone'],
        ['Módulo:'],
        ['Código', 'Nome', 'E-Mail', 'Telefones'],
        ['1', 'ALEXANDRA ONGARATTO', 'ale.ongaratto@gmail.com', 'Celular - (41) 99911-8599'],
      ];
      expect(detectHeaderRowIndex(rows)).toBe(3);
    });

    it('falls back to row 0 when nothing looks like a header', () => {
      expect(detectHeaderRowIndex([['only one cell']])).toBe(0);
    });

    it('regression: does not stop at a "Módulo: <nome>" metadata row that happens to have 2+ filled cells before the real header (found live, against the real Mix export)', () => {
      const rows = [
        ['MIX CONCEPT HAIR'],
        ['Clientes com E-Mail e Telefone'], // frase longa, contém "cliente"/"e-mail"/"telefone" por acidente
        ['Módulo:', 'Cadastros de Clientes'], // 2 células preenchidas, "cliente" por acidente - não é o cabeçalho
        ['Código', 'Nome', '', '', 'E-Mail', '', '', '', 'Telefones', ''],
        ['1', ',', '', '', 'evacparis2009@hotmail.com', '', '', '', 'Celular - (41) 99118-5995', ''],
      ];
      expect(detectHeaderRowIndex(rows)).toBe(3);
    });
  });

  describe('suggestColumnMapping', () => {
    it('maps Portuguese AZ-style headers by synonym', () => {
      const mapping = suggestColumnMapping(['Código', 'Nome', 'E-Mail', 'Telefones']);
      expect(mapping).toEqual({
        name: 'Nome',
        phone: 'Telefones',
        email: 'E-Mail',
        source: 'Código',
      });
    });

    it('returns null for fields with no matching header', () => {
      const mapping = suggestColumnMapping(['Alguma Coisa Irrelevante']);
      expect(mapping.name).toBeNull();
      expect(mapping.phone).toBeNull();
      expect(mapping.email).toBeNull();
    });
  });

  describe('normalizePhone', () => {
    it('extracts digits from a formatted Brazilian phone', () => {
      expect(normalizePhone('Celular - (41) 99118-5995')).toBe('41991185995');
    });

    it('returns null for too-short digit sequences', () => {
      expect(normalizePhone('123')).toBeNull();
    });

    it('returns null for empty/undefined input', () => {
      expect(normalizePhone(null)).toBeNull();
      expect(normalizePhone('')).toBeNull();
    });
  });

  describe('analyzeClientSpreadsheet', () => {
    it('classifies rows as IMPORTAVEL, PARCIAL, DUPLICADO and NAO_IMPORTAVEL correctly', () => {
      const buffer = buildAzStyleClientBuffer([
        ['1', 'ALEXANDRA ONGARATTO', '', '', 'ale.ongaratto@gmail.com', '', '', '', 'Celular - (41) 99911-8599', ''],
        ['2', 'KARIN MUNHOZ', '', '', 'Nao possui E-Mail', '', '', '', 'Celular - (41) 99243-2123', ''],
        ['3', 'CLIENTE SEM CONTATO', '', '', '', '', '', '', '', ''],
        ['4', '', '', '', 'sememail@example.com', '', '', '', '', ''],
        ['5', 'CLIENTE JA CADASTRADO', '', '', '', '', '', '', 'Celular - (41) 99999-0000', ''],
        // lixo de export real: nome vazio de fato, celula da coluna Nome so tem pontuacao
        ['6', ',', '', '', 'sobrou@example.com', '', '', '', '', ''],
      ]);

      const existingPhones = new Set(['41999990000']);
      const analysis = analyzeClientSpreadsheet(buffer, existingPhones);

      expect(analysis.recognized).toBe(true);
      expect(analysis.mapping).toEqual({
        name: 'Nome',
        phone: 'Telefones',
        email: 'E-Mail',
        source: 'Código',
      });
      expect(analysis.rows).toHaveLength(6);

      const [importavel, parcialSemEmail, semContato, semNome, duplicado, nomePontuacao] = analysis.rows;

      expect(importavel.status).toBe('IMPORTAVEL');
      expect(importavel.name).toBe('ALEXANDRA ONGARATTO');
      expect(importavel.phone).toBe('41999118599');
      expect(importavel.email).toBe('ale.ongaratto@gmail.com');

      // "Nao possui E-Mail" tratado como null, mas tem telefone -> ainda importável
      expect(parcialSemEmail.status).toBe('IMPORTAVEL');
      expect(parcialSemEmail.email).toBeNull();
      expect(parcialSemEmail.phone).toBe('41992432123');

      expect(semContato.status).toBe('PARCIAL');
      expect(semContato.reason).toMatch(/sem telefone nem e-mail/i);

      expect(semNome.status).toBe('NAO_IMPORTAVEL');
      expect(semNome.reason).toMatch(/sem nome/i);

      expect(duplicado.status).toBe('DUPLICADO');
      expect(duplicado.reason).toMatch(/já existe um cliente/i);

      // "," na coluna Nome não é um nome de verdade - trata igual a sem nome
      expect(nomePontuacao.status).toBe('NAO_IMPORTAVEL');
      expect(nomePontuacao.name).toBeNull();
    });

    it('ignores fully blank trailing rows without counting them as NAO_IMPORTAVEL', () => {
      const buffer = buildAzStyleClientBuffer([
        ['1', 'CLIENTE VALIDO', '', '', 'valido@example.com', '', '', '', '', ''],
        ['', '', '', '', '', '', '', '', '', ''],
      ]);
      const analysis = analyzeClientSpreadsheet(buffer, new Set());
      expect(analysis.rows).toHaveLength(1);
      expect(analysis.rows[0].status).toBe('IMPORTAVEL');
    });

    it('marks the file as not recognized when no name column can be mapped', () => {
      const aoa = [
        ['MIX CONCEPT HAIR'],
        ['Ticket Médio'],
        ['Valor Médio', 'Quantidade'],
        [89.9, 12],
      ];
      const sheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const analysis = analyzeClientSpreadsheet(buffer, new Set());
      expect(analysis.recognized).toBe(false);
      expect(analysis.rows).toHaveLength(0);
    });

    it('respects an explicit column mapping override', () => {
      const aoa = [
        ['Cliente', 'Fone'],
        ['MARIA SILVA', '41988887777'],
      ];
      const sheet = XLSX.utils.aoa_to_sheet(aoa);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

      const analysis = analyzeClientSpreadsheet(buffer, new Set(), { name: 'Cliente', phone: 'Fone' });
      expect(analysis.recognized).toBe(true);
      expect(analysis.rows[0].name).toBe('MARIA SILVA');
      expect(analysis.rows[0].phone).toBe('41988887777');
    });
  });
});
