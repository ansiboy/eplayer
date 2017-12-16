var file = new FileTransfer();
file.onprogress = (ev) => {
    if (ev.lengthComputable) {
        console.log(ev.loaded + '/' + ev.total);
    }
};
file.download('http://some.server.com/download.php', 'cdvfile://localhost/persistent/path/to/downloads/', (file) => { console.log('File Downloaded to ' + file.fullPath); }, (err) => {
    console.error('Error ' + err.code);
    if (err.exception) {
        console.error('Failed with exception ' + err.exception);
    }
}, true, {
    headers: {
        "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
    }
});
file.upload('cdvfile://localhost/persistent/path/to/downloads/', 'http://some.server.com/download.php', (result) => { console.log('File uploaded. Bytes uploaded: ' + result.bytesSent); }, (err) => {
    console.error('Error ' + err.code);
    if (err.exception) {
        console.error('Failed with exception ' + err.exception);
    }
}, { headers: { "X-Email": "user@mail.com", 'X-Token': "asdf3w234" }, httpMethod: "PUT" }, true);
file.abort();
