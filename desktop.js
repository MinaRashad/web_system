// desktop.js
// Canvas-based desktop implementation

// Canvas setup
const canvas = document.getElementById('desktopCanvas');
const ctx = canvas.getContext('2d');
let targetedIcon = null;
let highlightedIcon = null;
let current_context = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastClickTime = 0;
const doubleClickDelay = 300; // ms

// Set canvas dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 30; // Account for status bar
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Icon class
class DesktopIcon {
    constructor(name, link, position, icon, type = "file", contents = []) {
        this.name = name;
        this.link = link;
        this.position = position;
        this.icon = icon || (type === "folder" ? "📁" : "📄");
        this.type = type;
        this.contents = contents;
        this.width = 80;
        this.height = 100;
        this.highlighted = false;
    }

    isPointInside(x, y) {
        return (
            x >= this.position[0] &&
            x <= this.position[0] + this.width &&
            y >= this.position[1] &&
            y <= this.position[1] + this.height
        );
    }

    draw(ctx) {
        // Draw highlight if selected
        if (this.highlighted) {
            ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
            ctx.fillRect(this.position[0], this.position[1], this.width, this.height);
        }

        // Draw icon
        ctx.font = '40px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.icon,
            this.position[0] + this.width / 2,
            this.position[1] + 50
        );

        // Draw text with shadow
        ctx.font = '14px monospace';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        // Handle text wrapping
        const words = this.name.split(' ');
        let line = '';
        let y = this.position[1] + 70;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > this.width - 10 && i > 0) {
                ctx.fillText(line, this.position[0] + this.width / 2, y);
                line = words[i] + ' ';
                y += 18;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, this.position[0] + this.width / 2, y);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
}

// Desktop state
let desktopIcons = [];
let directory_tree = JSON.parse(localStorage.getItem('directory_tree'));

// Initialize directory tree if it doesn't exist
if (!directory_tree) {
    directory_tree = {
        "Desktop": {
            "contents": [
                {
                    "name": "Fun Stuff",
                    "type": "folder",
                    "position": [10, 10],
                    "icon": "📁",
                    "contents": []
                }
            ]
        }
    };

    // Default icons
    const defaultIcons = [
        { name: "Knowledge Cards", link: "KnowledgeCards.html", icon: "🧠" },
        { name: "Piano", link: "piano.html", icon: "🎹" },
        { name: "Chess", link: "chess.html", icon: "♟" },
        { name:"Checkers", link: "checkers.html", icon: "🔲" },
        { name: "Solar System", link: "solarSystem.html", icon: "🪐" },
        { name: "Hearing Test", link: "hearing_test.html", icon: "👂" },
        { name: "Gardening Game", link: "gardening_game.html", icon: "🌱" },
        { name: "HACKIT", link: "HACKIT/index.html", icon: "🔍" },
        { name: "Journal", link: "https://minarashad.github.io/AI-therapist/", icon: "📓" },
        { name: "Clock", link: "clock.html", icon: "🕒" },
        { name: "Ladder", link: "ladder.html", icon: "🪜" }
    ];

    defaultIcons.forEach(icon => {
        directory_tree["Desktop"]["contents"][0]["contents"].push({
            name: icon.name,
            link: icon.link,
            position: [
                Math.floor(Math.random() * (canvas.width - 100)),
                Math.floor(Math.random() * (canvas.height - 120))
            ],
            icon: icon.icon,
            type: "file"
        });
    });

    localStorage.setItem('directory_tree', JSON.stringify(directory_tree));
}

// Load desktop icons from directory tree
function loadDesktopIcons() {
    desktopIcons = [];
    const desktop_contents = directory_tree["Desktop"]["contents"];
    
    desktop_contents.forEach(item => {
        desktopIcons.push(new DesktopIcon(
            item.name,
            item.link,
            item.position,
            item.icon,
            item.type,
            item.contents
        ));
    });
}

// Draw all desktop icons
function drawDesktop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw desktop background (gradient handled by CSS)
    
    // Draw icons
    desktopIcons.forEach(icon => {
        icon.draw(ctx);
    });
    
    // Request next frame
    requestAnimationFrame(drawDesktop);
}

// Update the time in the status bar
function updateStatus() {
    // Time
    const timeElement = document.getElementById('time');
    const now = new Date();
    const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    timeElement.textContent = now.toLocaleString(undefined, options);

    // Battery
    const batteryProgress = document.querySelector('.battery-progress');
    const batteryText = document.querySelector('.battery-text');

    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            const level = battery.level * 100;
            batteryText.textContent = `${Math.round(level)}%`;
            batteryProgress.style.width = `${level}%`;
        });
    }
}

