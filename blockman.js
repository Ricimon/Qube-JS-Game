//expected input
//Assumptions: Blocks are only ever connected to two other blocks

Declare_Any_Class( "Blockman",
{
    "construct": function(startingIndex, startingState, speedPerFrame = .01) {
        this.define_data_members( 
            { 
                blocks: [], //will be added through addBlock, seperate add function for ez calling when you have the appropriate model_transform 
                curIndex: startingIndex,
                curState: startingState,
                speed: speedPerFrame,
                states: {}, //will be dict containing all scenes of arrays which contain all connected parts of that scene in arrays of indexes into this.blocks 
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
        //clear the moves stack
        this.moves = [];
        //find the blockIndex in one of the connection arrays of the current State
        let fromConnectionIndex = null;
        let toConnectionIndex = null;
        for ( connections in this.states[this.curState] ){ //look in group of blocks in the curState
            toConnectionIndex = connections.findIndex(blockIndex); 
            if ( toConnectionIndex != -1){ //if this connections has block to look for
                fromConnectionIndex = connections.findIndex(Math.round(this.curIndex));
                if( fromConnectionIndex != -1){ //if this connection also has curBlock
                    if( toConnectionIndex < fromConnectionIndex ) //push all indices between the two indicies 
                        for ( let x = fromConnectionIndex; x >= toConnectionIndex; x--)
                            moves.push(x);
                    else 
                        for ( let x = fromConnectionIndex; x <= toConnectionIndex; x++) 
                            moves.push(x);
                }
                else
                    console.log(blockIndex, " is unreachable");
                break;
            }
        }
    },
    "where": function(){
        let model_transform = this.blocks[this.curIndex]
        model_transform = mult( model_transform, translation(0, 1.5, 0) );
        return model_transform;
        //if in a rotating state, dont allow movement
        //use the curBlock to search up the curBlock's model Transform
        //use the blocks direction and the curIndex to place blockman in correct current location
        //move if move stack isnt empty popping movements as they are completed
        //return the model_transform
    },
    "addState": null,
    "changeState": function( newState ){
        this.curState = newState;
    }
});
                  