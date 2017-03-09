// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett Ridge for CS174a, adapted.
// displayables.js - The subclass definitions here each describe different independent animation processes that you want to fire off each frame, by defining a display
// event and how to react to key and mouse input events.  Make one or two of your own subclasses, and fill them in with all your shape drawing calls and any extra key / mouse controls.

Declare_Any_Class( "Debug_Screen",  // Debug_Screen - A displayable object that our class Canvas_Manager can manage.  Displays a text user interface.
  { 'construct': function( context )
      { this.define_data_members( { string_map: context.shared_scratchpad.string_map, start_index: 0, tick: 0, visible: false, graphicsState: new Graphics_State() } );
        shapes_in_use.debug_text = new Text_Line( 35 );
      },
    'init_keys': function( controls )
      { controls.add( "t",    this, function() { this.visible ^= 1;                                                                                                             } );
        controls.add( "up",   this, function() { this.start_index = ( this.start_index + 1 ) % Object.keys( this.string_map ).length;                                           } );
        controls.add( "down", this, function() { this.start_index = ( this.start_index - 1   + Object.keys( this.string_map ).length ) % Object.keys( this.string_map ).length; } );
        this.controls = controls;
      },
    'update_strings': function( debug_screen_object )   // Strings that this displayable object (Debug_Screen) contributes to the UI:
      { debug_screen_object.string_map["tick"]              = "Frame: " + this.tick++;
        debug_screen_object.string_map["text_scroll_index"] = "Text scroll index: " + this.start_index;
      },
    'display': function( time )
      { if( !this.visible ) return;

        shaders_in_use["Default"].activate();
        gl.uniform4fv( g_addrs.shapeColor_loc, Color( .8, .8, .8, 1 ) );

        var font_scale = scale( .02, .04, 1 ),
            model_transform = mult( translation( -.95, -.9, 0 ), font_scale ),
            strings = Object.keys( this.string_map );

        for( var i = 0, idx = this.start_index; i < 4 && i < strings.length; i++, idx = (idx + 1) % strings.length )
        {
          shapes_in_use.debug_text.set_string( this.string_map[ strings[idx] ] );
          shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (strings)
          model_transform = mult( translation( 0, .08, 0 ), model_transform );
        }
        model_transform = mult( translation( .7, .9, 0 ), font_scale );
        shapes_in_use.debug_text.set_string( "Controls:" );
        shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );    // Draw some UI text (controls title)

        for( let k of Object.keys( this.controls.all_shortcuts ) )
        {
          model_transform = mult( translation( 0, -0.08, 0 ), model_transform );
          shapes_in_use.debug_text.set_string( k );
          shapes_in_use.debug_text.draw( this.graphicsState, model_transform, true, vec4(0,0,0,1) );  // Draw some UI text (controls)
        }
      }
  }, Animation );

