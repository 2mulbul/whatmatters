import * as THREE from "../three.lib/three.module.js";
import { OrbitControls } from "../three.lib/OrbitControls.js";
import { GLTFLoader } from "../three.lib/GLTFLoader.js";


var explorerX = 0;
var explorerY = 0;

var exploring = false;

class App { 
	constructor() {
		const divContainer = document.querySelector('#webgl-container');
		const width = divContainer.clientWidth;
		const height = divContainer.clientHeight;
		const halfX = width / 2;
		const halfY = height / 2;
		this._divContainer = divContainer;

		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setPixelRatio(window.devicePixelRatio);
		divContainer.appendChild(renderer.domElement);
		this._renderer = renderer;

		const scene = new THREE.Scene();
		scene.background = new THREE.Color("#ffffff");

		this._scene = scene;
		

		this._setupCamera();
		this._setupLight();
		this._setupModel();
		//this._setupControls();
		this._setupPicking();

		//터치 이벤트
		this._divContainer.addEventListener("touchstart", this._handleStart.bind(this), {passive: false});
		this._divContainer.addEventListener("touchend", this._handleEnd.bind(this), {passive: false});
		this._divContainer.addEventListener("touchmove", this._handleMove.bind(this), {passive: false});
		//윈도우 리사이즈 이벤트
		window.onresize = this.resize.bind(this);
		this.resize();

		requestAnimationFrame(this.render.bind(this));
	}

	_setupCamera() {
		const width = this._divContainer.clientWidth;
		const height = this._divContainer.clientHeight;

		const camera = new THREE.PerspectiveCamera(
			45,
			width / height,
			1,
			2000
		);
		camera.position.set(0, 0, 450);
		//camera.lookAt(new THREE.Vector3(0, 0, 0));

		this._camera = camera;
		this._scene.add(this._camera);
	}
	_setupLight() {
		const ambientLight = new THREE.AmbientLight(0xBAC6E1, 0.2);
		const hemiLight = new THREE.HemisphereLight("#F2E7DC", "#146551", 1);
		this._camera.add(hemiLight);
		this._scene.add(ambientLight);

	}
	_setupModel() {
		var visibleObject = [];
		var invisibleObjects = [];

		//책 book
		const loader = new THREE.TextureLoader();
		//const geometry = new THREE.BoxGeometry(3.5, 5, 0.6);
		const geometry = new THREE.BoxGeometry(110, 152, 20);

		const urls = [
			"../books/완전한행복/white.jpg",
			"../books/완전한행복/spine.jpg",
			"../books/완전한행복/whiteTopBottom.jpg",
			"../books/완전한행복/whiteTopBottom.jpg",
			"../books/완전한행복/front.jpg",
			"../books/완전한행복/back.jpg"
		]
		const materials = urls.map(url => new THREE.MeshLambertMaterial({map: loader.load(url)}) )
		const book = new THREE.Mesh(geometry, materials);
		book.name = "book"
		book.castShadow = true;
		book.receiveShadow = true;
		this._book = book;
		this._scene.add(book);

		visibleObject.push(book);

		const gltfLoader = new GLTFLoader();
		const iphoneUrl = '../comparisonObjects/scene.gltf'
		gltfLoader.load(
			iphoneUrl,
			(gltf) => {
				const obj3d = gltf.scene;
				obj3d.rotation.y = Math.PI;
				const iphoneScale = 105;
				obj3d.scale.set(iphoneScale, iphoneScale, iphoneScale);
				obj3d.name = "iphone";
				
				invisibleObjects.push(obj3d);
			}, function (xhr) {
				// 모델이 로드되는 동안 호출되는 함수
				console.log('OBJLoader: ', xhr.loaded / xhr.total * 100, '% loaded');
			}, function (error) {
				// 모델 로드가 실패했을 때 호출하는 함수
				alert('모델을 로드 중 오류가 발생하였습니다.');
			}
		)

		this._visibleObject = visibleObject;
		this._invisibleObjects = invisibleObjects;
	}
	_zoomFit(object3D, camera) {
		//모델을 화면에 꽉채우기 위한 적당한 거리 구하기
		const box = new THREE.Box3().setFromObject(object3D);
		const sizeBox = box.getSize(new THREE.Vector3()).length();
		const centerBox = box.getCenter(new THREE.Vector3());
		const halfSizeModel = sizeBox * 0.5;
		const halfFov = THREE.Math.degToRad(camera.fov * .5);
		const distance = halfSizeModel / Math.tan(halfFov);
		//모델 중심에서 카메라 위치로 향하는 방향 단위 벡터 계산
		const direction = (new THREE.Vector3()).subVectors(
			camera.position, centerBox).normalize();
		//카메라 위치 = 단위 벡터 방향으로 모델 중심 위치에서 distance 거리에 대한 위치
		const position = direction.multiplyScalar(distance).add(centerBox);
		camera.position.copy(position);
		
		camera.updateProjectionMatrix();
		camera.near = sizeBox / 100;
		camera.far = sizeBox * 100;
		camera.lookAt(centerBox.x, centerBox.y, centerBox.z);
		console.log("camera.position.z", camera.position.z);

	}
	_setupControls() {
		const controls = new OrbitControls(this._camera, this._divContainer);
		//controls.maxPolarAngle = Math.PI / 2;
		//controls.minPolarAngle = -Math.PI / 2;
		controls.enableDamping = true; 
		controls.dampingFactor = 0.01;

		controls.screenSpacePanning = false;

		controls.minDistance = 150;
		controls.maxDistance = 300;
	}
	_setupPicking() {
		const raycaster = new THREE.Raycaster();
		this._raycaster = raycaster;
	}

