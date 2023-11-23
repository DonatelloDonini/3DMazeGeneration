console.log("Maze.js");

import * as THREE from "three";
import * as CUSOTM_ERRORS from "./CustomErrors";
import * as MEASURES from "./Measures";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import Debugger from "./Debugger";

const inspector= new Debugger(true, true, true);

/**
 * Load a 3D font.
 * 
 * @async
 * @param {string} fontFilePath The file path to the font.json you want to load.
 * @returns The loaded font
 */
const loadFontAsync= async (fontFilePath)=> {
  const loader = new FontLoader();

  return new Promise((resolve, reject) => {
    loader.load(fontFilePath, (font) => {
      resolve(font);
    }, undefined, (error) => {
      reject(error);
    });
  });
}

/**
 * Get the binary array of a number.
 * 
 * @param {number} number The number you want to convert into a binary array.
 * @param {number} maxLength The minimum number of items in the return array.
 * @returns {number[]} An array of 0s and 1s relative to the binary representation of the number passed.
 */
const getBinaryArray= (number, maxLength)=> {
  const strNumber= number.toString(2);
  const strNumberWithPadding= strNumber.padStart(maxLength, "0");
  const binaryArray= strNumberWithPadding.split("").map(strBit=> parseInt(strBit));
  return binaryArray;
}

/**
 * Rotates an array based on the number of steps.\
 * Negative numbers rotate to left, positive to right, the number that overflow to the right reappear to the left and vice versa.
 * 
 * @param {Array} arr The array you want to rotate.
 * @param {number} positions How many places you want the elements to shift.
 * @returns A shifted copy of the array.
 */
const rotateArray = (arr, positions) => {
  const rotation = positions % arr.length;

  return rotation < 0 ?
    arr.slice(-rotation).concat(arr.slice(0, -rotation)) :
    arr.slice(arr.length - rotation).concat(arr.slice(0, arr.length - rotation));
};

class Maze{

  //////               //////
  ////// tile measures //////
  //////               //////

  static TILE_BASE_WIDTH= new MEASURES.Centimeter(30).toMeters();
  static TILE_BASE_HEIGHT= new MEASURES.Centimeter(30).toMeters();
  static TILE_THICKNESS= new MEASURES.Centimeter(2).toMeters();

  static WALL_HEIGHT= new MEASURES.Centimeter(15).toMeters();
  static WALL_THICKNESS= new MEASURES.Centimeter(2).toMeters();

  //////            //////
  ////// categories //////
  //////            //////

  static REGULAR_FLOOR_CODE= 0;
  static BLACK_FLOOR_CODE= 1;
  static BLUE_FLOOR_CODE= 2;
  static CHECKPOINT_CODE= 3;
  
  static U_VICTIM_CODE= 0;
  static H_VICTIM_CODE= 1;
  static S_VICTIM_CODE= 2;
  static GREEN_VICTIM_CODE= 10;
  static YELLOW_VICTIM_CODE= 11;
  static RED_VICTIM_CODE= 12;
  
  //////                   //////
  ////// victim properties //////
  //////                   //////

  static FONT_SIZE= new MEASURES.Centimeter(4).toMeters();
  static FONT_HEIGHT= new MEASURES.Centimeter(0.3).toMeters();
  static FONT_COLOR= 0x000000;
  static COLOR_VICTIM_HEIGHT= new MEASURES.Centimeter(4).toMeters();
  static COLOR_VICTIM_BASE_HEIGHT= new MEASURES.Centimeter(0.3).toMeters();
  static COLOR_VICTIM_BASE_WIDTH= new MEASURES.Centimeter(4).toMeters();

  //////        //////
  ////// colors //////
  //////        //////

  static FLOOR_WHITE_COLOR= 0XFFFFFF;
  static FLOOR_BLUE_COLOR= 0x0000FF;
  static FLOOR_BLACK_COLOR= 0X000000;
  static FLOOR_MIRROR_COLOR= 0xCCCCCC;

