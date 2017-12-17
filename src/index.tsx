class MusicPlayer {
    private musicDirectory: string;
    private playlists = new Array<PlayList>();

    currentPlayList: PlayList;
    currentMusicIndex: number = -1;

    constructor(musicDirectory: string) {

        this.musicDirectory = musicDirectory;
        console.assert(this.musicDirectory != null);

        this.clear();
        // setTimeout(() => {
        this.start();
        // }, 1000 * 2);
    }

    private async start() {
        await this.updatePlayLists();
        // this.play();
        this.downloadScheduleMusic(this.playlists);

        let second = 1000;
        let minute = second * 60;
        setInterval(async () => {
            await this.updatePlayLists();
            this.downloadScheduleMusic(this.playlists);
        }, minute * 30);

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
                    finish();
                }
            });

        media.play();

    }

    private musicLocalPath(music: MusicItem) {
        let arr = music.path.split('/');
        let fileName = arr[arr.length - 1];
        let filePath = this.musicDirectory + fileName;
        return filePath;
    }

    private musicLocalFile(music: MusicItem): Promise<FileEntry> {
        let arr = music.path.split('/');
        let fileName = arr[arr.length - 1];
        let directoryName = this.musicDirectory;
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

    private async updatePlayLists(): Promise<PlayList[]> {
        try {
            let service = new Service();
            let result = await service.playSchedule();
            if (result.code == CodeSuccess)
                this.playlists = result.data.playlist;
            else
                this.playlists = [];

        }
        finally {
            return this.playlists;
        }
    }

    private clear() {
        window.resolveLocalFileSystemURL(this.musicDirectory,
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
    { musics: MusicItem[], current: number }> {
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
            <div key="title" className="title">
                Title
            </div>,
            <div key="musics" className="music-list">
                {musics.map((o, i) => (
                    <div key={o.mid} className={i == current ? "music-name active" : "music-name"}>
                        {o.name}
                    </div>
                ))}
            </div>,
            <div key="info" className="info">
                Info
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

let app = new Application();
app.start();





