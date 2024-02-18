         // This file was generated by [tauri-specta](https://github.com/oscartbeaumont/tauri-specta). Do not edit this file manually.

         export const commands = {
async generateMnemonic(long: boolean) : Promise<string> {
return await TAURI_INVOKE("plugin:tauri-specta|generate_mnemonic", { long });
},
async verifyMnemonic(mnemonic: string) : Promise<boolean> {
return await TAURI_INVOKE("plugin:tauri-specta|verify_mnemonic", { mnemonic });
},
async keyList() : Promise<KeyList> {
return await TAURI_INVOKE("plugin:tauri-specta|key_list");
},
async importFromMnemonic(name: string, mnemonic: string) : Promise<null> {
return await TAURI_INVOKE("plugin:tauri-specta|import_from_mnemonic", { name, mnemonic });
},
async deleteFingerprint(fingerprint: number) : Promise<null> {
return await TAURI_INVOKE("plugin:tauri-specta|delete_fingerprint", { fingerprint });
},
async logIn(fingerprint: number | null) : Promise<null> {
return await TAURI_INVOKE("plugin:tauri-specta|log_in", { fingerprint });
}
}



/** user-defined types **/

export type KeyInfo = { name: string; mnemonic: string | null; secretKey: string | null; publicKey: string; fingerprint: number }
export type KeyList = { activeFingerprint: number | null; keys: KeyInfo[] }

/** tauri-specta globals **/

         import { invoke as TAURI_INVOKE } from "@tauri-apps/api";
import * as TAURI_API_EVENT from "@tauri-apps/api/event";
import { type WebviewWindowHandle as __WebviewWindowHandle__ } from "@tauri-apps/api/window";

type __EventObj__<T> = {
  listen: (
    cb: TAURI_API_EVENT.EventCallback<T>
  ) => ReturnType<typeof TAURI_API_EVENT.listen<T>>;
  once: (
    cb: TAURI_API_EVENT.EventCallback<T>
  ) => ReturnType<typeof TAURI_API_EVENT.once<T>>;
  emit: T extends null
    ? (payload?: T) => ReturnType<typeof TAURI_API_EVENT.emit>
    : (payload: T) => ReturnType<typeof TAURI_API_EVENT.emit>;
};

type __Result__<T, E> =
  | { status: "ok"; data: T }
  | { status: "error"; error: E };

function __makeEvents__<T extends Record<string, any>>(
  mappings: Record<keyof T, string>
) {
  return new Proxy(
    {} as unknown as {
      [K in keyof T]: __EventObj__<T[K]> & {
        (handle: __WebviewWindowHandle__): __EventObj__<T[K]>;
      };
    },
    {
      get: (_, event) => {
        const name = mappings[event as keyof T];

        return new Proxy((() => {}) as any, {
          apply: (_, __, [window]: [__WebviewWindowHandle__]) => ({
            listen: (arg: any) => window.listen(name, arg),
            once: (arg: any) => window.once(name, arg),
            emit: (arg: any) => window.emit(name, arg),
          }),
          get: (_, command: keyof __EventObj__<any>) => {
            switch (command) {
              case "listen":
                return (arg: any) => TAURI_API_EVENT.listen(name, arg);
              case "once":
                return (arg: any) => TAURI_API_EVENT.once(name, arg);
              case "emit":
                return (arg: any) => TAURI_API_EVENT.emit(name, arg);
            }
          },
        });
      },
    }
  );
}

     