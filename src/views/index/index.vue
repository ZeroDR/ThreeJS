<template>
  <div id="labelInfo" ref="threeRef" class="label-info">
  </div>
</template>

<script lang="ts" setup>
import {
  ref,
  reactive,
  onMounted,
  onUnmounted,
} from 'vue'
import { formatTime } from '@/utils/index'
import { WEEK } from '@/constant/index'
import useDraw from '@/utils/useDraw'

import SceneView from '@/utils/scene/SceneView.js'

import * as THREE from 'three'

import {OrbitControls} from '@/utils/scene/OrbitControls.js'
import {getQuadraticBezierPoints,getCurvePoints} from '@/utils/scene/tools/UtilsTools.js'

import {creatWallByPath,createOpacityWallMat,createFlowWallMat,creatWallByGeojson,creatWallByGeojsonLatlng,createExtrudeByGeoJson} from '@/utils/scene/effect/WallByPath.js'
import {creartStarPoints,renderStar} from '@/utils/scene/effect/StarEffect.js'
import {createSpreda,renderSpread} from '@/utils/scene/effect/Spread.js'

import {timerFlyCurve,createFlyCurve} from '@/utils/scene/effect/FlyCurve.js'

import {Water} from '@/utils/scene/water/Water.js'
import {Sky} from '@/utils/scene/water/Sky.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

import {glowUtil} from '@/utils/scene/effect/createGlow.js'

let centerXY = [113.59893798828125, 34.648846130371094];
let curvePoints = getCurvePoints(0,0,10);


const threeRef=ref();
const scene=new THREE.Scene();
const renderer=new THREE.WebGLRenderer({antialias:true});
const camera=new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight);
let wallMesh,wallMat,water,sun;
let clock = new THREE.Clock();

let city = undefined;

// 创建辉光变量
let composer = null;
let outlinePass = null;
let bloomLayer = null;
let bloomComposer = null;
let darkMaterial = null;
let hgMaterials = {}
let bloomIgnore = [];

// 创建辉光图层
const createGlowPass = () => {
  bloomLayer = glowUtil.createLayer(1);
  // 辉光层默认样式
  darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' })// 跟辉光光晕有关的变量
  createSawtooth();// 抗锯齿
}

// 抗锯齿，添加辉光层效果
const createSawtooth = () => {
  var renderPass = new RenderPass(scene, camera)
  // 抗锯齿设置
  var effectFXAA = new ShaderPass(scene, camera)
  const bloomPass = glowUtil.createUnrealBloomPass()
  bloomComposer = new EffectComposer(renderer)
  bloomComposer.renderToScreen = false // 不渲染到屏幕上
  bloomComposer.addPass(renderPass)
  bloomComposer.addPass(bloomPass)// 添加光晕效果
  // bloomComposer.addPass(effectFXAA)// 去掉锯齿

  // 创建自定义的着色器Pass，详细见下
  const shaderPass = glowUtil.createShaderPass(bloomComposer)
  composer = new EffectComposer(renderer)
  composer.addPass(renderPass)

  outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera)
  outlinePass.edgeStrength = 5 // 包围线浓度
  outlinePass.edgeGlow = 0.5 // 边缘线范围
  outlinePass.edgeThickness = 2// 边缘线浓度
  outlinePass.pulsePeriod = 2// 包围线闪烁评率
  outlinePass.visibleEdgeColor.set('#ffffff') // 包围线颜色
  outlinePass.hiddenEdgeColor.set('#190a05')// 被遮挡的边界线颜色
  composer.addPass(outlinePass)
  composer.addPass(shaderPass)
  //composer.addPass(effectFXAA)
}
  
// 隐藏不需要辉光的物体
const darkenNonBloomed = (obj) => {
  if (obj instanceof THREE.Scene) { // 此处忽略Scene，否则场景背景会被影响
    hgMaterials.scene = obj.background
    obj.background = null
    return;
  }
  if (
    obj instanceof THREE.Sprite || // 此处忽略Sprite
    bloomIgnore.includes(obj.type) || obj instanceof THREE.Line ||
    (obj.isMesh && bloomLayer.test(obj.layers) === false) // 判断与辉光是否同层
  ) {
    hgMaterials[obj.uuid] = obj.material
    obj.material = darkMaterial
  }
}

