console.log("Maze.js");

import * as THREE from "three";
import * as CUSOTM_ERRORS from "./CustomErrors";
import * as MEASURES from "./Measures";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import Debugger from "./Debugger";

const inspector= new Debugger();
inspector.disableInfo();
inspector.enableTesting();
inspector.enableWarning();

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

class _Maze{

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
  
  static VICTIMS_FONT= null;

  constructor(shiftX, shiftY, shiftZ){
    this.position= new THREE.Vector3(shiftX, shiftY, shiftZ);
    this._initialize();
  }

  /**
   * Sets all the initial properties for the logic model.
   */
  _initialize(){
    this._matrix= [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];

    this.currentPosition= [1, 1];
    this._currentPackageNumber= 0;
    this._origin= [1, 1];
    this._3DModel= new THREE.Group();
    this._3DModel.position.copy(this.position);
  }

  /**
   * Load the font in which the victims are written.
   * @static
   * @async
   */
  static async initializeFont(){
    const fontPath= "assets/fonts/droid/droid_sans_mono_regular.typeface.json";
    _Maze.VICTIMS_FONT= await loadFontAsync(fontPath);
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
  updatePosition(positionUpdate, direction){
    if (positionUpdate=== undefined) return;
    
    switch (direction) {
      case 0:
        this.currentPosition[1]-= 2 * positionUpdate;
        break;
      case 1:
        this.currentPosition[0]+= 2 * positionUpdate;
        break;
      case 2:
        this.currentPosition[1]+= 2 * positionUpdate;
        break;
      case 3:
        this.currentPosition[0]-= 2 * positionUpdate;
        break;
    
      default: throw new CUSOTM_ERRORS.NotValidDirectionError(direction);
    }

    this._updateMazeDimensions(this.currentPosition);
    inspector.logInfo("position updated");
  }

  /**
   * Set the floor informations for the current cell.
   * @param {number} floorCode A number representing the type of floor the robot is currently navigating on
   */
  addFloor(floorCode){
    if (floorCode=== undefined) return;

    const positionInMatrix= this._getAbstractPosition();
    this._matrix[positionInMatrix[1]][positionInMatrix[0]]= new _Floor(floorCode);

    if (
      this._matrix[positionInMatrix[1]][positionInMatrix[0]]!== null &&
      (! this._matrix[positionInMatrix[1]][positionInMatrix[0]].alreadyBuilt)
      ){
      const floorX= this.currentPosition[0] * _Maze.TILE_BASE_WIDTH/2 - _Maze.TILE_BASE_WIDTH/2;
      const floorY= 0;
      const floorZ= this.currentPosition[1] * _Maze.TILE_BASE_HEIGHT/2 - _Maze.TILE_BASE_HEIGHT/2;

      const floorModel= this._matrix[positionInMatrix[1]][positionInMatrix[0]].get3DModel();
      floorModel.position.set(floorX, floorY, floorZ);
      
      this._3DModel.add(floorModel);
    }
    inspector.logInfo("floor updated");
  }

  /**
   * Set the robot's surrounding walls'informations.
   * @param {number} walls A number representing all the four walls currently around the robot.
   */
  addWalls(walls, direction){
    if (walls=== undefined) return;
    
    // unpack the walls
    const wallsBinaryArray= rotateArray(getBinaryArray(walls, 4), direction);
    
    const [topWall, rightWall, bottomWall, leftWall]= wallsBinaryArray;
    
    const positionInMatrix= this._getAbstractPosition();

    const topWallPosition= [positionInMatrix[0], positionInMatrix[1]-1];
    const rightWallPosition= [positionInMatrix[0]+1, positionInMatrix[1]];
    const bottomWallPosition= [positionInMatrix[0], positionInMatrix[1]+1];
    const leftWallPosition= [positionInMatrix[0]-1, positionInMatrix[1]];
    
    if (topWall && (this._matrix[topWallPosition[1]][topWallPosition[0]]=== null))          this._matrix[topWallPosition[1]][topWallPosition[0]]=       new _Wall();
    if (rightWall && (this._matrix[rightWallPosition[1]][rightWallPosition[0]]=== null))    this._matrix[rightWallPosition[1]][rightWallPosition[0]]=   new _Wall();
    if (bottomWall && (this._matrix[bottomWallPosition[1]][bottomWallPosition[0]]=== null)) this._matrix[bottomWallPosition[1]][bottomWallPosition[0]]= new _Wall();
    if (leftWall && (this._matrix[leftWallPosition[1]][leftWallPosition[0]]=== null))       this._matrix[leftWallPosition[1]][leftWallPosition[0]]=     new _Wall();

    const floorX= this.currentPosition[0] * _Maze.TILE_BASE_WIDTH/2 - _Maze.TILE_BASE_WIDTH/2;
    const floorZ= this.currentPosition[1] * _Maze.TILE_BASE_HEIGHT/2 - _Maze.TILE_BASE_HEIGHT/2;
    
    const wallsY= (_Maze.WALL_HEIGHT/2) + (_Maze.TILE_THICKNESS/2);

    if (topWall && (! this._matrix[topWallPosition[1]][topWallPosition[0]].alreadyBuilt)){
      const topWallModel= this._matrix[topWallPosition[1]][topWallPosition[0]].get3DModel();
      
      const wallX= floorX;
      const wallZ= -_Maze.TILE_BASE_HEIGHT/2+floorZ;
      topWallModel.position.set(wallX, wallsY, wallZ);

      this._3DModel.add(topWallModel);
    }
    
    if (rightWall && (! this._matrix[rightWallPosition[1]][rightWallPosition[0]].alreadyBuilt)){
      const rightWallModel= this._matrix[rightWallPosition[1]][rightWallPosition[0]].get3DModel();
      rightWallModel.rotation.y+= new MEASURES.Degrees(90).toRadians();
      
      const wallX= _Maze.TILE_BASE_WIDTH/2 + floorX;
      const wallZ= floorZ;
      rightWallModel.position.set(wallX, wallsY, wallZ);
      
      this._3DModel.add(rightWallModel);
    }
    
    if (bottomWall && (! this._matrix[bottomWallPosition[1]][bottomWallPosition[0]].alreadyBuilt)){
      const bottomWallModel= this._matrix[bottomWallPosition[1]][bottomWallPosition[0]].get3DModel();
      
      const wallX= floorX;
      const wallZ= _Maze.TILE_BASE_HEIGHT/2 + floorZ;
      bottomWallModel.position.set(wallX, wallsY, wallZ);
      this._3DModel.add(bottomWallModel);
    }
    
    if (leftWall && (! this._matrix[leftWallPosition[1]][leftWallPosition[0]].alreadyBuilt)){
      const leftWallModel= this._matrix[leftWallPosition[1]][leftWallPosition[0]].get3DModel();
      
      leftWallModel.rotation.y+= new MEASURES.Degrees(90).toRadians();
      const wallX= - _Maze.TILE_BASE_WIDTH/2 + floorX;
      const wallZ= floorZ;
      leftWallModel.position.set(wallX, wallsY, wallZ);
      
      this._3DModel.add(leftWallModel);
    }
    inspector.logInfo("walls updated");
  }

  /**
   * Set the victim's informations.
   * @param {number} victim A number representing the victim found in the current position.
   */
  addVictim(victim, direction){
    if (victim=== undefined) return;
    
    let wallWithVictim= null;
    const victimSide= victim>= 100 ? _Maze.WALL_RIGHT_SIDE : _Maze.WALL_LEFT_SIDE;
    const positionInMatrix= this._getAbstractPosition();

    const topWallPosition= [positionInMatrix[0], positionInMatrix[1]-1];
    const rightWallPosition= [positionInMatrix[0]+1, positionInMatrix[1]];
    const bottomWallPosition= [positionInMatrix[0], positionInMatrix[1]+1];
    const leftWallPosition= [positionInMatrix[0]-1, positionInMatrix[1]];

    // get the wall
    switch (direction) {
      case 0:
        switch (victimSide) {
          case _Maze.WALL_LEFT_SIDE:
            wallWithVictim= this._matrix[leftWallPosition[1]][leftWallPosition[0]];
            break;
          case _Maze.WALL_RIGHT_SIDE:
            wallWithVictim= this._matrix[rightWallPosition[1]][rightWallPosition[0]];
            break;
        }
        break;

      case 1:
        switch (victimSide) {
          case _Maze.WALL_LEFT_SIDE:
            wallWithVictim= this._matrix[topWallPosition[1]][topWallPosition[0]];
            break;
          case _Maze.WALL_RIGHT_SIDE:
            wallWithVictim= this._matrix[bottomWallPosition[1]][bottomWallPosition[0]];
            break;
        }
        break;

      case 2:
        switch (victimSide) {
          case _Maze.WALL_LEFT_SIDE:
            wallWithVictim= this._matrix[rightWallPosition[1]][rightWallPosition[0]];
            break;
          case _Maze.WALL_RIGHT_SIDE:
            wallWithVictim= this._matrix[leftWallPosition[1]][leftWallPosition[0]];
            break;
        }
        break;

      case 3:
        switch (victimSide) {
          case _Maze.WALL_LEFT_SIDE:
            wallWithVictim= this._matrix[bottomWallPosition[1]][bottomWallPosition[0]];
            break;
          case _Maze.WALL_RIGHT_SIDE:
            wallWithVictim= this._matrix[topWallPosition[1]][topWallPosition[0]];
            break;
        }
        break;
    }

    if (wallWithVictim=== null) wallWithVictim= new _Wall();
    
    if (direction=== 0 || direction=== 1) wallWithVictim.setVictim(victim%100, victimSide===_Maze.WALL_LEFT_SIDE ? _Maze.WALL_RIGHT_SIDE : _Maze.WALL_LEFT_SIDE);
    if (direction=== 2 || direction=== 3) wallWithVictim.setVictim(victim%100, victimSide);

    if (_Maze.VICTIMS_FONT!== null){
      wallWithVictim.get3DModel();
    }
    inspector.logInfo("victims updated");
  }

  /**
   * Link a maze to another with a ramp.
   * @param {_Maze} otherMaze Another maze, specifically the one the ramp takes to.
   */
  rampToOtherMaze(otherMaze){
    throw new CUSOTM_ERRORS.NotImplementedError();
  }

  /**
   * Get the position that the robot has inside the abstract matrix.\
   * This position doesn't refer to the real position in space, this.currentPosition does.
   * 
   * @private
   * @returns {[number, number]}
   */
  _getAbstractPosition(){
    return [this._origin[0]+ (this.currentPosition[0]-1), this._origin[1]+ (this.currentPosition[1]-1)];
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
        else if (currentCell instanceof _Ramp){
          refill+= " R";
        }
      }
      refill+= "\n";
    }

