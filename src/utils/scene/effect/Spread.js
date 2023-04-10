//扩散特效
import * as THREE from 'three';

let texture = new THREE.TextureLoader().load("./assets/images/opacityWall.png")
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; //每个都重复
  texture.repeat.set(1, 1)
  texture.needsUpdate = true;
let mesh = null;
let scale = 0;// 放大倍数
let opacity = 1;//透明度

export const createSpreda = ()=>{
	let geometry = new THREE.CylinderGeometry(4, 4, 1, 64);
	let materials = [
		new THREE.MeshBasicMaterial({
		  map: texture,
		  side: THREE.DoubleSide,
		  transparent: true
		}),
		new THREE.MeshBasicMaterial({
		  transparent: true,
		  opacity: 0,
		  side: THREE.DoubleSide
		}),
		new THREE.MeshBasicMaterial({
		  transparent: true,
		  opacity: 0,
		  side: THREE.DoubleSide
		})];
	mesh = new THREE.Mesh(geometry, materials)
	return mesh;
}

export const renderSpread = () => {
	scale += 0.01;
	opacity -= 0.005;
	if(scale > 2){
		scale = 0;
		opacity = 1;
	}
	mesh.scale.set(1+scale,1,1+scale);
	mesh.material[0].opacity = opacity;
}