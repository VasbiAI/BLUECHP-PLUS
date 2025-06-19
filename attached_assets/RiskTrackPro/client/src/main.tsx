import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.title = "BlueCHP Risk Register";

createRoot(document.getElementById("root")!).render(<App />);
