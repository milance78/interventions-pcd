import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import { useLocation, useNavigate } from "react-router-dom";

import "../onHoldPage/OnHoldPage.scss";
import "./SearchResultsPage.scss";

import type { SearchInterventionResult } from "../../firebase/interventionsService";
import { loadInterventionFromSearch } from "../../redux/features/newInterventionSlice";
import { useAppDispatch } from "../../redux/store";

interface SearchLocationState {
  query?: string;
  results?: SearchInterventionResult[];
}

const infrastructureLabel = (value?: string) => {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "fiber" || normalized === "fibre") return "FIBRE";
  if (normalized === "copper" || normalized === "cuivre") return "CUIVRE";
  return value?.trim().toUpperCase() || "—";
};


const statusLabel = (value?: string) => {
  const labels: Record<string, string> = {
    completed: "TERMINÉ",
    "on hold": "EN ATTENTE",
    transferred: "TRANSMIS",
    postponed: "POSTPOSÉ",
    "consult M&P": "VOIR AVEC M&P",
    "closed by another agent": "FERMÉ PAR UN AUTRE AGENT",
  };

  return labels[value ?? ""] ?? value?.trim().toUpperCase() ?? "—";
};

const SearchResultsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as SearchLocationState | null;
  const results = state?.results ?? [];
  const query = state?.query ?? "";

  const openIntervention = (result: SearchInterventionResult) => {
    dispatch(loadInterventionFromSearch(result.intervention));
    navigate("/intervention-en-cours");
  };

  return (
    <main className="search-results-page">
      <section className="search-results-page__header">
        <div>
          <span className="search-results-page__eyebrow">Recherche</span>
          <h1>Résultats pour « {query} »</h1>
        </div>

        <span className="search-results-page__count">
          {results.length} résultat{results.length === 1 ? "" : "s"}
        </span>
      </section>

      <section className="search-results-page__list">
        {results.map((result) => {
          const { intervention, criterion } = result;
          const technology = infrastructureLabel(intervention.infrastructure);

          return (
            <div
              key={`${intervention.dateKey ?? ""}-${intervention.documentId}-${criterion.label}`}
              className="search-result-item"
            >
              <div className="search-result-criterion">
                <strong>{criterion.label}:</strong> {criterion.value}
              </div>

              <article
                className="on-hold-card search-result-card"
                role="button"
                tabIndex={0}
                onClick={() => openIntervention(result)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openIntervention(result);
                  }
                }}
              >
                <span className="on-hold-card__status-column">
                  <span
                    className={`on-hold-card__technology ${
                      technology === "FIBRE"
                        ? "on-hold-card__technology--fiber"
                        : "on-hold-card__technology--copper"
                    }`}
                  >
                    {technology}
                  </span>

                  <span className="on-hold-card__status">
                    <span className="on-hold-card__status-main search-result-card__status">
                      <span>{statusLabel(intervention.status)}</span>
                    </span>
                  </span>
                </span>

                <span className="on-hold-card__identity">
                  <span>
                    <strong>Intervention ID</strong>
                    <span title={intervention.interventionId || "—"}>
                      {intervention.interventionId || "—"}
                    </span>
                  </span>
                  <span>
                    <strong>OAG ID</strong>
                    <span title={intervention.oagID || "—"}>
                      {intervention.oagID || "—"}
                    </span>
                  </span>
                  {criterion.label.startsWith("Snow") && (
                    <span className="on-hold-card__snow-ticket">
                      <strong>{criterion.label}</strong>
                      <span title={criterion.value}>{criterion.value}</span>
                    </span>
                  )}
                </span>

                <span className="on-hold-card__details">
                  <span>
                    <strong>Commentaire</strong>
                    <span>{intervention.comment?.trim() || "—"}</span>
                  </span>
                  <span>
                    <strong>Informations supplémentaires</strong>
                    <span>{intervention.additionalInformation?.trim() || "—"}</span>
                  </span>
                </span>

                <ArrowForwardRounded className="on-hold-card__arrow" />
              </article>
            </div>
          );
        })}

        {results.length === 0 && (
          <div className="search-results-page__empty">
            Aucun résultat disponible. Lancez une nouvelle recherche.
          </div>
        )}
      </section>
    </main>
  );
};

export default SearchResultsPage;
