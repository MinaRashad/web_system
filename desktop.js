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
        // Show cut button
        document.getElementById('cutButton').style.display = 'block';
        // Show delete button
        deleteButton.style.display = 'block';   
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

// Initialize
loadDesktopIcons();
drawDesktop();
updateStatus();
setInterval(updateStatus, 1000);
