import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import {
  salvarStakeholder, apagarStakeholder, stakeholderEmBranco,
  salvarEvidencia, evidenciaEmBranco,
} from '../../db/actions';
import { DISCOVERY_PILAR } from '../../content/discovery';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import type { Stakeholder, Pilar, Disposicao } from '../../models/types';

/**
 * Lista + CRUD de stakeholders (players) de um pilar. O modal de registro mostra
 * o roteiro de entrevista do pilar e a lista sugerida de tipos de player; as
 * respostas do roteiro viram evidências vinculadas à hipótese escolhida.
 */
export function StakeholdersPanel({ pilar, titulo, ajuda }: { pilar: Pilar; titulo: string; ajuda: string }) {
  const toast = useToast();
  const dados = useLiveQuery(async () => ({
    stakeholders: await db.stakeholders.where('pilar').equals(pilar).toArray(),
    hipoteses: await db.hipoteses.where('pilar').equals(pilar).toArray(),
  }), [pilar]);
  const [edit, setEdit] = useState<Stakeholder | null>(null);

  if (!dados) return <div className="panel">Carregando…</div>;
  const { stakeholders, hipoteses } = dados;

  return (
    <div className="panel">
      <div className="row-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{titulo} ({stakeholders.length})</h2>
        <button className="btn small" onClick={() => setEdit(stakeholderEmBranco(pilar))}>+ Novo</button>
      </div>
      <p style={{ color: 'var(--ink-soft)', marginTop: 4 }}>{ajuda}</p>
      {stakeholders.length === 0 ? (
        <EmptyState titulo="Nenhum registro ainda">Cadastre o primeiro, ou importe da ferramenta de campo. Ao registrar, você verá o roteiro de entrevista do pilar.</EmptyState>
      ) : (
        <table>
          <thead><tr><th>Nome</th><th>Tipo</th><th>Dor / oportunidade</th><th>Paga?</th><th></th></tr></thead>
          <tbody>
            {stakeholders.map((s) => (
              <tr key={s.id}>
                <td><b>{s.nome}</b><br /><span style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{s.local}</span></td>
                <td>{s.segmento}</td>
                <td>{s.dorOportunidade}</td>
                <td>{s.disposicao ?? '—'}{s.valorCitado ? ` (${s.valorCitado})` : ''}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn small secondary" onClick={() => setEdit(s)}>Editar</button>
                    <button className="btn small danger" onClick={async () => { if (confirm('Apagar?')) { await apagarStakeholder(s.id); toast('Apagado'); } }}>×</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {edit && <StakeholderModal stakeholder={edit} pilar={pilar} hipoteses={hipoteses} onFechar={() => setEdit(null)} />}
    </div>
  );
}

export function StakeholderModal({ stakeholder, pilar, hipoteses, onFechar }: {
  stakeholder: Stakeholder;
  pilar: Pilar;
  hipoteses: { id: string; enunciado: string }[];
  onFechar: () => void;
}) {
  const toast = useToast();
  const disc = DISCOVERY_PILAR[pilar];
  const tipos = disc?.tiposPlayers.map((t) => t.tipo) ?? [];
  const ehTipoConhecido = !stakeholder.segmento || tipos.includes(stakeholder.segmento);
  const [s, setS] = useState<Stakeholder>(stakeholder);
  const [segOutro, setSegOutro] = useState(ehTipoConhecido ? '' : stakeholder.segmento);
  const [usaOutro, setUsaOutro] = useState(!ehTipoConhecido);
  const [respostas, setRespostas] = useState<string[]>((disc?.roteiro ?? []).map(() => ''));
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!s.nome.trim()) { setErro('Preencha o nome.'); return; }
    const registro = { ...s, segmento: usaOutro ? segOutro : s.segmento };
    await salvarStakeholder(registro);
    // respostas do roteiro viram evidências (fonte entrevista), vinculadas à hipótese escolhida
    let criadas = 0;
    for (let i = 0; i < respostas.length; i++) {
      const r = respostas[i].trim();
      if (!r) continue;
      const ev = evidenciaEmBranco(pilar);
      ev.tipo = 'texto';
      ev.fonte = 'entrevista';
      ev.fonteDetalhe = `Entrevista — ${registro.nome}`;
      ev.conteudo = `${disc.roteiro[i]} — ${r}`;
      ev.stakeholderId = registro.id;
      ev.hipoteseId = registro.hipoteseId;
      await salvarEvidencia(ev);
      criadas++;
    }
    toast(criadas > 0 ? `Salvo · ${criadas} evidência(s) criada(s)` : 'Salvo');
    onFechar();
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{stakeholder.nome ? 'Editar' : 'Novo'} contato</h3>
        <div className="form-grid">
          <div><label>Nome</label><input type="text" value={s.nome} onChange={(e) => setS({ ...s, nome: e.target.value })} /></div>
          <div>
            <label>Tipo de player</label>
            <select
              value={usaOutro ? '__outro' : s.segmento}
              onChange={(e) => {
                if (e.target.value === '__outro') { setUsaOutro(true); }
                else { setUsaOutro(false); setS({ ...s, segmento: e.target.value }); }
              }}
            >
              <option value="">—</option>
              {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
              <option value="__outro">Outro…</option>
            </select>
            {usaOutro && <input type="text" placeholder="qual?" value={segOutro} onChange={(e) => setSegOutro(e.target.value)} style={{ marginTop: 4 }} />}
          </div>
          <div><label>Contato</label><input type="text" value={s.contato} onChange={(e) => setS({ ...s, contato: e.target.value })} /></div>
          <div><label>Local</label><input type="text" value={s.local} onChange={(e) => setS({ ...s, local: e.target.value })} /></div>
        </div>

        <label>Dor / oportunidade (resumo)</label>
        <textarea value={s.dorOportunidade} onChange={(e) => setS({ ...s, dorOportunidade: e.target.value })} />

        <div className="form-grid">
          <div><label>Disposição de pagamento</label>
            <select value={s.disposicao ?? ''} onChange={(e) => setS({ ...s, disposicao: (e.target.value || undefined) as Disposicao })}>
              <option value="">—</option><option value="sim">Sim</option><option value="talvez">Talvez</option><option value="nao">Não</option><option value="nao_perguntado">Não perguntado</option>
            </select>
          </div>
          <div><label>Valor citado</label><input type="text" value={s.valorCitado ?? ''} onChange={(e) => setS({ ...s, valorCitado: e.target.value })} /></div>
        </div>

        <label>Vincular à hipótese</label>
        <select value={s.hipoteseId ?? ''} onChange={(e) => setS({ ...s, hipoteseId: e.target.value || undefined })}>
          <option value="">— sem vínculo —</option>
          {hipoteses.map((h) => <option key={h.id} value={h.id}>{h.enunciado.slice(0, 45) || '(sem enunciado)'}</option>)}
        </select>

        {disc?.roteiro?.length > 0 && (
          <div style={{ marginTop: 12, borderTop: '1px solid var(--line)', paddingTop: 8 }}>
            <h4 style={{ margin: '0 0 4px' }}>Roteiro de entrevista</h4>
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 0 }}>Responda o que colheu na conversa. Cada resposta preenchida vira uma evidência vinculada à hipótese acima.</p>
            {disc.roteiro.map((q, i) => (
              <div key={i}>
                <label style={{ fontWeight: 400, textTransform: 'none' }}>{i + 1}. {q}</label>
                <textarea value={respostas[i]} onChange={(e) => setRespostas(respostas.map((r, idx) => idx === i ? e.target.value : r))} style={{ minHeight: 44 }} />
              </div>
            ))}
          </div>
        )}

        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
