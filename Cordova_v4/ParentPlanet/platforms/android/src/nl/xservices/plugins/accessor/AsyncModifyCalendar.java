package nl.xservices.plugins.accessor;

import android.util.Log;

import com.google.api.client.googleapis.extensions.android.gms.auth.UserRecoverableAuthIOException;
import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.EventReminder;
import com.ppllc.p2.MainActivity;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.PluginResult;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.TimeZone;

/**
 * Created by phuongngo on 7/10/16.
 */
class AsyncModifyCalendar extends CalendarAsyncTask{
    private MainActivity mainActivity;
    private CallbackContext callbackContext;
    private JSONObject filter;

    AsyncModifyCalendar(MainActivity activity, JSONObject options, CallbackContext callbackContext) {
        super(activity);
        this.mainActivity = activity;
        this.callbackContext = callbackContext;
        this.filter = options;
        this.title = "Modifing event ...";
    }

    @Override
    protected void doInBackground() throws IOException {
        DateTime oldStartTime = new DateTime(Long.parseLong(filter.optString("oldStartTime")));
        com.google.api.services.calendar.model.Events events = null;
        events = mainActivity.client.events().list(mainActivity.PREF_ACCOUNT_NAME)
                .setTimeMin(oldStartTime)
                .setOrderBy("startTime")
                .setSingleEvents(true)
                .execute();

        List<Event> items = events.getItems();

        for (com.google.api.services.calendar.model.Event event : items) {
            if(isMatchCondition(event, filter)) {
                DateTime start = event.getStart().getDateTime();
                if (start == null) {
                    start = event.getStart().getDate();
                }
                Log.i("Parent Planet: ",
                        String.format("%s - %s - %s - (%s)", event.getSummary(), event.getId(), event.getRecurringEventId(), start));
                Log.i("Parent Planet: ", "Date Start: " + event.getStart().getDateTime().getValue() + " === " + filter.optString("oldStartTime"));
                Log.i("Parent Planet: ", "Date Start: " + Utils.convertStringToDate(event.getStart().getDateTime().getValue()) + " === " + Utils.convertStringToDate(Long.parseLong(filter.optString("oldStartTime"))));
                Log.i("Parent Planet: ", "Replace Start: " + Utils.convertStringToDate(Long.parseLong(filter.optString("startTime"))));
                Log.i("Parent Planet: ", "Replace End: " + Utils.convertStringToDate(Long.parseLong(filter.optString("endTime"))));
                Log.i("Parent Planet: ", "Description: " + event.getDescription());
                Log.i("Parent Planet: ", "Title: " + event.getSummary());

                mainActivity.client.events().delete(mainActivity.PREF_ACCOUNT_NAME, event.getId()).execute();

                Log.i("Parent Planet: ", "-----------------------------------------");
                Log.i("Parent Planet: ", "Must re-create event");

                com.google.api.services.calendar.model.Event newEvent = createEvent();
                if(newEvent != null) {
                    Log.i("Parent Planet: ", "New Event = " + newEvent.getId());
                }
            }
        }

        PluginResult res = new PluginResult(PluginResult.Status.OK, true);
        res.setKeepCallback(true);
        callbackContext.sendPluginResult(res);

        return;
    }

    private com.google.api.services.calendar.model.Event createEvent() {
        com.google.api.services.calendar.model.Event event = new com.google.api.services.calendar.model.Event();

        Log.i("Parent Planet: ", "1. generate event info");
        event.setSummary(filter.optString("title"));
        event.setLocation(filter.optString("location"));
        event.setDescription(filter.optString("notes").trim());

        DateTime startTime = new DateTime(Long.parseLong(filter.optString("startTime")));
        DateTime endTime = new DateTime(Long.parseLong(filter.optString("endTime")));

        event.setStart(
                new EventDateTime()
                        .setDateTime(startTime)
                        .setTimeZone(
                                TimeZone.getDefault().getID()
                        )
        );

        event.setEnd(
                new EventDateTime()
                        .setDateTime(endTime)
                        .setTimeZone(
                                TimeZone.getDefault().getID()
                        )
        );

        Log.i("Parent Planet: ", "2. generate reminder");
        Integer firstReminderMinutes = filter.optInt("firstReminderMinutes");
        Integer secondReminderMinutes= filter.optInt("secondReminderMinutes");
        Log.i("Parent Planet: ", "first: " + firstReminderMinutes);
        Log.i("Parent Planet: ", "second: " + secondReminderMinutes);
        Log.i("Parent Planet: ", "Summary: " + event.getSummary());
        Log.i("Parent Planet: ", "Location: " + event.getLocation());
        Log.i("Parent Planet: ", "Description: " + event.getDescription());
        Log.i("Parent Planet: ", "Start: " + Utils.convertStringToDate(event.getStart().getDateTime().getValue()));
        Log.i("Parent Planet: ", "End: " + Utils.convertStringToDate(event.getEnd().getDateTime().getValue()));
        Log.i("Parent Planet: ", "Timezone: " + TimeZone.getDefault().getID());

        List<EventReminder> listEventReminder = new ArrayList<EventReminder>();
        if (firstReminderMinutes != null) {
            listEventReminder.add(
                    new EventReminder()
                            .setMinutes(firstReminderMinutes)
                            .setMethod("popup")
            );
        }

        if (secondReminderMinutes != null) {
            listEventReminder.add(
                    new EventReminder()
                            .setMinutes(secondReminderMinutes)
                            .setMethod("popup")
            );
        }

        if (listEventReminder.size() > 0) {
            com.google.api.services.calendar.model.Event.Reminders reminders = new com.google.api.services.calendar.model.Event.Reminders();

            reminders.setUseDefault(false).setOverrides(listEventReminder);
            event.setReminders(reminders);
        }

        Log.i("Parent Planet: ", "recurrence == " + filter.optString("recurrence") + " == " + (filter.optString("recurrence") != null));
        if (filter.optString("recurrence") != "") {
            event.setRecurrence(Arrays.asList("RRULE:" + filter.optString("RRULE")));
        }

        com.google.api.services.calendar.model.Event createdEvent = null;

        Log.i("Parent Planet: ", "3. insert event");
        Log.i("Parent Planet: ", "4." + mainActivity.client);
        try {
            createdEvent = mainActivity.client.events().insert(mainActivity.PREF_ACCOUNT_NAME, event).execute();
            Log.i("Parent Planet: ", "Created event id: " + createdEvent.getId());
            return createdEvent;
        } catch (UserRecoverableAuthIOException e) {
            Log.i("Parent Planet: ", "Google Calendar API require permission");
        } catch (IOException e) {
            Log.i("Parent Planet: ", "Error while try create event: " + e.getMessage());
            Log.i("Parent Planet: ", mainActivity.client.getApplicationName());
            Log.i("Parent Planet: ", mainActivity.client.getRootUrl());
            Log.i("Parent Planet: ", mainActivity.client.getServicePath());
            Log.i("Parent Planet: ", e.getCause().getMessage());
        }
        return  null;
    }

    private boolean isMatchCondition(com.google.api.services.calendar.model.Event event, JSONObject args) {
        return event.getStart().getDateTime().getValue() == Long.parseLong(args.optString("oldStartTime"));
    }

}
