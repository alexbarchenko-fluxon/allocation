import { createRoot } from "react-dom/client";
import AppStandalone from "@/AppStandalone";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@/index.css";

createRoot(document.getElementById("root")!).render(<AppStandalone />);
