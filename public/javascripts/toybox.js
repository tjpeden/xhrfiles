var Toybox = {
  init: function(iframeOnly) {
    this.uploader = $('#uploader');
    
    var classes = {
      hover: 'hover',
      active: 'active'
    }
    
    if( !iframeOnly ) {
      $('#dropzone').show();
      this.uploader.xhrfiles( {
        classes: classes,
        dropzone: $('#dropzone')
      } );
    } else {
      $('#dropzone').hide();
      this.uploader.xhrfiles( {
        classes: classes,
        iframeOnly: true
      } );
    }
  },
  
  destroy: function() {
    this.uploader.xhrfiles('destroy');
  }
}