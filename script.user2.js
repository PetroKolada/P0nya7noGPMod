console.log("P0nya7no mod launched successfuly.");


const originalSend = WebSocket.prototype.send;
window.sockets = [];
WebSocket.prototype.send = function(...args) {
    if (window.sockets.indexOf(this) === -1){
        window.sockets.push(this);
    }
    window.sockets[0].addEventListener("message", (event)=>{
        console.log("Message - " + event.data);
    })
    return originalSend.call(this, ...args);
};

function stringToArray(str) {
    str = str.slice(1, -1);
    const arrayStrings = str.split('],[');
    return arrayStrings.map(arrayStr => arrayStr.split(',').map(Number));
}


bindsContainer = {
    mirrorKey : "CapsLock",
    brushKey : "KeyB",
    eraserKey : "KeyE",
    colorPickerKey : "AltLeft",
    changeKey : "KeyX"
}

function findElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    })
}




findElement(".side").then((element)=>{element.remove()})

let hudModule,
drawingModule,
hueModule,
brushModule,
proxyModule,
modificationModule = undefined


async function modificationInitialization() {
    while (1) {
        await findElement(".core").then((element)=>{
            console.log("Drawing core found");

            hudModule = null;
            drawingModule = null;
            hueModule = null;
            brushModule = null;
            proxyModule = null;
            modificationModule = null;

            let draw = document.querySelector(".jsx-267435985")
            document.querySelector(".jsx-83c337f44c9d610").innerHTML += draw.outerHTML
            document.querySelector(".core").remove()
            document.querySelector(".jsx-470877037").remove()

            hudModule = new HudModule(document.querySelector(".screen"));
            hudModule.init();

            drawingModule = new DrawingModule(document.querySelector(".jsx-470877037"), document.querySelector(".jsx-1589252288"), 1516, 848);
            drawingModule.init();

            hueModule = new HueModule(document.querySelector(".PMPalette_hue"), document.querySelector(".PMPalette"), drawingModule);
            hueModule.init();

            brushModule = new BrushModule(document.querySelector("#brushSettingsHolder"), drawingModule);
            brushModule.init();

            proxyModule = new ProxyModule(sockets[0], drawingModule, document.querySelector(".PMRender__button"));
            proxyModule.init();

            modificationModule = new ModificationModule(drawingModule, bindsContainer);
            modificationModule.init(drawingModule);


            document.querySelector(".bottom").remove()
            document.querySelector(".download").remove()
            document.querySelector(".sound").remove()
            console.log("Modified");
            return "Modified"
        })
    }
}



modificationInitialization()


class DrawingModule{
    drawColor = "#000000"

    foregroundColor = "#000000"
    backgroundColor = "#FF0000"

    currentTool = 0

    scale = 1
    drawWidth = "4"
    drawTransparency = "1"
    isDrawing = false
    isDragging = false
    isMirrored = false
    points = []
    canvasList = [[]]
    strokeAmount = 0
    snapshot
    continiousPoints = ""

    canvasLocked = false

    constructor(canvas, brushCanvas, width, height){
        this.canvas = canvas
        this.brushCanvas = brushCanvas
        this.canvas.width = width
        this.canvas.height = height
        this.brushCanvas.width = width
        this.brushCanvas.height = height
        this.drawingContainer = this.canvas.parentElement
    }

    init(){
        this.setModuleContext()
        this.canvasList = [[]]
        this.points = []
        this.context.fillStyle = "white"
        this.context.fillRect(0,0, this.canvas.width, this.canvas.height)
        this.setMouseEvents()
    }

    setDrawColor(color){
        this.drawColor = color
    }

    getMirrorPhase(){
        return (+this.isMirrored*2-1)*-1
    }

    setMouseEvents(){
        /*
        this.drawingContainer.addEventListener("touchstart", event => this.startLine(event))
        this.drawingContainer.parentElement.addEventListener("touchmove", event => this.drawLine(event))
        this.drawingContainer.addEventListener("mousedown", event => this.startLine(event))
        this.drawingContainer.parentElement.addEventListener("mousemove", event => this.drawLine(event))
        document.body.addEventListener("touchend", event => this.stopLine(event))
        document.body.addEventListener("mouseup", event => this.stopLine(event))
        this.drawingContainer.parentElement.addEventListener("mousemove", event => this.renderCrosshair(event))
        this.drawingContainer.parentElement.addEventListener("touchmove", event => this.renderCrosshair(event))
        */

        const { drawingContainer } = this;
        const parentElement = drawingContainer.parentElement;
    
        const startEvents = ["touchstart", "mousedown"];
        startEvents.forEach(eventType => {
            drawingContainer.addEventListener(eventType, event => this.dragStart(event));
            drawingContainer.addEventListener(eventType, event => this.startLine(event));
        });
    
        const moveEvents = ["touchmove", "mousemove"];
        moveEvents.forEach(eventType => {
            document.addEventListener(eventType, event => this.dragCanvas(event));
            parentElement.addEventListener(eventType, event => this.drawLine(event));
            parentElement.addEventListener(eventType, event => this.renderCrosshair(event));
        });
    
        const endEvents = ["touchend", "mouseup"];
        endEvents.forEach(eventType => {
            document.body.addEventListener(eventType, event => this.dragEnd(event));
            document.body.addEventListener(eventType, event => this.stopLine(event));
        });

        drawingContainer.addEventListener("wheel", event => this.zoom(event))
    
    }

    zoom(event){
        event.preventDefault()
        this.scale += event.deltaY * -0.0002
        this.scale = Math.min(Math.max(0.125, this.scale), 4);
        console.log(this.scale);
        this.drawingContainer.style.scale = this.scale
    }

    startX
    startY
    shiftX
    shiftY

