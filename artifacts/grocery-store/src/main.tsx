import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { preloadStoreConfig } from "@/lib/store-config";

preloadStoreConfig();

createRoot(document.getElementById("root")!).render(<App />);
