import React from 'react';
import { Tree } from 'antd';
import 'antd/dist/reset.css';

export default function TreeWidget({ data }) {

  // 将你的 JSON 转换为 AntD Tree 可用格式
  const convertTreeData = (nodes) => {
    return nodes.map(node => {
      if (node.type === 'file' && node.url) {
        return {
          title: <a href={node.url}>{node.name}</a>, // 点击跳转
          key: node.url,
          isLeaf: true
        };
      } else {
        return {
          title: <b>{node.name}</b>,
          key: node.name,
          children: node.children ? convertTreeData(node.children) : []
        };
      }
    });
  };

  return <Tree treeData={convertTreeData(data)} defaultExpandAll />;
}
