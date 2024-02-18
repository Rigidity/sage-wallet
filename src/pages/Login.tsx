import { useEffect, useState } from "react";
import { KeyInfo, KeyList, commands } from "../bindings";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [keys, setKeys] = useState<KeyList | null>(null);

  useEffect(() => {
    commands.keyList().then(setKeys);
  }, []);

  return (
    <div className="grid m-6">
      {keys?.keys.map((keyInfo, i) => <KeyItem key={i} info={keyInfo} />)}
    </div>
  );
}

interface KeyItemProps {
  info: KeyInfo;
}

function KeyItem({ info }: KeyItemProps) {
  const navigate = useNavigate();

  const logIn = () => {
    commands.logIn(info.fingerprint).then(() => {
      navigate("/wallet");
    });
  };

  return (
    <div onClick={logIn} className="col-12 md:col-6 lg:col-4 cursor-pointer">
      <div className="surface-0 shadow-2 p-3 border-1 border-50 border-round">
        <div className="flex justify-content-between mb-3">
          <div>
            <span className="block text-500 font-medium mb-3">
              {info.fingerprint}
            </span>
            <div className="text-900 font-medium text-xl">{info.name}</div>
          </div>
        </div>
        {info.secretKey !== null ? (
          <Tag icon="pi pi-wallet" value="Hot Wallet" severity="danger" />
        ) : (
          <Tag icon="pi pi-wallet" value="Cold Wallet" severity="info" />
        )}
      </div>
    </div>
  );
}
