/**
 * Zona 2, mapa (a) — evidência × validação. Derivação pura, testável sem browser.
 *
 * Regra confirmada no Gate 1 (SPEC Fase 5.1):
 *  - Eixo X (peso de evidência) = nº de vínculos que SUSTENTAM a hipótese (regra de ouro).
 *  - Eixo Y (grau de validação) = campo `status` da hipótese (explícito, nunca inferido de texto).
 *  - `refuta` = contador separado (badge); NUNCA subtrai do peso X.
 *  - `neutro` = ignorado nos eixos.
 *  - Tamanho da bolha = evidência acumulada (total de vínculos, qualquer efeito).
 *
 * Honestidade do vazio: sustenta = 0 é peso REAL 0 (0 ≠ vazio), não "não investigado".
 * O mapa mostra o estado atual como ele é — se não há hipótese validada, o quadrante
 * "validada" fica visivelmente vazio. Não se inventa validação para preencher quadrante.
 */
import { contarEfeitos } from './discovery';
import type { Hipotese, Evidencia, StatusHipotese, Pilar } from '../../models/types';

export interface PontoHipotese {
  id: string;
  codigo?: string;
  enunciado: string;
  pilares: Pilar[];
  /** Eixo X — peso de evidência (nº de vínculos que sustentam). */
  sustenta: number;
  /** Badge — nº de vínculos que refutam (não entra no eixo X). */
  refuta: number;
  /** Ignorado nos eixos, guardado para o total. */
  neutro: number;
  /** Tamanho da bolha — evidência acumulada (todos os vínculos). */
  totalVinculada: number;
  /** Eixo Y — grau de validação (campo explícito). */
  status: StatusHipotese;
}

export interface ResumoMapa {
  totalHipoteses: number;
  /** Hipóteses com ≥1 vínculo que sustenta. */
  comEvidencia: number;
  /** Hipóteses com sustenta === 0 (peso real 0). */
  semEvidencia: number;
  validadas: number;
  parciais: number;
  refutadas: number;
  /** Hipóteses com ≥1 vínculo que refuta. */
  comRefuta: number;
  /** Maior peso de evidência observado (para escalar o eixo X). */
  maxSustenta: number;
  /** Frase de síntese derivada do estado atual (muda sozinha com os dados). */
  sintese: string;
}

export interface MapaDecisao {
  pontos: PontoHipotese[];
  resumo: ResumoMapa;
}

/** Deriva os pontos do mapa e a síntese a partir das hipóteses e evidências. */
export function mapaEvidenciaValidacao(
  hipoteses: Hipotese[],
  evidencias: Evidencia[]
): MapaDecisao {
  const pontos: PontoHipotese[] = hipoteses.map((h) => {
    const c = contarEfeitos(h.id, evidencias);
    return {
      id: h.id,
      codigo: h.codigo,
      enunciado: h.enunciado,
      pilares: h.pilares ?? [],
      sustenta: c.sustenta,
      refuta: c.refuta,
      neutro: c.neutro,
      totalVinculada: c.sustenta + c.refuta + c.neutro,
      status: h.status,
    };
  });

  const total = pontos.length;
  const comEvidencia = pontos.filter((p) => p.sustenta > 0).length;
  const semEvidencia = total - comEvidencia;
  const validadas = pontos.filter((p) => p.status === 'validada').length;
  const parciais = pontos.filter((p) => p.status === 'parcial').length;
  const refutadas = pontos.filter((p) => p.status === 'refutada').length;
  const comRefuta = pontos.filter((p) => p.refuta > 0).length;
  const maxSustenta = pontos.reduce((m, p) => Math.max(m, p.sustenta), 0);

  return {
    pontos,
    resumo: {
      totalHipoteses: total,
      comEvidencia,
      semEvidencia,
      validadas,
      parciais,
      refutadas,
      comRefuta,
      maxSustenta,
      sintese: sintetizar({ total, comEvidencia, semEvidencia, validadas, comRefuta }),
    },
  };
}

/**
 * Frase de síntese honesta, derivada do estado. Ordem de gargalo:
 * sem hipótese → sem evidência → sem validação → validar as que têm base → base sólida.
 */
function sintetizar(s: {
  total: number;
  comEvidencia: number;
  semEvidencia: number;
  validadas: number;
  comRefuta: number;
}): string {
  if (s.total === 0) return 'Nenhuma hipótese cadastrada ainda — comece registrando as apostas do diagnóstico.';

  // Toda parte da frase deriva das contagens; nenhuma é fixa. Muda sozinha com o dado.
  const plural = (n: number) => (n === 1 ? '' : 's');
  const base = `${s.comEvidencia} de ${s.total} hipóteses têm evidência que sustenta; ${s.validadas} validada${plural(s.validadas)}.`;

  let gargalo: string;
  if (s.comEvidencia === 0) {
    gargalo = 'Reunir evidência é o próximo gargalo.';
  } else if (s.validadas === 0) {
    gargalo = 'Validação é o próximo gargalo: a evidência acumula sem virar decisão.';
  } else if (s.comEvidencia > s.validadas) {
    gargalo = 'Validar as que já têm base é o próximo passo.';
  } else {
    gargalo = 'Base sólida — o foco agora é decidir.';
  }

  const refuta = s.comRefuta > 0
    ? ` Atenção: ${s.comRefuta} hipótese${plural(s.comRefuta)} com evidência que refuta.`
    : '';
  return `${base} ${gargalo}${refuta}`;
}
