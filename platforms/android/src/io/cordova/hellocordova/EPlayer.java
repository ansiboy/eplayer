package io.cordova.hellocordova;

import android.content.Context;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiManager;
import android.os.StatFs;
import android.os.storage.StorageManager;
import android.util.Log;

import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Timer;
import java.util.TimerTask;

/**
 * Created by maishu on 17-12-18.
 */

/*
<feature name="EPlayer">
    <param name="android-package" value="io.cordova.hellocordova.EPlayer"/>
    <param name="onload" value="true"/>
</feature>
*/

public class EPlayer extends CordovaPlugin {
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {

        super.initialize(cordova, webView);

        //=======================================================================
        // Request Root Permission
        String apkRoot = "chmod 777 " + cordova.getActivity().getPackageCodePath();
        RootCommand(apkRoot);
        //=======================================================================
    }

    @Override
    public boolean execute(String action, String rawArgs, CallbackContext callbackContext) throws JSONException {
        return super.execute(action, rawArgs, callbackContext);
    }

    @Override
    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext) throws JSONException {
        return super.execute(action, args, callbackContext);
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("reboot")) {
            this.reboot();
            return true;

        } else if (action.equals("freeSpace")) {
            if (args.length() != 1)
                return false;

            this.freeSpace(args.getString(0), callbackContext);

        } else if (action.equals("setWifiFromUsb")) {
            this.setWifiFromUsb();
        }
        return false;
    }

    private void reboot() {
        try {
            Runtime.getRuntime().exec(new String[]{"su", "-c", "reboot"});
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void freeSpace(String path, CallbackContext callbackContext) throws JSONException {
        StatFs sf = new StatFs(path);
        int blockSize = sf.getBlockSize();
        int blockCount = sf.getBlockCount();
        int availCount = sf.getAvailableBlocks();
        JSONObject obj = new JSONObject();
//        availCount * blockSize / 1024,blockCount*blockSize / 1024
        obj.put("free", availCount * blockSize / 1024);
        obj.put("total", blockCount * blockSize / 1024);
        callbackContext.success(obj);
    }

    private int SOUND_SUCCESS = 1;
    private int SOUND_NETWORK_ERROR = 2;
    private int SOUND_CONFIG_ERROR = 3;

    private void setWifiFromUsb() {
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

    private boolean setWifi(String ssid, String password) {
        Context context = cordova.getActivity().getApplicationContext();
        WifiManager wm = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);

        if (!wm.isWifiEnabled()) {
            wm.setWifiEnabled(true);
        }

        WifiConfiguration wifiConfig = new WifiConfiguration();
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

    JSONObject scandWifiConfig() {
        StorageManager storageManager = (StorageManager) cordova.getActivity().getSystemService(Context.STORAGE_SERVICE);

        Class<?>[] paramClasses = {};
        try {
            Method getVolumeList = StorageManager.class.getMethod("getVolumeList", paramClasses);
            getVolumeList.setAccessible(true);
            Object[] params = {};
            Object[] invokes = (Object[]) getVolumeList.invoke(storageManager, params);
            if (invokes == null)
                return null;

            for (int i = 0; i < invokes.length; i++) {
                Object obj = invokes[i];
                Method getPath = obj.getClass().getMethod("getPath");
                String path = (String) getPath.invoke(obj);
                File file = new File(path);
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

    void playSound(final int code) {
        Uri alert = null;// = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (code == SOUND_SUCCESS) {
            alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        } else if (code == SOUND_CONFIG_ERROR) {
            alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        } else if (code == SOUND_NETWORK_ERROR) {
            alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        } else {
            alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALL);
        }


        final MediaPlayer player = new MediaPlayer();
        try {
            player.setDataSource(cordova.getActivity(), alert);
            player.prepare();
            player.start();

            Timer timer = new Timer();
            timer.schedule(new TimerTask() {
                @Override
                public void run() {
                    player.stop();
                }
            }, 8000);

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
            } catch (Exception ignored) {
            }
        }
        Log.d("*** DEBUG ***", "Root SUC ");
        return true;
    }
}
