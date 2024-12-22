import React from "react";
import ReactDOM from "react-dom/client";
import RootApp from "./App";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <RootApp />
    </BrowserRouter>
  </React.StrictMode>,
);
