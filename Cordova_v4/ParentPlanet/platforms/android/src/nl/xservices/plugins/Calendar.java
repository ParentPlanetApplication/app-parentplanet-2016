package nl.xservices.plugins;

import android.Manifest;
import android.accounts.Account;
import android.accounts.AccountManager;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.CalendarContract;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.util.Log;

import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential;
import com.ppllc.p2.MainActivity;

import nl.xservices.plugins.accessor.AbstractCalendarAccessor;
import nl.xservices.plugins.accessor.CalendarProviderAccessor;
import nl.xservices.plugins.accessor.LegacyCalendarAccessor;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.LinkedList;
import java.util.List;
import java.util.TimeZone;

public class Calendar extends CordovaPlugin {
  private static final String HAS_READ_PERMISSION = "hasReadPermission";
  private static final String REQUEST_READ_PERMISSION = "requestReadPermission";

  private static final String HAS_WRITE_PERMISSION = "hasWritePermission";
  private static final String REQUEST_WRITE_PERMISSION = "requestWritePermission";

  private static final String HAS_READWRITE_PERMISSION = "hasReadWritePermission";
  private static final String REQUEST_READWRITE_PERMISSION = "requestReadWritePermission";

  private static final String ACTION_OPEN_CALENDAR = "openCalendar";
  private static final String ACTION_CREATE_EVENT_WITH_OPTIONS = "createEventWithOptions";
  private static final String ACTION_CREATE_EVENT_INTERACTIVELY = "createEventInteractively";
  private static final String ACTION_DELETE_EVENT = "deleteEvent";
  private static final String ACTION_DELETE_EVENT_BY_ID = "deleteEventById";
  private static final String ACTION_MODIFY_REPEAT_EVENT_INSTANCE = "modifyRepeatEventInstance";
  private static final String ACTION_FIND_EVENT_WITH_OPTIONS = "findEventWithOptions";
  private static final String ACTION_LIST_EVENTS_IN_RANGE = "listEventsInRange";
  private static final String ACTION_LIST_CALENDARS = "listCalendars";
  private static final String ACTION_CREATE_CALENDAR = "createCalendar";

  private static final Integer RESULT_CODE_CREATE = 0;
  private static final Integer RESULT_CODE_OPENCAL = 1;

  private CallbackContext callback;
  private Boolean waitingProcessCalendar = false;

  private static final String LOG_TAG = AbstractCalendarAccessor.LOG_TAG;

  MainActivity mainActivity;

  @Override
  public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
    callback = callbackContext;
    final boolean hasLimitedSupport = Build.VERSION.SDK_INT < Build.VERSION_CODES.ICE_CREAM_SANDWICH;

