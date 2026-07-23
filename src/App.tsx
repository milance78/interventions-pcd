import { Navigate, Route, Routes } from "react-router-dom";

import "./App.scss";
import Header from "./components/header/Header";
import InterventionsLoader from "./components/interventionsLoader/InterventionsLoader";
import CurrentInterventionPage from "./pages/currentInterventionPage/CurrentInterventionPage";
import HistoryPage from "./pages/historyPage/HistoryPage";
import StatisticsPage from "./pages/statisticsPage/StatisticsPage";
import SearchResultsPage from "./pages/searchResultsPage/SearchResultsPage";
import TemplatesPage from "./pages/templatesPage/TemplatesPage";
import TodayListPage from "./pages/todayListPage/TodayListPage";

const App = () => (
  <div className="app">
    <Header />
    <InterventionsLoader />

    <section className="main">
      <Routes>
        <Route
          path="/intervention-en-cours"
          element={<CurrentInterventionPage />}
        />
        <Route path="/liste-du-jour" element={<TodayListPage />} />
        <Route path="/historique" element={<HistoryPage />} />
        <Route path="/statistiques" element={<StatisticsPage />} />
        <Route path="/recherche" element={<SearchResultsPage />} />
        <Route path="/modeles" element={<TemplatesPage />} />
        <Route path="*" element={<Navigate to="/liste-du-jour" replace />} />
      </Routes>
    </section>
  </div>
);

export default App;
