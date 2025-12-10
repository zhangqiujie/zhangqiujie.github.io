# _plugins/test_plugin.rb
module Jekyll
  class TestTag < Liquid::Tag
    def render(context)
      "Hello from custom plugin!"
    end
  end
end

Liquid::Template.register_tag('test_plugin', Jekyll::TestTag)