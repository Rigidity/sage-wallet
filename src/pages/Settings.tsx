import { Dropdown } from "primereact/dropdown";
import Nav from "../components/Nav";
import { useEffect, useRef, useState } from "react";
import { commands } from "../bindings";
import { Toast } from "primereact/toast";

export default function Settings() {
  const [network, setNetwork] = useState("");
  const [networks, setNetworks] = useState<string[]>([]);

  const toast = useRef<Toast>(null);

  useEffect(() => {
    commands.activeNetwork().then(setNetwork);
    commands.networks().then(setNetworks);
  }, []);

  return (
    <>
      <Nav canGoBack />

      <div className="p-4">
        <div className="text-2xl">Active Network</div>
        <Dropdown
          value={network}
          onChange={(event) => {
            const name = event.value as string;

            setNetwork(name);

            commands.switchNetwork(name).then(() => {
              toast.current?.show({
                severity: "success",
                detail: `Switched network to ${name}`,
                life: 2000,
              });
            });
          }}
          options={networks}
          className="mt-3"
        />
      </div>

      <Toast ref={toast} />
    </>
  );
}
