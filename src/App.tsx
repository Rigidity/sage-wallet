import { BrowserRouter, Route, Routes } from "react-router-dom";
import CreateWallet from "./pages/CreateWallet";
import ImportWallet from "./pages/ImportWallet";
import Start from "./pages/Start";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/create-wallet" element={<CreateWallet />} />
        <Route path="/import-wallet" element={<ImportWallet />} />
      </Routes>
    </BrowserRouter>
  );
}
