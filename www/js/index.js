var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "common", "musicPlayer", "epidosePlayer", "musicFileManager", "musicPage", "appUpdater"], function (require, exports, common_1, musicPlayer_1, epidosePlayer_1, musicFileManager_1, musicPage_1, appUpdater_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Application {
        constructor() {
            document.addEventListener('deviceready', () => this.on_deviceready(), false);
        }
        on_deviceready() {
            return __awaiter(this, void 0, void 0, function* () {
                let appUpdater = new appUpdater_1.AppUpdater();
                yield appUpdater.checkToInstall();
                let musicDirectory = yield this.musicDirectory();
                epidosePlayer_1.EpidosePlayer.start();
                let appElement = document.getElementsByClassName('app')[0];
                epidosePlayer_1.InstantEpisode.start();
                musicPlayer_1.MusicPlayer.start();
                musicFileManager_1.MusicFileManager.start();
                ReactDOM.render(React.createElement(musicPage_1.MusicPage, null), appElement);
                //===============================================================
                // 每隔 1 秒检查播放列表，如果在时间段内，进行播放
                let currentPlayList;
                setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    if (epidosePlayer_1.EpidosePlayer.hasEpidose) {
                        return;
                    }
                    let lists = PlayLists.playlists; //this.playlists;
                    for (let list of lists) {
                        let online_time = common_1.parseTime(list.online_time);
                        let offline_time = common_1.parseTime(list.offline_time);
                        let now = new Date(Date.now());
                        var c1 = offline_time > online_time && now >= online_time && now < offline_time;
                        var c2 = offline_time < online_time && (now >= online_time || now < offline_time);
                        if (c1 || c2) {
                            currentPlayList = list;
                            musicPlayer_1.MusicPlayer.playList = currentPlayList;
                            break;
                        }
                    }
                    let now = new Date(Date.now());
                    var s = now.getSeconds();
                    var h = now.getHours();
                    var m = now.getMinutes();
                    if (h == 0 && m == 14 && this.restartTimeId == null) {
                        //==========================================
                        // 延时，防止多次重启
                        this.restartTimeId = setTimeout(() => {
                            EPlayer.restart();
                        }, 1000 * 60);
                        //==========================================
                    }
                }), 1000 * 1);
                // let now = new Date(Date.now());
                // let reloadTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0);
                // var delay_seconds = reloadTime.valueOf() - Date.now();
                // setTimeout(() => {
                //     debugger;
                //     EPlayer.restart();
                // }, 1000 * delay_seconds);
            });
        }
        // /**
        //  * 提示无网络
        //  */
        // private tipsNoNetworkTimeID: number;
        // private tipsNoNetwork() {
        //     /** 已经提示了，返回 */
        //     if (this.tipsNoNetworkTimeID) {
        //         return;
        //     }
        //     this.tipsNoNetworkTimeID = setTimeout(() => {
        //         if (navigator.network.connection.type == Connection.NONE) {
        //             // EPlayer.noNetworkSound();
        //             var timeIntervalId = setInterval(() => {
        //                 if (EpidosePlayer.playing) {
        //                     return;
        //                 }
        //                 clearInterval(timeIntervalId);
        //                 MusicPlayer.pause();
        //                 playMusicByPath("no_network", () => {
        //                     MusicPlayer.play();
        //                 })
        //             }, 1000 * 2)
        //         }
        //         else {
        //             clearTimeout(this.tipsNoNetworkTimeID);
        //             this.tipsNoNetworkTimeID = null;
        //         }
        //     }, 1000 * 60 * 50);
        // }
        musicDirectory() {
            return __awaiter(this, void 0, void 0, function* () {
                return new Promise((resolve, reject) => {
                    let dir = cordova.file.externalRootDirectory || cordova.file.dataDirectory;
                    window.resolveLocalFileSystemURL(dir, (entry) => {
                        entry.getDirectory('EM', { create: true }, entry => {
                            resolve(entry);
                        }, err => {
                            reject(err);
                        });
                    }, (err) => {
                        reject(err);
                    });
                });
            });
        }
    }
    let app = new Application();
});
