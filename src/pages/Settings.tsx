import Nav from "../components/Nav";

export default function Settings() {
  return (
    <>
      <Nav canGoBack />

      <div className="p-4">
        <div className="text-lg">Connected Peers</div>
      </div>
    </>
  );
}
