import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/database';
import { limparTudo } from '../../db/repository';
import {
  importarCampo,
  previewDoResultado,
  analisarAplicacao,
  type ResultadoImport,
  type PreviewImport,
  type AnaliseAplicacao,
} from '../../db/importCampo';
import { PageHeader } from '../../components/PageHeader';
import { useToast } from '../../components/Toast';

type Modo = 'mesclar' | 'substituir';

/** Fluxo de import da ferramenta de campo: arquivo → preview (criar/atualizar) → confirmar. */
export function Importar() {
  const toast = useToast();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const [preview, setPreview] = useState<PreviewImport | null>(null);
  const [analise, setAnalise] = useState<AnaliseAplicacao | null>(null);
  const [modo, setModo] = useState<Modo>('mesclar');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  function aoEscolherArquivo(ev: React.ChangeEvent<HTMLInputElement>) {
    setErro(null); setResultado(null); setPreview(null); setAnalise(null);
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const res = importarCampo(parsed);
        if (res.formato === 'desconhecido') {
          setErro('Não reconheci o formato deste arquivo. Ele precisa vir da ferramenta de campo (formato principal {ativos, stakeholders, registros} ou o formato antigo do Hub {galpao, players, registros}).');
          return;
        }
        // busca IDs já existentes para dizer o que será criado vs. atualizado
        const [ativos, stakeholders, evidencias, hipoteses] = await Promise.all([
          db.ativos.toCollection().primaryKeys(),
          db.stakeholders.toCollection().primaryKeys(),
          db.evidencias.toCollection().primaryKeys(),
          db.hipoteses.toCollection().primaryKeys(),
        ]);
        const existentes = {
          ativos: new Set(ativos as string[]),
          stakeholders: new Set(stakeholders as string[]),
          evidencias: new Set(evidencias as string[]),
          hipoteses: new Set(hipoteses as string[]),
        };
        setResultado(res);
        setPreview(previewDoResultado(res));
        setAnalise(analisarAplicacao(res, existentes));
      } catch {
        setErro('Não consegui ler o arquivo. Confira se é um JSON válido exportado pela ferramenta de campo.');
      }
    };
    reader.readAsText(file);
    ev.target.value = '';
  }

  async function confirmarImport() {
    if (!resultado) return;
    setSalvando(true);
    try {
      // Transacional: ou entra tudo, ou nada.
      await db.transaction('rw',
        [db.ativos, db.stakeholders, db.evidencias, db.hipoteses, db.oportunidades,
         db.businessCases, db.decisoes, db.tarefas, db.kpis, db.analises, db.comparaveis],
        async () => {
          if (modo === 'substituir') await limparTudo();
          if (resultado.ativos.length) await db.ativos.bulkPut(resultado.ativos);
          if (resultado.stakeholders.length) await db.stakeholders.bulkPut(resultado.stakeholders);
          if (resultado.evidencias.length) await db.evidencias.bulkPut(resultado.evidencias);
          if (resultado.hipoteses.length) await db.hipoteses.bulkPut(resultado.hipoteses);
        });
      toast(modo === 'substituir' ? 'Dados substituídos' : 'Dados mesclados');
      navigate('/');
    } catch {
      setErro('Falha ao gravar no navegador. Nada foi importado. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function fmtCA(ca?: { criar: number; atualizar: number }) {
    if (!ca) return '';
    if (modo === 'substituir') return `${ca.criar + ca.atualizar} a criar`;
    return `${ca.criar} novo(s) · ${ca.atualizar} atualizado(s)`;
  }

  return (
    <div>
      <PageHeader
        kicker="Dados de campo"
        titulo="Importar dados de campo"
        descricao="Traga o JSON exportado pela ferramenta de campo offline. O formato é detectado automaticamente e nada é gravado antes de você confirmar."
      />

      <div className="panel" style={{ borderLeft: '4px solid var(--blue)' }}>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.5 }}>
          Esta tela é para o JSON gerado pela ferramenta de campo — traz imóveis e contatos. Não serve para
          restaurar um backup do app: evidências e hipóteses do arquivo seriam ignoradas. Quer restaurar um
          backup do próprio app? Vá em Backup → Importar backup.
        </p>
      </div>

      <div className="panel">
        <label htmlFor="arquivo-campo">Arquivo JSON da ferramenta de campo</label>
        <input id="arquivo-campo" type="file" accept=".json,application/json" onChange={aoEscolherArquivo} />
        <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          Aceita os dois formatos reais: a ferramenta principal (<code>{'{ativos, stakeholders, registros}'}</code>)
          e a ferramenta antiga do Hub Logístico (<code>{'{galpao, players, registros}'}</code>).
        </p>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
      </div>

      {preview && resultado && analise && (
        <div className="panel">
          <h2>Prévia do import</h2>
          <div className="alerta ok">Formato detectado: <b>{preview.rotuloFormato}</b></div>

          <table style={{ margin: '12px 0' }}>
            <thead><tr><th>Entidade</th><th>No arquivo</th><th>{modo === 'substituir' ? 'Será criado' : 'Novos / atualizados'}</th></tr></thead>
            <tbody>
              <tr><td>Ativos</td><td>{preview.contagens.ativos}</td><td>{fmtCA(analise.ativos)}</td></tr>
              <tr><td>Contatos (stakeholders)</td><td>{preview.contagens.stakeholders}</td><td>{fmtCA(analise.stakeholders)}</td></tr>
              <tr><td>Evidências</td><td>{preview.contagens.evidencias}</td><td>{fmtCA(analise.evidencias)}</td></tr>
              <tr><td>Hipóteses</td><td>{preview.contagens.hipoteses}</td><td>{fmtCA(analise.hipoteses)}</td></tr>
            </tbody>
          </table>

          {preview.amostra.stakeholders.length > 0 && (
            <p style={{ fontSize: 13 }}><b>Contatos:</b> {preview.amostra.stakeholders.join(' · ')}{preview.contagens.stakeholders > 3 ? ' …' : ''}</p>
          )}
          {preview.amostra.evidencias.length > 0 && (
            <p style={{ fontSize: 13 }}><b>Evidências:</b> {preview.amostra.evidencias.map((e) => `"${e}…"`).join(' · ')}</p>
          )}
          {preview.avisos.map((a, i) => <div className="alerta" key={i} style={{ marginTop: 8 }}>{a}</div>)}

          <label style={{ marginTop: 12 }}>Como aplicar</label>
          <div className="row-actions">
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400, textTransform: 'none', margin: 0 }}>
              <input type="radio" name="modo" checked={modo === 'mesclar'} onChange={() => setModo('mesclar')} style={{ width: 'auto' }} />
              Mesclar (mantém o que já existe e atualiza pelos IDs)
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 400, textTransform: 'none', margin: 0 }}>
              <input type="radio" name="modo" checked={modo === 'substituir'} onChange={() => setModo('substituir')} style={{ width: 'auto' }} />
              Substituir tudo (apaga os dados atuais antes)
            </label>
          </div>
          {modo === 'substituir' && <div className="alerta" style={{ marginTop: 8 }}>Atenção: substituir apaga TODOS os dados atuais deste navegador antes de importar.</div>}

          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 12 }}>
            Nenhum campo é descartado: informações sem lugar direto no modelo novo ficam em "campos não mapeados" de cada registro.
          </p>

          <div className="row-actions" style={{ marginTop: 12 }}>
            <button className="btn" onClick={confirmarImport} disabled={salvando}>
              {salvando ? 'Importando…' : (modo === 'substituir' ? 'Substituir e importar' : 'Mesclar e importar')}
            </button>
            <button className="btn ghost" onClick={() => { setResultado(null); setPreview(null); setAnalise(null); }} disabled={salvando}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
