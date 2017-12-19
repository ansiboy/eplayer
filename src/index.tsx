class MusicPlayer {
    private _musicDirectory: string;
    private playlists = new Array<PlayList>();

    currentPlayList: PlayList;
    currentMusicIndex: number = -1;
    currentMusic: Media;

    constructor(musicDirectory: string) {

        this._musicDirectory = musicDirectory;
        console.assert(this._musicDirectory != null);

        this.start();
    }

    get musicDirectory() {
        return this._musicDirectory;
    }

    private async start() {
        await this.updatePlayLists();
        this.downloadScheduleMusic(this.playlists);

        let second = 1000;
        let minute = second * 60;
        setInterval(async () => {
            await this.updatePlayLists();
            this.downloadScheduleMusic(this.playlists);
        }, minute * 30);

        //===============================================================
        // 每隔 5 秒检查播放列表，如果在时间段内，进行播放
        setInterval(async () => {
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
        }, 1000 * 5);
        //===============================================================

        document.addEventListener("online", () => {
            this.updatePlayLists();
            
        }, false);

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

    private playList(list: PlayList) {
        this.currentPlayList = list;
        let musics = list.music_list || [];
        let finish = () => {
            this.currentPlayList = null;
        }
        //========================================================
        // 如果没有音乐，延时 60 秒，避免死循环
        if (musics.length == 0) {
            let timeid = setTimeout(() => finish(), 1000 * 60);
            return;
        }
        //========================================================

        let offline_time = this.parseTime(list.offline_time);
        let playMusic = (num: number) => {
            this.currentMusicIndex = num;
            this.playMusic(musics[num], () => {
                if (offline_time <= new Date(Date.now())) {
                    finish();
                    return;
                }
                let next = nextMusic(num);
                playMusic(next);
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

    private async playMusic(music: MusicItem, finish: () => void) {

        let file = await this.musicLocalFile(music);
        let fileExists = file != null;

        let src = file != null ? file.nativeURL : music.path;
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
                    this.currentMusic = null;
                    media.release();
                    finish();
                }
            });

        this.currentMusic = media;
        media.play();

    }

    private musicLocalPath(music: MusicItem) {
        let arr = music.path.split('/');
        let fileName = arr[arr.length - 1];
        let filePath = this._musicDirectory + fileName;
        return filePath;
    }

    private musicLocalFile(music: MusicItem): Promise<FileEntry> {
        let arr = music.path.split('/');
        let fileName = arr[arr.length - 1];
        let directoryName = this._musicDirectory;
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

    private childFile(directoryName: string, fileName: string): Promise<FileEntry> {
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
                                if (child.isFile && child.name == child.name) {
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

    async updatePlayLists() {

        let service = new Service();
        this.playlists = await service.playlists();
    }

    private clear() {
        window.resolveLocalFileSystemURL(this._musicDirectory,
            (entry: DirectoryEntry) => {
                let reader = entry.createReader();
                reader.readEntries((entries) => {
                    for (let entry of entries)
                        entry.remove(
                            () => {
                                console.log(`remove sucess, fileName: ${entry.name}`)
                            },
                            () => {
                                console.log(`remove fail, fileName: ${entry.name}`)
                            }
                        );
                });
            }
        );
    }

    private async downloadScheduleMusic(playlists: PlayList[]) {
        // Check Disk

        let downloadMusic = (musics: MusicItem[], index): Promise<any> => {
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
                    return Promise.resolve<FileEntry>(null);
                })
                .then(() => {
                    return downloadMusic(musics, index + 1);
                });
        }

        let downloadList = (playlists: PlayList[], index) => {
            if (index > playlists.length - 1)
                return;

            console.log(`download list ${index}`);
            downloadMusic(playlists[index].music_list, 0)
                .then(() => downloadList(playlists, index + 1))
                .catch(() => downloadList(playlists, index + 1));
        }

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
            if (this.props.player.currentPlayList != null) {
                musics = this.props.player.currentPlayList.music_list || [];
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

        // var networkState = navigator.connection.type;
        // while (networkState == Connection.NONE) {
        //     let timeid = setTimeout(() => {
        //         EPlayer.setWifiFromUsb(
        //             (isSuccess) => {
        //                 if (isSuccess) {
        //                     this.props.player.updatePlayLists();
        //                 }
        //             }
        //         );
        //         clearTimeout(timeid);

        //     }, 1000 * 15);
        // }

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


class Application {
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
                            // entry.remove(()=>{});
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
        let appElement = document.getElementsByClassName('app')[0];
        ReactDOM.render(<MusicPage player={player} />, appElement);
    }

    start() {

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

}


let app = new Application();
app.start();





