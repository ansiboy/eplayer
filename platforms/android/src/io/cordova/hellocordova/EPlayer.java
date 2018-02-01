package io.cordova.hellocordova;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Build.VERSION;
import android.os.Environment;
import android.os.Process;
import android.os.StatFs;
import android.os.storage.StorageManager;
import android.util.Log;
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import static android.media.session.PlaybackState.ACTION_PLAY_FROM_MEDIA_ID;
import static java.lang.Runtime.getRuntime;

public class EPlayer extends CordovaPlugin {
    private static int SOUND_CONFIG_ERROR = 3;
    private static int SOUND_NETWORK_ERROR = 2;
    private static int SOUND_SUCCESS = 1;

    static class FileSizeFormatter {
        private static final String BYTES = "Bytes";
        private static final long GIGA = 1073741824;
        private static final String GIGABYTES = "GB";
        private static final long KILO = 1024;
        private static final String KILOBYTES = "kB";
        private static final long MEGA = 1048576;
        private static final String MEGABYTES = "MB";

        FileSizeFormatter() {
        }

        public static String formatFileSize(long pBytes) {
            if (pBytes < 1024) {
                return pBytes + BYTES;
            }
            if (pBytes < MEGA) {
                return ((int) ((((double) pBytes) / KILO) + 0.5d)) + KILOBYTES;
            }
            if (pBytes < GIGA) {
                return ((int) ((((double) pBytes) / MEGA) + 0.5d)) + MEGABYTES;
            }
            return ((int) ((((double) pBytes) / 1.073741824E9d) + 0.5d)) + GIGABYTES;
        }
    }

    public void initialize(CordovaInterface cordova, CordovaWebView webView)  {
        super.initialize(cordova, webView);
        try {
            RootCommand("chmod 777 " + cordova.getActivity().getPackageCodePath());
        } catch (Throwable throwable) {
            throwable.printStackTrace();
        }
    }

    public boolean execute(String action, String rawArgs, CallbackContext callbackContext) throws JSONException {
        return super.execute(action, rawArgs, callbackContext);
    }

