// Media and Media Capture
//----------------------------------------------------------------------
var media = new Media('', () => { console.log('Media opened'); }, (err) => { alert('Error: ' + err.code); });
media.play();
media.setVolume(10);
