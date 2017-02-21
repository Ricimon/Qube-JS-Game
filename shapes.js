// UCLA's Graphics Example Code (Javascript and C++ translations available), by Garett Ridge for CS174a, adapted
// shapes.js is where you can define a number of objects that inherit from class Shape.  All Shapes have certain arrays.  These each manage either
// the shape's 3D vertex positions, 3D vertex normal vectors, 2D texture coordinates, or any other per-vertex quantity.  All subclasses of Shape inherit
// instantiation, any Shape subclass populates these lists in their own way, so we can use GL calls -- special kernel functions to copy each of the lists
// one-to-one into new buffers in the graphics card's memory.

// 1.  Some example simple primitives -- really easy shapes are at the beginning of the list just to demonstrate how Shape is used. Mimic these when
//                        making your own Shapes.  You'll find it to be much easier to work with than raw GL vertex arrays managed on your own.
//     Tutorial shapes:   Triangle, Square, Tetrahedron, Windmill,
//
// 2.  More difficult primitives:  Surface_of_Revolution, Regular_2D_Polygon, Cylindrical_Tube, Cone_Tip, Torus, Sphere, Subdivision_Sphere,
//                                 OBJ file (loaded using the library webgl-obj-loader.js )
// 3.  Example compound shapes:    Closed_Cone, Capped_Cylinder, Cube, Axis_Arrows, Text_Line
// *******************************************************

// 1.  TUTORIAL SHAPES:     ------------------------------------------------------------------------------------------------------------------------------

// *********** TRIANGLE ***********
Declare_Any_Class( "Triangle",    // First, the simplest possible Shape – one triangle.  It has 3 vertices, each having their own 3D position, normal
  { 'populate': function()        // vector, and texture-space coordinate.
      {
         this.positions      = [ vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) ];   // Specify the 3 vertices -- the point cloud that our Triangle needs.
         this.normals        = [ vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) ];   // ...
         this.texture_coords = [ vec2(0,0),   vec2(1,0),   vec2(0,1)   ];   // ...
         this.indices        = [ 0, 1, 2 ];                                 // Index into our vertices to connect them into a whole Triangle.
      }
  }, Shape )

// *********** SQUARE ***********
Declare_Any_Class( "Square",    // A square, demonstrating shared vertices.  On any planar surface, the interior edges don't make any important seams.
  { 'populate': function()      // In these cases there's no reason not to re-use values of the common vertices between triangles.  This makes all the
      {                         // vertex arrays (position, normals, etc) smaller and more cache friendly.
         this.positions     .push( vec3(-1,-1,0), vec3(1,-1,0), vec3(-1,1,0), vec3(1,1,0) ); // Specify the 4 vertices -- the point cloud that our Square needs.
         this.normals       .push( vec3(0,0,1), vec3(0,0,1), vec3(0,0,1), vec3(0,0,1) );     // ...
         this.texture_coords.push( vec2(0,0),   vec2(1,0),   vec2(0,1),   vec2(1,1)   );     // ...
         this.indices       .push( 0, 1, 2,     1, 3, 2 );                                   // Two triangles this time, indexing into four distinct vertices.
      }
  }, Shape )

// *********** TETRAHEDRON ***********
Declare_Any_Class( "Tetrahedron",              // A demo of flat vs smooth shading.  Also our first 3D, non-planar shape.
  { 'populate': function( using_flat_shading ) // Takes a boolean argument
      {
        var a = 1/Math.sqrt(3);

        if( !using_flat_shading )                                                 // Method 1:  A tetrahedron with shared vertices.  Compact, performs
        {                                                                 // better, but can't produce flat shading or discontinuous seams in textures.
            this.positions     .push( vec3(0,0,0),    vec3(1,0,0), vec3(0,1,0), vec3(0,0,1) );
            this.normals       .push( vec3(-a,-a,-a), vec3(1,0,0), vec3(0,1,0), vec3(0,0,1) );
            this.texture_coords.push( vec2(0,0),      vec2(1,0),   vec2(0,1),   vec2(1,1)   );
            this.indices.push( 0, 1, 2,   0, 1, 3,   0, 2, 3,    1, 2, 3 );                     // Vertices are shared multiple times with this method.
        }
        else
        { this.positions.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );         // Method 2:  A tetrahedron with four independent triangles.
          this.positions.push( vec3(0,0,0), vec3(1,0,0), vec3(0,0,1) );
          this.positions.push( vec3(0,0,0), vec3(0,1,0), vec3(0,0,1) );
          this.positions.push( vec3(0,0,1), vec3(1,0,0), vec3(0,1,0) );

          this.normals.push( vec3(0,0,-1), vec3(0,0,-1), vec3(0,0,-1) );           // Here's where you can tell Method 2 is flat shaded, since
          this.normals.push( vec3(0,-1,0), vec3(0,-1,0), vec3(0,-1,0) );           // each triangle gets a single unique normal value.
          this.normals.push( vec3(-1,0,0), vec3(-1,0,0), vec3(-1,0,0) );
          this.normals.push( vec3( a,a,a), vec3( a,a,a), vec3( a,a,a) );

          this.texture_coords.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );    // Each face in Method 2 also gets its own set of texture coords
          this.texture_coords.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );    //(half the image is mapped onto each face).  We couldn't do this
          this.texture_coords.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );    // with shared vertices -- after all, it involves different results
          this.texture_coords.push( vec3(0,0,0), vec3(1,0,0), vec3(0,1,0) );    // when approaching the same point from different directions.

          this.indices.push( 0, 1, 2,    3, 4, 5,    6, 7, 8,    9, 10, 11 );      // Notice all vertices are unique this time.
        }
      }
  }, Shape )

