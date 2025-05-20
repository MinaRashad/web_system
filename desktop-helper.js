/**
 * Structure of the directory tree:
 * {
 *  "<Folder Name>": {
 *       ".meta_data": {
 *          "path": "/<Folder Name>",
 *         "type": "folder",
 *         "position" ?: [x, y]
 *        },
 *       "<File 1>": {
 *           ".meta_data": {
 *              "path": "/<Folder Name>/<File 1>",
 *             "type": "file",
 *            "link": "<File Link>",
 *            "icon": "<File Icon>",
 *           "position" ?: [x, y]
 *           }
 *       },
 * }
 */


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

// Directory tree structure functions

function updateTree() {
    // Create backup of current tree
    const backupTree = JSON.parse(JSON.stringify(directory_tree));
    localStorage.setItem('directory_tree_backup', JSON.stringify(backupTree));
    
    // Clear current tree
    localStorage.removeItem('directory_tree');
    
    // Refresh page to initialize new tree
    location.reload();
}

function resetTree() {
    if (confirm("Are you sure you want to reset? This will delete all your files and folders.")) {
        localStorage.removeItem('directory_tree');
        localStorage.removeItem('directory_tree_backup');
        location.reload();
    }
}

function exportTree() {
    const treeData = JSON.stringify(directory_tree, null, 2);
    const blob = new Blob([treeData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'desktop_tree_backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importTree() {
    document.getElementById('importInput').click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTree = JSON.parse(e.target.result);
            
            merged_tree = mergeDirectoryTrees(directory_tree, importedTree)

            directory_tree = merged_tree;
            setTree();
            
            // Reload desktop
            loadDesktopIcons();
            refreshOpenedWindows();
            
            alert("Tree imported successfully!");
        } catch (error) {
            alert("Error importing tree: " + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
}

// Function to merge trees, giving priority to backup for files
function mergeDirectoryTrees(currentTree, backupTree) {
    // Start with the current tree
    const mergedTree = JSON.parse(JSON.stringify(currentTree));
    
    // Recursively merge folders and files
    function mergeNodes(current, backup, path) {
        // Process all items in backup
        Object.keys(backup).forEach(key => {
            // Skip metadata
            if (key === ".meta_data") return;
            
            const backupItem = backup[key];
            
            // If item doesn't exist in current tree, add it
            if (!current[key]) {
                current[key] = JSON.parse(JSON.stringify(backupItem));
                return;
            }
            
            // If both are folders, merge their contents
            if (current[key][".meta_data"].type === "folder" && 
                backupItem[".meta_data"].type === "folder") {
                mergeNodes(current[key], backupItem, path + "/" + key);
            } 
            // If both are files, prioritize backup
            else if (current[key][".meta_data"].type === "file" && 
                     backupItem[".meta_data"].type === "file") {
                current[key] = JSON.parse(JSON.stringify(backupItem));
            }
        });
    }
    
    // Start merging from root
    mergeNodes(mergedTree, backupTree, "");
    
    return mergedTree;
}


function create_initial_tree() {
    directory_tree = {
        "Desktop": {
            ".meta_data": {
                "path": "/Desktop",
                "type": "folder"
            }
        }
    };

    // Create Fun Stuff folder
    directory_tree["Desktop"]["Fun Stuff"] = {
        ".meta_data": {
            "path": "/Desktop/Fun Stuff",
            "type": "folder",
            "position":[
                Math.floor(100),
                Math.floor(120)
            ]
        }
    };

    // Default icons
    const defaultIcons = [
        { name: "Knowledge Cards", link: "./default_apps/KnowledgeCards.html", icon: "🧠" },
        { name: "Piano", link: "./default_apps/piano.html", icon: "🎹" },
        { name: "Chess", link: "./default_apps/chess.html", icon: "♟" },
        { name:"Checkers", link: "./default_apps/checkers.html", icon: "🔲" },
        { name: "Solar System", link: "./default_apps/solarSystem.html", icon: "🪐" },
        { name: "Hearing Test", link: "./default_apps/hearing_test.html", icon: "👂" },
        { name: "Gardening Game", link: "./default_apps/gardening_game.html", icon: "🌱" },
        { name: "HACKIT", link: "HACKIT/index.html", icon: "🔍" },
        { name: "Journal", link: "https://minarashad.github.io/AI-therapist/", icon: "📓" },
        { name: "Clock", link: "./default_apps/clock.html", icon: "🕒" },
        { name: "Ladder", link: "./default_apps/ladder.html", icon: "🪜" }

    ];

    defaultIcons.forEach(icon => {
        directory_tree["Desktop"]["Fun Stuff"][icon.name] = {
            ".meta_data": {
                "path": `/Desktop/Fun Stuff/${icon.name}`,
                "type": "file",
                "link": icon.link,
                "icon": icon.icon,
                "position": [
                    Math.floor(Math.random() * (canvas.width - 100)),
                    Math.floor(Math.random() * (canvas.height - 120))
                ]
            }
        };
    });

    // Add Developer and Terminal apps directly to the desktop
    directory_tree["Desktop"]["Developer"] = {
        ".meta_data": {
            "path": "/Desktop/Developer",
            "type": "file",
            "link": "./default_apps/developer.html",
            "icon": "👨‍💻",
            "position": [
                Math.floor(50),
                Math.floor(50)
            ]
        }
    };

    directory_tree["Desktop"]["Terminal"] = {
        ".meta_data": {
            "path": "/Desktop/Terminal",
            "type": "file",
            "link": "./default_apps/terminal.html",
            "icon": "🖥️",
            "position": [
                Math.floor(150),
                Math.floor(50)
            ]
        }
    };

    // Check for backup and merge if exists
    const backupTree = JSON.parse(localStorage.getItem('directory_tree_backup'));
    if (backupTree) {
        directory_tree = mergeDirectoryTrees(directory_tree, backupTree);

        // remove back up
        localStorage.removeItem('directory_tree_backup')
    }

    localStorage.setItem('directory_tree', JSON.stringify(directory_tree));    
}

function is_valid_name(name) {
    invalid_names = ["", ".meta_data"]
    invalid_characters = ["<", ">", ":", '"', "/", "\\", "|", "?", "*"]
    for(let i = 0; i < invalid_names.length; i++) {
        if(name === invalid_names[i]) {
            return false;
        }
    }
    for(let i = 0; i < invalid_characters.length; i++) {
        if(name.includes(invalid_characters[i])) {
            return false;
        }
    }
    return true;

}

function getObjectByPath(path) {
    const parts = path.split('/').filter(part => part);
    let current = directory_tree;
    
    for (const part of parts) {
        if (current[part]) {
            current = current[part];
        } else {
            return null;
        }
    }
    
    return current;
}

// Helper function to get parent folder by path
function getParentByPath(path) {
    const parts = path.split('/').filter(part => part);
    parts.pop(); // Remove the last part (file/folder name)
    
    if (parts.length === 0) return null; // No parent
    
    let current = directory_tree;
    for (const part of parts) {
        if (current[part]) {
            current = current[part];
        } else {
            return null;
        }
    }
    
    return current;
}

// Helper function to get name from path
function getNameFromPath(path) {
    const parts = path.split('/').filter(part => part);
    return parts[parts.length - 1];
}

function deleteByPath(path) {
    const name = getNameFromPath(path);
    const parent = getParentByPath(path);
    
    if (parent && parent[name]) {
        delete parent[name];
        setTree();
        loadDesktopIcons();
    }

    // Refresh folder window if in a folder
    if (parent && parent[".meta_data"].path !== "/Desktop") {
        refreshFolderWindow(parent[".meta_data"].path);
    }

    return parent;
}

function copyByPath(itemPath, targetPath) {
    target = getObjectByPath(targetPath);
    item = getObjectByPath(itemPath);
    itemName = getNameFromPath(itemPath);
    
    if (!target || !item) return;

    if (target['.meta_data'].type !== "folder") {
        showError(`${targetPath} is not a folder.`);
        console.log()
        return false;
    };

    if (target[itemPath]) {
        showError(`"${itemPath}" already exists.`);
        return false;
    }

    // Copy the item to target
    target[itemName] = JSON.parse(JSON.stringify(item));


    // Update path in metadata
    target[itemName][".meta_data"].path = `${targetPath}/${itemName}`;
    
    // If it's a folder, update paths of all children recursively
    if (item[".meta_data"].type === "folder") {
        updateChildPaths(target[itemName], `${targetPath}/${itemName}`);
    }
    
    // Update local storage
    setTree();
    
    // Refresh UI
    loadDesktopIcons();
    refreshFolderWindow(targetPath);

    return true

}

function moveByPath(itemPath, targetPath) {
    if(copyByPath(itemPath, targetPath))
    {
        deleteByPath(itemPath);
    }
}


// Delete app
function deleteItem() {
    path = current_context[".meta_data"].path + "/" + targetedIcon.name;

    const parent = deleteByPath(path);

    // Update local storage
    setTree();

    // Reload icons
    loadDesktopIcons();
    
    if(parent['.meta_data']['path'] !== "/Desktop") {
        refreshFolderWindow(parent[".meta_data"].path);
    }


    
    hideContextMenu();
}



function addApp(name, icon, link, currentPath) {
    if(is_valid_name(name) === false) {
        showError("Invalid app name.");
        return;
    }
    

    let context = getObjectByPath(currentPath);
    // Check if file/folder with same name already exists
    if (context[name]) {
        showError(`A file or folder named "${name}" already exists.`);
        return;
    }
    
    pos = getMousePos(canvas, event);

    if(!pos.x) pos.x = Math.floor(Math.random() * (canvas.width - 100));
    if(!pos.y) pos.y = Math.floor(Math.random() * (canvas.width - 100));

    


    // Add the new app
    context[name] = {
        ".meta_data": {
            "path": `${currentPath}/${name}`,
            "type": "file",
            "link": link,
            "icon": icon || "📄",
            "position": [
                Math.floor(pos.x),
                Math.floor(pos.y)
            ]
        }
    };
    
    
    setTree();
    loadDesktopIcons();
    
    // Refresh folder window if in a folder
    if (currentPath !== "/Desktop") {
        refreshFolderWindow(currentPath);
    }
    
    hideAddAppPrompt();
}



function createFolder(folderName, currentPath) {    
    if(is_valid_name(folderName) === false) {
        showError("Invalid folder name.");
        return;
    }


    
    // Get current folder path
    let context = getObjectByPath(currentPath);
    
    // Check if file/folder with same name already exists
    if (context[folderName]) {
        showError(`A file or folder named "${folderName}" already exists.`);
        return;
    }

    pos = getMousePos(canvas, event);
    
    // Add the new folder
    context[folderName] = {
        ".meta_data": {
            "path": `${currentPath}/${folderName}`,
            "type": "folder",
            "icon": "📁",
            "position": [
                Math.floor(pos.x),
                Math.floor(pos.y)
            ]
        }
    };
    
    setTree();
    loadDesktopIcons();
    
    // Refresh folder window if in a folder
    if (currentPath !== "/Desktop") {
        refreshFolderWindow(currentPath);
    }
    
    hideCreateFolderPrompt();
}



// GUI functions
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

// Helper function to update paths recursively
function updateChildPaths(folder, parentPath) {
    Object.keys(folder).forEach(key => {
        if (key === ".meta_data") return;
        
        const item = folder[key];
        if (item[".meta_data"]) {
            item[".meta_data"].path = `${parentPath}/${key}`;
            
            // If it's a folder, update its children too
            if (item[".meta_data"].type === "folder") {
                updateChildPaths(item, `${parentPath}/${key}`);
            }
        }
    });
}

// clipboard functionality
// Cut function
function cutItem() {
    if (targetedIcon) {
       
        // Get the item
        const item = current_context[targetedIcon.name];
        if (!item) return;
        
        clipboardItem = {
            name: targetedIcon.name,
            path: item[".meta_data"].path,
        };

        console.log(clipboardItem)
        
        hideContextMenu();
    }
}

// Paste function
function pasteItem(e) {
    if (!clipboardItem) return;
    
    // Determine target folder path
    let targetPath = current_context[".meta_data"].path;
    
    // Get source item
    const sourceItem = getObjectByPath(clipboardItem.path);
    if (!sourceItem) return;
    
    // Get target folder
    const targetFolder = getObjectByPath(targetPath);
    if (!targetFolder) return;
    
    // Check if target is a subfolder of source (prevent recursive paste)
    if (sourceItem[".meta_data"].type === "folder" && 
        targetPath.startsWith(clipboardItem.path)) {
        showError("Cannot paste a folder into itself or its subfolders.");
        return;
    }
    
    // Check if item with same name already exists in target
    if (targetFolder[clipboardItem.name]) {
        showError(`A file or folder named "${clipboardItem.name}" already exists at the destination.`);
        return;
    }
    
    // Move the item
    moveByPath(clipboardItem.path, targetPath);

    // if we are pasting on the desktop, set position to mouse position
    if (targetPath === "/Desktop") {
        const pos = getMousePos(canvas, e);
        targetFolder[clipboardItem.name][".meta_data"].position = [
            pos.x - 40,
            pos.y - 50
        ];
    }
    // Clear clipboard
    clipboardItem = null;
    hideContextMenu();
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


// Set canvas dimensions
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 30; // Account for status bar
}




function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}

// Refresh folder window contents
function refreshFolderWindow(folderPath) {
    if (!folderPath) return;
    const folderWindow = document.querySelector(`.folder-window[data-path="${folderPath}"]`);
    if (!folderWindow) return;

    const folder = getObjectByPath(folderPath);
    if (!folder) return;
    
    const folderContent = folderWindow.querySelector('.folder-content');
    folderContent.innerHTML = '';
    
    // Update path bar
    const pathBar = folderWindow.querySelector('.folder-path-bar');
    if (pathBar) {
        pathBar.textContent = folderPath;
    }
    
    // Add the contents of the folder
    Object.keys(folder).forEach((key, index) => {
        if (key === ".meta_data") return; // Skip metadata
        
        const item = folder[key];
        if (!item || !item[".meta_data"]) return;
        
        const metadata = item[".meta_data"];
        
        const icon = document.createElement('div');
        icon.classList.add('file-icon');
        icon.dataset.name = key;
        icon.dataset.path = metadata.path;
        icon.dataset.link = metadata.type === "file" ? metadata.link : "";
        icon.dataset.icon = metadata.icon || (metadata.type === "folder" ? "📁" : "📄");
        icon.dataset.type = metadata.type;
        
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('icon-content');
        iconSpan.textContent = metadata.icon || (metadata.type === "folder" ? "📁" : "📄");
        icon.appendChild(iconSpan);
        
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('file-name');
        nameSpan.textContent = key;
        icon.appendChild(nameSpan);
        
        // Add the icon to the folder window
        folderContent.appendChild(icon);
        
        // Double click event
        icon.addEventListener('dblclick', () => {
            if (metadata.type === "folder") {
                openFolder(key, icon.dataset.path);
            } else {
                openAppInWindow(key, metadata.link, metadata.icon);
            }
        });
    });
}

function refreshOpenedWindows() {
    const windows = document.querySelectorAll('.folder-window');
    windows.forEach(window => {
        const folderPath = window.dataset.path;
        refreshFolderWindow(folderPath);
    });
}

// interactive functions

// Handle double click on icon in desktop
function handleDoubleClick(icon) {
    if (icon.type === "folder") {
        path = "/Desktop/" + icon.name;
        openFolder(icon.name, path);
    } else {
        openAppInWindow(icon.name, icon.link, icon.icon);
    }
}


// windows

function openInTerminal() {
    // Get the current context path
    const currentPath = current_context[".meta_data"].path;
    const app_path = `./default_apps/terminal.html?path=${currentPath}`;
    openAppInWindow("Terminal", app_path, "🖥️");
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
    appWindow.style.width = '800px';
    appWindow.style.height = '600px';
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

    window.addEventListener('mouseleave', ()=>{
        isDraggingWindow = false;
    })
    
    // Move the mousemove event to document level
    document.addEventListener('mousemove', (event) => {
        if (!isDraggingWindow) return;
        if (appWindow.style.width === '100%') return;
        appWindow.style.left = (event.clientX - offsetX) + 'px';
        appWindow.style.top = (event.clientY - offsetY) + 'px';

        pos = getMousePos(canvas, event);
        if(!pos.x || !pos.y) isDraggingWindow = false;
        if(pos.x < 0 || pos.y < 0 || pos.x > canvas.width || pos.y > canvas.height)
            isDraggingWindow = false
    });
    
    // Move the mouseup event to document level
    document.addEventListener('mouseup', () => {
        isDraggingWindow = false;
    });
    
    // Close button
    const closeButton = appWindow.querySelector('.folder-close');
    closeButton.addEventListener('click', () => {
        appWindow.remove();
    });
    
    // Maximize button
    const maximizeButton = appWindow.querySelector('.folder-maximize');
    maximizeButton.addEventListener('click', () => {
        if (appWindow.style.width === '100%') {
            appWindow.style.width = '400px';
            appWindow.style.height = '300px';
        } else {
            appWindow.style.width = '100%';
            appWindow.style.height = '100%';
            appWindow.style.left = '0';
            appWindow.style.top = '3vh';
        }
    });
}

// Open folder window
function openFolder(folderName, folderPath) {
    // Find the folder path
    
    const folder = getObjectByPath(folderPath);
    
    if (!folder) return;
    
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
    folderWindow.dataset.path = folderPath;
    
    // Add path bar
    const pathBar = document.createElement('div');
    pathBar.className = 'folder-path-bar';
    pathBar.style.padding = '5px 10px';
    pathBar.style.backgroundColor = '#444';
    pathBar.style.borderBottom = '1px solid #555';
    pathBar.style.fontSize = '12px';
    pathBar.textContent = folderPath;
    folderWindow.insertBefore(pathBar, folderContent);
    
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
    
    // Move the mousemove event to document level
    document.addEventListener('mousemove', (event) => {
        if (!isDraggingWindow) return;
        if (folderWindow.style.width === '100%') return;
        folderWindow.style.left = (event.clientX - offsetX) + 'px';
        folderWindow.style.top = (event.clientY - offsetY) + 'px';
    });
    
    // Move the mouseup event to document level
    document.addEventListener('mouseup', () => {
        isDraggingWindow = false;
    });

    folderHeader.addEventListener('mouseleave', () => {
        isDraggingWindow = false;
    });
    
    // Close button
    const closeButton = folderWindow.querySelector('.folder-close');
    closeButton.addEventListener('click', () => {
        folderWindow.remove();
    });
    
    // Maximize button
    const maximizeButton = folderWindow.querySelector('.folder-maximize');
    maximizeButton.addEventListener('click', () => {
        if (folderWindow.style.width === '100%') {
            folderWindow.style.width = '400px';
            folderWindow.style.height = '300px';
        } else {
            folderWindow.style.width = '100%';
            folderWindow.style.height = '100%';
            folderWindow.style.left = '0';
            folderWindow.style.top = '3vh';
        }
    });
    
    // Add the contents of the folder
    Object.keys(folder).forEach((key, index) => {
        if (key === ".meta_data") return; // Skip metadata
        
        const item = folder[key];
        if (!item || !item[".meta_data"]) return;
        
        const metadata = item[".meta_data"];
        
        const icon = document.createElement('div');
        icon.classList.add('file-icon');
        icon.dataset.name = key;
        icon.dataset.path = metadata.path;
        icon.dataset.link = metadata.type === "file" ? metadata.link : "";
        icon.dataset.icon = metadata.icon || (metadata.type === "folder" ? "📁" : "📄");
        icon.dataset.type = metadata.type;
        
        const iconSpan = document.createElement('span');
        iconSpan.classList.add('icon-content');
        iconSpan.textContent = metadata.icon || (metadata.type === "folder" ? "📁" : "📄");
        icon.appendChild(iconSpan);
        
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('file-name');
        nameSpan.textContent = key;
        icon.appendChild(nameSpan);
        
        // Add the icon to the folder window
        folderContent.appendChild(icon);
        
        // Double click event
        icon.addEventListener('dblclick', () => {
            if (metadata.type === "folder") {
                openFolder( key , metadata.path);
            } else {
                openAppInWindow(key, metadata.link, metadata.icon);
            }
        });
    });
}

// Custom error display
function showError(message) {
    // Create error window
    const errorWindow = document.createElement('div');
    errorWindow.className = 'error-window';
    errorWindow.style.position = 'absolute';
    errorWindow.style.top = '50%';
    errorWindow.style.left = '50%';
    errorWindow.style.transform = 'translate(-50%, -50%)';
    errorWindow.style.backgroundColor = '#ff4444';
    errorWindow.style.color = 'white';
    errorWindow.style.padding = '20px';
    errorWindow.style.borderRadius = '5px';
    errorWindow.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    errorWindow.style.zIndex = '2000';
    
    // Add error message
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    errorWindow.appendChild(messageDiv);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'OK';
    closeButton.style.marginTop = '15px';
    closeButton.style.padding = '5px 15px';
    closeButton.style.backgroundColor = 'white';
    closeButton.style.color = 'black';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '3px';
    closeButton.style.cursor = 'pointer';
    closeButton.onclick = () => errorWindow.remove();
    errorWindow.appendChild(closeButton);
    
    // Add to body
    document.body.appendChild(errorWindow);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(errorWindow)) {
            errorWindow.remove();
        }
    }, 5000);
}

