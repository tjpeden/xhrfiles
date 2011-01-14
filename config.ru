ROOT = ::File.dirname(__FILE__)

require 'rubygems'
require 'bundler'

Bundler.require

require ::File.join( ROOT, 'xhrfiles.rb' )
run Test