// 还原非辉光体
const restoreMaterial = (obj) => {
  if (obj instanceof THREE.Scene) {
    obj.background = hgMaterials.scene
    delete hgMaterials.scene
    return;
  }
  if (hgMaterials[obj.uuid]) {
    obj.material = hgMaterials[obj.uuid]
    delete hgMaterials[obj.uuid]
  }
}

const loadScene = () => {
  // 坐标辅助
  const axes=new THREE.AxesHelper(20);
  scene.add(axes);

  renderer.setClearColor(new THREE.Color(0x000000))
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  let gridHelper = new THREE.GridHelper( 100, 100, 0x2C2C2C, 0x888888 );
  // gridHelper.position.y = -1;
  scene.add(gridHelper);

  // 环境光
  const light = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(light);

  let bgeometry = new THREE.BoxGeometry(0.2,10,0.2);
  let bmaterial  = new THREE.MeshPhongMaterial({ 
      color: 0xff5500,
      side:0
  });
  let bmesh = new THREE.Mesh(bgeometry,bmaterial);
  bmesh.castShadow = true
  bmesh.receiveShadow = true
  bmesh.position.y = 10;
  bmesh.layers.enable(1);
  scene.add(bmesh)

  // const planeGeometry=new THREE.PlaneGeometry(300,200);
  // const planeBasicMaterial=new THREE.MeshBasicMaterial({
  //   color:0xcccccc,
  //   side: THREE.DoubleSide,
  // });
  // const plane=new THREE.Mesh(planeGeometry,planeBasicMaterial)
  // plane.rotation.x=-0.5*Math.PI
  // plane.position.x=30;
  // plane.position.y=0;
  // plane.position.z=0;
  // scene.add(plane);

  // // 给场景添加背景
  // let textureBg = new THREE.TextureLoader();
  // textureBg.load('./assets/images/bg.jpg',(texture) => {
  //   scene.background = texture;
  // });

  // // 创建墙
  // // 规划路径
  // const path = [
  //   [80, 0, -40],
  //   [10, 0, 0],
  //   [60, 0, 50],
  //   [0, 10, 0],
  //   [-60, 0, 50],
  //   [-50, 0, -30],
  //   [80, 0, -40],
  // ];
  // // const wallMesh = creatWallByPath({ path });
  // // const material = createOpacityWallMat({ height: 15, speed: 5 });
  // wallMat = createFlowWallMat({});
  // wallMesh = creatWallByPath({
  //   path,
  //   material:wallMat,
  //   height: 15,
  // });

  // scene.add(wallMesh);
  // // scene.add(wallLine);

  // // // 创建星空
  // // points = creartStarPoints();
  // // scene.add(points);

  // // 创建扩散效果
  // const spreadEffect = createSpreda();
  // spreadEffect.position.set(0,10,0);
  // spreadEffect.layers.enable(1);
  // scene.add(spreadEffect);

  // 创建曲线
  let v1 = new THREE.Vector3(0,0,0);
  let v2 = new THREE.Vector3(3,3,0);
  let v3 = new THREE.Vector3(6,0,0);
  const pts = getQuadraticBezierPoints(v1,v2,v3);
  let curveLine = createFlyCurve(pts,false);
  scene.add(curveLine);

  let lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setFromPoints(pts);
  let lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
  });
  let lineMesh = new THREE.Line(lineGeometry,lineMaterial);
  scene.add(lineMesh);

  // 加载json文件
  let loader = new THREE.FileLoader();
  loader.load('./data/410000.json', function (data) {
    let jsonData = JSON.parse(data);
    // city = creatWallByGeojsonLatlng(jsonData);
    const city = creatWallByGeojson(90,jsonData,1);
    // city.layers.enable(1);
    // city && (scene.add(city));  //,camera.lookAt(city)
    // console.log(city);
  });

  loader.load('./data/410000_0.json', function (data) {
    let jsonData = JSON.parse(data);
    const cityModel = createExtrudeByGeoJson(jsonData);
    // cityModel.layers.enable(1);
    // cityModel && (scene.add(cityModel));
  });

  // // 加载水效果
  sun = new THREE.Vector3();
  // const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
  // water = new Water(
  //   waterGeometry,
  //   {
  //     textureWidth: 512,
  //     textureHeight: 512,
  //     waterNormals: new THREE.TextureLoader().load('./assets/images/waternormals.jpg', function (texture) {
  //       texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  //     }),
  //     sunDirection: new THREE.Vector3(),
  //     sunColor: 0xffffff,
  //     waterColor: 0x001e0f,
  //     distortionScale: 3.7,
  //     fog: scene.fog !== undefined
  //   }
  // );
  // water.rotation.x = - Math.PI / 2;
  // scene.add(water);

  // const sky = new Sky();
  // sky.scale.setScalar( 10000 );
  // scene.add(sky);
  // const skyUniforms = sky.material.uniforms;
  // skyUniforms['turbidity'].value = 10;
  // skyUniforms['rayleigh'].value = 2;
  // skyUniforms['mieCoefficient'].value = 0.005;
  // skyUniforms['mieDirectionalG'].value = 0.8;

  // const parameters = {
  //   elevation: 1,
  //   azimuth: 180
  // };

  // const pmremGenerator = new THREE.PMREMGenerator( renderer );
  // let renderTarget;

  // function updateSun() {
  //   const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
  //   const theta = THREE.MathUtils.degToRad( parameters.azimuth );

  //   sun.setFromSphericalCoords(1, phi, theta );

  //   sky.material.uniforms['sunPosition'].value.copy(sun);
  //   water.material.uniforms['sunDirection'].value.copy(sun).normalize();

  //   if ( renderTarget !== undefined ) renderTarget.dispose();

  //   renderTarget = pmremGenerator.fromScene(sky);

  //   scene.environment = renderTarget.texture;
  // }

  // updateSun();

  createGlowPass();

  camera.position.x=centerXY[0];
  camera.position.y=centerXY[1];
  camera.position.z=10;
  // camera.lookAt(...centerXY,80)
  threeRef.value.appendChild(renderer.domElement)
  renderer.render(scene,camera);

  const controls = new OrbitControls(camera,renderer.domElement);
  // controls.maxPolarAngle = Math.PI * 0.495;
  // controls.target.set( 0, 10, 0 );
  // controls.minDistance = 40.0;
  // controls.maxDistance = 500.0;
  //监听鼠标事件，触发渲染函数，更新canvas画布渲染效果
  // controls.addEventListener('change', render);

  render();
}

