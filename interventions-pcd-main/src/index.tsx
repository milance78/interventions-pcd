import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { shouldRecoverCurrentOnLaunch } from "./localStorage/localStorage";

// Normal launch starts on Liste du jour. If the previous browser/app session
// was interrupted while Current Intervention was open, recover that exact
// session directly on Intervention en cours. In-app navigation later clears
// the marker as soon as the user intentionally leaves Current Intervention.
const launchRoute = shouldRecoverCurrentOnLaunch()
  ? "/intervention-en-cours"
  : "/liste-du-jour";
if (window.location.hash !== `#${launchRoute}`) {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#${launchRoute}`,
  );
}

const root = createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>,
);
