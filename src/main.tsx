import "modern-normalize/modern-normalize.css";

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { PrimeReactProvider } from "primereact/api";
import "primereact/resources/themes/mdc-light-indigo/theme.css";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";

import App from "./App";
import { commands } from "./bindings";

const element = document.querySelector("#root") as HTMLElement;
const root = ReactDOM.createRoot(element);

const keyList = await commands.keyList();

root.render(
  <StrictMode>
    <PrimeReactProvider>
      <App keyList={keyList} />
    </PrimeReactProvider>
  </StrictMode>,
);
