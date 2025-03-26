"use client";
import type { Session } from "@supabase/auth-helpers-nextjs";
import { usePathname, useRouter } from "next/navigation";
import ModalCore from "./modalCore";
import { ModalType } from "./modal/modalType";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const Navigation = ({ session }: { session: Session | null }) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  if (session === null && pathname?.includes("/chats")) {
    router.push("/");
  }

  if (session) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0"></div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <ModalCore modalType={ModalType.SignIn} />
              <ModalCore modalType={ModalType.SignUp} />
            </div>
          </div>

          <div className="md:hidden">
            <button
              type="button"
              className="bg-blue-600 inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-blue-500 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