    dragStart(event){
        if(event.which == 2){
            this.isDragging = true
            const rect = this.drawingContainer.getBoundingClientRect();
            this.shiftX = (event.clientX - rect.left)
            this.shiftY = (event.clientY - rect.top)
            event.preventDefault()
            event.stopImmediatePropagation()
        }
    }

    dragCanvas(event){
        if (this.isDragging) {
            if(event.which == 2){
                this.drawingContainer.style.left = (event.clientX - this.shiftX) + "px"
                this.drawingContainer.style.top = (event.clientY - this.shiftY) + "px"
                event.preventDefault()
                event.stopImmediatePropagation()
            }
        }
    }

    dragEnd(event){
        if(event.which == 2){
            this.isDragging = false
            event.preventDefault()
            event.stopImmediatePropagation()
        }
    }

    getMouseCursor(event, canvas){
        let canvasPos = this.canvas.getBoundingClientRect()
        this.prevPos.x = ((this.canvas.width*this.isMirrored*-1) + (((event.clientX - canvasPos.left)*2)/this.scale))*this.getMirrorPhase()
        this.prevPos.y = (((event.clientY - canvasPos.top)*2)/this.scale)
        return {
            x:((this.canvas.width*this.isMirrored*-1) + (((event.clientX - canvasPos.left)*2)/this.scale))*this.getMirrorPhase(),
            y:(((event.clientY - canvasPos.top)*2)/this.scale)
            }
    }

    prevPos = {x:0, y:0}

    setDrawStyle(){
        this.context.strokeStyle = this.drawColor
        this.context.lineWidth = this.drawWidth
        this.context.globalAlpha = this.drawTransparency
        this.context.lineCap = "round"
        this.context.lineJoin = "round"
    }

    getModuleContext(){
        return this.context
    }

    setModuleContext(){
        this.context = this.canvas.getContext("2d")
    }

    lockCanvas(state){
        this.canvasLocked = state
    }

    midPointBtw(p1, p2) {
        return {
          x: p1.x + (p2.x - p1.x) / 2,
          y: p1.y + (p2.y - p1.y) / 2
        };
    }

    startLine(event){
        if (!this.canvasLocked) {
            this.setDrawStyle()
            this.snapshot = this.getModuleContext().getImageData(0, 0, 1516, 848)
            this.isDrawing = true
            this.points.push({x:this.getMouseCursor(event, this.drawingContainer.parentElement).x, y:this.getMouseCursor(event, this.drawingContainer.parentElement).y})
            
            this.drawLine(event)

            this.continiousPoints = ""

            this.continiousPoints += `[${(this.getMouseCursor(event, this.drawingContainer.parentElement).x)/2},${(this.getMouseCursor(event, this.drawingContainer.parentElement).y)/2}],`

            this.canvasList[0].push({
                turn : 0,
                press : 1,
                color : this.drawColor,
                transparency : this.drawTransparency,
                pressNumber : this.strokeAmount,
                posArray : `[${(this.getMouseCursor(event, this.drawingContainer.parentElement).x)/2},${(this.getMouseCursor(event, this.drawingContainer.parentElement).y)/2}]`,
                width : this.drawWidth,
                canvasContext : this.getModuleContext()
            })

            event.preventDefault()
        }
    }

