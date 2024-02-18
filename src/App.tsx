import { MemoryRouter, Route, Routes } from "react-router-dom";
import CreateWallet from "./pages/CreateWallet";
import ImportWallet from "./pages/ImportWallet";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Wallet from "./pages/Wallet";
import { KeyList } from "./bindings";

export interface AppProps {
  keyList: KeyList;
}

export default function App({ keyList }: AppProps) {
  console.log(keyList);

  const isInWallet =
    keyList.keys.findIndex(
      (key) => key.fingerprint === keyList.activeFingerprint,
    ) !== -1;

  return (
    <MemoryRouter
      initialEntries={[
        isInWallet ? "/wallet" : keyList.keys.length ? "/login" : "/welcome",
      ]}
    >
      <Routes>
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/login" element={<Login />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/create-wallet" element={<CreateWallet />} />
        <Route path="/import-wallet" element={<ImportWallet />} />
      </Routes>
    </MemoryRouter>
  );
}
