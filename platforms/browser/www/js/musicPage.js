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
    class MusicPage extends React.Component {
        constructor(props) {
            super(props);
            this.rebootDurationDays = 7;
            this.rebootHour = 5;
            this.state = { musics: [], current: 0, title: "", info: "系统已经运行0天0小时0分", infos: [], showAllInfos: false };
            this.startTime = Date.now();
        }
        parseTime(time) {
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
        componentDidMount() {
            this.state.infos[0] = { name: `磁盘空间` };
            this.state.infos[1] = { name: `重启时间` };
            this.state.infos[2] = { name: `已下载音乐` };
            this.state.infos[3] = { name: `当前版本` };
            EPlayer.freeSpace().then(obj => {
                this.state.infos[0].value = `总容量:${Math.floor(obj.total / 1024)}M 剩余:${Math.floor(obj.free / 1024)}M`;
                this.setState(this.state);
            });
            // setInterval(() => {
            //     let musics = new Array<MusicItem>();
            //     if (MusicPlayer.playList != null) {
            //         musics = MusicPlayer.playList.music_list || [];
            //     }
            //     this.state.musics = musics;
            //     this.state.current = MusicPlayer.currentMusicIndex;
            //     let music = musics[this.state.current];
            //     this.state.title = music ? music.name : "";
            //     let now = new Date(Date.now());
            setInterval(() => {
                //==========================================================
                // 系统运行时间
                let runDuration = Date.now() - this.startTime;
                let seconds = Math.floor((runDuration / 1000));
                let minutes = 0;
                let hours = 0;
                let days = 0;
                if (seconds > 60) {
                    minutes = Math.floor(seconds / 60);
                    seconds = seconds % 60;
                }
                if (minutes > 60) {
                    hours = Math.floor(minutes / 60);
                    minutes = minutes % 60;
                }
                if (hours > 24) {
                    days = Math.floor(hours / 24);
                    hours = hours % 24;
                }
                this.state.info = `系统已经运行${days}天${hours}小时${minutes}分`;
                this.setState(this.state);
            }, 1000 * 60);
            //     //==========================================================
            //     //==========================================================
            //     this.state.infos[1].value = `${this.rebootDurationDays - days}天后${this.rebootHour}点重启`;
            //     if (days >= this.rebootDurationDays && now.getHours() == this.rebootHour) {
            //         EPlayer.reboot();
            //     }
            //     //==========================================================
            //     this.setState(this.state);
            // }, 1000 * 10);
            if (musicPlayer_1.MusicPlayer.playList) {
                this.updateMusics(musicPlayer_1.MusicPlayer.playList);
            }
            musicPlayer_1.MusicPlayer.playListChanged.add((playList) => {
                this.updateMusics(playList);
            });
            musicPlayer_1.MusicPlayer.currentMusicChanged.add((music, musicIndex) => {
                this.state.current = musicIndex;
                this.setState(this.state);
            });
        }
        updateMusics(playList) {
            this.state.musics = playList.music_list;
            this.state.current = musicPlayer_1.MusicPlayer.currentMusicIndex;
            this.setState(this.state);
        }
        toggleInfo() {
            return __awaiter(this, void 0, void 0, function* () {
                this.state.showAllInfos = !this.state.showAllInfos;
                if (this.state.showAllInfos) {
                    let dir = yield common_1.musicDirectory();
                    window.resolveLocalFileSystemURL(dir.nativeURL, (entry) => {
                        let reader = entry.createReader();
                        reader.readEntries((entires) => {
                            this.state.infos[2].value = `${entires.length}首`;
                            this.setState(this.state);
                        });
                    });
                    chcp.getVersionInfo((err, data1) => {
                        chcp.isUpdateAvailableForInstallation((err, data) => {
                            this.state.infos[3].value = `${data1.currentWebVersion}`;
                            if (!err) {
                                this.state.infos[3].value = this.state.infos[3].value + `(已有更新)`;
                            }
                            this.setState(this.state);
                        });
                    });
                }
                this.setState(this.state);
            });
        }
        render() {
            let musics = this.state.musics;
            let current = this.state.current;
            let { title, info, showAllInfos, infos } = this.state;
            let music = musicPlayer_1.MusicPlayer.currentMeida;
            return [
                React.createElement("div", { key: "title", className: "title", onClick: () => {
                        var b = confirm("测试：点击确认按钮重启");
                        if (b)
                            EPlayer.restart();
                    } }, title),
                React.createElement("div", { key: "musics", className: "music-list" }, musics.map((o, i) => (React.createElement("div", { key: o.mid, className: i == current ? "music-name active" : "music-name" },
                    o.name,
                    " ",
                    i == current && music != null ?
                        React.createElement("span", { ref: (e) => {
                                if (!e)
                                    return;
                                // music.getCurrentPosition(position => {
                                //     e.innerHTML = ` (${Math.floor(music.getDuration() - position)}/${Math.floor(music.getDuration())})`;
                                // })
                            } }) : null)))),
                React.createElement("div", { key: "infos", className: "infos", onClick: () => {
                        this.toggleInfo();
                    } },
                    showAllInfos ? infos.map((o, i) => React.createElement("div", { className: "item", key: i },
                        React.createElement("div", { style: { float: 'right' } }, o.value),
                        React.createElement("div", null, o.name))) : null,
                    React.createElement("div", { className: "item" }, info))
            ];
        }
    }
    exports.MusicPage = MusicPage;
});
