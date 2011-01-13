( function( $ ) {
  var nextID = ( function() {
    var id = 0;
    return function() { return id++; };
  } )();
  
  var Builder = function(self, options) {
    this.settings = {
      buttonText: 'Upload',
      inputName: 'thefile',
      
      classes: {
        hover: 'ui-state-hover',
        active: 'ui-state-active'
      }
    };
    
    $.extend( this.settings, options );
    
    this.element = self;
    
    this.button = this.createButton();
    this.form = this.createForm();
    this.input = this.createInput();
    
    this.setupElement();
    
    this.form.append( this.input );
  };
  
  Builder.prototype = {
    setupElement: function() {
      this.element.css( {
        position: 'relative',
        overflow: 'hidden',
        height: this.height(),
        width: this.width()
      } );
    },
    
    createButton: function() {
      var button = $( '<button></button>' );
      
      button.css( {
        position: 'absolute',
        zIndex: 1,
        left: 0,
        top: 0
      } ).html( this.settings.buttonText );
      
      this.element.append( button );
      
      return button;
    },
    
    createInput: function(form) {
      var self = this;
      var input = $( '<input />' );
      
      input.attr( {
        type: 'file',
        name: this.settings.inputName
      } ).css( {
        '-moz-opacity': 0,
        position: 'absolute',
        opacity: 0,
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        zIndex: 2,
        height: this.height(),
        right: 0,
        top: 0
      } );
      
      this.element.append( input );
      
      input.bind( 'mouseenter mouseleave', function(e) {
        self.button.toggleClass( self.settings.classes.hover );
      } ).bind( 'focus blur', function(e) {
        self.button.toggleClass( self.settings.classes.active );
      } );
      
      // IE/Opera tab stop fix
      if( window.attachEvent ) {
        input.attr('tabIndex', '-1');
      }
      
      return input;
    },
    
    createForm: function() {
      var form = $( '<form></form>' );
      
      form.attr( {
        method: 'post',
        enctype: 'multipart/form-data'
      } );
      
      this.element.trigger( 'form.created', [form] );
      
      this.element.append( form );
      
      return form;
    },
    
    height: function() {
      return this.button.outerHeight(true);
    },
    
    width: function() {
      return this.button.outerWidth(true);
    }
  };
  
  var XhrUploader = function(self, options) {
    Builder.apply( this, arguments );
    
    this.settings = {
      action: '/upload',
      params: {},
      allowedExtensions: [],
      sizeLimit: 0,
      maxConnections: 3,
      dropzone: null,
      
      messages: {
        typeError: "{file}: invalid extension. Allowed: {extensions}.",
        sizeError: "{file}: too largs. Maximum: {sizeLimit}.",
        emptyError: "{file}: empty, please select files again without it.",
        onLeave: "Files are still being uploaded, leaving now will cancel them."
      },
      
      showMessage: function(message) {
        alert( message );
      }
    }
    
    $.extend( this.settings, options );
    
    this.input.attr('multiple', 'multiple');
    
    this.files = [];
    this.xhrs = [];
    
    this.uploading = false;
    
    this.attachEvents();
    this.createDropzone();
  };
  
  XhrUploader.isSupported = function() {
    var input = document.createElement('input');
    input.type = 'file';        
    
    return 'multiple' in input &&
      typeof File != "undefined" &&
      typeof (new XMLHttpRequest()).upload != "undefined";
  };
  
  $.extend( XhrUploader.prototype, Builder.prototype );
  
  $.extend( XhrUploader.prototype, {
    attachEvents: function() {
      var self = this;
      
      this.input.change( function() {
        self.add( this.files );
        return false;
      } )
      
      this.element.bind( 'file.abort', function(e, id) {
        self.xhrs[id] && self.xhrs[id].abort();
        self.xhrs[id] = null;
      } )
    },
    
    createDropzone: function() {
      var self = this;
      
      if( this.settings.dropzone ) {
        var opts = {
          enter: function(e) {
            self.settings.dropzone.addClass( self.settings.classes.active );
            e.stopPropagation();
          },
          leave: function(e) {
            e.stopPropagation();
          },
          leaveNonDescendants: function(e) {
            self.settings.dropzone.removeClass( self.settings.classes.active );
          },
          drop: function(e) {
            self.settings.dropzone.removeClass( self.settings.classes.active );
            self.add( e.originalEvent.dataTransfer.files );
          }
        };
        
        this.dropzone = new DropZone( this.settings.dropzone, opts );
      }
    },
    
    isValidFile: function(file) {
      var name = this.getName(file);
      var size = this.getSize(file);
      var limit = this.settings.sizeLimit;
      
      if( !this.isAllowedExtension(name) ) {
        this.error('typeError', name);
        return false;
      } else if( size === 0 ) {
        this.error('emptyError', name);
        return false;
      } else if( size && limit && size > limit ) {
        this.error('sizeError', name);
        return false
      }
      
      return true;
    },
    
    isAllowedExtension: function(name) {
      var allowed = this.settings.allowedExtensions;
      var ext = (-1 !== name.indexOf('.')) ? name.replace(/.*[.]/, '') : '';
      
      if( !allowed.length ) return true;
      
      for( var i = 0; i < allowed.length; i++ ) {
        if( allowed[i].toLowerCase() == ext.toLowerCase() ) return true;
      }
      
      return false;
    },
    
    upload: function(file) {
      var name = this.getName(file);
      var size = this.getSize(file);
      var xhr = new XMLHttpRequest();
      var id = this.xhrs.push(xhr) - 1;
      
      this.element.trigger( 'file.start', [name, id] );
      
      var baseData = {};
      baseData[this.input.attr('name')] = name;
      var data = $.extend( this.settings.params, baseData );
      var url = this.settings.action + '?' + $.param( data );
            
      var self = this;
      xhr.upload.onprogress = function(e) {
        if( e.lengthComputable ) {
          var params = [id, name, e.loaded, e.total];
          self.element.trigger( 'file.progress', params );
        }
      }
      
      xhr.onreadystatechange = function() {
        if( xhr.readyState == 4 ) {
          
          self.element.trigger( 'file.progress', [id, name, size, size] );
          
          if( xhr.status == 200 ) {
            var response;
            
            try {
              response = eval( '(' + xhr.responseText + ')' );
            } catch( error ) {
              response = {};
            }
            
            self.element.trigger( 'file.success', [id, name, response, xhr.responseText] );
          } else {
            self.element.trigger( 'file.error', [id, name] );
          }
          
          self.xhrs[id] = null;
          self.next();
        }
      }
      
      xhr.open("POST", url, true);
      xhr.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
      xhr.setRequestHeader( "X-File-Name", encodeURIComponent(name) );
      xhr.setRequestHeader( "Content-Type", file.type );
      xhr.send( file );
    },
    
    add: function(files) {
      var newFiles = [];
      
      for( var i = 0; i < files.length; i++ ) {
        newFiles.push( files[i] );
        if( !this.isValidFile( files[i] ) ) return;
      }
      
      this.files = this.files.concat( newFiles );
      
      this.start();
    },
    
    start: function() {
      if( !this.uploading ) {
        this.uploading = true;
        
        var i = 0;
        
        while( i < this.files.length && i < this.settings.maxConnections ) {
          this.upload( this.files.shift() );
          i++;
        }
      }
    },
    
    next: function() {
      if( this.files.length == 0 ) {
        this.uploading = false;
        this.element.trigger( 'uploader.complete' );
      } else {
        this.upload( this.files.shift() );
      }
    },
    
    getName: function(file) {
      return file.fileName || file.name;
    },
    
    getSize: function(file) {
      return file.fileSize || file.size;
    },
    
    error: function(code, name) {
      var message = this.settings.messages[code];
      function r(name, replacement) { message = message.replace(name, replacement); }
      
      r('{file}', this.formatFileName(name));
      r('{extensions}', this.settings.allowedExtensions.join(', '));
      r('{sizeLimit}', this.formatSize(this.settings.sizeLimit));
      
      this.settings.showMessage(message);
    },
    
    formatFileName: function(name) {
      if( name.length > 33) {
        name = name.slice(0, 19) + '...' + name.slice(-13);
      }
      
      return name;
    },
    
    formatSize: function(bytes) {
      var sizes = ['kB', 'MB', 'GB', 'TB'];
      var i = -1
      
      do {
        bytes = bytes / 1024;
        i++;
      } while( bytes > 1023 );
      
      return Math.max(bytes, 0.1).toFixed(1) + sizes[i];
    }
  } );
  
  var FormUploader = function(self, options) {
    Builder.apply( this, arguments );
    
    this.files = [];
    
    this.attachEvents();
  };
  
  $.extend( FormUploader.prototype, Builder.prototype );
  
  $.extend( FormUploader.prototype, {
    attachEvents: function() {
      var self = this;
      
      this.input.change( function() {
        self.add( this.value );
        return false;
      } );
    },
    
    add: function(file) {
      var id = 'file-' + nextID();
      
      this.files[id] = file;
      
      this.upload( id );
    },
    
    getName: function(id) {
      return this.files[id].replace(/.*(\/|\\)/, "");
    },
    
    upload: function(id) {
      var name = this.getName( id );
      
      var iframe = this.createIframe( id );
      
      var baseData = {};
      baseData[this.input.attr('name')] = name;
      var data = $.extend( this.settings.params, baseData );
      var url = this.settings.action + '?' + $.param( data );
      
      this.form.attr( {
        action: url,
        target: iframe.attr('name')
      } );
      
      var self = this;
      iframe.load( function() {
        if( this.contentDocument &&
          this.contentDocument.body &&
          this.contentDocument.body.innerHTML == "false" ) { return; }
        
        var response = self.iframeContentJSON( iframe );
        
        self.element.trigger( 'file.success', [id, name, response] );
        self.element.trigger( 'uploader.complete' );
        
        delete self.files[id];
        
        // timeout to fix busy state in FF3.6
        setTimeout( function() {
          iframe.remove();
        }, 1 );
      } );
      
      this.form.submit();
    },
    
    createIframe: function(id) {
      var iframe = $( '<iframe src="javascript:false;" name="' + id + '" />' );
      
      iframe.attr( 'id', id );
      iframe.hide();
      
      $(document.body).append( iframe );
      
      this.form.attr( 'target', id );
      
      return iframe;
    },
    
    iframeContentJSON: function(iframe) {
      var response,
          doc = iframe.contentDocument ? iframe.contentDocument : iframe.contentWindow.document;
      
      try {
        response = eval( "(" + doc.body.innerHTML + ")" );
      } catch( error ) {
        response = {};
      }
      
      return response;
    }
  } );
  
  var DropZone = function(self, options) {
    this.settings = {
      enter: function(e) {},
      leave: function(e) {},
      leaveNonDescendants: function(e) {},
      drop: function(e) {},
      debug: true
    };
    
    $.extend( this.settings, options );
    
    this.element = self;
    
    this.disableDropOutside();
    this.attachEvents();
  };
  
  DropZone.prototype = {
    disableDropOutside: function() {
      if( !DropZone.dropOutsideDisabled ) {
        $(document).bind( 'drop', function(e) {
          if( e.dataTransfer ) {
            e.dataTransfer.dropEffect = 'none';
            e.preventDefault();
          }
        } );
        
        DropZone.dropOutsideDisabled = true;
      }
    },
    
    attachEvents: function() {
      var self = this;
      
      this.element.bind( 'dragover', function(e) {
        if( !self.isValidFileDrag(e) ) return;
        
        var effect = e.originalEvent.dataTransfer.effectAllowed;
        if( effect == 'move' || effect == 'linkMove' ) {
          e.originalEvent.dataTransfer.dropEffect = 'move'; // for FF
        } else {
          e.originalEvent.dataTransfer.dropEffect = 'copy'; // for Chrome
        }
        
        e.stopPropagation();
        e.preventDefault();
      } );
      
      this.element.bind( 'dragenter', function(e) {
        if( !self.isValidFileDrag(e) ) return;
        
        self.settings.enter(e);
      } );
      
      this.element.bind( 'dragleave', function(e) {
        if( !self.isValidFileDrag(e) ) return;
        
        self.settings.leave(e);
        
        var relatedTarget = document.elementFromPoint(e.clientX, e.clientY);
        if( $.contains( this, relatedTarget ) ) return;
        
        self.settings.leaveNonDescendants(e);
      } );
      
      this.element.bind( 'drop', function(e) {
        e.preventDefault();
        
        if( !self.isValidFileDrag(e) ) return;
        
        self.settings.drop(e);
      } );
    },
    
    isValidFileDrag: function(e) {
      var dt = e.originalEvent.dataTransfer;
      // do not check dt.types.contains in webkit, because it crashes safari 4
      var isWebkit = navigator.userAgent.indexOf("AppleWebKit") > -1;

      // dt.effectAllowed is none in Safari 5
      // dt.types.contains check is for firefox            
      return dt && dt.effectAllowed != 'none' && 
        (dt.files || (!isWebkit && dt.types.contains && dt.types.contains('Files')));        
    }
  };
  
  $.fn.xhrfiles = function(options) {
    return this.each( function() {
      if( XhrUploader.isSupported() ) {
        new XhrUploader($(this), options);
      } else {
        new FormUploader($(this), options);
      }
    } );
  }
} )( jQuery );