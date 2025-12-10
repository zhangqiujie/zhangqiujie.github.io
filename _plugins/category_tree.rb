# _plugins/category_tree.rb
# 生成 _data/category_tree.json，用于前端树状目录
module Jekyll
  class CategoryTreeGenerator < Generator
    safe true
    priority :high

    def generate(site)
      tree = {}

      site.posts.docs.each do |post|
        current = tree
        categories = post.data['categories'] || []

        # 遍历文章的分类层级
        categories.each do |cat|
          current[cat] ||= {}
          current = current[cat]
        end

        # "_files" 存放直属文章
        current["_files"] ||= []
        current["_files"] << {
          "name" => post.data['title'],
          "type" => "file",
          "url"  => post.url # Jekyll 会自动生成相对 URL
        }
      end

      # 递归把 tree 转成前端可用的 JSON 格式
      def build_tree(node)
        result = []
        node.each do |key, value|
          if key == "_files"
            value.each do |file|
              result << file
            end
          else
            children = build_tree(value)
            result << {
              "name" => key,
              "children" => children
            }
          end
        end
        result
      end

      json_tree = build_tree(tree)

      # 写入 _data/category_tree.json
        File.open(File.join(site.source, "assets/category_tree.json"), "w", encoding: 'utf-8') do |f|
        f.write(JSON.pretty_generate(json_tree))
        end
    end
  end
end