    drawLine(event) {
        if (this.isDrawing) {
            this.points.push({x:this.getMouseCursor(event, this.drawingContainer.parentElement).x, y:this.getMouseCursor(event, this.drawingContainer.parentElement).y})
            this.getModuleContext().clearRect(0, 0, this.width, this.height)
            this.getModuleContext().putImageData(this.snapshot, 0, 0);
            let p1 = this.points[0]
            let p2 = this.points[1]
            this.getModuleContext().beginPath()
            this.getModuleContext().moveTo(p1.x, p1.y)


            for (let index = 1, len = this.points.length; index < len; index++) {
                let midPoint = this.midPointBtw(p1, p2)
                this.getModuleContext().quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y)
                p1 = this.points[index]
                p2 = this.points[index+1]
                
            }

            this.getModuleContext().lineTo(p1.x, p1.y)
            this.getModuleContext().stroke()

            this.continiousPoints += `[${p1.x/2}, ${p1.y/2}],`
        }
        event.preventDefault()
    }

    stopLine(event) {
        if (this.isDrawing) {
            /*
            this.getModuleContext().stroke()
            this.getModuleContext().closePath()
            this.isDrawing = false
            */
            this.isDrawing = false
            this.points.length = 0

            this.canvasList[0].push({
                turn : 0,
                press : 3,
                color : this.drawColor,
                transparency : this.drawTransparency,
                pressNumber : this.strokeAmount,
                posArray : this.continiousPoints.slice(0, -1),
                width : this.drawWidth,
                canvasContext : this.getModuleContext()
            })
            this.strokeAmount++;

        }
        event.preventDefault()
    }

    renderCrosshair(event){
        let brushContext = this.brushCanvas.getContext("2d")
        brushContext.clearRect(0, 0, this.brushCanvas.width, this.brushCanvas.height);
        brushContext.strokeStyle = "#000000";
        brushContext.beginPath();
        brushContext.arc(
            this.getMouseCursor(event, this.brushCanvas).x,
            this.getMouseCursor(event, this.brushCanvas).y,
            this.drawWidth/2, 0, Math.PI * 2
        );
        brushContext.stroke();

        brushContext.strokeStyle = "#FFFFFF";
        brushContext.beginPath();
        brushContext.arc(
            this.getMouseCursor(event, this.brushCanvas).x,
            this.getMouseCursor(event, this.brushCanvas).y,
            this.drawWidth/2+1, 0, Math.PI * 2
        );
        brushContext.stroke();
    }

    listToLayer(canvasLayer, cursor){
        let layer = {
            points : stringToArray(canvasLayer[cursor].posArray),
            color : canvasLayer[cursor].color,
            width : canvasLayer[cursor].width,
            transparency : canvasLayer[cursor].transparency
        }
        return layer
    }

    refresh(layer){
        /*
        this.getModuleContext().fillStyle = "#fff"
        this.getModuleContext().globalAlpha = 1
        this.getModuleContext().fillRect(0, 0, this.getModuleContext().canvas.width, this.getModuleContext().canvas.height);
        for (let layerCount = 1; layerCount <= layer.length; layerCount = layerCount + 2) {
            this.getModuleContext().clearRect(0, 0, this.width, this.height)
            this.getModuleContext().strokeStyle = layer[layerCount].color
            this.getModuleContext().lineWidth = layer[layerCount].width
            this.getModuleContext().globalAlpha = layer[layerCount].transparency
            this.getModuleContext().beginPath()
            this.getModuleContext().moveTo(this.listToLayer(layer, layerCount).points[0][0]*2, this.listToLayer(layer, layerCount).points[0][1]*2)

            this.listToLayer(layer, layerCount).points.forEach((coords, index) =>{
                //this.getModuleContext().lineTo(coords[0]*2, coords[1]*2)
                let p1,p2

                try{
                    p1 = this.listToLayer(layer, layerCount).points[index+1][0]
                    p2 = this.listToLayer(layer, layerCount).points[index+1][1]
                }catch(error){
                    p1 = this.listToLayer(layer, layerCount).points[index][0]
                    p2 = this.listToLayer(layer, layerCount).points[index][1]
                }

                let midPoint = this.midPointBtw(
                {
                    x:coords[0],
                    y:coords[1]
                },
                {
                    x:p1,
                    y:p2
                })
                this.getModuleContext().quadraticCurveTo(coords[0]*2, coords[1]*2, midPoint.x*2, midPoint.y*2)
            })
            this.getModuleContext().stroke()
        }
        */
        const context = this.getModuleContext();
        context.fillStyle = "#fff";
        context.globalAlpha = 1;
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        
        for (let layerCount = 1; layerCount <= layer.length; layerCount += 2) {
            const currentLayer = this.listToLayer(layer, layerCount);
            const points = currentLayer.points;
            console.log(layer);
            context.clearRect(0, 0, this.width, this.height);
            context.strokeStyle = currentLayer.color;
            context.lineWidth = currentLayer.width;
            context.globalAlpha = currentLayer.transparency;
        
            context.beginPath();
            context.moveTo(points[0][0] * 2, points[0][1] * 2);
        
            points.forEach((coords, index) => {
                const nextIndex = index + 1 < points.length ? index + 1 : index;
                const p1 = points[nextIndex][0];
                const p2 = points[nextIndex][1];
        
                const midPoint = this.midPointBtw(
                    { x: coords[0], y: coords[1] },
                    { x: p1, y: p2 }
                );
        
                context.quadraticCurveTo(coords[0] * 2, coords[1] * 2, midPoint.x * 2, midPoint.y * 2);
            });
        
            context.stroke();
        }
    }

    mirrorCanvas(){
        this.isMirrored == false ? this.isMirrored = true : this.isMirrored = false
        this.isMirrored == true? this.drawingContainer.style.transformOrigin = `50% 0`: this.drawingContainer.style.transformOrigin = `0 0`
        this.drawingContainer.style.transform = "scaleX("+this.getMirrorPhase()+")"
    }

    getColor(){
        let pixel = this.getModuleContext().getImageData(
            this.prevPos.x, 
            this.prevPos.y,
            1,
            1
        )['data']

        return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
    }
    
}

class HudModule{
    constructor(HudElement){
        this.hudElement = HudElement
    }

    resetDefault(){
        this.hudElement.querySelector(".colors").remove()?[]:[]
        this.hudElement.querySelector(".tools").remove()?[]:[]
        this.hudElement.querySelector(".options").remove()?[]:[]
    }

