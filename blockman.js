//expected input 
/*
    The block indexing must be consistent, should be 0 down to up or left to right depending on the axis
    addBlock:   "length": length,
                "transform": transform, //the transform should be to the 0 index
                "connections": {},
                "axis": axis  //should be either 'x' or 'y'
    movement: the Blockname(specifyed when adding the block to blockman's known blocks) and index using my naming scheme
*/

Declare_Any_Class( "Blockman",
{
    "construct": function(context, startingBlock, startingIndex, speedPerFrame = .01) {
        this.define_data_members( 
            { 
                blocks: {}, //will be added through addBlock, seperate add function for ez calling when you have the appropriate model_transform
                curBlock: startingBlock, 
                curIndex: startingIndex, 
                speed: speedPerFrame, 
                animation_scene: context, //game scene context to allow call to draw rectangle for cubeman
                moves: [], //stack of moves crafted from the Dijkstra Tree
                altBlocks: {}
            } );   
    },
    "addBlock": function( blockName, length, transform, axis, alt = false ) {
        let dict = this.blocks; //if not alt
        if( alt ){
            dict = this.altBlocks;
        }
        
        dict[blockName] = {
            "length": length,
            "transform": transform,
            "connections": {},
            "axis": axis
        }
    },
    "addConnection": function( block1Name, block1Index, block2Name, block2Index, alt = false ) {
        let dict = this.blocks; //if not alt
        if( alt ) {
            dict = this.altBlocks;
        }
        
        dict[block1Name].connections[block1Index] = {
            connectedTo: block2Name,
            connectedAt: block2Index
        }
        dict[block2Name].connections[block2Index] = {
            connectedTo: block1Name,
            connectedAt: block1Index
        }
    },
    "moveTo": function(blockName, blockIndex){
        //clear the moves stack
        //create a Dijkstra Tree and from blockName and blockIndex push all the parent nodes onto the moves stack  
    },
    "drawBlockman": function(){
        //use the curBlock to search up the curBlock's model Transform
        //use the blocks direction and the curIndex to place blockman in correct current location
        //move if move stack isnt empty popping movements as they are completed
        //use this.animation scene to call draw rectangle
    },
    "alternateBlocks": function(){
        let tmp = {};
        for (let block in altBlocks){ //swap all blocks in altBlocks with the current
            tmp.block = this.blocks.block; //swap curBlock and altBlock
            this.blocks[block] = this.altBlocks[block];
            this.altBlocks[block] = tmp.block;
        }
    }
}
                  