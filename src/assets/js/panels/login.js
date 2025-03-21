import { database, changePanel, addAccount, accountSelect } from '../utils.js';
const { AZauth } = require('minecraft-java-core-azbetter');
const { ipcRenderer, shell } = require('electron');
const pkg = require('../package.json');
const settings_url = pkg.user ? `${pkg.settings}/${pkg.user}` : pkg.settings;

'use strict';

class Login {
    static id = "login";

    async init(config) {
        this.config = config;
        this.database = await new database().init();
        this.config.online ? this.getOnline() : this.getOffline();
    }

    async refreshData() {
        document.querySelector('.player-role').innerHTML = '';
        document.querySelector('.player-monnaie').innerHTML = '';
        await this.initOthers();
        await this.initPreviewSkin();
    }

    async initPreviewSkin() {
        console.log('initPreviewSkin called');
        const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
        const websiteUrl = pkg.env === 'azuriom' ? `${baseUrl}` : this.config.azauth;
        const uuid = (await this.database.get('1234', 'accounts-selected')).value;
        const account = (await this.database.get(uuid.selected, 'accounts')).value;

        document.querySelector('.player-skin-title').innerHTML = `Skin de ${account.name}`;
        document.querySelector('.skin-renderer-settings').src = `${websiteUrl}skin3d/3d-api/skin-api/${account.name}`;
    }

    async initOthers() {
        const uuid = (await this.database.get('1234', 'accounts-selected')).value;
        const account = (await this.database.get(uuid.selected, 'accounts')).value;

        this.updateRole(account);
        this.updateMoney(account);
        this.updateWhitelist(account);
        this.updateBackground(account);
    }

    updateRole(account) {
        if (this.config.role && account.user_info.role) {
            const blockRole = document.createElement("div");
            blockRole.innerHTML = `<div>Grade: ${account.user_info.role.name}</div>`;
            document.querySelector('.player-role').appendChild(blockRole);
        } else {
            document.querySelector(".player-role").style.display = "none";
        }
    }

    updateMoney(account) {
        if (this.config.money) {
            const blockMonnaie = document.createElement("div");
            blockMonnaie.innerHTML = `<div>${account.user_info.monnaie} pts</div>`;
            document.querySelector('.player-monnaie').appendChild(blockMonnaie);
        } else {
            document.querySelector(".player-monnaie").style.display = "none";
        }
    }

    updateWhitelist(account) {
        const playBtn = document.querySelector(".play-btn");
        if (this.config.whitelist_activate && 
            (!this.config.whitelist.includes(account.name) &&
             !this.config.whitelist_roles.includes(account.user_info.role.name))) {
            playBtn.style.backgroundColor = "#696969";
            playBtn.style.pointerEvents = "none";
            playBtn.style.boxShadow = "none";
            playBtn.textContent = "Indisponible";
        } else {
            playBtn.style.backgroundColor = "#00bd7a";
            playBtn.style.pointerEvents = "auto";
            playBtn.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
            playBtn.textContent = "Jouer";
        }
    }

