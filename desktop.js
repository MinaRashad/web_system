// desktop.js
// Canvas-based desktop implementation
// Canvas setup
const canvas = document.getElementById('desktopCanvas');
const ctx = canvas.getContext('2d');

const contextMenu = document.getElementById('contextMenu');

let targetedIcon = null;
let highlightedIcon = null;
let current_context = null;
let clipboardItem = null; // For cut/paste functionality
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastClickTime = 0;
const doubleClickDelay = 300; // ms

// Selection variables
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionEnd = { x: 0, y: 0 };
let selectedIcons = [];
let ctrlKeyPressed = false;

window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// Desktop state
let desktopIcons = [];
let directory_tree = JSON.parse(localStorage.getItem('directory_tree'));

// Initialize directory tree if it doesn't exist
if (!directory_tree) {
    create_initial_tree()
}

// handle when mouse leaves the canvas
canvas.addEventListener('mouseleave', () => {
    // Clear previous highlight
    desktopIcons.forEach(icon => {
        icon.highlighted = false;
    });
    isDragging = false;
})

// Track Ctrl key state
document.addEventListener('keydown', (e) => {
    if (e.key === 'Control') {
        ctrlKeyPressed = true;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Control') {
        ctrlKeyPressed = false;
    }
});

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(canvas, e);
    
    // Start selection box if not clicking on an icon and not holding Ctrl
    let clickedOnIcon = false;
    
    // Check if clicked on an icon
    for (let i = desktopIcons.length - 1; i >= 0; i--) {
        if (desktopIcons[i].isPointInside(pos.x, pos.y)) {
            clickedOnIcon = true;
            
            // If Ctrl is pressed, toggle selection of this icon
            if (ctrlKeyPressed) {
                const iconIndex = selectedIcons.indexOf(desktopIcons[i]);
                if (iconIndex === -1) {
                    // Add to selection
                    selectedIcons.push(desktopIcons[i]);
                    desktopIcons[i].highlighted = true;
                } else {
                    // Remove from selection
                    selectedIcons.splice(iconIndex, 1);
                    desktopIcons[i].highlighted = false;
                }
            } else {
                // If not holding Ctrl, clear previous selection unless clicking on already selected icon
                const wasSelected = selectedIcons.includes(desktopIcons[i]);
                
                if (!wasSelected) {
                    // Clear previous selection
                    selectedIcons.forEach(icon => {
                        icon.highlighted = false;
                    });
                    selectedIcons = [desktopIcons[i]];
                    desktopIcons[i].highlighted = true;
                }
            }
            
            targetedIcon = desktopIcons[i];
            
            // Check for double click on the targeted icon
            const currentTime = new Date().getTime();
            if (currentTime - lastClickTime < doubleClickDelay && selectedIcons.length === 1) {
                handleDoubleClick(targetedIcon);
            }
            lastClickTime = currentTime;
            
            // Set up for dragging if we're not holding Ctrl
            if (!ctrlKeyPressed) {
                isDragging = true;
                dragOffsetX = pos.x - targetedIcon.position[0];
                dragOffsetY = pos.y - targetedIcon.position[1];
            }
            
            break;
        }
    }
    
    // If not clicking on an icon and not holding Ctrl, start selection box
    if (!clickedOnIcon && !ctrlKeyPressed) {
        // Clear previous selection
        selectedIcons.forEach(icon => {
            icon.highlighted = false;
        });
        selectedIcons = [];
        
        isSelecting = true;
        selectionStart = pos;
        selectionEnd = pos;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(canvas, e);
    
    if (isSelecting) {
        // Update selection box end point
        selectionEnd = pos;
        
        // Check which icons are in the selection box
        const selectionRect = getSelectionRect();
        
        desktopIcons.forEach(icon => {
            // Check if icon is in selection rectangle
            if (isIconInSelectionRect(icon, selectionRect)) {
                if (!icon.highlighted) {
                    icon.highlighted = true;
                    if (!selectedIcons.includes(icon)) {
                        selectedIcons.push(icon);
                    }
                }
            } else {
                if (icon.highlighted && !ctrlKeyPressed) {
                    icon.highlighted = false;
                    const index = selectedIcons.indexOf(icon);
                    if (index !== -1) {
                        selectedIcons.splice(index, 1);
                    }
                }
            }
        });
    } else if (isDragging && targetedIcon && targetedIcon.position) {
        // If dragging a single icon
        if (selectedIcons.length === 1) {
            targetedIcon.position[0] = pos.x - dragOffsetX;
            targetedIcon.position[1] = pos.y - dragOffsetY;
            
            // Update position in directory tree
            updateIconPosition(targetedIcon);
        } 
        // If dragging multiple icons
        else if (selectedIcons.length > 1 && selectedIcons.includes(targetedIcon)) {
            const deltaX = pos.x - (targetedIcon.position[0] + dragOffsetX);
            const deltaY = pos.y - (targetedIcon.position[1] + dragOffsetY);
            
            // Move all selected icons
            selectedIcons.forEach(icon => {
                icon.position[0] += deltaX;
                icon.position[1] += deltaY;
                
                // Update position in directory tree
                updateIconPosition(icon);
            });
            
            // Update drag offset to prevent acceleration
            dragOffsetX = pos.x - targetedIcon.position[0];
            dragOffsetY = pos.y - targetedIcon.position[1];
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    const pos = getMousePos(canvas, e);
    
    if (isSelecting) {
        isSelecting = false;
    } else if (isDragging && selectedIcons.length > 0) {
        // Check if dropped on a folder
        for (const icon of desktopIcons) {
            if (icon.type === "folder" && 
                !selectedIcons.includes(icon) && 
                icon.isPointInside(pos.x, pos.y)) {
                
                // Move all selected files to folder
                selectedIcons.forEach(selectedIcon => {
                    if (selectedIcon.type === "file") {
                        moveIconToFolder(selectedIcon, icon);
                    }
                });
                
                // Clear selection after moving
                selectedIcons = [];
                break;
            }
        }
    }
    
    isDragging = false;
});

document.addEventListener('mouseup', (e) => {
    if (isSelecting) {
        isSelecting = false;
        
        // Clear selection if no icons were selected
        if (selectedIcons.length === 0) {
            desktopIcons.forEach(icon => {
                icon.highlighted = false;
            });
        }
    }

})


canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const pos = getMousePos(canvas, e);
    
    current_context = directory_tree["Desktop"];

    // Check if right-clicked on an icon
    let clickedOnIcon = false;
    for (let i = desktopIcons.length - 1; i >= 0; i--) {
        if (desktopIcons[i].isPointInside(pos.x, pos.y)) {
            // If right-clicking on a selected icon, keep the selection
            if (!selectedIcons.includes(desktopIcons[i])) {
                // Clear previous selection
                selectedIcons.forEach(icon => {
                    icon.highlighted = false;
                });
                selectedIcons = [desktopIcons[i]];
                desktopIcons[i].highlighted = true;
            }
            
            targetedIcon = desktopIcons[i];
            clickedOnIcon = true;
            break;
        }
    }
    
    // If right-clicking on empty space, clear selection
    if (!clickedOnIcon) {
        selectedIcons.forEach(icon => {
            icon.highlighted = false;
        });
        selectedIcons = [];
    }
    
    // Show context menu
    contextMenu.style.display = 'block';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    
    // Show/hide buttons based on context
    const deleteButton = document.getElementById('deleteAppButton');
    const editButton = document.getElementById('editAppButton');
    const cutButton = document.getElementById('cutButton');
    
    if (clickedOnIcon) {
        // Only show edit button if a single file is selected
        if (selectedIcons.length === 1 && targetedIcon.type === "file") {
            editButton.style.display = 'block';
        } else {
            editButton.style.display = 'none';
        }
        cutButton.style.display = 'block';
        deleteButton.style.display = 'block';
    } else {
        editButton.style.display = 'none';
        deleteButton.style.display = 'none';
        cutButton.style.display = 'none';
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
            targetedIcon = {
                name: fileIcon.dataset.name,
                link: fileIcon.dataset.link,
                folderName: folderWindow.dataset.name,
                icon: fileIcon.dataset.icon,
                type: fileIcon.dataset.type || "file"
            };
            
            document.getElementById('cutButton').style.display = 'block';
            document.getElementById('deleteAppButton').style.display = 'block';
            
            // Show edit button only for files
            if (targetedIcon.type === "file") {
                document.getElementById('editAppButton').style.display = 'block';
            } else {
                document.getElementById('editAppButton').style.display = 'none';
            }
        } else {
            document.getElementById('cutButton').style.display = 'none';
            document.getElementById('deleteAppButton').style.display = 'none';
            document.getElementById('editAppButton').style.display = 'none';
        }
        
        // Show context menu
        contextMenu.style.display = 'block';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';

        // get the path of the window
        current_context = getObjectByPath(folderWindow.dataset.path);
        
        // Show/hide paste button based on clipboard content
        document.getElementById('pasteButton').style.display = clipboardItem ? 'block' : 'none';
    }
});

