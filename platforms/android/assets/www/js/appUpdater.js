var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AppUpdater {
        constructor() {
            // this.checkForUpdate();
            this.init();
        }
        init() {
            setInterval(() => {
                this.checkForUpdate();
            }, 1000 * 30);
            this.checkForInstall();
        }
        checkForUpdate() {
            return __awaiter(this, void 0, void 0, function* () {
                let service = new Service();
                let path = yield service.checkVersion();
                if (!path)
                    return;
                var options = {
                    'config-file': path
                };
                return new Promise((resolve, reject) => {
                    chcp.configure(options, (err) => {
                        if (err) {
                            console.log(err);
                            reject(err);
                            return;
                        }
                        chcp.fetchUpdate((err1, data) => {
                            resolve();
                        });
                    });
                });
            });
        }
        /**
         * 检查更新
         */
        checkForInstall() {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    chcp.isUpdateAvailableForInstallation((err) => {
                        if (err) {
                            chcp.fetchUpdate((err1, data) => {
                                resolve();
                            });
                            // reject(err);
                            return;
                        }
                        //====================================
                        chcp.installUpdate((err2) => {
                            if (err2) {
                                console.log(err2);
                            }
                            else {
                                console.log('update success');
                            }
                            resolve();
                        });
                        //====================================
                    });
                });
            });
        }
        /**
         * 检查是否有已下载的安装包，如果有就安装。
         */
        checkToInstall() {
            return __awaiter(this, void 0, void 0, function* () {
                yield new Promise((resolve, reject) => {
                    chcp.isUpdateAvailableForInstallation((err) => {
                        if (err) {
                            console.log(err);
                            resolve();
                            return;
                        }
                        chcp.installUpdate((err) => {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                console.log('update success');
                            }
                            resolve();
                        });
                    });
                });
            });
        }
    }
    exports.AppUpdater = AppUpdater;
});
