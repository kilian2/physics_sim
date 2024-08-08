//@ts-check
class DynamicObject {
    /**
     * 
     * @param {string} type 
     * @param {number} size 
     * @param {number} x
     * @param {number} y
     * @param {{x:number, y:number}} velocity
     * @param {number} mass  
     */
    constructor(type, size, x, y, velocity, mass){
        this.type = type;
        this.size = size;
        this.x = x;
        this.y = y;
        this.velocity = velocity;
        this.mass = mass;
    }
}

const {canvas, ctx, objectTypeSelect, bounceAtBordersCheckbox, objectTypeDisplayElement, objectPositionElement,
     objectSpeedInputElement, objectDirectionInputElement, newObjectSizeInputElement, newObjectMassInputElement,
     objectMassInputElement} = initPageElements();
const objects = [];

let running = false;
let currentMousePosition = {x: 0, y: 0};
let addingObject = false;
let previewObject = null;
let selectedObject = /**@type {DynamicObject | null} */ (null);

document.addEventListener('DOMContentLoaded', () => {
    addEventListeners();
    bounceAtBordersCheckbox.checked = false;
    setInputsDisabled(true);
    newObjectMassInputElement.value = getMassForNewObject().toFixed(2);
});

function initPageElements() {
    const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("canvas"));
    if(!canvas) {
        throw new Error('Element with id "canvas" not found');
    }
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("2D context not available");
    }

    const objectTypeSelect = /** @type {HTMLSelectElement} */ (document.getElementById("objectType"));
    if (!objectTypeSelect) {throw new Error ("Element not found")}

    const bounceAtBordersCheckbox = /** @type {HTMLInputElement} */ (document.getElementById('bounceAtBorders'));
    if (!bounceAtBordersCheckbox) {throw new Error ("Element not found")};

    const objectTypeDisplayElement = document.getElementById("objectTypeDisplay")
    if (!objectTypeDisplayElement) {throw new Error ("Element not found")};

    const objectPositionElement = document.getElementById("objectPosition");
    if(!objectPositionElement) {throw new Error ("Element not found")};

    const objectSpeedInputElement = /** @type {HTMLInputElement} */ (document.getElementById("objectSpeedInput"));
    if(!objectSpeedInputElement) {throw new Error ("Element not found")};

    const objectDirectionInputElement =  /** @type {HTMLInputElement} */ (document.getElementById("objectDirectionInput"));
    if(!objectDirectionInputElement) {throw new Error ("Element not found")};

    const newObjectSizeInputElement = /** @type {HTMLInputElement}*/ (document.getElementById("newObjectSizeInput"));
    if(!newObjectSizeInputElement) {throw new Error ("Element not found")};

    const newObjectMassInputElement = /** @type {HTMLInputElement}*/ (document.getElementById("newObjectMassInput"));
    if(!newObjectMassInputElement) {throw new Error ("Element not found")};

    const objectMassInputElement = /** @type {HTMLInputElement} */ (document.getElementById("objectMassInput"));
    if(!objectMassInputElement) {throw new Error ("Element not found")};

    return {
        canvas,
        ctx,
        objectTypeSelect,
        bounceAtBordersCheckbox,
        objectTypeDisplayElement,
        objectPositionElement,
        objectSpeedInputElement,
        objectDirectionInputElement,
        newObjectSizeInputElement,
        newObjectMassInputElement,
        objectMassInputElement
    }
}

function addEventListeners() {
    
    canvas.addEventListener('mousemove', (event) => {
        if (addingObject) {
            const rect = canvas.getBoundingClientRect();
            currentMousePosition.x = event.clientX - rect.left;
            currentMousePosition.y = event.clientY - rect.top;
        }
    });
    
    canvas.addEventListener('click', (event) => {
        if (addingObject) {
            const size =  parseFloat(newObjectSizeInputElement.value);
            const mass = parseFloat(newObjectMassInputElement.value);   
            objects.push(new DynamicObject(previewObject.type, size, currentMousePosition.x, currentMousePosition.y, {x: 0, y: 0}, mass));
            addingObject = false;
            previewObject = null;
        } else {
            selectObject(event);
        }
    });

    newObjectSizeInputElement.addEventListener('input', () => {
        const size = parseFloat(newObjectSizeInputElement.value);
        if (!isNaN(size) && size >= 0) {
            newObjectMassInputElement.value = (size*size).toFixed(2);
        }
    });

    objectTypeSelect.addEventListener('input', () => {
        newObjectMassInputElement.value = getMassForNewObject().toFixed(2);
    })
}

