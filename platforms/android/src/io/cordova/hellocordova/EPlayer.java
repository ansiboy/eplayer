package io.cordova.hellocordova;

import android.os.StatFs;
import android.util.Log;

import org.apache.cordova.CordovaArgs;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;

import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.DataOutputStream;
import java.io.IOException;

/**
 * Created by maishu on 17-12-18.
 */


//<feature name="EPlayer">
//        <param name="android-package" value="io.cordova.hellocordova.EPlayer"/>
//        <param name="onload" value="true"/>
//        </feature>

public class EPlayer extends CordovaPlugin {
    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {

        super.initialize(cordova, webView);
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

            String message = "hello world";
            this.reboot();
            return true;
        } else if (action.equals("freeSpace")) {
            if (args.length() != 1)
                return false;

            this.freeSpace(args.getString(0), callbackContext);
        }
        return false;
    }

    private void echo(String message, CallbackContext callbackContext) {
        if (message != null && message.length() > 0) {
            callbackContext.success(message);
        } else {
            callbackContext.error("Expected one non-empty string argument.");
        }
    }

    private void reboot() {
        String apkRoot = "chmod 777 " + cordova.getActivity().getPackageCodePath();
        RootCommand(apkRoot);
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
        obj.put("free",availCount * blockSize / 1024);
        obj.put("total",blockCount*blockSize / 1024);
        callbackContext.success(obj);
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
