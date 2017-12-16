
// var app = {
//     // Application Constructor
//     initialize: function() {
//         document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
//     },

//     // deviceready Event Handler
//     //
//     // Bind any cordova events here. Common events are:
//     // 'pause', 'resume', etc.
//     onDeviceReady: function() {
//         this.receivedEvent('deviceready');
//     },

//     // Update DOM on a Received Event
//     receivedEvent: function(id) {
//     }
// };

// app.initialize();

let service = new Service();
class Application {
    start() {
        debugger;
        document.addEventListener('deviceready', () => {
            debugger;
        }, false);

        let second = 1000;
        let minute = second * 60;

        this.loadPlayList();
        setInterval(() => this.loadPlayList(), minute * 30);
    }
    //cordova.file.documentsDirectory
    async loadPlayList() {
        let result = await service.playlist();
        let lists = result.data.playlist;
        for (let i = 0; i < lists.length; i++) {
            let musics = lists[i].music_list;
            for (let j = 0; j < musics.length; j++) {
                let arr = musics[j].path.split('/');
                let fileName = arr[arr.length - 1];
                // let filePath = cordova.file.documentsDirectory + '/' + fileName;
                console.assert(cordova.file.dataDirectory != null);
                this.findFile(cordova.file.dataDirectory);
            }
        }
    }

    findFile(path: string) {
        debugger;
        return new Promise((resolve, reject) => {
            debugger;
            window.resolveLocalFileSystemURL(path,
                function (fileSystem) {
                    resolve([]);
                },
                function (err) {
                    reject(err);
                })
        });
    }

}

let app = new Application();
app.start();