  static WALLS_COLOR= 0xFFFFFF;

  static RED_VICTIM_COLOR= 0xFF0000;
  static GREEN_VICTIM_COLOR= 0x00FF00;
  static YELLOW_VICTIM_COLOR= 0xFFFF00;
  
  //////                  //////
  ////// other properties //////
  //////                  //////

  static WALL_LEFT_SIDE= 0;
  static WALL_RIGHT_SIDE= 1;
  
  static MATERIAL= new THREE.MeshStandardMaterial({
    roughness: .4,
    metalness: .1
  });
  
  constructor(){
    this.initializeAbstraction();
    this._3DModelInitialized= false;
  }

  /**
   * Sets all the initial properties for the logic model.
   */
  initializeAbstraction(){
    this._matrix= [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];

    this.currentPosition= [1, 1];
    this.currentDirection= 0;
    this._currentPackageNumber= 0;
    this._origin= [1, 1];
  }

  /**
   * Load the default properties in order to prepare the 3D model.
   */
  async initialize3DModel(){
    const fontPath= "assets/fonts/droid/droid_sans_mono_regular.typeface.json";
    this.font= await loadFontAsync(fontPath);

    this._3DModel= new THREE.Group();
    this._3DModelInitialized= true;
  }

  /**
   * Get the logic width (in cells) of the current maze
   * @returns {number}
   */
  getLogicWidth(){
    return (this._matrix[0].length-1)/2;
  }

  /**
   * Get the logic heiht (in cells) of the current maze
   * @returns {number}
   */
  getLogicHeight(){
    return (this._matrix.length-1)/2;
  }

  /**
   * Get the width of the internal matrix of the maze.
   * @returns {number} The number of cells per row of the internal matrix.
   */
  _getWidth(){
    return this._matrix[0].length;
  }

  /**
   * Get the height of the internal matrix of the maze.
   * @returns {number} The number of rows of the internal matrix.
   */
  _getHeight(){
    return this._matrix.length;
  }

  /**
   * Checks wether there were lost packages during communication.
   * @param {number} id The progressive number indexing an update package.
   * @throws {CUSOTM_ERRORS.LostPackageError} if there were lost packages.
   */
  _checkForLostPackages(id){
    if (this._currentPackageNumber!== id){
      throw new CUSOTM_ERRORS.LostPackageError();
    }
    else{
      this._currentPackageNumber++;
    }
  }

  /**
   * Set the direction of the robot.
   * @param {number} direction A number representing the direction the robot is facing.
   */
  _updateDirection(direction){
    if (direction=== undefined) return;
    this.currentDirection= direction;
  }

  /**
   * Check if a coordinate is in the bounds of the maze
   * @param {[number, number]} coord The coordinate you want to check wether is in the bounds of the maze.
   * @returns {boolean}
   */
  _isCoordInMaze(coord){
    const xInBounds= coord[0]>0 && this._getWidth();
    const yInBounds= coord[1]> 0 && coord[1]< this._getHeight();
    return xInBounds && yInBounds;
  }

  /**
   * Adds an empty row at the beginning of the maze and updates the origin.
   */
  _addRowOnTop(){
    // add the row
    this._matrix.unshift(Array(this._getWidth()).fill(null), Array(this._getWidth()).fill(null));

    // update the origin
    this._origin[1]+= 2;
  }
  
  /**
   * Adds an empty row to the right of the maze.
   */
  _addColumnToRight(){
    // add the column
    for (let y= 0; y<this._getHeight(); y++){
      this._matrix[y].push(null, null);
    }
  }
  
  /**
   * Adds an empty row to the bottom of the maze
   */
  _addRowToBottom(){
    // add the row
    this._matrix.push(Array(this._getWidth()).fill(null), Array(this._getWidth()).fill(null));
  }
  
  /**
   * Adds an empty column to the left of the maze and updates the origin.
   */
  _addColumnToLeft(){
    // add the column
    for (let y= 0; y<this._getHeight(); y++){
      this._matrix[y].unshift(null, null);
    }

    // update the origin
    this._origin[0]+= 2;
  }

