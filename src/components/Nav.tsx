import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { commands } from "../bindings";
import { createRef } from "react";
import { Menu } from "primereact/menu";
import { MenuItem } from "primereact/menuitem";
import { useLocalStorage } from "usehooks-ts";

export interface NavProps {
  canGoBack?: boolean;
}

export default function Nav({ canGoBack }: NavProps) {
  const navigate = useNavigate();

  const [isDarkMode, setDarkMode] = useLocalStorage("dark-mode", false);

  const menu = createRef<Menu>();

  const menuItems: Array<MenuItem> = [
    {
      label: "Wallets",
      items: [
        {
          label: "Create Wallet",
          icon: "pi pi-fw pi-wallet",
          command: () => navigate("/create-wallet"),
        },
        {
          label: "Import Wallet",
          icon: "pi pi-fw pi-sign-in",
          command: () => navigate("/import-wallet"),
        },
      ],
    },
    {
      label: "Manage",
      items: [
        {
          label: "Settings",
          icon: "pi pi-fw pi-cog",
          command: () => navigate("/settings"),
        },
        {
          label: "Logout",
          icon: "pi pi-fw pi-sign-out",
          command: () => {
            commands.logIn(null).then(() => {
              navigate("/login", { replace: true });
            });
          },
        },
      ],
    },
  ];

  return (
    <div className="flex justify-content-end p-3">
      <div className="flex gap-3">
        {canGoBack && (
          <Button
            onClick={() => navigate(-1)}
            icon="pi pi-chevron-left"
            label="Back"
            text
          />
        )}
        <Button
          onClick={() => setDarkMode(!isDarkMode)}
          icon={`pi ${isDarkMode ? "pi-sun" : "pi-moon"}`}
          rounded
          text
          size="large"
        />
        <Menu model={menuItems} popup ref={menu} popupAlignment="left" />
        <Button
          onClick={(event) => {
            menu.current?.toggle(event);
          }}
          icon="pi pi-bars"
          rounded
          text
          size="large"
        />
      </div>
    </div>
  );
}
