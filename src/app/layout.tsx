import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/cairo";
import "./globals.css";
import { cookies } from "next/headers";
import { LangProvider } from "@/lib/i18n-client";
import type { Lang } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "GTales — Your child is the Hero",
  description:
    "Personalised interactive storybooks where your child is the hero and each tale unlocks a superpower.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
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
