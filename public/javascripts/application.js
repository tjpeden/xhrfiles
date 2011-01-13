jQuery( function($) {
  $('#uploader').xhrfiles( {
    classes: {
      hover: 'hover',
      active: 'active'
    },
    dropzone: $('#dropzone')
    } ).bind( 'file.success', function(e, id, name, response, raw) {
      $('#output').html( raw );
    } );
} );