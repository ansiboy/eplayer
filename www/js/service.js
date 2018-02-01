var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const PlayOrderType = 0;
const PlayRadomType = 1;
const CodeSuccess = 0;
const CODE_SUCCESS = 0;
const baseUrl = 'http://client.echomelody.com/index.php'; //?s=/AndroidAppInterface
class Service {
    static get(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = new XMLHttpRequest();
            request.open("GET", url, false);
            request.send(null);
            let text = request.responseText;
            var obj = JSON.parse(text);
            if (obj.code != CODE_SUCCESS) {
                throw new Error(obj.msg);
            }
            return obj.data;
        });
    }
    static ajax(path, defaultValue) {
        return __awaiter(this, void 0, void 0, function* () {
            return EPlayer.macAddress().then(mac => {
                let arg = `/AndroidAppInterface/${path}/mac/${mac}`;
                let url = `${baseUrl}?s=${encodeURIComponent(arg)}`;
                return fetch(url)
                    .then(response => {
                    return response.text();
                })
                    .then(text => {
                    let obj = JSON.parse(text);
                    if (obj.code != CODE_SUCCESS) {
                        // return Promise.reject<T>(new Error(obj.msg));
                        return Promise.resolve(defaultValue);
                    }
                    return obj.data;
                })
                    .catch(() => {
                    return null;
                });
            });
        });
    }
    /**
     * 获取音乐播放计划
     */
    playLists() {
        return __awaiter(this, void 0, void 0, function* () {
            let playlists;
            let result = yield Service.ajax('playlist', []);
            if (result != null) {
                playlists = result.playlist;
                localStorage.setItem('playlists', JSON.stringify(playlists));
            }
            else if (localStorage.getItem('playlists')) {
                playlists = JSON.parse(localStorage.getItem('playlists'));
            }
            else {
                playlists = [];
            }
            console.assert(playlists != null);
            for (let list of playlists) {
                list.music_list = list.music_list || [];
                if (list.offline_time == '00:00:00') {
                    list.offline_time = '24:00:00';
                }
                // for (let muisc of list.music_list) {
                //     muisc.path = encodeURI(muisc.path);
                // }
            }
            return playlists;
        });
    }
    /**
     * 获取插播计划
     */
    episode() {
        return __awaiter(this, void 0, void 0, function* () {
            // try {
            let result = yield Service.ajax('episode', []);
            if (result != null) {
                localStorage.setItem('episode', JSON.stringify(result));
            }
            else if (localStorage.getItem('episode')) {
                result = JSON.parse(localStorage.getItem('episode'));
            }
            else {
                result = [];
            }
            return result;
        });
    }
    checkVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            let data = yield Service.ajax('check_version');
            let path = (data || { path: null }).path;
            return path;
        });
    }
    static playSong(song_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return EPlayer.macAddress().then(mac => {
                return new Promise((resolve, reject) => {
                    let args = `/AndroidAppInterface/play_song/mac/${mac}/song_id/${song_id}`;
                    let url = `${baseUrl}?s=${args}`;
                    return fetch(url);
                });
            });
        });
    }
}
class EPlayer {
    execute() {
    }
    static reboot() {
        cordova.exec(() => {
            debugger;
        }, () => {
            debugger;
        }, this.serviceName, "reboot");
    }
    static freeSpace() {
        return new Promise((resolve, reject) => {
            cordova.exec((obj) => {
                resolve(obj);
            }, (err) => {
                reject(err);
            }, this.serviceName, "freeSpace", [""]);
        });
    }
    static setWifiFromUsb(callback) {
        cordova.exec((isSuccess) => {
            callback(isSuccess);
        }, () => {
        }, this.serviceName, 'setWifiFromUsb');
    }
    static macAddress() {
        return new Promise((resolve, reject) => {
            let value = localStorage.getItem('macAddress');
            // value = '58:cf:3f:a5:76:11';
            if (value) {
                resolve(value);
                return;
            }
            cordova.exec((macAddress) => {
                if (macAddress) {
                    localStorage.setItem('macAddress', macAddress);
                }
                resolve(macAddress);
            }, err => {
                reject(err);
            }, this.serviceName, 'macAddress');
        });
    }
    static noNetworkSound() {
        let SOUND_NETWORK_ERROR = 2;
        cordova.exec((isSuccess) => {
        }, () => {
        }, this.serviceName, 'playSound', [SOUND_NETWORK_ERROR]);
    }
    static setVolume(value) {
        cordova.exec(() => {
        }, () => {
        }, this.serviceName, 'setVolume', [value]);
    }
    static restart() {
        location.reload();
        // cordova.exec(() => { }, () => { }, this.serviceName, 'restart');
    }
}
EPlayer.serviceName = "EPlayer";
class PlayLists {
    // static currentPlayListChanged = $.Callbacks();
    static initialize() {
        let service = new Service();
        let update = () => {
            service.playLists().then(items => {
                this._playlists = items;
            });
            service.episode().then(items => {
                this._episodes = items;
            });
        };
        update();
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            update();
        }), 1000 * 60 * 5);
        document.addEventListener("online", () => {
            update();
        }, false);
    }
    static get playlists() {
        return this._playlists;
    }
    static get episodes() {
        return this._episodes;
    }
}
PlayLists._playlists = new Array();
PlayLists._episodes = new Array();
PlayLists.initialize();
function parseTime(time) {
    let arr = time.split(':');
    console.assert(arr.length == 3);
    let hour = Number.parseInt(arr[0]);
    let minute = Number.parseInt(arr[1]);
    let second = Number.parseInt(arr[2]);
    let today = new Date(Date.now());
    let year = today.getFullYear();
    let month = today.getMonth();
    let date = today.getDate();
    let d = new Date(year, month, date, hour, minute, second);
    return d;
}