// Fullscreen Functionality
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Mouse event handlers
function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

// handle when mouse leaves the canvas
canvas.addEventListener('mouseleave', () => {
    // Clear previous highlight
    desktopIcons.forEach(icon => {
        icon.highlighted = false;
    });
    isDragging = false;
})
canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(canvas, e);
    
    // Clear previous highlight
    desktopIcons.forEach(icon => {
        icon.highlighted = false;
    });
    
    // Check if clicked on an icon
    for (let i = desktopIcons.length - 1; i >= 0; i--) {
        if (desktopIcons[i].isPointInside(pos.x, pos.y)) {
            targetedIcon = desktopIcons[i];
            targetedIcon.highlighted = true;
            isDragging = true;
            dragOffsetX = pos.x - targetedIcon.position[0];
            dragOffsetY = pos.y - targetedIcon.position[1];
            
            // Check for double click
            const currentTime = new Date().getTime();
            if (currentTime - lastClickTime < doubleClickDelay) {
                handleDoubleClick(targetedIcon);
            }
            lastClickTime = currentTime;
            
            break;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging && targetedIcon && targetedIcon.position) {
        const pos = getMousePos(canvas, e);
        targetedIcon.position[0] = pos.x - dragOffsetX;
        targetedIcon.position[1] = pos.y - dragOffsetY;
        
        // Update position in directory tree
        updateIconPosition(targetedIcon);
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (isDragging && targetedIcon) {
        const pos = getMousePos(canvas, e);
        
        // Check if dropped on a folder
        if (targetedIcon.type === "file") {
            for (const icon of desktopIcons) {
                if (icon.type === "folder" && 
                    icon !== targetedIcon && 
                    icon.isPointInside(pos.x, pos.y)) {
                    
                    // Move file to folder
                    moveIconToFolder(targetedIcon, icon);
                    break;
                }
            }
        }
    }
    
    isDragging = false;
});

const contextMenu = document.getElementById('contextMenu');
let clipboardItem = null; // For cut/paste functionality

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const pos = getMousePos(canvas, e);
    
    current_context = directory_tree["Desktop"];

    // Check if right-clicked on an icon
    let clickedOnIcon = false;
    for (let i = desktopIcons.length - 1; i >= 0; i--) {
        if (desktopIcons[i].isPointInside(pos.x, pos.y)) {
            targetedIcon = desktopIcons[i];
            clickedOnIcon = true;
            
            // set current_context to desktop
            break;
        }
    }
    
    // Show context menu
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    
    // Show/hide delete button
    const deleteButton = document.getElementById('deleteAppButton');
    if (clickedOnIcon) {
        deleteButton.style.display = 'block';
        // Check if app can be deleted
        let apps = JSON.parse(localStorage.getItem('apps')) || [];
        let app = apps.filter(app => app.name === targetedIcon.name)[0];
        deleteButton.disabled = !app;
        
        // Show cut button
        document.getElementById('cutButton').style.display = 'block';
    } else {
        deleteButton.style.display = 'none';
        document.getElementById('cutButton').style.display = 'none';
    }
    
    // Show/hide paste button based on clipboard content
    document.getElementById('pasteButton').style.display = clipboardItem ? 'block' : 'none';
});

// Add event listener for context menu in folder windows
document.addEventListener('contextmenu', (e) => {
    // Check if right-click happened inside a folder window
    const folderWindow = e.target.closest('.folder-window');
    if (folderWindow) {
        e.preventDefault();
        
        // Check if clicked on a file icon
        const fileIcon = e.target.closest('.file-icon');
        if (fileIcon) {
            console.log("Clicked on file icon:", fileIcon);
            targetedIcon = {
                name: fileIcon.dataset.name,
                link: fileIcon.dataset.link,
                folderName: folderWindow.dataset.name,
                icon: fileIcon.dataset.icon,
                type: fileIcon.dataset.type || "file"
            };
            document.getElementById('cutButton').style.display = 'block';
            document.getElementById('deleteAppButton').style.display = 'block';
        } else {
            document.getElementById('cutButton').style.display = 'none';
            document.getElementById('deleteAppButton').style.display = 'none';
        }
        
        // Show context menu
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';

        // if inside a folder, set current_context to folder contents
        current_context = directory_tree["Desktop"]["contents"].find(
            item => item.name === folderWindow.dataset.name
        );
        
        // Show/hide paste button based on clipboard content
        document.getElementById('pasteButton').style.display = clipboardItem ? 'block' : 'none';
    }
});

