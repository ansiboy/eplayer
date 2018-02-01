var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "common", "./epidosePlayer", "./musicFileManager"], function (require, exports, common_1, epidosePlayer_1, musicFileManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class CurrentPlayInfo {
        static get playListId() {
            if (!this.playList)
                return null;
            return this.playList.plid;
        }
        static get playList() {
            if (this.isTimeout)
                return null;
            if (this._playList !== undefined) {
                return this._playList;
            }
            let str = localStorage.getItem('currentplayList');
            this._playList = str ? JSON.parse(str) : null;
            if (this._playList != null && this.isRemoved(this._playList.plid)) {
                return null;
            }
            return this._playList;
        }
        static get musicPosition() {
            if (this.isTimeout)
                return null;
            if (this._musicPosition !== undefined) {
                this._musicPosition;
            }
            let str = localStorage.getItem('currentMusicPosition');
            this._musicPosition = str ? JSON.parse(str) : null;
            return this._musicPosition;
        }
        static get musicIndex() {
            if (this.isTimeout)
                return null;
            if (this._musicIndex !== undefined) {
                return this._musicIndex;
            }
            let str = localStorage.getItem('currentMusicIndex');
            this._musicIndex = str ? JSON.parse(str) : null;
            return this._musicIndex;
        }
        static isRemoved(plid) {
            let items = PlayLists.playlists;
            for (let i = 0; i < items.length; i++) {
                if (items[i].plid == plid)
                    return false;
            }
            return true;
        }
        static get isTimeout() {
            let str = localStorage.getItem('currentplayList');
            let playList = str ? JSON.parse(str) : null;
            if (playList == null) {
                return true;
            }
            let saveDateText = localStorage.getItem('saveDate');
            let saveDate = saveDateText ? JSON.parse(saveDateText) : null;
            let today = new Date(Date.now()).getDate();
            if (saveDate != today)
                return true;
            let online_time = common_1.parseTime(playList.online_time);
            let offline_time = common_1.parseTime(playList.offline_time);
            let now = new Date(Date.now());
            return now < online_time || now >= offline_time;
        }
        static update(playList, musicIndex, musicPosition) {
            localStorage.setItem('currentplayList', JSON.stringify(playList));
            localStorage.setItem('currentMusicIndex', JSON.stringify(musicIndex));
            localStorage.setItem('currentMusicPosition', JSON.stringify(musicPosition));
            let today = new Date(Date.now()).getDate();
            localStorage.setItem('saveDate', `${today}`);
        }
    }
    CurrentPlayInfo._playList = undefined;
    CurrentPlayInfo._musicPosition = undefined;
    CurrentPlayInfo._musicIndex = undefined;
    class MusicPlayer {
        static start() {
            return __awaiter(this, void 0, void 0, function* () {
                //=============================================================
                // 定时保存歌曲播放进度
                setInterval(() => {
                    if (MusicPlayer.currentMeida != null) {
                        this.currentMeida.getCurrentPosition((position) => {
                            if (position < 0)
                                return;
                            CurrentPlayInfo.update(this.playList, this._currentMusicIndex, position);
                        });
                    }
                    let musicPlayComplete = false;
                    if (this.currentMeida == null) {
                        musicPlayComplete = true;
                    }
                    if (musicPlayComplete && this._currentPlayList != null) {
                        let offline_time = common_1.parseTime(this._currentPlayList.offline_time);
                        if (offline_time <= new Date(Date.now())) {
                            console.log('playlist is timeout, clear it');
                            this._currentPlayList = null;
                            return;
                        }
                    }
                }, 1000 * 5);
                //=============================================================
                if (CurrentPlayInfo.playList != null) {
                    this._currentPlayList = CurrentPlayInfo.playList;
                    this.play();
                }
                epidosePlayer_1.EpidosePlayer.playStart.add(() => {
                    this.pause();
                });
                epidosePlayer_1.EpidosePlayer.playComplete.add(() => {
                    this.play();
                });
                epidosePlayer_1.InstantEpisode.playStart.add(() => {
                    this.pause();
                });
                epidosePlayer_1.InstantEpisode.playComplete.add(() => {
                    this.play();
                });
            });
        }
        static get currentMeida() {
            return this._currentMusic;
        }
        static get currentMusic() {
            if (this.playList == null)
                return null;
            let musics = this.playList.music_list || [];
            return musics[this.currentMusicIndex];
        }
        static get currentMusicIndex() {
            return this._currentMusicIndex;
        }
        static get playList() {
            return this._currentPlayList;
        }
        static set playList(playList) {
            console.assert(playList != null);
            if (this.currentMeida != null)
                return;
            if (this._currentPlayList != null) {
                return;
            }
            // this._currentPlayList.plid == playList.plid
            this.playListChanged.fire(playList);
            this._currentPlayList = playList;
            this.play();
        }
        static play() {
            if (epidosePlayer_1.EpidosePlayer.hasEpidose)
                return;
            if (epidosePlayer_1.InstantEpisode.playing)
                return;
            //=============================================
            // 已经在播放
            if (this._currentMusic != null && this._isPause == false)
                return;
            //=============================================
            this._isPause = false;
            if (this.currentMeida != null) {
                this.currentMeida.play();
                return;
            }
            else if (this._currentPlayList != null) {
                this.playMusic();
                return;
            }
            console.log('play function do nothing');
        }
        static playMusic() {
            return __awaiter(this, void 0, void 0, function* () {
                console.assert(this._currentPlayList != null);
                let list = this._currentPlayList;
                let musics = list.music_list || [];
                //===========================================
                // 没有音乐需要播放
                if (musics.length == 0) {
                    return;
                }
                //===========================================
                let offline_time = common_1.parseTime(list.offline_time);
                let playMusic = (num, startPosition) => __awaiter(this, void 0, void 0, function* () {
                    console.assert(num != null && num >= 0);
                    if (num > musics.length - 1)
                        num = musics.length - 1;
                    this._currentMusicIndex = num;
                    Service.playSong(musics[num].mid);
                    this.currentMusicChanged.fire(musics[num], num);
                    //======================================================
                    // 由于偶尔会出现同时播放两首音乐的情况
                    // 在这里在加上一个挺播
                    if (this.currentMeida) {
                        try {
                            this.currentMeida.stop();
                        }
                        catch (e) {
                        }
                    }
                    //======================================================
                    common_1.playMusicByPath(musics[num].path, () => __awaiter(this, void 0, void 0, function* () {
                        this._currentMusic = null;
                        if (offline_time <= new Date(Date.now())) {
                            console.log('playlist is timeout');
                            this._currentPlayList = null;
                            return;
                        }
                        let next;
                        // let file: FileEntry
                        // do {
                        next = nextMusic(num);
                        //     file = await musicLocalFile(musics[next]);
                        // } while (file == null)
                        playMusic(next, 0);
                    }), startPosition).then(media => {
                        if (this._isPause)
                            media.pause();
                        this._currentMusic = media;
                    });
                });
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
                let num = CurrentPlayInfo.musicIndex != null ? CurrentPlayInfo.musicIndex : nextMusic(-1);
                let startPosition = CurrentPlayInfo.musicPosition != null && CurrentPlayInfo.musicPosition > 0 ? CurrentPlayInfo.musicPosition : 0;
                // await this.assertFile(musics[num]);
                playMusic(num, startPosition);
            });
        }
        static assertFile(music) {
            let downloadFile = () => {
                musicFileManager_1.MusicFileManager.downloadMusic(music.path)
                    .catch(() => {
                    setTimeout(() => {
                        downloadFile();
                    }, 1000 * 10);
                });
            };
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let musicFile = yield common_1.musicLocalFile(music);
                if (!musicFile) {
                    downloadFile();
                }
                setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    musicFile = yield common_1.musicLocalFile(music);
                    if (musicFile) {
                        resolve(music);
                    }
                }), 1000 * 1);
            }));
        }
        static random(min, max) {
            let value = Math.floor(Math.random() * (max - min + 1)) + min;
            return value;
        }
        static pause() {
            if (this._isPause) {
                return;
            }
            if (this.currentMeida != null) {
                this._isPause = true;
                this.currentMeida.pause();
            }
        }
    }
    MusicPlayer._currentMusicIndex = -1;
    MusicPlayer.currentMusicChanged = $.Callbacks();
    MusicPlayer.playListChanged = $.Callbacks();
    exports.MusicPlayer = MusicPlayer;
});
