package io.cordova.hellocordova;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.util.Log;

public class USBDiskReceiver extends BroadcastReceiver {
    public SharedPreferences cacheSp;

    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String path = intent.getData().getPath();
        if ("android.intent.action.MEDIA_MOUNTED".equals(action)) {
            Log.d("usb", "mounted");
            Uri uri = intent.getData();
            EPlayer.setWifiFromUsb(context);
        }
    }
}
