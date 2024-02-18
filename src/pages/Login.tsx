import {
  Dispatch,
  SetStateAction,
  createRef,
  useEffect,
  useState,
} from "react";
import { KeyInfo, KeyList, commands } from "../bindings";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";

export default function Login() {
  const [keys, setKeys] = useState<KeyList | null>(null);

  useEffect(() => {
    commands.keyList().then(setKeys);
  }, []);

  return (
    <div className="grid m-6">
      {keys?.keys.map((keyInfo, i) => (
        <KeyItem key={i} info={keyInfo} setKeys={setKeys} />
      ))}
    </div>
  );
}

interface KeyItemProps {
  info: KeyInfo;
  setKeys: Dispatch<SetStateAction<KeyList | null>>;
}

function KeyItem({ info, setKeys }: KeyItemProps) {
  const navigate = useNavigate();

  const menu = createRef<Menu>();

  const menuItems: Array<MenuItem> = [
    {
      label: "Rename",
      icon: "pi pi-fw pi-pencil",
      command: () => {}, // TODO
    },
    {
      label: "Details",
      icon: "pi pi-fw pi-info-circle",
      command: () => {}, // TODO
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
          accept: () =>
            commands
              .deleteFingerprint(info.fingerprint)
              .then(commands.keyList)
              .then((keyList) => {
                if (!keyList.keys.length) {
                  navigate("/welcome");
                } else {
                  setKeys(keyList);
                }
              }),
        });
      },
    },
  ];

  const logIn = () => {
    commands.logIn(info.fingerprint).then(() => {
      navigate("/wallet");
    });
  };

  return (
    <div className="col-12 md:col-6 lg:col-4 cursor-pointer">
      <div
        onClick={logIn}
        className="surface-0 shadow-2 p-3 border-1 border-50 border-round"
      >
        <div className="flex justify-content-between mb-3">
          <div>
            <span className="block text-500 font-medium mb-3">
              {info.fingerprint}
            </span>
            <div className="text-900 font-medium text-xl">{info.name}</div>
          </div>

          <Menu model={menuItems} popup ref={menu} popupAlignment="left" />
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
      <ConfirmDialog />
    </div>
  );
}
