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
    _playSchedule() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                "code": 0,
                "store": "1号店",
                "msg": "成功",
                "data": {
                    "psid": 1,
                    "name": "hhh",
                    playlist: [
                        {
                            "plid": 1,
                            "online_time": "08:00:00",
                            "offline_time": "12:00:00",
                            "type": 0,
                            music_list: [
                                {
                                    "mid": 506,
                                    "name": "Chorale Prelude in F Minor, We Three Kings of Orient Are.mp3",
                                    "path": "http://file.echomelody.com/music/20160408/absolute music/Christmas music/Chorale Prelude in F Minor, We Three Kings of Orient Are.mp3" //资源路径
                                },
                                {
                                    "mid": 501,
                                    "name": "Ayleth's Song.mp3",
                                    "path": "http://file.echomelody.com/music/20160408/absolute music/light music/Ayleth's Song.mp3" //资源路径
                                }
                            ]
                        },
                        {
                            "plid": 2,
                            "online_time": "12:00:00",
                            "offline_time": "24:00:00",
                            "type": 1,
                            music_list: [
                                {
                                    "mid": 504,
                                    "name": "Ayleth's Song.mp3",
                                    "path": "http://file.echomelody.com/music/20160408/absolute music/light music/Ayleth's Song.mp3" //资源路径
                                },
                                {
                                    "mid": 503,
                                    "name": "Atmospheric Christmas.mp3",
                                    "path": "http://file.echomelody.com/music/20160408/absolute music/Christmas music/Atmospheric Christmas.mp3" //资源路径
                                }
                            ]
                        }
                    ]
                }
            };
        });
    }
    /**
     * 获取音乐播放计划
     */
    playlists() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield this._playSchedule();
                return result.data.playlist;
            }
            catch (e) {
                return [];
            }
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
