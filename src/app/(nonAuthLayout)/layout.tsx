import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rapid Keys",
  description: "Typing Battle against your friends",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
