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
    "id": 17,
    "direction": 1,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b1100
  },
  {
    "id": 18,
    "direction": 0,
    "positionUpdate": 1,
    "ramp": 25,
    "rampLength": 33.1013375688747
  },
  {
    "id": 19,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b1100,
  },
  {
    "id": 20,
    "direction": 3,
    "victim": 111
  },
  {
    "id": 21,
    "positionUpdate": 1,
    "floor": 0,
    "walls": 0b0101,
  },
  {
    "id": 22,
    "positionUpdate": 1,
    "ramp": -25,
    "rampLength": 33.1013375688747
  },
  {
    "id": 23,
    "positionUpdate": 1,
    "floor": 2,
    "walls": 0b1100
  }
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