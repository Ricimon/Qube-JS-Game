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
      { // 1st parameter below is our starting camera matrix.  2nd is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
        context.shared_scratchpad.graphics_state = new Graphics_State( translation(0,0,-25), ortho( -viewSize, viewSize, -viewSize/(canvas.width/canvas.height), viewSize/(canvas.width/canvas.height), 0.1, 1000), 0 );
        this.define_data_members( { graphics_state: context.shared_scratchpad.graphics_state, thrust: vec3(), origin: vec3( 0, 0, 0 ), looking: false } );

        // *** Mouse controls: *** For Debugging Purposes
        // this.mouse = { "from_center": vec2() };
        // var mouse_position = function( e ) { return vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2 ); };   // Measure mouse steering, for rotating the flyaround camera.
        // canvas.addEventListener( "mouseup",   ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = undefined;              } } ) (this), false );
        // canvas.addEventListener( "mousedown", ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = mouse_position(e);      } } ) (this), false );
        // canvas.addEventListener( "mousemove", ( function(self) { return function(e) { e = e || window.event;    self.mouse.from_center = mouse_position(e); } } ) (this), false );
        // canvas.addEventListener( "mouseout",  ( function(self) { return function(e) { self.mouse.from_center = vec2(); }; } ) (this), false );    // Stop steering if the mouse leaves the canvas.
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
        // if( this.mouse.anchor )
        // {
          // var dragging_vector = subtract( this.mouse.from_center, this.mouse.anchor );            // Arcball camera: Spin the scene around the world origin on a user-determined axis.
          // if( length( dragging_vector ) > 0 )
            // this.graphics_state.camera_transform = mult( this.graphics_state.camera_transform,    // Post-multiply so we rotate the scene instead of the camera.
                // mult( translation( this.origin ),
                // mult( rotation( .05 * length( dragging_vector ), dragging_vector[1], dragging_vector[0], 0 ),
                      // translation(scale_vec( -1, this.origin ) ) ) ) );
        // }
        // // First-person flyaround mode:  Determine camera rotation movement when the mouse is past a minimum distance (leeway) from the canvas's center.
        // var offset_plus  = [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ];
        // var offset_minus = [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ];

        // for( var i = 0; this.looking && i < 2; i++ )      // Steer according to "mouse_from_center" vector, but don't start increasing until outside a leeway window from the center.
        // {
          // var velocity = ( ( offset_minus[i] > 0 && offset_minus[i] ) || ( offset_plus[i] < 0 && offset_plus[i] ) ) * degrees_per_frame;  // Use movement's quantity unless the &&'s zero it out
          // this.graphics_state.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), this.graphics_state.camera_transform );     // On X step, rotate around Y axis, and vice versa.
        // }     // Now apply translation movement of the camera, in the newest local coordinate frame
        if (currentScene > 0)
			this.graphics_state.camera_transform = mult( translation( scale_vec( meters_per_frame, this.thrust ) ), this.graphics_state.camera_transform );
      }
  }, Animation );

var global_picker;  // experimental
  
