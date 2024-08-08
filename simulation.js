//@ts-check
class DynamicObject {
    /**
     * @param {ObjectType} type 
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

class PreviewObject {
    /**
     * @param {ObjectType} type 
     * @param {number} size 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(type, size, x, y){
        this.type = type;
        this.size = size;
        this.x = x;
        this.y = y;
    }
}

class ObjectType {
    static get SPHERE () {
        return "sphere";
    }
    
    static get SQUARE () {
        return "square";
    }
}

const {canvas, ctx, objectTypeSelect, bounceAtBordersCheckbox, objectTypeDisplayElement, objectPositionElement,
     objectSpeedInputElement, objectDirectionInputElement, newObjectSizeInputElement, newObjectMassInputElement,
     objectMassInputElement} = initPageElements();

   
const objects = /** @type {Array<DynamicObject>} */ ([]);
let running = false;
let currentMousePosition = {x: 0, y: 0};
let addingObject = false;
let /** @type {PreviewObject | null} */ previewObject = null;
let /** @type {DynamicObject | undefined} */ selectedObject = undefined;

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
            const type = objectTypeSelect.value; 
            objects.push(new DynamicObject(type, size, currentMousePosition.x, currentMousePosition.y, {x: 0, y: 0}, mass));
            addingObject = false;
        } else {
            selectObject(event);
        }
    });

    newObjectSizeInputElement.addEventListener('input', () => {
        const size = parseFloat(newObjectSizeInputElement.value);
        if (!isNaN(size) && size >= 0) {
            newObjectMassInputElement.value = getMassForNewObject().toFixed(2);
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
    const typeString = objectTypeSelect.value;
    const size = parseFloat(newObjectSizeInputElement.value);
    let objectType = new ObjectType;
    switch (typeString) {
        case "sphere":
            objectType = ObjectType.SPHERE;
            break;
        case "square":
            objectType = ObjectType.SQUARE;
    }
    previewObject = new PreviewObject(objectType, size, 0, 0);
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
        if (obj.type === ObjectType.SPHERE) {
            return Math.hypot(obj.x - clickX, obj.y - clickY) < obj.size / 2;
        } else if (obj.type === ObjectType.SQUARE) {
            return clickX > obj.x -  obj.size && clickX < obj.x +  obj.size 
            && clickY > obj.y - obj.size && clickY < obj.y +  obj.size;
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
            selectedObject = undefined;
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
    if (!previewObject) {throw new Error ("Preview object is null")};
        
    if (previewObject.type === 'sphere') {
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(currentMousePosition.x, currentMousePosition.y, size/2, 0, Math.PI * 2);
        ctx.fill();
    } else if (previewObject.type === 'square') {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(currentMousePosition.x -size/2, currentMousePosition.y -size/2, size, size);
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
    ctx.fillRect(x - size/2, y -size/2, size, size);
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
                if (obj.x - obj.size/2 < 0) {
                    obj.x =  0 + obj.size / 2;
                    obj.velocity.x *= -1;
                }
                if (obj.x + obj.size / 2 > canvas.width) {
                    obj.x =  canvas.width - obj.size / 2;
                    obj.velocity.x *= -1;
                }
                if (obj.y - obj.size/2 < 0) {
                    obj.y = 0 + obj.size / 2;
                    obj.velocity.y *= -1;
                }
                if (obj.y + obj.size / 2 > canvas.height) {
                    obj.y = canvas.height - obj.size / 2;
                    obj.velocity.y *= -1;
                }
            } else {
                // Keep objects within canvas bounds without bouncing
                if (obj.x - obj.size / 2 < 0) obj.x = 0 + obj.size / 2;
                if (obj.x + obj.size / 2 > canvas.width) obj.x = canvas.width - obj.size / 2;
                if (obj.y - obj.size / 2 < 0) obj.y = 0 + obj.size / 2;
                if (obj.y + obj.size / 2 > canvas.height) obj.y = canvas.height - obj.size / 2;
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
    if (obj1.type === ObjectType.SPHERE && obj2.type === ObjectType.SPHERE) {
        return checkSphereSphereCollision(obj1, obj2);
    } 
    else if (obj1.type === ObjectType.SQUARE && obj2.type == ObjectType.SQUARE) {
        return checkSquareSquareCollision(obj1, obj2);
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

function checkSquareSquareCollision(/** @type {DynamicObject} */ obj1, /** @type {DynamicObject} */ obj2) {
    const halfSize1 = obj1.size / 2;
    const halfSize2 = obj2.size / 2;
    const distanceX = Math.abs(obj1.x - obj2.x);
    const distanceY = Math.abs(obj1.y - obj2.y);


    if (distanceX < halfSize1 + halfSize2 &&
        distanceY < halfSize1 + halfSize2) {
        const overlapX = (halfSize1 + halfSize2) - distanceX;
        const overlapY = (halfSize1 + halfSize2) - distanceY;

        if (overlapX < overlapY) {
            return {x: obj1.x < obj2.x ? 1 : -1, y : 0};
        } else {
            return {x: 0, y: obj1.y < obj2.y ? 1 : -1};
        }
    }

    return null;
}

function resolveCollision(/** @type {DynamicObject} */ obj1, /** @type {DynamicObject} */ obj2, /** @type {{x: number, y: number}} */ normal) {
    const relativeVelocityX = obj2.velocity.x - obj1.velocity.x;
    const relativeVelocityY = obj2.velocity.y - obj1.velocity.y;
    const velocityAlongNormal = relativeVelocityX * normal.x + relativeVelocityY * normal.y;

    //No collision handling required if objects are moving apart
    if(velocityAlongNormal > 0) return;

    //restituion = 1 -> perfect elastic collisions -> all kinetic energy is conserved
    //restituion = 0 -> perfect inelastic collisions -> no kinetic energy is conserved
    const restituion = 1;

    const impulseScalar = - (1 + restituion) * velocityAlongNormal / (1 / obj1.mass + 1 / obj2.mass);
    const impulseX = impulseScalar * normal.x;
    const impulseY = impulseScalar * normal.y;

    //Calvulate new velocities
    const newObj1VelocityX = obj1.velocity.x - impulseX / obj1.mass;
    const newObj1VelocityY = obj1.velocity.y - impulseY / obj1.mass;
    const newObj2VelocityX = obj2.velocity.x + impulseX / obj2.mass;
    const newObj2VelocityY = obj2.velocity.y + impulseY / obj2.mass;
    
    //Update velocitys 
    obj1.velocity.x = newObj1VelocityX;
    obj1.velocity.y = newObj1VelocityY;
    obj2.velocity.x = newObj2VelocityX;
    obj2.velocity.y = newObj2VelocityY;   
}


drawLoop();

