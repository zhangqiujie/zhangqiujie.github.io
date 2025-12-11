# After you modified some react components codes and saved, then webpack will be triggered.
require 'listen'

if ENV['JEKYLL_ENV'] != 'production' # only for local environment
    # 全局标记，确保插件只启动一次
    unless defined?($webpack_listener_started) && $webpack_listener_started
    $webpack_listener_started = true
    puts "[WatchJS] Webpack listener initializing..."

    listener = Listen.to('_javascript/react') do |modified, added, removed|
        js_changed = (modified + added + removed).select { |f| f.end_with?('.js', '.jsx') }
        unless js_changed.empty?
        puts "[WatchJS] JS changed: #{js_changed.inspect}, running webpack..."
        system("npm run pack:dev")
        end
    end

    listener.start
    puts "[WatchJS] Webpack listener started."
    else
    puts "[WatchJS] Listener already started, skipping..."
    end
else
  puts "[WatchJS] Production build, skipping listener."
end