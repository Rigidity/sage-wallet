import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Divider } from "primereact/divider";
import { RadioButton } from "primereact/radiobutton";
import { InputTextarea } from "primereact/inputtextarea";
import { Form, Formik } from "formik";
import { commands } from "../bindings";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { Toast } from "primereact/toast";

const enum Kind {
  Mnemonic = "Mnemonic",
  SecretKey = "Secret key",
  PublicKey = "Public key",
}

export default function ImportWallet() {
  const navigate = useNavigate();

  const toast = useRef<Toast>(null);

  const initial = {
    name: "",
    kind: Kind.Mnemonic,
    mnemonic: "",
    secretKey: "",
    publicKey: "",
  };

  return (
    <div className="surface-card p-4 shadow-2 border-round m-auto mt-8 sm:w-10 md:w-8 lg:w-6">
      <Toast ref={toast} />

      <Button
        onClick={() => navigate(-1)}
        icon="pi pi-chevron-left"
        rounded
        text
        size="large"
        className="absolute"
      />

      <h1 className="mt-0 text-center">Import Wallet</h1>

      <Divider />

      <Formik
        initialValues={initial}
        validate={async (values) => {
          const errors: Partial<Record<keyof typeof initial, string>> = {};

          if (!values.name) {
            errors.name = "Required";
          }

          switch (values.kind) {
            case Kind.Mnemonic: {
              if (!values.mnemonic) {
                errors.mnemonic = "Required";
                break;
              }

              const isValid = await commands.verifyMnemonic(values.mnemonic);
              if (!isValid) {
                errors.mnemonic = "Invalid phrase";
              }

              break;
            }
            case Kind.SecretKey: {
              if (!values.secretKey) {
                errors.secretKey = "Required";
              }

              if (!/(?:0[xX])?[0-9a-fA-F]{64}/.test(values.secretKey)) {
                errors.secretKey = "Invalid secret key";
              }

              break;
            }
            case Kind.PublicKey: {
              if (!values.publicKey) {
                errors.publicKey = "Required";
              }

              if (!/(?:0[xX])?[0-9a-fA-F]{96}/.test(values.publicKey)) {
                errors.publicKey = "Invalid public key";
              }

              break;
            }
          }

          return errors;
        }}
        onSubmit={(values, { setSubmitting }) => {
          const finished = (
            result: Awaited<ReturnType<typeof commands.importFromMnemonic>>,
          ) => {
            if (result.status === "ok") {
              navigate("/wallet", { replace: true });
            } else {
              toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Failed to import wallet, invalid key.",
              });
              setSubmitting(false);
            }
          };

          switch (values.kind) {
            case Kind.Mnemonic: {
              commands
                .importFromMnemonic(values.name, values.mnemonic)
                .then(finished);
              break;
            }
            case Kind.SecretKey: {
              commands
                .importFromSecretKey(
                  values.name,
                  values.secretKey.replace(/0[xX]/, "").toLowerCase(),
                )
                .then(finished);
              break;
            }
            case Kind.PublicKey: {
              commands
                .importFromPublicKey(
                  values.name,
                  values.publicKey.replace(/0[xX]/, "").toLowerCase(),
                )
                .then(finished);
              break;
            }
          }
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

            <div className="flex flex-wrap flex-column gap-2 mt-4">
              <div className="flex align-items-center">
                <RadioButton
                  inputId="kind1"
                  name="kind"
                  value={Kind.Mnemonic}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  checked={values.kind === Kind.Mnemonic}
                />
                <label htmlFor="kind1" className="ml-2">
                  {Kind.Mnemonic}
                </label>
              </div>
              <div className="flex align-items-center">
                <RadioButton
                  inputId="kind2"
                  name="kind"
                  value={Kind.SecretKey}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  checked={values.kind === Kind.SecretKey}
                />
                <label htmlFor="kind2" className="ml-2">
                  {Kind.SecretKey}
                </label>
              </div>
              <div className="flex align-items-center">
                <RadioButton
                  inputId="kind3"
                  name="kind"
                  value={Kind.PublicKey}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  checked={values.kind === Kind.PublicKey}
                />
                <label htmlFor="kind3" className="ml-2">
                  {Kind.PublicKey}
                </label>
              </div>
            </div>

            <div className="mt-4">
              {values.kind === Kind.Mnemonic && (
                <>
                  <InputTextarea
                    placeholder="Mnemonic phrase"
                    name="mnemonic"
                    value={values.mnemonic}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={3}
                    className={`w-full ${
                      touched.mnemonic && errors.mnemonic && "p-invalid"
                    }`}
                  />
                  {touched.mnemonic && errors.mnemonic && (
                    <div className="text-red-500 mt-1">{errors.mnemonic}</div>
                  )}
                </>
              )}

              {values.kind === Kind.SecretKey && (
                <>
                  <InputText
                    placeholder="Secret key"
                    name="secretKey"
                    value={values.secretKey}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full ${
                      touched.secretKey && errors.secretKey && "p-invalid"
                    }`}
                  />
                  {touched.secretKey && errors.secretKey && (
                    <div className="text-red-500 mt-1">{errors.secretKey}</div>
                  )}
                </>
              )}

              {values.kind === Kind.PublicKey && (
                <>
                  <InputText
                    placeholder="Public key"
                    name="publicKey"
                    value={values.publicKey}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full ${
                      touched.publicKey && errors.publicKey && "p-invalid"
                    }`}
                  />
                  {touched.publicKey && errors.publicKey && (
                    <div className="text-red-500 mt-1">{errors.publicKey}</div>
                  )}
                </>
              )}
            </div>

            <Button
              label="Import Wallet"
              type="submit"
              className="w-full mt-5"
              disabled={isSubmitting}
            />
          </Form>
        )}
      </Formik>
    </div>
  );
}
