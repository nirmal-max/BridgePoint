import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CallProvider } from "@/lib/call-context";
import Header from "@/components/Header";
import CallOverlay from "@/components/CallOverlay";
import { LanguageProvider, LanguageSwitcher } from "@/lib/i18n";


export const metadata: Metadata = {
  title: "Bridge Point • Micro-Employment Platform",
  description:
    "Connect with skilled micro-workers in your city. Post jobs, find work, and get things done fast.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0071e3" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      // When a new SW is found, wait for it to install then reload.
                      reg.addEventListener('updatefound', function() {
                        var newSW = reg.installing;
                        if (!newSW) return;
                        newSW.addEventListener('statechange', function() {
                          // New SW has activated and the old one is gone.
                          if (newSW.state === 'activated' && navigator.serviceWorker.controller) {
                            // Reload to let the new SW take over cleanly.
                            window.location.reload();
                          }
                        });
                      });
                    })
                    .catch(function(err) {
                      console.warn('[SW] Registration failed:', err);
                    });

                  // If the controller changes (new SW took over), reload once.
                  var refreshing = false;
                  navigator.serviceWorker.addEventListener('controllerchange', function() {
                    if (refreshing) return;
                    refreshing = true;
                    window.location.reload();
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--color-bp-white)]">
        <AuthProvider>
          <LanguageProvider>
            <CallProvider>
              <Header />
              <div className="fixed right-4 top-3 z-[60]"><LanguageSwitcher /></div>
              <main>{children}</main>
              <CallOverlay />
            </CallProvider>
          </LanguageProvider>
        </AuthProvider>

      </body>
    </html>
  );
}
