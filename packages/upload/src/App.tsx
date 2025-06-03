import Header from "./pages/header"
import UploadFile from "./pages/upload"
import FileList from "./pages/picture-list"
import UploadTool from "./pages/upload-tool"
function App() {

  return (
    <>
      <Header></Header>
      <UploadFile></UploadFile>
      <UploadTool></UploadTool>
      <FileList></FileList>
    </>
  );
}

export default App
