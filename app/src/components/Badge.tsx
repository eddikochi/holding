import type { Confianca, StatusHipotese } from '../models/types';

/** Badge de confiança de evidência (alta/média/baixa visualmente distintas). */
export function BadgeConfianca({ confianca }: { confianca: Confianca }) {
  const rotulo = { alta: 'Confiança alta', media: 'Confiança média', baixa: 'Confiança baixa' }[confianca];
  return <span className={`badge conf-${confianca}`}>{rotulo}</span>;
}

/** Badge de status de hipótese — nunca verde antes de validada. */
export function BadgeStatusHipotese({ status }: { status: StatusHipotese }) {
  const rotulo = {
    nao_validada: 'Não validada',
    parcial: 'Parcial',
    validada: 'Validada',
    refutada: 'Refutada',
  }[status];
  return <span className={`badge st-${status}`}>{rotulo}</span>;
}

/** Marca visual de "hipótese" (distinta de evidência e decisão). */
export function BadgeHipotese() {
  return <span className="badge hipotese">Hipótese</span>;
}

/** Marca visual de "decisão". */
export function BadgeDecisao() {
  return <span className="badge decisao">Decisão</span>;
}

/** Alerta de número sem fonte. */
export function BadgeSemFonte() {
  return <span className="badge sem-fonte">sem fonte</span>;
}
