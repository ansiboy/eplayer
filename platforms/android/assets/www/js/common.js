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
    exports.parseTime = parseTime;
    function parseDate(dateString) {
        let arr = dateString.split('-');
        let year = Number.parseInt(arr[0]);
        let month = Number.parseInt(arr[1]) - 1;
        let date = Number.parseInt(arr[2]);
        let d = new Date(year, month, date);
        return d;
    }
    exports.parseDate = parseDate;
    function musicLocalFile(music) {
        //directoryName: string, 
        let arr = music.path.split('/');
        let fileName = arr[arr.length - 1];
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let directory = yield musicDirectory();
            let directoryName = directory.nativeURL;
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
        }));
    }
    exports.musicLocalFile = musicLocalFile;
    function playMusicByUrl(url, callFinish) {
        let media = new Media(url, () => {
        }, err => {
            //=======================================
            // 延时 2 秒，以防出现死循环
            setTimeout(() => {
                callFinish();
            }, 1000 * 2);
            //=======================================
        }, (status) => {
            switch (status) {
                case Media.MEDIA_PAUSED:
                case Media.MEDIA_RUNNING:
                case Media.MEDIA_STARTING:
                    break;
                default:
                case Media.MEDIA_STOPPED:
                case Media.MEDIA_NONE:
                    media.getCurrentPosition(position => console.log(`music stopped, current position is ${position}`));
                    callFinish();
            }
        });
        media.play();
    }
    exports.playMusicByUrl = playMusicByUrl;
    function playMusicByPath(path, finish, position) {
        return __awaiter(this, void 0, void 0, function* () {
            let md = yield musicDirectory();
            let file = yield musicLocalFile({ path });
            let fileExists = file != null;
            //=========================================
            // 确保 finish 只调用一次
            let callFinish = () => {
                if (finish == null)
                    return;
                finish();
                finish = null;
                media.stop();
                media.release();
            };
            //=========================================
            let src = file != null ? file.nativeURL : path;
            let media = new Media(src, () => {
            }, err => {
                if (file != null) {
                    file.remove(() => { });
                }
                //=======================================
                // 延时 2 秒，以防出现死循环
                setTimeout(() => {
                    callFinish();
                }, 1000 * 2);
                //=======================================
            }, (status) => {
                switch (status) {
                    case Media.MEDIA_PAUSED:
                    case Media.MEDIA_RUNNING:
                    case Media.MEDIA_STARTING:
                        break;
                    default:
                    case Media.MEDIA_STOPPED:
                    case Media.MEDIA_NONE:
                        media.getCurrentPosition(position => console.log(`music stopped, current position is ${position}`));
                        callFinish();
                }
            });
            media.play();
            if (position != null && position > 0) {
                media.seekTo(position * 1000);
            }
            // //========================================
            // // 使用 oragepi 修改版的安卓系统，错误的音乐文件不会
            // // 引发错误处理函数，需要延时检查音乐是否正常播放
            // setTimeout(() => {
            //     // 损坏的音乐文件，不能播放
            //     if (media.getDuration() < 0) {
            //         callFinish();
            //     }
            // }, 1000 * 8)
            // //========================================
            return media;
        });
    }
    exports.playMusicByPath = playMusicByPath;
    let _musicDirectory;
    function musicDirectory() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (_musicDirectory) {
                    resolve(_musicDirectory);
                }
                let dir = cordova.file.externalRootDirectory || cordova.file.dataDirectory;
                window.resolveLocalFileSystemURL(dir, (entry) => {
                    entry.getDirectory(exports.musicDirectoryName, { create: true }, entry => {
                        _musicDirectory = entry;
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
    exports.musicDirectory = musicDirectory;
    exports.musicDirectoryName = "EM";
    class MusicFileManager {
        static start() {
            return __awaiter(this, void 0, void 0, function* () {
                let currentPlayList = PlayLists.playlists.filter(o => this.isCurrent(o));
                let notCurrentPlayList = PlayLists.playlists.filter(o => !this.isCurrent(o));
                let music_files = currentPlayList.concat(notCurrentPlayList).map(o => o.music_list);
                //PlayLists.playlists.map(o => o.music_list);
                this.downloadMusicFiles(music_files);
                this.downloadMusicFiles([PlayLists.episodes]);
                let second = 1000;
                let minute = second * 60;
                setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    this.downloadMusicFiles(music_files);
                    this.downloadMusicFiles([PlayLists.episodes]);
                    const freePersent = 0.2;
                    this.checkFreeDisk(freePersent);
                }), minute * 5);
            });
        }
        static isCurrent(list) {
            let online_time = parseTime(list.online_time);
            let offline_time = parseTime(list.offline_time);
            let now = new Date(Date.now());
            if (now >= online_time && now < offline_time) {
                // currentPlayList = list;
                // MusicPlayer.playList = currentPlayList;
                // break;
                return true;
            }
            return false;
        }
        static checkFreeDisk(freePersent) {
            return __awaiter(this, void 0, void 0, function* () {
                console.assert(freePersent > 0 && freePersent < 1);
                let allFiles = yield this.allFiles();
                return this.checkDisk(allFiles, freePersent);
            });
        }
        static checkDisk(files, freePersent) {
            return __awaiter(this, void 0, void 0, function* () {
                if (files.length <= 0)
                    return;
                let spaceInfo = yield EPlayer.freeSpace();
                if (spaceInfo.free / spaceInfo.total >= freePersent) {
                    return;
                }
                let item = files.shift();
                item.entry.remove(() => {
                    this.checkDisk(files, freePersent);
                });
            });
        }
        static allFiles() {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let _musicDirectory = yield musicDirectory();
                let allFiles = new Array();
                window.resolveLocalFileSystemURL(_musicDirectory.nativeURL, (dir) => {
                    let reader = dir.createReader();
                    reader.readEntries(entries => {
                        for (let entry of entries) {
                            if (!entry.isFile) {
                                continue;
                            }
                            entry.file(file => {
                                allFiles.push({ createTime: file.lastModifiedDate, entry: entry });
                            });
                        }
                        resolve(allFiles);
                    }, (err) => {
                        reject(err);
                    });
                });
            }));
        }
        static downloadMusicFiles(playlists) {
            return __awaiter(this, void 0, void 0, function* () {
                let _musicDirectory = yield musicDirectory();
                let downloadMusic = (musics, index) => {
                    musics = musics || [];
                    if (index > musics.length - 1)
                        return Promise.resolve();
                    let music = musics[index];
                    console.log(`download music ${index}`);
                    return musicLocalFile(music)
                        .then((musicFile) => __awaiter(this, void 0, void 0, function* () {
                        if (musicFile) {
                            console.log(`file exists, path ${musicFile.nativeURL}`);
                            return Promise.resolve(musicFile);
                        }
                        let musicPath = yield this.musicLocalPath(music);
                        return this.downloadFile(music.path, musicPath);
                    }))
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
                    downloadMusic(playlists[index], 0)
                        .then(() => setTimeout(downloadList(playlists, index + 1), 1000 * 30))
                        .catch(() => setTimeout(downloadList(playlists, index + 1), 1000 * 30));
                };
                downloadList(playlists, 0);
            });
        }
        static musicLocalPath(music) {
            return __awaiter(this, void 0, void 0, function* () {
                let arr = music.path.split('/');
                let fileName = arr[arr.length - 1];
                let _musicDirectory = yield musicDirectory();
                let filePath = _musicDirectory.nativeURL + fileName;
                return filePath;
            });
        }
        static downloadMusic(path) {
            return __awaiter(this, void 0, void 0, function* () {
                let localPath = yield this.musicLocalPath({ path });
                return this.downloadFile(path, localPath);
            });
        }
        static downloadFile(url, filePath) {
            var fileTransfer = new FileTransfer();
            return new Promise((resolve, reject) => {
                url = encodeURI(url);
                fileTransfer.download(url, filePath, (entry) => {
                    resolve(entry);
                    console.log(`download success,path:${filePath} url:${url}`);
                }, (err) => {
                    console.warn(`download fail,path:${filePath} url:${url}`);
                    reject(err);
                });
            });
        }
    }
    exports.MusicFileManager = MusicFileManager;
});
