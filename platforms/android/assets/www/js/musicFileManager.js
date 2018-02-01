var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "common"], function (require, exports, common_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class MusicFileManager {
        static music_files() {
            let currentPlayList = PlayLists.playlists.filter(o => this.isCurrent(o));
            let notCurrentPlayList = PlayLists.playlists.filter(o => !this.isCurrent(o));
            let music_files = currentPlayList.concat(notCurrentPlayList).map(o => o.music_list);
            return music_files;
        }
        static start() {
            return __awaiter(this, void 0, void 0, function* () {
                // let currentPlayList = PlayLists.playlists.filter(o => this.isCurrent(o));
                // let notCurrentPlayList = PlayLists.playlists.filter(o => !this.isCurrent(o));
                // let music_files = this.music_files();
                // this.downloadMusicFiles(music_files);
                // this.downloadMusicFiles([PlayLists.episodes]);
                let second = 1000;
                let minute = second * 60;
                setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    this.download();
                }), minute * 15);
                this.download();
            });
        }
        static download() {
            if (this.downloadMusicComplete) {
                this.downloadMusicComplete = false;
                var music_files = this.music_files();
                this.downloadMusicFiles(music_files)
                    .then(() => this.downloadMusicComplete = true)
                    .catch(() => this.downloadMusicComplete = true);
            }
            this.downloadMusicFiles([PlayLists.episodes]);
            const freePersent = 0.2;
            this.checkFreeDisk(freePersent);
        }
        static isCurrent(list) {
            let online_time = common_1.parseTime(list.online_time);
            let offline_time = common_1.parseTime(list.offline_time);
            let now = new Date(Date.now());
            if (now >= online_time && now < offline_time) {
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
                let _musicDirectory = yield common_1.musicDirectory();
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
                let _musicDirectory = yield common_1.musicDirectory();
                let downloadMusic = (musics, index) => {
                    musics = musics || [];
                    if (index > musics.length - 1)
                        return Promise.resolve();
                    let music = musics[index];
                    console.log(`download music ${index}`);
                    return common_1.musicLocalFile(music)
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
                    if (index > playlists.length - 1) {
                        return;
                    }
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
                let _musicDirectory = yield common_1.musicDirectory();
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
    MusicFileManager.downloadMusicComplete = true;
    exports.MusicFileManager = MusicFileManager;
});
