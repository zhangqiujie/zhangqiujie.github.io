# _plugins/category_tree.rb
require "json"

module Jekyll
  class CategoryTreeGenerator
    def self.generate(site)
      tree = {}
      
      site.posts.docs.each do |post|
        current = tree
        categories = post.data["categories"] || []

        categories.each do |cat|
          current[cat] ||= {}
          current = current[cat]
        end

        current["_files"] ||= []
        current["_files"] << {
          "name" => post.data["title"],
          "type" => "file",
          "url"  => post.url
        }
      end

      build_tree(tree)
    end

    def self.build_tree(node)
      result = []

      node.each do |key, value|
        if key == "_files"
          result.concat(value)
        else
          result << {
            "name" => key,
            "children" => build_tree(value)
          }
        end
      end

      result
    end
  end
end

# Hook 在 post_write 阶段生成 JSON
Jekyll::Hooks.register :site, :post_write do |site|
  json_tree = Jekyll::CategoryTreeGenerator.generate(site)
  json_str  = JSON.pretty_generate(json_tree)

  # 最终输出目录，优先使用环境变量 SITE_BASE_PATH
  site_base = ENV['SITE_BASE_PATH'] && !ENV['SITE_BASE_PATH'].empty? ? ENV['SITE_BASE_PATH'] : site.dest
  output_dir = File.join(site_base, "assets")

  # 创建目录（可创建多级目录）
  FileUtils.mkdir_p(output_dir)

  output_file = File.join(output_dir, "category_tree.json")

  # 幂等写入
  if File.exist?(output_file)
    old = File.read(output_file, encoding: "utf-8")
    next if old == json_str
  end

  File.write(output_file, json_str, encoding: "utf-8")
end
