import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { useEffect, useState } from "react";
import { commands } from "../bindings";
import { Chip } from "primereact/chip";
import { Divider } from "primereact/divider";
import { writeText } from "@tauri-apps/api/clipboard";
import { useNavigate } from "react-router-dom";

export default function CreateWallet() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [long, setLong] = useState(true);

  const [mnemonic, setMnemonic] = useState("");

  const generateMnemonic = () => {
    commands.generateMnemonic(long).then(setMnemonic);
  };

  const createWallet = () => {
    commands.importFromMnemonic(name, mnemonic).then(() => {
      navigate("/wallet");
    });
  };

  useEffect(() => {
    generateMnemonic();
  }, [long]);

  return (
    <div className="surface-card p-4 shadow-2 border-round m-auto mt-8 sm:w-10 md:w-8 lg:w-6">
      <Button
        onClick={() => navigate(-1)}
        icon="pi pi-chevron-left"
        rounded
        text
        size="large"
        className="absolute"
      />

      <h1 className="mt-0 text-center">Create Wallet</h1>

      <Divider />

      <label htmlFor="name" className="block text-base">
        Name
      </label>
      <InputText
        id="name"
        placeholder="Wallet Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full mt-1"
      />

      <div className="flex align-items-center mt-4">
        <Checkbox
          inputId="long"
          checked={long}
          onChange={(e) => setLong(e.checked ?? false)}
        />
        <label htmlFor="long" className="block ml-2 text-base">
          24 Word Mnemonic
        </label>

        <div className="flex align-items-center ml-auto">
          <Button
            onClick={generateMnemonic}
            icon="pi pi-refresh"
            size="large"
            rounded
            text
          />
          <Button
            onClick={() => {
              writeText(mnemonic);
            }}
            icon="pi pi-copy"
            size="large"
            rounded
            text
          />
        </div>
      </div>

      <div className="flex align-items-center flex-wrap gap-1 justify-content-center mt-4">
        {mnemonic.split(" ").map((word, i) => (
          <Chip key={i} label={word} className="" />
        ))}
      </div>

      <Button
        onClick={createWallet}
        label="Create Wallet"
        className="w-full mt-5"
      />
    </div>
  );
}
