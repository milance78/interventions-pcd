import * as React from "react";
import SearchRounded from "@mui/icons-material/SearchRounded";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";

import "./InterventionSearch.scss";

import { searchInterventions } from "../../../firebase/interventionsService";
import { auth } from "../../../firebase/firebaseConfig";
import { loadInterventionFromSearch } from "../../../redux/features/newInterventionSlice";
import { useAppDispatch } from "../../../redux/store";
import { trimLeadingHorizontalWhitespace } from "../../../utils/textUtils";

const InterventionSearch = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [query, setQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const submitSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery || isSearching) {
      return;
    }

    setIsSearching(true);
    setErrorMessage("");

    try {
      await auth.authStateReady();
      const user = auth.currentUser;

      if (!user) {
        setErrorMessage("Utilisateur non authentifié");
        return;
      }

      const results = await searchInterventions(user.uid, normalizedQuery);

      if (results.length === 0) {
        setQuery("");
        setErrorMessage("Aucune intervention trouvée");
        return;
      }

      if (results.length === 1) {
        dispatch(loadInterventionFromSearch(results[0].intervention));
        setQuery("");
        navigate("/intervention-en-cours");
        return;
      }

      setQuery("");
      navigate("/recherche", {
        state: {
          query: normalizedQuery,
          results,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "La recherche a échoué",
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="intervention-search">
      <form
        className="intervention-search__form"
        onSubmit={submitSearch}
      >
        <Tooltip
          title="Recherche par ID/OAG/Snow"
          placement="bottom"
          arrow
          slotProps={{
            tooltip: {
              sx: {
                color: "#334155",
                bgcolor: "#ffffff",
                border: "1px solid #dbe3ee",
                boxShadow: "0 6px 18px rgba(15, 23, 42, 0.12)",
                fontSize: "12px",
              },
            },
            arrow: { sx: { color: "#ffffff" } },
          }}
        >
          <TextField
          size="small"
          label="Recherche"
          value={query}
          onChange={(event) => {
            setQuery(trimLeadingHorizontalWhitespace(event.target.value));
            setErrorMessage("");
          }}
          onBlur={() => setQuery((value) => value.trim())}
          className="intervention-search__input"
          inputProps={{
            "aria-label": "Recherche par ID/OAG/Snow",
          }}
        />
        </Tooltip>

        <Tooltip title="Rechercher" arrow>
          <span>
            <IconButton
              type="submit"
              className="intervention-search__button"
              disabled={!query.trim() || isSearching}
              aria-label="Rechercher une intervention"
            >
              {isSearching ? (
                <CircularProgress size={18} />
              ) : (
                <SearchRounded fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </form>

      {errorMessage && (
        <div className="intervention-search__message" role="status">
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default InterventionSearch;