Declare_Any_Class( "Camera",     // Displayable object that our class Canvas_Manager can manage.  Adds first-person style camera matrix controls to the canvas
  { 'construct': function( context )
      { var viewSize =  20;
		// 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        context.shared_scratchpad.graphics_state = new Graphics_State( mult( translation(0, -2, -100), mult( rotation( 35.264, 1, 0, 0 ), rotation( 45, 0, 1, 0 ) ) ), ortho( -viewSize, viewSize, -viewSize/(canvas.width/canvas.height), viewSize/(canvas.width/canvas.height), 0.1, 1000), 0 );
        this.define_data_members( { graphics_state: context.shared_scratchpad.graphics_state, thrust: vec3(), origin: vec3( 0, 0, 0 ), looking: false } );

        // *** Mouse controls: *** For Debugging Purposes
        this.mouse = { "from_center": vec2() };
        var mouse_position = function( e ) { return vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2 ); };   // Measure mouse steering, for rotating the flyaround camera.
        canvas.addEventListener( "mouseup",   ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = undefined;              } } ) (this), false );
        canvas.addEventListener( "mousedown", ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = mouse_position(e);      } } ) (this), false );
        canvas.addEventListener( "mousemove", ( function(self) { return function(e) { e = e || window.event;    self.mouse.from_center = mouse_position(e); } } ) (this), false );
        canvas.addEventListener( "mouseout",  ( function(self) { return function(e) { self.mouse.from_center = vec2(); }; } ) (this), false );    // Stop steering if the mouse leaves the canvas.
      },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      { 
		/* Default Debug Controls */
		controls.add( "Space", this, function() { this.thrust[1] = -1; } );     controls.add( "Space", this, function() { this.thrust[1] =  0; }, {'type':'keyup'} );
        controls.add( "z",     this, function() { this.thrust[1] =  1; } );     controls.add( "z",     this, function() { this.thrust[1] =  0; }, {'type':'keyup'} );
        controls.add( "w",     this, function() { this.thrust[2] =  1; } );     controls.add( "w",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );
        controls.add( "a",     this, function() { this.thrust[0] =  1; } );     controls.add( "a",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'} );
        controls.add( "s",     this, function() { this.thrust[2] = -1; } );     controls.add( "s",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'} );
        controls.add( "d",     this, function() { this.thrust[0] = -1; } );     controls.add( "d",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'} );
        controls.add( "f",     this, function() { this.looking  ^=  1; } );
        controls.add( ",",     this, function() { this.graphics_state.camera_transform = mult( rotation( 6, 0, 0,  1 ), this.graphics_state.camera_transform ); } );
        controls.add( ".",     this, function() { this.graphics_state.camera_transform = mult( rotation( 6, 0, 0, -1 ), this.graphics_state.camera_transform ); } );
        controls.add( "o",     this, function() { this.origin = mult_vec( inverse( this.graphics_state.camera_transform ), vec4(0,0,0,1) ).slice(0,3)         ; } );
        //controls.add( "r",     this, function() { this.graphics_state.camera_transform = translation(0, 0, -25)                                                ; } );
      },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      { var C_inv = inverse( this.graphics_state.camera_transform ), pos = mult_vec( C_inv, vec4( 0, 0, 0, 1 ) ),
                                                                  z_axis = mult_vec( C_inv, vec4( 0, 0, 1, 0 ) );                                                                 
        user_interface_string_manager.string_map["origin" ] = "Center of rotation: " + this.origin[0].toFixed(0) + ", " + this.origin[1].toFixed(0) + ", " + this.origin[2].toFixed(0);                                                       
        user_interface_string_manager.string_map["cam_pos"] = "Cam Position: " + pos[0].toFixed(2) + ", " + pos[1].toFixed(2) + ", " + pos[2].toFixed(2);    // The below is affected by left hand rule:
        user_interface_string_manager.string_map["facing" ] = "Facing: "       + ( ( z_axis[0] > 0 ? "West " : "East ") + ( z_axis[1] > 0 ? "Down " : "Up " ) + ( z_axis[2] > 0 ? "North" : "South" ) );
      },
    'display': function( time )
      { 
		/* Default Debug Controls */
		var leeway = 70,  degrees_per_frame = .0004 * this.graphics_state.animation_delta_time,
                          meters_per_frame  =   .01 * this.graphics_state.animation_delta_time;
        // Third-person camera mode: Is a mouse drag occurring?
        if( this.mouse.anchor )
        {
          var dragging_vector = subtract( this.mouse.from_center, this.mouse.anchor );            // Arcball camera: Spin the scene around the world origin on a user-determined axis.
          if( length( dragging_vector ) > 0 )
            this.graphics_state.camera_transform = mult( this.graphics_state.camera_transform,    // Post-multiply so we rotate the scene instead of the camera.
                mult( translation( this.origin ),
                mult( rotation( .05 * length( dragging_vector ), dragging_vector[1], dragging_vector[0], 0 ),
                      translation(scale_vec( -1, this.origin ) ) ) ) );
        }
        // First-person flyaround mode:  Determine camera rotation movement when the mouse is past a minimum distance (leeway) from the canvas's center.
        var offset_plus  = [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ];
        var offset_minus = [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ];

        for( var i = 0; this.looking && i < 2; i++ )      // Steer according to "mouse_from_center" vector, but don't start increasing until outside a leeway window from the center.
        {
          var velocity = ( ( offset_minus[i] > 0 && offset_minus[i] ) || ( offset_plus[i] < 0 && offset_plus[i] ) ) * degrees_per_frame;  // Use movement's quantity unless the &&'s zero it out
          this.graphics_state.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), this.graphics_state.camera_transform );     // On X step, rotate around Y axis, and vice versa.
        }     // Now apply translation movement of the camera, in the newest local coordinate frame
        this.graphics_state.camera_transform = mult( translation( scale_vec( meters_per_frame, this.thrust ) ), this.graphics_state.camera_transform );
      }
  }, Animation );

