# project-group27

==========
Qube
==========

----------
Members
----------
- Jorge Fuentes
- Eric Qu
- Alex-Tien Tran

----------
Introduction
----------

Qube is a multi-level 3D perspective game that allows the player to manipulate camera angles of an uneven terrain and character movement to ultimately reach the end of the level in order to move onto the next. Perspective games have been around for a while. The best ones can perform tricks on the eye to form a cohesive object at one view angle, but an amalgam of random geometry at another. A prime example of such a game is Monument Valley. Like Monument Valley, the player will be free to change camera angles to look at a different part of the world. There, they can move obstacles to form a “path” for the character to move around and reach the end of the level.

----------
Advanced Topics Covered
----------

- Mouse Picking

----------
Implementation
----------

- Each level will have a unique map with geometry fixed at different locations
- Some geometry can be moved (translated) along fixed axis by the player by selecting an object and dragging the mouse. Geometry can be combined to form a path.
- Collision detection is not required because hard limits can be set on how much the player can move objects.
- The player will be able to control a sprite/character to travel along created paths. Movement is simply a mouse click on a space, and the sprite will attempt to move to that location if it is connected to the current path.
- The world has a fixed camera position and angle so as to hold the isometric view.

----------
Controls
----------

- Use mouse left click to select a position to where the sprite can move. Movement is done automatically, and no other use inputs is accepted until movement is complete
- Some platforms can be rotated by selecting and dragging the mouse left and right.
- Press 'p' to toggle picking frame

----------
Group Responsibilities
----------

- Jorge Fuentes: pathfinding and movement
- Eric Qu: level design
- Alex-Tien Tran: mouse picking 