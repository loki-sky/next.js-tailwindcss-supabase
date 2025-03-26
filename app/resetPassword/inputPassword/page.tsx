"use client";
import { useState } from "react";
import { AuthError } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Password reset screen
 */
const InputPasswordForReset = () => {
  const [password, setPassword] = useState("");
  const [passwordConf, setPasswordConf] = useState("");
  const [isSend, setIsSend] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== passwordConf) {
      setError({
        name: "MismatchError",
        message: "Passwords do not match.",
      } as AuthError);
      return;
    }

    try {
      const supabase = createClientComponentClient();

      // ✅ Check if session is available (user came via reset link)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError({
          name: "SessionError",
          message:
            "Session expired or not found. Please restart the reset process.",
        } as AuthError);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error);
        throw error;
      }

      setIsSend(true);
    } catch (error) {
      console.log(error);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-20 text-center lg:pt-32">
        <p className="text-red-600 font-medium">Error: {error.message}</p>
      </div>
    );
  }

  if (isSend) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-20 text-center lg:pt-32">
        <div className="text-[40px]">Changed the Password Successfully!</div>
        <div className="inline-flex items-center justify-center shrink-0 w-32 h-32 text-green-500 bg-green-100 rounded-full mt-10 dark:bg-green-800 dark:text-green-200">
          <svg
            className="w-24 h-24"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
          </svg>
          <span className="sr-only">Check icon</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl md:w-1/2 lg:w-1/4 px-4 sm:px-6 lg:px-8 pb-16 pt-20 text-center lg:pt-32">
      <p className="text-lg font-semibold mb-4">Enter your new password</p>
      <form className="pt-10 text-left" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="password"
            className="block mb-2 text-sm font-medium text-gray-900"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="••••••••"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="pt-5">
          <label
            htmlFor="passwordConf"
            className="block mb-2 text-sm font-medium text-gray-900"
          >
            Confirm Password
          </label>
          <input
            type="password"
            name="passwordConf"
            id="passwordConf"
            placeholder="••••••••"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            required
            value={passwordConf}
            onChange={(e) => setPasswordConf(e.target.value)}
          />
        </div>
        <div className="text-center mt-5">
          <button
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-10 py-2.5 text-center"
            type="submit"
          >
            Update Password
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputPasswordForReset;
