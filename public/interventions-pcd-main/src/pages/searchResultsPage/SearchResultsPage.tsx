import { useLocation, useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";

import "../todayListPage/TodayListPage.scss";
import "./SearchResultsPage.scss";

import type { Intervention } from "../../redux/features/newInterventionSlice";
import { loadInterventionFromSearch } from "../../redux/features/newInterventionSlice";
import { useAppDispatch } from "../../redux/store";

interface SearchLocationState {
  query?: string;
  results?: Intervention[];
}

const SearchResultsPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as SearchLocationState | null;
  const results = state?.results ?? [];
  const query = state?.query ?? "";

  const openIntervention = (intervention: Intervention) => {
    dispatch(loadInterventionFromSearch(intervention));
    navigate("/intervention-en-cours");
  };

  return (
    <main className="today-list-page search-results-page">
      <div className="today-list-content">
        <header className="today-page-header">
          <div className="today-page-title">
            <span className="today-page-eyebrow">Recherche</span>
            <h1>Résultats pour « {query} »</h1>
          </div>

          <div className="today-page-counters">
            <span className="today-counter today-counter-total">
              Total <strong>{results.length}</strong>
            </span>
          </div>
        </header>

        <div className="today-interventions-list">
          {results.map((intervention) => (
            <article
              key={`${intervention.dateKey ?? ""}-${intervention.documentId}`}
              className="today-intervention-row search-result-row"
              role="button"
              tabIndex={0}
              onClick={() => openIntervention(intervention)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openIntervention(intervention);
                }
              }}
            >
              <div className="search-result-edit-icon">
                <Pencil size={17} />
              </div>

              <div className="today-card-column today-category-column">
                <div className="today-category-section">
                  {intervention.infrastructure && (
                    <span className="today-badge today-infrastructure">
                      {intervention.infrastructure === "copper"
                        ? "cuivre"
                        : intervention.infrastructure === "fiber"
                          ? "fibre"
                          : intervention.infrastructure}
                    </span>
                  )}

                  {intervention.network && (
                    <span className="today-badge today-network">
                      {intervention.network}
                    </span>
                  )}

                  {intervention.status && (
                    <span className="today-badge today-status">
                      {intervention.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="today-card-column today-identifiers-column search-result-identifiers">
                <div><strong>Intervention ID:</strong> {intervention.interventionId || "—"}</div>
                <div><strong>OAG ID:</strong> {intervention.oagID || "—"}</div>
                <div><strong>Date:</strong> {intervention.dateKey || "—"}</div>
                <div><strong>Adresse:</strong> {intervention.mainAddress || "—"}</div>
              </div>

              <div className="today-card-column today-text-column today-client-address-column">
                <div className="today-stacked-field today-stacked-field-compact">
                  <div className="today-stacked-label">Nom du client</div>
                  <div className="today-stacked-value"><strong>{intervention.clientName || "—"}</strong></div>
                </div>

                <div className="today-stacked-field">
                  <div className="today-stacked-label">Clients à l'adresse</div>
                  <div className="today-stacked-value">{intervention.clientsOnAddress || "—"}</div>
                </div>
              </div>

              <div className="today-card-column today-text-column">
                <div className="today-stacked-field">
                  <div className="today-stacked-label">Commentaire</div>
                  <div className="today-stacked-value">{intervention.comment || "—"}</div>
                </div>
              </div>
            </article>
          ))}

          {results.length === 0 && (
            <div className="today-empty">
              Aucun résultat disponible. Lancez une nouvelle recherche.
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default SearchResultsPage;
