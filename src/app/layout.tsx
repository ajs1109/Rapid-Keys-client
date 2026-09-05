import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Free Typing Speed Test | WPM and Accuracy | Rapid Keys",
  description: "Start a free 60-second typing test instantly. Measure your words per minute and accuracy, save your best score, or challenge friends online.",
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="user-data" content="" />
      </head>
      <body className="antialiased">
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1a1d27',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#e2e8f0',
            },
          }}
        />
          {children}
      </body>
    </html>
  );
}
