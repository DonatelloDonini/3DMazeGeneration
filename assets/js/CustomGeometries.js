import { Degrees } from "./Measures";
import { BufferGeometry, BufferAttribute } from "three";

class Ramp extends BufferGeometry{
  constructor(baseWidth, thickness, rampLength, steepness= 0){
    super();
    this.baseWidth= baseWidth;
    this.thickness= thickness;
    this.rampLength= rampLength;
    this.steepness= steepness;

    const secondFaceY= Math.sin(new Degrees(steepness).toRadians()) * this.rampLength;
    this.baseHeight= Math.cos(new Degrees(steepness).toRadians()) * this.rampLength;
    const vertices= new Float32Array([
      // A 0, 0, 0,
      // B baseWidth, 0, 0,
      // C baseWidth, thickness, 0,
      // D 0, thickness, 0,5
      // E 0, secondFaceY, this.baseHeight,
      // F baseWidth, secondFaceY, this.baseHeight,
      // G baseWidth, secondFaceY+thickness, this.baseHeight,
      // H 0, secondFaceY+thickness, this.baseHeight
      
      // bottom face
      0, 0, 0,
      this.baseWidth, 0, 0,
      this.baseWidth, secondFaceY, this.baseHeight,
      
      this.baseWidth, secondFaceY, this.baseHeight,
      0, 0, 0,
      0, secondFaceY, this.baseHeight,
      
      // left face
      0, secondFaceY, this.baseHeight,
      0, 0, 0,
      0, this.thickness, 0,
      
      0, this.thickness, 0,
      0, secondFaceY, this.baseHeight,
      0, secondFaceY+this.thickness, this.baseHeight,
      
      // front face
      0, secondFaceY+this.thickness, this.baseHeight,
      0, secondFaceY, this.baseHeight,
      this.baseWidth, secondFaceY, this.baseHeight,
      
      this.baseWidth, secondFaceY, this.baseHeight,
      0, secondFaceY+this.thickness, this.baseHeight,
      this.baseWidth, secondFaceY+this.thickness, this.baseHeight,
      
      // right face
      this.baseWidth, secondFaceY+this.thickness, this.baseHeight,
      this.baseWidth, secondFaceY, this.baseHeight,
      this.baseWidth, 0, 0,
      
      this.baseWidth, 0, 0,
      this.baseWidth, secondFaceY+this.thickness, this.baseHeight,
      this.baseWidth, this.thickness, 0,
      
      // rear face
      this.baseWidth, this.thickness, 0,
      this.baseWidth, 0, 0,
      0, 0, 0,
      
      0, 0, 0,
      this.baseWidth, this.thickness, 0,
      0, this.thickness, 0,
      
      // top face
      0, this.thickness, 0,
      this.baseWidth, this.thickness, 0,
      this.baseWidth, secondFaceY+this.thickness, this.baseHeight,
      
      this.baseWidth, secondFaceY+this.thickness, this.baseHeight,
      0, this.thickness, 0,
      0, secondFaceY+this.thickness, this.baseHeight
    ]);

    this.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );
    this.computeVertexNormals();
    this.center();
  }
}

export {
  Ramp
};