// Hide context menu when clicking outside
document.addEventListener('click', () => {
    hideContextMenu();
});

// Save directory tree to local storage
function setTree() {
    localStorage.setItem('directory_tree', JSON.stringify(directory_tree));
}

window.addEventListener('message', (event) => {
    console.log("Received message:", event.data);
    if (event.data.action === 'getTree'){
        console.log(event.source, event.origin)
        event.source.postMessage({
            action: 'getTree',
            tree: directory_tree
        }, "*");
    }
    if (event.data.action === 'setTree'){
        directory_tree = event.data.tree;
        setTree();
        loadDesktopIcons();
        refreshOpenedWindows();
    }
    if( event.data.action === 'command'){
        
        
        // Whitelist of allowed functions
        const allowedFunctions = {
            "deleteByPath": deleteByPath,
            "copyByPath": copyByPath,
            "moveByPath": moveByPath,
            "updateItemByPath": updateItemByPath,
            "addApp": addApp,
            "createFolder": createFolder,
            "showError": showError,
            "showMessage": showInfo
        }

        const functionName = event.data.functionName;
        const args = event.data.args;

        if (allowedFunctions[functionName]) {
            allowedFunctions[functionName](...args);
        }
        else{
            console.error(`Function ${functionName} is not allowed.`);
        }
        
        
    }
    
    if (event.data.action === 'createApp'){
        const name = event.data.appName;
        const icon = event.data.appIcon;
        const link = event.data.dataUrl;
        const target_path = event.data.target_path;

        console.log("Creating app:", name, icon, link, target_path);
        addApp(name, icon, link, target_path);

    }

    if (event.data.action === 'listDirectory'){
        let path = event.data.path;
        let directory = getObjectByPath(path);
        console.log(event.source, event.origin)
        event.source.postMessage({
            action: 'listDirectoy',
            directory: directory
        }, '*');
    }

    if (event.data.action === 'closeWindow') {
        // Find the app window that sent this message
        const appWindows = document.querySelectorAll('.app-window');
        for (const window of appWindows) {
            if (window.querySelector('iframe') && 
                window.querySelector('iframe').contentWindow === event.source) {
                window.remove();
                break;
            }
        }
    }

    setTree();
    loadDesktopIcons();
    // reload opened windows
    refreshOpenedWindows();
});