    renderHud(){
        this.hudElement.innerHTML += `
            <div class="PMCenter_panel">
                <div class="PMHeader">
                    <div class="PMHeader_links">
                        <div class="PMHeader_element">P0nya7noGP</div>
                        <div class="PMHeader_element">Настройки</div>
                        <div class="PMHeader_element">Референсы</div>
                    </div>
                    <div class="PMHeader_links">
                        <div class="PMHeader_element">14/13</div>
                        <div class="PMHeader_element">00:05</div>
                    </div>
                </div>
                <div class="PMPanel_inside">
                    <div class="PMPanel_tools">
                        <div class="PMTool PMTool__active"><svg id="Layer_1" height="512" viewBox="0 0 24 24" width="512" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1"><path d="m.024 23.976.076-1.05c.076-1.1.545-6.688 2.307-8.451a5.036 5.036 0 0 1 7.118 7.125c-1.762 1.762-7.349 2.23-8.452 2.306zm23.076-23.108a3.137 3.137 0 0 0 -4.333 0l-10.515 10.519a6.967 6.967 0 0 1 4.342 4.324l10.506-10.511a3.067 3.067 0 0 0 0-4.332z"/></svg></div>
                        <div class="PMTool"><svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="512" height="512"><path d="m7.242,7.438L12.751,1.911c1.17-1.175,3.213-1.175,4.383,0l5.935,5.955c1.206,1.21,1.206,3.179,0,4.389l-5.506,5.525L7.242,7.438Zm7.111,13.562l1.798-1.804L5.83,8.855.882,13.82c-1.206,1.21-1.206,3.179,0,4.389l4.774,4.791h18.344v-2h-9.647Z"/></svg></div>
                        <div class="PMTool"><svg id="Layer_1" height="512" viewBox="0 0 24 24" width="512" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1"><path d="m24 3.023a3 3 0 0 1 -.886 2.138l-3.407 3.407a3.455 3.455 0 0 0 -.071 4.837l-1.436 1.395-9-9 1.4-1.436a3.456 3.456 0 0 0 4.837-.071l3.402-3.407a3.094 3.094 0 0 1 4.276 0 3 3 0 0 1 .885 2.137zm-22.087 14.658a3.074 3.074 0 0 0 -.582 3.574l-1.331 1.331 1.414 1.414 1.331-1.331a3.074 3.074 0 0 0 3.574-.582l8.049-8.049-4.406-4.406z"/></svg></div>
                        <div class="PMTool"><svg id="Layer_1" height="512" viewBox="0 0 24 24" width="512" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1"><path d="m21.45 13.864-9.258 9.257a3 3 0 0 1 -4.243 0l-7.07-7.071a3 3 0 0 1 0-4.242l6.3-6.3-2.861-2.886 1.422-1.406 8.969 9.08 1.537-1.526-6.125-6.2.015-.016-1.1-1.1 1.415-1.417 13.577 13.576-1.415 1.415zm-2.45 7.636a2.5 2.5 0 0 0 5 0c0-1.381-2.5-4.5-2.5-4.5s-2.5 3.25-2.5 4.5z"/></svg></div>
                        <div class="PMTool"><svg xmlns="http://www.w3.org/2000/svg" id="Isolation_Mode" data-name="Isolation Mode" viewBox="0 0 24 24" width="512" height="512"><path d="M24,24H0V0H24ZM3,21H21V3H3Z"/></svg></div>
                        <div class="PMTool"><svg xmlns="http://www.w3.org/2000/svg" id="Bold" viewBox="0 0 24 24" width="512" height="512"><path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm0,21a9,9,0,1,1,9-9A9.01,9.01,0,0,1,12,21Z"/></svg></div>
                        <div class="PMTool"><svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="512" height="512"><path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Z"/></svg></div>
                    </div>
                </div>
                <div class="PMFooter">
                    <span>
                        <div class="PMFooter_element">ZOOM: 100%</div>
                        <div class="PMFooter_element">1516px. X 848px. (300ppi)</div>
                    </span>
                    <button class="PMRender__button">Экспортировать</button>
                </div>
            </div>
            <div class="PMRight_panel">
                <div class="PMPanel">
                    <div class="PMPanel_header">
                        <div class="PMPTitle PMPanel__active">Палитра</div>
                    </div>
                    <div class="PMPanel_main_holder">
                        <div class="PMPanel_hero PMColor">
                            <div class="PMFast_color_holder">
                                <div class="PMFast__color">+</div>
                                <div class="PMFast__color"></div>
                            </div>
                            <canvas class="PMPalette"></canvas>
                            <canvas class="PMPalette_hue"></canvas>
                        </div>
                    </div>
                </div>
                <div class="PMPanel">
                    <div class="PMPanel_header">
                        <div class="PMPTitle PMPanel__active">Сохраненные цвета</div>
                    </div>
                    <div class="PMPanel_main_holder">
                        <div class="PMPanel_hero PMColorPresets">
                            <div class="PMColor_save" style="background-color: rgb(0, 0, 0)"></div>
                            <div class="PMColor_save" style="background-color: rgb(255, 255, 255)"></div>
                            <div class="PMColor_save" style="background-color: rgb(255, 0, 0)"></div>
                            <div class="PMColor_save" style="background-color: rgb(0, 255, 0)"></div>
                            <div class="PMColor_save" style="background-color: rgb(0, 0, 255)"></div>

                        </div>
                    </div>
                </div>
                <div class="PMPanel">
                    <div class="PMPanel_header">
                        <div class="PMPTitle PMPanel__active">Кисть</div>
                        <div class="PMPTitle">Пресеты</div>
                    </div>
                    <div class="PMPanel_main_holder">
                        <div class="PMPanel_hero" id="brushSettingsHolder">
                            <div class="PMBrush_setting_holder">
                                <div class="PMBrush_setting_title">
                                    Размер:
                                    <input type="value" id="brushRadiusInput" min="1" value="4">
                                </div>
                                <input type="range" id="brushRadiusValue" min="1" value="4">
                            </div>
                            <div class="PMBrush_setting_holder">
                                <div class="PMBrush_setting_title">
                                    Непрозрачность:
                                    <input type="value" id="brushTransparencyInput" min="1" value="100">
                                </div>
                                <input type="range" id="brushTransparencyValue" min="1" value="100">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="PMPanel">
                    <div class="PMPanel_header">
                        <div class="PMPTitle PMPanel__active">Слои</div>
                    </div>
                    <div class="PMPanel_main_holder">
                        <div class="PMPanel_hero">
                            <div class="PMLayer_holder">
                                <div class="PMLayer">
                                    <div class="PMLayer__hide PMLayer_button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512"><g id="_01_align_center" data-name="01 align center"><path d="M23.821,11.181v0C22.943,9.261,19.5,3,12,3S1.057,9.261.179,11.181a1.969,1.969,0,0,0,0,1.64C1.057,14.739,4.5,21,12,21s10.943-6.261,11.821-8.181A1.968,1.968,0,0,0,23.821,11.181ZM12,19c-6.307,0-9.25-5.366-10-6.989C2.75,10.366,5.693,5,12,5c6.292,0,9.236,5.343,10,7C21.236,13.657,18.292,19,12,19Z"/><path d="M12,7a5,5,0,1,0,5,5A5.006,5.006,0,0,0,12,7Zm0,8a3,3,0,1,1,3-3A3,3,0,0,1,12,15Z"/></g></svg>
                                    </div>
                                    <input class="PMLayer__title" type="text" placeholder="Безымянный слой">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="PMLayer_holder_footer">
                        <div class="PMLayer_button"><svg xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="512" height="512"><path d="M24,9.367v2.332l-12,7.2L0,11.7v-2.332l12,7.2,12-7.2Zm-.056-2.137L12,.064,.056,7.23l11.944,7.166,11.944-7.166ZM0,13.699v2.332l12,7.2,2-1.2v-2.332l-2,1.2L0,13.699Zm21,2.301h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3Z"/></svg></div>
                        <div class="PMLayer_button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512"><g id="_01_align_center" data-name="01 align center"><path d="M22,4H17V2a2,2,0,0,0-2-2H9A2,2,0,0,0,7,2V4H2V6H4V21a3,3,0,0,0,3,3H17a3,3,0,0,0,3-3V6h2ZM9,2h6V4H9Zm9,19a1,1,0,0,1-1,1H7a1,1,0,0,1-1-1V6H18Z"/><rect x="9" y="10" width="2" height="8"/><rect x="13" y="10" width="2" height="8"/></g></svg></div>
                    </div>
                </div>
            </div>
        `
        document.querySelector(".PMPanel_inside").appendChild(document.querySelector(".draw"))
        
    }

