import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { create, BaseDirectory } from '@tauri-apps/plugin-fs';

interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const PasswordInput = ({ id, label, value, onChange }: PasswordInputProps) => (
  <div>
    <div className="flex justify-between items-center">
      <label htmlFor={id} className="block text-sm mb-2 dark:text-white">{label}</label>
    </div>
    <div className="relative">
      <input
        type="password"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:focus:ring-neutral-600"
        required
      />
    </div>
  </div>
);

export default function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    account: "",
    ucloud_password: "",
    jwxt_password: ""
  });
  const formRef = useRef<HTMLFormElement>(null);

  const updateFormData = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const file = await create('auth.json', { baseDir: BaseDirectory.AppData });
      const json = await invoke("get_auth", { 
        account: formData.account, 
        ucloudPassword: formData.ucloud_password, 
        jwxtPassword: formData.jwxt_password 
      });
      
      await file.write(new TextEncoder().encode(json as string));
      await file.close();
      formRef.current?.submit();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center">
      <div className="mt-7 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-neutral-900 dark:border-neutral-700">
        <div className="p-4 sm:p-7">
          <div className="mt-5">
            <form ref={formRef} onSubmit={handleSubmit} className="grid gap-y-4">
              <div>
                <label htmlFor="account" className="block text-sm mb-2 dark:text-white">Account</label>
                <input
                  type="text"
                  id="account"
                  value={formData.account}
                  onChange={(e) => updateFormData("account")(e.target.value)}
                  className="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:focus:ring-neutral-600"
                  required
                />
              </div>

              <PasswordInput
                id="ucloud_password"
                label="Ucloud Password"
                value={formData.ucloud_password}
                onChange={updateFormData("ucloud_password")}
              />

              <PasswordInput
                id="jwxt_password"
                label="Jwxt Password"
                value={formData.jwxt_password}
                onChange={updateFormData("jwxt_password")}
              />

              {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}