function openSettings() {
    const settingsWindow = document.getElementById('settingsWindow');
    settingsWindow.style.display = 'block';
    
    // Load current background settings
    loadBackgroundSettings();
}

function closeSettings() {
    document.getElementById('settingsWindow').style.display = 'none';
}

function toggleBackgroundOptions() {
    const backgroundType = document.getElementById('backgroundType').value;
    
    // Hide all options first
    document.getElementById('gradientOptions').style.display = 'none';
    document.getElementById('imageOptions').style.display = 'none';
    
    // Show relevant options
    if (backgroundType === 'gradient') {
        document.getElementById('gradientOptions').style.display = 'block';
    } else if (backgroundType === 'image') {
        document.getElementById('imageOptions').style.display = 'block';
    }
}

function loadBackgroundSettings() {
    // Load background settings from localStorage
    const backgroundSettings = JSON.parse(localStorage.getItem('backgroundSettings')) || {};
    
    if (backgroundSettings.type) {
        document.getElementById('backgroundType').value = backgroundSettings.type;
        
        if (backgroundSettings.type === 'gradient') {
            document.getElementById('gradientStart').value = backgroundSettings.gradientStart || '#000033';
            document.getElementById('gradientEnd').value = backgroundSettings.gradientEnd || '#330033';
            document.getElementById('gradientDirection').value = backgroundSettings.gradientDirection || 'to bottom';
        }
    }
    
    toggleBackgroundOptions();
}

