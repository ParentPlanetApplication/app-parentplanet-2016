package nl.xservices.plugins.accessor;

import android.util.Log;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.EventReminder;
import com.ppllc.p2.MainActivity;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.TimeZone;

/**
 * Created by phuongngo on 7/10/16.
 */
class AsyncCreateCalendar extends CalendarAsyncTask {
    private MainActivity mainActivity;
    private CallbackContext callbackContext;
    private JSONObject filter;
    com.google.api.services.calendar.model.Event mEvent;

    AsyncCreateCalendar(MainActivity activity, JSONObject options, CallbackContext callbackContext) {
        super(activity);
        this.mainActivity = activity;
        this.filter = options;
        this.callbackContext = callbackContext;
        this.title = "Creating event ...";
    }

    @Override
    protected void doInBackground() throws IOException {
        Log.i("Parent Planet: ", "doinbackground");
        mEvent = initEvent();

        DateTime startTime = new DateTime(Long.parseLong(filter.optString("startTime")));
        DateTime endTime = new DateTime(Long.parseLong(filter.optString("endTime")));

        setStartEnd(startTime, endTime);

        Log.i("Parent Planet: ", "Summary: " + mEvent.getSummary());
        Log.i("Parent Planet: ", "Location: " + mEvent.getLocation());
        Log.i("Parent Planet: ", "Description: " + mEvent.getDescription());
        Log.i("Parent Planet: ", "Start: " + Utils.convertStringToDate(mEvent.getStart().getDateTime().getValue()));
        Log.i("Parent Planet: ", "End: " + Utils.convertStringToDate(mEvent.getEnd().getDateTime().getValue()));
        Log.i("Parent Planet: ", "Timezone: " + TimeZone.getDefault().getID());

        setEventReminders();
        setRecurrence();

        com.google.api.services.calendar.model.Event createdEvent = null;

        createdEvent = mainActivity.client.events().insert(mainActivity.PREF_ACCOUNT_NAME, mEvent).execute();

        PluginResult res = new PluginResult(PluginResult.Status.OK, createdEvent == null ? null : createdEvent.getId());
        res.setKeepCallback(true);
        callbackContext.sendPluginResult(res);
    }

    private void setRecurrence() {
        Log.i("Parent Planet: ", "recurrence == " + filter.optString("recurrence") + " == " + (filter.optString("recurrence") != null));
        if (filter.optString("recurrence") != "") {
            Log.i("Parent Planet: ", "RRULE: " + filter.optString("RRULE"));
            mEvent.setRecurrence(Arrays.asList("RRULE:" + filter.optString("RRULE")));
        }
    }

    private void setEventReminders() {
        List<EventReminder> eventReminders = new ArrayList<EventReminder>();
        Integer firstReminderMinutes = filter.optInt("firstReminderMinutes");
        Integer secondReminderMinutes= filter.optInt("secondReminderMinutes");

        Log.i("Parent Planet: ", "first: " + firstReminderMinutes);
        Log.i("Parent Planet: ", "second: " + secondReminderMinutes);

        if (firstReminderMinutes != null) {
            eventReminders.add(
                    new EventReminder()
                            .setMinutes(firstReminderMinutes)
                            .setMethod("popup")
            );
        }

        if (secondReminderMinutes != null) {
            eventReminders.add(
                    new EventReminder()
                            .setMinutes(secondReminderMinutes)
                            .setMethod("popup")
            );
        }

        if (eventReminders.size() > 0) {
            Log.i("Parent Planet: ", "InsertEventTask -> recurrenceEndTime: " + filter.optString("recurrenceEndTime") + " " + Utils.convertStringToDate(Long.parseLong(filter.optString("recurrenceEndTime"))));
            com.google.api.services.calendar.model.Event.Reminders reminders = new com.google.api.services.calendar.model.Event.Reminders();

            Log.i("Parent Planet: ", "result: " + reminders.getOverrides());
            Log.i("Parent Planet: ", "list: " + eventReminders);
            reminders.setUseDefault(false).setOverrides(eventReminders);
            mEvent.setReminders(reminders);
        }
    }

    private com.google.api.services.calendar.model.Event initEvent() {
        return new com.google.api.services.calendar.model.Event()
                .setSummary(filter.optString("title"))
                .setLocation(filter.optString("location"))
                .setDescription(filter.optString("notes").trim());
    }

    private void setStartEnd(DateTime startTime, DateTime endTime) {
        mEvent
                .setStart(
                        new EventDateTime()
                                .setDateTime(startTime)
                                .setTimeZone(TimeZone.getDefault().getID()
                                )
                )
                .setEnd(
                        new EventDateTime()
                                .setDateTime(endTime)
                                .setTimeZone(TimeZone.getDefault().getID()
                                )
                );
    }
}