Declare_Any_Class( "Game_Scene",  // Displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
  { 'construct': function( context )
      { this.shared_scratchpad = context.shared_scratchpad;
        this.define_data_members( { picker: new Picker( canvas ), assignedPickColors: false, objIndex: 0, moved: false, pausable_time: 0, firstFrame: true } );
		
		// Unused shapes are commented out
        shapes_in_use.triangle        = new Triangle();                  // At the beginning of our program, instantiate all shapes we plan to use,
        shapes_in_use.strip           = new Square();                   // each with only one instance in the graphics card's memory.
        shapes_in_use.bad_tetrahedron = new Tetrahedron( false );      // For example we'll only create one "cube" blueprint in the GPU, but we'll re-use
        shapes_in_use.tetrahedron     = new Tetrahedron( true );      // it many times per call to display to get multiple cubes in the scene.
        shapes_in_use.windmill        = new Windmill( 10 );
		shapes_in_use.cube			  = new Cube();
		shapes_in_use.sphere		  = new Sphere(50,50);
		shapes_in_use.cylinder		  = new Capped_Cylinder(50,50);
        
        shapes_in_use.triangle_flat        = Triangle.prototype.auto_flat_shaded_version();
        shapes_in_use.strip_flat           = Square.prototype.auto_flat_shaded_version();
        shapes_in_use.bad_tetrahedron_flat = Tetrahedron.prototype.auto_flat_shaded_version( false );
        shapes_in_use.tetrahedron_flat          = Tetrahedron.prototype.auto_flat_shaded_version( true );
        shapes_in_use.windmill_flat             = Windmill.prototype.auto_flat_shaded_version( 10 );
		
        // this.picker = new Picker( canvas );
        // picker.configure();
      },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      {
        controls.add( "ALT+g", this, function() { this.shared_scratchpad.graphics_state.gouraud       ^= 1; } );   // Make the keyboard toggle some
        controls.add( "ALT+n", this, function() { this.shared_scratchpad.graphics_state.color_normals ^= 1; } );   // GPU flags on and off.
        controls.add( "ALT+a", this, function() { this.shared_scratchpad.animate                      ^= 1; } );
		controls.add( "r"    , this, function() { this.moved					                      ^= 1; } );
        controls.add( "i",     this, function() { if (!this.firstFrame) { this.cubeman_transform = mult( this.cubeman_transform, translation(0,.1,0) )} } );
        controls.add( "j",     this, function() { if (!this.firstFrame) { this.cubeman_transform = mult( this.cubeman_transform, translation(-.1,0,0) )} } );
        controls.add( "k",     this, function() { if (!this.firstFrame) { this.cubeman_transform = mult( this.cubeman_transform, translation(0,-.1,0) )} } )
        controls.add( "l",     this, function() { if (!this.firstFrame) { this.cubeman_transform = mult( this.cubeman_transform, translation(.1,0,0) )} } )
		
		var picker = this.picker;
		
		this.mouse = { "from_center": vec2() };
		var mouse_position = function( e ) { return vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2 ); };
        //canvas.addEventListener( "mouseup",   ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = undefined;              } } ) (this), false );
        canvas.addEventListener( "mousedown", ( function(self) { return function(e) { e = e || window.event;    
			var readout = new Uint8Array( 1 * 1 * 4 );
			gl.bindFramebuffer( gl.FRAMEBUFFER, picker.framebuffer );
			gl.readPixels( mouse_position[0], mouse_position[1], 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, readout );
			gl.bindFramebuffer( gl.FRAMEBUFFER, null );
			console.log(readout); } } ) (this), false );
      },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      {
		// TODO: FIX BUG WITH THESE TWO LINES+
        // user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( this.shared_scratchpad.graphics_state.animation_time )/1000 + "s";
        // user_interface_string_manager.string_map["animate"] = "Animation " + (this.shared_scratchpad.animate ? "on" : "off") ;
      },
	'reset_scene': function()
	  {
		this.assignedPickColors = false;
	  },
	'check_color_repeat': function( r, g, b )
	  {
		if ( r === backR && g === backG && b === backB )	// can't be background color
			return true;
		shapes_in_scene.forEach( function(entry) {
			if (entry[0] === r && entry[1] === g && entry[2] === b)
				return true;
			else
				return false;
		}, this );
	  },
	'draw_rectangle': function( model_transform, rectLength, rectDirection, pickFrame )
	  {
		var graphics_state  = this.shared_scratchpad.graphics_state;
		
		var lightBlue = new Material( Color( 0.678, 0.847, 0.902, 1 ), .15, .7,  0, 10 );
		
		for (var i = 0; i < rectLength; i++)
		{
			if (pickFrame)
			{
				var r, g, b;
				if (!this.assignedPickColors) {
					do
					{
						r = getRandomIntInclusive(0, 255) / 255;
						g = getRandomIntInclusive(0, 255) / 255;
						b = getRandomIntInclusive(0, 255) / 255;
					}
					while ( this.check_color_repeat( r, g, b ) )	// make sure randomly generated color is not already being used
					shapes_in_scene.push( vec3(r,g,b) );
				}
				else {
					var currentColor = shapes_in_scene[this.objIndex];
					r = currentColor[0];
					g = currentColor[1];
					b = currentColor[2];
				}
				
				var objColor = new Material( Color( r, g, b ), 1, 0, 0, 1 );
				shapes_in_use.cube.draw( graphics_state, model_transform, objColor );
				this.objIndex++;
			}
			else
				shapes_in_use.cube.draw( graphics_state, model_transform, lightBlue );
			
			model_transform = mult( model_transform, translation( rectDirection[0] * 2, rectDirection[1] * 2, rectDirection[2] * 2 ) );
		}
		return model_transform;
	  },
    'display': function(time, pickFrame)
      {
        var graphics_state  = this.shared_scratchpad.graphics_state,
            model_transform = mat4();             // We have to reset model_transform every frame, so that as each begins, our basis starts as the identity.
        shaders_in_use[ "Default" ].activate();

        // *** Lights: *** Values of vector or point lights over time.  Arguments to construct a Light(): position or vector (homogeneous coordinates), color, size
        graphics_state.lights = [];                    // First clear the light list each frame so we can replace & update lights.

        var t = graphics_state.animation_time/1000, light_orbit = [ Math.cos(t), Math.sin(t) ];
        if (!pickFrame) 
        {
			graphics_state.lights.push( new Light( vec4( -20, 20, 5, 1 ), Color( 1, 1, 1, 1 ), 1000000 ) );	// Light to create 3Dness
			graphics_state.lights.push( new Light( vec4( -20+22.6, 20-22.6, 5-22.6, 1 ), Color( 1, 1, 1, 1 ), 80 ) );
        }

        // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
        // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
        var emissiveRed		  = new Material( Color( 1    , 0.2  , 0.1  , 1 ), .9 ,  0,  0, 1  ),	 // Omit the final (string) parameter if you want no texture
			greyPlanet 		  = new Material( Color( 0.827, 0.827, 0.827, 1 ), .15, .7, .8, 30 ),	 // Ambience intensity is all the same because they really should be all the same. None of the planets should be generating light.
			blueGreen	      = new Material( Color( 0.051, 0.8  , 0.729, 1 ), .15, .7, .5, 80 ),
			lightBlue	      = new Material( Color( 0.678, 0.847, 0.902, 1 ), .15, .7,  0, 10 ),
			brownOrange       = new Material( Color( 0.6  , 0.251, 0.137, 1 ), .15, .7, .3, 90 ),
			lightRed      	  = new Material( Color( 1	  , 0.5  , 0.5  , 1 ), .15, .9, 0, 70 ),
            placeHolder 	  = new Material( Color( 0    , 0    , 0    , 0 ),  0 ,  0,  0, 0, "Blank" );

        /**********************************
        Code for objects in world
        **********************************/                                     
		// Initial path
		model_transform = this.draw_rectangle( model_transform, 3, vec3(-1,0,0), pickFrame );	var model_transform_decoration = model_transform;	// for later
		model_transform = this.draw_rectangle( model_transform, 8, vec3(0,0,1), pickFrame );
		model_transform = this.draw_rectangle( model_transform, 4, vec3(0,1,0), pickFrame );  
          
		// Movable path
		var model_transform_move = mult( translation( -6, 4*2+6, 6 ), model_transform );	// set up pivot point of movable path
		// Allow rotation of movable path w.r.t. time
		if (this.moved && this.pausable_time < 90) this.pausable_time += graphics_state.animation_delta_time / 30;
		if (!this.moved && this.pausable_time > 0) this.pausable_time -= graphics_state.animation_delta_time / 30;
		if (this.pausable_time > 90) this.pausable_time = 90; if (this.pausable_time < 0) this.pausable_time = 0;	// Make sure pausable_time doesn't go beyond 0 or 90
		
		var fracTranslated = 1 / ( 1 + Math.exp(-this.pausable_time/90*6 + 3) );	// sigmoid function to prevent clipping during translation, but maintain a smooth transition of lighting colors
		model_transform_move = mult( translation( fracTranslated*30, fracTranslated*-30, fracTranslated*-30 ), mult( model_transform_move, rotation( this.pausable_time, 0, 0, -1 ) ) );	// Translate/rotate to make visual illusion work
		this.draw_rectangle( model_transform_move, 5, vec3(0,-1,0), pickFrame );
		model_transform_move = this.draw_rectangle( model_transform_move, 6, vec3(0,0,-1), pickFrame );
		
		// End path
		model_transform = mult( translation( 22.6, 8-22.6, -12-22.6 ), model_transform );
		model_transform = this.draw_rectangle( model_transform, 3, vec3(0,0,-1), pickFrame );
		model_transform = mult( translation( 0, 0, 2 ), model_transform );
		model_transform = this.draw_rectangle( model_transform, 5, vec3(1,0,0), pickFrame );
		
		// Decorations
		model_transform_decoration = mult( translation( -1, 8, 1-.15 ), mult( model_transform_decoration, rotation( -90, 0, 1, 0 ) ) );
		shapes_in_use.strip.draw( graphics_state, mult( model_transform_decoration, scale( .3, 7, 1 ) ), lightBlue );
		model_transform_decoration = mult( translation( 0, 0, -2+.45 ), model_transform_decoration );
		shapes_in_use.strip.draw( graphics_state, mult( model_transform_decoration, scale( .3, 7, 1 ) ), lightBlue );
		model_transform_decoration = mult( translation( 0, 0, 2*(2-.45) ), model_transform_decoration );
		shapes_in_use.strip.draw( graphics_state, mult( model_transform_decoration, scale( .3, 7, 1 ) ), lightBlue );
		
		model_transform = mult( translation( -2, 1, 0 ), mult( model_transform, rotation( 90, 1, 0, 0 ) ) );
		shapes_in_use.cylinder.draw( graphics_state, mult( model_transform, scale( .75, .75, .01 ) ), lightRed );
		this.assignedPickColors = true;
		this.objIndex = 0;
          
        //Cubeman
        if (this.firstFrame){
            this.cubeman_transform = mult( model_transform, translation(0,0,-1) ); 
            this.firstFrame = false;
        }
        this.draw_rectangle( this.cubeman_transform, 1, vec3(0,0,-1), pickFrame );
      }
  }, Animation );