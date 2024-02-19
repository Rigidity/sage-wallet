import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import { commands } from "../bindings";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

export default function Wallet() {
  const [derivations, setDerivations] = useState<string[]>([]);

  useEffect(() => {
    commands.fetchDerivations().then((result) => {
      if (result.status === "error") {
      } else {
        setDerivations(result.data);
      }
    });
  }, []);

  return (
    <>
      <Nav />
      <div className="p-6">
        <DataTable
          value={derivations.map((address, i) => ({ address, index: i }))}
          showGridlines
          stripedRows
          size="small"
        >
          <Column field="index" header="Index" />
          <Column field="address" header="Address" />
        </DataTable>
      </div>
    </>
  );
}
