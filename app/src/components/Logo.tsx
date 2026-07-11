/** Marca Kochi Holding: "K" (teal) à esquerda; HOLDING + Kochi empilhados à direita. */
export function Logo() {
  return (
    <div className="brand">
      <span className="logo-k">K</span>
      <div className="logo-text">
        <span className="logo-holding">HOLDING</span>
        <span className="logo-nome">Kochi</span>
      </div>
    </div>
  );
}