// *********** WINDMILL ***********
Declare_Any_Class( "Windmill",          // As our shapes get more complicated, we begin using matrices and flow control (including loops) to
  { 'populate': function( num_blades )  // generate non-trivial point clouds and connect them.
      {
          for( var i = 0; i < num_blades; i++ )     // A loop to automatically generate the triangles.
          {
              var spin = rotation( i * 360/num_blades, 0, 1, 0 );             // Rotate around a few degrees in XZ plane to place each new point.
              var newPoint  = mult_vec( spin, vec4( 1, 0, 0, 1 ) );           // Apply that XZ rotation matrix to point (1,0,0) of the base triangle.
              this.positions.push( vec3( newPoint[0], 0, newPoint[2] ) );     // Store this XZ position.  This is point 1.
              this.positions.push( vec3( newPoint[0], 1, newPoint[2] ) );     // Store it again but with higher y coord:  This is point 2.
              this.positions.push( vec3( 0, 0, 0 ) );                         // All triangles touch this location.  This is point 3.

              var newNormal = mult_vec( spin, vec4( 0, 0, 1, 0 ) );           // Rotate our base triangle's normal (0,0,1) to get the new one.  Careful!
              this.normals.push( newNormal.slice(0,3) );                      // Normal vectors are not points; their perpendicularity constraint gives them
              this.normals.push( newNormal.slice(0,3) );                      // a mathematical quirk that when applying matrices you have to apply the
              this.normals.push( newNormal.slice(0,3) );                      // transposed inverse of that matrix instead.  But right now we've got a pure
                                                                              // rotation matrix, where the inverse and transpose operations cancel out.
              this.texture_coords.push( vec2( 0, 0 ) );
              this.texture_coords.push( vec2( 0, 1 ) );                       // Repeat the same arbitrary texture coords for each fan blade.
              this.texture_coords.push( vec2( 1, 0 ) );
              this.indices.push ( 3 * i );     this.indices.push ( 3 * i + 1 );        this.indices.push ( 3 * i + 2 ); // Procedurally connect the three
          }                                                                                                             // new vertices into triangles.
      }
  }, Shape )

// *********** SPHERE ***********
Declare_Any_Class( "Sphere",	// Draws a sphere using recursive subdivision. A parameter is passed in to specify the subdivision resolution
  { 'populate': function( numTimesToSubdivide )	// The sphere will be made out of triangles (but not a compound shape)
	  { 		
		// Begin with vertices of a tetrahedron
		var va = vec4(0.0, 0.0, -1.0, 1);
		var vb = vec4(0.0, 0.942809, 0.333333, 1);
		var vc = vec4(-0.816497, -0.471405, 0.333333, 1);
		var vd = vec4(0.816497, -0.471405, 0.333333,1);
		
		// Divide four sides
		this.tetrahedron( va, vb, vc, vd, numTimesToSubdivide );
		
		// Find number of unique vertices, for debugging and informational purposes
		// Bug: Trying to use these unique vertices results in a small visual defect at one point on sphere
		// var numUniqueVertices = 0;	// Debugging statement to determine number of unique vertices per subdivision resolution
		// for ( var i = 0; i < this.positions.length; i++ )
		// {
			// for (var j = 0; j < i; j++)
			// {
				// if ( equal( this.positions[i], this.positions[j] ) && equal( this.normals[i], this.normals[j] ) )	// Repeated vertex
				// {
					// this.indices.push(j);
					// break;
				// }
			// }
			// if (!this.indices[i]) {	// Unique vertex
				// this.indices.push(i);
				// numUniqueVertices++;
			// }
		// }
		// console.log(numUniqueVertices);	// Debug from above
	  },
	'tetrahedron': function( a, b, c, d, n )
	  { // Divide using midpoint subdivision
		this.divideTriangle( a, b, c, n );
	    this.divideTriangle( d, c, b, n );
		this.divideTriangle( a, d, b, n );
		this.divideTriangle( a, c, d, n );
	  },
	'divideTriangle': function( a, b, c, count )
	  {
		if (count > 0) 
		{
			// Mix finds the midpoint of two vertices, and then normalize to push bisectors on the unit circle
			var ab = normalize( mix( a, b, 0.5 ), true );
			var ac = normalize( mix( a, c, 0.5 ), true );
			var bc = normalize( mix( b, c, 0.5 ), true );
			
			// Recursively divide each triangle until number of subdivisions specified is hit
			this.divideTriangle( a, ab, ac, count - 1 );
			this.divideTriangle( ab, b, bc, count - 1 );
			this.divideTriangle( bc, c, ac, count - 1 );
			this.divideTriangle( ab, bc, ac, count - 1 );
		}
		else 
		{	// Once smallest triangle is made, push its vertices into proper arrays
			this.triangle( a, b, c );
		}
	  },
	'triangle': function( a, b, c )
	  {
		for ( var i = 0; i < arguments.length; i++ )
		{
			this.positions.push( arguments[i].slice(0,3) );	// a, b, and c are 4 dimensional vectors, so drop the fourth dimension term
			this.normals.push( vec3( arguments[i][0], arguments[i][1], arguments[i][2] ) );	// Normals are vectors, used for lighting. Each normal just points radially outward based on the vertex position it's assigned to
																							// Normals for flat shading is handled by auto_flat_shaded_version in the Shape superclass
			this.indices.push( this.positions.length - 1 );	// Allows the use of gl.drawElements																						
		}
		// Push some arbitrary texture coords
		this.texture_coords.push( vec2( 0, 0 ) );
		this.texture_coords.push( vec2( 0, 1 ) );
		this.texture_coords.push( vec2( 1, 0 ) );
	  }
  }, Shape )
		
		
