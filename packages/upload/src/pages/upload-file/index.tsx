import { CloudUploadOutlined } from "@ant-design/icons";
import {  Upload ,message} from "antd";
import './index.scss'
import { useState,useEffect,useRef } from "react";
import { addImage } from "../../store/modules/imageStore";
import { uploadFile } from "../../utils/qiniu";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import { compressImage } from "../../utils/image";


const { Dragger } = Upload;
// 定义文件状态的接口
interface UploadableFile {
  uid: string; // antd 需要 uid 来追踪文件
  raw: File;
  name: string;
  status: "ready" | "uploading" | "success" | "error";
  percent?: number;
}


const UploadFile = () => {
  const [isCopy, setIsCopy] = useState(false);
  const dispatch = useDispatch();
  const {qiniu} = useSelector((state:RootState) => state.config);
  const [fileList,setFileList] = useState<UploadableFile[]>([])
  const pasteAreaRef= useRef<HTMLTextAreaElement>(null)

  useEffect(()=>{
    console.log('filefilefilefile',fileList);
    const uploadQueue = fileList.filter(file=>file.status === 'ready')
    if(uploadQueue.length === 0) return 
    const upload = async(file:UploadableFile)=>{
      console.log('eeeeeeeeeeeeeeeeeee',file);
      
      setFileList((prev)=>
        prev.map(f=>f.uid === file.uid?{...f,status:'uploading'}:f)
      );
      try{
        const url = await uploadFile(file.raw,qiniu,{
          process:(percent)=>{
            setFileList(prev=>prev.map(f=>f.uid=== file.uid ? {...f,percent}:f))
          }
        })
        console.log('1111111111111',url);
        message.success(`${file.name}上传成功`)
        dispatch(addImage({
          url,
          name:file.name || 'image',
          size:file.raw.size || 0,
          originSize:file.raw.size,
          date: Date.now()
        }))
        setFileList(prev=>prev.map(f=>f.uid===file.uid?{...f,status:'success'}:f))
        setTimeout(()=>{
          setFileList((prev)=>prev.filter(f=>f.uid !== file.uid))
        })
      }catch(error){
        message.error(`${file.name} 上传失败: ${error}`);
        setFileList((prev) =>
          prev.map((f) => (f.uid === file.uid ? { ...f, status: "error" } : f))
        );
      }
    }
    uploadQueue.forEach(upload)
  },[fileList])

  // 处理拖拽上传
  const handleBeforeUpload = async (file:File)=>{
    console.log('ffffffffffffffffffff',file);
    const isImage = file.type.startsWith("image/")
    if(!isImage){
      message.error('只能上传图片')
      return false
    }
    message.loading("正在压缩图片...", 0);
    
    const compressFile = await compressImage(file,{
      quality:80,
      width:1200,
      noCompressIfLarger:true
    })
    message.destroy();
    setFileList((prev) => [
      ...prev,
      {
        uid: `drag-${Date.now()}-${Math.random()}`,
        raw:compressFile,
        name:compressFile.name,
        status:'ready',
        percent:0
      },
    ]);
    return false;
  }
  const copyFile = () => {
    setIsCopy(true);
  };
  // 处理粘贴事件
  useEffect(()=>{
    const handlePaste = async (e:ClipboardEvent)=>{
      e.preventDefault()
      console.log("eeeeeeeeeeeeeeee", e);
      const items = e.clipboardData?.items;
      console.log(items)
      if(!items) return;
      let hasImage = false;
      const newFiles: UploadableFile[] = []
      for(const item of Array.from(items)){
        if(item.kind === 'file' && item.type.startsWith('image')){
          const file = item.getAsFile()
          if(file){
            hasImage = true
            message.loading("正在压缩图片...", 0)
            const compressFile = await compressImage(file, {
              quality: 80,
              width: 1200,
              noCompressIfLarger: true,
            });
            message.destroy();
            newFiles.push({
              uid: `paste-${Date.now()}-${Math.random()}`,
              raw: compressFile,
              name: compressFile.name || `pasted-image-${Date.now()}`,
              status: "ready",
              percent: 0,
            });
          }
        }
      }
      if (hasImage) {
        setFileList((prev) => [...prev, ...newFiles]);
      } else {
        message.error("剪贴板中没有图片");
      }
    }
    const el = pasteAreaRef.current;
    if (el) {
      el.addEventListener("paste", handlePaste);
    }
    return () => {
      if (el) {
        el.removeEventListener("paste", handlePaste);
      }
    };
  },[])
  return (
    <div className="upload-container">
      <textarea
        ref={pasteAreaRef}
        className={isCopy ? "paste-active" : ""}
        id="paste-area"
        placeholder={
          !isCopy
            ? "你也可以点击此处，然后粘贴你要上传的图片"
            : "现在你可以粘贴了"
        }
        onClick={copyFile}
        readOnly
      />

      <Dragger beforeUpload={handleBeforeUpload} showUploadList={false}>
        <p className="ant-upload-drag-icon">
          <CloudUploadOutlined />
        </p>
        <p className="ant-upload-text">
          拖拽文件到这里或<span>点击上传</span>
        </p>
      </Dragger>
    </div>
  );
};
export default UploadFile;

