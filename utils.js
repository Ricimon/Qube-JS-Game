// ADD ANY GLOBAL ALGORITHMS THAT CAN BE USED -- MUST INCLUDE MV.JS

var getProjectedAngle = function ( plane, u, v )
{
	if ( plane.length < 3 || plane.length > 4 || u.length < 3 || u.length > 4 || v.length < 3 || v.length > 4 ) return 0;

	var plane_vec = vec3( plane[0], plane[1], plane[2] );
	var u_vec = vec3( u[0], u[1], u[2] );
	var v_vec = vec3( v[0], v[1], v[2] );

	var u_proj = scale_vec( 1/dot( plane_vec, plane_vec ), cross( plane_vec, cross( u_vec, plane_vec ) ) );
	var v_proj = scale_vec( 1/dot( plane_vec, plane_vec ), cross( plane_vec, cross( v_vec, plane_vec ) ) );

	var angle = Math.acos( dot( u_proj, v_proj ) / Math.sqrt(dot(u_proj,u_proj)) / Math.sqrt(dot(v_proj,v_proj)) );
	return angle;
}

function handle_mouse_dragging( mouse_center, mouse_from_center, rpm, delta_animation_time )
{
	var rotationAngle = 0;
	console.log( "Inside handle_mouse_dragging" );
	var dragging_vector = subtract( mouse_from_center, mouse_center );
	console.log( dragging_vector );
	// if ( mouse_center[1] < 0 )
	{
		if ( dragging_vector[0] > 0 ) rotationAngle = -1 * rpm * 360 / 60 * delta_animation_time/1000;
		else if ( dragging_vector[0] < 0 ) rotationAngle = rpm * 360 / 60 * delta_animation_time/1000;
	}
	// else if ( mouse_center[1] < 0 )
	// {
	// 	if ( dragging_vector[0] < 0 ) rotationAngle = -1 * rpm * 360 / 60 * delta_animation_time/1000;
	// 	else if ( dragging_vector[0] > 0 ) rotationAngle = rpm * 360 / 60 * delta_animation_time/1000;
	// }
	return rotationAngle;
}