var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const PlayOrderType = 0;
const PlayRadomType = 1;
const CodeSuccess = 0;
class Service {
    /**
     * 获取音乐播放计划
     */
    playSchedule() {
        return __awaiter(this, void 0, void 0, function* () {
            let item1 = {
                "mid": 506,
                "name": "Chorale Prelude in F Minor, We Three Kings of Orient Are.mp3",
                "path": "http://file.echomelody.com/music/20160408/absolute music/Christmas music/Chorale Prelude in F Minor, We Three Kings of Orient Are.mp3" //资源路径
            };
            let item2 = {
                "mid": 501,
                "name": "Ayleth's Song.mp3",
                "path": "http://file.echomelody.com/music/20160408/absolute music/light music/Ayleth's Song.mp3" //资源路径
            };
            let playlist1 = {
                "plid": 1,
                "online_time": "08:00:00",
                "offline_time": "12:00:00",
                "type": 0,
                music_list: [item1, item2]
            };
            let item3 = {
                "mid": 504,
                "name": "Bach to the Future Triple Christmas Fugue in G  Deck The Halls,Twinkle Twinkle.mp3",
                "path": "up_file=http://file.echomelody.com/music/20160408/absolute music/Christmas music/Bach to the Future Triple Christmas Fugue in G  Deck The Halls,Twinkle Twinkle.mp3" //资源路径
            };
            let item4 = {
                "mid": 503,
                "name": "Atmospheric Christmas.mp3",
                "path": "http://file.echomelody.com/music/20160408/absolute music/Christmas music/Atmospheric Christmas.mp3" //资源路径
            };
            let playlist2 = {
                "plid": 2,
                "online_time": "12:00:00",
                "offline_time": "23:00:00",
                "type": 1,
                music_list: [item3, item4]
            };
            let result = {
                "code": 0,
                "store": "1号店",
                "msg": "成功",
                data: {
                    "psid": 1,
                    "name": "hhh",
                    playlist: [playlist1, playlist2]
                }
            };
            return result;
        });
    }
    /**
     * 获取插播计划
     */
    episode() {
    }
    instant_episode() {
    }
}
