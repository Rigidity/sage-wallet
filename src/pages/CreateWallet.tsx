import { Button } from "primereact/button";
import { Checkbox } from "primereact/checkbox";
import { InputText } from "primereact/inputtext";
import { useEffect, useRef, useState } from "react";
import { commands } from "../bindings";
import { Chip } from "primereact/chip";
import { Divider } from "primereact/divider";
import { writeText } from "@tauri-apps/api/clipboard";
import { useNavigate } from "react-router-dom";
import { Form, Formik } from "formik";
import { Toast } from "primereact/toast";

export default function CreateWallet() {
  const navigate = useNavigate();

  const [long, setLong] = useState(true);
  const [mnemonic, setMnemonic] = useState("");

  const toast = useRef<Toast>(null);

  const generateMnemonic = () => {
    commands.generateMnemonic(long).then(setMnemonic);
  };

  useEffect(() => {
    generateMnemonic();
  }, [long]);

  const initial = {
    name: "",
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

      <h1 className="mt-0 text-center">Create Wallet</h1>

      <Divider />

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
          commands.importFromMnemonic(values.name, mnemonic).then(() => {
            navigate("/wallet", { replace: true });
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

            <div className="flex align-items-center mt-4">
              <Checkbox
                inputId="long"
                checked={long}
                onChange={(e) => setLong(e.checked ?? false)}
              />
              <label htmlFor="long" className="block ml-2 text-base">
                24 Word Mnemonic
              </label>

              <div className="flex align-items-center ml-auto">
                <Button
                  onClick={generateMnemonic}
                  type="button"
                  icon="pi pi-refresh"
                  size="large"
                  rounded
                  text
                />
                <Button
                  onClick={() => {
                    writeText(mnemonic);
                    toast.current?.show({
                      severity: "success",
                      detail: "Copied mnemonic",
                      life: 2000,
                    });
                  }}
                  type="button"
                  icon="pi pi-copy"
                  size="large"
                  rounded
                  text
                />
              </div>
            </div>

            <div className="flex align-items-center flex-wrap gap-1 justify-content-center mt-4">
              {mnemonic.split(" ").map((word, i) => (
                <Chip key={i} label={word} className="" />
              ))}
            </div>

            <Button
              label="Create Wallet"
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
