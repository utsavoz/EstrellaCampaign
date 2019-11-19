console.clear();


/* Start Here ---- This Part is for Ocean current */

// Init Context
let c = document.createElement('canvas').getContext('2d');
let ocean = document.querySelector("#ocean");
let postctx = ocean.getContext("2d");
let canvas = c.canvas
let vertices = []

// Effect Properties
let vertexCount = 7000
let vertexSize = 3
let oceanWidth = 204
let oceanHeight = -80
let gridSize = 32;
let waveSize = 16;
let perspective = 100;

//Obj
// let loader = new THREE.OBJLoader();

// Common variables
let depth = (vertexCount / oceanWidth * gridSize)
let frame = 0
let { sin, cos, tan, PI } = Math

// Render loop
let loop = () => {
    let rad = sin(frame / 100) * PI / 20
    let rad2 = sin(frame / 50) * PI / 10
    frame++
    if (postctx.canvas.width !== postctx.canvas.offsetWidth || postctx.canvas.height !== postctx.canvas.offsetHeight) {
        postctx.canvas.width = canvas.width = postctx.canvas.offsetWidth
        postctx.canvas.height = canvas.height = postctx.canvas.offsetHeight
    }


    c.fillStyle = `hsl(218deg, 70%, 5%)`
    c.fillRect(0, 0, canvas.width, canvas.height)
    c.save()
    c.translate(canvas.width / 2, canvas.height / 2.5)

    c.beginPath()
    vertices.forEach((vertex, i) => {
        let ni = i + oceanWidth
        let x = vertex[0] - frame % (gridSize * 2)
        let z = vertex[2] - frame * 2 % gridSize + (i % 2 === 0 ? gridSize / 2 : 0)
        let wave = (cos(frame / 45 + x / 50) - sin(frame / 20 + z / 50) + sin(frame / 30 + z * x / 10000))
        let y = vertex[1] + wave * waveSize
        let a = Math.max(0, 1 - (Math.sqrt(x ** 2 + z ** 2)) / depth)
        let tx, ty, tz

        y -= oceanHeight

        // Transformation variables
        tx = x
        ty = y
        tz = z

        // Rotation Y
        tx = x * cos(rad) + z * sin(rad)
        tz = -x * sin(rad) + z * cos(rad)

        x = tx
        y = ty
        z = tz

        // Rotation Z
        tx = x * cos(rad) - y * sin(rad)
        ty = x * sin(rad) + y * cos(rad)

        x = tx;
        y = ty;
        z = tz;

        // Rotation X

        ty = y * cos(rad2) - z * sin(rad2)
        tz = y * sin(rad2) + z * cos(rad2)

        x = tx;
        y = ty;
        z = tz;

        x /= z / perspective
        y /= z / perspective



        if (a < 0.01) return
        if (z < 0) return


        c.globalAlpha = a
        c.fillStyle = `hsl(${200 + wave * 20}deg, 100%, 50%)`
            //c.fillStyle = "hsl(" + (j * 0.6 + color) + ", 100%, 50%)"
        c.fillRect(x - a * vertexSize / 2, y - a * vertexSize / 2, a * vertexSize, a * vertexSize)
        c.globalAlpha = 1
    })
    c.restore()

    // Post-processing
    postctx.drawImage(canvas, 0, 0)

    postctx.globalCompositeOperation = "screen"
    postctx.filter = 'blur(0px)'
    postctx.drawImage(canvas, 0, 0)
    postctx.filter = 'blur(0)'
    postctx.globalCompositeOperation = "source-over"

    requestAnimationFrame(loop)
}

// Generating dots
for (let i = 0; i < vertexCount; i++) {
    let x = i % oceanWidth
    let y = 0
    let z = i / oceanWidth >> 0
    let offset = oceanWidth / 2
    vertices.push([(-offset + x) * gridSize, y * gridSize, z * gridSize])
}

loop();

/* End Here ---- This Part is for Ocean current */



/* Start Here ---- This Part is for Audio Wave */

let renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#wave"),
    antialias: true,
    alpha: true
});
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    1,
    1000
);
camera.position.z = 40;
camera.lookAt(0, 0, 0);
let length = 40;
let mouseJump = {
    x: 0,
    y: 0
};

const ambientLight = new THREE.AmbientLight(0x000000);
scene.add(ambientLight);

let offset = 0;
let audioContext;
let analyser;
let distortion;
let gainNode;
let buffer;
let dataArray;
let loaded = false;
let songPlaying = false;

window.addEventListener("click", onClick);

