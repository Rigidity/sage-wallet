import { useEffect, useRef, useState } from "react";
import Nav from "../components/Nav";
import { commands } from "../bindings";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { writeText } from "@tauri-apps/api/clipboard";

export default function Wallet() {
  const [derivations, setDerivations] = useState<string[]>([]);
  const [addressDialog, setAddressDialog] = useState(false);

  const toast = useRef<Toast>(null);

  useEffect(() => {
    commands.fetchDerivations().then((result) => {
      if (result.status === "error") {
      } else {
        setDerivations(result.data);
      }
    });
  }, []);

  const addressFooter = () => {
    return (
      <Button
        label="Close"
        icon="pi pi-check"
        onClick={() => setAddressDialog(false)}
      />
    );
  };

  return (
    <>
      <Nav />

      <Toast ref={toast} />

      <div className="p-6">
        <Button
          label="Addresses"
          icon="pi pi-external-link"
          onClick={() => setAddressDialog(true)}
        />
      </div>

      <Dialog
        header="Address List"
        visible={addressDialog}
        onHide={() => setAddressDialog(false)}
        maximizable
        modal
        contentStyle={{ height: "300px" }}
        footer={addressFooter}
      >
        <DataTable
          value={derivations.map((address, i) => ({
            address,
            index: i,
            copy: (
              <Button
                onClick={() => {
                  writeText(address);
                  toast.current?.show({
                    severity: "success",
                    detail: "Copied address",
                    life: 2000,
                  });
                }}
                icon="pi pi-copy"
                rounded
                text
                size="large"
              />
            ),
          }))}
          showGridlines
          stripedRows
          scrollable
          scrollHeight="flex"
          size="small"
          tableStyle={{ minWidth: "40rem" }}
        >
          <Column field="index" header="#" align="center" />
          <Column
            field="address"
            header="Address"
            style={{ paddingLeft: "12px" }}
          />
          <Column field="copy" header="Copy" />
        </DataTable>
      </Dialog>
    </>
  );
}
