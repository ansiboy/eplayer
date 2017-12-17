class MusicPlayer {
    private musicDirectory: string;
    static playlists = new Array<PlayList>();

    constructor(musicDirectory: string) {

        this.musicDirectory = musicDirectory;
        console.assert(this.musicDirectory != null);

        window.setTimeout(() => {
            this.start();
        }, 1000 * 10);
    }

    private async start() {
        await this.updatePlayLists();
        this.play();
        this.downloadScheduleMusic(MusicPlayer.playlists);

        let second = 1000;
        let minute = second * 60;
        setInterval(async () => {
            await this.updatePlayLists();
            this.downloadScheduleMusic(MusicPlayer.playlists);
        }, minute * 30);
    }

    private async play() {
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
            let offline_time = this.parseTime(list.offline_time);
            let now = new Date(Date.now());
            if (now >= online_time && now < offline_time) {
                this.playList(list, () => this.play());
            }
        }
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

    private playList(list: PlayList, finish: () => void) {
        let musics = list.music_list || [];

        //========================================================
        // 如果没有音乐，延时 60 秒，避免死循环
        if (musics.length == 0) {
            let timeid = setTimeout(() => finish(), 1000 * 60);
            return;
        }
        //========================================================

        let offline_time = this.parseTime(list.offline_time);
        let playMusic = (num: number) => {
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

        playMusic(0);
    }

    private random(min, max) {
        return Math.floor(min + Math.random() * (max - min));
    }

    private async playMusic(music: MusicItem, finish: () => void) {

        let file = await this.musicLocalFile(music);
        let fileExists = file != null;

        let src = file != null ? file.nativeURL : music.path;
        let media = new Media(src,
            () => {

            },
            err => {
                if (file != null) {
                    file.remove(() => { });
                }
                finish();
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

    private downloadFile(url: string, filePath: string): Promise<Entry> {
        var fileTransfer = new FileTransfer();
        return new Promise((resolve, reject) => {
            fileTransfer.download(url, filePath,
                (entry) => {
                    resolve(entry);
                },
                (err) => {
                    debugger;
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
                MusicPlayer.playlists = result.data.playlist;
            else
                MusicPlayer.playlists = [];

        }
        finally {
            return MusicPlayer.playlists;
        }
    }

    private async downloadScheduleMusic(playlists: PlayList[]) {
        for (let playlist of playlists) {
            let musics = playlist.music_list;
            for (let music of musics) {
                let musicFile = await this.musicLocalFile(music);
                if (musicFile == null) {
                    try {
                        let musicPath = this.musicLocalPath(music);
                        await this.downloadFile(music.path, musicPath);
                    }
                    catch (err) {

                    }
                }
            }
        }
    }
}

class MusicPage {

}

class Application {
    constructor() {
        document.addEventListener('deviceready', () => this.on_deviceready(), false);
    }

    async on_deviceready() {
        let musicDirectory = cordova.file.dataDirectory;
        let player = new MusicPlayer(musicDirectory);

    }

    start() {

    }
}

let app = new Application();
app.start();





