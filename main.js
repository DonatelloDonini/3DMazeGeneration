import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import PackageManager from "./assets/js/PackageManager.js";
import Map from "./assets/js/Map.js";
import Debugger from "./assets/js/Debugger.js";
import _Maze from "./assets/js/Maze.js";

const rootNode= document.getElementById("mazeContainer");

const inspector= new Debugger(true, true, true);

//////                               //////
////// simulated environment updates //////
//////                               //////

const sampleUpdates= [
  {
    "id": 0,
    "floor": 0,
  },
  {
    "id": 1,
    "direction": 1,
    "positionUpdate": 1,
    "floor": 3,
    "walls": 0b0001
  },
  {
    "id": 2,
    "direction": 2,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b1101
  },
  {
    "id": 3,
    "direction": 0,
    "positionUpdate": 1,
  },
  {
    "id": 4,
    "direction": 1,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b0100
  },
  {
    "id": 5,
    "floor": 0,
    "positionUpdate": 1,
    "walls": 0b1001,
    "victim": 0
  },
  {
    "id": 6,
    "direction": 2,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b001
  },
  {
    "id": 7,
    "direction": 3,
    "positionUpdate": 1,
    "floor": 1,
    "walls": 0b1100
  },
  {
    "id": 8,
    "positionUpdate": -1
  },
  {
    "id": 9,
    "direction": 2,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b1000
  },
  {
    "id": 10,
    "direction": 3,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b1001
  },
  {
    "id": 11,
    "direction": 1,
    "positionUpdate": 2,
    "floor": 0,
    "walls": 0b0100
  },
  {
    "id": 12,
    "positionUpdate": 1,
    "floor": 3,
    "walls": 0b1101
  },
  {
    "id": 13,
    "direction": 3,
    "positionUpdate": 1,
  },
  {
    "id": 14,
    "direction": 0,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b0001
  },
  {
    "id": 15,
    "positionUpdate": 1,
    "floor": 1,
    "walls": 0b1101
  },
  {
    "id": 16,
    "positionUpdate": -1
  },
  {
    "id": 15+2,
    "direction": 1,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b1100
  },
  {
    "id": 16+2,
    "direction": 0,
    "positionUpdate": 1,
    "ramp": 25,
    "rampLength": 33.1013375688747
  },
  {
    "id": 17+2,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b1100,
  },
  {
    "id": 18+2,
    "direction": 3,
    "victim": 111
  },
  {
    "id": 19+2,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b0101,
  },
  {
    "id": 20+2,
    "positionUpdate": 1,
    "ramp": -25,
    "rampLength": 33.1013375688747
  },
  {
    "id": 21+2,
    "positionUpdate": 1,
    "floor": 2,
    "walls": 0b1100
  },
  {
    "id": 22+2,
  },
  {
    "id": 23+2,
  },
  {
    "id": 24+2,
  },
  {
    "id": 25+2,
  },
  {
    "id": 26+2,
  },
  {
    "id": 27+2,
  },
  {
    "id": 28+2,
  },
  {
    "id": 29+2,
  },
  {
    "id": 30+2,
  },
  {
    "id": 31+2,
  },
  {
    "id": 32+2,
  },
  {
    "id": 33+2,
  },
  {
    "id": 34+2,
  },
  {
    "id": 35+2,
  },
  {
    "id": 36+2,
  },
  {
    "id": 37+2,
  },
  {
    "id": 38+2,
  },
  {
    "id": 39+2,
  },
  {
    "id": 40+2,
  },
  {
    "id": 41+2,
  },
  {
    "id": 42+2,
  },
  {
    "id": 43+2,
  },
  {
    "id": 44+2,
  },
  {
    "id": 45+2,
  },
  {
    "id": 46+2,
  },
  {
    "id": 47+2,
  },
  {
    "id": 48+2,
  },
  {
    "id": 49+2,
  },
  {
    "id": 50+2,
  },
  {
    "id": 51+2,
  },
  {
    "id": 52+2,
  },
  {
    "id": 53+2,
  },
  {
    "id": 54+2,
  },{
    "id": 55+2,
  },
  {
    "id": 56+2,
  },
  {
    "id": 57+2,
  },
  {
    "id": 58+2,
  },
  {
    "id": 59+2,
  },
  {
    "id": 60+2,
  },
  {
    "id": 61+2,
  },
  {
    "id": 62+2,
  },
  {
    "id": 63+2,
  },
  {
    "id": 64+2,
  },
  {
    "id": 65+2,
  },
  {
    "id": 66+2,
  },
  {
    "id": 67+2,
  },
  {
    "id": 68+2,
  },
  {
    "id": 69+2,
  },
  {
    "id": 70+2,
  },
  {
    "id": 71+2,
  },
  {
    "id": 72+2,
  },
  {
    "id": 73+2,
  },
  {
    "id": 74+2,
  },
  {
    "id": 75+2,
  },
  {
    "id": 76+2,
  },
  {
    "id": 77+2,
  },
  {
    "id": 78+2,
  },
  {
    "id": 79+2,
  },
  {
    "id": 80+2,
  },
  {
    "id": 81+2,
  },
  {
    "id": 82+2,
  },
  {
    "id": 83+2,
  },
  {
    "id": 84+2,
  },
  {
    "id": 85+2,
  },
  {
    "id": 86+2,
  },
  {
    "id": 87+2,
  },
  {
    "id": 88+2,
  },
  {
    "id": 89+2,
  },
  {"id": 90+2,
  },
  {
    "id": 91+2,
  },
  {
    "id": 92+2,
  },
  {
    "id": 93+2,
  },
  {
    "id": 94+2,
  },
  {
    "id": 95+2,
  },
  {
    "id": 96+2,
  },
  {
    "id": 97+2,
  },
  {
    "id": 98+2,
  },
  {
    "id": 99+2,
  },
];

