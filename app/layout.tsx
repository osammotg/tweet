import type { ReactNode } from "react";

export const metadata = {
  title: "Einstein Roast Lab",
  description: "Generate high-energy roast scripts with Einstein flair."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
