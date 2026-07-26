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
        setErrorMessage("Aucune intervention trouvée");
        return;
      }

      if (results.length === 1) {
        dispatch(loadInterventionFromSearch(results[0]));
        setQuery("");
        navigate("/intervention-en-cours");
        return;
      }

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
        <TextField
          size="small"
          label="Recherche"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setErrorMessage("");
          }}
          className="intervention-search__input"
          inputProps={{
            "aria-label": "Recherche par Intervention ID ou OAG ID",
          }}
        />

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