    return refill;
  }
}

class _Wall{

  constructor(leftSideVictim= null, rightSideVictim= null){
    this.leftSideVictim= leftSideVictim;
    this.rightSideVictim= rightSideVictim;
    this._3DModel= new THREE.Group();
    this.alreadyBuilt= false;
    this.leftVictimAdded= false;
    this.rightVictimAdded= false;
  }

  /**
   * Check for victim correctness.
   * @param {number} victimType A number representing the type of victim you want to add to the wall.
   * @throws {CUSOTM_ERRORS.InvalidVictimError} If the victim number passed isn't compatible with the ones listed in the "Maze" class.
   */
  _isValidVictim(victimType){
    if (! [_Maze.U_VICTIM_CODE, _Maze.H_VICTIM_CODE, _Maze.S_VICTIM_CODE, _Maze.GREEN_VICTIM_CODE, _Maze.YELLOW_VICTIM_CODE, _Maze.RED_VICTIM_CODE].includes(victimType)){
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

    if (victimSide=== _Maze.WALL_LEFT_SIDE){
      this.leftSideVictim= victimType;
    }
    else if (victimSide=== _Maze.WALL_RIGHT_SIDE){
      this.rightSideVictim= victimType;      
    }
  }

  /**
   * Update the victim based on the saved victim codes.
   * @private
   */
  _addVictims(){
    if ((this.leftSideVictim!== null) && (! this.leftVictimAdded)){

      let leftVictimModel= null;
      const leftVictimMaterial= _Maze.MATERIAL.clone();
      switch (this.leftSideVictim) {
        case null:
          break;
  
        case _Maze.U_VICTIM_CODE:
          {
            leftVictimMaterial.color.set(_Maze.FONT_COLOR);
    
            leftVictimModel= new THREE.Mesh(
              new TextGeometry("U", {
                font: _Maze.VICTIMS_FONT,
                size: _Maze.FONT_SIZE,
                height: _Maze.FONT_HEIGHT,
              }),
              leftVictimMaterial
            );
  
            const textBoundingBox= new THREE.Box3().setFromObject(leftVictimModel);
            const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
            const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
    
            leftVictimModel.position.set(textX, textY, -(_Maze.WALL_THICKNESS/2) - _Maze.FONT_HEIGHT);
          }
          break;
  
  
        case _Maze.H_VICTIM_CODE:
          {
            leftVictimMaterial.color.set(_Maze.FONT_COLOR);
    
            leftVictimModel= new THREE.Mesh(
              new TextGeometry("H", {
                font: _Maze.VICTIMS_FONT,
                size: _Maze.FONT_SIZE,
                height: _Maze.FONT_HEIGHT
              }),
              leftVictimMaterial
            );
  
            const textBoundingBox= new THREE.Box3().setFromObject(leftVictimModel);
            const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
            const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
    
            leftVictimModel.position.set(textX, textY, -(_Maze.WALL_THICKNESS/2) - _Maze.FONT_HEIGHT);
          }
          break;
  
  
        case _Maze.S_VICTIM_CODE:
          {
            leftVictimMaterial.color.set(_Maze.FONT_COLOR);
    
            leftVictimModel= new THREE.Mesh(
              new TextGeometry("S", {
                font: _Maze.VICTIMS_FONT,
                size: _Maze.FONT_SIZE,
                height: _Maze.FONT_HEIGHT
              }),
              leftVictimMaterial
            );
  
            const textBoundingBox= new THREE.Box3().setFromObject(leftVictimModel);
            const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
            const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
    
            leftVictimModel.position.set(textX, textY, -(_Maze.WALL_THICKNESS/2) - _Maze.FONT_HEIGHT);
          }
          break;
  
  
        case _Maze.GREEN_VICTIM_CODE:
          {
            leftVictimMaterial.color.set(_Maze.GREEN_VICTIM_COLOR);
            leftVictimModel= new THREE.Mesh(
              new THREE.BoxGeometry(_Maze.COLOR_VICTIM_BASE_WIDTH, _Maze.COLOR_VICTIM_HEIGHT, _Maze.COLOR_VICTIM_BASE_HEIGHT),
              leftVictimMaterial
            )
  
            const victimZ= -(_Maze.WALL_THICKNESS/2) - (_Maze.COLOR_VICTIM_BASE_HEIGHT/2);
            leftVictimModel.position.set(0, 0, victimZ);
          }
          break;
  
  
        case _Maze.YELLOW_VICTIM_CODE:
          {
            leftVictimMaterial.color.set(_Maze.YELLOW_VICTIM_COLOR);
            leftVictimModel= new THREE.Mesh(
              new THREE.BoxGeometry(_Maze.COLOR_VICTIM_BASE_WIDTH, _Maze.COLOR_VICTIM_HEIGHT, _Maze.COLOR_VICTIM_BASE_HEIGHT),
              leftVictimMaterial
            )
  
            const victimZ= -(_Maze.WALL_THICKNESS/2) - (_Maze.COLOR_VICTIM_BASE_HEIGHT/2);
            leftVictimModel.position.set(0, 0, victimZ);
          }
          break;
  
  
        case _Maze.RED_VICTIM_CODE:
          {
            leftVictimMaterial.color.set(_Maze.RED_VICTIM_COLOR);
            leftVictimModel= new THREE.Mesh(
              new THREE.BoxGeometry(_Maze.COLOR_VICTIM_BASE_WIDTH, _Maze.COLOR_VICTIM_HEIGHT, _Maze.COLOR_VICTIM_BASE_HEIGHT),
              leftVictimMaterial
            )
  
            const victimZ= -(_Maze.WALL_THICKNESS/2) - (_Maze.COLOR_VICTIM_BASE_HEIGHT/2);
            leftVictimModel.position.set(0, 0, victimZ);
          }
          break;
      }
  
      if (leftVictimModel!== null){
        this._3DModel.add(leftVictimModel);
      }

      this.leftVictimAdded= true;
    }

    if ((this.rightSideVictim!== null) && (! this.rightVictimAdded)){

      let rightVictimModel= null;
      let rightVictimMaterial= _Maze.MATERIAL.clone();
      switch (this.rightSideVictim) {
        case null:
          break;
  
  
        case _Maze.U_VICTIM_CODE:
          {
            rightVictimMaterial.color.set(_Maze.FONT_COLOR);
    
            rightVictimModel= new THREE.Mesh(
              new TextGeometry("U", {
                font: _Maze.VICTIMS_FONT,
                size: _Maze.FONT_SIZE,
                height: _Maze.FONT_HEIGHT,
              }),
              rightVictimMaterial
            );
  
            const textBoundingBox= new THREE.Box3().setFromObject(rightVictimModel);
            const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
            const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
    
            rightVictimModel.position.set(textX, textY, _Maze.WALL_THICKNESS/2);
          }
          break;
  
  
        case _Maze.H_VICTIM_CODE:
          {
            rightVictimMaterial.color.set(_Maze.FONT_COLOR);
    
            rightVictimModel= new THREE.Mesh(
              new TextGeometry("H", {
                font: _Maze.VICTIMS_FONT,
                size: _Maze.FONT_SIZE,
                height: _Maze.FONT_HEIGHT
              }),
              rightVictimMaterial
            );
    
            const textBoundingBox= new THREE.Box3().setFromObject(rightVictimModel);
            const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
            const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
  
            rightVictimModel.position.set(textX, textY, _Maze.WALL_THICKNESS/2);
          }
          break;
  
  
        case _Maze.S_VICTIM_CODE:
          {
            rightVictimMaterial.color.set(_Maze.FONT_COLOR);
    
            rightVictimModel= new THREE.Mesh(
              new TextGeometry("S", {
                font: _Maze.VICTIMS_FONT,
                size: _Maze.FONT_SIZE,
                height: _Maze.FONT_HEIGHT
              }),
              rightVictimMaterial
            );
  
            const textBoundingBox= new THREE.Box3().setFromObject(rightVictimModel);
            const textX= -(textBoundingBox.max.x - textBoundingBox.min.x)/2;
            const textY= -(textBoundingBox.max.y - textBoundingBox.min.y)/2;
  
            rightVictimModel.position.set(textX, textY, _Maze.WALL_THICKNESS/2);
          }
          break;
  
  
        case _Maze.GREEN_VICTIM_CODE:
          rightVictimMaterial.color.set(_Maze.GREEN_VICTIM_COLOR);
  
          rightVictimModel= new THREE.Mesh(
            new THREE.BoxGeometry(_Maze.COLOR_VICTIM_BASE_WIDTH, _Maze.COLOR_VICTIM_HEIGHT, _Maze.COLOR_VICTIM_BASE_HEIGHT),
            rightVictimMaterial
          )
  
          rightVictimModel.position.set(0, 0, _Maze.WALL_THICKNESS/2);
          break;
  
  
        case _Maze.YELLOW_VICTIM_CODE:
          rightVictimMaterial.color.set(_Maze.YELLOW_VICTIM_COLOR);
  
          rightVictimModel= new THREE.Mesh(
            new THREE.BoxGeometry(_Maze.COLOR_VICTIM_BASE_WIDTH, _Maze.COLOR_VICTIM_HEIGHT, _Maze.COLOR_VICTIM_BASE_HEIGHT),
            rightVictimMaterial
          )
  
          rightVictimModel.position.set(0, 0, _Maze.WALL_THICKNESS/2);
          break;
  
  
        case _Maze.RED_VICTIM_CODE:
          rightVictimMaterial.color.set(_Maze.RED_VICTIM_COLOR);
  
          rightVictimModel= new THREE.Mesh(
            new THREE.BoxGeometry(_Maze.COLOR_VICTIM_BASE_WIDTH, _Maze.COLOR_VICTIM_HEIGHT, _Maze.COLOR_VICTIM_BASE_HEIGHT),
            rightVictimMaterial
          )
  
          rightVictimModel.position.set(0, 0, _Maze.WALL_THICKNESS/2);
          break;
      }
  
      if (rightVictimModel!== null){
        this._3DModel.add(rightVictimModel);
      }

      this.rightVictimAdded= true;
    }
  }

  /**
   * Get a 3D model of the current type of wall set.
   * @returns {THREE.Group}
   */
  get3DModel(){
    // prepare the basic wall model
    const wallMaterial= _Maze.MATERIAL.clone();
    wallMaterial.color.set(_Maze.WALLS_COLOR);

    const wallBaseModel= new THREE.Mesh(
      new THREE.BoxGeometry(_Maze.TILE_BASE_WIDTH, _Maze.WALL_HEIGHT, _Maze.WALL_THICKNESS),
      wallMaterial
    );

    this._3DModel.add(wallBaseModel);
    
    if (_Maze.VICTIMS_FONT!== null){
      this._addVictims();
    }
    else{
      console.warn("font not initialized, victims can not be rendered");
    }

    this.alreadyBuilt= true;
    return this._3DModel;
  }
}

class _Floor{

