import "./globals.css";
import SupabaseListener from "@/components/supabaseListener";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div>
          <SupabaseListener />
        </div>
        <main>{children}</main>
      </body>
    </html>
  );
}
