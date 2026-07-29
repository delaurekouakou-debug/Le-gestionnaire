export interface JourMouvements {
  libelle: string;
  entree: number;
  sortie: number;
}

function niceCeil(valeur: number): number {
  if (valeur <= 0) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(valeur));
  const residu = valeur / magnitude;
  const niceResidu = residu <= 1 ? 1 : residu <= 2 ? 2 : residu <= 5 ? 5 : 10;
  return niceResidu * magnitude;
}

const HAUTEUR_TRACE = 160;

export default function MouvementsBarChart({ jours }: { jours: JourMouvements[] }) {
  const max = Math.max(...jours.map((j) => Math.max(j.entree, j.sortie)));
  const aDesDonnees = max > 0;
  const echelle = niceCeil(max || 1);
  const ticks = [echelle, echelle / 2, 0];

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-chart-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-series-entree" />
          Entrées
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-series-sortie" />
          Sorties
        </span>
      </div>

      {!aDesDonnees ? (
        <p className="flex h-40 items-center justify-center text-sm text-chart-muted">
          Aucun mouvement sur la période sélectionnée.
        </p>
      ) : (
        <div className="flex">
          <div
            className="flex flex-col justify-between pr-2 text-right text-[11px] tabular-nums text-chart-muted"
            style={{ height: HAUTEUR_TRACE }}
          >
            {ticks.map((t) => (
              <span key={t}>{t.toLocaleString("fr-FR")}</span>
            ))}
          </div>

          <div className="flex flex-1 items-end justify-between border-l border-chart-grid">
            {jours.map((jour) => (
              <div key={jour.libelle} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="relative flex w-full items-end justify-center gap-[2px] border-b border-chart-grid"
                  style={{ height: HAUTEUR_TRACE }}
                >
                  <div className="group relative flex h-full w-3 items-end">
                    <div
                      className="w-full rounded-t bg-series-entree"
                      style={{ height: `${(jour.entree / echelle) * 100}%` }}
                    />
                    <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy-950 px-1.5 py-0.5 text-[11px] tabular-nums text-white group-hover:block">
                      {jour.entree}
                    </div>
                  </div>
                  <div className="group relative flex h-full w-3 items-end">
                    <div
                      className="w-full rounded-t bg-series-sortie"
                      style={{ height: `${(jour.sortie / echelle) * 100}%` }}
                    />
                    <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy-950 px-1.5 py-0.5 text-[11px] tabular-nums text-white group-hover:block">
                      {jour.sortie}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-chart-muted">{jour.libelle}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
