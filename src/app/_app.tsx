import { useInitializeAuth } from "../store/useGameStore";

function MyApp({ Component, pageProps }) {
    useInitializeAuth(); // Initialize auth on app load
  
    return <Component {...pageProps} />;
  }
  
  export default MyApp;