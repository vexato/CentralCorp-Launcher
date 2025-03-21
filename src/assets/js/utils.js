/**
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

import config from './utils/config.js';
import database from './utils/database.js';
import logger from './utils/logger.js';
import slider from './utils/slider.js';
const pkg = require('../package.json');

const settings_url = pkg.user ? `${pkg.settings}/${pkg.user}` : pkg.settings;

export {
    config,
    database,
    logger,
    changePanel,
    addAccount,
    slider as Slider,
    accountSelect,
};

function changePanel(id) {
    const panel = document.querySelector(`.${id}`);
    const active = document.querySelector(`.active`);
    if (active) active.classList.toggle("active");
    panel.classList.add("active");
}

function addAccount(data) {
    const azauth = getAzAuthUrl();
    const timestamp = new Date().getTime();
    const div = document.createElement("div");
    div.classList.add("account");
    div.id = data.uuid;
    div.innerHTML = `
        <img class="account-image" src="${azauth}api/skin-api/avatars/face/${data.name}/?t=${timestamp}">
        <div class="account-name">${data.name}</div>
        <div class="account-uuid">${data.uuid}</div>
        <div class="account-delete"><div class="icon-account-delete icon-account-delete-btn"></div></div>
    `;
    document.querySelector('.accounts').appendChild(div);
}

function accountSelect(uuid) {
    const account = document.getElementById(uuid);
    const pseudo = account.querySelector('.account-name').innerText;
    const activeAccount = document.querySelector('.active-account');

    if (activeAccount) activeAccount.classList.toggle('active-account');
    account.classList.add('active-account');
    headplayer(pseudo);
}

function headplayer(pseudo) {
    const azauth = getAzAuthUrl();
    const timestamp = new Date().getTime();
    const skin_url = `${azauth}api/skin-api/avatars/face/${pseudo}/?t=${timestamp}`;
    document.querySelector(".player-head").style.backgroundImage = `url(${skin_url})`;
}

function getAzAuthUrl() {
    const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
    return pkg.env === 'azuriom' 
        ? baseUrl 
        : config.config.azauth.endsWith('/') 
        ? config.config.azauth 
        : `${config.config.azauth}/`;
}