Declare_Any_Class( "Game_Scene",  // Displayable object that our class Canvas_Manager can manage.  This one draws the scene's 3D shapes.
  { 'construct': function( context )
      { this.shared_scratchpad = context.shared_scratchpad;
        this.define_data_members( { picker: new Picker( canvas ), assignedPickColors: false, objIndex: 0, moved: false, pausable_time: 0, anim_time: 0, padTriggered: 0,
									firstFrame: true, blockman: new Blockman(9, "original", 1), cubeman_transform: mat4() } );
		
		global_picker = this.picker;	// experimental
		
		// Unused shapes are commented out(jk)
        shapes_in_use.triangle        = new Triangle();                  // At the beginning of our program, instantiate all shapes we plan to use,
        shapes_in_use.strip           = new Square();                   // each with only one instance in the graphics card's memory.
        shapes_in_use.bad_tetrahedron = new Tetrahedron( false );      // For example we'll only create one "cube" blueprint in the GPU, but we'll re-use
        shapes_in_use.tetrahedron     = new Tetrahedron( true );      // it many times per call to display to get multiple cubes in the scene.
        shapes_in_use.windmill        = new Windmill( 10 );
		shapes_in_use.cube			  = new Cube();
		shapes_in_use.sphere		  = new Sphere(50,50);
		shapes_in_use.cylinder		  = new Capped_Cylinder(50,50);
		shapes_in_use.ladder		  = new Ladder();
        
        shapes_in_use.triangle_flat        = Triangle.prototype.auto_flat_shaded_version();
        shapes_in_use.strip_flat           = Square.prototype.auto_flat_shaded_version();
        shapes_in_use.bad_tetrahedron_flat = Tetrahedron.prototype.auto_flat_shaded_version( false );
        shapes_in_use.tetrahedron_flat          = Tetrahedron.prototype.auto_flat_shaded_version( true );
        shapes_in_use.windmill_flat             = Windmill.prototype.auto_flat_shaded_version( 10 );
		
      },
    'init_keys': function( controls )   // init_keys():  Define any extra keyboard shortcuts here
      {
        controls.add( "ALT+g", this, function() { this.shared_scratchpad.graphics_state.gouraud       ^= 1; } );   // Make the keyboard toggle some
        controls.add( "ALT+n", this, function() { this.shared_scratchpad.graphics_state.color_normals ^= 1; } );   // GPU flags on and off.
        controls.add( "ALT+a", this, function() { this.shared_scratchpad.animate                      ^= 1; } );
		controls.add( "r"    , this, function() { this.moved					                      ^= 1; } );
		controls.add( "p"    , this, function() { seePickingColors				                      ^= 1; } );
		controls.add( "g"    , this, function() { if(currentScene == 2) this.padTriggered++;			    } );
		controls.add( "n"    , this, function() { this.advance_scene()										} );	// advance scene
        
        controls.add( "i",     this, function() { this.cubeman_transform = mult( this.cubeman_transform, translation(.1,0,0) )} );
        controls.add( "j",     this, function() { this.cubeman_transform = mult( this.cubeman_transform, translation(0,0,-.1) )} );
        controls.add( "k",     this, function() { this.cubeman_transform = mult( this.cubeman_transform, translation(-.1,0,0) )} );
        controls.add( "l",     this, function() { this.cubeman_transform = mult( this.cubeman_transform, translation(0,0,.1) )} );
		controls.add( "u",     this, function() { this.blockman.curIndex++; } );
        controls.add( "y",     this, function() { this.blockman.curIndex--; } ); 
		
		this.mouse = { "from_center": vec2() };
		var mouse_position = function( e ) { return vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2 ); };
        canvas.addEventListener( "mouseup",   ( function(self) { return function(e) { e = e || window.event;    self.mouse.anchor = undefined;              } } ) (this), false );
        canvas.addEventListener( "mousedown", ( function(self) { return function(e) { e = e || window.event;   
		self.mouse.anchor = mouse_position( e );										  
		if (currentScene == 0) currentScene++;
		if (currentScene > 2) { currentScene = 0; isMoving = false; }
          var canvasCoords = global_picker.getCanvasCoords( e );      // get the canvas coords from mouse click with origin set to canvas bottom left
          var blockman_loc = -1;
          if ( !isMoving )
          console.log( blockman_loc = global_picker.find( canvasCoords ) );   // try to find the input coordinates on an existing path
          global_picker.setPickLocation( blockman_loc ); } } ) (this), false );   // update the picking location to be passed to a move function later on
		  canvas.addEventListener( "mousemove", ( function(self) { return function(e) { e = e || window.event;    self.mouse.from_center = mouse_position(e); } } ) (this), false );
		  canvas.addEventListener( "mouseout",  ( function(self) { return function(e) { self.mouse.from_center = vec2(); }; } ) (this), false );    // Stop steering if the mouse leaves the canvas.																																												  
      },
    'update_strings': function( user_interface_string_manager )       // Strings that this displayable object (Animation) contributes to the UI:
      {
		var graphics_state  = this.shared_scratchpad.graphics_state;
		
        user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( graphics_state.animation_time )/1000 + "s";
        user_interface_string_manager.string_map["animate"] = "Animation " + (this.shared_scratchpad.animate ? "on" : "off") ;
      },
	'advance_scene': function()
	  {
		currentScene++;
		shapes_in_scene = []; 
		this.assignedPickColors = false; 
		this.moved = false; 
		this.pausable_time = 0; 
		this.firstFrame = true;
		this.padTriggered = 0;
		isMoving = false;
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
		
		var lightBlue = new Material( Color( 0.678, 0.847, 0.902, 1 ), .15, .7,  0, 10 ),
			tan		  = new Material( Color( 210/255, 180/255, 140/255, 1 ), 1, .7,  0, 40 );
		
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
					// var currentColor = shapes_in_scene[i];							   
					r = currentColor[0];
					g = currentColor[1];
					b = currentColor[2];
					// console.log( currentColor );					 
				}
				
				var objColor = new Material( Color( r, g, b ), 1, 0, 0, 1 );
				shapes_in_use.cube.draw( graphics_state, model_transform, objColor );
				this.objIndex++;
			}
			else 
				switch (currentScene)
				{
				case 1:
					if (arguments[4] == null)
						shapes_in_use.cube.draw( graphics_state, model_transform, lightBlue );
					else
						shapes_in_use.cube.draw( graphics_state, model_transform, arguments[4] );
					break;
				case 2:
					if (arguments[4] == null)
						shapes_in_use.cube.draw( graphics_state, model_transform, tan );
					else
						shapes_in_use.cube.draw( graphics_state, model_transform, arguments[4] );
					break;
				}
			
            if( this.firstFrame ) { //only during the first frame so List has one of each value
				if (arguments[5] != null)
				{
					var temp_model_transform = mult( model_transform, scale( 1/arguments[5][0], 1/arguments[5][1], 1/arguments[5][2] ) );
					temp_model_transform = mult( temp_model_transform, translation(0,-(1-arguments[5][1]), 0) );
					this.blockman.addBlock(temp_model_transform);
				}
				else
					this.blockman.addBlock(model_transform);
            }
            
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

        var t = graphics_state.animation_time/1000;
        if (!pickFrame)
		{
			if (currentScene == 1) 
			{
				graphics_state.lights.push( new Light( vec4( -20, 20, 5, 1 ), Color( 1, 1, 1, 1 ), 1000000 ) );	// Light to create 3Dness
				graphics_state.lights.push( new Light( vec4( -20+22.6, 20-22.6, 5-22.6, 1 ), Color( 1, 1, 1, 1 ), 80 ) );
			}
			if (currentScene == 2)
			{
				graphics_state.lights.push( new Light( vec4( 0, 700, 200, 1 ), Color( 1, 1, 1, 1 ), 300000 ) );	
			}
		}

        // *** Materials: *** Declare new ones as temps when needed; they're just cheap wrappers for some numbers.
        // 1st parameter:  Color (4 floats in RGBA format), 2nd: Ambient light, 3rd: Diffuse reflectivity, 4th: Specular reflectivity, 5th: Smoothness exponent, 6th: Texture image.
        var emissiveRed		  = new Material( Color( 1      , 0.2    , 0.1    , 1 ), .9 ,  0,  0, 1  ),	 // Omit the final (string) parameter if you want no texture
			lightBlue	      = new Material( Color( 0.678  , 0.847  , 0.902  , 1 ), .15, .7,  0, 10 ),	 // Ambience intensity is all the same because they really should be all the same. None of the planets should be generating light.
			brownOrange       = new Material( Color( 0.6    , 0.251  , 0.137  , 1 ), .15, .7, .3, 90 ),
			lightRed      	  = new Material( Color( 1	    , 0.5    , 0.5    , 1 ), .15, .9,  0, 70 ),
			lighterRed        = new Material( Color( 1	    , 0.5    , 0.5    , 1 ), .6, .9,  0, 70 ),
			darkGreen     	  = new Material( Color( 0.5    , 1      , 0.5    , 1 ), .15, .9,  0, 70 ),
			tan				  = new Material( Color( 210/255, 180/255, 140/255, 1 ), 1,   .7,  0, 40 ),
			darkTan			  = new Material( Color( 180/255, 150/255, 110/255, 1 ), 1,   .7,  0, 40 ),
			pink			  = new Material( Color( 255/255, 192/255, 203/255, 1 ), .95,   .5,  0, 40 ),
			emissiveLightBlue = new Material( Color( 0.678  , 0.847  , 0.902  , 1 ), 1,    0,  0, 10 ),
			titleScreen		  = new Material( Color( 0    , 0    , 0    , 0 ),  1 ,  1,  1, 40, "title_screen.png"),
			level2_background = new Material( Color( 0    , 0    , 0    , 0 ),  1 ,  1,  1, 40, "level2_background.png"),
			endScreen		  = new Material( Color( 0    , 0    , 0    , 0 ),  1 ,  1,  1, 40, "end_screen.png"),
            placeHolder 	  = new Material( Color( 0    , 0    , 0    , 0 ),  1 ,  0,  0, 40 );

        /**********************************
        Code for objects in world
        **********************************/                                     
		switch(currentScene)
		{
		case 0:	// title screen
			shapes_in_use.strip.draw( graphics_state, scale(viewSize+1,viewSize+1,1), titleScreen );
			break;
		case 1:	// level 1
			if ( this.firstFrame ){
                this.blockman.reset(9, "original", 1);
            }
			graphics_state.camera_transform = mult( translation(0, -2, -100), mult( rotation( 35.264, 1, 0, 0 ), rotation( 45, 0, 1, 0 ) ) );
			
			// Initial path
			model_transform = this.draw_rectangle( model_transform, 3, vec3(-1,0,0), pickFrame );	var model_transform_decoration = model_transform;	// for later
			model_transform = this.draw_rectangle( model_transform, 8, vec3(0,0,1), pickFrame );
			model_transform = this.draw_rectangle( model_transform, 4, vec3(0,1,0), pickFrame );
			
			// Movable path									   
			var model_transform_move = mult( translation( -6, 4*2+6, 6 ), model_transform );	// set up pivot point of movable path

			// Allow rotation of movable path w.r.t. mouse dragging and picking
			if ( this.blockman.curIndex < 15 || this.blockman.curIndex > 25 )
			{
				if ( this.mouse.anchor && this.mouse.from_center && global_picker.getPickLocation() == 34) 
					this.pausable_time += handle_mouse_dragging( this.mouse.anchor, this.mouse.from_center, 3, graphics_state.animation_delta_time );
			}

			// Automatically go to either position if close enough
			if ( !this.mouse.anchor )
			{
				if (this.pausable_time > 85 && this.pausable_time < 90) this.pausable_time += graphics_state.animation_delta_time / 60;
				if (this.pausable_time <  5 && this.pausable_time > 0) this.pausable_time -= graphics_state.animation_delta_time / 60;
			}
			if (this.pausable_time >= 90) {
				this.pausable_time = 90;
				this.blockman.changeState("rotated");
			}
			else
				this.blockman.changeState("original");
			if (this.pausable_time < 0)	this.pausable_time = 0;	// Make sure pausable_time doesn't go beyond 0 or 90
			
			if (this.pausable_time == 90)
			{
				for (var i = 0; i < 5; i++)
					this.blockman.updateBlock( 15+i, mult( model_transform_move, translation( -2*i, 0, 0 ) ) );
			}
			
			var fracTranslated = 1 / ( 1 + Math.exp(-this.pausable_time/90*6 + 3) );	// sigmoid function to prevent clipping during translation, but maintain a smooth transition of lighting colors
			model_transform_move = mult( translation( fracTranslated*30, fracTranslated*-30, fracTranslated*-30 ), mult( model_transform_move, rotation( this.pausable_time, 0, 0, -1 ) ) );	// Translate/rotate to make visual illusion work
			this.draw_rectangle( model_transform_move, 5, vec3(0,-1,0), pickFrame );
			
			var model_transform_steering = mult( model_transform_move, translation( 0, 0, 3 ) );
			if (!pickFrame)
			{
				shapes_in_use.cylinder.draw( graphics_state, mult( model_transform_steering, scale(.2, .2, 6 ) ), lightBlue );
				model_transform_steering = mult( model_transform_steering, translation( 0, 0, 3 ) );
				shapes_in_use.cylinder.draw( graphics_state, mult( model_transform_steering, scale( 1, 1, .4 ) ), lightBlue );
				model_transform_steering = mult( model_transform_steering, rotation( 90, 1, 0, 0 ) );
				for (var i = 0; i < 8; i ++)
				{
					model_transform_steering = mult( model_transform_steering, rotation( -45*i, 0, 1, 0 ) );
					shapes_in_use.cylinder.draw( graphics_state, mult( mult( model_transform_steering, translation( 0, 0, 2 ) ), scale( .15, .15, 2 ) ), lightBlue );
				}
			}
			model_transform_steering = mult( model_transform_move, translation( 0, 0, 6 ) );
			// DRAWING THIS RECTANGLE WILL BE DONE AT THE END TO NOT MESS UP BLOCKMAN CODE
			
			model_transform_move = this.draw_rectangle( model_transform_move, 6, vec3(0,0,-1), pickFrame );
			
			// End path
			model_transform = mult( translation( 22.6, 8-22.6, -12-22.6 ), model_transform );
			model_transform = this.draw_rectangle( model_transform, 3, vec3(0,0,-1), pickFrame );
			model_transform = mult( translation( 0, 0, 2 ), model_transform );
			model_transform = this.draw_rectangle( model_transform, 5, vec3(1,0,0), pickFrame );
			
			// Decorations
			if (!pickFrame)
			{
				model_transform_decoration = mult( translation( -1, 8, 1-.15 ), mult( model_transform_decoration, rotation( -90, 0, 1, 0 ) ) );
				shapes_in_use.strip.draw( graphics_state, mult( model_transform_decoration, scale( .3, 7, 1 ) ), lightBlue );
				model_transform_decoration = mult( translation( 0, 0, -2+.45 ), model_transform_decoration );
				shapes_in_use.strip.draw( graphics_state, mult( model_transform_decoration, scale( .3, 7, 1 ) ), lightBlue );
				model_transform_decoration = mult( translation( 0, 0, 2*(2-.45) ), model_transform_decoration );
				shapes_in_use.strip.draw( graphics_state, mult( model_transform_decoration, scale( .3, 7, 1 ) ), lightBlue );
			
				model_transform = mult( translation( -2, 1, 0 ), mult( model_transform, rotation( 90, 1, 0, 0 ) ) );
				shapes_in_use.cylinder.draw( graphics_state, mult( model_transform, scale( .75, .75, .01 ) ), lightRed );
			}
			
			// Picking steering wheel
			this.draw_rectangle( mult( model_transform_steering, scale(3, 3, .2) ), 1, vec3(0,0,1), pickFrame, placeHolder );
		
			this.assignedPickColors = true;
			this.objIndex = 0;
            
            //Cubeman
            if (this.firstFrame){
                //record the two possible states and the indexes that are connected to each other
                //20 is weird since its in block 15
                this.blockman.addState("original", [[0,1,2,3,4,5,6,7,8,9,10], [15,21,22,23,24,25,26,27,28,29,30,31,32,33]]);
                this.blockman.addState("rotating", [], false);
                this.blockman.addState("rotated", [[10,9,8,7,6,5,4,3,2,1,0,19,18,17,16,15,21,22,23,24,25,26,27,28,29,30,31,32,33]]);                    
                this.firstFrame = false;
            }                
			if (!pickFrame)
			{
                //model_transform = translation( -6, 1.4, 8 );
				// console.log( this.blockman_loc );
                this.blockman.moveTo( global_picker.getPickLocation() )
                isMoving = ( this.blockman.moves.length > 0 );
                model_transform = this.blockman.where( graphics_state.animation_delta_time );
                model_transform = mult( model_transform, this.cubeman_transform ); //give offset from keyboard for testing 
                shapes_in_use.cube.draw( graphics_state, mult( model_transform, scale( 0.4, 0.4, 0.4 ) ), emissiveRed );
			}
			
			// Advancing scene
			if (this.blockman.curIndex == 33)
				this.advance_scene();
			
			break;
		case 2:	// level 2
			if ( this.firstFrame ){
                this.blockman.reset(0, "original", 2);
            }
			graphics_state.camera_transform = mult( translation(earthquake_shake, -6, -100), mult( rotation( 35.264, 1, 0, 0 ), rotation( 45, 0, 1, 0 ) ) );
			graphics_state.projection_transform = ortho( -(viewSize+5), viewSize+5, -(viewSize+5)/(canvas.width/canvas.height), (viewSize+5)/(canvas.width/canvas.height), 0.1, 1000)
			
			shapes_in_use.strip.draw( graphics_state, mult( mult( mult( mult( model_transform, translation( 100, 7.5-100, -100 ) ), rotation( -45, 0, 1, 0 ) ), rotation( -35.264, 1, 0, 0 ) ), scale( 25.03, 25, 1 ) ), level2_background );	// background
			shapes_in_use.strip.draw( graphics_state, mult( mult( model_transform, translation( 200, -200, -200 ) ), scale( 100, 100, 100 ) ), emissiveLightBlue );	// janky background
			
			
			shapes_in_use.cube.draw( graphics_state, scale(5,5,5), tan );
			
			// Initial path
			model_transform = translation( -4, -1.6, 6 );
			this.draw_rectangle( mult( model_transform, scale( 1, 0.2, 1 ) ), 1, vec3(-1,0,0), pickFrame, null, vec3(1,0.2,1) );
			model_transform = mult( model_transform, translation( -2, 0, 0 ) );
			this.draw_rectangle( mult( model_transform, scale( 1, 0.2, 1 ) ), 7, vec3(0,0,-1), pickFrame, null, vec3(1,0.2,1) );
			model_transform = mult( model_transform, translation( 0, 0.8, -14 ) );
			if (!pickFrame)
				for (var i = 0; i < 6; i++)
				{
					shapes_in_use.ladder.draw( graphics_state, mult( mult( model_transform, translation(0, 2*i, 1 ) ), scale( 1, 2, 1 ) ), brownOrange );
				}
			model_transform = mult( model_transform, rotation( 90, 1, 0, 0 ) );
			model_transform = this.draw_rectangle( model_transform, 5, vec3(0,0,-1), pickFrame );
			model_transform = mult( model_transform, rotation( -90, 1, 0, 0 ) );
			model_transform = this.draw_rectangle( model_transform, 4, vec3(1,-.2,0), pickFrame );
			var model_transform_decoration = model_transform;	// for later
			
			// Movable path
			var model_transform_move = translation( 0, 6, 0 );

			// Allow rotation of movable path w.r.t. mouse dragging and picking
			if ( this.mouse.anchor && this.mouse.from_center && global_picker.getPickLocation() == 17) 
			this.pausable_time -= handle_mouse_dragging( this.mouse.anchor, this.mouse.from_center, 3, graphics_state.animation_delta_time );
			
			// Automatically go to position if close enough
			if (!this.mouse.anchor)
			{
				this.pausable_time = this.pausable_time % 360;
				if (this.pausable_time < 0) this.pausable_time = 360 + this.pausable_time;
				var dividedTime = this.pausable_time % 90;
				if (dividedTime != 0)
				{
					if (dividedTime > 85)
						this.pausable_time += graphics_state.animation_delta_time / 60;
					if (dividedTime < 5)
						this.pausable_time -= graphics_state.animation_delta_time / 60;
				}
				if (dividedTime > 89 || dividedTime < 1)
					this.pausable_time = Math.floor(this.pausable_time);
				
			}
			
			switch(this.pausable_time)
			{
			case 0:
				this.blockman.changeState("original"); break;
			case 90:
				this.blockman.changeState("rotated3"); break;
			case 180:
				this.blockman.changeState("rotated2"); break;
			case 270:
				this.blockman.changeState("rotated1"); break;
			default:
				this.blockman.changeState("rotating"); break;
			}
			
			// for updating blockman cubes' positions
			var model_transform_blockman_cube = translation( 0, 8, 0 );
			var blockman_cube_angle = this.pausable_time % 360;
			
			model_transform_move = mult( model_transform_move, rotation( this.pausable_time, 0, 1, 0 ) );
			
			this.draw_rectangle( mult( model_transform_move, scale( 5, 1, 5 ) ), 1, vec3(0,1,0), pickFrame, pink );
			model_transform_move = mult( model_transform_move, translation( 0, 2, 0 ) );
			this.draw_rectangle( model_transform_move, 4, vec3(0,0,-1), pickFrame );
			
			for (var i = 0; i < 4; i++)
				this.blockman.updateBlock( 18+i, mult( model_transform_move, translation(0,0,-2*i) ) );
			
			model_transform_move = mult( model_transform_move, translation( 0, 2, 0 ) );
			model_transform_move = this.draw_rectangle( model_transform_move, 6, vec3(0,1,0), pickFrame );
			this.draw_rectangle( model_transform_move, 4, vec3(1,0,0), pickFrame );
			
			for (var i = 0; i < 4; i++)
				this.blockman.updateBlock( 28+i, mult( model_transform_blockman_cube, translation( 2*i*Math.cos(blockman_cube_angle), 0, -2*i*Math.sin(blockman_cube_angle) ) ) );
			
			// Fixed path
			model_transform = translation( 0, 8, 8 );
			this.draw_rectangle( mult( model_transform, rotation(180, 0, 1, 0 ) ), 7, vec3(0,-1,0), pickFrame, darkTan );
			model_transform = mult( translation( 0, 1, 0 ), mult( model_transform, rotation( 90, 1, 0, 0 ) ) );
			if (!pickFrame)
				shapes_in_use.cylinder.draw( graphics_state, mult( model_transform, scale( .75, .75, .01 ) ), darkGreen );
			
			model_transform = translation( 8, 8, 0 );
			model_transform = this.draw_rectangle( model_transform, 1, vec3(1,0,0), pickFrame, tan );
			var moveMag = 14;
			model_transform = mult( model_transform, translation( -moveMag, moveMag, moveMag ) );
			if (!pickFrame)
			{
				shapes_in_use.strip.draw( graphics_state, mult( model_transform, translation( 0, 0, 1 ) ), tan );
				shapes_in_use.strip.draw( graphics_state, mult( mult( model_transform, translation( 0, 1, 0 ) ), rotation( -90, 1, 0, 0 ) ), tan );
			}
			// model_transform = mult( model_transform, translation( 2, 0, 0 ) );
			model_transform = this.draw_rectangle( model_transform, 1, vec3(1,0,0), pickFrame, placeHolder );
			model_transform = this.draw_rectangle( model_transform, 2, vec3(1,0,0), pickFrame );
			var model_transform_decoration2 = model_transform;	// for later
			
			model_transform = mult( model_transform, translation( -2, 0, 0 ) );
			
			if (this.blockman.curIndex == 32)
				this.padTriggered++;
			if (this.padTriggered > 0)
			{
				if (this.padTriggered == 1) {
					this.blockman.earthquake();
					this.padTriggered++;
				}
				this.anim_time += graphics_state.animation_delta_time / 50;
				// earthquake effect
				if (this.anim_time < 2)
					earthquake_shake = -.2;
				else if (this.anim_time < 4 )
					earthquake_shake = .2;
				else if (this.anim_time < 6)
					earthquake_shake = -.1;
				else if (this.anim_time < 8)
					earthquake_shake = .05;
				else if (this.anim_time < 10)
					earthquake_shake = -.05;
				else if (this.anim_time < 12)
					earthquake_shake = .05;
				else
					earthquake_shake = 0;
				if (this.anim_time > 95) {
					this.anim_time = 95;
					model_transform_blockman_cube = mult( model_transform, translation( 0, 0, -2 ) );
					for (var i = 0; i < 3; i++)
						this.blockman.updateBlock( 43+i, mult( model_transform_blockman_cube, translation( 0, 0, -2*i ) ) );
				}
			}
			
			model_transform = mult( model_transform, rotation( this.anim_time > 5 ? -this.anim_time + 5 : 0, 1, 0, 0 ) );
			model_transform = mult( model_transform, translation( 0, 2, 0 ) );
			model_transform = this.draw_rectangle( model_transform, 3, vec3(0,1,0), pickFrame );
			
			model_transform = translation( 0, 22, -8 );
			model_transform = this.draw_rectangle( model_transform, 2, vec3(0,0,-1), pickFrame);
			
			// Decorations
			if (!pickFrame) {
				model_transform = mult( translation( 0, 1, 2 ), mult( model_transform, rotation( 90, 1, 0, 0 ) ) );
				shapes_in_use.cylinder.draw( graphics_state, mult( model_transform, scale( .75, .75, .01 ) ), lighterRed );
				
				model_transform_decoration = mult( model_transform_decoration, translation( -2, 7, 0 ) );
				shapes_in_use.cube.draw( graphics_state, mult( mult( model_transform_decoration, translation(1-.1,0,1-.1) ), scale(.1,7,.1) ), tan );
				shapes_in_use.cube.draw( graphics_state, mult( mult( model_transform_decoration, translation(-(1-.1),0,1-.1) ), scale(.1,7,.1) ), tan );
				shapes_in_use.cube.draw( graphics_state, mult( mult( model_transform_decoration, translation(-(1-.1),0,-(1-.1)) ), scale(.1,7,.1) ), tan );
				
				model_transform_decoration2 = mult (model_transform_decoration2, translation( -2, -5, 0 ) );
				shapes_in_use.cube.draw( graphics_state, mult( mult( model_transform_decoration2, translation(1-.1,0,1-.1) ), scale(.1,5,.1) ), tan );
				shapes_in_use.cube.draw( graphics_state, mult( mult( model_transform_decoration2, translation(-(1-.1),0,1-.1) ), scale(.1,5,.1) ), tan );
				shapes_in_use.cube.draw( graphics_state, mult( mult( model_transform_decoration2, translation(-(1-.1),0,-(1-.1)) ), scale(.1,5,.1) ), tan );
			}
			
			//Blockman
            if (this.firstFrame){
                //record the possible states and the indexes that are connected to each other
                this.blockman.addState("original", [[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,21,20,19], [32], [39,40,41], [28,29,30,31], [46, 47]]);
                this.blockman.addState("rotating", [], false);
                this.blockman.addState("rotated1",[[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],[41,40,39,21,20,19], [32], [28,29,30,31], [46, 47]]);
                this.blockman.addState("rotated2", [[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],[32,21,20,19], [39,40,41], [28,29,30,31], [46, 47]]);
                this.blockman.addState("rotated3", [[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],[21,20,19], [32], [39,40,41], [28,29,30,31,46, 47]]);
                this.firstFrame = false;
            }                
			if (!pickFrame)
			{
                //model_transform = translation( -6, 1.4, 8 );
				// console.log( this.blockman_loc );
                this.blockman.moveTo( global_picker.getPickLocation() )
                isMoving = ( this.blockman.moves.length > 0 );
                model_transform = this.blockman.where( graphics_state.animation_delta_time );
                model_transform = mult( model_transform, this.cubeman_transform ); //give offset from keyboard for testing 
                shapes_in_use.cube.draw( graphics_state, mult( model_transform, scale( 0.4, 0.4, 0.4 ) ), emissiveRed );
			}
			this.assignedPickColors = true;
			this.objIndex = 0;
			
			if (this.blockman.curIndex == 47)
				this.advance_scene();
			
			break;
		default: 	// game end
			graphics_state.camera_transform = translation(0,0,-25);
			graphics_state.projection_transform = ortho( -viewSize, viewSize, -viewSize/(canvas.width/canvas.height), viewSize/(canvas.width/canvas.height), 0.1, 1000);
			
			shapes_in_use.strip.draw( graphics_state, scale(viewSize+1,viewSize+1,1), endScreen );
			break;
		}
      }
  }, Animation );