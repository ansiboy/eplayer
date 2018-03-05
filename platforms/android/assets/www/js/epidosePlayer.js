var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "common", "musicPlayer"], function (require, exports, common_1, musicPlayer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class EpidosePlayer {
        static pause() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._isPause || this.episode == null) {
                    return;
                }
                this._isPause = true;
                this.episode.pause();
            });
        }
        static play() {
            if (this.episode) {
                musicPlayer_1.MusicPlayer.pause();
                this._isPause = false;
                this.episode.play();
                return true;
            }
            else if (this.episodes) {
                this.playEpisode(this.episodes, 0);
                this.episodes = null;
            }
            return false;
        }
        static playEpisode(episodes, index) {
            return __awaiter(this, void 0, void 0, function* () {
                if (index > episodes.length - 1) {
                    this.episode = null;
                    this.episodes = null;
                    this.playComplete.fire();
                    return;
                }
                this._isPause = false;
                this.playStart.fire();
                this.episode = yield common_1.playMusicByPath(episodes[index].path, () => {
                    this.playEpisode(episodes, index + 1);
                });
                if (this.episode != null && InstantEpisode.playing) {
                    this._isPause = true;
                    this.episode.pause();
                }
            });
        }
        static start() {
            return __awaiter(this, void 0, void 0, function* () {
                let timeIntervalId = setInterval(() => {
                    //========================================================
                    // 没有新的插播直接返回
                    let episodes = this.currentEpisodes();
                    if (episodes == null || episodes.length == 0)
                        return;
                    //========================================================
                    // 有插播处于待播放
                    if (this.episodes != null)
                        return;
                    //========================================================
                    this.episodes = episodes;
                    this.playEpisode(episodes, 0);
                    //========================================================
                }, 1000 * 60);
                InstantEpisode.playStart.add(() => {
                    this.pause();
                });
                InstantEpisode.playComplete.add(() => {
                    this.play();
                });
            });
        }
        static currentEpisodes() {
            let now = new Date(Date.now());
            let items = new Array();
            let episodes = PlayLists.episodes;
            for (let i = 0; i < episodes.length; i++) {
                let episode = episodes[i];
                let start_day = common_1.parseDate(episode.start_day);
                let end_day = common_1.parseDate(episode.end_day);
                let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (today >= start_day && today < end_day) {
                    for (let timeString of episode.i_time) {
                        let time = common_1.parseTime(timeString);
                        if (time.getHours() == now.getHours() && time.getMinutes() == now.getMinutes()) {
                            items.push(episode);
                        }
                    }
                }
            }
            return items;
        }
        /**
         * 还没插播没有播放完
         */
        static get hasEpidose() {
            return this.episode != null;
        }
    }
    EpidosePlayer._isPause = false;
    EpidosePlayer.playComplete = $.Callbacks();
    EpidosePlayer.playStart = $.Callbacks();
    exports.EpidosePlayer = EpidosePlayer;
    class InstantEpisode {
        static start() {
            this.connect();
        }
        static get playing() {
            return this._playing;
        }
        // 连接服务端
        static connect() {
            // 创建websocket
            this.ws = new WebSocket("ws://139.196.206.50:8282");
            // 当socket连接打开时，输入用户名
            this.ws.onopen = () => this.onopen();
            // 当有消息时根据消息类型显示不同信息
            this.ws.onmessage = (e) => this.onmessage(e);
            this.ws.onclose = () => {
                console.log("连接关闭，定时重连");
                this.connect();
            };
            this.ws.onerror = function () {
                console.log("出现错误");
            };
        }
        // 连接建立时发送登录信息
        static onopen() {
            return __awaiter(this, void 0, void 0, function* () {
                var mac = yield EPlayer.macAddress(); //"<?php echo $_GET['mac']; ?>";
                console.log('当前androidBox的mac:' + mac);
                // 登录
                var login_data = '{"type":"login","client_mac":"' + mac + '"}';
                console.log("websocket握手成功，发送登录数据:" + login_data);
                this.ws.send(login_data);
                var get_login_volume = '{"type":"login_volume","client_mac":"' + mac + '"}';
                console.log("登录之后，发送消息获取登录的音量:" + get_login_volume);
                this.ws.send(get_login_volume);
            });
        }
        // 服务端发来消息时
        static onmessage(e) {
            console.log(e.data);
            var data = JSON.parse(e.data);
            switch (data['type']) {
                // 服务端ping客户端
                case 'ping':
                    this.ws.send('{"type":"pong"}');
                    break;
                    ;
                // 即时插播 
                case 'insert':
                    if (this._playing == true) {
                        return;
                    }
                    this._playing = true;
                    this.playStart.fire();
                    common_1.playMusicByUrl("http://" + data['data']['path'], () => {
                        this._playing = false;
                        this.playComplete.fire();
                    });
                    break;
                case 'setvol':
                    // console.log(data['volume']);
                    EPlayer.setVolume(data['volume']);
                    this.ws.send('{"type":"volume","volume":"' + data['volume'] + '"}');
                    break;
            }
        }
    }
    InstantEpisode.playComplete = $.Callbacks();
    InstantEpisode.playStart = $.Callbacks();
    exports.InstantEpisode = InstantEpisode;
});
