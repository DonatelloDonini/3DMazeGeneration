import * as THREE from "three";
import * as CUSTOM_ERRORS from "./CustomErrors";
import * as CUSOTM_GEOMETRIES from "./CustomGeometries";
import * as MEASURES from "./Measures";
import Debugger from "./Debugger";
import _Maze from "./Maze";

const inspector= new Debugger(true, true, true);

class Map{
  /**
   * The Map class'purpose is to manage different mazes positioned on different layers.
   * It is designed to solve loop closure problems, and keeping track of the actual position in space of the robot.
   */
  constructor(){
    this.initialize();
  }
  
  initialize(){
    this.currentDirection= 0;
    this.positionInSpace= new THREE.Vector3(0, 0, 0);
    this._3DModel= new THREE.Group();
    this.currentMaze= new _Maze(0, 0, 0);
    this._3DModel.add(this.currentMaze._3DModel);
  }

  /**
   * Initialize the models that require some time to load.
   * @static
   * @async
   */
  static async initialize3DModel(){
    await _Maze.initializeFont();
    inspector.test("font initialized", "falied to initialize font", ()=> _Maze.VICTIMS_FONT!== null);
  }

  /**
   * Adds a 3D model of the ramp with the caratheristics found in the updatePackage.
   * 
   * @private
   * @param {number} steepness The angle of inclination of the ramp.
   * @param {number} rampLength The length of the ramp (A.K.A. the hypotenuse).
   * @returns {_Ramp} The object wrapping the 3D model.
   */
  _addRamp(steepness, rampLength){
    rampLength= new MEASURES.Centimeter(rampLength).toMeters();
    const rampAbstraction= new _Ramp(this.currentDirection%2=== 0 ? _Maze.TILE_BASE_WIDTH : _Maze.TILE_BASE_HEIGHT, rampLength, steepness);

    let shiftX= 0;
    let shiftZ= 0;

    switch (this.currentDirection) {
      case 0:
        shiftZ= (_Maze.TILE_BASE_HEIGHT/2)-rampAbstraction.baseHeight/2;
        break;
      case 1:
        shiftX= -((_Maze.TILE_BASE_WIDTH/2)-rampAbstraction.baseHeight/2);
        break;
      case 2:
        shiftZ= -((_Maze.TILE_BASE_HEIGHT/2)-rampAbstraction.baseHeight/2);
        break;
      case 3:
        shiftX= (_Maze.TILE_BASE_WIDTH/2)-rampAbstraction.baseHeight/2;
        break;
    }

    const rampX= (this.currentMaze.currentPosition[0]-1) * _Maze.TILE_BASE_WIDTH/2+ shiftX + this.currentMaze.position.x;
    const rampY= (rampAbstraction.getHeightDifference()/2) + this.currentMaze.position.y;
    const rampZ= (this.currentMaze.currentPosition[1]-1) * _Maze.TILE_BASE_HEIGHT/2 + shiftZ + this.currentMaze.position.z;
    
    const rampModel= rampAbstraction.get3DModel();
    rampModel.position.set(rampX, rampY, rampZ);
    rampModel.rotateY(new MEASURES.Degrees((this.currentDirection * -90 + 180)%360).toRadians());

    this._3DModel.add(rampModel);
    return rampAbstraction;
  }

  _setDirection(direction){
    if (direction=== undefined) return;
    this.currentDirection= direction;
  }