    if (ACTION_OPEN_CALENDAR.equals(action)) {
      if (hasLimitedSupport) {
        openCalendarLegacy(args);
      } else {
        openCalendar(args);
      }
      return true;
    } else if (ACTION_CREATE_EVENT_WITH_OPTIONS.equals(action)) {
      if (hasLimitedSupport) {
        // TODO investigate this option some day: http://stackoverflow.com/questions/3721963/how-to-add-calendar-events-in-android
        Log.i("Parent Planet: ", "Call method createEventInteractively to create event");
        createEventInteractively(args);
      } else {
        Log.i("Parent Planet: ", "Call method createEvent to create event");
        createEvent(args);
      }
      return true;
    } else if (ACTION_CREATE_EVENT_INTERACTIVELY.equals(action)) {
      createEventInteractively(args);
      return true;
    } else if (ACTION_LIST_EVENTS_IN_RANGE.equals(action)) {
      listEventsInRange(args);
      return true;
    } else if (!hasLimitedSupport && ACTION_FIND_EVENT_WITH_OPTIONS.equals(action)) {
      findEvents(args);
      return true;
    } else if (!hasLimitedSupport && ACTION_DELETE_EVENT.equals(action)) {
      deleteEvent(args);
      return true;
    } else if (!hasLimitedSupport && ACTION_DELETE_EVENT_BY_ID.equals(action)){
      deleteEventById(args);
      return true;
    } else if (!hasLimitedSupport && ACTION_MODIFY_REPEAT_EVENT_INSTANCE.equals(action)) {
      modifyRepeatEventInstance(args);
      return true;
    }else if (ACTION_LIST_CALENDARS.equals(action)) {
      listCalendars();
      return true;
    } else if (!hasLimitedSupport && ACTION_CREATE_CALENDAR.equals(action)) {
      createCalendar(args);
      return true;
    } else if (HAS_READ_PERMISSION.equals(action)) {
      hasReadPermission();
      return true;
    } else if (HAS_WRITE_PERMISSION.equals(action)) {
      hasWritePermission();
      return true;
    } else if (HAS_READWRITE_PERMISSION.equals(action)) {
      hasReadWritePermission();
      return true;
    } else if (REQUEST_READ_PERMISSION.equals(action)) {
      requestReadPermission();
      return true;
    } else if (REQUEST_WRITE_PERMISSION.equals(action)) {
      requestWritePermission();
      return true;
    } else if (REQUEST_READWRITE_PERMISSION.equals(action)) {
      requestReadWritePermission();
      return true;
    }
    return false;
  }

    @Override
    protected void pluginInitialize() {
        super.pluginInitialize();
        mainActivity = (MainActivity) cordova.getActivity();
        mainActivity.createCredential();
        if (mainActivity.checkGooglePlayServicesAvailable()) {
            mainActivity.haveGooglePlayServices();
        }
        Log.i("Parent Planet: ", "pluginInitialize");
    }

    @Override
    public void onResume(boolean multitasking) {
        super.onResume(multitasking);
        Log.i("Parent Planet: ", "onResume");
        if (mainActivity.checkGooglePlayServicesAvailable()) {
            mainActivity.haveGooglePlayServices();
        }
    }

    private void hasReadPermission() {
    this.callback.sendPluginResult(new PluginResult(PluginResult.Status.OK,
        calendarPermissionGranted(Manifest.permission.READ_CALENDAR)));
  }

  private void hasWritePermission() {
    this.callback.sendPluginResult(new PluginResult(PluginResult.Status.OK,
        calendarPermissionGranted(Manifest.permission.WRITE_CALENDAR)));
  }

  private void hasReadWritePermission() {
    this.callback.sendPluginResult(new PluginResult(PluginResult.Status.OK,
        calendarPermissionGranted(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR)));
  }

  private void requestReadPermission() {
    requestPermission(Manifest.permission.READ_CALENDAR);
  }

  private void requestWritePermission() {
    requestPermission(Manifest.permission.WRITE_CALENDAR);
  }

  private void requestReadWritePermission() {
    requestPermission(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR);
  }

  private boolean calendarPermissionGranted(String... types) {
    if (Build.VERSION.SDK_INT < 23) {
      return true;
    }
    for (final String type : types) {
      if (PackageManager.PERMISSION_GRANTED != ContextCompat.checkSelfPermission(this.cordova.getActivity(), type)) {
        return false;
      }
    }
    return true;
  }

  private void requestPermission(String... types) {
    if (!calendarPermissionGranted(types)) {
      ActivityCompat.requestPermissions(
          this.cordova.getActivity(),
          types,
          555);
    }
    // this method executes async and we seem to have no known way to receive the result, so simply returning ok now
    this.callback.success();
  }

  private void openCalendarLegacy(JSONArray args) {
    try {
      final Long millis = args.getJSONObject(0).optLong("date");

      cordova.getThreadPool().execute(new Runnable() {
        @Override
        public void run() {
          final Intent calendarIntent = new Intent();
          calendarIntent.putExtra("beginTime", millis);
          calendarIntent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
          calendarIntent.setClassName("com.android.calendar", "com.android.calendar.AgendaActivity");
          Calendar.this.cordova.startActivityForResult(Calendar.this, calendarIntent, RESULT_CODE_OPENCAL);

          callback.success();
        }
      });
    } catch (JSONException e) {
      System.err.println("Exception: " + e.getMessage());
      callback.error(e.getMessage());
    }
  }

  @TargetApi(14)
  private void openCalendar(JSONArray args) {
    try {
      final Long millis = args.getJSONObject(0).optLong("date");

      cordova.getThreadPool().execute(new Runnable() {
        @Override
        public void run() {
          final Uri.Builder builder = CalendarContract.CONTENT_URI.buildUpon().appendPath("time");
          ContentUris.appendId(builder, millis);

          final Intent intent = new Intent(Intent.ACTION_VIEW).setData(builder.build());
          Calendar.this.cordova.startActivityForResult(Calendar.this, intent, RESULT_CODE_OPENCAL);

          callback.success();
        }
      });
    } catch (JSONException e) {
      System.err.println("Exception: " + e.getMessage());
      callback.error(e.getMessage());
    }
  }

  private void listCalendars() {
    // note that if the dev didn't call requestReadPermission before calling this method and calendarPermissionGranted returns false,
    // the app will ask permission and this method needs to be invoked again (done for backward compat).
    if (!calendarPermissionGranted(Manifest.permission.READ_CALENDAR)) {
      requestReadPermission();
      this.callback.error("Please allow Read access to the Calendar and try again.");
      return;
    }
    cordova.getThreadPool().execute(new Runnable() {
      @Override
      public void run() {
        JSONArray jsonObject = new JSONArray();
        try {
          jsonObject = Calendar.this.getCalendarAccessor().getActiveCalendars();
        } catch (JSONException e) {
          System.err.println("Exception: " + e.getMessage());
          callback.error(e.getMessage());
        }
        PluginResult res = new PluginResult(PluginResult.Status.OK, jsonObject);
        callback.sendPluginResult(res);
      }
    });
  }

  // note: not quite ready for primetime yet
  private void createCalendar(JSONArray args) {
    if (args.length() == 0) {
      System.err.println("Exception: No Arguments passed");
      return;
    }

    // note that if the dev didn't call requestWritePermission before calling this method and calendarPermissionGranted returns false,
    // the app will ask permission and this method needs to be invoked again (done for backward compat).
    if (!calendarPermissionGranted(Manifest.permission.WRITE_CALENDAR)) {
      requestWritePermission();
      this.callback.error("Please allow Write access to the Calendar and try again.");
      return;
    }

    try {
      final JSONObject jsonFilter = args.getJSONObject(0);
      final String calendarName = getPossibleNullString("calendarName", jsonFilter);
      if (calendarName == null) {
        callback.error("calendarName is mandatory");
        return;
      }

      cordova.getThreadPool().execute(new Runnable() {
        @Override
        public void run() {
          getCalendarAccessor().createCalendar(calendarName);

          PluginResult res = new PluginResult(PluginResult.Status.OK, "yes");
          res.setKeepCallback(true);
          callback.sendPluginResult(res);
        }
      });
    } catch (JSONException e) {
      System.err.println("Exception: " + e.getMessage());
      callback.error(e.getMessage());
    }
  }

  private void createEventInteractively(JSONArray args) {
    try {
      final JSONObject jsonFilter = args.getJSONObject(0);
      final JSONObject argOptionsObject = jsonFilter.getJSONObject("options");

      cordova.getThreadPool().execute(new Runnable() {
        @Override
        public void run() {
          final Intent calIntent = new Intent(Intent.ACTION_EDIT)
              .setType("vnd.android.cursor.item/event")
              .putExtra("title", getPossibleNullString("title", jsonFilter))
              .putExtra("beginTime", jsonFilter.optLong("startTime"))
              .putExtra("endTime", jsonFilter.optLong("endTime"))
              .putExtra("hasAlarm", 1)
              .putExtra("allDay", AbstractCalendarAccessor.isAllDayEvent(new Date(jsonFilter.optLong("startTime")), new Date(jsonFilter.optLong("endTime"))));
          // TODO can we pass a reminder here?

          // optional fields
          if (!jsonFilter.isNull("location")) {
            calIntent.putExtra("eventLocation", jsonFilter.optString("location"));
          }
          String description = null;
          if (!jsonFilter.isNull("notes")) {
            description = jsonFilter.optString("notes");
          }
          // there's no separate url field, so adding it to the notes
          if (!argOptionsObject.isNull("url")) {
            if (description == null) {
              description = argOptionsObject.optString("url");
            } else {
              description += " " + argOptionsObject.optString("url");
            }
          }
          calIntent.putExtra("description", description);
          calIntent.putExtra("calendar_id", argOptionsObject.optInt("calendarId", 1));

          Calendar.this.cordova.startActivityForResult(Calendar.this, calIntent, RESULT_CODE_CREATE);
        }
      });
    } catch (JSONException e) {
      System.err.println("Exception: " + e.getMessage());
      callback.error(e.getMessage());
    }
  }

  private AbstractCalendarAccessor calendarAccessor;

  private AbstractCalendarAccessor getCalendarAccessor() {
    if (this.calendarAccessor == null) {
      // Note: currently LegacyCalendarAccessor is never used, see the TO-DO at the top of this class
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.ICE_CREAM_SANDWICH) {
        Log.d(LOG_TAG, "Initializing calendar plugin");
        this.calendarAccessor = new CalendarProviderAccessor(this.cordova);
      } else {
        Log.d(LOG_TAG, "Initializing legacy calendar plugin");
        this.calendarAccessor = new LegacyCalendarAccessor(this.cordova);
      }
    }
    return this.calendarAccessor;
  }

  private void deleteEvent(JSONArray args) {
    if (args.length() == 0) {
      System.err.println("Exception: No Arguments passed");
      return;
    }

    // note that if the dev didn't call requestWritePermission before calling this method and calendarPermissionGranted returns false,
    // the app will ask permission and this method needs to be invoked again (done for backward compat).
    if (!calendarPermissionGranted(Manifest.permission.WRITE_CALENDAR)) {
      requestWritePermission();
      this.callback.error("Please allow Write access to the Calendar and try again.");
      return;
    }

    try {
      final JSONObject jsonFilter = args.getJSONObject(0);

      cordova.getThreadPool().execute(new Runnable() {
        @Override
        public void run() {

          boolean deleteResult = getCalendarAccessor().deleteEvent(
              null,
              jsonFilter.optLong("startTime"),
              jsonFilter.optLong("endTime"),
              getPossibleNullString("title", jsonFilter),
              getPossibleNullString("location", jsonFilter));
          PluginResult res = new PluginResult(PluginResult.Status.OK, deleteResult);
          res.setKeepCallback(true);
          callback.sendPluginResult(res);
        }
      });
    } catch (JSONException e) {
      System.err.println("Exception: " + e.getMessage());
      callback.error(e.getMessage());
    }
  }

  /*
    Add by phuongnh@vinasource.com
    Implement function deleteEventById for parent planet app can delete any event with event id
  */
  private void deleteEventById(JSONArray args) {
      if (args.length() == 0) {
          System.err.println("Exception: No Arguments passed");
          return;
      }

      // note that if the dev didn't call requestWritePermission before calling this method and calendarPermissionGranted returns false,
      // the app will ask permission and this method needs to be invoked again (done for backward compat).
      if (!calendarPermissionGranted(Manifest.permission.WRITE_CALENDAR)) {
          requestWritePermission();
          this.callback.error("Please allow Write access to the Calendar and try again.");
          return;
      }

      mainActivity = (MainActivity) cordova.getActivity();
      while (mainActivity.getSelectedAccountName() == null) {
          Log.i("Parent Planent: ", "getSelectedAccountName not select");
          try {
              Thread.sleep(5000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
      }

      try {
          final JSONObject jsonFilter = args.getJSONObject(0);

          cordova.getThreadPool().execute(new Runnable() {
              @Override
              public void run() {
                getCalendarAccessor().deleteEventById(jsonFilter.optString("id"), callback);
              }
          });
      } catch (JSONException e) {
          System.err.println("Exception: " + e.getMessage());
          callback.error(e.getMessage());
      }
  }

  private void modifyRepeatEventInstance(JSONArray args) {
      if (args.length() == 0) {
          System.err.println("Exception: No Arguments passed");
          return;
      }

      // note that if the dev didn't call requestWritePermission before calling this method and calendarPermissionGranted returns false,
      // the app will ask permission and this method needs to be invoked again (done for backward compat).
      if (!calendarPermissionGranted(Manifest.permission.WRITE_CALENDAR)) {
          requestWritePermission();
          this.callback.error("Please allow Write access to the Calendar and try again.");
          return;
      }

      mainActivity = (MainActivity) cordova.getActivity();
      while (mainActivity.getSelectedAccountName() == null) {
          Log.i("Parent Planent: ", "getSelectedAccountName not select");
          try {
              Thread.sleep(5000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
      }

      try {
        final JSONObject jsonFilter = args.getJSONObject(0);

        cordova.getThreadPool().execute(new Runnable() {
          @Override
          public void run() {
            getCalendarAccessor().modifyEventRepeatInstance(jsonFilter, callback);
//            boolean modifyResult = getCalendarAccessor().modifyEventRepeatInstance(jsonFilter);
//            PluginResult res = new PluginResult(PluginResult.Status.OK, modifyResult);
//            res.setKeepCallback(true);
//            callback.sendPluginResult(res);
          }
        });
      } catch (JSONException e) {
        System.err.println("Exception: " + e.getMessage());
        callback.error((e.getMessage()));
      }

  }

  private void findEvents(JSONArray args) {
    if (args.length() == 0) {
      System.err.println("Exception: No Arguments passed");
      return;
    }

    // note that if the dev didn't call requestReadPermission before calling this method and calendarPermissionGranted returns false,
    // the app will ask permission and this method needs to be invoked again (done for backward compat).
    if (!calendarPermissionGranted(Manifest.permission.READ_CALENDAR)) {
      requestReadPermission();
      this.callback.error("Please allow Read access to the Calendar and try again.");
      return;
    }

    mainActivity = (MainActivity) cordova.getActivity();
    while (mainActivity.getSelectedAccountName() == null) {
      Log.i("Parent Planent: ", "getSelectedAccountName not select");
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    try {
      final JSONObject jsonFilter = args.getJSONObject(0);

      cordova.getThreadPool().execute(new Runnable() {
        @Override
        public void run() {
           getCalendarAccessor().findEventFromGoogleCalendar(
                    "ID#" + getPossibleNullString("notes", jsonFilter),
                    jsonFilter.optLong("startTime"),
                    jsonFilter.optLong("endTime"), callback);
        }
      });
    } catch (JSONException e) {
      System.err.println("Exception: " + e.getMessage());
      callback.error(e.getMessage());
    }
  }

  private static String convertStringToDate(Long dateString) {
        Date date=new Date(dateString);

        SimpleDateFormat df2 = new SimpleDateFormat("dd/MM/yy kk:mm");
        String dateText = df2.format(date);

        return dateText;
  }

  private void createEvent(JSONArray args) {
    // note that if the dev didn't call requestWritePermission before calling this method and calendarPermissionGranted returns false,
    // the app will ask permission and this method needs to be invoked again (done for backward compat).
    if (!calendarPermissionGranted(Manifest.permission.WRITE_CALENDAR)) {
      requestWritePermission();
      this.callback.error("Please allow Write access to the Calendar and try again.");
      return;
    }

      mainActivity = (MainActivity) cordova.getActivity();
      while (mainActivity.getSelectedAccountName() == null) {
          Log.i("Parent Planent: ", "getSelectedAccountName not select");
          try {
              Thread.sleep(5000);
          } catch (InterruptedException e) {
              e.printStackTrace();
          }
      }

    try {
      final JSONObject argObject = args.getJSONObject(0);
      final JSONObject argOptionsObject = argObject.getJSONObject("options");

      Log.i("Parent Planet: ", "options: " + args.toString());

      cordova.getThreadPool().execute(new Runnable() {
        @Override
        public void run() {
          try {
            getCalendarAccessor().createEventFromGoogleCalendar(
                null,
                getPossibleNullString("title", argObject),
                argObject.getLong("startTime"),
                argObject.getLong("endTime"),
                getPossibleNullString("notes", argObject),
                getPossibleNullString("location", argObject),
                argOptionsObject.optLong("firstReminderMinutes"),
                argOptionsObject.optLong("secondReminderMinutes"),
                getPossibleNullString("recurrence", argOptionsObject),
                argOptionsObject.optInt("recurrenceInterval"),
                argOptionsObject.optLong("recurrenceEndTime"),
                argOptionsObject.optInt("calendarId", 1),
                getPossibleNullString("url", argOptionsObject), callback);
          } catch (JSONException e) {
            e.printStackTrace();
            callback.error(e.getMessage());
          }
        }
      });
    } catch (Exception e) {
      Log.e(LOG_TAG, "Error creating event. Invoking error callback.", e);
      callback.error(e.getMessage());
    }
  }

  private static String getPossibleNullString(String param, JSONObject from) {
    return from.isNull(param) || "null".equals(from.optString(param)) ? null : from.optString(param);
  }

  private void listEventsInRange(JSONArray args) {
    // note that if the dev didn't call requestReadPermission before calling this method and calendarPermissionGranted returns false,
    // the app will ask permission and this method needs to be invoked again (done for backward compat).
    if (!calendarPermissionGranted(Manifest.permission.READ_CALENDAR)) {
      requestReadPermission();
      this.callback.error("Please allow Read access to the Calendar and try again.");
      return;
    }
    try {
    final JSONObject jsonFilter = args.getJSONObject(0);
      JSONArray result = new JSONArray();
      long input_start_date = jsonFilter.optLong("startTime");
      long input_end_date = jsonFilter.optLong("endTime");

      final Uri l_eventUri;
      if (Build.VERSION.SDK_INT >= 8) {
        l_eventUri = Uri.parse("content://com.android.calendar/instances/when/" + String.valueOf(input_start_date) + "/" + String.valueOf(input_end_date));
      } else {
        l_eventUri = Uri.parse("content://calendar/instances/when/" + String.valueOf(input_start_date) + "/" + String.valueOf(input_end_date));
      }

      cordova.getThreadPool().execute(new Runnable() {
        @Override
        public void run() {
          ContentResolver contentResolver = Calendar.this.cordova.getActivity().getContentResolver();

          JSONArray result = new JSONArray();
          long input_start_date = jsonFilter.optLong("startTime");
          long input_end_date = jsonFilter.optLong("endTime");

          //prepare start date
          java.util.Calendar calendar_start = java.util.Calendar.getInstance();
          Date date_start = new Date(input_start_date);
          calendar_start.setTime(date_start);

          //prepare end date
          java.util.Calendar calendar_end = java.util.Calendar.getInstance();
          Date date_end = new Date(input_end_date);
          calendar_end.setTime(date_end);

          //projection of DB columns
          String[] l_projection = new String[]{"calendar_id", "title", "begin", "end", "eventLocation", "allDay"};

          //actual query
          Cursor cursor = contentResolver.query(
              l_eventUri,
              l_projection,
              "(deleted = 0 AND" +
                  "   (" +
                  // all day events are stored in UTC, others in the user's timezone
                  "     (eventTimezone  = 'UTC' AND begin >=" + (calendar_start.getTimeInMillis() + TimeZone.getDefault().getOffset(calendar_start.getTimeInMillis())) + " AND end <=" + (calendar_end.getTimeInMillis() + TimeZone.getDefault().getOffset(calendar_end.getTimeInMillis())) + ")" +
                  "     OR " +
                  "     (eventTimezone <> 'UTC' AND begin >=" + calendar_start.getTimeInMillis() + " AND end <=" + calendar_end.getTimeInMillis() + ")" +
                  "   )" +
                  ")",
              null,
              "begin ASC");

          int i = 0;
          while (cursor.moveToNext()) {
            try {
              result.put(
                  i++,
                  new JSONObject()
                      .put("calendar_id", cursor.getString(cursor.getColumnIndex("calendar_id")))
                      .put("title", cursor.getString(cursor.getColumnIndex("title")))
                      .put("dtstart", cursor.getLong(cursor.getColumnIndex("begin")))
                      .put("dtend", cursor.getLong(cursor.getColumnIndex("end")))
                      .put("eventLocation", cursor.getString(cursor.getColumnIndex("eventLocation")) != null ? cursor.getString(cursor.getColumnIndex("eventLocation")) : "")
                      .put("allDay", cursor.getInt(cursor.getColumnIndex("allDay")))
              );
            } catch (JSONException e) {
              e.printStackTrace();
            }
          }
          cursor.close();

          PluginResult res = new PluginResult(PluginResult.Status.OK, result);
          callback.sendPluginResult(res);
        }
      });
    } catch (JSONException e) {
      System.err.println("Exception: " + e.getMessage());
      callback.error(e.getMessage());
    }
  }

  public void onActivityResult(int requestCode, int resultCode, Intent data) {
      if (requestCode == RESULT_CODE_CREATE) {
          if (resultCode == Activity.RESULT_OK || resultCode == Activity.RESULT_CANCELED) {
              // resultCode may be 0 (RESULT_CANCELED) even when it was created, so passing nothing is the clearest option here
              Log.d(LOG_TAG, "onActivityResult resultcode: " + resultCode);
              callback.success();
          } else {
              // odd case
              Log.d(LOG_TAG, "onActivityResult weird resultcode: " + resultCode);
              callback.success();
          }
      } else if (requestCode == RESULT_CODE_OPENCAL) {
          Log.d(LOG_TAG, "onActivityResult requestCode: " + RESULT_CODE_OPENCAL);
          callback.success();
      } else {
          Log.d(LOG_TAG, "onActivityResult error, resultcode: " + resultCode);
          callback.error("Unable to add event (" + resultCode + ").");
      }
  }
}
