require 'sinatra/base'
require 'json'
require 'haml'

ROOT = ::File.dirname(__FILE__)

class Home < Sinatra::Base
  set :haml, :format => :html5
  set :public, ::File.join( ROOT, 'public' )
  
  get '/' do
    haml :index
  end
  
  post '/upload' do
    request.body.rewind
    ::File.open( ::File.join( ROOT, 'public', 'uploads', params[:thefile] ), 'wb' ) { |f| f.write request.body.read }
    {'success' => true}.to_json
  end
end
