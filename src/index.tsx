function parseTime(time: string) {
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

function parseDate(dateString: string) {
    let arr = dateString.split('-');
    let year = Number.parseInt(arr[0]);
    let month = Number.parseInt(arr[1]) - 1;
    let date = Number.parseInt(arr[2]);
    let d = new Date(year, month, date);
    return d;
}

function musicLocalFile(directoryName: string, music: { path: string }): Promise<FileEntry> {
    let arr = music.path.split('/');
    let fileName = arr[arr.length - 1];
    // let directoryName = this._musicDirectory;
    return new Promise((resolve, reject) => {
        window.resolveLocalFileSystemURL(directoryName,
            (entry: Entry) => {
                if (entry.isFile) {
                    resolve(null);
                    return;
                }

                let reader = (entry as DirectoryEntry).createReader();
                reader.readEntries(
                    (entries) => {
                        for (let child of entries) {
                            if (child.isFile && child.name == fileName) {
                                resolve(child as FileEntry);
                                break;
                            }
                        }

                        resolve(null);
                    },
                    err => reject(err));
            },
            err => reject(err)
        );

    })
}

async function playMusicByPath(musicDirectory: string, path: string, finish: () => void): Promise<Media> {

    let file = await musicLocalFile(musicDirectory, { path });
    let fileExists = file != null;

    let src = file != null ? file.nativeURL : path;
    // src = music.path;
    let media = new Media(src,
        () => {

        },
        err => {
            if (file != null) {
                file.remove(() => { });
            }

            //=======================================
            // 延时 2 秒，以防出现死循环
            setTimeout(() => {
                finish();
            }, 1000 * 2);
            //=======================================
        },
        (status) => {
            if (status == Media.MEDIA_STOPPED) {
                // media.getCurrentPosition(pos => {
                //     let duration = media.getDuration();
                // if (pos <= 0) {
                media.release();
                finish();
                // }
                // })
            }
        });

    media.play();

    return media;
}

class MusicPlayer {
    private _musicDirectory: string;


    private _currentPlayList: PlayList;
    private _currentMusicIndex: number = -1;
    private _currentMusic: Media;

    constructor(musicDirectory: string) {
        this._musicDirectory = musicDirectory;
    }

    get musicDirectory() {
        return this._musicDirectory;
    }

    get currentMusic() {
        return this._currentMusic;
    }

    get currentMusicIndex() {
        return this._currentMusicIndex;
    }

    get playList() {
        return this._currentPlayList;
    }
    set playList(playList: PlayList) {
        console.assert(playList != null);
        if (this._currentPlayList != null && this._currentPlayList.plid == playList.plid)
            return;

        this._currentPlayList = playList;
        this.play();
    }

    play() {
        if (this.currentMusic != null) {
            this.currentMusic.play();
        }
        else if (this._currentPlayList != null) {
            this.playByList(this._currentPlayList);
        }
    }

    private playByList(list: PlayList) {
        this._currentPlayList = list;
        let musics = list.music_list || [];
        let finish = () => {
            this._currentPlayList = null;
        }
        //========================================================
        // 如果没有音乐，延时 60 秒，避免死循环
        if (musics.length == 0) {
            let timeid = setTimeout(() => finish(), 1000 * 60);
            return;
        }
        //========================================================

        let offline_time = parseTime(list.offline_time);
        let playMusic = async (num: number) => {
            this._currentMusicIndex = num;
            playMusicByPath(this._musicDirectory, musics[num].path, () => {
                if (offline_time <= new Date(Date.now())) {
                    finish();
                    return;
                }
                let next = nextMusic(num);

                this._currentMusic = null;

                playMusic(next);

            }).then(media => {
                this._currentMusic = media;
            });
        }

        let nextMusic = (current: number): number => {
            if (musics.length == 1) {
                return 0;
            }
            // 如果列表为随机播放，则随机取一首音乐，并且不等于当前播放的音乐
            if (list.type == PlayRadomType) {
                let r: number;
                do {
                    r = this.random(0, musics.length - 1);
                }
                while (r == current);
                return r;
            }

            let num = current + 1;
            if (num > list.music_list.length - 1)
                num = 0;

            return num;
        }

        let num = nextMusic(-1);
        playMusic(num);
    }

    private random(min, max): number {
        let value = Math.floor(Math.random() * (max - min + 1)) + min;
        return value;
    }


    // private clear() {
    //     window.resolveLocalFileSystemURL(this._musicDirectory,
    //         (entry: DirectoryEntry) => {
    //             let reader = entry.createReader();
    //             reader.readEntries((entries) => {
    //                 for (let entry of entries)
    //                     entry.remove(
    //                         () => {
    //                             console.log(`remove sucess, fileName: ${entry.name}`)
    //                         },
    //                         () => {
    //                             console.log(`remove fail, fileName: ${entry.name}`)
    //                         }
    //                     );
    //             });
    //         }
    //     );
    // }

    pause() {
        if (this.currentMusic != null) {
            this.currentMusic.pause();
        }
    }
}

class EpidosePlayer {

    private episodes = new Array<Episode>();
    private musicPlayer: MusicPlayer;

    constructor(musicPlayer: MusicPlayer) {
        this.musicPlayer = musicPlayer;
        this.start();
    }

    async start() {
        let service = new Service();
        this.episodes = await service.episode();
        setInterval(async () => {
            this.episodes = await service.episode();
        }, 1000 * 60 * 30);

        let episodes = new Array<Episode>();
        let timeIntervalId = setInterval(() => {

            if (episodes.length > 0) // 正在插播中
                return;

            // 需要播放的插播
            episodes = this.currentEpisodes();
            if (episodes.length > 0) {

                this.musicPlayer.pause();
                let playEpisode = (index: number) => {
                    if (index > episodes.length - 1) {
                        this.musicPlayer.play();
                        episodes = [];
                        return;
                    }

                    playMusicByPath(this.musicPlayer.musicDirectory, episodes[index].path, () => {
                        playEpisode(index + 1);
                    });
                }
                playEpisode(0);
            }


        }, 1000 * 5);
    }

    currentEpisodes() {
        let items = new Array<Episode>();
        for (let i = 0; i < this.episodes.length; i++) {
            let episode = this.episodes[i];
            let start_day = parseDate(episode.start_day);
            let end_day = parseDate(episode.end_day);
            let now = new Date(Date.now());
            let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (today >= start_day && today < end_day) {
                for (let timeString of episode.i_time) {
                    let time = parseTime(timeString);
                    if (time.getHours() == now.getHours() && time.getMinutes() == now.getMinutes()) {
                        items.push(episode);
                    }
                }
            }
        }

        return items;
    }
}

class MusicPage extends React.Component<{ player: MusicPlayer },
    { musics: MusicItem[], current: number, title: string, info: string, infos: { name: string, value?: string }[], showAllInfos: boolean }> {

    private startTime: number;
    private rebootDurationDays: number = 7;
    private rebootHour = 5;

    constructor(props) {
        super(props);

        this.state = { musics: [], current: 0, title: "", info: "", infos: [], showAllInfos: false };
        this.startTime = Date.now();

    }

    private parseTime(time: string) {
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

        EPlayer.freeSpace(this.props.player.musicDirectory).then(obj => {

            this.state.infos[0].value = `总容量:${Math.floor(obj.total / 1024)}M 剩余:${Math.floor(obj.free / 1024)}M`;
            this.setState(this.state);
        });

        setInterval(() => {
            let musics = new Array<MusicItem>();
            if (this.props.player.playList != null) {
                musics = this.props.player.playList.music_list || [];
            }

            this.state.musics = musics;
            this.state.current = this.props.player.currentMusicIndex;
            let music = musics[this.state.current];
            if (music != null) {
                this.state.title = music.name;
            }


            let now = new Date(Date.now());
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

            this.state.info = `系统已经运行${days}天${hours}小时${minutes}分${seconds}秒`;
            //==========================================================


            //==========================================================
            this.state.infos[1].value = `${this.rebootDurationDays - days}天后${this.rebootHour}点重启`;
            if (days >= this.rebootDurationDays && now.getHours() == this.rebootHour) {
                EPlayer.reboot();
            }
            //==========================================================

            this.setState(this.state);


        }, 1000 * 1);

    }

    toggleInfo() {
        this.state.showAllInfos = !this.state.showAllInfos;
        if (this.state.showAllInfos) {
            window.resolveLocalFileSystemURL(this.props.player.musicDirectory, (entry: DirectoryEntry) => {
                let reader = entry.createReader();
                reader.readEntries((entires) => {
                    this.state.infos[2].value = `${entires.length}首`;
                    this.setState(this.state);
                })
            })
        }
        this.setState(this.state);
    }



    render() {
        let musics = this.state.musics;
        let current = this.state.current;
        let { title, info, showAllInfos, infos } = this.state;
        let music = this.props.player.currentMusic;
        return [
            <div key="title" className="title"
                onClick={() => {
                    var b = confirm("测试：点击确认按钮重启");
                    if (b)
                        EPlayer.reboot();
                }}>
                {title}
            </div>,
            <div key="musics" className="music-list" >
                {musics.map((o, i) => (
                    <div key={o.mid} className={i == current ? "music-name active" : "music-name"}>
                        {o.name} {i == current && music != null ?
                            <span ref={(e: HTMLElement) => {
                                if (!e) return;
                                music.getCurrentPosition(position => {
                                    e.innerHTML = ` (${Math.floor(music.getDuration() - position)}/${Math.floor(music.getDuration())})`;
                                })
                            }}>

                            </span> : null}
                    </div>
                ))}
            </div>,
            <div key="infos" className="infos"
                onClick={() => {
                    this.toggleInfo();
                }}>
                {showAllInfos ? infos.map((o, i) =>
                    <div className="item" key={i}>
                        <div style={{ float: 'right' }}>{o.value}</div>
                        <div>{o.name}</div>
                    </div>
                ) : null}
                <div className="item">
                    {info}
                </div>
            </div>
        ];
    }
}

interface MusicFile {
    path: string
}

class MusicFileManager {

    private playlists: PlayList[];
    private musicDirectory: string;
    private episodes: Episode[];

    constructor(musicDirectory: string) {
        this.musicDirectory = musicDirectory;
        this.playlists = new Array<PlayList>();
    }

    async start() {
        await this.updateMusicList();
        let music_files: MusicFile[][] = this.playlists.map(o => o.music_list);
        this.downloadMusicFiles(music_files);
        // this.downloadMusicFiles([this.episodes]);

        let second = 1000;
        let minute = second * 60;
        setInterval(async () => {
            await this.updateMusicList();
            this.downloadMusicFiles(music_files);
            this.downloadMusicFiles([this.episodes]);
        }, minute * 30);
    }

    async updateMusicList() {
        let service = new Service();
        this.playlists = await service.playlists();
        this.episodes = await service.episode();
    }


    private async downloadMusicFiles(playlists: MusicFile[][]) {
        // Check Disk

        let downloadMusic = (musics: { path: string }[], index): Promise<any> => {
            if (index > musics.length - 1)
                return Promise.resolve();

            let music = musics[index];
            console.log(`download music ${index}`);

            return musicLocalFile(this.musicDirectory, music)
                .then(musicFile => {
                    if (musicFile) {
                        console.log(`file exists, path ${musicFile.nativeURL}`);
                        return Promise.resolve(musicFile);
                    }

                    let musicPath = this.musicLocalPath(music);
                    return this.downloadFile(music.path, musicPath);
                })
                .catch(() => {
                    return Promise.resolve<FileEntry>(null);
                })
                .then(() => {
                    return downloadMusic(musics, index + 1);
                });
        }

        let downloadList = (playlists: MusicFile[][], index) => {
            if (index > playlists.length - 1)
                return;

            console.log(`download list ${index}`);
            downloadMusic(playlists[index], 0)
                .then(() => downloadList(playlists, index + 1))
                .catch(() => downloadList(playlists, index + 1));
        }

        downloadList(playlists, 0);
    }

    private musicLocalPath(music: { path: string }) {
        let arr = music.path.split('/');
        let fileName = arr[arr.length - 1];
        let filePath = this.musicDirectory + fileName;
        return filePath;
    }

    private downloadFile(url: string, filePath: string): Promise<Entry> {
        var fileTransfer = new FileTransfer();
        return new Promise((resolve, reject) => {
            fileTransfer.download(url, filePath,
                (entry) => {
                    resolve(entry);
                    console.log(`download success,path:${filePath} url:${url}`);
                },
                (err) => {
                    debugger;
                    console.warn(`download success,path:${filePath} url:${url}`)
                    reject(err);
                }
            );
        })
    }


}

class Application {

    private playlists = new Array<PlayList>();

    constructor() {
        document.addEventListener('deviceready', () => this.on_deviceready(), false);
    }

    async on_deviceready() {
        let dataDirectory = cordova.file.dataDirectory;
        let musicDirectory = await new Promise<DirectoryEntry>((resolve, reject) => {
            window.resolveLocalFileSystemURL(cordova.file.dataDirectory,
                (entry: DirectoryEntry) => {
                    entry.getDirectory('musics1', { create: true },
                        entry => {
                            resolve(entry);
                        },
                        err => {
                            reject(err);
                        }
                    );
                },
                (err) => {
                    reject(err);
                }
            );
        })

        let player = new MusicPlayer(musicDirectory.nativeURL);
        let fileManager = new MusicFileManager(player.musicDirectory);
        let epidosePlayer = new EpidosePlayer(player);

        let appElement = document.getElementsByClassName('app')[0];
        ReactDOM.render(<MusicPage player={player} />, appElement);


        await this.updatePlayLists();
        //===============================================================
        // 每隔 5 秒检查播放列表，如果在时间段内，进行播放
        let currentPlayList: PlayList;
        setInterval(async () => {
            // if (this.currentPlayList != null)
            //     return;
            if (currentPlayList == null) {
                let lists = this.playlists;
                for (let list of lists) {
                    let online_time = parseTime(list.online_time);
                    let offline_time = parseTime(list.offline_time);
                    let now = new Date(Date.now());
                    if (now >= online_time && now < offline_time && currentPlayList != list) {
                        currentPlayList = list;
                        player.playList = currentPlayList;
                        // this.playList(list);
                        break;
                    }
                }
            }


        }, 1000 * 5);
    }

    async updatePlayLists() {
        let service = new Service();
        this.playlists = await service.playlists();
    }
}

class EPlayer {
    private static serviceName = "EPlayer";
    private execute() {

    }
    static reboot() {
        cordova.exec(
            () => {
                debugger
            },
            () => {
                debugger;
            }, this.serviceName, "reboot"
        );
    }
    static freeSpace(dir: string) {
        if (dir.startsWith('file://')) {
            dir = dir.substr('file://'.length);
        }
        return new Promise<{ total: number, free: number }>((resolve, reject) => {
            cordova.exec(
                (obj: { total: number, free: number }) => {
                    resolve(obj);
                },
                (err) => {
                    reject(err);
                }, this.serviceName, "freeSpace", [dir]
            )
        })
    }
    static setWifiFromUsb(callback: (isSuccess: boolean) => void) {
        cordova.exec(
            (isSuccess) => {
                callback(isSuccess);
            },
            () => {

            }, this.serviceName, 'setWifiFromUsb'
        );
    }
    static macAddress() {
        return new Promise<string>((resolve, reject) => {
            let value = localStorage.getItem('macAddress');
            if (value) {
                resolve(value);
                return;
            }
            cordova.exec(
                (macAddress: string) => {
                    if (macAddress) {
                        localStorage.setItem('macAddress', macAddress);
                    }
                    resolve(macAddress);
                },
                err => {
                    reject(err);
                },
                this.serviceName, 'macAddress'
            )
        })
    }
}


let app = new Application();






