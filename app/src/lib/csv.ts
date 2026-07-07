/**
 * Geração de CSV compatível com Excel pt-BR: separador ";" e BOM UTF-8.
 * Funções puras, testáveis sem browser.
 */

const BOM = '﻿';

export function csvCelula(valor: unknown): string {
  let s = valor == null ? '' : String(valor);
  if (/[";\n\r,]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export function montarCSV(cabecalho: string[], linhas: unknown[][]): string {
  const partes = [cabecalho.map(csvCelula).join(';')];
  for (const linha of linhas) {
    partes.push(linha.map(csvCelula).join(';'));
  }
  return BOM + partes.join('\r\n');
}
