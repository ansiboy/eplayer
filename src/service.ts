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
    async playSchedule(): Promise<PlayListResult> {
        let item1: MusicItem = {
            "mid": 506, //歌曲id
            "name": "Chorale Prelude in F Minor, We Three Kings of Orient Are.mp3", //歌曲名
            "path": "http://file.echomelody.com/music/20160408/absolute music/Christmas music/Chorale Prelude in F Minor, We Three Kings of Orient Are.mp3" //资源路径
        };
        let item2: MusicItem = {
            "mid": 501, //歌曲id
            "name": "Ayleth's Song.mp3", //歌曲名
            "path": "http://file.echomelody.com/music/20160408/absolute music/light music/Ayleth's Song.mp3" //资源路径
        };

        let playlist1: PlayList = {
            "plid": 1, //播放列表id
            "online_time": "08:00:00", //开始时间
            "offline_time": "12:00:00", //结束时间
            "type": 0,
            music_list: [item1, item2]
        };

        let item3: MusicItem = {
            "mid": 504, //歌曲id
            "name": "Ayleth's Song.mp3", //歌曲名
            "path": "http://file.echomelody.com/music/20160408/absolute music/light music/Ayleth's Song.mp3" //资源路径
        }
        let item4: MusicItem = {
            "mid": 503, //歌曲id
            "name": "Atmospheric Christmas.mp3", //歌曲名
            "path": "http://file.echomelody.com/music/20160408/absolute music/Christmas music/Atmospheric Christmas.mp3" //资源路径
        }

        let playlist2: PlayList = {
            "plid": 2, //播放列表id
            "online_time": "12:00:00", //开始时间
            "offline_time": "23:00:00", //结束时间
            "type": 1, //0：顺序播放，1:随机播放
            music_list: [item3, item4]
        }

        let result: PlayListResult = {
            "code": 0, //0:成功，1：盒子没有对应的门店，2：暂无播放计划
            "store": "1号店", //店名
            "msg": "成功", //返回信息,
            data: {
                "psid": 1, //播放计划id
                "name": "hhh", //播放计划名
                playlist: [playlist1, playlist2]
            }
        };

        return result;
    }
    /**
     * 获取插播计划
     */
    episode() {

    }
    instant_episode() {

    }
}