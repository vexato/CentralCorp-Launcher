import { database, changePanel, addAccount, accountSelect } from '../utils.js';
const { AZauth } = require('minecraft-java-core-azbetter');
const { ipcRenderer, shell } = require('electron');
const pkg = require('../package.json');

'use strict';


class Login {
    static id = "login";

    async init(config) {
        this.config = config;
        this.database = await new database().init();
        if (this.config.online) {
            this.getOnline();
        } else {
            this.getOffline();
        }
    }
    async refreshData() {

        document.querySelector('.player-role').innerHTML = '';
        document.querySelector('.player-monnaie').innerHTML = '';
        
        await this.initOthers();
        await this.initPreviewSkin();
    }
    async initPreviewSkin() {
        console.log('initPreviewSkin called');
        const websiteUrl = this.config.azauth;
        let uuid = (await this.database.get('1234', 'accounts-selected')).value;
        let account = (await this.database.get(uuid.selected, 'accounts')).value;
    
        let title = document.querySelector('.player-skin-title');
        title.innerHTML = `Skin de ${account.name}`;
    
        const skin = document.querySelector('.skin-renderer-settings');
        const cacheBuster = new Date().getTime();
        const url = `${websiteUrl}/skin3d/3d-api/skin-api/${account.name}?_=${cacheBuster}`;
        skin.src = url;
    }
    async initOthers() {
        const uuid = (await this.database.get('1234', 'accounts-selected')).value;
        const account = (await this.database.get(uuid.selected, 'accounts')).value;

        if (this.config.role === true && account.user_info.role) {
            const blockRole = document.createElement("div");
            blockRole.innerHTML = `<div>Grade: ${account.user_info.role.name}</div>`;
            document.querySelector('.player-role').appendChild(blockRole);
        } else {
            document.querySelector(".player-role").style.display = "none";
        }

        if (this.config.money === true) {
            const blockMonnaie = document.createElement("div");
            blockMonnaie.innerHTML = `<div>${account.user_info.monnaie} pts</div>`;
            document.querySelector('.player-monnaie').appendChild(blockMonnaie);
        } else {
            document.querySelector(".player-monnaie").style.display = "none";
        }
        if (this.config.whitelist_activate === true && 
            (!this.config.whitelist.includes(account.name) &&
             !this.config.whitelist_roles.includes(account.user_info.role.name))) {
            document.querySelector(".play-btn").style.backgroundColor = "#696969";
            document.querySelector(".play-btn").style.pointerEvents = "none";
            document.querySelector(".play-btn").style.boxShadow = "none";
            document.querySelector(".play-btn").textContent = "Indisponible";
        } else {
            document.querySelector(".play-btn").style.backgroundColor = "#00bd7a";
            document.querySelector(".play-btn").style.pointerEvents = "auto";
            document.querySelector(".play-btn").style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.3)";
            document.querySelector(".play-btn").textContent = "Jouer";
        }
        
        
        const urlPattern = /^(http:\/\/|https:\/\/)/;
        if (account.user_info.role.name === this.config.role_data.role1.name) {
            if (urlPattern.test(this.config.role_data.role1.background) === true) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role1.background}) black no-repeat center center scroll`;
            } else {
                document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
            }
        }
        if (account.user_info.role.name === this.config.role_data.role2.name) {
            if (urlPattern.test(this.config.role_data.role2.background) === true) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role2.background}) black no-repeat center center scroll`;
            }else {
                document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
            }
        }
        if (account.user_info.role.name === this.config.role_data.role3.name) {
            if (urlPattern.test(this.config.role_data.role3.background) === true) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role3.background}) black no-repeat center center scroll`;
            } else {
                document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
            }
        }
        if (account.user_info.role.name === this.config.role_data.role4.name) {
            if (urlPattern.test(this.config.role_data.role4.background) === true) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role4.background}) black no-repeat center center scroll`;
            } else {
                document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
            }
        }
        if (account.user_info.role.name === this.config.role_data.role5.name) {
            if (urlPattern.test(this.config.role_data.role5.background) === true) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role5.background}) black no-repeat center center scroll`;
            } else {
                document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
            }
        }
        if (account.user_info.role.name === this.config.role_data.role6.name) {
            if (urlPattern.test(this.config.role_data.role6.background) === true) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role6.background}) black no-repeat center center scroll`;
            } else {
                document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
            }
        }
        if (account.user_info.role.name === this.config.role_data.role7.name) {
            if (urlPattern.test(this.config.role_data.role7.background) === true) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role7.background}) black no-repeat center center scroll`;
            } else {
                document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
            }
        }
        if (account.user_info.role.name === this.config.role_data.role8.name) {
            if (urlPattern.test(this.config.role_data.role1.background) === true) {
            document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${this.config.role_data.role8.background}) black no-repeat center center scroll`;
            } else {
                document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("../src/assets/images/background/light.jpg") black no-repeat center center scroll`;
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
        const mailInput = document.querySelector('.Mail');
        const passwordInput = document.querySelector('.Password');
        const cancelMojangBtn = document.querySelector('.cancel-mojang');
        const infoLogin = document.querySelector('.info-login');
        const loginBtn = document.querySelector(".login-btn");
        const mojangBtn = document.querySelector('.mojang');
        const loginBtn2f = document.querySelector('.login-btn-2f');
        const a2finput = document.querySelector('.a2f');
        const infoLogin2f = document.querySelector('.info-login-2f');
        const cancel2f = document.querySelector('.cancel-2f');
        const infoLoginEmail = document.querySelector('.info-login-email');
        const cancelEmail = document.querySelector('.cancel-email');

        const azauth = this.config.azauth;
               const newuserurl = `${azauth}/user/register`;
               this.newuser = document.querySelector(".new-user");
               this.newuser.innerHTML = "Pas de compte ?";
               this.newuser.addEventListener('click', () => {
                   shell.openExternal(newuserurl);
               });
       
               const passwordreseturl = `${azauth}/user/password/reset`;
               this.passwordreset = document.querySelector(".password-reset");
               this.passwordreset.innerHTML = "Mot de passe oublié ?";
               this.passwordreset.addEventListener('click', () => {
                   shell.openExternal(passwordreseturl);
               });

        mojangBtn.addEventListener("click", () => {
            document.querySelector(".login-card").style.display = "none";
            document.querySelector(".login-card-mojang").style.display = "block";
            document.querySelector('.a2f-card').style.display = "none";
            document.querySelector('.email-verify-card').style.display = "none";
        });

        cancelMojangBtn.addEventListener("click", () => {
            document.querySelector(".login-card").style.display = "block";
            document.querySelector(".login-card-mojang").style.display = "none";
            document.querySelector('.a2f-card').style.display = "none";
            document.querySelector('.email-verify-card').style.display = "none";
        });

        cancel2f.addEventListener("click", () => {
            document.querySelector(".login-card").style.display = "block";
            document.querySelector(".login-card-mojang").style.display = "none";
            document.querySelector('.a2f-card').style.display = "none";
            document.querySelector('.email-verify-card').style.display = "none";
            infoLogin.style.display = "none";
            cancelMojangBtn.disabled = false;
            mailInput.value = "";
            loginBtn.disabled = false;
            mailInput.disabled = false;
            passwordInput.disabled = false;
            passwordInput.value = "";
        });
        cancelEmail.addEventListener("click", () => {
            document.querySelector(".login-card").style.display = "block";
            document.querySelector(".login-card-mojang").style.display = "none";
            document.querySelector('.a2f-card').style.display = "none";
            document.querySelector('.email-verify-card').style.display = "none";
            infoLogin.style.display = "none";
            cancelMojangBtn.disabled = false;
            mailInput.value = "";
            loginBtn.disabled = false;
            mailInput.disabled = false;
            passwordInput.disabled = false;
            passwordInput.value = "";
        });

        loginBtn2f.addEventListener("click", async () => {
            if (a2finput.value == "") {
                infoLogin2f.innerHTML = "Entrez votre code a2f";
                return;
            }
            const azAuth = new AZauth(azauth);

            await azAuth.login(mailInput.value, passwordInput.value, a2finput.value).then(async account_connect => {
                console.log(account_connect);
                if (account_connect.error) {
                    infoLogin2f.innerHTML = 'Code a2f invalide';
                    return;
                }
                const account = {
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

                this.database.add(account, 'accounts');
                this.database.update({ uuid: "1234", selected: account.uuid }, 'accounts-selected');

                addAccount(account);
                accountSelect(account.uuid);
                changePanel("home");
                this.refreshData();

                cancelMojangBtn.disabled = false;
                cancelMojangBtn.click();
                mailInput.value = "";
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                loginBtn.style.display = "block";
                infoLogin.innerHTML = "&nbsp;";
            });
        });

        loginBtn.addEventListener("click", async () => {
            cancelMojangBtn.disabled = true;
            loginBtn.disabled = true;
            mailInput.disabled = true;
            passwordInput.disabled = true;
            infoLogin.innerHTML = "Connexion en cours...";

            if (mailInput.value == "") {
                console.log(mailInput.value);
                infoLogin.innerHTML = "Entrez votre pseudo";
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                return;
            }

            if (passwordInput.value == "") {
                infoLogin.innerHTML = "Entrez votre mot de passe";
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                return;
            }
            const azAuth = new AZauth(azauth);

            await azAuth.login(mailInput.value, passwordInput.value).then(async account_connect => {
                console.log(account_connect);

                if (account_connect.A2F === true) {
                    document.querySelector('.a2f-card').style.display = "block";
                    document.querySelector(".login-card-mojang").style.display = "none";
                    cancelMojangBtn.disabled = false;
                    return;
                }

                if (account_connect.reason === 'user_banned') {
                    cancelMojangBtn.disabled = false;
                    loginBtn.disabled = false;
                    mailInput.disabled = false;
                    passwordInput.disabled = false;
                    infoLogin.innerHTML = 'Votre compte est banni';
                    return;
                }

                cancelMojangBtn.addEventListener("click", () => {
                    document.querySelector(".login-card").style.display = "block";
                    document.querySelector(".login-card-mojang").style.display = "none";
                    document.querySelector('.a2f-card').style.display = "none";
                });

                const account = {
                    access_token: account_connect.access_token,
                    client_token: account_connect.uuid,
                    uuid: account_connect.uuid,
                    name: account_connect.name,
                    user_properties: account_connect.user_properties,
                    meta: {
                        type: account_connect.meta.type,
                        offline: true,
                    },
                    user_info: {
                        role: account_connect.user_info.role,
                        monnaie: account_connect.user_info.money,
                        verified: account_connect.user_info.verified,
                    },
                };
                if (this.config.email_verified === true && account.user_info.verified === false) {
                    document.querySelector('.email-verify-card').style.display = "block";
                    document.querySelector(".login-card-mojang").style.display = "none";
                    cancelMojangBtn.disabled = false;
                    return;
                }
                this.database.add(account, 'accounts');
                this.database.update({ uuid: "1234", selected: account.uuid }, 'accounts-selected');

                addAccount(account);
                accountSelect(account.uuid);
                changePanel("home");
                this.refreshData();

                cancelMojangBtn.disabled = false;
                cancelMojangBtn.click();
                mailInput.value = "";
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                passwordInput.value = "";
                loginBtn.style.display = "block";
                infoLogin.innerHTML = "&nbsp;";
            }).catch(err => {
                console.log(err);
                cancelMojangBtn.disabled = false;
                loginBtn.disabled = false;
                mailInput.disabled = false;
                passwordInput.disabled = false;
                infoLogin.innerHTML = 'Adresse E-mail ou mot de passe invalide';
            });
        });
    }
}

export default Login;