    updateBackground(account) {
        if (this.config.role_data) {
            for (const roleKey in this.config.role_data) {
                if (this.config.role_data.hasOwnProperty(roleKey)) {
                    const role = this.config.role_data[roleKey];
                    if (account.user_info.role.name === role.name) {
                        const backgroundUrl = role.background;
                        const urlPattern = /^(https?:\/\/)/;
                        document.body.style.background = urlPattern.test(backgroundUrl) 
                            ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${backgroundUrl}) black no-repeat center center scroll`
                            : `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
                        break;
                    }
                }
            }
        }
    }

    getOnline() {
        console.log(`Initializing Az Panel...`);
        this.loginAzAuth();
        document.querySelector('.cancel-login').addEventListener("click", () => {
            document.querySelector(".cancel-login").style.display = "none";
            changePanel("settings");
        });
    }

    async loginAzAuth() {
        const elements = this.getElements();
        const azauth = this.getAzAuthUrl();

        this.setupExternalLinks(azauth);
        this.setupEventListeners(elements, azauth);
    }

    getElements() {
        return {
            mailInput: document.querySelector('.Mail'),
            passwordInput: document.querySelector('.Password'),
            cancelMojangBtn: document.querySelector('.cancel-mojang'),
            infoLogin: document.querySelector('.info-login'),
            loginBtn: document.querySelector(".login-btn"),
            mojangBtn: document.querySelector('.mojang'),
            loginBtn2f: document.querySelector('.login-btn-2f'),
            a2finput: document.querySelector('.a2f'),
            infoLogin2f: document.querySelector('.info-login-2f'),
            cancel2f: document.querySelector('.cancel-2f'),
            infoLoginEmail: document.querySelector('.info-login-email'),
            cancelEmail: document.querySelector('.cancel-email')
        };
    }

    getAzAuthUrl() {
        const baseUrl = settings_url.endsWith('/') ? settings_url : `${settings_url}/`;
        return pkg.env === 'azuriom' 
            ? baseUrl 
            : this.config.azauth.endsWith('/') 
            ? this.config.azauth 
            : `${this.config.azauth}/`;
    }

    setupExternalLinks(azauth) {
        const newuserurl = `${azauth}user/register`;
        const passwordreseturl = `${azauth}user/password/reset`;

        this.newuser = document.querySelector(".new-user");
        this.newuser.innerHTML = "Pas de compte ?";
        this.newuser.addEventListener('click', () => shell.openExternal(newuserurl));

        this.passwordreset = document.querySelector(".password-reset");
        this.passwordreset.innerHTML = "Mot de passe oublié ?";
        this.passwordreset.addEventListener('click', () => shell.openExternal(passwordreseturl));
    }

    setupEventListeners(elements, azauth) {
        elements.mojangBtn.addEventListener("click", () => this.toggleLoginCards("mojang"));
        elements.cancelMojangBtn.addEventListener("click", () => this.toggleLoginCards("default"));
        elements.cancel2f.addEventListener("click", () => this.resetLoginForm(elements));
        elements.cancelEmail.addEventListener("click", () => this.resetLoginForm(elements));

        elements.loginBtn2f.addEventListener("click", async () => {
            if (elements.a2finput.value === "") {
                elements.infoLogin2f.innerHTML = "Entrez votre code a2f";
                return;
            }
            await this.handleLogin(elements, azauth, elements.a2finput.value);
        });

        elements.loginBtn.addEventListener("click", async () => {
            elements.cancelMojangBtn.disabled = true;
            elements.loginBtn.disabled = true;
            elements.mailInput.disabled = true;
            elements.passwordInput.disabled = true;
            elements.infoLogin.innerHTML = "Connexion en cours...";

            if (elements.mailInput.value === "") {
                elements.infoLogin.innerHTML = "Entrez votre pseudo";
                this.enableLoginForm(elements);
                return;
            }

            if (elements.passwordInput.value === "") {
                elements.infoLogin.innerHTML = "Entrez votre mot de passe";
                this.enableLoginForm(elements);
                return;
            }

            await this.handleLogin(elements, azauth);
        });
    }

    toggleLoginCards(cardType) {
        const loginCard = document.querySelector(".login-card");
        const loginCardMojang = document.querySelector(".login-card-mojang");
        const a2fCard = document.querySelector('.a2f-card');
        const emailVerifyCard = document.querySelector('.email-verify-card');

        loginCard.style.display = cardType === "default" ? "block" : "none";
        loginCardMojang.style.display = cardType === "mojang" ? "block" : "none";
        a2fCard.style.display = cardType === "a2f"? "block" : "none";
        emailVerifyCard.style.display = "none";
    }

    resetLoginForm(elements) {
        this.toggleLoginCards("default");
        elements.infoLogin.style.display = "none";
        elements.cancelMojangBtn.disabled = false;
        elements.mailInput.value = "";
        elements.loginBtn.disabled = false;
        elements.mailInput.disabled = false;
        elements.passwordInput.disabled = false;
        elements.passwordInput.value = "";
        elements.a2finput.value = "";
    }

    enableLoginForm(elements) {
        elements.cancelMojangBtn.disabled = false;
        elements.loginBtn.disabled = false;
        elements.mailInput.disabled = false;
        elements.passwordInput.disabled = false;
    }

    async handleLogin(elements, azauth, a2fCode = null) {
        const azAuth = new AZauth(azauth);
        try {
            const account_connect = a2fCode 
                ? await azAuth.login(elements.mailInput.value, elements.passwordInput.value, a2fCode)
                : await azAuth.login(elements.mailInput.value, elements.passwordInput.value);

            if (account_connect.error) {
                elements.infoLogin2f.innerHTML = 'Code a2f invalide';
                return;
            }
            console.log(account_connect.A2F);
            if (account_connect.A2F === true) {
                this.toggleLoginCards("a2f");
                elements.a2finput.value = "";
                elements.cancelMojangBtn.disabled = false;
                return;
            }
            

            if (account_connect.reason === 'user_banned') {
                elements.infoLogin.innerHTML = 'Votre compte est banni';
                this.enableLoginForm(elements);
                return;
            }

            const account = this.createAccountObject(account_connect);
            if (this.config.email_verified && !account.user_info.verified) {
                this.toggleLoginCards("email");
                elements.cancelMojangBtn.disabled = false;
                return;
            }

            await this.saveAccount(account);
            this.resetLoginForm(elements);
            elements.loginBtn.style.display = "block";
            elements.infoLogin.innerHTML = "&nbsp;";
        } catch (err) {
            console.log(err);
            elements.infoLogin.innerHTML = 'Adresse E-mail ou mot de passe invalide';
            this.enableLoginForm(elements);
        }
    }

    createAccountObject(account_connect) {
        return {
            access_token: account_connect.access_token,
            client_token: account_connect.uuid,
            uuid: account_connect.uuid,
            name: account_connect.name,
            user_properties: account_connect.user_properties,
            meta: {
                type: account_connect.meta.type,
                offline: true
            },
            user_info: {
                role: account_connect.user_info.role,
                monnaie: account_connect.user_info.money,
                verified: account_connect.user_info.verified,
            },
        };
    }

    async saveAccount(account) {
        await this.database.add(account, 'accounts');
        await this.database.update({ uuid: "1234", selected: account.uuid }, 'accounts-selected');
        addAccount(account);
        accountSelect(account.uuid);
        changePanel("home");
        this.refreshData();
    }
}

export default Login;
