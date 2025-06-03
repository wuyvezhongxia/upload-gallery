import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// import "@ant-design/v5-patch-for-react-19";
import "./assets/common.scss";

createRoot(document.getElementById("root")!).render(<App />);