  /**
   * Resizes the maze based on the overflow of the current coordinate.
   */
  _updateMazeDimensions(){
    const positionInMatrix= this._getAbstractPosition();

    if      (positionInMatrix[1]<= 0)                this._addRowOnTop();
    else if (positionInMatrix[0]>=this._getWidth())  this._addColumnToRight();
    else if (positionInMatrix[1]>=this._getHeight()) this._addRowToBottom();
    else if (positionInMatrix[0]<=0)                 this._addColumnToLeft();
  }

  /*
   * Update the position of the robot inside the maze.\
   * If the coordinate overflows the maze bounds, it gets automatically resized.
   * 
   * @param {number} positionUpdate Wether if the robot has moved one cell forward or not.
   */
  _updatePosition(positionUpdate){
    if (positionUpdate=== undefined) return;
    
    switch (this.currentDirection) {
      case 0:
        this.currentPosition[1]-= 2;
        break;
      case 1:
        this.currentPosition[0]+= 2;
        break;
      case 2:
        this.currentPosition[1]+= 2;
        break;
      case 3:
        this.currentPosition[0]-= 2;
        break;
    
      default: throw new CUSOTM_ERRORS.NotValidDirectionError(this.currentDirection);
    }

    this._updateMazeDimensions(this.currentPosition);
  }

  /**
   * Set the floor informations for the current cell.
   * @param {number} floorCode A number representing the type of floor the robot is currently navigating on
   */
  _setFloor(floorCode){
    if (floorCode=== undefined) return;

    const positionInMatrix= this._getAbstractPosition();
    this._matrix[positionInMatrix[1]][positionInMatrix[0]]= new _Floor(floorCode);
  }

  /**
   * Set the robot's surrounding walls'informations.
   * @param {number} walls A number representing all the four walls currently around the robot.
   */
  _setWalls(walls){
    if (walls=== undefined) return;
    
    // unpack the walls
    const wallsBinaryArray= rotateArray(getBinaryArray(walls, 4), this.currentDirection);
    
    const [topWall, rightWall, bottomWall, leftWall]= wallsBinaryArray;
    
    const positionInMatrix= this._getAbstractPosition();

    const topWallPosition= [positionInMatrix[0], positionInMatrix[1]-1];
    const rightWallPosition= [positionInMatrix[0]+1, positionInMatrix[1]];
    const bottomWallPosition= [positionInMatrix[0], positionInMatrix[1]+1];
    const leftWallPosition= [positionInMatrix[0]-1, positionInMatrix[1]];
    
    if (topWall && (this._matrix[topWallPosition[1]][topWallPosition[0]]=== null))          this._matrix[topWallPosition[1]][topWallPosition[0]]= new _Wall(this.font);
    if (rightWall && (this._matrix[rightWallPosition[1]][rightWallPosition[0]]=== null))    this._matrix[rightWallPosition[1]][rightWallPosition[0]]= new _Wall(this.font);
    if (bottomWall && (this._matrix[bottomWallPosition[1]][bottomWallPosition[0]]=== null)) this._matrix[bottomWallPosition[1]][bottomWallPosition[0]]= new _Wall(this.font);
    if (leftWall && (this._matrix[leftWallPosition[1]][leftWallPosition[0]]=== null))       this._matrix[leftWallPosition[1]][leftWallPosition[0]]= new _Wall(this.font);
  }