async function main(){
  //////             //////
  ////// scene setup //////
  //////             //////

  const scene = new THREE.Scene();
  scene.background= new THREE.Color(0x7FB7BE);
  const camera = new THREE.PerspectiveCamera(10, rootNode.clientWidth / rootNode.clientHeight, 0.1, 1000);
  camera.position.set(1, 5, 5);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setSize(rootNode.clientWidth, rootNode.clientHeight);

  //////        //////
  ////// lights //////
  //////        //////

  const sun = new THREE.PointLight(0xffffff, 15);
  sun.position.set(2, 2, 2);

  // const pointLightHelper = new THREE.PointLightHelper(sun);
  // scene.add(pointLightHelper);

  const lightHolder = new THREE.Group();
  lightHolder.add(sun);

  scene.add(lightHolder)

  const minLightLevel = new THREE.AmbientLight(0x606060); // Color in hexadecimal
  scene.add(minLightLevel);
  

  //////                //////
  ////// controls setup //////
  //////                //////

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.LEFT,
    MIDDLE: THREE.MOUSE.MIDDLE,
    RIGHT: THREE.MOUSE.RIGHT
  };
  // controls.enablePan= false;

  //////                           //////
  ////// 3D environment generation //////
  //////                           //////

  var axisHelper = new THREE.AxesHelper(3); // 3 is the size of the axes
  scene.add(axisHelper);

  const packageManager= new PackageManager();

  await Map.initialize3DModel();
  const map= new Map(0, 0, 0);

  for (const update of sampleUpdates) {
    packageManager.checkPackage(update);
    map.update(update);
  }
  scene.add(map._3DModel);

  rootNode.appendChild(renderer.domElement);

  //////                //////
  ////// animation loop //////
  //////                //////

  const animate = () => {
    requestAnimationFrame(animate);
  
    lightHolder.quaternion.copy(camera.quaternion);
  
    renderer.render(scene, camera);
  };
  
  animate();

  //////          //////
  ////// refining //////
  //////          //////

  // make the renderer responsive
  window.addEventListener('resize', ()=> {
    const containerWidth = rootNode.clientWidth;
    const containerHeight = rootNode.clientHeight;
  
    // Update camera aspect ratio
    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
  
    // Update renderer size
    renderer.setSize(containerWidth, containerHeight);
  });
}

main();