import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./redux/store";
// Always start the application on Liste du jour after a full app launch/reload.
// SPA navigation afterwards is left untouched.
if (window.location.hash !== "#/liste-du-jour") {
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}#/liste-du-jour`,
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
