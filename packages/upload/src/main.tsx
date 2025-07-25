import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/index.ts";
import App from "./App.tsx";
import "@ant-design/v5-patch-for-react-19";
import "./assets/common.scss";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <App />
  </Provider>
);
