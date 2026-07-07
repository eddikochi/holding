/** Definição dos 12 módulos do Masterplan. Usada na navegação e na Home. */
import type { Pilar } from './models/types';

export interface Modulo {
  slug: string;
  num: string;
  nome: string;
  /** Pilar associado (diagnósticos 01–07). Módulos 08–12 não têm pilar único. */
  pilar?: Pilar;
  grupo: 'diagnostico' | 'decisao' | 'execucao';
}

export const MODULOS: Modulo[] = [
  { slug: 'patrimonial', num: '01', nome: 'Diagnóstico Patrimonial', pilar: 'patrimonial', grupo: 'diagnostico' },
  { slug: 'juridico', num: '02', nome: 'Diagnóstico Jurídico', pilar: 'juridico', grupo: 'diagnostico' },
  { slug: 'imobiliario', num: '03', nome: 'Diagnóstico Imobiliário', pilar: 'imobiliario', grupo: 'diagnostico' },
  { slug: 'economico', num: '04', nome: 'Diagnóstico Econômico', pilar: 'economico', grupo: 'diagnostico' },
  { slug: 'logistico', num: '05', nome: 'Diagnóstico Logístico', pilar: 'logistico', grupo: 'diagnostico' },
  { slug: 'agroindustrial', num: '06', nome: 'Diagnóstico Agroindustrial', pilar: 'agroindustrial', grupo: 'diagnostico' },
  { slug: 'turistico', num: '07', nome: 'Diagnóstico Turístico', pilar: 'turistico', grupo: 'diagnostico' },
  { slug: 'oportunidades', num: '08', nome: 'Oportunidades de Negócio', grupo: 'decisao' },
  { slug: 'priorizacao', num: '09', nome: 'Priorização', grupo: 'decisao' },
  { slug: 'business-cases', num: '10', nome: 'Business Cases', grupo: 'decisao' },
  { slug: 'roadmap', num: '11', nome: 'Roadmap de Implantação', grupo: 'execucao' },
  { slug: 'governanca', num: '12', nome: 'Governança Familiar', grupo: 'execucao' },
];

export function moduloPorSlug(slug: string): Modulo | undefined {
  return MODULOS.find((m) => m.slug === slug);
}
