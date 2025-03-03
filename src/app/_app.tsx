import { AppProps } from "next/app";
import { useInitializeAuth } from "../store/useGameStore";

function MyApp({ Component, pageProps }: AppProps) {
    useInitializeAuth(); // Initialize auth on app load
  
    return <Component {...pageProps} />;
  }
  
  export default MyApp;