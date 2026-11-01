# Converts the original RPG Maker VX data (game/Data/*.rvdata) to JSON for the new engine.
# (runs on the system Ruby 2.6)
# Usage: ruby tools/extract.rb <game/Data> <out dir> [map ids...]
require 'json'
require 'zlib'

module RPG; end
def make_cls(ns, n)
  c = Class.new
  ns.const_set(n, c)
  c
end
%w(Actor Enemy Skill Item Weapon Armor Troop State Class Map MapInfo Event CommonEvent EventCommand MoveRoute
   MoveCommand AudioFile BGM BGS ME SE Area Animation System BaseItem UsableItem).each { |n| make_cls(RPG, n) }
%w(Event::Page Event::Page::Condition Event::Page::Graphic Enemy::Action Enemy::DropItem Troop::Member Troop::Page
   Troop::Page::Condition Class::Learning Animation::Frame Animation::Timing System::Words System::Vehicle
   System::TestBattler System::Terms).each { |p| a, _, b = p.rpartition('::'); make_cls(RPG.const_get(a), b) }

class Table
  attr_reader :x, :y, :z, :data
  def self._load(s)
    t = allocate
    _dim, x, y, z, n = s.unpack('l<5')
    t.instance_variable_set(:@x, x); t.instance_variable_set(:@y, y); t.instance_variable_set(:@z, z)
    t.instance_variable_set(:@data, s.byteslice(20, n * 2).unpack('s<*'))
    t
  end
end
class Color; def self._load(s); s.unpack('E4'); end; end
class Tone; def self._load(s); s.unpack('E4'); end; end

# plain Ruby structures, strings forced to UTF-8
def plain(o, depth = 0)
  case o
  when String then o.dup.force_encoding('UTF-8')
  when Array then o.map { |e| plain(e, depth + 1) }
  when Hash then Hash[o.map { |k, v| [k.to_s, plain(v, depth + 1)] }]
  when Numeric, TrueClass, FalseClass, NilClass then o
  when Table then { 'x' => o.x, 'y' => o.y, 'z' => o.z, 'data' => o.data }
  else
    h = { '_class' => o.class.name }
    o.instance_variables.each { |iv| h[iv.to_s.delete('@')] = plain(o.instance_variable_get(iv), depth + 1) }
    h
  end
end

src, out, *maps = ARGV
load_rv = ->(n) { Marshal.load(File.binread(File.join(src, "#{n}.rvdata"))) }
write = ->(n, obj) { File.write(File.join(out, "#{n}.json"), JSON.generate(obj)) }

%w(Actors Classes Skills Enemies Troops Items States CommonEvents).each { |n| write.(n.downcase, plain(load_rv.(n))) }
%w(_chaskill _scombo _tecspark _card_compo).each do |n|
  write.(n.delete('_'), plain(load_rv.(n))) if File.exist?(File.join(src, "#{n}.rvdata"))
end
sys = load_rv.('System')
write.('system', { 'passages' => sys.instance_variable_get(:@passages).data,
                   'party_members' => sys.instance_variable_get(:@party_members) })
write.('mapinfos', plain(load_rv.('MapInfos')))
maps.each do |id|
  m = Marshal.load(File.binread(File.join(src, format('Map%03d.rvdata', id.to_i))))
  write.(format('map%03d', id.to_i), plain(m))
end
puts 'ok'