  /**
   * Update the Map abstraction and 3D model according to the last action performed by the robot.
   * @param {object} updatePackage [see docs] An onject containing a series of informations regarding the current environment around the robot.
   */
  update(updatePackage){
    this._setDirection(updatePackage.direction);
    this.currentMaze.updatePosition(updatePackage.positionUpdate, this.currentDirection);

    this.currentMaze.addFloor(updatePackage.floor);
    this.currentMaze.addWalls(updatePackage.walls, this.currentDirection);
    this.currentMaze.addVictim(updatePackage.victim, this.currentDirection);

    if (updatePackage.ramp!== undefined) {

      const ramp= this._addRamp(updatePackage.ramp, updatePackage.rampLength);
      
      let newMazeX= null;
      let newMazeZ= null;
      
      switch (this.currentDirection) {
        case 0:
          newMazeX= (this.currentMaze.currentPosition[0]-1) * _Maze.TILE_BASE_WIDTH/2 + this.currentMaze.position.x;
          newMazeZ= (this.currentMaze.currentPosition[1]+1) * _Maze.TILE_BASE_HEIGHT/2 - ramp.baseHeight + this.currentMaze.position.z;
          break;
        case 1:
          newMazeX= (this.currentMaze.currentPosition[0]-3) * _Maze.TILE_BASE_WIDTH/2 + ramp.baseHeight + this.currentMaze.position.x;
          newMazeZ= (this.currentMaze.currentPosition[1]-1) * _Maze.TILE_BASE_HEIGHT/2 + this.currentMaze.position.z;
          break;
        case 2:
          newMazeX= (this.currentMaze.currentPosition[0]-1) * _Maze.TILE_BASE_WIDTH/2 + this.currentMaze.position.x;
          newMazeZ= (this.currentMaze.currentPosition[1]-3) * _Maze.TILE_BASE_HEIGHT/2 + ramp.baseHeight + this.currentMaze.position.z;
          break;
        case 3:
          newMazeX= (this.currentMaze.currentPosition[0]+1) * _Maze.TILE_BASE_WIDTH/2 - ramp.baseHeight + this.currentMaze.position.x;
          newMazeZ= (this.currentMaze.currentPosition[1]-1) * _Maze.TILE_BASE_HEIGHT/2 + this.currentMaze.position.z;
          break;
      }

      const newMaze= new _Maze(
        newMazeX,
        ramp.getHeightDifference() + this.currentMaze.position.y,
        newMazeZ
      );

      this.currentMaze= newMaze;
      this._3DModel.add(this.currentMaze._3DModel);
    }
    
    inspector.logInfo("maze updated");
  }
  
  /**
   * Try to see if a part of 2 mazes have an overlapping section, if it's big enough and the position in space is coherent, the 2 mazes get merged in a single one.
   * @param {number} mergingRadius The "radius" of the square area you want to check before merging the mazes.
   */
  loopClosure(mergingRadius= 1){
    throw new CUSTOM_ERRORS.NotImplementedError();
  }

  /**
   * Get the shortest track from point A to point B in the map.
   */
  pathfind(){
    throw new CUSTOM_ERRORS.NotImplementedError();
  }

  /**
   * Get a string representation of all the groups of 3D geometries that together make up the map.
   * @returns {string}
   */
  get3DModelGroupsStructure(){
    let refill= "";

    throw new CUSTOM_ERRORS.NotImplementedError();
    return refill;
  }
}

class _Ramp{
  constructor(baseWidth, rampLength, steepness= 0){
    this.baseWidth= baseWidth;
    this.rampLength= rampLength;
    this.baseHeight= Math.cos(new MEASURES.Degrees(steepness).toRadians()) * this.rampLength;
    this.steepness= steepness;
    this._3DModel= new THREE.Group();
  }

  /**
   * Get a 3D model of the ramp along with the lateral walls.
   * @returns {THREE.Group}
   */
  get3DModel(){
    const rampMaterial= _Maze.MATERIAL.clone();
    rampMaterial.side= THREE.DoubleSide;
    
    const rampModel= new THREE.Mesh(
      new CUSOTM_GEOMETRIES.Ramp(this.baseWidth, _Maze.TILE_THICKNESS, this.rampLength, this.steepness),
      rampMaterial
    );

    const leftWallModel= new THREE.Mesh(
      new CUSOTM_GEOMETRIES.Ramp(_Maze.WALL_THICKNESS, _Maze.WALL_HEIGHT, this.rampLength, this.steepness),
      rampMaterial
    );
    leftWallModel.position.set(-this.baseWidth/2, _Maze.WALL_HEIGHT / 2 + _Maze.TILE_THICKNESS / 2, 0);
    
    const rightWallModel= new THREE.Mesh(
      new CUSOTM_GEOMETRIES.Ramp(_Maze.WALL_THICKNESS, _Maze.WALL_HEIGHT, this.rampLength, this.steepness),
      rampMaterial
    );
    rightWallModel.position.set(this.baseWidth/2, _Maze.WALL_HEIGHT / 2 + _Maze.TILE_THICKNESS / 2, 0);    

    this._3DModel.add(rampModel);
    this._3DModel.add(leftWallModel);
    this._3DModel.add(rightWallModel);
    
    return this._3DModel;
  }

  /**
   * Get the height difference from the start to the end of the ramp.\
   * The result can be a negative number if the ramp goes downwards.
   * @returns {number}
   */
  getHeightDifference(){
    return Math.sin(new MEASURES.Degrees(this.steepness).toRadians()) * this.rampLength;
  }
}

export default Map;