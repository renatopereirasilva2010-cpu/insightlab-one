import * as XLSX from 'xlsx';

export type ClientImportRowStatus = 'IMPORTAVEL' | 'PARCIAL' | 'DUPLICADO' | 'NAO_IMPORTAVEL';

export interface ClientImportRow {
  rowIndex: number;
  raw: Record<string, string>;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: ClientImportRowStatus;
  reason: string;
}

export interface ClientImportColumnMapping {
  name: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
}

export interface ClientImportAnalysis {
  recognized: boolean;
  headers: string[];
  mapping: ClientImportColumnMapping;
  rows: ClientImportRow[];
}

const FIELD_SYNONYMS: Record<keyof ClientImportColumnMapping, string[]> = {
  name: ['nome', 'cliente', 'name'],
  phone: ['telefone', 'telefones', 'celular', 'fone', 'whatsapp', 'phone', 'contato'],
  email: ['email', 'e-mail', 'mail'],
  source: ['codigo', 'código', 'id', 'source', 'cod'],
};

/** Remove acentos e normaliza pra minúsculo, pra comparar nomes de coluna sem depender de acentuação exata. */
function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function isBlankCell(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  const text = String(value).trim();
  return text === '' || text === '-';
}

/**
 * Acha a linha real de cabeçalho de coluna. Exports do AZ (e de sistemas
 * parecidos) trazem um bloco de cabeçalho de relatório antes (nome da
 * empresa, título, período) - a linha de cabeçalho de verdade é a primeira
 * com pelo menos 2 células preenchidas cuja linha seguinte também tem pelo
 * menos 2 células preenchidas (indício de tabela de dados começando).
 */
export function detectHeaderRowIndex(rows: unknown[][]): number {
  const limit = Math.min(rows.length - 1, 20);
  for (let i = 0; i < limit; i++) {
    const nonEmpty = (rows[i] ?? []).filter((c) => !isBlankCell(c));
    const nextNonEmpty = (rows[i + 1] ?? []).filter((c) => !isBlankCell(c));
    if (nonEmpty.length >= 2 && nextNonEmpty.length >= 2) {
      return i;
    }
  }
  return 0;
}

/** Sugere o mapeamento coluna -> campo por similaridade de nome de cabeçalho (não é IA, é dicionário de sinônimos comuns em PT-BR). */
export function suggestColumnMapping(headers: string[]): ClientImportColumnMapping {
  const normalized = headers.map(normalizeHeader);
  const mapping: ClientImportColumnMapping = { name: null, phone: null, email: null, source: null };

  for (const field of Object.keys(FIELD_SYNONYMS) as (keyof ClientImportColumnMapping)[]) {
    const synonyms = FIELD_SYNONYMS[field];
    const matchIndex = normalized.findIndex((h) => synonyms.some((s) => h.includes(s)));
    if (matchIndex >= 0) mapping[field] = headers[matchIndex];
  }

  return mapping;
}

/** Extrai só os dígitos de um telefone formatado (ex.: "Celular - (41) 99118-5995" -> "41991185995"). Vazio se não sobrar nada útil. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 8 ? digits : null;
}

/** Trata placeholders comuns de "sem dado" ("Nao possui E-Mail", espaço em branco, etc.) como null. */
function cleanCell(raw: unknown): string | null {
  if (isBlankCell(raw)) return null;
  const text = String(raw).trim();
  if (/^n[aã]o possui/i.test(text)) return null;
  return text;
}

/**
 * Faz o parse de um buffer de planilha (CSV/XLS/XLSX, mesma API via xlsx/
 * SheetJS) e classifica cada linha como candidata a virar um Client.
 * Não escreve no banco - é só análise/preview. overrideMapping permite o
 * usuário corrigir a sugestão automática antes de confirmar.
 */
export function analyzeClientSpreadsheet(
  buffer: Buffer,
  existingPhones: Set<string>,
  overrideMapping?: Partial<ClientImportColumnMapping>,
): ClientImportAnalysis {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

  const headerRowIndex = detectHeaderRowIndex(rows);
  const headers = (rows[headerRowIndex] ?? []).map((h) => String(h ?? '').trim());
  const autoMapping = suggestColumnMapping(headers);
  const mapping: ClientImportColumnMapping = { ...autoMapping, ...overrideMapping };

  const nameIdx = mapping.name ? headers.indexOf(mapping.name) : -1;
  const phoneIdx = mapping.phone ? headers.indexOf(mapping.phone) : -1;
  const emailIdx = mapping.email ? headers.indexOf(mapping.email) : -1;
  const sourceIdx = mapping.source ? headers.indexOf(mapping.source) : -1;

  const recognized = nameIdx >= 0;
  const dataRows = rows.slice(headerRowIndex + 1);

  const classified: ClientImportRow[] = [];
  if (recognized) {
    dataRows.forEach((row, i) => {
      const rawRecord: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rawRecord[h || `coluna_${idx + 1}`] = String(row[idx] ?? '').trim();
      });

      const name = cleanCell(row[nameIdx]);
      const phone = normalizePhone(cleanCell(phoneIdx >= 0 ? row[phoneIdx] : null));
      const email = cleanCell(emailIdx >= 0 ? row[emailIdx] : null);

      // linha completamente vazia (comum no fim de exports do AZ) - ignora sem contar como "não importável"
      if (!name && !phone && !email && Object.values(rawRecord).every((v) => v === '')) {
        return;
      }

      let status: ClientImportRowStatus;
      let reason: string;

      if (!name) {
        status = 'NAO_IMPORTAVEL';
        reason = 'Sem nome do cliente — não é possível criar o cadastro.';
      } else if (phone && existingPhones.has(phone)) {
        status = 'DUPLICADO';
        reason = 'Já existe um cliente com este telefone — não será duplicado.';
      } else if (!phone && !email) {
        status = 'PARCIAL';
        reason = 'Sem telefone nem e-mail — pode ser importado só com o nome; complete o contato depois em Clientes.';
      } else {
        status = 'IMPORTAVEL';
        reason = 'Nome e pelo menos um contato — pronto pra importar.';
      }

      classified.push({
        rowIndex: headerRowIndex + 1 + i,
        raw: rawRecord,
        name,
        phone,
        email,
        status,
        reason,
      });
    });
  }

  void sourceIdx; // reservado pra uso futuro (campo "source" do Client), não usado na classificação em si

  return { recognized, headers, mapping, rows: classified };
}
