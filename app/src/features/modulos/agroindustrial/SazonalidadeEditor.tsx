import { useEffect, useState } from 'react';
import { obterSazonalidade, salvarSazonalidade, sazonalidadeVazia } from '../../../db/actions';
import { useToast } from '../../../components/Toast';
import type { SazonalidadeMes, IntensidadeSazonal } from '../../../models/types';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const INTENSIDADES: { v: IntensidadeSazonal; r: string; cor: string }[] = [
  { v: 'nenhuma', r: 'Nenhuma', cor: 'var(--neutral-soft)' },
  { v: 'baixa', r: 'Baixa', cor: 'var(--blue-soft)' },
  { v: 'media', r: 'Média', cor: 'var(--amber-soft)' },
  { v: 'alta', r: 'Alta', cor: 'var(--green-soft)' },
];

/** Calendário anual simples de sazonalidade do agro (módulo 06), guardado em Config. */
export function SazonalidadeEditor() {
  const toast = useToast();
  const [meses, setMeses] = useState<SazonalidadeMes[]>(sazonalidadeVazia());

  useEffect(() => { obterSazonalidade().then(setMeses); }, []);

  function ciclar(mes: number) {
    const ordem: IntensidadeSazonal[] = ['nenhuma', 'baixa', 'media', 'alta'];
    const prox = meses.map((m) => {
      if (m.mes !== mes) return m;
      const i = ordem.indexOf(m.intensidade);
      return { ...m, intensidade: ordem[(i + 1) % ordem.length] };
    });
    setMeses(prox);
    salvarSazonalidade(prox);
  }
  function setNota(mes: number, nota: string) {
    setMeses(meses.map((m) => (m.mes === mes ? { ...m, nota } : m)));
  }

  return (
    <div className="panel">
      <h2>Sazonalidade (calendário anual)</h2>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Clique num mês para marcar a intensidade da demanda/atividade (nenhuma → baixa → média → alta). Salva automaticamente.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
        {meses.map((m) => {
          const info = INTENSIDADES.find((i) => i.v === m.intensidade)!;
          return (
            <button key={m.mes} onClick={() => ciclar(m.mes)} title={`${MESES[m.mes]}: ${info.r} (clique para mudar)`}
              style={{ background: info.cor, border: '1px solid var(--line)', borderRadius: 8, padding: '10px 4px', cursor: 'pointer', fontFamily: 'inherit' }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{MESES[m.mes]}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{info.r}</div>
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 12 }}>
        {meses.filter((m) => m.intensidade !== 'nenhuma').length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Marque os meses de pico e de baixa para desenhar o ciclo anual.</p>
        ) : (
          meses.filter((m) => m.intensidade !== 'nenhuma').map((m) => (
            <div key={m.mes} style={{ marginBottom: 6 }}>
              <label style={{ margin: 0 }}>{MESES[m.mes]} — anotação</label>
              <input type="text" value={m.nota} onChange={(e) => setNota(m.mes, e.target.value)} onBlur={() => { salvarSazonalidade(meses); toast('Sazonalidade salva'); }} placeholder="ex.: colheita da soja, pico de armazenagem" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
