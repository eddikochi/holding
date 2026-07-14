import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/database';
import { salvarAtivo, apagarAtivo, ativoEmBranco } from '../../../db/actions';
import { EmptyState } from '../../../components/EmptyState';
import { useToast } from '../../../components/Toast';
import { AtivosMapa } from './AtivosMapa';
import { novoId } from '../../../lib/ids';
import { PILARES } from '../../../models/types';
import type {
  Ativo, TipoAtivo, Pilar, Unidade, RelacaoUnidade,
  StatusVisitaAtivo, StatusVisitaUnidade, TipoRelacaoUnidade,
} from '../../../models/types';

const TIPOS: { v: TipoAtivo; r: string }[] = [
  { v: 'galpao', r: 'Galpão' }, { v: 'terreno', r: 'Terreno' }, { v: 'loja', r: 'Loja' },
  { v: 'oficina', r: 'Oficina' }, { v: 'outro', r: 'Outro' },
];

const STATUS_ATIVO: { v: StatusVisitaAtivo; r: string }[] = [
  { v: 'a_visitar', r: 'A visitar' }, { v: 'visitado', r: 'Visitado' }, { v: 'parcial', r: 'Parcial' },
];
const STATUS_UNIDADE: { v: StatusVisitaUnidade; r: string }[] = [
  { v: 'a_visitar', r: 'A visitar' }, { v: 'visitado', r: 'Visitado' },
];
const TIPOS_RELACAO: { v: TipoRelacaoUnidade; r: string }[] = [
  { v: 'agua', r: 'Água' }, { v: 'energia', r: 'Energia' }, { v: 'acesso', r: 'Acesso' }, { v: 'outro', r: 'Outro' },
];

function unidadeEmBranco(): Unidade {
  return { id: novoId(), nome: '', statusVisita: 'a_visitar' };
}

