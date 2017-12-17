var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class MusicPlayer {
    constructor(musicDirectory) {
        this.playlists = new Array();
        this.currentMusicIndex = -1;
        this.musicDirectory = musicDirectory;
        console.assert(this.musicDirectory != null);
        this.clear();
        // setTimeout(() => {
        this.start();
        // }, 1000 * 2);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updatePlayLists();
            // this.play();
            this.downloadScheduleMusic(this.playlists);
            let second = 1000;
            let minute = second * 60;
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                yield this.updatePlayLists();
                this.downloadScheduleMusic(this.playlists);
            }), minute * 30);
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                if (this.currentPlayList != null)
                    return;
                let lists = this.playlists;
                for (let list of lists) {
                    let online_time = this.parseTime(list.online_time);
                    let offline_time = this.parseTime(list.offline_time);
                    let now = new Date(Date.now());
                    if (now >= online_time && now < offline_time) {
                        this.playList(list);
                        break;
                    }
                }
            }), 1000 * 5);
        });
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
    playList(list) {
        this.currentPlayList = list;
        let musics = list.music_list || [];
        let finish = () => {
            this.currentPlayList = null;
        };
        //========================================================
        // 如果没有音乐，延时 60 秒，避免死循环
        if (musics.length == 0) {
            let timeid = setTimeout(() => finish(), 1000 * 60);
            return;
        }
        //========================================================
        let offline_time = this.parseTime(list.offline_time);
        let playMusic = (num) => {
            this.currentMusicIndex = num;
            this.playMusic(musics[num], () => {
                if (offline_time <= new Date(Date.now())) {
                    finish();
                    return;
                }
                let next = nextMusic(num);
                playMusic(next);
            });
        };
        let nextMusic = (current) => {
            if (musics.length == 1) {
                return 0;
            }
            // 如果列表为随机播放，则随机取一首音乐，并且不等于当前播放的音乐
            if (list.type == PlayRadomType) {
                let r;
                do {
                    r = this.random(0, musics.length - 1);
                } while (r == current);
                return r;
            }
            let num = current + 1;
            if (num > list.music_list.length - 1)
                num = 0;
            return num;
        };
        let num = nextMusic(-1);
        playMusic(num);
    }
    random(min, max) {
        let value = Math.floor(Math.random() * (max - min + 1)) + min;
        return value;
    }
    playMusic(music, finish) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield this.musicLocalFile(music);
            let fileExists = file != null;
            let src = file != null ? file.nativeURL : music.path;
            // src = music.path;
            let media = new Media(src, () => {
            }, err => {
                if (file != null) {
                    file.remove(() => { });
                }
                //=======================================
                // 延时 2 秒，以防出现死循环
                setTimeout(() => {
                    finish();
                }, 1000 * 2);
                //=======================================
            }, (status) => {
                if (status == Media.MEDIA_STOPPED) {
                    finish();
                }
            });
            media.play();
        });
    }
    musicLocalPath(music) {
        let arr = music.path.split('/');
        let fileName = arr[arr.length - 1];
        let filePath = this.musicDirectory + fileName;
        return filePath;
    }
    musicLocalFile(music) {
        let arr = music.path.split('/');
        let fileName = arr[arr.length - 1];
        let directoryName = this.musicDirectory;
        return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(directoryName, (entry) => {
                if (entry.isFile) {
                    resolve(null);
                    return;
                }
                let reader = entry.createReader();
                reader.readEntries((entries) => {
                    for (let child of entries) {
                        if (child.isFile && child.name == fileName) {
                            resolve(child);
                            break;
                        }
                    }
                    resolve(null);
                }, err => reject(err));
            }, err => reject(err));
        });
    }
    downloadFile(url, filePath) {
        var fileTransfer = new FileTransfer();
        return new Promise((resolve, reject) => {
            fileTransfer.download(url, filePath, (entry) => {
                resolve(entry);
                console.log(`download success,path:${filePath} url:${url}`);
            }, (err) => {
                debugger;
                console.warn(`download success,path:${filePath} url:${url}`);
                reject(err);
            });
        });
    }
    childFile(directoryName, fileName) {
        return new Promise((resolve, reject) => {
            window.resolveLocalFileSystemURL(directoryName, (entry) => {
                if (entry.isFile) {
                    resolve(null);
                    return;
                }
                let reader = entry.createReader();
                reader.readEntries((entries) => {
                    for (let child of entries) {
                        if (child.isFile && child.name == child.name) {
                            resolve(child);
                            break;
                        }
                    }
                    resolve(null);
                }, err => reject(err));
            }, err => reject(err));
        });
    }
    updatePlayLists() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let service = new Service();
                let result = yield service.playSchedule();
                if (result.code == CodeSuccess)
                    this.playlists = result.data.playlist;
                else
                    this.playlists = [];
            }
            finally {
                return this.playlists;
            }
        });
    }
    clear() {
        window.resolveLocalFileSystemURL(this.musicDirectory, (entry) => {
            let reader = entry.createReader();
            reader.readEntries((entries) => {
                for (let entry of entries)
                    entry.remove(() => {
                        console.log(`remove sucess, fileName: ${entry.name}`);
                    }, () => {
                        console.log(`remove fail, fileName: ${entry.name}`);
                    });
            });
        });
    }
    downloadScheduleMusic(playlists) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check Disk
            let downloadMusic = (musics, index) => {
                if (index > musics.length - 1)
                    return Promise.resolve();
                let music = musics[index];
                console.log(`download music ${index}`);
                return this.musicLocalFile(music)
                    .then(musicFile => {
                    if (musicFile) {
                        console.log(`file exists, path ${musicFile.nativeURL}`);
                        return Promise.resolve(musicFile);
                    }
                    let musicPath = this.musicLocalPath(music);
                    return this.downloadFile(music.path, musicPath);
                })
                    .catch(() => {
                    return Promise.resolve(null);
                })
                    .then(() => {
                    return downloadMusic(musics, index + 1);
                });
            };
            let downloadList = (playlists, index) => {
                if (index > playlists.length - 1)
                    return;
                console.log(`download list ${index}`);
                downloadMusic(playlists[index].music_list, 0)
                    .then(() => downloadList(playlists, index + 1))
                    .catch(() => downloadList(playlists, index + 1));
            };
            downloadList(playlists, 0);
            // for (let playlist of playlists) {
            //     let musics = playlist.music_list;
            //     for (let music of musics) {
            //         let musicFile = await this.musicLocalFile(music);
            //         if (musicFile == null) {
            //             try {
            //                 let musicPath = this.musicLocalPath(music);
            //                 console.log(`to download ${musicPath}`)
            //                 this.downloadFile(music.path, musicPath);
            //             }
            //             catch (err) {
            //                 debugger;
            //             }
            //         }
            //     }
            // }
        });
    }
}
class MusicPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { musics: [], current: 0 };
        setInterval(() => {
            let musics = [];
            if (this.props.player.currentPlayList != null) {
                musics = this.props.player.currentPlayList.music_list || [];
            }
            this.state.musics = musics;
            this.state.current = this.props.player.currentMusicIndex;
            this.setState(this.state);
        }, 1000 * 2);
    }
    render() {
        let musics = this.state.musics;
        let current = this.state.current;
        return [
            React.createElement("div", { key: "title", className: "title" }, "Title"),
            React.createElement("div", { key: "musics", className: "music-list" }, musics.map((o, i) => (React.createElement("div", { key: o.mid, className: i == current ? "music-name active" : "music-name" }, o.name)))),
            React.createElement("div", { key: "info", className: "info" }, "Info")
        ];
    }
}
class Application {
    constructor() {
        document.addEventListener('deviceready', () => this.on_deviceready(), false);
    }
    on_deviceready() {
        return __awaiter(this, void 0, void 0, function* () {
            let dataDirectory = cordova.file.dataDirectory;
            let musicDirectory = yield new Promise((resolve, reject) => {
                window.resolveLocalFileSystemURL(cordova.file.dataDirectory, (entry) => {
                    entry.getDirectory('musics1', { create: true }, entry => {
                        // entry.remove(()=>{});
                        resolve(entry);
                    }, err => {
                        reject(err);
                    });
                }, (err) => {
                    reject(err);
                });
            });
            let player = new MusicPlayer(musicDirectory.nativeURL);
            let appElement = document.getElementsByClassName('app')[0];
            ReactDOM.render(React.createElement(MusicPage, { player: player }), appElement);
        });
    }
    start() {
    }
}
let app = new Application();
app.start();
