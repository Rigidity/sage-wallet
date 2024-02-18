import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { commands } from "../bindings";

export default function Wallet() {
  const navigate = useNavigate();

  const logOut = () => {
    commands.logIn(null).then(() => {
      navigate("/login");
    });
  };

  return <Button onClick={logOut} label="Back to login" />;
}