// 3.  COMPOUND SHAPES, BUILT FROM THE ABOVE HELPER SHAPES      ------------------------------------------------------------------------------------------

Declare_Any_Class( "Text_Line", // Draws a rectangle textured with images of ASCII characters textured over each quad, spelling out a string.
  { 'populate': function( max_size )    // Each quad is a separate rectangle_strip.
      { this.max_size = max_size;
        var object_transform = mat4();
        for( var i = 0; i < max_size; i++ )
        {
          Square.prototype.insert_transformed_copy_into( this, [], object_transform );
          object_transform = mult( object_transform, translation( 1.5, 0, 0 ));
        }
      },
    'draw': function( graphics_state, model_transform, heads_up_display, color )
      { if( heads_up_display )      { gl.disable( gl.DEPTH_TEST );  }
        Shape.prototype.draw.call(this, graphics_state, model_transform, new Material( color, 1, 0, 0, 40, "text.png" ) );
        if( heads_up_display )      { gl.enable(  gl.DEPTH_TEST );  }
      },
    'set_string': function( line )
      { for( var i = 0; i < this.max_size; i++ )
          {
            var row = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) / 16 ),
                col = Math.floor( ( i < line.length ? line.charCodeAt( i ) : ' '.charCodeAt() ) % 16 );

            var skip = 3, size = 32, sizefloor = size - skip;
            var dim = size * 16,  left  = (col * size + skip) / dim,      top    = (row * size + skip) / dim,
                                  right = (col * size + sizefloor) / dim, bottom = (row * size + sizefloor + 5) / dim;

            this.texture_coords[ 4 * i ]     = vec2( left,  1 - bottom );
            this.texture_coords[ 4 * i + 1 ] = vec2( right, 1 - bottom );
            this.texture_coords[ 4 * i + 2 ] = vec2( left,  1 - top );
            this.texture_coords[ 4 * i + 3 ] = vec2( right, 1 - top );
          }
        gl.bindBuffer( gl.ARRAY_BUFFER, this.graphics_card_buffers[2] );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.texture_coords), gl.STATIC_DRAW );
      }
  }, Shape )
  
Declare_Any_Class( "Cube",
  { 'populate': function()
	  {
		current_plane = mat4();
        Square.prototype.insert_transformed_copy_into( this, [], mult(current_plane, translation(0, 0, 1)) );
        Square.prototype.insert_transformed_copy_into( this, [], mult(mult(current_plane, translation(0, 0, -1)) , rotation(180,0,1,0)) );
        current_plane = rotation(90, 0, 1, 0);
        Square.prototype.insert_transformed_copy_into( this, [], mult(current_plane, translation(0, 0, 1)) );
        Square.prototype.insert_transformed_copy_into( this, [], mult(mult(current_plane, translation(0, 0, -1)) , rotation(180,0,1,0)) );
        current_plane = rotation(90, 1, 0, 0);
        Square.prototype.insert_transformed_copy_into( this, [], mult(current_plane, translation(0, 0, 1)) );
        Square.prototype.insert_transformed_copy_into( this, [], mult(mult(current_plane, translation(0, 0, -1)) , rotation(180,0,1,0)) );
	  }
  }, Shape )