// Hide context menu when clicking outside
document.addEventListener('click', () => {
    hideContextMenu();
});

function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}

// Cut function
function cutItem() {
    if (targetedIcon) {
        console.log("Cutting item:", targetedIcon.name);
        clipboardItem = {
            name: targetedIcon.name,
            link: targetedIcon.link,
            icon: targetedIcon.icon || "📄",
            type: targetedIcon.type || "file",
            sourceFolder: targetedIcon.folderName || "Desktop"
        };
        
        hideContextMenu();
    }
}

// Paste function
function pasteItem(e) {
    if (!clipboardItem) return;

    // Check if the target is a folder
    if (current_context.type && current_context.type == "folder" && 
        clipboardItem.type == "folder"
    ) {
        // we need to check if the we are pasting a directory into itself
        // find the first common parent of source and target
        // if the first common parent is the target, we need to stop
        if(current_context.name == clipboardItem.name) {
            alert("You cannot paste a folder into itself.");
            return;
        }
        console.log("Moving folder:", current_context.name, clipboardItem.sourceFolder);

    }
    // if moving a folder, get the contents
    contents = []
    if(clipboardItem.type == "folder") {
        contents = directory_tree["Desktop"]["contents"].find(
            item => item.name === clipboardItem.name
        ).contents;
    }
    clipboardItem.contents = contents;
    console.log(contents)
    
    if(clipboardItem.type == "folder") {
        if(current_context.type == "folder") current_context.contents = current_context.contents || [];
        current_context.contents.push({
            name: clipboardItem.name,
            link: "",
            icon: clipboardItem.icon,
            type: "folder",
            position: [
                e.clientX - 40, // Center the icon
                e.clientY - 50
            ],
            contents: clipboardItem.contents
        });
        console.log(current_context)
    }
    else{
    current_context.contents.push({
        name: clipboardItem.name,
        link: clipboardItem.link,
        icon: clipboardItem.icon,
        type: clipboardItem.type || "file",
        position: [
            e.clientX - 40, // Center the icon
            e.clientY - 50
        ]
    });
}


    // Remove from source folder if cut
    if (clipboardItem.sourceFolder) {
        const sourceFolder = directory_tree["Desktop"]["contents"].find(
            item => item.name === clipboardItem.sourceFolder
        );
        if (sourceFolder) {
            sourceFolder.contents = sourceFolder.contents.filter(
                item => item.name !== clipboardItem.name
            );
        }
    }
    // Remove from desktop if cut
    if (clipboardItem.sourceFolder === "Desktop") {
        directory_tree["Desktop"]["contents"] = directory_tree["Desktop"]["contents"].filter(
            item => item.name !== clipboardItem.name
        );
    }
    

    // Update local storage
    setTree();

    loadDesktopIcons();
    drawDesktop();
    // refresh folder window contents
    refreshFolderWindow(current_context.name);
    refreshFolderWindow(clipboardItem.sourceFolder);
    

    // Clear clipboard
    clipboardItem = null;
    hideContextMenu();
}

// Refresh folder window contents
function refreshFolderWindow(folderName) {
    const folderWindow = document.querySelector(`.folder-window[data-name="${folderName}"]`);
    if (folderWindow) {
        const folderContent = folderWindow.querySelector('.folder-content');
        folderContent.innerHTML = '';
        
        const folderData = directory_tree["Desktop"]["contents"].find(item => item.name === folderName);
        if (folderData && folderData.contents) {
            folderData.contents.forEach((item, index) => {
                const icon = document.createElement('div');
                icon.classList.add('file-icon');
                icon.dataset.name = item.name;
                icon.dataset.link = item.link;
                icon.dataset.icon = item.icon;
                icon.dataset.type = item.type || "file";
                
                const iconSpan = document.createElement('span');
                iconSpan.classList.add('icon-content');
                iconSpan.textContent = item.icon;
                icon.appendChild(iconSpan);
                
                const nameSpan = document.createElement('span');
                nameSpan.classList.add('file-name');
                nameSpan.textContent = item.name;
                icon.appendChild(nameSpan);
                
                // Add the icon to the folder window
                folderContent.appendChild(icon);
                
                // Double click event
                icon.addEventListener('dblclick', () => {
                    if (item.type === "folder") {
                        openFolder(item.name);
                    } else {
                        openAppInWindow(item.name, item.link, item.icon);
                    }
                });
            });
        }
    }
}

