# Dumps the original game's Ruby scripts (game/Data/Scripts.rvdata, 176 scripts / ~190k lines) into one
# searchable text file for research. Each script starts with a "#==== <index> <name>" line.
# Usage: ruby tools/dump_scripts.rb [game/Data/Scripts.rvdata] [research/all.rb]
require 'zlib'
require 'fileutils'

src = ARGV[0] || 'game/Data/Scripts.rvdata'
out = ARGV[1] || 'research/all.rb'
FileUtils.mkdir_p(File.dirname(out))
scripts = Marshal.load(File.binread(src))
File.open(out, 'w') do |f|
  scripts.each_with_index do |(_id, name, code), i|
    f.puts "#==== #{i} #{name.force_encoding('UTF-8')}"
    f.puts Zlib::Inflate.inflate(code).force_encoding('UTF-8')
  end
end
puts "#{scripts.size} scripts → #{out}"
