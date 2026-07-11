import { NavLink, Outlet } from 'react-router-dom';
import { MODULOS, type Modulo } from './modulos';

const GRUPOS: { chave: Modulo['grupo']; rotulo: string }[] = [
  { chave: 'diagnostico', rotulo: 'Diagnósticos' },
  { chave: 'decisao', rotulo: 'Decisão' },
  { chave: 'execucao', rotulo: 'Execução' },
];

/** Layout raiz: sidebar de navegação (Home + 12 módulos + utilitários) e conteúdo. */
export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="logo-k">K</span>
          <span className="logo-nome">Kochi</span>
          <span className="logo-holding">HOLDING</span>
        </div>

        <nav className="nav-links-wrap">
          <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="num">◆</span> Visão geral
          </NavLink>

          {GRUPOS.map((g) => (
            <div key={g.chave}>
              <div className="nav-sep">{g.rotulo}</div>
              {MODULOS.filter((m) => m.grupo === g.chave).map((m) => (
                <NavLink
                  key={m.slug}
                  to={`/modulo/${m.slug}`}
                  className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                >
                  <span className="num">{m.num}</span> {m.nome.replace('Diagnóstico ', '')}
                </NavLink>
              ))}
            </div>
          ))}

          <div className="nav-sep">Dados</div>
          <NavLink to="/importar" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="num">↧</span> Importar campo
          </NavLink>
          <NavLink to="/backup" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="num">⧉</span> Backup
          </NavLink>
        </nav>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