function onClick() {

    if (!songPlaying) {
        audioContext = new(window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        distortion = audioContext.createWaveShaper();
        gainNode = audioContext.createGain();
        loadSong("./whale.wav");
        songPlaying = true;
    }

}

function loadSong(url) {
    console.log("load songs");
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function() {
        audioContext.decodeAudioData(request.response, function(buffer) {
            audioBuffer = buffer;
            playAudio(buffer);
        }, function(error) {
            console.error(error);
        });
    };
    request.send();
}

function playAudio(buffer) {
    console.log("play audio");
    source = audioContext.createBufferSource();
    source.buffer = buffer;
    analyser.fftSize = 256;

    source.connect(analyser);
    //source.connect(distortion);
    //distortion.connect(biquadFilter);
    //biquadFilter.connect(gainNode);
    //convolver.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);

    bufferLength = analyser.frequencyBinCount;
    console.log(bufferLength);
    // randomizePostions();
    dataArray = new Uint8Array(bufferLength);
    source.start();

    console.log(source);
    loaded = true;
}


function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ocean.width = window.innerWidth;
    ocean.height = window.innerHeight;
}


function Spline() {
    this.geometry = new THREE.Geometry();
    this.color = Math.floor(Math.random() * 80 + 180);
    for (let j = 0; j < 100; j++) { //Change the curves
        this.geometry.vertices.push(
            new THREE.Vector3(j / 100 * length * 2 - length, 0, 0)
        );
        this.geometry.colors[j] = new THREE.Color(
            "hsl(" + (j * 0.6 + this.color) + ",70%,70%)"


        );
    }
    this.material = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors
    });
    this.mesh = new THREE.Line(this.geometry, this.material);
    this.mesh.position.y = -17;
    this.speed = 0.0000000000007;
    //this.speed = 6;
    scene.add(this.mesh);
}
let isMouseDown = false;
let prevA = 0;

function render(a) {
    requestAnimationFrame(render);
    for (let i = 0; i < splines.length; i++) {
        for (let j = 0; j < splines[i].geometry.vertices.length; j++) {
            let vector = splines[i].geometry.vertices[j];
            vector.y =
                noise.simplex2(j * 0.05 + i - offset, a * splines[i].speed) * 2;
            vector.z = noise.simplex2(vector.x * 0.05 + i, a * splines[i].speed) * 2;

            vector.y *= 1 - Math.abs(vector.x / length);
            vector.z *= 1 - Math.abs(vector.x / length);
        }

        splines[i].geometry.verticesNeedUpdate = true;
    }
    //scene.rotation.x = a * 0.0003;
    if (loaded) {
        analyser.getByteFrequencyData(dataArray);
        //console.log(dataArray[1]);
        mouseJump.x += dataArray[1];
        if (dataArray[1] === 0) {
            splines.map((spline) => { spline.geometry.verticesNeedUpdate = false });
        }
        if (a - prevA > 100) {
            updateColor();
            prevA = a;
        }
    } else {
        mouseJump.x -= 0.001;
    }
    mouseJump.x = Math.max(0, Math.min(0.02, mouseJump.x));
    offset += mouseJump.x;
    renderer.render(scene, camera);
}
let splines = [];
for (let i = 0; i < 8; i++) splines.push(new Spline());

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateColor() {
    for (let i = 0; i < splines.length; i++) {
        let color = Math.abs((splines[i].color - offset * 10) % 360);
        for (let j = 0; j < splines[i].geometry.vertices.length; j++) {
            splines[i].mesh.geometry.colors[j] = new THREE.Color(
                "hsl(" + (j * 0.6 + color) + ",70%,70%)"
            );
        }
        splines[i].mesh.geometry.colorsNeedUpdate = true;
    }
}

function onMouseDown(e) {
    isMouseDown = true;
    return false;
}

function onMouseUp() {
    isMouseDown = false;
}
window.addEventListener("resize", onResize);
//window.addEventListener("keydown", onMouseDown);
document.body.addEventListener("mousedown", onMouseDown);
document.body.addEventListener("mouseup", onMouseUp);
document.body.addEventListener("touchstart", onMouseDown);
document.body.addEventListener("touchend", onMouseUp);
requestAnimationFrame(render);

/* End Here ---- This Part is for Audio Wave */

/* Start Here ---- This Part is for 3D Model*/
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
directionalLight.position.z = 800;
scene.add(directionalLight);


const mtlLoader = new THREE.MTLLoader();
mtlLoader.setPath('');
var url = "./model/untitled-scene.mtl";
mtlLoader.load(url, function(materials) {
    materials.preload();

    const loader = new THREE.OBJLoader();
    loader.setMaterials(materials);

    loader.load(

        "./model/untitled-scene.obj",

        function(obj) {
            obj.scale.set(0.06, 0.06, 0.06);
            obj.position.set(-6, 3.5, 5)
            obj.rotation.set(0, 0.6, 0.3)
            console.log(obj)
            scene.add(obj);


            TweenMax.to(obj.rotation, 1, { x: -0.1, yoyo: true, repeat: -1, ease: Sine.easeInOut });
            TweenMax.to(obj.position, 1.5, { y: 1, yoyo: true, repeat: -1, ease: Sine.easeInOut });
            TweenMax.to(obj.scale, 3, { z: 0.055, yoyo: true, repeat: -1, ease: Sine.easeInOut });

            // TweenMax.from(obj.rotation, 2, { x: 0.1, repeat: -1, ease: Sine.easeOut });
        },

        function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },

        function(err) {
            console.error('An error happened');
        }
    );

});



/* End Here ---- This Part is for 3D Model*/