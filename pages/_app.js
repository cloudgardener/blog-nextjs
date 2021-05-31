import "@assets/main.css";
import "typeface-source-sans-pro";
import "typeface-source-serif-pro";
import { useEffect } from "react";
import { useRouter } from "next/router";
import * as gtag from "../components/common/Ga/gtag";

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);
  return <Component {...pageProps} />;
}
