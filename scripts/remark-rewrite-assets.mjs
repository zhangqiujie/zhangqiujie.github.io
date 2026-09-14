function visit(node, callback) {
  callback(node);
  node.children?.forEach((child) => visit(child, callback));
}

function withBase(url, base) {
  if (!url.startsWith('/assets/')) return url;
  return `${base.replace(/\/$/, '/')}${url.slice(1)}`;
}

export default function rewriteAssetPaths({ base = '/' } = {}) {
  return (tree) => visit(tree, (node) => {
    if (node.type === 'image' && typeof node.url === 'string') node.url = withBase(node.url, base);
  });
}
