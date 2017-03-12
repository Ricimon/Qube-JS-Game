//expected input
//Assumptions: Blocks are only ever connected to two other blocks

Declare_Any_Class( "Blockman",
{
    "construct": function(startingIndex, startingState, speedPerFrame = .01) {
        this.define_data_members( 
            { 
                blocks: [], //will be added through addBlock, seperate add function for ez calling when you have the appropriate model_transform 
                curIndex: startingIndex,
                curOffset: 0, //for smooth movement between indexes; between 0 and 1
                curState: startingState,
                speed: speedPerFrame,
                states: {}, //will be dict containing whether they allow movement all scenes of arrays which contain all connected parts of that scene in arrays of indexes into this.blocks 
                moves: [] //stack of moves crafted from moveTo
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
                        for ( let x = fromConnectionIndex; x >= toConnectionIndex; x--)
                            this.moves.push(x);
                    else 
                        for ( let x = fromConnectionIndex; x <= toConnectionIndex; x++) 
                            this.moves.push(x);
                    //TMP
                    this.curIndex = blockIndex;
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
        model_transform = mult( model_transform, translation(0, 1.5, 0) );
        if ( this.moves.length ) {
            let destination = this.moves[this.moves.length-1];
            let difference = subtract(this.blocks[this.curIndex], this.blocks[destination]);
        }
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
                  