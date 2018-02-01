package io.cordova.hellocordova;

import android.app.Service;
import android.content.Intent;
import android.os.Handler;
import android.os.IBinder;

public class killSelfService extends Service {
    private static long stopDelayed = 2000;
    private String PackageName;
    private Handler handler = new Handler();

    class C01571 implements Runnable {
        C01571() {
        }

        public void run() {
            killSelfService.this.startActivity(killSelfService.this.getPackageManager().getLaunchIntentForPackage(killSelfService.this.PackageName));
            killSelfService.this.stopSelf();
        }
    }

    public int onStartCommand(Intent intent, int flags, int startId) {
        stopDelayed = intent.getLongExtra("Delayed", 2000);
        this.PackageName = intent.getStringExtra("PackageName");
        this.handler.postDelayed(new C01571(), stopDelayed);
        return super.onStartCommand(intent, flags, startId);
    }

    public IBinder onBind(Intent intent) {
        return null;
    }
}
