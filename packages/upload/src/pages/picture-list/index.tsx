import { Button, Pagination,ConfigProvider } from "antd";
import type { PaginationProps } from "antd";
import "./index.scss";
import zhCN from "antd/locale/zh_CN"; 

const onShowSizeChange: PaginationProps["onShowSizeChange"] = (
  current,
  pageSize
) => {
  console.log(current, pageSize);
};

const FileList = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <div className="listContainer">
        <p className="top">历史上传记录 ↓（本地存储）</p>
        <ul className="file-list">
          <li>
            <span className="left">
              <i></i>
              <a href="">image.png</a>
            </span>
            <span className="right">
              <Button>120B</Button>
              <Button>120B</Button>
              <Button>url</Button>
              <Button>md</Button>
            </span>
          </li>
          <li>2</li>
          <li>2</li>
        </ul>
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
