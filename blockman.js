//expected input
//Assumptions: Blocks are only ever connected to two other blocks

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
                curMoveMatrix: null
            } );   
    },
    "addBlock": function( transform ) {
        this.blocks.push(transform);
    },
    "updateBlock": function( blockNumber, transform ){
        this.blocks[blockNumber] = transform;
    },
    "moveTo": function(blockIndex){
        //return if already moving there
        if( blockIndex == this.moves[0] )
            return
        //clear the moves stack
        console.log("MoveTo Called");
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
                    //TMP
                    //this.curIndex = blockIndex;
                }
                else
                    console.log(blockIndex, " is unreachable from your current location");
                return;
            }
        }
        console.log(blockIndex, " is unreachable in general");
        return;
    },
    "where": function(){
        if( !this.states[this.curState].allowMovement )
            this.moves = [];
        
        let model_transform = this.blocks[this.curIndex];
        if ( this.moves.length ) { //if should move
            let destination = this.moves[this.moves.length-1]; //destination is Index to move to
            if ( this.curMoveMatrix == null ) {
                let difference = subtract(this.blocks[destination], this.blocks[this.curIndex]);
                difference.map( ele => {
                    if(ele != 0)
                        return ele/1000000.0; //SPEED: do a speedth of the difference every frame
                    else
                        console.log(destination);
                        return ele;
                } );
                this.curMoveMatrix = difference;
            }
            this.curMatrixOffset = add( this.curMatrixOffset, this.curMoveMatrix ); //store the continuous offset in curMatrixOffset
            model_transform = add( model_transform, this.curMatrixOffset );
            if ( equal( model_transform, this.blocks[destination] ) ){ //if you reached your destination, reset all the movement matrixes and remove destination for moves stack
                this.curIndex = destination;
                this.curMoveMatrix = null;
                this.curMatrixOffset = mat4([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
                if ( this.moves.length > 1 ) //so it doesnt spam moveTo by trying to move to a space it is already at
                    this.moves.pop();
            }
        }
        model_transform = mult( model_transform, translation(0, 1.5, 0) ); //move above block
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
    }
});
                  