/** Aba "Dados" do módulo 01 Patrimonial — inventário de ativos + ficha + potencial por pilar. */
export function PatrimonialDados() {
  const toast = useToast();
  const ativos = useLiveQuery(() => db.ativos.toArray());
  const [edit, setEdit] = useState<Ativo | null>(null);

  if (!ativos) return <div className="panel">Carregando…</div>;

  return (
    <div>
      <div className="panel">
        <div className="row-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Inventário de ativos ({ativos.length})</h2>
          <button className="btn small" onClick={() => setEdit(ativoEmBranco())}>+ Novo ativo</button>
        </div>
        {ativos.length === 0 ? (
          <EmptyState titulo="Nenhum ativo cadastrado">
            Comece cadastrando os imóveis da família (galpão, terrenos, loja, oficina) ou importe da
            ferramenta de campo. Cada ativo vira uma ficha usada por todos os outros diagnósticos.
          </EmptyState>
        ) : (
          <table>
            <thead><tr><th>Nome</th><th>Tipo</th><th>Endereço</th><th>Área</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {ativos.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.nome || '(sem nome)'}</b></td>
                  <td>{TIPOS.find((t) => t.v === a.tipo)?.r ?? a.tipo}</td>
                  <td>{a.endereco}</td>
                  <td>{a.metragens.construidaM2 ? `${a.metragens.construidaM2} m²` : a.metragens.terrenoM2 ? `${a.metragens.terrenoM2} m² (terreno)` : '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--ink-soft)', maxWidth: 180 }}>{(a.estadoFisico || '').slice(0, 60)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn small secondary" onClick={() => setEdit(a)}>Editar</button>
                      <button className="btn small danger" onClick={async () => { if (confirm(`Apagar "${a.nome}"?`)) { await apagarAtivo(a.id); toast('Ativo apagado'); } }}>×</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2>Potencial por pilar</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>
          Onde cada ativo pode gerar oportunidade. Resumo do que você anotou na ficha de cada um.
        </p>
        {ativos.length === 0 ? (
          <div className="empty-state"><p>Cadastre ativos para ver o resumo de potencial.</p></div>
        ) : (
          <table>
            <thead><tr><th>Ativo</th>{PILARES.map((p) => <th key={p.chave}>{p.rotulo}</th>)}</tr></thead>
            <tbody>
              {ativos.map((a) => (
                <tr key={a.id}>
                  <td><b>{a.nome || '(sem nome)'}</b></td>
                  {PILARES.map((p) => (
                    <td key={p.chave} style={{ fontSize: 11 }}>
                      {a.potencialPorPilar[p.chave] ? '●' : <span style={{ color: 'var(--line)' }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel">
        <h2>Mapa dos ativos</h2>
        <p style={{ color: 'var(--ink-soft)', marginTop: 0 }}>Ativos com lat/lng plotados sobre o OpenStreetMap. Sem internet, vira lista automaticamente.</p>
        <AtivosMapa ativos={ativos} />
      </div>

      {edit && <AtivoModal ativo={edit} onFechar={() => setEdit(null)} />}
    </div>
  );
}

function AtivoModal({ ativo, onFechar }: { ativo: Ativo; onFechar: () => void }) {
  const toast = useToast();
  const [a, setA] = useState<Ativo>(ativo);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    if (!a.nome.trim()) { setErro('Preencha o nome do ativo.'); return; }
    await salvarAtivo(a); toast('Ativo salvo'); onFechar();
  }
  function setMetragem(campo: 'terrenoM2' | 'construidaM2' | 'peDireitoM', v: string) {
    const n = v === '' ? undefined : parseFloat(v.replace(',', '.'));
    setA({ ...a, metragens: { ...a.metragens, [campo]: isNaN(n as number) ? undefined : n } });
  }
  function setPotencial(p: Pilar, v: string) {
    setA({ ...a, potencialPorPilar: { ...a.potencialPorPilar, [p]: v } });
  }

  return (
    <div className="modal-backdrop" onClick={onFechar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{ativo.nome ? 'Editar ativo' : 'Novo ativo'}</h3>
        <div className="form-grid">
          <div><label>Nome</label><input type="text" value={a.nome} onChange={(e) => setA({ ...a, nome: e.target.value })} /></div>
          <div><label>Tipo</label>
            <select value={a.tipo} onChange={(e) => setA({ ...a, tipo: e.target.value as TipoAtivo })}>
              {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.r}</option>)}
            </select>
          </div>
        </div>
        <label>Endereço</label><input type="text" value={a.endereco} onChange={(e) => setA({ ...a, endereco: e.target.value })} />
        <div className="form-grid">
          <div><label>Terreno (m²)</label><input type="text" value={a.metragens.terrenoM2 ?? ''} onChange={(e) => setMetragem('terrenoM2', e.target.value)} /></div>
          <div><label>Construída (m²)</label><input type="text" value={a.metragens.construidaM2 ?? ''} onChange={(e) => setMetragem('construidaM2', e.target.value)} /></div>
          <div><label>Pé direito (m)</label><input type="text" value={a.metragens.peDireitoM ?? ''} onChange={(e) => setMetragem('peDireitoM', e.target.value)} /></div>
          <div><label>Lat, Lng (opcional)</label>
            <input type="text" placeholder="-28.66, -56.00"
              value={a.lat != null ? `${a.lat}, ${a.lng ?? ''}` : ''}
              onChange={(e) => {
                const [la, ln] = e.target.value.split(',').map((x) => parseFloat(x.trim()));
                setA({ ...a, lat: isNaN(la) ? undefined : la, lng: isNaN(ln) ? undefined : ln });
              }} />
          </div>
        </div>
        <label>Estado físico</label><textarea value={a.estadoFisico} onChange={(e) => setA({ ...a, estadoFisico: e.target.value })} />
        <label>Situação jurídica (resumo)</label><input type="text" value={a.situacaoJuridicaResumo} onChange={(e) => setA({ ...a, situacaoJuridicaResumo: e.target.value })} />
        <div className="form-grid">
          <div><label>Status de visita</label>
            <select value={a.statusVisita ?? 'a_visitar'} onChange={(e) => setA({ ...a, statusVisita: e.target.value as StatusVisitaAtivo })}>
              {STATUS_ATIVO.map((s) => <option key={s.v} value={s.v}>{s.r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 400, textTransform: 'none', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!a.ehSubdividido} onChange={(e) => setA({ ...a, ehSubdividido: e.target.checked })} style={{ width: 'auto' }} />
              Prédio subdividido em unidades locáveis
            </label>
          </div>
        </div>
        {a.ehSubdividido && (
          <UnidadesEditor unidades={a.unidades ?? []} onChange={(unidades) => setA({ ...a, unidades })} />
        )}
        <label style={{ marginTop: 16 }}>Potencial por pilar (deixe em branco se não se aplica)</label>
        <div className="form-grid">
          {PILARES.map((p) => (
            <div key={p.chave}>
              <label style={{ fontWeight: 400, textTransform: 'none' }}>{p.rotulo}</label>
              <input type="text" value={a.potencialPorPilar[p.chave] ?? ''} onChange={(e) => setPotencial(p.chave, e.target.value)} />
            </div>
          ))}
        </div>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="row-actions" style={{ marginTop: 16 }}>
          <button className="btn" onClick={salvar}>Salvar</button>
          <button className="btn ghost" onClick={onFechar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/** Lista editável de unidades locáveis de um ativo subdividido. */
function UnidadesEditor({ unidades, onChange }: { unidades: Unidade[]; onChange: (u: Unidade[]) => void }) {
  function atualizar(id: string, patch: Partial<Unidade>) {
    onChange(unidades.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }
  function remover(id: string) {
    // ao remover uma unidade, limpa relações de outras unidades que a referenciavam
    const restantes = unidades
      .filter((u) => u.id !== id)
      .map((u) =>
        u.relacoes
          ? { ...u, relacoes: u.relacoes.map((r) => (r.alvoUnidadeId === id ? { ...r, alvoUnidadeId: undefined } : r)) }
          : u
      );
    onChange(restantes);
  }
  function adicionar() {
    onChange([...unidades, unidadeEmBranco()]);
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="row-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ margin: 0 }}>Unidades ({unidades.length})</label>
        <button type="button" className="btn small secondary" onClick={adicionar}>+ Adicionar unidade</button>
      </div>
      {unidades.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13, marginTop: 6 }}>
          Nenhuma unidade ainda. Adicione as lojas/salas locáveis deste prédio.
        </p>
      )}
      {unidades.map((u, i) => (
        <UnidadeCard
          key={u.id}
          indice={i}
          unidade={u}
          outras={unidades.filter((o) => o.id !== u.id)}
          onChange={(patch) => atualizar(u.id, patch)}
          onRemover={() => remover(u.id)}
        />
      ))}
    </div>
  );
}

/** Ficha de uma unidade: campos próprios + potencial por pilar + relações físicas. */
function UnidadeCard({
  indice, unidade: u, outras, onChange, onRemover,
}: {
  indice: number;
  unidade: Unidade;
  outras: Unidade[];
  onChange: (patch: Partial<Unidade>) => void;
  onRemover: () => void;
}) {
  function setMetragem(campo: 'construidaM2' | 'peDireitoM', v: string) {
    const n = v === '' ? undefined : parseFloat(v.replace(',', '.'));
    onChange({ metragens: { ...u.metragens, [campo]: isNaN(n as number) ? undefined : n } });
  }
  function setPotencial(p: Pilar, v: string) {
    onChange({ potencialPorPilar: { ...u.potencialPorPilar, [p]: v } });
  }
  const relacoes = u.relacoes ?? [];
  function setRelacao(idx: number, patch: Partial<RelacaoUnidade>) {
    onChange({ relacoes: relacoes.map((r, i) => (i === idx ? { ...r, ...patch } : r)) });
  }
  function addRelacao() {
    onChange({ relacoes: [...relacoes, { tipo: 'energia', descricao: '' }] });
  }
  function removerRelacao(idx: number) {
    onChange({ relacoes: relacoes.filter((_, i) => i !== idx) });
  }

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-panel)', padding: 'var(--s3)', marginTop: 'var(--s2)' }}>
      <div className="row-actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ fontSize: 13 }}>{u.nome.trim() || `Unidade ${indice + 1}`}</b>
        <button type="button" className="btn small danger" onClick={onRemover}>Remover</button>
      </div>
      <div className="form-grid">
        <div><label>Nome</label><input type="text" value={u.nome} onChange={(e) => onChange({ nome: e.target.value })} /></div>
        <div><label>Status de visita</label>
          <select value={u.statusVisita} onChange={(e) => onChange({ statusVisita: e.target.value as StatusVisitaUnidade })}>
            {STATUS_UNIDADE.map((s) => <option key={s.v} value={s.v}>{s.r}</option>)}
          </select>
        </div>
        <div><label>Locatário</label><input type="text" value={u.locatario ?? ''} onChange={(e) => onChange({ locatario: e.target.value || undefined })} /></div>
        <div><label>Contato</label><input type="text" value={u.contato ?? ''} onChange={(e) => onChange({ contato: e.target.value || undefined })} /></div>
        <div><label>Construída (m²)</label><input type="text" value={u.metragens?.construidaM2 ?? ''} onChange={(e) => setMetragem('construidaM2', e.target.value)} /></div>
        <div><label>Pé direito (m)</label><input type="text" value={u.metragens?.peDireitoM ?? ''} onChange={(e) => setMetragem('peDireitoM', e.target.value)} /></div>
      </div>
      <label>Estado físico</label>
      <textarea value={u.estadoFisico ?? ''} onChange={(e) => onChange({ estadoFisico: e.target.value || undefined })} />
      <label>Situação jurídica (resumo)</label>
      <input type="text" value={u.situacaoJuridicaResumo ?? ''} onChange={(e) => onChange({ situacaoJuridicaResumo: e.target.value || undefined })} />
      <label style={{ marginTop: 12 }}>Potencial por pilar da unidade (deixe em branco se não se aplica)</label>
      <div className="form-grid">
        {PILARES.map((p) => (
          <div key={p.chave}>
            <label style={{ fontWeight: 400, textTransform: 'none' }}>{p.rotulo}</label>
            <input type="text" value={u.potencialPorPilar?.[p.chave] ?? ''} onChange={(e) => setPotencial(p.chave, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="row-actions" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <label style={{ margin: 0 }}>Relações físicas com outras unidades</label>
        <button type="button" className="btn small secondary" onClick={addRelacao}>+ Relação</button>
      </div>
      {relacoes.length === 0 && (
        <p style={{ color: 'var(--ink-soft)', fontSize: 12, marginTop: 6 }}>
          Ex.: “recebe energia da U3”, “água unificada do prédio”, “transição vedada com parede”.
        </p>
      )}
      {relacoes.map((r, idx) => (
        <div key={idx} className="form-grid" style={{ alignItems: 'end' }}>
          <div><label>Tipo</label>
            <select value={r.tipo} onChange={(e) => setRelacao(idx, { tipo: e.target.value as TipoRelacaoUnidade })}>
              {TIPOS_RELACAO.map((t) => <option key={t.v} value={t.v}>{t.r}</option>)}
            </select>
          </div>
          <div><label>Unidade alvo (opcional)</label>
            <select value={r.alvoUnidadeId ?? ''} onChange={(e) => setRelacao(idx, { alvoUnidadeId: e.target.value || undefined })}>
              <option value="">— prédio / genérica —</option>
              {outras.map((o) => <option key={o.id} value={o.id}>{o.nome.trim() || 'Unidade sem nome'}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'end' }}>
            <div style={{ flex: 1 }}><label>Descrição</label><input type="text" value={r.descricao} onChange={(e) => setRelacao(idx, { descricao: e.target.value })} /></div>
            <button type="button" className="btn small danger" onClick={() => removerRelacao(idx)}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}