    public boolean execute(String action, CordovaArgs args, CallbackContext callbackContext) throws JSONException {
        return super.execute(action, args, callbackContext);
    }

    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("reboot")) {
            reboot();
            return true;
        }
        if (action.equals("freeSpace")) {
            if (args.length() != 1) {
                return false;
            }
            if (VERSION.SDK_INT >= 18) {
                freeSpaceLong(args.getString(0), callbackContext);
            } else {
                freeSpaceInt(args.getString(0), callbackContext);
            }
        } else if (action.equals("setWifiFromUsb")) {
            setWifiFromUsb(this.cordova.getActivity());
        } else if (action.equals("macAddress")) {
            macAddress(callbackContext);
        } else if (action.equals("playSound")) {
            playSound(args.getInt(0), this.cordova.getActivity().getApplicationContext());
        } else if (action.equals("setVolume")) {
            setVolume(args.getInt(0));
        } else if (action.equals("restart")) {
            restart();
        }
        return false;
    }

    void macAddress(CallbackContext callbackContext) {
        WifiManager cm = (WifiManager) this.cordova.getActivity().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        WifiInfo info = null;
        if (cm != null) {
            info = cm.getConnectionInfo();
        }
        callbackContext.success(info != null ? info.getMacAddress() : "");
    }

    public static void playStartSound(Context context) {
        playSound(SOUND_SUCCESS, context);
    }

    private void reboot() {
        try {
            getRuntime().exec(new String[]{"su", "-c", "reboot"});
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void freeSpaceLong(String path, CallbackContext callbackContext) throws JSONException {
        JSONObject obj = new JSONObject();
        long total = getTotalExternalMemorySizeLong() + getTotalInternalMemorySizeLong();
        obj.put("free", (getAvailableExternalMemorySizeLong() + getAvailableInternalMemorySizeLong()) / ACTION_PLAY_FROM_MEDIA_ID);
        obj.put("total", total / ACTION_PLAY_FROM_MEDIA_ID);
        callbackContext.success(obj);
    }

    private void freeSpaceInt(String path, CallbackContext callbackContext) throws JSONException {
        JSONObject obj = new JSONObject();
        long total = getTotalExternalMemorySize() + getTotalInternalMemorySize();
        obj.put("free", (getAvailableExternalMemorySize() + getAvailableInternalMemorySize()) / ACTION_PLAY_FROM_MEDIA_ID);
        obj.put("total", total / ACTION_PLAY_FROM_MEDIA_ID);
        callbackContext.success(obj);
    }

    static void setWifiFromUsb(Context context) {
        JSONObject config = scandWifiConfig(context);
        if (config == null) {
            playSound(SOUND_CONFIG_ERROR, context);
            return;
        }
        try {
            if (setWifi(config.getString("ssid"), config.getString("password"), context)) {
                playSound(SOUND_SUCCESS, context);
            } else {
                playSound(SOUND_NETWORK_ERROR, context);
            }
        } catch (JSONException e) {
            playSound(SOUND_CONFIG_ERROR, context);
            e.printStackTrace();
        }
    }

    private static boolean setWifi(String ssid, String password, Context context) {
        WifiManager wm = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
        if (!wm.isWifiEnabled()) {
            wm.setWifiEnabled(true);
        }
        WifiConfiguration wifiConfig = new WifiConfiguration();
        wifiConfig.SSID = "\"" + ssid + "\"";
        wifiConfig.preSharedKey = "\"" + password + "\"";
        wifiConfig.hiddenSSID = true;
        wifiConfig.allowedAuthAlgorithms.set(0);
        wifiConfig.allowedGroupCiphers.set(2);
        wifiConfig.allowedKeyManagement.set(1);
        wifiConfig.allowedPairwiseCiphers.set(1);
        wifiConfig.allowedGroupCiphers.set(3);
        wifiConfig.allowedPairwiseCiphers.set(2);
        wifiConfig.status = 2;
        int wcgID = wm.addNetwork(wifiConfig);
        boolean b = wm.enableNetwork(wcgID, true);
        System.out.println("a--" + wcgID);
        System.out.println("b--" + b);
        return b;
    }

    private static JSONObject scandWifiConfig(Context context) {
        StorageManager storageManager = (StorageManager) context.getSystemService(Context.STORAGE_SERVICE);
        try {
            Method getVolumeList = StorageManager.class.getMethod("getVolumeList", new Class[0]);
            getVolumeList.setAccessible(true);
            Object[] invokes = (Object[]) getVolumeList.invoke(storageManager, new Object[0]);
            if (invokes == null) {
                return null;
            }
            for (Object obj : invokes) {
                File file = new File((String) obj.getClass().getMethod("getPath", new Class[0]).invoke(obj, new Object[0]));
                boolean canRead = file.canRead();
                if (file.exists() && file.isDirectory() && canRead) {
                    File[] files = file.listFiles();
                    for (int j = 0; j < files.length; j++) {
                        String fileName = files[j].getName();
                        if (files[j].isFile() && fileName.equals("wifi-config.json")) {
                            return new JSONObject(readFileAsString(files[j]));
                        }
                    }
                    continue;
                }
            }
            return null;
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e2) {
            e2.printStackTrace();
        } catch (IllegalAccessException e3) {
            e3.printStackTrace();
        } catch (IOException e4) {
            e4.printStackTrace();
        } catch (JSONException e5) {
            e5.printStackTrace();
        }

        return  null;
    }

    private static String readFileAsString(File file) throws IOException {
        StringBuffer fileData = new StringBuffer(1000);
        BufferedReader reader = new BufferedReader(new FileReader(file));
        char[] buf = new char[1024];
        while (true) {
            int numRead = reader.read(buf);
            if (numRead != -1) {
                fileData.append(String.valueOf(buf, 0, numRead));
                buf = new char[1024];
            } else {
                reader.close();
                return fileData.toString();
            }
        }
    }

    private static void playSound(int code, Context context) {
        Uri alert;
        if (code == SOUND_SUCCESS) {
            alert = RingtoneManager.getDefaultUri(2);
        } else if (code == SOUND_CONFIG_ERROR) {
            alert = RingtoneManager.getDefaultUri(4);
        } else if (code == SOUND_NETWORK_ERROR) {
            alert = RingtoneManager.getDefaultUri(1);
        } else {
            alert = RingtoneManager.getDefaultUri(7);
        }
        final MediaPlayer player = new MediaPlayer();
        try {
            player.setDataSource(context, alert);
            player.prepare();
            player.start();
            new Timer().schedule(new TimerTask() {
                public void run() {
                    player.stop();
                }
            }, 8000);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static boolean RootCommand(String command) throws Throwable {
        Exception e;
        Throwable th;
        java.lang.Process process = null;
        DataOutputStream os = null;
        try {
            process = getRuntime().exec("su");
            DataOutputStream os2 = new DataOutputStream(process.getOutputStream());
            try {
                os2.writeBytes(command + "\n");
                os2.writeBytes("exit\n");
                os2.flush();
                process.waitFor();
                if (os2 != null) {
                    try {
                        os2.close();
                    } catch (Exception e2) {
                    }
                }
                process.destroy();
                Log.d("*** DEBUG ***", "Root SUC ");
                os = os2;
                return true;
            } catch (Exception e3) {
                e = e3;
                os = os2;
                try {
                    Log.d("*** DEBUG ***", "ROOT REE" + e.getMessage());
                    if (os != null) {
                        try {
                            os.close();
                        } catch (Exception e4) {
                            return false;
                        }
                    }
                    process.destroy();
                    return false;
                } catch (Throwable th2) {
                    th = th2;
                    if (os != null) {
                        try {
                            os.close();
                        } catch (Exception e5) {
                            throw th;
                        }
                    }
                    process.destroy();
                    throw th;
                }
            } catch (Throwable th3) {
                th = th3;
                os = os2;
                if (os != null) {
                    os.close();
                }
                process.destroy();
                throw th;
            }
        } catch (Exception e6) {
            e = e6;
            Log.d("*** DEBUG ***", "ROOT REE" + e.getMessage());
            if (os != null) {
                os.close();
            }
            process.destroy();
            return false;
        }
    }

    public static List<StorageInfo> listAvaliableStorage(Context context) {
        ArrayList<StorageInfo> storagges = new ArrayList();
        @SuppressLint("WrongConstant") StorageManager storageManager = (StorageManager) context.getSystemService("storage");
        try {
            Method getVolumeList = StorageManager.class.getMethod("getVolumeList", new Class[0]);
            getVolumeList.setAccessible(true);
            Object[] invokes = (Object[]) getVolumeList.invoke(storageManager, new Object[0]);
            if (invokes != null) {
                for (Object obj : invokes) {
                    StorageInfo info = new StorageInfo((String) obj.getClass().getMethod("getPath", new Class[0]).invoke(obj, new Object[0]));
                    File file = new File(info.path);
                    if (file.exists() && file.isDirectory()) {
                        Method isRemovable = obj.getClass().getMethod("isRemovable", new Class[0]);
                        try {
                            info.state = (String) StorageManager.class.getMethod("getVolumeState", new Class[]{String.class}).invoke(storageManager, new Object[]{info.path});
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                        if (info.isMounted()) {
                            info.isRemoveable = ((Boolean) isRemovable.invoke(obj, new Object[0])).booleanValue();
                            storagges.add(info);
                        }
                    }
                }
            }
        } catch (NoSuchMethodException e1) {
            e1.printStackTrace();
        } catch (IllegalArgumentException e2) {
            e2.printStackTrace();
        } catch (IllegalAccessException e3) {
            e3.printStackTrace();
        } catch (InvocationTargetException e4) {
            e4.printStackTrace();
        }
        storagges.trimToSize();
        return storagges;
    }

    public static boolean externalMemoryAvailable() {
        return Environment.getExternalStorageState().equals("mounted");
    }

    public static long getAvailableInternalMemorySize() {
        StatFs stat = new StatFs(Environment.getDataDirectory().getPath());
        return ((long) stat.getAvailableBlocks()) * ((long) stat.getBlockSize());
    }

    @TargetApi(Build.VERSION_CODES.JELLY_BEAN_MR2)
    public static long getAvailableInternalMemorySizeLong() {
        StatFs stat = new StatFs(Environment.getDataDirectory().getPath());
        return stat.getAvailableBlocksLong() * stat.getBlockSizeLong();
    }

    public static long getTotalInternalMemorySize() {
        StatFs stat = new StatFs(Environment.getDataDirectory().getPath());
        return ((long) stat.getBlockCount()) * ((long) stat.getBlockSize());
    }

    @TargetApi(Build.VERSION_CODES.JELLY_BEAN_MR2)
    public static long getTotalInternalMemorySizeLong() {
        StatFs stat = new StatFs(Environment.getDataDirectory().getPath());
        return stat.getBlockCountLong() * stat.getBlockSizeLong();
    }

    @TargetApi(Build.VERSION_CODES.JELLY_BEAN_MR2)
    public static long getAvailableExternalMemorySizeLong() {
        if (!externalMemoryAvailable()) {
            return 0;
        }
        StatFs stat = new StatFs(Environment.getExternalStorageDirectory().getPath());
        return stat.getAvailableBlocksLong() * stat.getBlockSizeLong();
    }

    public static long getAvailableExternalMemorySize() {
        if (!externalMemoryAvailable()) {
            return 0;
        }
        StatFs stat = new StatFs(Environment.getExternalStorageDirectory().getPath());
        return ((long) stat.getAvailableBlocks()) * ((long) stat.getBlockSize());
    }

    @TargetApi(Build.VERSION_CODES.JELLY_BEAN_MR2)
    public long getTotalExternalMemorySizeLong() {
        if (!externalMemoryAvailable()) {
            return 0;
        }
        StatFs stat = new StatFs(Environment.getExternalStorageDirectory().getPath());
        return stat.getBlockCountLong() * stat.getBlockSizeLong();
    }

    public long getTotalExternalMemorySize() {
        if (!externalMemoryAvailable()) {
            return 0;
        }
        StatFs stat = new StatFs(Environment.getExternalStorageDirectory().getPath());
        return ((long) stat.getBlockCount()) * ((long) stat.getBlockSize());
    }

    public static String formatSize(long size) {
        String suffix = null;
        if (size >= ACTION_PLAY_FROM_MEDIA_ID) {
            suffix = "KB";
            size /= ACTION_PLAY_FROM_MEDIA_ID;
            if (size >= ACTION_PLAY_FROM_MEDIA_ID) {
                suffix = "MB";
                size /= ACTION_PLAY_FROM_MEDIA_ID;
            }
        }
        StringBuilder resultBuffer = new StringBuilder(Long.toString(size));
        for (int commaOffset = resultBuffer.length() - 3; commaOffset > 0; commaOffset -= 3) {
            resultBuffer.insert(commaOffset, ',');
        }
        if (suffix != null) {
            resultBuffer.append(suffix);
        }
        return resultBuffer.toString();
    }

    public void setVolume(int volumes) {
        if (volumes > 10) {
            volumes = 10;
        } else if (volumes < 1) {
            volumes = 1;
        }
        AudioManager audioManager = (AudioManager) this.cordova.getActivity().getSystemService(Context.AUDIO_SERVICE);
        audioManager.setStreamVolume(3, (audioManager.getStreamMaxVolume(3) * volumes) / 10, 1);
    }

    public void restart() {
        Activity context = this.cordova.getActivity();
        ((AlarmManager) context.getSystemService(Context.ALARM_SERVICE)).set(AlarmManager.RTC, System.currentTimeMillis() + 100,
                PendingIntent.getActivity(context, 123456, new Intent(context, MainActivity.class), 0));
        System.exit(0);
    }

    public static void restart(Activity context) {
        ((AlarmManager) context.getSystemService(Context.ALARM_SERVICE)).set(AlarmManager.RTC, System.currentTimeMillis() + 100,
                PendingIntent.getActivity(context, 123456, new Intent(context, MainActivity.class), 0));
        System.exit(0);
    }

    public static void restartAPP(Context context, long Delayed) {
        Intent intent1 = new Intent(context, killSelfService.class);
        intent1.putExtra("PackageName", context.getPackageName());
        intent1.putExtra("Delayed", Delayed);
        context.startService(intent1);
        Process.killProcess(Process.myPid());
    }

    public static void restartAPP(Context context) {
        restartAPP(context, 2000);
    }
}
