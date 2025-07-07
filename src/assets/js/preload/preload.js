/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Window controls
    closeUpdateWindow: () => ipcRenderer.send('update-window-close'),
    openUpdateWindowDevTools: () => ipcRenderer.send('update-window-dev-tools'),
    openMainWindow: () => ipcRenderer.send('main-window-open'),
    openMainWindowDevTools: () => ipcRenderer.send('main-window-dev-tools'),
    closeMainWindow: () => ipcRenderer.send('main-window-close'),
    setProgress: (options) => ipcRenderer.send('main-window-progress', options),
    resetProgress: () => ipcRenderer.send('main-window-progress-reset'),
    minimizeWindow: () => ipcRenderer.send('main-window-minimize'),
    maximizeWindow: () => ipcRenderer.send('main-window-maximize'),
    hideWindow: () => ipcRenderer.send('main-window-hide'),
    showWindow: () => ipcRenderer.send('main-window-show'),

    // Theme
    isDarkTheme: (theme) => ipcRenderer.invoke('is-dark-theme', theme),

    // Microsoft authentication
    microsoftAuth: (clientId) => ipcRenderer.invoke('Microsoft-window', clientId),

    // Updates
    updateApp: () => ipcRenderer.invoke('update-app'),
    startUpdate: () => ipcRenderer.send('start-update'),

    // Event listeners
    onUpdateAvailable: (callback) => ipcRenderer.on('updateAvailable', callback),
    onUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', callback),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
    onError: (callback) => ipcRenderer.on('error', callback),

    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

    // Shell operations
    openExternal: (url) => require('electron').shell.openExternal(url)
});

// For compatibility with existing code, expose require and Node.js globals
contextBridge.exposeInMainWorld('nodeRequire', require);
contextBridge.exposeInMainWorld('nodeProcess', process);

// Expose Node.js modules that are commonly needed
contextBridge.exposeInMainWorld('nodeAPI', {
    os: require('os'),
    path: require('path'),
    fs: require('fs'),
    process: {
        env: process.env,
        platform: process.platform
    }
});
