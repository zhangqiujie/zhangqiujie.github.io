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
      json_str = JSON.pretty_generate(json_tree)
      # 写入文件前判断是否变化
      file_path = File.join(site.source, "assets/category_tree.json")
      if File.exist?(file_path)
        old_content = File.read(file_path, encoding: 'utf-8')
        return if old_content == json_str # 内容一样就不写入
      end

      File.open(file_path, "w", encoding: 'utf-8') do |f|
        f.write(json_str)
      end
    end
  end
end
