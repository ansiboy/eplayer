/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package io.cordova.hellocordova;

import android.app.Service;
import android.content.Context;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.os.Bundle;

import org.apache.cordova.*;
import org.json.JSONException;
import org.json.JSONObject;

import android.net.wifi.WifiManager;
import android.os.Environment;
import android.os.PowerManager;
import android.os.storage.StorageManager;
import android.media.AudioManager;
import android.util.Log;


import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Timer;
import java.util.TimerTask;

//enum ErrorSounds {
//    Success = 1,
//}


public class MainActivity extends CordovaActivity {

    private int SOUND_SUCCESS = 1;
    private int SOUND_NETWORK_ERROR = 2;
    private int SOUND_CONFIG_ERROR = 3;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        //this.setWifi();

        super.onCreate(savedInstanceState);

        // enable Cordova apps to be started in the background
        Bundle extras = getIntent().getExtras();
        if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {
            moveTaskToBack(true);
        }


        //=======================================================================================
        // 调节最大音量
        AudioManager audioManager = (AudioManager) this.getSystemService(Context.AUDIO_SERVICE);
        int maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, maxVolume, AudioManager.FLAG_SHOW_UI);
        //=======================================================================================

        if (!isNetworkAvailable()) {
            JSONObject config = scandWifiConfig();
            if (config == null) {
                this.playSound(SOUND_CONFIG_ERROR);
                return;
            }

            try {
                String ssid = config.getString("ssid");
                String password = config.getString("password");

                boolean setWifiSuccess = this.setWifi(ssid, password);
                if (!setWifiSuccess) {
                    this.playSound(SOUND_NETWORK_ERROR);
                    return;
                }

            } catch (JSONException e) {
                this.playSound(SOUND_CONFIG_ERROR);
                e.printStackTrace();
            }
        }

        this.playSound(SOUND_SUCCESS);

        // Set by <content src="index.html" /> in config.xml
        loadUrl(launchUrl);

        //=========================================
        // 定时重启
        int SECOND = 1000;
        int MINUTE = SECOND * 60;
        int HOUR = MINUTE * 60;
        int DAY = HOUR * 24;
        Timer timer = new Timer();
        TimerTask task = new TimerTask() {
            @Override
            public void run() {
                reboot();
            }
        };
        timer.schedule(task, DAY * 7);
        //=========================================
    }

    JSONObject scandWifiConfig() {
        StorageManager storageManager = (StorageManager) this.getSystemService(Context.STORAGE_SERVICE);

        Class<?>[] paramClasses = {};
        try {
            Method getVolumeList = StorageManager.class.getMethod("getVolumeList", paramClasses);
            getVolumeList.setAccessible(true);
            Object[] params = {};
            Object[] invokes = (Object[]) getVolumeList.invoke(storageManager, params);
            if (invokes == null)
                return null;

            StorageInfo info = null;
            for (int i = 0; i < invokes.length; i++) {
                Object obj = invokes[i];
                Method getPath = obj.getClass().getMethod("getPath", new Class[0]);
                String path = (String) getPath.invoke(obj, new Object[0]);
                info = new StorageInfo(path);
                File file = new File(info.path);
                boolean canRead = file.canRead();
                if (file.exists() && file.isDirectory() && canRead) {

                    File[] files = file.listFiles();
                    for (int j = 0; j < files.length; j++) {
                        String fileName = files[j].getName();
                        if (files[j].isFile() && fileName.equals("wifi-config.json")) {
                            String json = readFileAsString(files[j]);
                            JSONObject jObject = new JSONObject(json);
                            return jObject;
                        }
                    }
                }
            }
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return null;
    }

    private static String readFileAsString(File file)
            throws java.io.IOException {
        StringBuffer fileData = new StringBuffer(1000);
        BufferedReader reader = new BufferedReader(
                new FileReader(file));
        char[] buf = new char[1024];
        int numRead = 0;
        while ((numRead = reader.read(buf)) != -1) {
            String readData = String.valueOf(buf, 0, numRead);
            fileData.append(readData);
            buf = new char[1024];
        }
        reader.close();
        return fileData.toString();
    }


    void playSound(int times) {
        Uri alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        MediaPlayer player = new MediaPlayer();
        try {
            player.setDataSource(this, alert);
            player.prepare();
            for (int i = 0; i < times; i++) {
                player.start();
                Thread.sleep(1000);
            }

        } catch (IOException e) {
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    void reboot() {
        String apkRoot = "chmod 777 " + getPackageCodePath();
        RootCommand(apkRoot);
        try {
            Runtime.getRuntime().exec(new String[]{"su", "-c", "reboot"});
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * 应用程序运行命令获取 Root权限，设备必须已破解(获得ROOT权限)
     *
     * @param command 命令：String apkRoot="chmod 777 "+getPackageCodePath(); RootCommand(apkRoot);
     * @return 应用程序是/否获取Root权限
     */
    public static boolean RootCommand(String command) {
        Process process = null;
        DataOutputStream os = null;
        try {
            process = Runtime.getRuntime().exec("su");
            os = new DataOutputStream(process.getOutputStream());
            os.writeBytes(command + "\n");
            os.writeBytes("exit\n");
            os.flush();
            process.waitFor();
        } catch (Exception e) {
            Log.d("*** DEBUG ***", "ROOT REE" + e.getMessage());
            return false;
        } finally {
            try {
                if (os != null) {
                    os.close();
                }
                process.destroy();
            } catch (Exception e) {
            }
        }
        Log.d("*** DEBUG ***", "Root SUC ");
        return true;
    }

    boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) this
                .getSystemService(Context.CONNECTIVITY_SERVICE);

        NetworkInfo info = cm.getActiveNetworkInfo();
        if (info != null && info.isConnected()) {
            return true;
        }

        return false;

    }

    private boolean setWifi(String ssid, String password) {
        WifiManager wm = (WifiManager) this.getSystemService(Context.WIFI_SERVICE);
        //        wm.enableNetwork()
        if (!wm.isWifiEnabled()) {
            wm.setWifiEnabled(true);
        }

//        WifiInfo wifiInfo = wm.getConnectionInfo();
        WifiConfiguration wifiConfig = new WifiConfiguration();

//        String ssid = "ChinaNet-mm";
//        String password = "8126381263";

        wifiConfig.SSID = "\"" + ssid + "\"";
        wifiConfig.preSharedKey = "\"" + password + "\"";
        wifiConfig.hiddenSSID = true;
        wifiConfig.allowedAuthAlgorithms.set(WifiConfiguration.AuthAlgorithm.OPEN);
        wifiConfig.allowedGroupCiphers.set(WifiConfiguration.GroupCipher.TKIP);
        wifiConfig.allowedKeyManagement.set(WifiConfiguration.KeyMgmt.WPA_PSK);
        wifiConfig.allowedPairwiseCiphers.set(WifiConfiguration.PairwiseCipher.TKIP);
        wifiConfig.allowedGroupCiphers.set(WifiConfiguration.GroupCipher.CCMP);
        wifiConfig.allowedPairwiseCiphers.set(WifiConfiguration.PairwiseCipher.CCMP);
        wifiConfig.status = WifiConfiguration.Status.ENABLED;

        int wcgID = wm.addNetwork(wifiConfig);
        boolean b = wm.enableNetwork(wcgID, true);
        System.out.println("a--" + wcgID);
        System.out.println("b--" + b);

        return b;
    }
}