function startSimulation() {
    running = true;
    simulate();
    setInputsDisabled(true);
}

function stopSimulation() {
    running = false;
    setInputsDisabled(false);
}

function simulate() {
    if (!running) return;
    updateSimulation();
    displayObjectProperties();
    draw();
    requestAnimationFrame(simulate);
}

function startAddObject() {
    addingObject = true;
    previewObject = {type: objectTypeSelect.value, x:0 , y: 0 };
}

function getColorForType(type) {
    return type === 'sphere' ? 'blue' : 'red';
}

function getMassForNewObject() {
    const type = objectTypeSelect.value;
    const size = parseFloat(newObjectSizeInputElement.value);
    let mass = 0;
    if (type === "sphere") {
        mass = Math.PI * ((size / 2) ** 2);
    }
    else if (type === "square") {
        mass = size ** 2
    }
    return mass;
}

function selectObject(event) {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    selectedObject = objects.find(obj => {
        if (obj.type === 'sphere') {
            return Math.hypot(obj.x - clickX, obj.y - clickY) < 10;
        } else if (obj.type === 'square') {
            return clickX > obj.x - 10 && clickX < obj.x + 10 && clickY > obj.y -10 && clickY < obj.y + 10;
        }
    });
    if (selectedObject) {
        displayObjectProperties();
        if(!running) {
            setInputsDisabled(false);
        }
    }
}

function removeSelectedObject() {
    if (selectedObject) {
        const index = objects.indexOf(selectedObject);
        if (index > -1) {
            objects.splice(index, 1);
            selectedObject = null;
            clearObjectProperties();
        }
    }
}

function clearObjectProperties() {
    objectTypeDisplayElement.innerText = "";
    objectPositionElement.innerText = "";
    objectSpeedInputElement.value = "";
    objectDirectionInputElement.value = "";
    objectMassInputElement.value = "";
}

function updateProperties() {
    if (selectedObject) {
        const speed = parseFloat(objectSpeedInputElement.value);
        const direction = parseFloat(objectDirectionInputElement.value);
        const mass = parseFloat(objectMassInputElement.value);
        selectedObject.velocity = velocityFromSpeedAndDirection(speed, direction);
        selectedObject.mass = mass;
        displayObjectProperties();
    }
}

function displayObjectProperties() {
    if(selectedObject) {
        let direction = directionFromVelocity(selectedObject.velocity);
        let speed = speedFromVelocity(selectedObject.velocity);
        
        objectTypeDisplayElement.innerText = "Type: " + selectedObject.type;
        objectPositionElement.innerText = "Position: (" 
        + selectedObject.x.toFixed(2) + ", " + selectedObject.y.toFixed(2) + ")";
        objectSpeedInputElement.value = speed.toFixed(2);
        objectDirectionInputElement.value = direction.toFixed(2);
        objectMassInputElement.value = selectedObject.mass.toFixed(2);
    }
}

function setInputsDisabled(disabled) {
    objectSpeedInputElement.disabled = disabled;
    objectDirectionInputElement.disabled = disabled;
    objectMassInputElement.disabled = disabled;
    objectSpeedInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
    objectDirectionInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
    objectMassInputElement.style.backgroundColor = disabled ? '#e0e0e0' : '#fff';
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    objects.forEach(obj => {
        if (obj.type === 'sphere') {
            drawSphere(obj.x, obj.y, "blue", obj.size);
        } else if (obj.type === 'square') {
            drawSquare(obj.x, obj.y, "red", obj.size);
        }
    })
    if (addingObject && previewObject) {
        drawPreviewObject();
    }
}

function drawPreviewObject() {
    let size = parseFloat(newObjectSizeInputElement.value);
    if ( previewObject.type === 'sphere') {
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(currentMousePosition.x, currentMousePosition.y, size/2, 0, Math.PI * 2);
        ctx.fill();
    } else if (previewObject.type === 'square') {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(currentMousePosition.x -10, currentMousePosition.y -10, size, size);
    }
    
}

function velocityFromSpeedAndDirection(speed, direction) {
    const radians = (Math.PI / 180) * direction;
    return {
        x: speed * Math.cos(radians),
        y: -speed * Math.sin(radians) // y is negative because canvas y-axis is downward
    }
}

function directionFromVelocity(velocity) {
    const angle = Math.atan2(-velocity.y, velocity.x);
    const degrees = (angle * 180 / Math.PI + 360) % 360;
    return degrees;
}