	_handleStart(e) {
		console.log("touchstart!");
		e.preventDefault();
		exploring = false;


	}
	_handleEnd(e) {
		console.log("touchend!");
		//touchmove동안은 책을 터치해도 이벤트가 일어나지 않도록 방지
		if (exploring) {
			return;
		}

		const width = this._divContainer.clientWidth;
		const height = this._divContainer.clientHeight;

		//터치 x,y(raycaster)
		const touchXY = {
			x: (e.changedTouches[0].clientX/width) * 2 -1,
			y: -(e.changedTouches[0].clientY / height) * 2 + 1
		}
		this._raycaster.setFromCamera(touchXY, this._camera);  
		
		
		console.log(this._visibleObject);
		console.log(this._invisibleObjects);


		const target = this._raycaster.intersectObjects(this._scene.children);
		if (target.length > 0) {
			//터치 시 반응 코드
			this._changeObj(this._visibleObject[0], this._invisibleObjects[0]);
			console.log(this._invisibleObjects);

			console.log("Touch Object SUCCESS!");
			return;
		}
	}
	_changeObj(visibleObj, invisibleObj) {
		this._scene.remove(visibleObj);
		this._scene.add(invisibleObj);
		
		this._visibleObject.shift();
		this._visibleObject.push(invisibleObj);
		console.log("Changed! visibleObject:", this._visibleObject[0].name);

		this._invisibleObjects.shift();
		this._invisibleObjects.push(visibleObj);
		console.log("Changed! invisibleObjects:", this._invisibleObjects[0].name);

	}
	_handleMove(e) {
		e.preventDefault();
		exploring = true;

		const width = this._divContainer.clientWidth;
		const height = this._divContainer.clientHeight;
		const halfX = width / 2;
		const halfY = height / 2;
		//커스텀 카메라 위치지정 용 변수
		explorerX = (e.changedTouches[0].clientX - halfX) / 2;
		explorerY = (e.changedTouches[0].clientY - halfY) / 2;
		console.log(this._camera.position.x);
		console.log(this._camera.position.y);
		console.log(this._camera.position.z);
		
		console.log("touchmove!");
	}

	resize() {
		const width = this._divContainer.clientWidth;
		const height = this._divContainer.clientHeight;
		const halfX = width / 2;
		const halfY = height / 2;

		this._camera.aspect = width / height;
		this._camera.updateProjectionMatrix();

		this._renderer.setSize(width, height);
	}
	render(time) {

		this.update(time);
		requestAnimationFrame(this.render.bind(this));
	}
	update(time) {
		time *= 0.0002;
		//커스텀 카메라 위치지정
		var minCameraLimit = -300;
		var maxCameraLimit = 300;

		this._camera.position.x += (explorerX- this._camera.position.x) * .05;
		this._camera.position.y += (-explorerY - this._camera.position.y) * .05;
		
		this._camera.position.x = Math.max( minCameraLimit, Math.min( maxCameraLimit, this._camera.position.x ) );
		this._camera.position.y = Math.max( minCameraLimit, Math.min( maxCameraLimit, this._camera.position.y ) );

		this._camera.lookAt(this._scene.position);

		//책 회전
		this._book.rotation.y = 0.3 + time;



		this._renderer.render(this._scene, this._camera);
		
	}
}

window.onload = function() {
	new App();
}
