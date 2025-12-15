import React from "react";
import { Tree, ConfigProvider } from "antd";
import { FolderOutlined, FileOutlined } from "@ant-design/icons";

export default function CategoryTreeWidget({ data }) {
  const convertTreeData = (nodes) => {
    return nodes.map((node) => {
      if (node.type === "file" && node.url) {
        return {
          title: <a href={node.url}>{node.name}</a>,
          key: node.url,
          icon: <FileOutlined />,
          isLeaf: true
        };
      } else {
        return {
          title: <b>{node.name}</b>,
          icon: <FolderOutlined />,
          key: node.name,
          selectable: false,
          children: node.children ? convertTreeData(node.children) : []
        };
      }
    });
  };

  const c = convertTreeData(data);
  console.log(c);
  return (
    <ConfigProvider
      theme={{
        components: {
          Tree: {
            directoryNodeSelectedBg: '#ebebebff'
          },
        }
      }}
    >
      <Tree.DirectoryTree
        treeData={c}
        defaultExpandAll
        showIcon
        onSelect={(selectedKeys, info) => {
          const url = selectedKeys[0];
          if (url && info.node.isLeaf) {
            window.location.href = url;
          }
        }}
      />
    </ConfigProvider>
  );
}