    init(){
        this.resetDefault()
        this.renderHud()
    }
}

class PaletteModule{
    color = "#ff0000"
    colorSelecting = false
    savedColors = ""

    constructor(paletteElement, drawingModule){
        this.paletteElement = paletteElement
        this.drawingModule = drawingModule
    }


    getMouseCursor(event, canvas){
        let canvasPos = canvas.getBoundingClientRect()
        return {
            x:(event.clientX - canvasPos.left),
            y:(event.clientY - canvasPos.top)
            }
    }

    getModuleContext(){
        return this.context
    }

    setModuleContext(canvas){
        this.context = canvas.getContext("2d")
    }

    PaletteInit(){
        this.setModuleContext(this.paletteElement)
        this.getModuleContext().canvas.height = 252
        this.getModuleContext().canvas.width = 252
        document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = this.drawingModule.foregroundColor
        document.querySelectorAll(".PMFast__color")[1].style.backgroundColor = this.drawingModule.backgroundColor
        this.savedColors = localStorage.getItem("savedColors")?.toString().split("|").slice(0,-1)
        this.savedColors == undefined ? this.savedColors = []:
        console.log(this.savedColors);
        this.savedColors.forEach(color => {
            document.querySelector(".PMColorPresets").innerHTML += `<div class="PMColor_save" style="background-color: ${color}"></div>`
        })
    }

    renderPalette(color){
        this.setModuleContext(this.paletteElement)

        this.getModuleContext().clearRect(0,0,this.getModuleContext().canvas.width, this.getModuleContext().canvas.height)

        let gradientH = this.getModuleContext() .createLinearGradient(0, 0, this.getModuleContext().canvas.width, 0);
        gradientH.addColorStop(0, '#fff');
        gradientH.addColorStop(1, color);
        this.getModuleContext().fillStyle = gradientH;
        this.getModuleContext().fillRect(0, 0, this.getModuleContext().canvas.width, this.getModuleContext().canvas.height);
    

        let gradientV = this.getModuleContext().createLinearGradient(0,0,0,this.getModuleContext().canvas.height)
        gradientV.addColorStop(0, 'rgba(0,0,0,0)');
        gradientV.addColorStop(1, '#000000');
        this.getModuleContext().fillStyle = gradientV;
        this.getModuleContext().fillRect(0, 0, this.getModuleContext().canvas.width, 
        this.getModuleContext().canvas.height); 
    }

    setMouseEventsPalette(){
        this.paletteElement.addEventListener("touchstart", event => this.startPaletteColor(event))
        this.paletteElement.addEventListener("touchmove", event => this.setColor(event))
        this.paletteElement.addEventListener("mousedown", event => this.startPaletteColor(event))
        this.paletteElement.addEventListener("mousemove", event => this.setColor(event))
        this.paletteElement.addEventListener("touchend", event => this.stopPaletteColor(event))
        this.paletteElement.addEventListener("mouseup", event => this.stopPaletteColor(event))
        this.paletteElement.addEventListener("mouseout", event => this.stopPaletteColor(event))
        document.querySelector(".PMFast_color_holder").addEventListener("mousedown", event => this.saveColor(event))
        document.querySelector(".PMColorPresets").addEventListener("mousedown", event => this.applyColor(event))
    }

    saveColor(event){
        if (event.target.classList.contains("PMFast__color")) {
            document.querySelector(".PMColorPresets").innerHTML += `<div class="PMColor_save" style="background-color: ${event.target.style.backgroundColor}"></div>`
            this.savedColors += (event.target.style.backgroundColor)+"|"
            localStorage.setItem('savedColors', this.savedColors)
        }
        event.preventDefault
    }

    applyColor(event){
        if (event.target.classList.contains("PMColor_save")){
        switch (event.which) {
            case 1:
                document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = event.target.style.backgroundColor
                this.drawingModule.foregroundColor = event.target.style.backgroundColor
                this.drawingModule.drawColor = event.target.style.backgroundColor
                break;
        
            case 2:
                let index = this.savedColors.indexOf(event.target) + 5
                console.log(this.savedColors);
                if (index > -1){
                    this.savedColors.splice(index, 1)
                    localStorage.setItem('savedColors', this.savedColors)
                    event.target.remove()
                }
                break;
        }
        event.preventDefault()
        }
    }

    renderPaletteCursor(event){
        this.getModuleContext().strokeStyle = "#000000";
        this.getModuleContext().beginPath();
        this.getModuleContext().arc(
          this.getMouseCursor(event, this.paletteElement).x,
          this.getMouseCursor(event, this.paletteElement).y,
          10/2, 0, Math.PI * 2
        );
        this.getModuleContext().stroke();

        this.getModuleContext().strokeStyle = "#FFFFFF";
        this.getModuleContext().beginPath();
        this.getModuleContext().arc(
          this.getMouseCursor(event, this.paletteElement).x,
          this.getMouseCursor(event, this.paletteElement).y,
          10/2+1, 0, Math.PI * 2
        );
        this.getModuleContext().stroke();
    }

