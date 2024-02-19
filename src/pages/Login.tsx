import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { KeyInfo, KeyList, commands } from "../bindings";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import Nav from "../components/Nav";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { Form, Formik } from "formik";
import { InputText } from "primereact/inputtext";
import { writeText } from "@tauri-apps/api/clipboard";
import { Toast } from "primereact/toast";

export default function Login() {
  const [keys, setKeys] = useState<KeyList | null>(null);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    commands.keyList().then(setKeys);
  }, []);

  return (
    <>
      <Nav />
      <div className="text-5xl text-center m-5">Wallet List</div>
      <div className="grid align-items-center m-4">
        {keys?.keys.map((keyInfo, i) => (
          <KeyItem key={i} info={keyInfo} setKeys={setKeys} toast={toast} />
        ))}
      </div>
      <Toast ref={toast} />
      <ConfirmDialog />
    </>
  );
}

interface KeyItemProps {
  info: KeyInfo;
  setKeys: Dispatch<SetStateAction<KeyList | null>>;
  toast: RefObject<Toast>;
}

function KeyItem({ info, setKeys, toast }: KeyItemProps) {
  const navigate = useNavigate();

  const [name, setName] = useState(info.name);
  const [renaming, setRenaming] = useState(false);
  const [details, setDetails] = useState(false);

  const menu = useRef<Menu>(null);
  const contextMenu = useRef<ContextMenu>(null);

  const menuItems: Array<MenuItem> = [
    {
      label: "Rename",
      icon: "pi pi-fw pi-pencil",
      command: () => setRenaming(true),
    },
    {
      label: "Key Details",
      icon: "pi pi-fw pi-info-circle",
      command: () => setDetails(true),
    },

    {
      label: "Delete",
      icon: "pi pi-fw pi-trash",
      command: (event) => {
        event.originalEvent.stopPropagation();
        confirmDialog({
          header: "Delete Confirmation",
          message: "Are you sure you want to delete this wallet key?",
          icon: "pi pi-info-circle",
          accept: () => {
            commands
              .deleteFingerprint(info.fingerprint)
              .then(commands.keyList)
              .then((keyList) => {
                if (!keyList.keys.length) {
                  navigate("/welcome", { replace: true });
                } else {
                  setKeys(keyList);
                }
              });
          },
        });
      },
    },
  ];

  const logIn = () => {
    commands.logIn(info.fingerprint).then(() => {
      navigate("/wallet", { replace: true });
    });
  };

  const initial = {
    name: "",
  };

  return (
    <div
      onContextMenu={(event) => contextMenu.current?.show(event)}
      className="col-12 md:col-6 lg:col-4 cursor-pointer"
    >
      <div
        onClick={logIn}
        className="surface-0 shadow-2 p-3 border-1 border-50 border-round-xl"
      >
        <div className="flex justify-content-between mb-3">
          <div>
            <span className="block text-500 font-medium mb-3">
              {info.fingerprint}
            </span>
            <div className="text-900 font-medium text-xl">{name}</div>
          </div>

          <Menu model={menuItems} popup ref={menu} popupAlignment="left" />
          <ContextMenu model={menuItems} ref={contextMenu} />
          <Button
            onClick={(event) => {
              event.stopPropagation();
              menu.current?.toggle(event);
            }}
            icon="pi pi-ellipsis-v"
            rounded
            text
          />
        </div>

        {info.secretKey !== null ? (
          <Tag icon="pi pi-wallet" value="Hot Wallet" severity="danger" />
        ) : (
          <Tag icon="pi pi-wallet" value="Cold Wallet" severity="info" />
        )}
      </div>

      <Dialog
        header="Wallet Details"
        visible={details}
        style={{ width: "50vw" }}
        onHide={() => setDetails(false)}
      >
        <div className="flex flex-column gap-4">
          {info.mnemonic && (
            <div>
              <div className="flex align-items-center">
                <div className="text-xl">Mnemonic</div>
                <Button
                  onClick={() => {
                    writeText(info.mnemonic ?? "");
                    toast.current?.show({
                      severity: "success",
                      detail: "Copied mnemonic",
                      life: 2000,
                    });
                  }}
                  icon="pi pi-copy"
                  rounded
                  text
                  size="large"
                />
              </div>
              <div className="text-600">{info.mnemonic}</div>
            </div>
          )}
          {info.secretKey && (
            <div>
              <div className="flex align-items-center">
                <div className="text-xl">Secret Key</div>
                <Button
                  onClick={() => {
                    writeText(info.secretKey ?? "");
                    toast.current?.show({
                      severity: "success",
                      detail: "Copied secret key",
                      life: 2000,
                    });
                  }}
                  icon="pi pi-copy"
                  rounded
                  text
                  size="large"
                />
              </div>

              <div className="text-600" style={{ wordWrap: "break-word" }}>
                {info.secretKey}
              </div>
            </div>
          )}
          {info.publicKey && (
            <div>
              <div className="flex align-items-center">
                <div className="text-xl">Public Key</div>
                <Button
                  onClick={() => {
                    writeText(info.publicKey ?? "");
                    toast.current?.show({
                      severity: "success",
                      detail: "Copied public key",
                      life: 2000,
                    });
                  }}
                  icon="pi pi-copy"
                  rounded
                  text
                  size="large"
                />
              </div>

              <div className="text-600" style={{ wordWrap: "break-word" }}>
                {info.publicKey}
              </div>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        header="Rename Wallet"
        visible={renaming}
        style={{ width: "40vw" }}
        onHide={() => setRenaming(false)}
      >
        <Formik
          initialValues={initial}
          validate={async (values) => {
            const errors: Partial<Record<keyof typeof initial, string>> = {};

            if (!values.name) {
              errors.name = "Required";
            }

            return errors;
          }}
          onSubmit={(values) => {
            commands
              .renameFingerprint(info.fingerprint, values.name)
              .then(() => {
                setRenaming(false);
                setName(values.name);
              });
          }}
        >
          {({
            values,
            errors,
            touched,
            isSubmitting,
            handleChange,
            handleBlur,
            handleSubmit,
          }) => (
            <Form onSubmit={handleSubmit}>
              <InputText
                name="name"
                placeholder="Name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full mt-1 ${
                  touched.name && errors.name && "p-invalid"
                }`}
              />
              {touched.name && errors.name && (
                <div className="text-red-500 mt-1">{errors.name}</div>
              )}

              <Button
                label="Rename Wallet"
                type="submit"
                className="w-full mt-3"
                disabled={isSubmitting}
              />
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
}