// Prompt functions
function showAddAppPrompt() {
    document.getElementById('addAppPrompt').style.display = 'block';
}

function hideAddAppPrompt() {
    document.getElementById('addAppPrompt').style.display = 'none';
}

function addAppbtn(){
    let name = document.getElementById('appName').value;
    let icon = document.getElementById('appIcon').value;
    let link = document.getElementById('appLink').value;
    let path = current_context[".meta_data"].path;
    addApp(name, icon, link, path);
}

function showCreateFolderPrompt() {
    document.getElementById('createFolderPrompt').style.display = 'block';
}

function hideCreateFolderPrompt() {
    document.getElementById('createFolderPrompt').style.display = 'none';
}

function createFolderbtn() {
    let folderName = document.getElementById('folderName').value;
    let path = current_context[".meta_data"].path;
    createFolder(folderName, path);
}


// desktop
// Update icon position in directory tree
function updateIconPosition(icon) {
    // Find the icon in the directory tree
    const desktopFolder = directory_tree["Desktop"];
    
    if (desktopFolder[icon.name] && desktopFolder[icon.name][".meta_data"]) {
        desktopFolder[icon.name][".meta_data"].position = icon.position;
        setTree();
    }
}

// Load desktop icons from directory tree
function loadDesktopIcons() {
    desktopIcons = [];
    
    // Get all items in Desktop folder
    Object.keys(directory_tree["Desktop"]).forEach(key => {
        if (key === ".meta_data") return; // Skip metadata
        
        const item = directory_tree["Desktop"][key];
        const metadata = item[".meta_data"];
        console.log(key, metadata)
        if (metadata) {
            desktopIcons.push(new DesktopIcon(
                key,
                metadata.type === "file" ? metadata.link : "",
                metadata.position || [
                    Math.floor(Math.random() * (canvas.width - 100)),
                    Math.floor(Math.random() * (canvas.height - 120))
                ],
                metadata.icon || (metadata.type === "folder" ? "📁" : "📄"),
                metadata.type
            ));
        }
    });
}


// Move icon to folder
function moveIconToFolder(icon, folder) {
    // Get source and destination folders
    const sourceFolder = directory_tree["Desktop"];
    const destPath = `/Desktop/${folder.name}`;
    const destFolder = getObjectByPath(destPath);
    
    if (!sourceFolder[icon.name] || !destFolder) return;
    
    // Check if a file/folder with the same name already exists in the destination
    if (destFolder[icon.name]) {
        showError(`A file or folder named "${icon.name}" already exists in "${folder.name}".`);
        return;
    }
    
    // Move the item
    destFolder[icon.name] = sourceFolder[icon.name];
    
    // Update the path in metadata
    destFolder[icon.name][".meta_data"].path = `${destPath}/${icon.name}`;
    
    // Remove from source folder
    delete sourceFolder[icon.name];
    
    // Update local storage and reload icons
    setTree();
    refreshFolderWindow(destPath);
    loadDesktopIcons();
}