    getPaletteColor(event){
        let pixel = this.getModuleContext().getImageData(
            (event.clientX - this.paletteElement.getBoundingClientRect().left), 
            (event.clientY - this.paletteElement.getBoundingClientRect().top),
            1,
            1
        )['data']

        return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
    }

    startPaletteColor(event){
        if(!this.colorSelecting){
            this.colorSelecting = true
            this.setColor(event)
        }
    }

    setColor(event){
        if (this.colorSelecting) {
            document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = this.getPaletteColor(event)
            this.drawingModule.foregroundColor = this.getPaletteColor(event)
            this.drawingModule.setDrawColor(this.drawingModule.foregroundColor)
            this.drawingModule.setDrawStyle()
            this.renderPalette(this.color)
            this.renderPaletteCursor(event)
        }
    }

    stopPaletteColor(event){
        if (this.colorSelecting) {
            this.colorSelecting = false
        }
    }
}

class HueModule extends PaletteModule{
    colorSelecting = false

    constructor(hueElement, paletteElement, drawingModule){
        super(paletteElement, drawingModule)
        this.hueElement = hueElement
    }

    init(){
        let paletteHue = this.hueElement
        this.hueContext = paletteHue.getContext("2d")
        this.hueContext.canvas.height = 250
        let hue = this.hueContext.createLinearGradient(0,0,0,this.hueContext.canvas.height)
        hue.addColorStop(0,"#ff0000")
        hue.addColorStop(0.16,"#ff00ff")
        hue.addColorStop(0.32,"#0000ff")
        hue.addColorStop(0.48,"#00ffff")
        hue.addColorStop(0.64,"#00ff00")
        hue.addColorStop(0.80,"#ffff00")
        hue.addColorStop(1,"#ff0000")
        this.hueContext.fillStyle = hue
        this.hueContext.fillRect(0,0, this.hueContext.canvas.width, this.hueContext.canvas.height)
        this.setMouseEventsPalette()
        this.setMouseEvents()
        this.PaletteInit()
        this.renderPalette(this.color)
    }

