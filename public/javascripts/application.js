jQuery( function($) {
  module('Builder');
  test( 'element creation', function() {
    var uploader = $('#uploader');
    expect(4);
    
    uploader.xhrfiles();
    
    var form = uploader.find('form');
    
    equal( uploader.find('*').length, 3, 'Correct number of element created by xhrfiles' );
    equal( uploader.find('button').length, 1, 'One element should be a button' );
    equal( form.length, 1, 'One element should be a form' );
    equal( form.find('input:file').length, 1, 'And the form should contain a file input' );
    
    uploader.xhrfiles('destroy');
  } );
  
  module('XhrUploader');
  if( $('#uploader').xhrfiles('xhrSupported') ) {
    test( 'input setup', function() {
      var uploader = $('#uploader');
      expect(1);
      
      uploader.xhrfiles();
      
      var input = uploader.find('input:file');
      
      ok( input.attr('multiple'), 'Accepts multiple files' );
    
      uploader.xhrfiles('destroy');
    } );
    
    asyncTest( 'upload', function() {
      var uploader = $('#uploader');
      expect(1);
      
      uploader.xhrfiles();
      
      uploader.bind( 'success.xhrfiles', function(e, id, name, response) {
        ok( response.success, "File uploaded succesfully" );
        uploader.xhrfiles('destroy');
        start();
      } );
    } );
  }
  
  module('FormUploader');
  test( 'input setup', function() {
    var uploader = $('#uploader');
    expect(1);
    
    uploader.xhrfiles( {iframeOnly: true} );
    
    var input = uploader.find('input:file');
    
    ok( !input.attr('multiple'), 'Does not have the multiple attribute set' );
    
    uploader.xhrfiles('destroy');
  } );
  
  asyncTest( 'upload', function() {
    var uploader = $('#uploader');
    expect(3);
    
    uploader.xhrfiles( {
      iframeOnly: true
    } );
    
    var form = uploader.find('form');
    
    uploader.bind( 'start.xhrfiles', function(e, id, name) {
      equal( $('#' + id).length, 1, "An iframe should have been created" );
      equal( form.attr('target'), id, "The form should target the iframe" );
    } )
    .bind( 'success.xhrfiles', function(e, id, name, response) {
      ok( response.success, "File uploaded successfully" );
      if( !response.success ) console.log( "Error: " + response.error );
      uploader.xhrfiles('destroy');
      start();
    } )
    .bind( 'error.xhrfiles', function() {
      ok( false, "Upload should not fail" );
    } );
  } );
  
  module('DropZone');
  asyncTest( 'drop upload', function() {
    var uploader = $('#uploader');
    expect(1)
    
    uploader.xhrfiles( {
      classes: {
        active: 'active'
      },
      dropzone: $('#dropzone')
    } );
    
    uploader.hide();
    $('#dropzone').show();
    
    uploader.bind( 'success.xhrfiles', function(e, id, name, response) {
      ok( response.success, "File uploaded succesfully" );
      uploader.xhrfiles('destroy');
      start();
    } );
  } );
} );