package io.cordova.hellocordova;

import android.annotation.SuppressLint;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class BootReceiver extends BroadcastReceiver {
    public void onReceive(Context context, Intent intent) {
        if (intent.getAction().equals("android.intent.action.BOOT_COMPLETED")) {
            Intent intent2 = new Intent(context, MainActivity.class);
            intent2.setFlags(0);
            context.startActivity(intent2);
        }
    }
}