// Handle double click on icon
function handleDoubleClick(icon) {
    if (icon.type === "folder") {
        openFolder(icon.name);
    } else {
        openAppInWindow(icon.name, icon.link, icon.icon);
    }
}

// Open app in window instead of redirecting
function openAppInWindow(appName, appLink, appIcon) {
    // Create app window from template
    const folderWindowTemplate = document.getElementById('folderWindowTemplate');
    let appWindow = folderWindowTemplate.content.cloneNode(true);
    const appTitle = appWindow.querySelector('.folder-title');
    const appHeader = appWindow.querySelector('.folder-header');
    const appContent = appWindow.querySelector('.folder-content');
    
    // Set the title of the app window
    appTitle.textContent = appName;
    appWindow = appWindow.querySelector('.folder-window');
    appWindow.style.display = 'block';
    appWindow.style.left = '100px';
    appWindow.style.top = '100px';
    appWindow.style.zIndex = 100;
    appWindow.style.width = '400px';
    appWindow.style.height = '300px';
    appWindow.dataset.name = appName;
    appWindow.classList.add('app-window');
    
    // Create iframe for app content
    const iframe = document.createElement('iframe');
    iframe.src = appLink;
    appContent.appendChild(iframe);
    
    // Append the app window to the body
    document.body.appendChild(appWindow);
    
    // Add event listeners for dragging the window
    let offsetX, offsetY;
    let isDraggingWindow = false;
    
    appHeader.addEventListener('mousedown', (event) => {
        event.preventDefault();
        offsetX = event.clientX - appWindow.getBoundingClientRect().left;
        offsetY = event.clientY - appWindow.getBoundingClientRect().top;
        isDraggingWindow = true;
    });
    
    document.addEventListener('mousemove', (event) => {
        if (!isDraggingWindow) return;
        appWindow.style.left = (event.clientX - offsetX) + 'px';
        appWindow.style.top = (event.clientY - offsetY) + 'px';
    });
    
    appHeader.addEventListener('mouseup', () => {
        isDraggingWindow = false;
    });
    
    // Close button
    const closeButton = appWindow.querySelector('.folder-close');
    closeButton.addEventListener('click', () => {
        appWindow.remove();
    });
    
    // Minimize button
    const minimizeButton = appWindow.querySelector('.folder-minimize');
    minimizeButton.addEventListener('click', () => {
        appWindow.style.display = 'none';
    });
}

// Update icon position in directory tree
function updateIconPosition(icon) {
    directory_tree["Desktop"]["contents"] = directory_tree["Desktop"]["contents"].map(item => {
        if (item.name === icon.name) {
            item.position = icon.position;
        }
        return item;
    });
    
    setTree();
}

// Move icon to folder
function moveIconToFolder(icon, folder) {
    // Add to folder contents
    const folderData = directory_tree["Desktop"]["contents"].find(item => item.name === folder.name);
    if (folderData) {
        folderData.contents.push({
            name: icon.name,
            link: icon.link,
            position: [
                Math.floor(Math.random() * (canvas.width - 100)),
                Math.floor(Math.random() * (canvas.height - 120))
            ],
            icon: icon.icon,
            type: "file"
        });
        
        // Remove from desktop
        directory_tree["Desktop"]["contents"] = directory_tree["Desktop"]["contents"].filter(
            item => item.name !== icon.name
        );
        
        // Update local storage and reload icons
        setTree();
        refreshFolderWindow(folder.name);
        loadDesktopIcons();
    }
}

// Delete app
function deleteApp() {
    if (targetedIcon) {
        let apps = JSON.parse(localStorage.getItem('apps')) || [];
        let app = apps.filter(app => app.name === targetedIcon.name)[0];
        
        if (app) {
            // Remove from local storage
            apps = apps.filter(app => app.name !== targetedIcon.name);
            localStorage.setItem('apps', JSON.stringify(apps));
            
            // Remove from directory tree
            directory_tree["Desktop"]["contents"] = directory_tree["Desktop"]["contents"].filter(
                item => item.name !== targetedIcon.name
            );
            
            // Update local storage and reload icons
            setTree();
            loadDesktopIcons();
        }
    }
    
    hideContextMenu();
}

// Prompt functions
function showAddAppPrompt() {
    document.getElementById('addAppPrompt').style.display = 'block';
}

function hideAddAppPrompt() {
    document.getElementById('addAppPrompt').style.display = 'none';
}

