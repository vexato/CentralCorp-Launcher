/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';
import { config, t } from './utils.js';

const nodeFetch = require('node-fetch');
const pkg = require('../package.json');


let dev = process.env.NODE_ENV === 'dev';


class Splash {
    constructor() {
        this.splash = document.querySelector(".splash");
        this.splashMessage = document.querySelector(".splash-message");
        this.splashAuthor = document.querySelector(".splash-author");
        this.message = document.querySelector(".message");
        this.progress = document.querySelector("progress");
        document.addEventListener('DOMContentLoaded', async () => {
            this.startAnimation();
        })
    }
    async startAnimation() {
        config.GetConfig().then(res => {
            let splashes = [
                { "message": res.splash, "author": res.splash_author },
            ];
            let splash = splashes[Math.floor(Math.random() * splashes.length)];
        this.splashMessage.textContent = splash.message;
        this.splashAuthor.children[0].textContent = "@" + splash.author;
        })
        
        document.getElementById('splash-message').textContent = t('welcome_message');
        document.getElementById('splash-author').textContent = t('developed_by');
        document.getElementById('update-message').textContent = t('checking_updates');

        await sleep(100);
        document.querySelector("#splash").style.display = "block";
        await sleep(500);
        this.splash.classList.add("opacity");
        await sleep(500);
        this.splash.classList.add("translate");
        this.splashMessage.classList.add("opacity");
        this.splashAuthor.classList.add("opacity");
        this.message.classList.add("opacity");
        await sleep(1000);
        this.checkUpdate();
    }

        async checkUpdate() {
            this.setStatus(`Recherche de mise à jour...`);
    
            // Compatibility for both dev and production modes
            const updatePromise = window.electronAPI && window.electronAPI.updateApp 
                ? window.electronAPI.updateApp()
                : typeof require !== 'undefined' 
                    ? require('electron').ipcRenderer.invoke('update-app')
                    : Promise.reject(new Error('Electron API not available'));
                    
            updatePromise.then().catch(err => {
                return this.shutdown(`erreur lors de la recherche de mise à jour :<br>${err.message}`);
            });
    
            // Setup event listeners with compatibility
            if (window.electronAPI && window.electronAPI.onUpdateAvailable) {
                window.electronAPI.onUpdateAvailable(() => {
                    this.setStatus(`Mise à jour disponible !`);
                    const platform = window.nodeAPI ? window.nodeAPI.os.platform() : require('os').platform();
                    if (platform == 'win32') {
                        this.toggleProgress();
                        if (window.electronAPI.startUpdate) {
                            window.electronAPI.startUpdate();
                        } else {
                            require('electron').ipcRenderer.send('start-update');
                        }
                    }
                    else return this.dowloadUpdate();
                });
                
                window.electronAPI.onError((event, err) => {
                    if (err) return this.shutdown(`${err.message}`);
                });
                
                window.electronAPI.onDownloadProgress((event, progress) => {
                    this.setProgress(progress.transferred, progress.total);
                });
                
                window.electronAPI.onUpdateNotAvailable(() => {
                    console.error("Mise à jour non disponible");
                    this.maintenanceCheck();
                });
            } else if (typeof require !== 'undefined') {
                const { ipcRenderer } = require('electron');
                const os = require('os');
                
                ipcRenderer.on('updateAvailable', () => {
                    this.setStatus(`Mise à jour disponible !`);
                    if (os.platform() == 'win32') {
                        this.toggleProgress();
                        ipcRenderer.send('start-update');
                    }
                    else return this.dowloadUpdate();
                });
                
                ipcRenderer.on('error', (event, err) => {
                    if (err) return this.shutdown(`${err.message}`);
                });
                
                ipcRenderer.on('download-progress', (event, progress) => {
                    this.setProgress(progress.transferred, progress.total);
                });
                
                ipcRenderer.on('update-not-available', () => {
                    console.error("Mise à jour non disponible");
                    this.maintenanceCheck();
                });
            }
        }
    
        getLatestReleaseForOS(os, preferredFormat, asset) {
            return asset.filter(asset => {
                const name = asset.name.toLowerCase();
                const isOSMatch = name.includes(os);
                const isFormatMatch = name.endsWith(preferredFormat);
                return isOSMatch && isFormatMatch;
            }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        }
    
        async dowloadUpdate() {
            const repoURL = pkg.repository.url.replace("git+", "").replace(".git", "").replace("https://github.com/", "").split("/");
            const githubAPI = await nodeFetch('https://api.github.com').then(res => res.json()).catch(err => err);
    
            const githubAPIRepoURL = githubAPI.repository_url.replace("{owner}", repoURL[0]).replace("{repo}", repoURL[1]);
            const githubAPIRepo = await nodeFetch(githubAPIRepoURL).then(res => res.json()).catch(err => err);
    
            const releases_url = await nodeFetch(githubAPIRepo.releases_url.replace("{/id}", '')).then(res => res.json()).catch(err => err);
            const latestRelease = releases_url[0].assets;
            let latest;
    
            if (os.platform() == 'darwin') latest = this.getLatestReleaseForOS('mac', '.dmg', latestRelease);
            else if (os == 'linux') latest = this.getLatestReleaseForOS('linux', '.appimage', latestRelease);
    
    
            this.setStatus(`Mise à jour disponible !<br><div class="download-update">Télécharger</div>`);
            document.querySelector(".download-update").addEventListener("click", () => {
                shell.openExternal(latest.browser_download_url);
                return this.shutdown("Téléchargement en cours...");
            });
        }
    
    
        async maintenanceCheck() {
            config.GetConfig().then(res => {
                if (res.maintenance) return this.shutdown(res.maintenance_message);
                this.startLauncher();
            }).catch(e => {
                console.error(e);
                return this.shutdown("Aucune connexion internet détectée,<br>veuillez réessayer ultérieurement.");
            })
        }


    startLauncher() {
        this.setStatus(`Démarrage du launcher`);
        
        if (window.electronAPI && window.electronAPI.openMainWindow) {
            window.electronAPI.openMainWindow();
            window.electronAPI.closeUpdateWindow();
        } else if (typeof require !== 'undefined') {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('main-window-open');
            ipcRenderer.send('update-window-close');
        }
    }

    shutdown(text) {
        this.setStatus(`${text}<br>Arrêt dans 5s`);
        let i = 4;
        setInterval(() => {
            this.setStatus(`${text}<br>Arrêt dans ${i--}s`);
            if (i < 0) {
                if (window.electronAPI && window.electronAPI.closeUpdateWindow) {
                    window.electronAPI.closeUpdateWindow();
                } else if (typeof require !== 'undefined') {
                    const { ipcRenderer } = require('electron');
                    ipcRenderer.send('update-window-close');
                }
            }
        }, 1000);
    }

    setStatus(text) {
        this.message.innerHTML = text;
    }

    toggleProgress() {
        if (this.progress.classList.toggle("show")) this.setProgress(0, 1);
    }

    setProgress(value, max) {
        this.progress.value = value;
        this.progress.max = max;
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
        if (window.electronAPI && window.electronAPI.openUpdateWindowDevTools) {
            window.electronAPI.openUpdateWindowDevTools();
        } else if (typeof require !== 'undefined') {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send("update-window-dev-tools");
        }
    }
})

new Splash();