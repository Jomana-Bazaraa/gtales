import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/cairo";
import "./globals.css";
import { cookies } from "next/headers";
import { LangProvider } from "@/lib/i18n-client";
import type { Lang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Estoria — Stories your child lives, not just hears",
  description:
    "Personalized interactive storybooks where your child helps a Keeper solve the exact struggle they face. Two free PDFs, instantly.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#fff8ef",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const store = await cookies();
  const lang = (store.get("lang")?.value === "ar" ? "ar" : "en") as Lang;
  return (
    <html
      lang={lang}
      dir={lang === "ar" ? "rtl" : "ltr"}
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
