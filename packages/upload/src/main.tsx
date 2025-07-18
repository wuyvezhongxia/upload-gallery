import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/index.ts";
import App from "./App.tsx";
import GalleryRoute from "./pages/gallery";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@ant-design/v5-patch-for-react-19";
import "./assets/common.scss";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/gallery" element={<GalleryRoute />} />
      </Routes>
    </BrowserRouter>
  </Provider>
);