function addApp() {
    const name = document.getElementById('appName').value;
    const icon = document.getElementById('appIcon').value;
    const link = document.getElementById('appLink').value;
    
    if (name) {
        current_context["contents"].push({
            name: name,
            link: link,
            position: [
                Math.floor(Math.random() * (canvas.width - 100)),
                Math.floor(Math.random() * (canvas.height - 120))
            ],
            icon: icon || "📄",
            type: "file"
        });
        
        setTree();
        loadDesktopIcons();
        refreshFolderWindow(current_context.name);
        hideAddAppPrompt();
    }
}

function showCreateFolderPrompt() {
    document.getElementById('createFolderPrompt').style.display = 'block';
}

function hideCreateFolderPrompt() {
    document.getElementById('createFolderPrompt').style.display = 'none';
}

function createFolder() {
    const folderName = document.getElementById('folderName').value;
    
    if (folderName) {
        current_context["contents"].push({
            name: folderName,
            link: "",
            position: [
                Math.floor(Math.random() * (canvas.width - 100)),
                Math.floor(Math.random() * (canvas.height - 120))
            ],
            icon: "📁",
            type: "folder",
            contents: []
        });
        
        setTree();
        loadDesktopIcons();
        refreshFolderWindow(current_context.name);
        hideCreateFolderPrompt();
    }
}

// Open folder window
function openFolder(folderName) {
    const folderWindowTemplate = document.getElementById('folderWindowTemplate');
    let folderWindow = folderWindowTemplate.content.cloneNode(true);
    const folderTitle = folderWindow.querySelector('.folder-title');
    const folderHeader = folderWindow.querySelector('.folder-header');
    const folderContent = folderWindow.querySelector('.folder-content');
    
    // Set the title of the folder window
    folderTitle.textContent = folderName;
    folderWindow = folderWindow.querySelector('.folder-window');
    folderWindow.style.display = 'block';
    folderWindow.style.left = '100px';
    folderWindow.style.top = '100px';
    folderWindow.style.zIndex = 100;
    folderWindow.dataset.name = folderName;
    folderWindow.dataset.path = '';

    // find the path of the folder

    
    // Append the folder window to the body
    document.body.appendChild(folderWindow);
    
    // Add event listeners for dragging the window
    let offsetX, offsetY;
    let isDraggingWindow = false;
    
    folderHeader.addEventListener('mousedown', (event) => {
        event.preventDefault();
        offsetX = event.clientX - folderWindow.getBoundingClientRect().left;
        offsetY = event.clientY - folderWindow.getBoundingClientRect().top;
        isDraggingWindow = true;
    });
    
    document.addEventListener('mousemove', (event) => {
        if (!isDraggingWindow) return;
        folderWindow.style.left = (event.clientX - offsetX) + 'px';
        folderWindow.style.top = (event.clientY - offsetY) + 'px';
    });
    
    folderHeader.addEventListener('mouseup', () => {
        isDraggingWindow = false;
    });
    
    // Close button
    const closeButton = folderWindow.querySelector('.folder-close');
    closeButton.addEventListener('click', () => {
        folderWindow.remove();
    });
    
    // Minimize button
    const minimizeButton = folderWindow.querySelector('.folder-minimize');
    minimizeButton.addEventListener('click', () => {
        folderWindow.style.display = 'none';
    });
    
    // Add the contents of the folder
    const folderData = directory_tree["Desktop"]["contents"].find(item => item.name === folderName);
    if (folderData && folderData.contents) {
        folderData.contents.forEach((item, index) => {
            const icon = document.createElement('div');
            icon.classList.add('file-icon');
            icon.dataset.name = item.name;
            icon.dataset.link = item.link;
            icon.dataset.icon = item.icon;
            icon.dataset.type = item.type || "file";
            
            const iconSpan = document.createElement('span');
            iconSpan.classList.add('icon-content');
            iconSpan.textContent = item.icon;
            icon.appendChild(iconSpan);
            
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('file-name');
            nameSpan.textContent = item.name;
            icon.appendChild(nameSpan);
            
            // Set the position to be dependent on index
            icon.style.left = (index % 4) * 100 + 'px';
            icon.style.top = Math.floor(index / 4) * 100 + 50 + 'px';
            
            // Add the icon to the folder window
            folderContent.appendChild(icon);
            
            // Double click event
            icon.addEventListener('dblclick', () => {
                if (item.type === "folder") {
                    openFolder(item.name);
                } else {
                    openAppInWindow(item.name, item.link, item.icon);
                }
            });
        });
    }
}

// Save directory tree to local storage
function setTree() {
    localStorage.setItem('directory_tree', JSON.stringify(directory_tree));
}

// Initialize
loadDesktopIcons();
drawDesktop();
updateStatus();
setInterval(updateStatus, 1000);