function speedFromVelocity(velocity) {
    return Math.hypot(velocity.x, velocity.y);
}

function drawSphere(x, y, color, size) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, size/2, 0, Math.PI * 2);
    ctx.fill();
}

function drawSquare(x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(x -10, y -10, size, size);
}

function drawLoop() {
    draw();
    requestAnimationFrame(drawLoop);
}

function updateSimulation() {
    const bounceAtBorders = bounceAtBordersCheckbox.checked;
    objects.forEach(obj => {
        obj.x += obj.velocity.x;
        obj.y += obj.velocity.y;
    
        if (bounceAtBorders) {
                if (obj.x < 0) {
                    obj.x = 0;
                    obj.velocity.x *= -1;
                }
                if (obj.x > canvas.width) {
                    obj.x = canvas.width;
                    obj.velocity.x *= -1;
                }
                if (obj.y < 0) {
                    obj.y = 0;
                    obj.velocity.y *= -1;
                }
                if (obj.y > canvas.height) {
                    obj.y = canvas.height;
                    obj.velocity.y *= -1;
                }
            } else {
                // Keep objects within canvas bounds without bouncing
                if (obj.x < 0) obj.x = 0;
                if (obj.x > canvas.width) obj.x = canvas.width;
                if (obj.y < 0) obj.y = 0;
                if (obj.y > canvas.height) obj.y = canvas.height;
            }
            handleCollisions();
    })
}

function handleCollisions() {
    for (let i = 0; i < objects.length -1; i++) {
        for (let j = i+1; j < objects.length; j++) {
            const obj1 = /** @type {DynamicObject} */ (objects[i]);
            const obj2 = /** @type {DynamicObject} */ (objects[j]);

            const relativeVelocityX = obj2.velocity.x - obj1.velocity.x;
            const relativeVelocityY = obj2.velocity.y - obj1.velocity.y;
            
            // Calculate distance components
            const distanceX = obj2.x - obj1.x;
            const distanceY = obj2.y - obj1.y;
            
            // Check if they are closing in on each other
            const closingInX = distanceX * relativeVelocityX < 0;
            const closingInY = distanceY * relativeVelocityY < 0;
            
            if (!(closingInX || closingInY)) {
                continue; // Skip further calculations if not closing in
            }

            const collisionNormal = checkCollision(obj1, obj2);

            if (collisionNormal) {
                resolveCollision(obj1, obj2, collisionNormal);
            }
        }
    }
}

function checkCollision(/** @type {DynamicObject} */ obj1, /** @type {DynamicObject} */ obj2) {
    if (obj1.type === "sphere" && obj2.type === "sphere") {
        return checkSphereSphereCollision(obj1, obj2);
    }

}

function checkSphereSphereCollision(/** @type {DynamicObject} */ obj1, /** @type {DynamicObject} */ obj2) {
    const distanceX = obj2.x - obj1.x;
    const distanceY = obj2.y - obj1.y;
    const distanceSquared = distanceX ** 2 + distanceY ** 2;
    const combinedRadius = (obj1.size / 2) + (obj2.size / 2);
    
    if (distanceSquared < combinedRadius ** 2) {
        const distance = Math.sqrt(distanceSquared);
        return {x: distanceX / distance, y: distanceY / distance};
    }

    return null;
}

function resolveCollision(/** @type {DynamicObject} */ obj1, /** @type {DynamicObject} */ obj2, /** @type {{x: number, y: number}} */ normal) {
    const relativeVelocityX = obj2.velocity.x - obj1.velocity.x;
    const relativeVelocityY = obj2.velocity.y - obj1.velocity.y;
    const velocityAlongNormal = relativeVelocityX * normal.x + relativeVelocityY * normal.y;

    //No collision handling required if objects are moving apart
    if(velocityAlongNormal > 0) return;

    //Calvulate new velocities
    const newObj1VelocityX = obj1.velocity.x + (velocityAlongNormal * normal.x);
    const newObj1VelocityY = obj1.velocity.y + (velocityAlongNormal * normal.y);
    const newObj2VelocityX = obj2.velocity.x - (velocityAlongNormal * normal.x);
    const newObj2VelocityY = obj2.velocity.y - (velocityAlongNormal * normal.y);
    
    //Update velocitys 
    obj1.velocity.x = newObj1VelocityX;
    obj1.velocity.y = newObj1VelocityY;
    obj2.velocity.x = newObj2VelocityX;
    obj2.velocity.y = newObj2VelocityY;
    
}


drawLoop();