  /**
   * Set the victim's informations.
   * @param {number} victim A number representing the victim found in the current position.
   */
  _setVictim(victim){
    if (victim=== undefined) return;
    
    let wallWithVictim= null;

    const victimSide= victim>= 100 ? Maze.WALL_RIGHT_SIDE : Maze.WALL_LEFT_SIDE;
    
    const positionInMatrix= this._getAbstractPosition();

    // get the wall
    switch (this.currentDirection) {
      case 0:
        switch (victimSide) {
          case Maze.WALL_RIGHT_SIDE:
            wallWithVictim= this._matrix[positionInMatrix[1]][positionInMatrix[0]+1];
            break;
          case Maze.WALL_LEFT_SIDE:
            wallWithVictim= this._matrix[positionInMatrix[1]][positionInMatrix[0]-1];
            break;
        }
        break;

      case 1:
        switch (victimSide) {
          case Maze.WALL_RIGHT_SIDE:
            wallWithVictim= this._matrix[positionInMatrix[1]+1][positionInMatrix[0]];
            break;
          case Maze.WALL_LEFT_SIDE:
            wallWithVictim= this._matrix[positionInMatrix[1]-1][positionInMatrix[0]];
            break;
        }
        break;

      case 2:
        switch (victimSide) {
          case Maze.WALL_RIGHT_SIDE:
            wallWithVictim= this._matrix[positionInMatrix[1]][positionInMatrix[0]-1];
            break;
          case Maze.WALL_LEFT_SIDE:
            wallWithVictim= this._matrix[positionInMatrix[1]][positionInMatrix[0]+1];
            break;
        }
        break;

      case 3:
        switch (victimSide) {
          case Maze.WALL_RIGHT_SIDE:
            wallWithVictim= this._matrix[positionInMatrix[1]-1][positionInMatrix[0]];
            break;
          case Maze.WALL_LEFT_SIDE:
            wallWithVictim= this._matrix[positionInMatrix[1]+1][positionInMatrix[0]];
            break;
        }
        break;
    }

    if (wallWithVictim=== null) wallWithVictim= new _Wall(this.font);
    
    wallWithVictim.setVictim(victim%100, victimSide===0 ? Maze.WALL_RIGHT_SIDE : Maze.WALL_LEFT_SIDE);
  }

  /**
   * Set a tile to ramp, this will trigger the creation of a new Maze level.
   * @param {number} ramp The eventual length of a ramp found.
   */
  _setRamp(ramp){
    if (ramp=== null) return;
    throw new CUSOTM_ERRORS.NotImplementedError();
  }

  /**
   * Updates the logical model of the maze.
   * @param {object} updatePackage An object containing all the changes done from the previous package sent.
   */
  _updateAbstraction(updatePackage){
    this._updateDirection(updatePackage.direction);
    
    this._updatePosition(updatePackage.positionUpdate);
    
    this._setFloor(updatePackage.floor);
    
    this._setWalls(updatePackage.walls);
    
    this._setVictim(updatePackage.victim);
    // this._setRamp(updatePackage.ramp);
  }

