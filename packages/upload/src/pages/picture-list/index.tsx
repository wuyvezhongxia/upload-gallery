import { Button, Pagination,ConfigProvider } from "antd";
import type { PaginationProps } from "antd";
import "./index.scss";
import zhCN from "antd/locale/zh_CN"; 
import { useSelector} from "react-redux";
import type { RootState } from "@/store";
import { useEffect } from "react";
import { message } from "antd";

const onShowSizeChange: PaginationProps["onShowSizeChange"] = (
  current,
  pageSize
) => {
  console.log(current, pageSize);
};

const FileList = () => {
  const { imgList } = useSelector((state: RootState) => state.image);
  
  const preview = ()=>{

  }

  const copyUrl = (url)=>{

  }
  const copyMd = (url)=>{

  }

  return (
    <ConfigProvider locale={zhCN}>
      <div className="listContainer">
        <p className="top">历史上传记录 ↓（本地存储）</p>
        {imgList.length === 0 ? (
          <div className="empty-state">
            <p>暂无上传记录</p>
          </div>
        ) : (
          <ul className="file-list">
            {imgList.map((item,index) => (
              <li key={index}>
                <span className="left">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.name}
                  </a>
                </span>
                <span className="right">
                  <Button title="文件大小">120B</Button>
                  <Button onClick={preview} title="预览图片">预览</Button>
                  <Button onClick={()=>copyUrl(item.url)} title="复制链接">链接</Button>
                  <Button onClick={()=>copyMd(item.url)} title="复制Markdown格式">MD</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="pagination">
          <Pagination
            total={5}
            showTotal={(total) => `共 ${total} 条`}
            onShowSizeChange={onShowSizeChange}
            defaultPageSize={20}
            defaultCurrent={1}
            showSizeChanger={true}
            pageSizeOptions={[20, 50, 100, 200]}
          />
        </div>
      </div>
    </ConfigProvider>
  );
}
export default FileList;
