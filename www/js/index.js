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
        this.musicDirectory = musicDirectory;
        console.assert(this.musicDirectory != null);
        this.start();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.updatePlayLists();
            this.play();
            this.downloadScheduleMusic(MusicPlayer.playlists);
            let second = 1000;
            let minute = second * 60;
            setInterval(() => __awaiter(this, void 0, void 0, function* () {
                yield this.updatePlayLists();
                this.downloadScheduleMusic(MusicPlayer.playlists);
            }), minute * 30);
        });
    }
    play() {
        return __awaiter(this, void 0, void 0, function* () {
            let lists = MusicPlayer.playlists; //await this.getPlaySchedule();
            console.assert(lists != null);
            //========================================================
            // 如果没有播放列表，延时 60 秒，再尝试播放
            if (lists.length == 0) {
                let timeid = setTimeout(() => this.play(), 1000 * 60);
                return;
            }
            //========================================================
            for (let list of lists) {
                let online_time = this.parseTime(list.online_time);
                if (online_time > new Date(Date.now())) {
                    this.playList(lists[0], () => this.play());
                }
            }
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
    playList(list, finish) {
        let musics = list.music_list || [];
        //========================================================
        // 如果没有音乐，延时 60 秒，避免死循环
        if (musics.length == 0) {
            let timeid = setTimeout(() => finish(), 1000 * 60);
            return;
        }
        //========================================================
        let offline_time = this.parseTime(list.offline_time);
        let playMusic = (num) => {
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
        playMusic(0);
    }
    random(min, max) {
        return Math.floor(min + Math.random() * (max - min));
    }
    playMusic(music, finish) {
        return __awaiter(this, void 0, void 0, function* () {
            let file = yield this.musicLocalFile(music);
            let fileExists = file != null;
            let src = file != null ? file.fullPath : music.path;
            let media = new Media(src, () => {
            }, err => {
                if (file != null) {
                    file.remove(() => { });
                }
                finish();
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
    downloadFile(url, filePath) {
        var fileTransfer = new FileTransfer();
        return new Promise((resolve, reject) => {
            fileTransfer.download(url, filePath, (entry) => {
                resolve(entry);
            }, (err) => {
                debugger;
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
                    MusicPlayer.playlists = result.data.playlist;
                else
                    MusicPlayer.playlists = [];
            }
            finally {
                return MusicPlayer.playlists;
            }
        });
    }
    downloadScheduleMusic(playlists) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let playlist of playlists) {
                let musics = playlist.music_list;
                for (let music of musics) {
                    let musicFile = yield this.musicLocalFile(music);
                    if (musicFile == null) {
                        try {
                            let musicPath = this.musicLocalPath(music);
                            yield this.downloadFile(music.path, musicPath);
                        }
                        catch (err) {
                        }
                    }
                }
            }
        });
    }
}
MusicPlayer.playlists = new Array();
class MusicPage {
}
class Application {
    constructor() {
        document.addEventListener('deviceready', () => this.on_deviceready(), false);
    }
    on_deviceready() {
        return __awaiter(this, void 0, void 0, function* () {
            let musicDirectory = cordova.file.dataDirectory;
            let player = new MusicPlayer(musicDirectory);
        });
    }
    start() {
    }
}
let app = new Application();
app.start();