  _update3DModel(){
    const positionInMatrix= this._getAbstractPosition();
    
    const floorX= this.currentPosition[0] * Maze.TILE_BASE_WIDTH/2 - Maze.TILE_BASE_WIDTH/2;
    const floorY= this.currentPosition[1] * Maze.TILE_BASE_HEIGHT/2 - Maze.TILE_BASE_HEIGHT/2;
    const floorZ= 0;

    if (this._matrix[positionInMatrix[1]][positionInMatrix[0]]!== null){
      const floorModel= this._matrix[positionInMatrix[1]][positionInMatrix[0]].get3DModel();
      
      floorModel.position.set(floorX, floorZ, floorY);
      
      this._3DModel.add(floorModel);
    }

    const wallCoords=[
      [positionInMatrix[0], positionInMatrix[1]-1], // top wall coord
      [positionInMatrix[0]+1, positionInMatrix[1]], // right wall coord
      [positionInMatrix[0], positionInMatrix[1]+1], // bottom wall coord
      [positionInMatrix[0]-1, positionInMatrix[1]]  // left wall coord
    ];

    const wallsZ= (Maze.WALL_HEIGHT/2) + (Maze.TILE_THICKNESS/2);

    if (this._matrix[wallCoords[0][1]][wallCoords[0][0]]!== null){
      const topWallModel= this._matrix[wallCoords[0][1]][wallCoords[0][0]].get3DModel();
      
      const wallX= floorX;
      const wallY= -Maze.TILE_BASE_HEIGHT/2+floorY;
      topWallModel.position.set(wallX, wallsZ, wallY);

      this._3DModel.add(topWallModel);
    }
    
    if (this._matrix[wallCoords[1][1]][wallCoords[1][0]]!== null){
      const rightWallModel= this._matrix[wallCoords[1][1]][wallCoords[1][0]].get3DModel();
      rightWallModel.rotation.y+= new MEASURES.Degrees(90).toRadians();
      
      const wallX= Maze.TILE_BASE_WIDTH/2 + floorX;
      const wallY= floorY;
      rightWallModel.position.set(wallX, wallsZ, wallY);
      
      this._3DModel.add(rightWallModel);
    }
    
    if (this._matrix[wallCoords[2][1]][wallCoords[2][0]]!== null){
      const bottomWallModel= this._matrix[wallCoords[2][1]][wallCoords[2][0]].get3DModel();
      
      const wallX= floorX;
      const wallY= Maze.TILE_BASE_HEIGHT/2 + floorY;
      bottomWallModel.position.set(wallX, wallsZ, wallY);
      this._3DModel.add(bottomWallModel);
    }
    
    if (this._matrix[wallCoords[3][1]][wallCoords[3][0]]!== null){
      const leftWallModel= this._matrix[wallCoords[3][1]][wallCoords[3][0]].get3DModel();
      
      leftWallModel.rotation.y+= new MEASURES.Degrees(90).toRadians();
      const wallX= - Maze.TILE_BASE_WIDTH/2 + floorX;
      const wallY= floorY;
      leftWallModel.position.set(wallX, wallsZ, wallY);
      
      this._3DModel.add(leftWallModel);
    }
    
    return;
    
    throw new CUSOTM_ERRORS.NotImplementedError();
    // updating victim

  }

  _getAbstractPosition(){
    return [this._origin[0]+ (this.currentPosition[0]-1), this._origin[1]+ (this.currentPosition[1]-1)];
  }

  /**
   * Update the maze using a pre-defined update package.
   * 
   * @param {object} updatePackage An object containing all the changes done from the previous package sent.
   */
  update(updatePackage){
    this._checkForLostPackages(updatePackage.id);
    
    this._updateAbstraction(updatePackage);

    console.log(this.toString());

    if (this._3DModelInitialized){
      this._update3DModel(updatePackage);
    }
    else{
      console.warn("3D model not initialized, updating only the abstraction");
    }
  }

  /**
   * Get a string representation of the logical model.
   * @returns {string} A string representing the logical model of the maze.
   */
  toString(){
    let refill= "";

    for (let y= 0; y<this._getHeight(); y++){
      for (let x= 0; x<this._getWidth(); x++){
        const currentCell= this._matrix[y][x];
        if (currentCell=== null){
          refill+= " .";
        }
        else if (currentCell instanceof _Floor){
          refill+= " F";
        }
        else if (currentCell instanceof _Wall){
          refill+= " W";
        }
      }
      refill+= "\n";
    }

    return refill;
  }
}

class _Wall{

  constructor(font, leftSideVictim= null, rightSideVictim= null){
    this.font= font;
    this.leftSideVictim= leftSideVictim;
    this.rightSideVictim= rightSideVictim;
  }

  /**
   * Check for victim correctness.
   * @param {number} victimType A number representing the type of victim you want to add to the wall.
   * @throws {CUSOTM_ERRORS.InvalidVictimError} If the victim number passed isn't compatible with the ones listed in the "Maze" class.
   */
  _isValidVictim(victimType){
    if (! [Maze.U_VICTIM_CODE, Maze.H_VICTIM_CODE, Maze.S_VICTIM_CODE, Maze.GREEN_VICTIM_CODE, Maze.YELLOW_VICTIM_CODE, Maze.RED_VICTIM_CODE].includes(victimType)){
      throw new CUSOTM_ERRORS.InvalidVictimError(victimType);
    }
  }

