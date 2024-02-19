import "modern-normalize/modern-normalize.css";

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { PrimeReactProvider } from "primereact/api";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";

import App from "./App";
import { commands } from "./bindings";
import { HelmetProvider } from "react-helmet-async";

const element = document.querySelector("#root") as HTMLElement;
const root = ReactDOM.createRoot(element);

async function main() {
  const data = await commands.keyList();

  root.render(
    <StrictMode>
      <HelmetProvider>
        <PrimeReactProvider>
          <App data={data} />
        </PrimeReactProvider>
      </HelmetProvider>
    </StrictMode>,
  );
}

main();
