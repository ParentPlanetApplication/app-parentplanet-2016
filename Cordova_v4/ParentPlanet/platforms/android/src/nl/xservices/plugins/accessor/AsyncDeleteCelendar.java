package nl.xservices.plugins.accessor;

import com.ppllc.p2.MainActivity;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONObject;

import java.io.IOException;

/**
 * Created by phuongngo on 7/10/16.
 */
class AsyncDeleteCelendar extends CalendarAsyncTask{
    private CallbackContext callbackContext;
    private MainActivity mainActivity;
    private JSONObject filter;
    AsyncDeleteCelendar(MainActivity activity, JSONObject options, CallbackContext callbackContext) {
        super(activity);
        this.mainActivity = activity;
        this.filter = options;
        this.callbackContext = callbackContext;
    }

    @Override
    protected void doInBackground() throws IOException {
        mainActivity.client.events().delete(mainActivity.PREF_ACCOUNT_NAME, filter.optString("eventId")).execute();
        PluginResult res = new PluginResult(PluginResult.Status.OK, true);
        res.setKeepCallback(true);
        callbackContext.sendPluginResult(res);
    }
}