  /**
   * Add a victim to a wall.
   * 
   * @param {number} victimType A number representing the type of victim.
   * @param {number} victimSide A number representing the side on which the victim must be added.
   * @throws {CUSOTM_ERRORS.InvalidVictimError} If the victim number passed isn't compatible with the ones listed in the "Maze" class.
   */
  setVictim(victimType, victimSide){
    this._isValidVictim(victimType);

    if (victimSide=== Maze.WALL_LEFT_SIDE){
      this.leftSideVictim= victimType;
    }
    else if (victimSide=== Maze.WALL_RIGHT_SIDE){
      this.rightSideVictim= victimType;      
    }
  }

  /**
   * Get a 3D model of the current type of wall set.
   * @returns {THREE.Group}
   */
  get3DModel(){
    // prepare the basic wall model
    const wallMaterial= Maze.MATERIAL.clone();
    wallMaterial.color.set(Maze.WALLS_COLOR);

    const modelWrapper= new THREE.Group();

    const wallBaseModel= new THREE.Mesh(
      new THREE.BoxGeometry(Maze.TILE_BASE_WIDTH, Maze.WALL_HEIGHT, Maze.WALL_THICKNESS),
      wallMaterial
    )

    modelWrapper.add(wallBaseModel);

    let leftVictimModel= null;
    const leftVictimMaterial= Maze.MATERIAL.clone();
    switch (this.leftSideVictim) {
      case null:
        break;

      case Maze.U_VICTIM_CODE:
        {
          leftVictimMaterial.color.set(Maze.FONT_COLOR);
  
          leftVictimModel= new THREE.Mesh(
            new TextGeometry("U", {
              font: this.font,
              size: Maze.FONT_SIZE,
              height: Maze.FONT_HEIGHT,
            }),
            leftVictimMaterial
          );

          const textBoundingBox= new THREE.Box3().setFromObject(leftVictimModel);
          const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
          const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
  
          leftVictimModel.position.set(textX, textY, -(Maze.WALL_THICKNESS/2) - Maze.FONT_HEIGHT);
        }
        break;


      case Maze.H_VICTIM_CODE:
        {
          leftVictimMaterial.color.set(Maze.FONT_COLOR);
  
          leftVictimModel= new THREE.Mesh(
            new TextGeometry("H", {
              font: this.font,
              size: Maze.FONT_SIZE,
              height: Maze.FONT_HEIGHT
            }),
            leftVictimMaterial
          );

          const textBoundingBox= new THREE.Box3().setFromObject(leftVictimModel);
          const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
          const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
  
          leftVictimModel.position.set(textX, textY, -(Maze.WALL_THICKNESS/2) - Maze.FONT_HEIGHT);
        }
        break;


      case Maze.S_VICTIM_CODE:
        {
          leftVictimMaterial.color.set(Maze.FONT_COLOR);
  
          leftVictimModel= new THREE.Mesh(
            new TextGeometry("S", {
              font: this.font,
              size: Maze.FONT_SIZE,
              height: Maze.FONT_HEIGHT
            }),
            leftVictimMaterial
          );

          const textBoundingBox= new THREE.Box3().setFromObject(leftVictimModel);
          const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
          const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
  
          leftVictimModel.position.set(textX, textY, -(Maze.WALL_THICKNESS/2) - Maze.FONT_HEIGHT);
        }
        break;


      case Maze.GREEN_VICTIM_CODE:
        {
          leftVictimMaterial.color.set(Maze.GREEN_VICTIM_COLOR);
          leftVictimModel= new THREE.Mesh(
            new THREE.BoxGeometry(Maze.COLOR_VICTIM_BASE_WIDTH, Maze.COLOR_VICTIM_HEIGHT, Maze.COLOR_VICTIM_BASE_HEIGHT),
            leftVictimMaterial
          )

          const victimZ= -(Maze.WALL_THICKNESS/2) - (Maze.COLOR_VICTIM_BASE_HEIGHT/2);
          leftVictimModel.position.set(0, 0, victimZ);
        }
        break;


      case Maze.YELLOW_VICTIM_CODE:
        {
          leftVictimMaterial.color.set(Maze.YELLOW_VICTIM_COLOR);
          leftVictimModel= new THREE.Mesh(
            new THREE.BoxGeometry(Maze.COLOR_VICTIM_BASE_WIDTH, Maze.COLOR_VICTIM_HEIGHT, Maze.COLOR_VICTIM_BASE_HEIGHT),
            leftVictimMaterial
          )

          const victimZ= -(Maze.WALL_THICKNESS/2) - (Maze.COLOR_VICTIM_BASE_HEIGHT/2);
          leftVictimModel.position.set(0, 0, victimZ);
        }
        break;


      case Maze.RED_VICTIM_CODE:
        {
          leftVictimMaterial.color.set(Maze.RED_VICTIM_COLOR);
          leftVictimModel= new THREE.Mesh(
            new THREE.BoxGeometry(Maze.COLOR_VICTIM_BASE_WIDTH, Maze.COLOR_VICTIM_HEIGHT, Maze.COLOR_VICTIM_BASE_HEIGHT),
            leftVictimMaterial
          )

          const victimZ= -(Maze.WALL_THICKNESS/2) - (Maze.COLOR_VICTIM_BASE_HEIGHT/2);
          leftVictimModel.position.set(0, 0, victimZ);
        }
        break;
    }

    if (leftVictimModel!== null){
      modelWrapper.add(leftVictimModel);
    }
    
    let rightVictimModel= null;
    let rightVictimMaterial= Maze.MATERIAL.clone();
    switch (this.rightSideVictim) {
      case null:
        break;


      case Maze.U_VICTIM_CODE:
        {
          rightVictimMaterial.color.set(Maze.FONT_COLOR);
  
          rightVictimModel= new THREE.Mesh(
            new TextGeometry("U", {
              font: this.font,
              size: Maze.FONT_SIZE,
              height: Maze.FONT_HEIGHT,
            }),
            rightVictimMaterial
          );

          const textBoundingBox= new THREE.Box3().setFromObject(rightVictimModel);
          const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
          const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
  
          rightVictimModel.position.set(textX, textY, Maze.WALL_THICKNESS/2);
        }
        break;


      case Maze.H_VICTIM_CODE:
        {
          rightVictimMaterial.color.set(Maze.FONT_COLOR);
  
          rightVictimModel= new THREE.Mesh(
            new TextGeometry("H", {
              font: this.font,
              size: Maze.FONT_SIZE,
              height: Maze.FONT_HEIGHT
            }),
            rightVictimMaterial
          );
  
          const textBoundingBox= new THREE.Box3().setFromObject(rightVictimModel);
          const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
          const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;

          rightVictimModel.position.set(textX, textY, Maze.WALL_THICKNESS/2);
        }
        break;


      case Maze.S_VICTIM_CODE:
        {
          rightVictimMaterial.color.set(Maze.FONT_COLOR);
  
          rightVictimModel= new THREE.Mesh(
            new TextGeometry("S", {
              font: this.font,
              size: Maze.FONT_SIZE,
              height: Maze.FONT_HEIGHT
            }),
            rightVictimMaterial
          );

          const textBoundingBox= new THREE.Box3().setFromObject(rightVictimModel);
          const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
          const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;

          rightVictimModel.position.set(textX, textY, Maze.WALL_THICKNESS/2);
        }
        break;


      case Maze.GREEN_VICTIM_CODE:
        rightVictimMaterial.color.set(Maze.GREEN_VICTIM_COLOR);

        rightVictimModel= new THREE.Mesh(
          new THREE.BoxGeometry(Maze.COLOR_VICTIM_BASE_WIDTH, Maze.COLOR_VICTIM_HEIGHT, Maze.COLOR_VICTIM_BASE_HEIGHT),
          rightVictimMaterial
        )

        rightVictimModel.position.set(0, 0, Maze.WALL_THICKNESS/2);
        break;


      case Maze.YELLOW_VICTIM_CODE:
        rightVictimMaterial.color.set(Maze.YELLOW_VICTIM_COLOR);

        rightVictimModel= new THREE.Mesh(
          new THREE.BoxGeometry(Maze.COLOR_VICTIM_BASE_WIDTH, Maze.COLOR_VICTIM_HEIGHT, Maze.COLOR_VICTIM_BASE_HEIGHT),
          rightVictimMaterial
        )

        rightVictimModel.position.set(0, 0, Maze.WALL_THICKNESS/2);
        break;


      case Maze.RED_VICTIM_CODE:
        rightVictimMaterial.color.set(Maze.RED_VICTIM_COLOR);

        rightVictimModel= new THREE.Mesh(
          new THREE.BoxGeometry(Maze.COLOR_VICTIM_BASE_WIDTH, Maze.COLOR_VICTIM_HEIGHT, Maze.COLOR_VICTIM_BASE_HEIGHT),
          rightVictimMaterial
        )

        rightVictimModel.position.set(0, 0, Maze.WALL_THICKNESS/2);
        break;
    }

    if (rightVictimModel!== null){
      modelWrapper.add(rightVictimModel);
    }

    return modelWrapper;
  }
}