    getHue(event){
        let pixel = this.hueContext.getImageData(
            15, 
            (event.clientY - this.hueElement.getBoundingClientRect().top),
            1,
            1
        )['data']
        let rgb = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`
        super.color = rgb
        super.renderPalette(this.color)
    }

    setMouseEvents(){
        this.hueElement.addEventListener("touchstart", event => this.startColor(event))
        this.hueElement.addEventListener("touchmove", event => this.getColor(event))
        this.hueElement.addEventListener("mousedown", event => this.startColor(event))
        this.hueElement.addEventListener("mousemove", event => this.getColor(event))
        this.hueElement.addEventListener("touchend", event => this.stopColor(event))
        this.hueElement.addEventListener("mouseup", event => this.stopColor(event))
        this.hueElement.addEventListener("mouseout", event => this.stopColor(event))
    }

    startColor(event){
        if(!this.colorSelecting){
            this.colorSelecting = true
            this.getColor(event)
        }
    }

    getColor(event){
        if(this.colorSelecting){
            this.getHue(event)
        }
    }

    stopColor(event){
        if (this.colorSelecting) {
            this.colorSelecting = false
        }
    }
}

class LayersModule{
    layers = [[]]
    currentLayer = 0
    strokeAmount = 0

    constructor(canvasLayerElement, layerListElement){
        this.canvasLayerElement = canvasLayerElement
        this.layerListElement = layerListElement
    }

    addNewLayer(){
        this.layers.push([])
    }

    removeLayer(index){
        this.layers[index].splice(index, 1)
    }

    moveLayer(oldPos, newPos){
        this.layers.splice(newPos, 0, this.layers.splice(oldPos, 1)[0]);
    }

    renderLayers(){

    }
}

class ProxyModule{
    constructor(WebSocket, drawingModule, exportButton){
        this.webSocket = WebSocket
        this.drawingModule = drawingModule
        this.exportButton = exportButton
    }

    componentToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
      
    rgbToHex(r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    getPixel(x, y, canvasContext){
        let pixel = canvasContext.getImageData(
            x,
            y,
            1,
            1
        )['data']

        return this.rgbToHex(pixel[0], pixel[1], pixel[2])
    }

    dataCombine(options){
        return `42[2,7,{"t":${options.turn}, "d": ${options.press}, "v":[1,${options.pressNumber},["${options.color}",${options.width/2},${options.transparency}],${options.posArray}]}]`
    }

    init(){
        this.setMouseEvents()
    }

    setMouseEvents(){
        this.exportButton.addEventListener("click", event => this.sendCanvas(this.drawingModule.canvasList))
    }

    /*
    async sendCanvas(canvasList){
        canvasList.forEach(layer => {
            layer.forEach((options) => {
                this.webSocket.send(this.dataCombine(options))
            })
        });

        this.finishRound()
    }
    */

    async sendCanvas(canvasList) {
        for (const layer of canvasList) {
            let counter = 0
            for (const options of layer) {
                this.exportButton.textContent = Math.round(counter/(layer.length) * 100)
                counter++
                if (counter % 15 == 0) {
                    await this.delay(1500);
                    this.webSocket.send(this.dataCombine(options)); 
                }else{
                    this.webSocket.send(this.dataCombine(options)); 
                }
            }
        }
        this.finishRound();
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

        /*
        for (let y = 0; y != 100; y++) {
            await timer(50)
            for (let x = 0; x != 100; x++) {
                if (this.getPixel(x, y, canvasContext) != "#ffffff") {
                    console.log("something sending...");
                this.webSocket.send(this.dataCombine({
                    turn : 0,
                    press : 1,
                    pressNumber : pressNumber,
                    xPos : x,
                    yPos : y,
                    canvasContext : canvasContext
                }))
                this.webSocket.send(this.dataCombine({
                    turn : 0,
                    press : 3,
                    pressNumber : pressNumber,
                    xPos : x,
                    yPos : y,
                    canvasContext : canvasContext
                }))
                }

            }
            
        }
        */

        //this.webSocket.send(`42[2,7,{"t":0,"d":1,"v":[1,1,["#000000",6,1],[196,208]]}]`)
        //this.webSocket.send(`42[2,7,{"t":0,"d":3,"v":[1,1,["#000000",1,1],[196,208],[195,209],[195,210],[195,211],[195,211],[195,212],[195,213],[194,213],[194,214],[194,215],[194,215],[193,215],[193,216],[193,217],[193,219],[193,220],[193,220],[192,229],[192,229],[191,230],[191,238],[191,239],[191,239],[191,247],[191,248],[191,248],[193,257],[193,258],[194,258],[198,265],[198,266],[198,267],[198,267],[203,276],[204,276],[205,277],[207,280],[207,281],[211,286],[212,286],[212,287],[222,298],[222,299],[222,300],[232,309],[233,309],[235,309],[245,319],[246,319],[247,320],[257,327],[259,328],[259,328],[269,333],[269,333],[270,333],[279,337],[281,337],[282,338],[292,341],[293,342],[294,342],[308,344],[309,344],[310,344],[325,347],[326,347],[327,347],[342,348],[343,348],[344,348],[359,348],[361,348],[363,348],[376,347],[377,347],[377,347],[400,343],[400,343],[401,343],[402,342],[403,342],[421,337],[422,336],[423,336],[430,331],[430,330],[431,329],[432,329],[438,323],[438,323],[438,322],[443,314],[444,314],[444,314],[447,306],[448,305],[448,305],[452,299],[452,297],[452,296],[455,292],[455,291],[455,291],[457,282],[457,281],[457,281],[457,270],[457,269],[457,268],[457,267],[457,261],[457,260],[457,259],[457,258],[456,258],[456,258],[456,257],[456,256],[456,255],[455,255],[455,254],[455,253],[455,253],[455,252],[455,251],[454,250],[454,249],[454,248],[453,248],[453,248],[453,247],[453,246],[452,246],[452,245],[452,244],[452,243],[452,242],[452,241],[452,240],[451,240],[451,239],[451,239],[451,238],[450,238]]}]`)


    finishRound(){
        this.webSocket.send("42[2,15,true]")
    }
}

/*
class ModificationModule{
    keysPressed = {}
    constructor(drawingModule, bindsContainer){
        this.drawingModule = drawingModule
        this.bindsContainer = bindsContainer
    }

    init(){
        this.addEventListeners()
    }

    addEventListeners(){
        window.addEventListener("keydown", event => this.keypress(event))
        window.addEventListener("keyup", event => this.keyup(event))

    }

    keypress(event){
        this.keysPressed[event.code] = true;
        this.undoHandler(event)
        this.handleKeydown(event)
    }

    keyup(event){
        delete this.keysPressed[event.key];
    }

    handleKeydown(event){
        if (event.repeat) return;
            switch (event.code) {
                case this.bindsContainer.brushKey:
                    this.drawingModule.drawColor = this.drawingModule.foregroundColor
                    break

                case this.bindsContainer.eraserKey:
                    this.drawingModule.drawColor = "#ffffff"
                    break

                case this.bindsContainer.changeKey:
                    this.drawingModule.foregroundColor = [this.drawingModule.backgroundColor, this.drawingModule.backgroundColor = this.drawingModule.foregroundColor][0]
                    document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = [document.querySelectorAll(".PMFast__color")[1].style.backgroundColor, document.querySelectorAll(".PMFast__color")[1].style.backgroundColor = document.querySelectorAll(".PMFast__color")[0].style.backgroundColor][0]
                    this.drawingModule.drawColor = this.drawingModule.foregroundColor
                }

            event.preventDefault()
            event.stopImmediatePropagation()
    }

    undoHandler(event){
        if (this.keysPressed["ControlLeft"] && event.code == 'KeyZ') {
            if (this.drawingModule.strokeAmount > 0) {
                this.drawingModule.canvasList[0].pop();
                this.drawingModule.canvasList[0].pop();
                this.drawingModule.strokeAmount--;
                this.drawingModule.refresh(this.drawingModule.canvasList[0])
                event.preventDefault()
                event.stopImmediatePropagation()
            }
        }
    }
}
*/

class ModificationModule {
    constructor(drawingModule, bindsContainer, window) {
        this.drawingModule = drawingModule;
        this.bindsContainer = bindsContainer;
        this.keysPressed = {};
        this.keypress = this.keypress.bind(this)
        this.keyup = this.keyup.bind(this)
    }

    init(newDrawingModule) {
        this.drawingModule = newDrawingModule || this.drawingModule;
        this.addEventListeners()
    }

    addEventListeners() {
        document.onkeydown = this.keypress
        document.onkeyup = this.keyup
    }

    keypress(event){
        this.keysPressed[event.code] = true;
        this.undoHandler(event);
        this.handleKeydown(event);
    }

    keyup(event){
        delete this.keysPressed[event.code];
    }

    handleKeydown(event) {
        if (event.repeat) return;

        switch (event.code) {
            case this.bindsContainer.brushKey:
                this.drawingModule.drawColor = this.drawingModule.foregroundColor;
                break;

            case this.bindsContainer.eraserKey:
                this.drawingModule.drawColor = "#ffffff";
                console.log(this);
                break;

            case this.bindsContainer.changeKey:
                this.swapColors();
                break;

            case this.bindsContainer.colorPickerKey:
                this.drawingModule.drawColor = this.drawingModule.getColor()
                this.drawingModule.foregroundColor = this.drawingModule.getColor()
                document.querySelectorAll(".PMFast__color")[0].style.backgroundColor = this.drawingModule.foregroundColor
                break

            case this.bindsContainer.mirrorKey:
                this.drawingModule.mirrorCanvas()
                break

            default:
                return; // Если клавиша не соответствует ни одному из случаев, выходим из функции
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    }

    swapColors() {
        const { drawingModule } = this;
        const [foregroundColor, backgroundColor] = [drawingModule.foregroundColor, drawingModule.backgroundColor];

        console.log("swap color", this);

        drawingModule.foregroundColor = backgroundColor;
        drawingModule.backgroundColor = foregroundColor;
        drawingModule.drawColor = drawingModule.foregroundColor;

        const colorElements = document.querySelectorAll(".PMFast__color");
        if (colorElements.length >= 2) {
            const [firstColor, secondColor] = [colorElements[0].style.backgroundColor, colorElements[1].style.backgroundColor];
            colorElements[0].style.backgroundColor = secondColor;
            colorElements[1].style.backgroundColor = firstColor;
        }
    }

    undoHandler(event) {
        if (this.keysPressed["ControlLeft"] && event.code === 'KeyZ') {
            const { drawingModule } = this;
            const { strokeAmount, canvasList, refresh } = drawingModule;
            console.log("undo", this);
            if (strokeAmount > 0) {
                canvasList[0].pop();
                canvasList[0].pop();
                drawingModule.strokeAmount--;

                this.drawingModule.refresh(canvasList[0]);

                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }
    }
}

/*
class ModificationModule {
    constructor(drawingModule, bindsContainer) {
        this.drawingModule = drawingModule;
        this.bindsContainer = bindsContainer;
        this.keysPressed = {};
    }

    init() {
        this.addEventListeners();
    }

    addEventListeners() {
        window.removeEventListener("keydown", event => this.keypress(event))
        window.removeEventListener("keyup", event => this.keyup(event))

        window.addEventListener("keydown", event => this.keypress(event));
        window.addEventListener("keyup", event => this.keyup(event));
    }

    keypress(event) {
        this.keysPressed[event.code] = true;
        this.undoHandler(event);
        this.handleKeydown(event);
    }

    keyup(event) {
        delete this.keysPressed[event.code];
    }

    handleKeydown(event) {
        if (event.repeat) return;

        const { brushKey, eraserKey, changeKey } = this.bindsContainer;
        const { drawingModule } = this;

        switch (event.code) {
            case brushKey:
                drawingModule.drawColor = drawingModule.foregroundColor;
                break;

            case eraserKey:
                drawingModule.drawColor = "#ffffff";
                console.log(drawingModule);
                break;

            case changeKey:
                this.swapColors();
                break;

            default:
                return; // Если клавиша не соответствует ни одному из случаев, выходим из функции
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    }

    swapColors() {
        const { drawingModule } = this;
        const [foregroundColor, backgroundColor] = [drawingModule.foregroundColor, drawingModule.backgroundColor];

        drawingModule.foregroundColor = backgroundColor;
        drawingModule.backgroundColor = foregroundColor;
        drawingModule.drawColor = drawingModule.foregroundColor;

        const colorElements = document.querySelectorAll(".PMFast__color");
        if (colorElements.length >= 2) {
            const [firstColor, secondColor] = [colorElements[0].style.backgroundColor, colorElements[1].style.backgroundColor];
            colorElements[0].style.backgroundColor = secondColor;
            colorElements[1].style.backgroundColor = firstColor;
        }
    }

    undoHandler(event) {
        if (this.keysPressed["ControlLeft"] && event.code === 'KeyZ') {
            const { drawingModule } = this;
            if (drawingModule.strokeAmount > 0) {
                drawingModule.canvasList[0].pop();
                drawingModule.canvasList[0].pop();
                drawingModule.strokeAmount--;
                drawingModule.refresh(drawingModule.canvasList[0]);
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        }
    }
}
*/

class BrushModule{
    constructor(brushSettingsElement, drawingModule){
        this.brushSettingsElement = brushSettingsElement
        this.drawingModule = drawingModule
    }

    init(){
        this.setEvents()
    }

    setEvents(){
        this.brushSettingsElement.querySelector("#brushRadiusValue").addEventListener("input", event => this.brushSizeModifier(event))
        this.brushSettingsElement.querySelector("#brushRadiusInput").addEventListener("change", event => this.brushSizeModifier(event))
        this.brushSettingsElement.querySelector("#brushTransparencyValue").addEventListener("input", event => this.brushTransparencyModifier(event))
        this.brushSettingsElement.querySelector("#brushTransparencyInput").addEventListener("change", event => this.brushTransparencyModifier(event))
    }

    brushSizeModifier(event){
        this.drawingModule.drawWidth = event.srcElement.value.toString()
        this.drawingModule.setDrawStyle()
        let value = event.srcElement.value
        this.brushSettingsElement.querySelector("#brushRadiusValue").value = value
        this.brushSettingsElement.querySelector("#brushRadiusInput").value = value + " пикс."
    }

    brushTransparencyModifier(event){
        this.drawingModule.drawTransparency = (event.srcElement.value/100).toString()
        this.drawingModule.setDrawStyle()
        let value = event.srcElement.value
        this.brushSettingsElement.querySelector("#brushTransparencyValue").value = value
        this.brushSettingsElement.querySelector("#brushTransparencyInput").value = value + "%"
    }
}

/*
42[2,7,{"t":0,"d":1,"v":[1,1,["#000000",6,1],[2,2]]}]
42[2,7,{"t":0,"d":3,"v":[1,1,["#000000",6,1],[2,2]]}]

42[2,7,{"t":0, "d": 3, "v":[1,1,["#000000",0.5,1],[282, 233.5]]}


42[2, 7, {t: 0, d: 1, v: [1, 17, ["#000000", 6, 1], [567, 61]]}]
42[2, 7, {t: 0, d: 1, v: [1, 16, ["#000000", 4, 1], [174, 161.5]]}]
*/