let index = 0;

const render = () => {
  scene.traverse(darkenNonBloomed) // 隐藏不需要辉光的物体
  bloomComposer.render()
  scene.traverse(restoreMaterial) // 还原
  index === curvePoints.length-1 && (index = 0)
  index++;
  // camera.position.set(curvePoints[index].x,10,curvePoints[index].y);

  renderer.render(scene, camera); //执行渲染操作
  // renderStar();// 星空效果
  // 透明墙效果
  // wallMesh.material.uniforms.time.value += clock.getDelta() * wallMesh.material.uniforms.speed.value;
  // // 流动墙效果
  // wallMat.uniforms.time.value += 0.01;

  // if(camera.position.z < 230){
  //   camera.position.z += 0.1;
  // }
  // if(city){
  //   let childs = city.children;
  //   childs.length && childs.forEach((mesh,index)=>{
  //     mesh.material.uniforms.time.value += 0.0005*index;
  //   })
  //   city.rotation.z += 0.01;
  // }

  // // 扩散效果
  // renderSpread();

  // 水面效果
  // water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
  requestAnimationFrame(render);

  if (composer) {
    composer.render();
  }
}

onMounted(() => {
  // const scene = new SceneView();
  // scene.init('labelInfo');
  // scene.setBackGroundImage('./assets/images/bg.jpg');
  loadScene();
})


</script>

<style lang="scss" scoped>
@import '@/assets/scss/index.scss';
.label-info{
  position:absolute;
  visibility: visible;
  color: rgb(255, 255, 255);
  z-index: 1;
}
</style>
