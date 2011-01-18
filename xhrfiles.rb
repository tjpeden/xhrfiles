class Test < Sinatra::Base
  set :haml, :format => :html5
  set :public, ::File.join( ROOT, 'public' )
  
  helpers Sinatra::ContentFor2
  helpers Sinatra::StaticAssets::Helpers
  
  get '/' do
    haml :index
  end
  
  get '/toybox' do
    haml :toybox
  end
  
  post '/upload' do
    begin
      request.body.rewind
      puts "params: #{params.inspect}"
      ::File.open( ::File.join( ROOT, 'public', 'uploads', params[:filename] ), 'wb' ) { |f| f.write request.body.read }
      {'success' => true}.to_json
    rescue Exception => e
      {'success' => false, 'error' => e.message}.to_json
    end
  end
end