  static GEOMETRY= new THREE.BoxGeometry(
    _Maze.TILE_BASE_WIDTH,
    _Maze.TILE_THICKNESS,
    _Maze.TILE_BASE_HEIGHT
  );

  constructor(floorType= 0){
    if (! [_Maze.REGULAR_FLOOR_CODE, _Maze.BLACK_FLOOR_CODE, _Maze.BLUE_FLOOR_CODE, _Maze.CHECKPOINT_CODE].includes(floorType)){
      throw new CUSOTM_ERRORS.InvalidFloorCodeError(floorType);
    }

    this.floorType= floorType;
    this._3DModel= new THREE.Group();
    this.alreadyBuilt= false;
  }

  /**
   * Get a 3D model of the current type of floor set.
   * @returns {THREE.Group}
   */
  get3DModel(){
    let selectedMaterial= null;
    let finalMesh= null;

    switch (this.floorType) {
      case _Maze.REGULAR_FLOOR_CODE:
        selectedMaterial=  _Maze.MATERIAL.clone();
        selectedMaterial.color.set(_Maze.FLOOR_WHITE_COLOR);
        break;

      case _Maze.BLACK_FLOOR_CODE:
        selectedMaterial= _Maze.MATERIAL.clone();
        selectedMaterial.color.set(_Maze.FLOOR_BLACK_COLOR);
        break;

      case _Maze.BLUE_FLOOR_CODE:
        selectedMaterial= _Maze.MATERIAL.clone();
        selectedMaterial.color.set(_Maze.FLOOR_BLUE_COLOR);
        break;

      case _Maze.CHECKPOINT_CODE:
        selectedMaterial= [
          _Maze.MATERIAL.clone(),
          _Maze.MATERIAL.clone(),
          null,
          _Maze.MATERIAL.clone(),
          _Maze.MATERIAL.clone(),
          _Maze.MATERIAL.clone(),
        ];
        selectedMaterial.forEach(material=> material?.color.set(_Maze.FLOOR_MIRROR_COLOR));

        const mirror= new Reflector(
          new THREE.PlaneGeometry(_Maze.TILE_BASE_WIDTH, _Maze.TILE_BASE_HEIGHT),
          {
            clipBias: 0,
            textureWidth: window.innerWidth * window.devicePixelRatio,
            textureHeight: window.innerHeight * window.devicePixelRatio,
            color: _Maze.FLOOR_MIRROR_COLOR,
            recursion: 1,
          }
        );
      
        mirror.rotateX(- new MEASURES.Degrees(90).toRadians());
        this._3DModel.add(mirror);
        mirror.position.set(0, _Maze.TILE_THICKNESS/2, 0);
        break;
    }
    
    finalMesh= new THREE.Mesh(_Floor.GEOMETRY, selectedMaterial);
    this._3DModel.add(finalMesh);

    this.alreadyBuilt= true;
    return this._3DModel;
  }
}

export default _Maze;