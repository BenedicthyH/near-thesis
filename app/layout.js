import './globals.css';
export const metadata = {
  title: 'NEAR Investment Thesis: Live Onchain Dashboard',
  description: 'A NEAR investment thesis you can re-run from public data. Built for the NEAR Hackathon.',
};
export const viewport = { width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