class _Floor{

  static GEOMETRY= new THREE.BoxGeometry(
    Maze.TILE_BASE_WIDTH,
    Maze.TILE_THICKNESS,
    Maze.TILE_BASE_HEIGHT
  );

  constructor(floorType= 0){
    if (! [Maze.REGULAR_FLOOR_CODE, Maze.BLACK_FLOOR_CODE, Maze.BLUE_FLOOR_CODE, Maze.CHECKPOINT_CODE].includes(floorType)){
      throw new CUSOTM_ERRORS.InvalidFloorCodeError(floorType);
    }

    this.floorType= floorType;
  }

  /**
   * Get a 3D model of the current type of floor set.
   * @returns {THREE.Group}
   */
  get3DModel(){
    let selectedMaterial= null;
    let finalMesh= null;
    const modelWrapper= new THREE.Group();

    switch (this.floorType) {
      case Maze.REGULAR_FLOOR_CODE:
        selectedMaterial=  Maze.MATERIAL.clone();
        selectedMaterial.color.set(Maze.FLOOR_WHITE_COLOR);
        break;

      case Maze.BLACK_FLOOR_CODE:
        selectedMaterial= Maze.MATERIAL.clone();
        selectedMaterial.color.set(Maze.FLOOR_BLACK_COLOR);
        break;

      case Maze.BLUE_FLOOR_CODE:
        selectedMaterial= Maze.MATERIAL.clone();
        selectedMaterial.color.set(Maze.FLOOR_BLUE_COLOR);
        break;

      case Maze.CHECKPOINT_CODE:
        selectedMaterial= [
          Maze.MATERIAL.clone(),
          Maze.MATERIAL.clone(),
          null,
          Maze.MATERIAL.clone(),
          Maze.MATERIAL.clone(),
          Maze.MATERIAL.clone(),
        ];
        selectedMaterial.forEach(material=> material?.color.set(Maze.FLOOR_MIRROR_COLOR));

        const mirror= new Reflector(
          new THREE.PlaneGeometry(Maze.TILE_BASE_WIDTH, Maze.TILE_BASE_HEIGHT),
          {
            clipBias: 0,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: Maze.FLOOR_MIRROR_COLOR,
            recursion: 1,
          }
        );
      
        mirror.rotateX(- new MEASURES.Degrees(90).toRadians());
        modelWrapper.add(mirror);
        mirror.position.set(0, Maze.TILE_THICKNESS/2, 0);
        break;
    }
    
    finalMesh= new THREE.Mesh(_Floor.GEOMETRY, selectedMaterial);
    modelWrapper.add(finalMesh);

    return modelWrapper;
  }
}

export default Maze;