import * as THREE from 'three';
// 创建无限星空
const total = 1000;
const height = 400;
const width = 500;
const depth = 1600;
let pointsLayer = null;
export const creartStarPoints = () => {
	const geometry = new THREE.BufferGeometry();
	let verticesByThree = [];
	for (let i = 0; i < total; i++) {
	  verticesByThree.push(x,y,z);
	}
	const vertices = new Float32Array(verticesByThree);
  	geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

	const material = new THREE.PointsMaterial({
	  size: 0.2,
	  color: 0x00ffff,
	  fog: true,
	});
	pointsLayer = new THREE.Points(geometry, material);
	return pointsLayer;
}

export const renderStar = () => {
	const positions = pointsLayer.geometry.attributes.position;
	for(let i = 0;i < positions.count;i++){
		const zValue = positions.getZ(i);
		if(zValue > 100){
			positions.setZ(i,-depth + 100);
		}else{
			positions.setZ(i,positions.getZ(i)+0.1);
		}
	}
	pointsLayer.geometry.attributes.position.needsUpdate = true;

}
