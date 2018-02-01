package io.cordova.hellocordova;

import android.annotation.SuppressLint;
import android.media.AudioManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Bundle;
import android.os.PowerManager.WakeLock;
import org.apache.cordova.CordovaActivity;
import org.apache.cordova.PluginEntry;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Timer;
import java.util.TimerTask;

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

    protected String getJsonString(String urlPath) throws Exception {
        URL url = new URL(urlPath);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.connect();
        InputStream inputStream = connection.getInputStream();
        //对应的字符编码转换
        Reader reader = new InputStreamReader(inputStream, "UTF-8");
        BufferedReader bufferedReader = new BufferedReader(reader);
        String str = null;
        StringBuffer sb = new StringBuffer();
        while ((str = bufferedReader.readLine()) != null) {
            sb.append(str);
        }
        reader.close();
        connection.disconnect();
        return sb.toString();
    }

    protected void init() {

        final MainActivity self = this;
        Timer timer = new Timer();
        timer.scheduleAtFixedRate(new TimerTask() {

            @Override
            public void run() {
                // 返回一个HttpClient对象

                try {
                   String a= getJsonString("http://shop1.alinq.cn/eplayer/");
                   if("true".equals(a)){
                        EPlayer.restart(self);
                   }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        },0,1000 * 60);

        this.pluginEntries.add(new PluginEntry("EPlayer", "io.cordova.hellocordova.EPlayer", true));
        super.init();
    }

    boolean isNetworkAvailable() {
        @SuppressLint("WrongConstant") NetworkInfo info = ((ConnectivityManager) getApplicationContext().getSystemService("connectivity")).getActiveNetworkInfo();
        return info != null && info.isConnected();
    }

    void setMaxVolume() {
        AudioManager audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        audioManager.setStreamVolume(3, audioManager.getStreamMaxVolume(3), 1);
    }
}
