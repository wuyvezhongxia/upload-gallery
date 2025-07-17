import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { cleanExpiredImages } from "@yuanjing/shared";
import Header from "./pages/header";
import UploadFile from "./pages/upload-file";
import FileList from "./pages/picture-list";
import UploadTool from "./pages/upload-tool";

function App() {
  const dispatch = useDispatch();

  // 在应用启动时清理过期图片
  useEffect(() => {
    dispatch(cleanExpiredImages());
  }, [dispatch]);

  // 定期清理（可选）
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(cleanExpiredImages());
    }, 24 * 60 * 60 * 1000); // 每24小时清理一次

    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <>
      <Header></Header>
      <UploadFile></UploadFile>
      <UploadTool></UploadTool>
      <FileList></FileList>
    </>
  );
}

export default App;
