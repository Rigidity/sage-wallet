import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";

export default function Start() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-column align-items-center m-auto p-4 w-full sm:w-10 md:w-8 lg:w-6 xl:w-5">
      <img width={300} src="/logo.svg" alt="Arbor Wallet" className="mt-8" />
      <h1 className="text-6xl mt-3">Arbor Wallet</h1>

      <Button
        label="Create Wallet"
        severity="success"
        className="mt-6 w-full"
        onClick={() => navigate("/create-wallet")}
      />
      <Button
        label="Import Wallet"
        className="mt-2 w-full"
        outlined
        onClick={() => navigate("/import-wallet")}
      />
    </div>
  );
}
