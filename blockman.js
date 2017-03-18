//expected input
//Assumptions: Blocks are only ever connected to two other blocks

let isMoving = false;

Declare_Any_Class( "Blockman",
{
    "construct": function(startingIndex, startingState) {
        this.define_data_members( 
            { 
                blocks: [], //will be added through addBlock, seperate add function for ez calling when you have the appropriate model_transform 
                curIndex: startingIndex,
                curMatrixOffset: mat4([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]), //for smooth movement between indexes; between 0 and 1
                curState: startingState,
                states: {}, //will be dict containing whether they allow movement all scenes of arrays which contain all connected parts of that scene in arrays of indexes into this.blocks 
                moves: [], //stack of moves crafted from moveTo
                curMoveMatrix: null,
                framesPerBlockChange: 20, //how many frames should it take to get between one block and the next, can be changed dynamically with dt
                framesMovedOnCurrentBlock: 1,
                blockChangePerSecond: 1, //used to go from dt to frames Per block change when calling moveTo/where for the first time
                lastPickFrame: -1 //store the last pick so it doesnt do anything unless its a new value to prevent insta moves after rotation
            } );   
    },
    "reset": function(startingIndex, startingState) { //basically reconstruction
        isMoving = false;
        this.blocks = []; 
        this.curIndex = startingIndex;
        this.curMatrixOffset = mat4([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        this.curState = startingState;
        this.states = {};
        this.moves = []; 
        this.curMoveMatrix = null;
        this.HundredthsperDt = 1;
        this.lastPickFrame = -1;
    },
    "addBlock": function( transform ) {
        this.blocks.push(transform);
    },
    "updateBlock": function( blockNumber, transform ){
        this.blocks[blockNumber] = transform;
    },
    "moveTo": function(blockIndex){ //returns true if can move there and false if not
        //return if already moving there or default value or same value as last frame
        if( blockIndex == this.lastPickFrame || blockIndex == this.moves[0] || blockIndex == -1 )
            return false
        this.lastPickFrame = blockIndex;
        //clear the moves stack
//        console.log("MoveTo Called");
        this.moves = [];
        //find the blockIndex in one of the connection arrays of the current State
        let fromConnectionIndex = null;
        let toConnectionIndex = null;
        connections = this.states[this.curState].connections;
        for ( var i = 0; i < connections.length; i++ ){ //look in group of blocks in the curState
            let connection = connections[i];
            toConnectionIndex = connection.indexOf(blockIndex); 
            if ( toConnectionIndex != -1){ //if this connection has block to look for
                fromConnectionIndex = connection.indexOf(Math.round(this.curIndex));
                if( fromConnectionIndex != -1){ //if this connection also has curBlock
                    if( toConnectionIndex < fromConnectionIndex ) //push all indices between the two indicies 
                        for ( let x = toConnectionIndex; x <= fromConnectionIndex; x++)
                            this.moves.push(connection[x]);
                    else 
                        for ( let x = toConnectionIndex; x > fromConnectionIndex; x--) 
                            this.moves.push(connection[x]);
                    return true;
                    //TMP
                    //this.curIndex = blockIndex;
                }
                else
                    console.log(blockIndex, " is unreachable from your current location");
                    return false;
            }
        }
        console.log(blockIndex, " is unreachable in general");
        return false;
    },
    "changeEveryElementOfMat": function(mat, ft){
        let newMat = mat.map( array => { //for every array
                    return array.map( ele => { //for every element in that array
                       return Math.round(ft(ele)*100) / 100; //call the ft on it and round to the nearest hundreth
                    });
                } );
        newMat = newMat[0].concat(newMat[1]).concat(newMat[2]).concat(newMat[3]); //combine all arrays in single d for proper entry into mat4()
        return mat4(newMat); //turn new multiD array in a matrix
    },
    "equal": function(mat1, mat2){ //my equal function, DEPRECATED(floating pt issues persisted)
        mat1 = this.changeEveryElementOfMat(mat1, ele =>{
           return Math.round(ele*10) /10; 
        });
        mat2 = this.changeEveryElementOfMat(mat2, ele =>{
           return Math.round(ele*10) /10; 
        });
        return equal(mat1, mat2);
    },
    "where": function(dt){
        if( !this.states[this.curState].allowMovement )
            this.moves = [];
        
        let model_transform = this.blocks[this.curIndex];
        if ( this.moves.length ) { //if should move
            let destination = this.moves[this.moves.length-1]; //destination is Index to move to
            if ( this.curMoveMatrix == null ) {
                let difference = subtract(this.blocks[destination], this.blocks[this.curIndex]);
                this.curMoveMatrix = this.changeEveryElementOfMat(difference, ele => {
                    return ele/this.framesPerBlockChange;
                }); 
            }
            this.framesMovedOnCurrentBlock++;
            this.curMatrixOffset = add( this.curMatrixOffset, this.curMoveMatrix ); //store the continuous offset in curMatrixOffset
            model_transform = add( model_transform, this.curMatrixOffset );
            if ( this.framesMovedOnCurrentBlock == this.framesPerBlockChange ){ //if you reached your destination, reset all the movement matrixes and remove destination for moves stack
                this.framesMovedOnCurrentBlock = 1;
                this.curIndex = destination;
                this.curMoveMatrix = null;
                this.curMatrixOffset = mat4([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
//                if ( this.moves.length > 1 ) //so it doesnt spam moveTo by trying to move to a space it is already at
                this.moves.pop();
            }
        }
        model_transform = mult( model_transform, translation(0, 1.5, 0) ); //move above block
        if( this.curIndex >= 15  && currentScene == 1)
            model_transform = mult( model_transform, translation(-15, 15, 15) );
//		if (currentScene == 2)
//			if( this.curIndex == 38 || this.curIndex == 39 || this.curIndex == 40 ){
//				model_transform = mult( model_transform, translation(-20, 20, 20) );
//			}
        return model_transform;
        //move if move stack isnt empty popping movements as they are completed
    },
    "addState": function(name, connections, allowMovement = true) {
        this.states[name] = {
            "connections": connections,
            "allowMovement": allowMovement
        }
    },
    "changeState": function( newState ){
        this.curState = newState;
    },
    "earthquake": function( ){
        for (state in this.states){ //for all states
            this.states[state].connections = this.states[state].connections.map( array =>{ 
                if(array.indexOf(40) != -1){ //find the array with 40 in it and add the new blocks to it after 41
                    return array.concat([42,43,44,45]); //41 will always be at the end
                }
                else
                    return array;
            });
        }
        this.states["rotated1"].connections = this.states["rotated1"].connections.map( array =>{
            if( array.indexOf(30) != -1)
                return [];
            else if ( array.indexOf(40) != -1)
                return array.concat([31,30,29,28]);
            else
                return array;
        });
    }
});
                  