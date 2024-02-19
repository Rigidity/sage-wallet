import { MemoryRouter, Route, Routes } from "react-router-dom";
import CreateWallet from "./pages/CreateWallet";
import ImportWallet from "./pages/ImportWallet";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Wallet from "./pages/Wallet";
import { KeyData } from "./bindings";
import Settings from "./pages/Settings";
import { Helmet } from "react-helmet-async";
import { useLocalStorage } from "usehooks-ts";

export interface AppProps {
  data: KeyData;
}

export default function App({ data }: AppProps) {
  const [isDarkMode] = useLocalStorage("dark-mode", false);

  const isInWallet =
    data.keys.findIndex((key) => key.fingerprint === data.activeFingerprint) !==
    -1;

  return (
    <>
      <Helmet>
        {isDarkMode ? (
          <link
            id="theme-link"
            rel="stylesheet"
            href="/themes/mdc-dark-indigo/theme.css"
          />
        ) : (
          <link
            id="theme-link"
            rel="stylesheet"
            href="/themes/mdc-light-indigo/theme.css"
          />
        )}
      </Helmet>
      <MemoryRouter
        initialEntries={[
          isInWallet ? "/wallet" : data.keys.length ? "/login" : "/welcome",
        ]}
      >
        <Routes>
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/create-wallet" element={<CreateWallet />} />
          <Route path="/import-wallet" element={<ImportWallet />} />
        </Routes>
      </MemoryRouter>
    </>
  );
}
