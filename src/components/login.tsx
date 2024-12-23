import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Login() {
  const [error, setError] = useState("");
  const [account, setAccount] = useState("");
  const [ucloud_password, setUcloudPassword] = useState("");
  const [jwxt_password, setJwxtPassword] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // 阻止默认的表单提交行为
    try {
      await invoke("get_auth", { account, ucloudPassword: ucloud_password, jwxtPassword: jwxt_password });
      setError(""); // 清除错误信息
      formRef.current?.submit();
    } catch (err: any) {
      console.error(err);
      setError("Wrong Account or Password!"); // 设置错误信息
    }
  }

  return (
    <div className="flex justify-center items-center">
      <div className="mt-7 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
        <div className="p-4 sm:p-7">
          <div className="mt-5">
            <form ref={formRef} onSubmit={handleSubmit}>
              <div className="grid gap-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="account" className="block text-sm mb-2 dark:text-white">Account</label>
                  </div>
                  <div className="relative">
                    <input type="text" id="account" name="account" value={account} onChange={(e) => setAccount(e.target.value)} className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" required aria-describedby="email-error" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-sm mb-2 dark:text-white">Ucloud Password</label>
                  </div>
                  <div className="relative">
                    <input type="password" id="password" name="password" value={ucloud_password} onChange={(e) => setUcloudPassword(e.target.value)} className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" required aria-describedby="password-error" />
                    <div className="hidden absolute inset-y-0 end-0 pointer-events-none pe-3">
                      <svg className="size-5 text-red-500" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="hidden text-xs text-red-600 mt-2" id="password-error">8+ characters required</p>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-sm mb-2 dark:text-white">Jwxt Password</label>
                  </div>
                  <div className="relative">
                    <input type="password" id="password" name="password" value={jwxt_password} onChange={(e) => setJwxtPassword(e.target.value)} className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600" required aria-describedby="password-error" />
                    <div className="hidden absolute inset-y-0 end-0 pointer-events-none pe-3">
                      <svg className="size-5 text-red-500" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="hidden text-xs text-red-600 mt-2" id="password-error">8+ characters required</p>
                </div>

                {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                <button type="submit" className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none">Sign in</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}