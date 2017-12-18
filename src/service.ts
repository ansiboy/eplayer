interface PlayList {
    plid: number,
    music_list: Array<MusicItem>,
    /**
     * 播放开始时间，格式：08:00:00
     */
    online_time: string,
    offline_time: string,
    /**
     * 表示顺序播放还是随机播放
     * 0：顺序播放
     * 1:随机播放
     */
    type: number
}

const PlayOrderType = 0;
const PlayRadomType = 1;
const CodeSuccess = 0;

interface MusicItem {
    mid: number,
    name: string,
    path: string
}

interface AjaxResult {
    code: number,
    msg: string
}

interface PlayListResult extends AjaxResult {
    code: number,
    msg: string,
    store: string,
    data: {
        psid: number,
        name: string,
        playlist: Array<PlayList>,
    }
}

/**
 * 插播
 */
interface EpisodeItem {

    interval: number,
    times: number,
    b_time: string,
    e_time: string,
    type: number,
}

class Service {
    /**
    * 获取音乐播放计划
    */
    async _playSchedule(): Promise<PlayListResult> {
        return {
            "code": 0, //0:成功，1：盒子没有对应的门店，2：暂无播放计划
            "store": "1号店", //店名
            "msg": "成功", //返回信息,
            "data": {
                "psid": 1, //播放计划id
                "name": "hhh", //播放计划名
                playlist: [
                    {
                        "plid": 1, //播放列表id
                        "online_time": "00:00:00", //开始时间
                        "offline_time": "12:00:00", //结束时间
                        "type": 0,
                        music_list: [
                            {
                                "mid": 506, //歌曲id
                                "name": "Chorale Prelude in F Minor, We Three Kings of Orient Are.mp3", //歌曲名
                                "path": "http://file.echomelody.com/music/20160408/absolute music/Christmas music/Chorale Prelude in F Minor, We Three Kings of Orient Are.mp3" //资源路径
                            },
                            {
                                "mid": 501, //歌曲id
                                "name": "Ayleth's Song.mp3", //歌曲名
                                "path": "http://file.echomelody.com/music/20160408/absolute music/light music/Ayleth's Song.mp3" //资源路径
                            }
                        ]
                    },
                    {
                        "plid": 2, //播放列表id
                        "online_time": "12:00:00", //开始时间
                        "offline_time": "24:00:00", //结束时间
                        "type": 1, //0：顺序播放，1:随机播放
                        music_list: [
                            {
                                "mid": 504, //歌曲id
                                "name": "Ayleth's Song.mp3", //歌曲名
                                "path": "http://file.echomelody.com/music/20160408/absolute music/light music/Ayleth's Song.mp3" //资源路径
                            },
                            {
                                "mid": 503, //歌曲id
                                "name": "Atmospheric Christmas.mp3", //歌曲名
                                "path": "http://file.echomelody.com/music/20160408/absolute music/Christmas music/Atmospheric Christmas.mp3" //资源路径
                            }
                        ]
                    }
                ]
            }
        }
    }

    /**
     * 获取音乐播放计划
     */
    async playlists(): Promise<PlayList[]> {
        try {
            let result = await this._playSchedule();
            return result.data.playlist;
        }
        catch (e) {
            return [];
        }
    }
    /**
     * 获取插播计划
     */
    episode() {

    }
    instant_episode() {

    }
}