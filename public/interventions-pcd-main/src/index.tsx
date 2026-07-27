import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./redux/store";
const root = createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>,
);
