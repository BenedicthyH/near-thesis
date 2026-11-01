import './globals.css';
export const metadata = {
  title: 'NEAR Investment Thesis — Live Onchain Dashboard',
  description: 'Evidence-first, reproducible investment thesis for NEAR. Built at NEAR HACKATHON.',
};
export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
