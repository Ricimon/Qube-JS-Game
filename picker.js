Declare_Any_Class( "Picker",
{
	'construct'		: function( canvas )
	{
		this.define_data_members( {
			plist					: [],
			canvas					: canvas,	// current canvas
			pickTexture				: null,		// WebGL 2D Texture
			framebuffer 			: null,
			renderbuffer 			: null,
			pickedLocation			: -1, 		// Stores the current location that is picked

			processHitsCallback 	: null,
			addHitCallback 			: null,
			removeHitCallback 		: null,
			hitPropertyCallback 	: null,
			moveCallback 			: null
		} ); 

		this.configure();
	},
	'configure'		: function()
	{
		var width = this.canvas.width;
		var height = this.canvas.height;

		// 1. Init Picking Texture
		this.pickTexture = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, this.pickTexture );
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );

		// 2. Init Render Buffer
		this.renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer( gl.RENDERBUFFER, this.renderbuffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height );

		// 3. Init Frame Buffer
		this.framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer );
		gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.pickTexture, 0 );
		gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.renderbuffer );
		
		// Check for completeness
		var status = gl.checkFramebufferStatus( gl.FRAMEBUFFER );
		if (status != gl.FRAMEBUFFER_COMPLETE)
			alert('Frame Buffer Not Complete');

		// 4. Clean up
		gl.bindTexture( gl.TEXTURE_2D, null );
		gl.bindRenderbuffer( gl.RENDERBUFFER, null );
		gl.bindFramebuffer( gl.FRAMEBUFFER, null );
	},
	'update'		: function()
	{
		var width = this.canvas.width;
		var height = this.canvas.height;

		gl.bindTexture( gl.TEXTURE_2D, this.pickTexture );
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null );

		// Init Render Buffer
		gl.bindRenderbuffer( gl.RENDERBUFFER, this.renderbuffer );
		gl.renderbufferStorage( gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height );
	},
	'_compare'		: function( readout, color )	// returns true if two input colors match
	{
		return (Math.abs(Math.round(color[0]*255) - readout[0]) <= 1 &&
			Math.abs(Math.round(color[1]*255) - readout[1]) <= 1 && 
			Math.abs(Math.round(color[2]*255) - readout[2]) <= 1);
	},
	'find'			: function( coords )	// returns index of a cube at specified canvas coordinates, -1 if no index matches
	{

		// read one pixel
		var readout = new Uint8Array( 1 * 1 * 4 );
		gl.bindFramebuffer( gl.FRAMEBUFFER, this.framebuffer );
		gl.readPixels( coords[0], coords[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, readout );
		gl.bindFramebuffer( gl.FRAMEBUFFER, null );
		console.log( "Corresponding pixel color: " );
		console.log( readout );

		var matching_idx = -1;

		for ( var i = 0; i < shapes_in_scene.length; i++ )
		{
			if ( this._compare( readout, shapes_in_scene[i] ) ) 
			{
				matching_idx = i;
				console.log("Found matching index: " + matching_idx);
				return matching_idx;
			}
		}
		return matching_idx;

		// if ( this.hitPropertyCallback == undefined ) { console.log( 'The picker needs an object property to perform the comparison' ); return; }

		// // TODO
		// for ( var i = 0; i < shapes_in_use.length; i++ ) 
		// {
		// 	var ob = shapes_in_use[i];
		// 	var property = this.hitPropertyCallback(ob);

		// 	if ( property == undefined ) continue;

		// 	if (this._compare( readout, property ) )
		// 	{
		// 		var index = this.plist.indexOf(ob);
		// 		if ( index != -1 )
		// 		{
		// 			this.plist.splice( index, 1 );
		// 			if ( this.removeHitCallback ) this.removeHitCallback( ob );
		// 		}
		// 		else
		// 		{
		// 			this.plist.push(ob);
		// 			if ( this.addHitCallback ) this.addHitCallback( ob );
		// 		}
		// 	}
		// 	found = true;
		// }
		// draw();
		// return found;
	},
	'getCanvasCoords'	: function( event )			// returns canvas coordinates from event input
	{
		var mouseX = event.clientX, mouseY = event.clientY;
		var x_offset = canvas.offsetLeft;			// Determine x offset of the canvas on the browser window
		var y_offset = canvas.offsetTop;			// y offset of canvas
		var x = mouseX - x_offset;
		var y = canvas.height - ( mouseY - y_offset );
		console.log( "You clicked canvas coords: " );
		console.log( [ x , y ] );
		return [ x, y ];
	},
	'stop'			: function()
	{
		if ( this.processHitsCallback != null && this.plist.length > 0 ) {
			this.processHitsCallback( this.plist );
		}
		this.plist = [];
	},
	'setPickLocation'	: function ( location )
	{
		this.pickedLocation = location;
	},
	'getPickLocation'	: function()
	{
		return this.pickedLocation;
	}
}, Animation );