package io.cordova.hellocordova;

import android.content.Context;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.os.PowerManager.WakeLock;
import org.apache.cordova.CordovaActivity;
import org.apache.cordova.PluginEntry;

public class MainActivity extends CordovaActivity {
    private int SOUND_CONFIG_ERROR = 3;
    private int SOUND_NETWORK_ERROR = 2;
    private int SOUND_SUCCESS = 1;
    private WakeLock wakeLock;

    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Bundle extras = getIntent().getExtras();
        if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {
            moveTaskToBack(true);
        }
        loadUrl(this.launchUrl);
        getWindow().setFlags(128, 128);
        setMaxVolume();
        if (!isNetworkAvailable()) {
            EPlayer.setWifiFromUsb(this);
        }
        EPlayer.playStartSound(this);
    }

    protected void init() {
        this.pluginEntries.add(new PluginEntry("EPlayer", "io.cordova.hellocordova.EPlayer", true));
        super.init();
    }

    boolean isNetworkAvailable() {
        NetworkInfo info = ((ConnectivityManager) getApplicationContext().getSystemService(Context.CONNECTIVITY_SERVICE)).getActiveNetworkInfo();
        return info != null && info.isConnected();
    }

    void setMaxVolume() {
        AudioManager audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        audioManager.setStreamVolume(3, audioManager.getStreamMaxVolume(3), 1);
    }
}
