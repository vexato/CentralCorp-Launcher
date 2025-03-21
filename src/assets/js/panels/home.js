/**
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

'use strict';

import { logger, database, changePanel } from '../utils.js';
const { Launch, Status } = require('minecraft-java-core-azbetter');
const { ipcRenderer, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const launch = new Launch();
const pkg = require('../package.json');
const settings_url = pkg.user ? `${pkg.settings}/${pkg.user}` : pkg.settings;


const dataDirectory = process.env.APPDATA || (process.platform == 'darwin' ? `${process.env.HOME}/Library/Application Support` : process.env.HOME);
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

class Home {
    static id = "home";

    async init(config, news) {
        this.database = await new database().init();
        this.config = config;
        this.news = await news;
        this.initNews();
        this.initLaunch();
        this.initStatusServer();
        this.initBtn();
        this.initVideo();
        this.initAdvert();
        this.verifyModsBeforeLaunch();
    }

    async initNews() {
        const newsContainer = document.querySelector('.news-list');
        if (this.news) {
            if (!this.news.length) {
                this.createNewsBlock(newsContainer, 'Aucun news n\'est actuellement disponible.', 'Vous pourrez suivre ici toutes les news relatives au serveur.');
            } else {
                for (const newsItem of this.news) {
                    const date = await this.getDate(newsItem.publish_date);
                    this.createNewsBlock(newsContainer, newsItem.title, newsItem.content, newsItem.author, date);
                }
            }
        } else {
            this.createNewsBlock(newsContainer, 'Error.', 'Impossible de contacter le serveur des news. Merci de vérifier votre configuration.');
        }
        this.setServerIcon();
    }

    createNewsBlock(container, title, content, author = '', date = {}) {
        const blockNews = document.createElement('div');
        blockNews.classList.add('news-block', 'opacity-1');
        blockNews.innerHTML = `
            <div class="news-header">
                <div class="header-text">
                    <div class="title">${title}</div>
                </div>
                ${date.day ? `<div class="date"><div class="day">${date.day}</div><div class="month">${date.month}</div></div>` : ''}
            </div>
            <div class="news-content">
                <div class="bbWrapper">
                    <p>${content}</p>
                    ${author ? `<p class="news-author"><span>${author}</span></p>` : ''}
                </div>
            </div>`;
        container.appendChild(blockNews);
    }

    setServerIcon() {
        const serverImg = document.querySelector('.server-img');
        serverImg.setAttribute("src", this.config.server_icon);
        if (!this.config.server_icon) {
            serverImg.style.display = "none";
        }
    }

    async initLaunch() {
        document.querySelector('.play-btn').addEventListener('click', async () => {
            await this.verifyModsBeforeLaunch();
            const opts = await this.getLaunchOptions();
            const playBtn = document.querySelector('.play-btn');
            const info = document.querySelector(".text-download");
            const progressBar = document.querySelector(".progress-bar");

            playBtn.style.display = "none";
            info.style.display = "block";
            launch.Launch(opts);

            const launcherSettings = (await this.database.get('1234', 'launcher')).value;
            this.setupLaunchListeners(launch, info, progressBar, playBtn, launcherSettings);
        });
    }

    async getLaunchOptions() {
        const urlpkg = this.getBaseUrl();
        const uuid = (await this.database.get('1234', 'accounts-selected')).value;
        const account = (await this.database.get(uuid.selected, 'accounts')).value;
        const ram = (await this.database.get('1234', 'ram')).value;
        const javaPath = (await this.database.get('1234', 'java-path')).value;
        const javaArgs = (await this.database.get('1234', 'java-args')).value;
        const resolution = (await this.database.get('1234', 'screen')).value;
        const launcherSettings = (await this.database.get('1234', 'launcher')).value;

        const screen = resolution.screen.width === '<auto>' ? false : { width: resolution.screen.width, height: resolution.screen.height };

        return {
            url: urlpkg,
            authenticator: account,
            timeout: 10000,
            path: `${dataDirectory}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`,
            version: this.config.game_version,
            detached: launcherSettings.launcher.close === 'close-all' ? false : true,
            downloadFileMultiple: 30,
            loader: {
                type: this.config.loader.type,
                build: this.config.loader.build,
                enable: this.config.loader.enable,
            },
            verify: this.config.verify,
            ignored: [
                this.config.ignored,
                "launcher_config",
            ],
            java: this.config.java,
            memory: {
                min: `${ram.ramMin * 1024}M`,
                max: `${ram.ramMax * 1024}M`
            }
        };
    }

    getBaseUrl() {
        const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
        return pkg.env === 'azuriom' ? `${baseUrl}api/centralcorp/files` : `${baseUrl}data/`;
    }

    setupLaunchListeners(launch, info, progressBar, playBtn, launcherSettings) {
        launch.on('extract', extract => console.log(extract));
        launch.on('progress', (progress, size) => this.updateProgressBar(progressBar, info, progress, size, 'Téléchargement'));
        launch.on('check', (progress, size) => this.updateProgressBar(progressBar, info, progress, size, 'Vérification'));
        launch.on('estimated', time => console.log(this.formatTime(time)));
        launch.on('speed', speed => console.log(`${(speed / 1067008).toFixed(2)} Mb/s`));
        launch.on('patch', patch => info.innerHTML = `Patch en cours...`);
        launch.on('data', e => this.handleLaunchData(e, info, progressBar, playBtn, launcherSettings));
        launch.on('close', code => this.handleLaunchClose(code, info, progressBar, playBtn, launcherSettings));
        launch.on('error', err => console.log(err));
    }

    updateProgressBar(progressBar, info, progress, size, text) {
        progressBar.style.display = "block";
        info.innerHTML = `${text} ${((progress / size) * 100).toFixed(0)}%`;
        ipcRenderer.send('main-window-progress', { progress, size });
        progressBar.value = progress;
        progressBar.max = size;
    }

    formatTime(time) {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time - hours * 3600) / 60);
        const seconds = Math.floor(time - hours * 3600 - minutes * 60);
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    handleLaunchData(e, info, progressBar, playBtn, launcherSettings) {
        new logger('Minecraft', '#36b030');
        if (launcherSettings.launcher.close === 'close-launcher') ipcRenderer.send("main-window-hide");
        ipcRenderer.send('main-window-progress-reset');
        progressBar.style.display = "none";
        info.innerHTML = `Démarrage en cours...`;
        console.log(e);
    }

    handleLaunchClose(code, info, progressBar, playBtn, launcherSettings) {
        if (launcherSettings.launcher.close === 'close-launcher') ipcRenderer.send("main-window-show");
        progressBar.style.display = "none";
        info.style.display = "none";
        playBtn.style.display = "block";
        info.innerHTML = `Vérification`;
        new logger('Launcher', '#7289da');
        console.log('Close');
    }

    async initStatusServer() {
        const nameServer = document.querySelector('.server-text .name');
        const serverMs = document.querySelector('.server-text .desc');
        const playersConnected = document.querySelector('.etat-text .text');
        const online = document.querySelector(".etat-text .online");
        const serverPing = await new Status(this.config.status.ip, this.config.status.port).getStatus();

        if (!serverPing.error) {
            nameServer.textContent = this.config.status.nameServer;
            serverMs.innerHTML = `<span class="green">En ligne</span> - ${serverPing.ms}ms`;
            online.classList.toggle("off");
            playersConnected.textContent = serverPing.playersConnect;
        } else {
            nameServer.textContent = 'Serveur indisponible';
            serverMs.innerHTML = `<span class="red">Hors ligne</span>`;
        }
    }

    async initVideo() {
        const videoContainer = document.querySelector('.ytb');
        if (!this.config.video_activate) {
            videoContainer.style.display = 'none';
            return;
        }

        const youtubeVideoId = this.config.video_url;
        const youtubeThumbnailUrl = `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`;
        const videoThumbnail = videoContainer.querySelector('.youtube-thumbnail');
        const thumbnailImg = videoThumbnail.querySelector('.thumbnail-img');
        const playButton = videoThumbnail.querySelector('.ytb-play-btn');
        const btn = videoContainer.querySelector('.ytb-btn');

        btn.addEventListener('click', () => shell.openExternal(`https://youtube.com/watch?v=${youtubeVideoId}`));

        if (thumbnailImg && playButton) {
            thumbnailImg.src = youtubeThumbnailUrl;
            videoThumbnail.addEventListener('click', () => {
                videoThumbnail.innerHTML = `<iframe width="500" height="290" src="https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
            });
        }
    }

    async initAdvert() {
        const advertBanner = document.querySelector('.advert-banner');
        if (this.config.alert_activate) {
            const message = this.config.alert_msg;
            const firstParagraph = message.split('</p>')[0] + '</p>';
            const scrollingText = document.createElement('div');
            scrollingText.classList.add('scrolling-text');
            scrollingText.innerHTML = `${firstParagraph}`;
            advertBanner.innerHTML = '';
            advertBanner.appendChild(scrollingText);
            scrollingText.classList.toggle('no-scroll', !this.config.alert_scroll);
            advertBanner.style.display = 'block';
        } else {
            advertBanner.style.display = 'none';
        }
    }

    initBtn() {
        document.querySelector('.settings-btn').addEventListener('click', () => {
            changePanel('settings');
        });
    }

    async getDate(e) {
        const date = new Date(e);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return { year, month: MONTHS[month - 1], day };
    }

    async verifyModsBeforeLaunch() {
        const playButton = document.querySelector('.play-btn');
        playButton.addEventListener('click', async () => {
            const modsDir = path.join(dataDirectory, process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`, 'mods');
            const launcherConfigDir = path.join(dataDirectory, process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`, 'launcher_config');
            const modsConfigFile = path.join(launcherConfigDir, 'mods_config.json');

            let modsConfig;
            try {
                modsConfig = JSON.parse(fs.readFileSync(modsConfigFile));
            } catch (error) {
                console.error("Failed to read mods config file:", error);
                return;
            }

            for (const mod in modsConfig) {
                const modFiles = fs.readdirSync(modsDir).filter(file => file.startsWith(mod) && (file.endsWith('.jar') || file.endsWith('.jar-disable')));
                if (modFiles.length > 0) {
                    const modFile = modFiles[0];
                    const modFilePath = path.join(modsDir, modFile);
                    const newModFilePath = modsConfig[mod] ? modFilePath.replace('.jar-disable', '.jar') : modFilePath.endsWith('.jar-disable') ? modFilePath : `${modFilePath}.disable`;
                    if (modFilePath !== newModFilePath) {
                        fs.renameSync(modFilePath, newModFilePath);
                    }
                }
            }
        });
    }
}

export default Home;