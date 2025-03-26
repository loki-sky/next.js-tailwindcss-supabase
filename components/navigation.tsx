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

  if (session === null) {
    if (pathname?.includes("/profile") || pathname?.includes("/chats")) {
      router.push("/");
    }
  }

  return (
    <header>
      <div className="flex items-center justify-between px-4 bg-white shadow-md">
        <nav className="hidden md:flex space-x-4">
          {session ? (
            <></>
          ) : (
            <>
              <div>
                <ModalCore modalType={ModalType.SignIn} />
              </div>
              <div>
                <ModalCore modalType={ModalType.SignUp} />
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
