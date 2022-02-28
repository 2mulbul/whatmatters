import * as THREE from "../three.lib/three.module.js";
import { OrbitControls } from "../three.lib/OrbitControls.js";



class App { 
	constructor() {
		const divContainer = document.querySelector('#webgl-container');
		this._divContainer = divContainer;

		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		divContainer.appendChild(renderer.domElement);
		this._renderer = renderer;

		const scene = new THREE.Scene();
		this._scene = scene;

		this._setupCamera();
		this._setupLight();
		this._setupModel();
		this._setupControls();

		window.onresize = this.resize.bind(this);
		this.resize();

		requestAnimationFrame(this.render.bind(this));
	}
	_setupControls() {
		new OrbitControls(this._camera, this._divContainer);
	}
	_setupCamera() {
		const width = this._divContainer.clientWidth;
		const height = this._divContainer.clientHeight;
		const camera = new THREE.PerspectiveCamera(
			75,
			width / height,
			0.1,
			100
		);
		camera.position.z = 1.5;
		
		this._camera = camera;
	}
	_setupLight() {
		const color = 0xffffff;
		const intensity = 1;
		const directionalLight = new THREE.DirectionalLight(color, intensity);
		directionalLight.position.set(-1, 1.5, 4);

		const ambientLight = new THREE.AmbientLight(0x404040,2);
		

		this._scene.add(directionalLight);
		this._scene.add(ambientLight);

	}
	_setupModel() {
		const loader = new THREE.TextureLoader();
		const geometry = new THREE.BoxGeometry(0.7, 1, 0.12);
		const urls = [
			"../books/완전한행복/white.jpg",
			"../books/완전한행복/spine.jpg",
			"../books/완전한행복/white.jpg",
			"../books/완전한행복/white.jpg",
			"../books/완전한행복/front.jpg",
			"../books/완전한행복/back.jpg"
		]
		const materials = urls.map(url => new THREE.MeshLambertMaterial({map: loader.load(url)}) )

		const cube = new THREE.Mesh(geometry, materials);

		this._scene.add(cube);
		this._cube = cube;

		this._cube.rotation.y = 0.4;
	}
	

	resize() {
		const width = this._divContainer.clientWidth;
		const height = this._divContainer.clientHeight;

		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();

		this._renderer.setSize(width, height);
	}
	render(time) {
		this._renderer.render(this._scene, this._camera);
		this.update(time);
		requestAnimationFrame(this.render.bind(this));
	}
	update(time) {
		time *= 0.001;

		//this._cube.rotation.y = time * 0.2;
		//this._cube.rotation.z = time * 0.1;

	}
}

window.onload = function() {
	new App();
}

