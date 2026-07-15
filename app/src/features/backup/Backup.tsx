import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import {
  montarBackup,
  ehBackupValido,
  restaurarBackup,
  csvAtivos,
  csvStakeholders,
  csvEvidencias,
} from '../../db/backup';
import { baixarArquivo } from '../../lib/download';
import { carimboArquivo } from '../../lib/datas';
import { PageHeader } from '../../components/PageHeader';
import { useToast } from '../../components/Toast';
import type { BackupCompleto } from '../../models/types';

/** Backup completo em JSON (export/import) + export CSV por entidade. */
export function Backup() {
  const toast = useToast();
  const [pendente, setPendente] = useState<BackupCompleto | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const contagens = useLiveQuery(async () => ({
    ativos: await db.ativos.count(),
    stakeholders: await db.stakeholders.count(),
    evidencias: await db.evidencias.count(),
  }));

  async function exportarJSON() {
    const backup = await montarBackup();
    baixarArquivo(
      `masterplan_backup_${carimboArquivo()}.json`,
      JSON.stringify(backup, null, 2),
      'application/json'
    );
    toast('Backup exportado');
  }

  function aoEscolherBackup(ev: React.ChangeEvent<HTMLInputElement>) {
    setErro(null);
    setPendente(null);
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!ehBackupValido(parsed)) {
          setErro('Este arquivo não é um backup do Masterplan. Para importar dados da ferramenta de campo, use a tela "Importar dados de campo".');
          return;
        }
        setPendente(parsed);
      } catch {
        setErro('Não consegui ler o arquivo (JSON inválido).');
      }
    };
    reader.readAsText(file);
    ev.target.value = '';
  }

  async function confirmarRestauracao() {
    if (!pendente) return;
    try {
      await restaurarBackup(pendente);
      toast('Backup restaurado');
      setPendente(null);
    } catch {
      setErro('Falha ao restaurar. Seus dados atuais foram preservados.');
    }
  }

  async function exportCSV(qual: 'ativos' | 'stakeholders' | 'evidencias') {
    const stamp = carimboArquivo().slice(0, 10);
    if (qual === 'ativos') baixarArquivo(`ativos_${stamp}.csv`, csvAtivos(await db.ativos.toArray()), 'text/csv;charset=utf-8');
    if (qual === 'stakeholders') baixarArquivo(`stakeholders_${stamp}.csv`, csvStakeholders(await db.stakeholders.toArray()), 'text/csv;charset=utf-8');
    if (qual === 'evidencias') baixarArquivo(`evidencias_${stamp}.csv`, csvEvidencias(await db.evidencias.toArray()), 'text/csv;charset=utf-8');
    toast('CSV exportado');
  }

  return (
    <div>
      <PageHeader
        kicker="Segurança dos dados"
        titulo="Backup e restauração"
        descricao="Seus dados vivem só neste navegador. Exporte um backup com frequência — é a sua rede de segurança e a forma de levar os dados para outro dispositivo."
      />

      <div className="panel" style={{ borderLeft: '4px solid var(--blue)' }}>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.5 }}>
          Aqui você exporta tudo que está no app (imóveis, unidades, contatos, evidências, hipóteses) para um
          arquivo, e restaura um arquivo exportado antes. Restaurar substitui todos os dados atuais — não mescla.
          Trazendo dados da ferramenta de campo? Use Importar campo.
        </p>
      </div>

      <div className="panel">
        <h2>Backup completo (JSON)</h2>
        <p style={{ color: 'var(--ink-soft)' }}>
          Gera um arquivo com tudo o que está no app. Guarde em mais de um lugar (nuvem, e-mail para
          você mesmo, pen drive).
        </p>
        <div className="row-actions">
          <button className="btn" onClick={exportarJSON}>Exportar backup</button>
          <label className="btn secondary" style={{ cursor: 'pointer' }}>
            Importar backup
            <input type="file" accept=".json,application/json" onChange={aoEscolherBackup} style={{ display: 'none' }} />
          </label>
        </div>
        {erro && <div className="alerta" style={{ marginTop: 12 }}>{erro}</div>}
        {pendente && (
          <div className="alerta" style={{ marginTop: 12 }}>
            <p style={{ marginTop: 0 }}>
              Importar este backup vai <b>substituir todos os dados atuais</b> deste navegador
              ({contagens?.ativos ?? 0} ativos, {contagens?.stakeholders ?? 0} stakeholders) pelos do
              arquivo ({pendente.ativos.length} ativos, {pendente.stakeholders.length} stakeholders). Continuar?
            </p>
            <div className="row-actions">
              <button className="btn danger" onClick={confirmarRestauracao}>Substituir dados</button>
              <button className="btn ghost" onClick={() => setPendente(null)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Exportar planilhas (CSV)</h2>
        <p style={{ color: 'var(--ink-soft)' }}>Para abrir no Excel ou Google Sheets. Separador ";" e acentuação correta.</p>
        <div className="row-actions">
          <button className="btn secondary small" onClick={() => exportCSV('ativos')}>Ativos ({contagens?.ativos ?? 0})</button>
          <button className="btn secondary small" onClick={() => exportCSV('stakeholders')}>Stakeholders ({contagens?.stakeholders ?? 0})</button>
          <button className="btn secondary small" onClick={() => exportCSV('evidencias')}>Evidências ({contagens?.evidencias ?? 0})</button>
        </div>
      </div>
    </div>
  );
}
