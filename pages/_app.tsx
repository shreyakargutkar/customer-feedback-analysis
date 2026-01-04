// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import Nav from "../components/Nav";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 12 }}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
