/**
 * fileEncoding.ts - Lê o arquivo enviado no jeito certo
 * # Pra que serve?
 * - Muito banco brasileiro exporta CSV em Latin-1 (Windows-1252), e aí "Descrição" vira "Descri��o"
 * - Tenta UTF-8 primeiro; se aparecer caractere quebrado, lê de novo como Latin-1
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.0.0
 * Data: 2026-09-11
 * Alterações:
 * - v1.0.0 (2026-09-11): Implementação inicial
 */

const REPLACEMENT_CHARACTER = "�"

export function decodeTextFile(buffer: Buffer): string {
  const utf8 = buffer.toString("utf8")
  return utf8.includes(REPLACEMENT_CHARACTER) ? buffer.toString("latin1") : utf8
}
