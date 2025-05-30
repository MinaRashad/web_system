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
    showConfirmation("Are you sure you want to reset? This will delete all your files and folders.",
        function() {
            localStorage.removeItem('directory_tree');
            localStorage.removeItem('directory_tree_backup');
            location.reload();
        }
    );
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

    // Create category folders
    const folders = [
        { name: "Games", position: [100, 120], icon: "🎮" },
        { name: "Tools", position: [100, 240], icon: "🔧" },
        { name: "Develop", position: [100, 360], icon: "💻" }
    ];

    folders.forEach(folder => {
        directory_tree["Desktop"][folder.name] = {
            ".meta_data": {
                "path": `/Desktop/${folder.name}`,
                "type": "folder",
                "icon": folder.icon,
                "position": folder.position
            }
        };
    });

    // Games folder apps
    const gameApps = [
        { name: "Chess", link: "./default_apps/chess.html", icon: "♟" },
        { name: "Checkers", link: "./default_apps/checkers.html", icon: "🔲" },
        { name: "Piano", link: "./default_apps/piano.html", icon: "🎹" },
        { name: "Gardening Game", link: "./default_apps/gardening_game.html", icon: "🌱" },
        { name: "Knowledge Cards", link: "./default_apps/KnowledgeCards.html", icon: "🧠" },
        { name: "Solar System", link: "./default_apps/solarSystem.html", icon: "🪐" }
    ];

    gameApps.forEach((app, index) => {
        directory_tree["Desktop"]["Games"][app.name] = {
            ".meta_data": {
                "path": `/Desktop/Games/${app.name}`,
                "type": "file",
                "link": app.link,
                "icon": app.icon
            }
        };
    });

    // Tools folder apps
    const toolApps = [
        { name: "Hearing Test", link: "./default_apps/hearing_test.html", icon: "👂" },
        { name: "Clock", link: "./default_apps/clock.html", icon: "🕒" },
        { name: "Ladder", link: "./default_apps/ladder.html", icon: "🪜" },
        { name: "HACKIT", link: "HACKIT/index.html", icon: "🔍" }

    ];

    toolApps.forEach((app, index) => {
        directory_tree["Desktop"]["Tools"][app.name] = {
            ".meta_data": {
                "path": `/Desktop/Tools/${app.name}`,
                "type": "file",
                "link": app.link,
                "icon": app.icon
            }
        };
    });

    // Develop folder apps
    const developApps = [
        { name: "Developer", link: "./default_apps/developer.html", icon: "👨‍💻" },
        { name: "Terminal", link: "./default_apps/terminal.html", icon: "🖥️" },
        { name: "Service Ping", link: "./default_apps/service-ping.html", icon: "📡" }
    ];

    developApps.forEach((app, index) => {
        directory_tree["Desktop"]["Develop"][app.name] = {
            ".meta_data": {
                "path": `/Desktop/Develop/${app.name}`,
                "type": "file",
                "link": app.link,
                "icon": app.icon
            }
        };
    });

    // Add Portfolio directly to desktop
    directory_tree["Desktop"]["Portfolio"] = {
        ".meta_data": {
            "path": "/Desktop/Portfolio",
            "type": "file",
            "link": "./default_apps/portfolio.html",
            "icon": "📋",
            "position": [
                Math.floor(250),
                Math.floor(50)
            ]
        }
    };

    // Add Journal to desktop
    directory_tree["Desktop"]["Journal"] = {
        ".meta_data": {
            "path": "/Desktop/Journal",
            "type": "file",
            "link": "https://minarashad.github.io/AI-therapist/",
            "icon": "📓",
            "position": [
                Math.floor(350),
                Math.floor(50)
            ]
        }
    };

    // Check for backup and merge if exists
    const backupTree = JSON.parse(localStorage.getItem('directory_tree_backup'));
    if (backupTree) {
        directory_tree = mergeDirectoryTrees(directory_tree, backupTree);
        // remove backup
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

function updateItemByPath(itemPath, newItemProperties) {
    const item = getObjectByPath(itemPath);
    if (!item) return;

    // Update the item's properties
    Object.keys(newItemProperties).forEach(key => {
        if (key !== ".meta_data") {
            item['.meta_data'][key] = newItemProperties[key] || item[key];
        }
    });

    // update path
    let parent = getParentByPath(itemPath);
    const itemName = getNameFromPath(itemPath);
    const newPath = `${parent[".meta_data"].path}/${itemName}`;
    item['.meta_data'].path = newPath;

    // change key
    delete parent[itemName];
    parent[newItemProperties.name] = item;

    // Update local storage
    setTree();
    
    // Refresh UI
    loadDesktopIcons();
    
    // Refresh folder window if in a folder
    parent = getParentByPath(itemPath);
    if (parent && parent[".meta_data"].path !== "/Desktop") {
        refreshFolderWindow(parent[".meta_data"].path);
    }
}


// Delete app
function deleteItem() {    
    // If multiple icons are selected, confirm deletion
    if (selectedIcons.length > 1) {
        showConfirmation(`Delete ${selectedIcons.length} items?`, () => {
            // Delete all selected icons
            selectedIcons.forEach(icon => {
                const path = current_context[".meta_data"].path + "/" + icon.name;
                deleteByPath(path);
            });
            
            // Clear selection
            selectedIcons = [];
            
            // Update local storage
            setTree();
            
            // Reload icons
            loadDesktopIcons();
            
            hideContextMenu();
        });
    } else {
        if(!targetedIcon) return;
        // Single icon deletion (original behavior)
        const path = current_context[".meta_data"].path + "/" + targetedIcon.name;
        const parent = deleteByPath(path);
        
        // Update local storage
        setTree();
        
        // Reload icons
        loadDesktopIcons();
        
        if(parent && parent['.meta_data']['path'] !== "/Desktop") {
            refreshFolderWindow(parent[".meta_data"].path);
        }
        
        hideContextMenu();
    }
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
    
    // Get mouse position or use a safe default position
    let pos = getMousePos(canvas, event);
    
    // Ensure position is within screen boundaries
    const safeX = pos.x ? Math.min(Math.max(pos.x, 50), canvas.width - 100) : 100;
    const safeY = pos.y ? Math.min(Math.max(pos.y, 50), canvas.height - 150) : 100;

    // Add the new app
    context[name] = {
        ".meta_data": {
            "path": `${currentPath}/${name}`,
            "type": "file",
            "link": link,
            "icon": icon || "📄",
            "position": [
                Math.floor(safeX),
                Math.floor(safeY)
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
    
    // Draw selection box if active
    if (isSelecting) {
        const rect = getSelectionRect();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        ctx.fillStyle = 'rgba(65, 105, 225, 0.2)';
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        ctx.setLineDash([]);
    }
    
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
    if(current_context[".meta_data"].path !== "/Desktop") {
        if(targetedIcon){
            clipboardItem = {
                name: targetedIcon.name,
                path: current_context[".meta_data"].path + "/" + targetedIcon.name,
            }
        }
        return;
    }
    
    else if (selectedIcons.length === 0) return;
    
    // If only one icon is selected, use original behavior
    if (selectedIcons.length === 1) {
        const item = current_context[targetedIcon.name];
        if (!item) return;
        
        clipboardItem = {
            name: targetedIcon.name,
            path: item[".meta_data"].path,
        };
    } else {
        // For multiple selections, store an array of items
        clipboardItem = {
            isMultiple: true,
            items: selectedIcons.map(icon => {
                const item = current_context[icon.name];
                if (!item) return null;
                
                return {
                    name: icon.name,
                    path: item[".meta_data"].path
                };
            }).filter(item => item !== null) // Remove any null items
        };
    }
    
    hideContextMenu();
}


// Paste function
function pasteItem(e) {
    if (!clipboardItem) return;
    
    // Determine target folder path
    let targetPath = current_context[".meta_data"].path;
    
    if (clipboardItem.isMultiple) {
        // Handle multiple items
        clipboardItem.items.forEach(item => {
            // Get source item
            const sourceItem = getObjectByPath(item.path);
            if (!sourceItem) return;
            
            // Get target folder
            const targetFolder = getObjectByPath(targetPath);
            if (!targetFolder) return;
            
            // Check if target is a subfolder of source (prevent recursive paste)
            if (sourceItem[".meta_data"].type === "folder" && 
                targetPath.startsWith(item.path)) {
                showError(`Cannot paste folder "${item.name}" into itself or its subfolders.`);
                return;
            }
            
            // Check if item with same name already exists in target
            if (targetFolder[item.name]) {
                showError(`A file or folder named "${item.name}" already exists at the destination.`);
                return;
            }
            
            // Move the item
            moveByPath(item.path, targetPath);
            
            // if we are pasting on the desktop, set position to mouse position
            if (targetPath === "/Desktop") {
                const pos = getMousePos(canvas, e);
                targetFolder[item.name][".meta_data"].position = [
                    pos.x - 40 + Math.random() * 50, // Add some randomness to prevent overlap
                    pos.y - 50 + Math.random() * 50
                ];
            }
        });
    } else {
        // Original single item paste logic
        const sourceItem = getObjectByPath(clipboardItem.path);
        if (!sourceItem) return;
        
        const targetFolder = getObjectByPath(targetPath);
        if (!targetFolder) return;
        
        if (sourceItem[".meta_data"].type === "folder" && 
            targetPath.startsWith(clipboardItem.path)) {
            showError("Cannot paste a folder into itself or its subfolders.");
            return;
        }
        
        if (targetFolder[clipboardItem.name]) {
            showError(`A file or folder named "${clipboardItem.name}" already exists at the destination.`);
            return;
        }
        
        moveByPath(clipboardItem.path, targetPath);
        
        if (targetPath === "/Desktop") {
            const pos = getMousePos(canvas, e);
            targetFolder[clipboardItem.name][".meta_data"].position = [
                pos.x - 40,
                pos.y - 50
            ];
        }
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

function openInDev(){
    // Get the current context path
    const newName = document.getElementById('editAppName').value || 'New app';
    const newIcon = document.getElementById('editAppIcon').value || '📄';
    const newLink = document.getElementById('editAppLink').value ;
    const current_app_path = current_context[".meta_data"].path + "/" + targetedIcon.name;
    
    const dev_path = `./default_apps/developer.html?name=${newName}&icon=${newIcon}&link=${newLink}`;
    hideEditAppPrompt();
    openAppInWindow("Developer", dev_path, "👨‍💻");

    // ask if they want to delete the original app
    showConfirmation("Do you want to delete the original app?", ()=>{
        console.log(current_app_path)
        deleteByPath(current_app_path);
    })
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

function showEditAppPrompt() {
    if (!targetedIcon || targetedIcon.type !== "file") return;
    
    // Get the current item's data
    const itemPath = current_context[".meta_data"].path + "/" + targetedIcon.name;
    const item = getObjectByPath(itemPath);
    
    if (!item) return;
    
    const metadata = item[".meta_data"];
    
    // Fill the form with current values
    document.getElementById('editAppName').value = targetedIcon.name;
    document.getElementById('editAppIcon').value = metadata.icon || "📄";
    document.getElementById('editAppLink').value = metadata.link || "";
    
    document.getElementById('editAppPrompt').style.display = 'block';

    if(metadata.link.startsWith("data:text/html;")) {
        document.getElementById('openInDevBtn').style.display = 'block';
    }
    else{
        document.getElementById('openInDevBtn').style.display = 'none';
    }
}

function hideEditAppPrompt() {
    document.getElementById('editAppPrompt').style.display = 'none';
}

function saveEditApp() {
    if (!targetedIcon || targetedIcon.type !== "file") return;
    
    const newName = document.getElementById('editAppName').value;
    const newIcon = document.getElementById('editAppIcon').value;
    const newLink = document.getElementById('editAppLink').value;
    
    properties = {
        name: newName,
        icon: newIcon,
        link: newLink
    }
    if (!is_valid_name(newName)) {
        showError("Invalid app name.");
        return;
    }
    
    const itemPath = current_context[".meta_data"].path + "/" + targetedIcon.name;

    updateItemByPath(itemPath, properties);

    hideEditAppPrompt();

}

let emojis = [];

async function fetchEmojis() {
    if (emojis.length > 0) return;
    try {
        const response = await fetch('https://unpkg.com/emoji.json@13.1.0/emoji.json');
        emojis = await response.json();
    } catch (error) {
        console.error('Failed to fetch emojis:', error);
        showError('Failed to load emojis. Please try again later.');
    }
}

function openEmojiSearch(inputId) {
    fetchEmojis().then(() => {
        document.getElementById('emojiSearchModal').style.display = 'block';
        document.getElementById('emojiSearchInput').focus();
        window.currentEmojiInputId = inputId;
        searchEmojis();
    });
}

function closeEmojiSearch() {
    document.getElementById('emojiSearchModal').style.display = 'none';
    document.getElementById('emojiSearchInput').value = '';
    searchEmojis();
}

function searchEmojis() {
    const search = document.getElementById('emojiSearchInput').value.toLowerCase();
    const list = document.getElementById('emojiList');
    list.innerHTML = '';
    const filtered = emojis.filter(emoji => 
        (emoji.name && emoji.name.toLowerCase().includes(search)) ||
        (emoji.codes && emoji.codes.toLowerCase().includes(search))
    );
    filtered.forEach(emoji => {
        const button = document.createElement('button');
        button.textContent = emoji.char;
        button.title = emoji.name;
        button.style.fontSize = '24px';
        button.style.border = 'none';
        button.style.background = 'none';
        button.style.cursor = 'pointer';
        button.onclick = () => {
            document.getElementById(window.currentEmojiInputId).value = emoji.char;
            closeEmojiSearch();
        };
        list.appendChild(button);
    });
}

// Add showInfo function for non-error messages
function showInfo(message) {
    // Create info window (similar to error but with different styling)
    const infoWindow = document.createElement('div');
    infoWindow.className = 'info-window';
    infoWindow.style.position = 'absolute';
    infoWindow.style.top = '50%';
    infoWindow.style.left = '50%';
    infoWindow.style.transform = 'translate(-50%, -50%)';
    infoWindow.style.backgroundColor = '#2196F3';
    infoWindow.style.color = 'white';
    infoWindow.style.padding = '20px';
    infoWindow.style.borderRadius = '5px';
    infoWindow.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    infoWindow.style.zIndex = '2000';
    
    // Add message
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    infoWindow.appendChild(messageDiv);
    
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
    closeButton.onclick = () => infoWindow.remove();
    infoWindow.appendChild(closeButton);
    
    // Add to body
    document.body.appendChild(infoWindow);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(infoWindow)) {
            infoWindow.remove();
        }
    }, 5000);
}

// Add confirmation dialog
function showConfirmation(message, onConfirm) {
    // Create confirmation window
    const confirmWindow = document.createElement('div');
    confirmWindow.className = 'confirm-window';
    confirmWindow.style.position = 'absolute';
    confirmWindow.style.top = '50%';
    confirmWindow.style.left = '50%';
    confirmWindow.style.transform = 'translate(-50%, -50%)';
    confirmWindow.style.backgroundColor = '#333';
    confirmWindow.style.color = 'white';
    confirmWindow.style.padding = '20px';
    confirmWindow.style.borderRadius = '5px';
    confirmWindow.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    confirmWindow.style.zIndex = '2000';
    
    // Add message
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    confirmWindow.appendChild(messageDiv);
    
    // Add buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '15px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'flex-end';
    buttonContainer.style.gap = '10px';
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Yes';
    confirmButton.style.padding = '5px 15px';
    confirmButton.style.backgroundColor = '#4CAF50';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '3px';
    confirmButton.style.cursor = 'pointer';
    confirmButton.onclick = () => {
        if (onConfirm) onConfirm();
        confirmWindow.remove();
    };
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'No';
    cancelButton.style.padding = '5px 15px';
    cancelButton.style.backgroundColor = '#f44336';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '3px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.onclick = () => confirmWindow.remove();
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    confirmWindow.appendChild(buttonContainer);
    
    // Add to body
    document.body.appendChild(confirmWindow);
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
            
            showInfo("Tree imported successfully!");
        } catch (error) {
            showError("Error importing tree: " + error.message);
        }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
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
    
    // Check if trying to move a folder into itself or its subfolder
    if (icon.type === "folder") {
        const iconPath = `/Desktop/${icon.name}`;
        if (destPath.startsWith(iconPath)) {
            showError(`Cannot move folder "${icon.name}" into itself or its subfolders.`);
            return;
        }
    }
    
    // Move the item
    destFolder[icon.name] = sourceFolder[icon.name];
    
    // Update the path in metadata
    destFolder[icon.name][".meta_data"].path = `${destPath}/${icon.name}`;
    
    // If it's a folder, update paths of all children recursively
    if (icon.type === "folder") {
        updateChildPaths(destFolder[icon.name], `${destPath}/${icon.name}`);
    }
    
    // Remove from source folder
    delete sourceFolder[icon.name];
    
    // Update local storage and reload icons
    setTree();
    refreshFolderWindow(destPath);
    loadDesktopIcons();
}

// Add event listeners for drag and drop between windows
function setupWindowDragDrop() {
    // Event delegation for folder windows
    document.addEventListener('mousedown', (e) => {
        const fileIcon = e.target.closest('.file-icon');
        const folderWindow = e.target.closest('.folder-window');
        
        if (fileIcon && folderWindow) {
            // Store the source information
            const dragData = {
                name: fileIcon.dataset.name,
                path: fileIcon.dataset.path,
                type: fileIcon.dataset.type,
                sourceWindow: folderWindow,
                sourcePath: folderWindow.dataset.path,
                icon: fileIcon.dataset.icon,
                link: fileIcon.dataset.link
            };
            
            // Create a visual drag element
            const dragElement = document.createElement('div');
            dragElement.className = 'dragging-element';
            dragElement.textContent = fileIcon.dataset.icon;
            dragElement.style.position = 'absolute';
            dragElement.style.pointerEvents = 'none';
            dragElement.style.zIndex = '9999';
            dragElement.style.opacity = '0.7';
            dragElement.style.fontSize = '24px';
            document.body.appendChild(dragElement);
            
            // Position the drag element
            const updateDragPosition = (moveEvent) => {
                dragElement.style.left = (moveEvent.clientX + 10) + 'px';
                dragElement.style.top = (moveEvent.clientY + 10) + 'px';
            };
            
            updateDragPosition(e);
            
            // Track mouse movement
            const mouseMoveHandler = (moveEvent) => {
                updateDragPosition(moveEvent);
            };
            
            // Handle drop
            const mouseUpHandler = (upEvent) => {
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
                
                // Remove drag element
                if (dragElement.parentNode) {
                    dragElement.parentNode.removeChild(dragElement);
                }
                
                // Find drop target
                const targetElement = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
                
                // Check if dropped on canvas (desktop)
                if (targetElement === canvas) {
                    // Move from folder to desktop
                    moveItemToDesktop(dragData);
                } else {
                    // Check if dropped in another folder window
                    const targetFolderWindow = targetElement.closest('.folder-window');
                    const targetFileIcon = targetElement.closest('.file-icon');
                    console.log(targetFolderWindow, dragData.sourceWindow);
                    if (targetFolderWindow && targetFolderWindow !== dragData.sourceWindow) {
                        // Dropped in a different folder window
                        moveItemBetweenFolders(dragData, targetFolderWindow.dataset.path);
                    } else if (targetFileIcon && targetFileIcon.dataset.type === 'folder') {
                        // Dropped on a folder icon within a window
                        const targetFolderPath = targetFileIcon.dataset.path;
                        
                        if(targetFolderPath !== dragData.path) {
                            moveItemBetweenFolders(dragData, targetFolderPath)
                        };
                    }
                }
            };
            
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        }
    });
}

// Move item from a folder to the desktop
function moveItemToDesktop(dragData) {
    const sourcePath = dragData.path;
    const sourceItem = getObjectByPath(sourcePath);
    
    if (!sourceItem) return;
    

    moveByPath(sourcePath, "/Desktop");
    
    // Set a position on desktop
    let mouse_pos = getMousePos(canvas, event);
    directory_tree["Desktop"][dragData.name][".meta_data"].position = [
        mouse_pos.x - 40 ,
        mouse_pos.y - 50 
    ];
    
    
    // Update storage and UI
    setTree();
    loadDesktopIcons();
}

// Move item between folders
function moveItemBetweenFolders(dragData, targetFolderPath) {
    const sourcePath = dragData.path;
    
    moveByPath(sourcePath, targetFolderPath);
}

// Initialize window drag-drop when page loads
window.addEventListener('load', () => {
    setupWindowDragDrop();
    // ... existing load handlers ...
});