function applyBackground() {
    const backgroundType = document.getElementById('backgroundType').value;
    let backgroundSettings = {
        type: backgroundType
    };
    
    if (backgroundType === 'default') {
        canvas.style.background = '';
        canvas.style.backgroundImage = '';
    } else if (backgroundType === 'gradient') {
        const startColor = document.getElementById('gradientStart').value;
        const endColor = document.getElementById('gradientEnd').value;
        const direction = document.getElementById('gradientDirection').value;
        
        canvas.style.background = '';
        canvas.style.backgroundImage = '';
        canvas.style.background = `linear-gradient(${direction}, ${startColor}, ${endColor})`;
        
        backgroundSettings.gradientStart = startColor;
        backgroundSettings.gradientEnd = endColor;
        backgroundSettings.gradientDirection = direction;
    } else if (backgroundType === 'image') {
        const fileInput = document.getElementById('backgroundImage');
        
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                canvas.style.background = '';
                canvas.style.backgroundImage = `url(${e.target.result})`;
                canvas.style.backgroundSize = 'cover';
                canvas.style.backgroundPosition = 'center';
                
                backgroundSettings.imageData = e.target.result;
                localStorage.setItem('backgroundSettings', JSON.stringify(backgroundSettings));
                console.log("Read image data:", backgroundSettings);
            };
            
            reader.readAsDataURL(fileInput.files[0]);
        } else if (backgroundSettings.imageData) {
            // If no new file but we have saved image data
            canvas.style.background = '';
            canvas.style.backgroundImage = `url(${backgroundSettings.imageData})`;
            canvas.style.backgroundSize = 'cover';
            canvas.style.backgroundPosition = 'center';
        }
    }
    
    // Save settings to localStorage
    console.log("Saving background settings:", backgroundSettings);
    localStorage.setItem('backgroundSettings', JSON.stringify(backgroundSettings));
    //window.location.reload();
}

function resetBackground() {
    // Remove background settings
    localStorage.removeItem('backgroundSettings');
    
    // Reset form
    document.getElementById('backgroundType').value = 'default';
    toggleBackgroundOptions();
    
    // Reset background
    canvas.style.background = '';
    canvas.style.backgroundImage = '';
}

// Apply saved background on page load
function applySavedBackground() {
    const backgroundSettings = JSON.parse(localStorage.getItem('backgroundSettings'));
    
    if (backgroundSettings) {
        if (backgroundSettings.type === 'gradient') {
            canvas.style.background = `linear-gradient(${backgroundSettings.gradientDirection}, ${backgroundSettings.gradientStart}, ${backgroundSettings.gradientEnd})`;
        } else if (backgroundSettings.type === 'image' && backgroundSettings.imageData) {
            canvas.style.backgroundImage = `url(${backgroundSettings.imageData})`;
            canvas.style.backgroundSize = 'cover';
            canvas.style.backgroundPosition = 'center';
        }
    }
}
// Helper function to get selection rectangle coordinates
function getSelectionRect() {
    return {
        x: Math.min(selectionStart.x, selectionEnd.x),
        y: Math.min(selectionStart.y, selectionEnd.y),
        width: Math.abs(selectionEnd.x - selectionStart.x),
        height: Math.abs(selectionEnd.y - selectionStart.y)
    };
}

// Helper function to check if an icon is inside the selection rectangle
function isIconInSelectionRect(icon, rect) {
    // Check if any part of the icon overlaps with the selection rectangle
    return (
        icon.position[0] < rect.x + rect.width &&
        icon.position[0] + icon.width > rect.x &&
        icon.position[1] < rect.y + rect.height &&
        icon.position[1] + icon.height > rect.y
    );
}

// Call on page load
window.addEventListener('load', applySavedBackground);

// Initialize
loadDesktopIcons();
drawDesktop();
updateStatus();
setInterval(updateStatus, 1000);
