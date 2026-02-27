import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Guestbook — Hand-Drawn Guestbook Widget",
    template: "%s | Guestbook",
  },
  description:
    "Add a hand-drawn guestbook to your website. Visitors leave signatures, doodles, and messages — embeddable in one line of code.",
  metadataBase: new URL("https://guestbook.cv"),
  openGraph: {
    title: "Guestbook — Hand-Drawn Guestbook Widget",
    description:
      "Add a hand-drawn guestbook to your website. Visitors leave signatures, doodles, and messages — embeddable in one line of code.",
    url: "https://guestbook.cv",
    siteName: "Guestbook",
    type: "website",
    images: [{ url: "/og-guestbook.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guestbook — Hand-Drawn Guestbook Widget",
    description:
      "Add a hand-drawn guestbook to your website. Visitors leave signatures, doodles, and messages — embeddable in one line of code.",
    images: ["/og-guestbook.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.className} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
        <Script id="posthog" strategy="afterInteractive">{`
          !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identify setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags resetGroups onFeatureFlags addFeatureFlagsHandler onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
          posthog.init('phc_6arqZ8ehO0aAOsAhWczSwMGVf4Bia4dRkGjZDoBVUW7',{api_host:'https://eu.i.posthog.com',defaults:'2026-01-30'})
        `}</Script>
      </body>
    </html>
  );
}
