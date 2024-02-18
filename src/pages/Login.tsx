import { useEffect, useState } from "react";
import { WalletInfo, commands } from "../bindings";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";

export default function Login() {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    commands.walletList().then(setWallets);
  }, []);

  return (
    <div className="grid m-6">
      {wallets.map((wallet, i) => (
        <WalletItem key={i} info={wallet} />
      ))}
    </div>
  );
}

interface WalletItemProps {
  info: WalletInfo;
}

function WalletItem({ info }: WalletItemProps) {
  return (
    <div className="col-12 md:col-6 lg:col-4">
      <div className="surface-0 shadow-2 p-3 border-1 border-50 border-round">
        <div className="flex justify-content-between mb-3">
          <div>
            <span className="block text-500 font-medium mb-3">
              {info.fingerprint}
            </span>
            <div className="text-900 font-medium text-xl">{info.name}</div>
          </div>
          <div>
            <Button icon="pi pi-pencil" rounded text />
            <Button icon="pi pi-info-circle" rounded text severity="info" />
            <Button icon="pi pi-trash" rounded text severity="danger" />
          </div>
        </div>
        {info.is_hot_wallet ? (
          <Tag icon="pi pi-wallet" value="Hot Wallet" severity="danger" />
        ) : (
          <Tag icon="pi pi-wallet" value="Cold Wallet" severity="info" />
        )}
      </div>
    </div>
  );
}
