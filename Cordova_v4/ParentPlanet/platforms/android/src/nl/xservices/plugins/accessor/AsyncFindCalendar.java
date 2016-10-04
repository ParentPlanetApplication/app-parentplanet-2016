package nl.xservices.plugins.accessor;

import android.util.Log;

import com.google.api.client.googleapis.extensions.android.gms.auth.GooglePlayServicesAvailabilityIOException;
import com.google.api.client.googleapis.extensions.android.gms.auth.UserRecoverableAuthIOException;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.Calendar;
import com.google.api.services.calendar.model.Event;
import com.ppllc.p2.MainActivity;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.util.Iterator;
import java.util.List;

/**
 * Created by phuongngo on 7/10/16.
 */
class AsyncFindCalendar extends CalendarAsyncTask {
    private JSONObject filter;
    private MainActivity mainActivity;
    private CallbackContext callbackContext;

    AsyncFindCalendar(MainActivity activity, JSONObject options, CallbackContext callbackContext) {
        super(activity);
        this.filter = options;
        this.mainActivity = activity;
        this.callbackContext = callbackContext;
        this.title = "Finding event ...";
    }

    @Override
    protected void doInBackground() throws IOException {
        if(this.filter != null) {
            Log.i("Parent Planet: ", this.filter.toString());
        }

        DateTime oldStartTime = new DateTime(Long.parseLong(filter.optString("startDate")));
        com.google.api.services.calendar.model.Events events = null;
        Log.i("Parent Planet: ", "call google api for calendar");
        Log.i("Parent Planet: ", mainActivity.client.getApplicationName());
        events = mainActivity.client.events().list(mainActivity.PREF_ACCOUNT_NAME)
                .setTimeMin(oldStartTime)
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .execute();

        Log.i("Parent Planet: ", "begin get items from events fetched");
        List<Event> items = events.getItems();

        Log.i("Parent Planet: ", "Items count: " + items.size());

        JSONArray results = new JSONArray();
        JSONObject hash = new JSONObject();

        for (com.google.api.services.calendar.model.Event event : items) {
            if(isMatchCondition(event, filter)) {
                JSONObject _event = new JSONObject();
                String id;

                try {
                    _event.put("message", event.getDescription());
                    _event.put("location", event.getLocation());
                    _event.put("title", event.getSummary());
                    _event.put("startDate", event.getStart().getDateTime().getValue());
                    _event.put("endDate", event.getEnd().getDateTime().getValue());
                    if (event.getRecurringEventId() != null) {
                        id = event.getRecurringEventId();
//                        id = event.getId();
                        _event.put("id", id);
                    } else {
                        id = event.getId();
                        _event.put("id", id);
                    }
                    if (hash.isNull(id)) {
                        hash.put(id, _event);
                    }
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        }
        Log.i("Parent Planet: ", hash.toString());
        Iterator<String> keys = hash.keys();

        while( keys.hasNext() ) {
            String key = keys.next();
            try {
                results.put(hash.getJSONObject(key));
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        Log.i("Parent Planet: ", "Count: " + results.length());
        PluginResult res = new PluginResult(PluginResult.Status.OK, results);
        res.setKeepCallback(true);
        callbackContext.sendPluginResult(res);
    }

    private boolean isMatchCondition(com.google.api.services.calendar.model.Event event, JSONObject args) {
//        event.getCreated().getValue();
        return (
                (event.getStart().getDateTime().getValue() >= Long.parseLong(args.optString("startDate")))
                        &&
//                        event.getDescription().toLowerCase().equals(args.optString("notes").toLowerCase())
                        Utils.get_match(event.getDescription().toLowerCase(), args.optString("notes").toLowerCase())
                        &&
                        event.getCreated().getValue() < System.currentTimeMillis()
        );
    }

}
