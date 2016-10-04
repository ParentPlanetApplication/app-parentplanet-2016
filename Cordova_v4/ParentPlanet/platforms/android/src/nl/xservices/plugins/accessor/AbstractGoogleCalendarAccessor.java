package nl.xservices.plugins.accessor;

import android.accounts.AccountManager;
import android.app.Activity;
import android.app.Dialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.AsyncTask;
import android.util.Log;
import android.widget.Toast;

import com.google.android.gms.auth.GoogleAuthException;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.api.client.extensions.android.http.AndroidHttp;
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential;
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAuthIOException;
import com.google.api.client.googleapis.extensions.android.gms.auth.GooglePlayServicesAvailabilityIOException;
import com.google.api.client.googleapis.extensions.android.gms.auth.UserRecoverableAuthIOException;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.DateTime;
import com.google.api.client.util.Strings;
import com.google.api.services.calendar.CalendarScopes;
import com.google.api.services.calendar.model.Event;
import com.google.api.services.calendar.model.EventDateTime;
import com.google.api.services.calendar.model.EventReminder;
import com.ppllc.p2.MainActivity;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.ExecutionException;

/**
 * Created by phuongngo on 6/8/16.
 */
public abstract class AbstractGoogleCalendarAccessor extends CordovaPlugin {
    public static final String PREF_ACCOUNT_NAME = "primary";

    private static final String PRODUCT_NAME = "Google-CalendarAndroid";
    private static final String[] SCOPES = { CalendarScopes.CALENDAR };

    private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
    private final HttpTransport HTTP_TRANSPORT = AndroidHttp.newCompatibleTransport();

    static final int REQUEST_ACCOUNT_PICKER = 1000;
    static final int DELETE_EVENT_ID = 1004;
    static final int MODIFY_EVENT_REPEAT = 1005;
    static final int REQUEST_AUTHORIZATION = 1001;
    static final int REQUEST_GOOGLE_PLAY_SERVICES = 1002;
    static final int REQUEST_PERMISSION_GET_ACCOUNTS = 1003;
    static final int REQUEST_ACCOUNT_FOR_MODIFY = 1006;
    static final int REQUEST_ACCOUNT_FOR_CREATE = 1007;
    static final int REQUEST_ACCOUNT_FOR_DELETE = 1008;
    static final int REQUEST_ACCOUNT_FOR_FIND = 1009;
    static final int REQUEST_AUTHORIZATION_AND_CREATE = 1010;
    static final int REQUEST_AUTHORIZATION_AND_MODIFY = 1011;
    static final int REQUEST_AUTHORIZATION_AND_DELETE = 1012;
    static final int REQUEST_AUTHORIZATION_AND_FIND = 1013;

    private static String KEY_EVENT_HASH = "EventsCreateOnDay_";

    private static  GoogleAccountCredential mCredential = null;
    private JSONObject _args = null;
    private com.google.api.services.calendar.Calendar mService = null;

    private static AuthorizationCheckTask mAuthTask;
    private static InsertEventTask mInsertTask;
    private static ModifyEventTask mModifyTask;
    private static DeleteEventTask mDeleteTask;
    private static FindEventTask  mFindTask;
    private static CallbackContext mCallbackDeleteContext, mCallbackFindContext, mCallbackModifyContext, mCallbackInsertContext;
    private static ProgressDialog mDialogFind, mDialogDelete, mDialogModify, mDialogInsert;

    protected abstract String getPrimaryAccount();
    protected abstract Boolean isGooglePlayServicesAvailable();
    protected abstract Boolean isDeviceOnline();
    protected abstract void saveAccountSelected(String accountSelected);
    protected abstract String getAccountSelected();

    protected CordovaInterface cordova;

    public AbstractGoogleCalendarAccessor(CordovaInterface cordova) {
        this.cordova = cordova;
    }

    public void findEvent(JSONObject args, CallbackContext callbackContext) {
        if (mDialogFind != null) {
            mDialogFind.dismiss();
        }

        mCallbackFindContext = callbackContext;

        _args = args;

        mCredential = registerGoogleCalender("findEvent");

        if (! isGooglePlayServicesAvailable()) {
            acquireGooglePlayServices();
            return;
        }

        if (!isDeviceOnline()) {
//            Log.i("Parent Planet: ", "Device is offline");
            return;
        }

        if(mCredential.getSelectedAccountName() == null) {
            requireSelectAccount(REQUEST_ACCOUNT_FOR_FIND);
            return;
        }

        Log.i("Parent Planet: ", "findEvent -> begin find event with account  " + mCredential.getSelectedAccountName());

        beginFindEvent(args);
    }

    public void insertEvent(JSONObject args, CallbackContext callbackContext) {
        if(mDialogInsert != null) {
            mDialogInsert.dismiss();
        }
        mCallbackInsertContext = callbackContext;

        _args = args;

        mCredential = registerGoogleCalender("insertEvent");

        if (!isGooglePlayServicesAvailable()) {
            acquireGooglePlayServices();
            return;
        }

        if (!isDeviceOnline()) {
            Log.i("Parent Planet: ", "Device is offline");
            return;
        }

        Log.i("Parent Planet: ", "selectedAccountName = " + mCredential.getSelectedAccountName());

        if(mCredential.getSelectedAccountName() == null) {
            requireSelectAccount(REQUEST_ACCOUNT_FOR_CREATE);
            return;
        }

        beginInsertEvent(args);
    }

    public void modifyEvent(JSONObject args, CallbackContext callbackContext) {
        if(mDialogModify != null) {
            mDialogModify.dismiss();
        }

        mCallbackModifyContext = callbackContext;

        _args = args;

        mCredential = registerGoogleCalender("modifyEvent");

        Log.i("Parent Planet: ", "selectedAccountName = " + mCredential.getSelectedAccountName());

        if (! isGooglePlayServicesAvailable()) {
            acquireGooglePlayServices();
            return;
        }

        if (!isDeviceOnline()) {
            Log.i("Parent Planet: ", "Device is offline");
            return;
        }

        if(mCredential.getSelectedAccountName() == null) {
            requireSelectAccount(REQUEST_ACCOUNT_FOR_MODIFY);
            return;
        }

        beginModifyEvent(args);
    }

    public void deleteEvent(JSONObject args, CallbackContext callbackContext) {
        mCallbackDeleteContext = callbackContext;

        _args = args;

        mCredential = registerGoogleCalender("deleteEvent");

        Log.i("Parent Planet: ", "selectedAccountName = " + mCredential.getSelectedAccountName());

        if (! isGooglePlayServicesAvailable()) {
            acquireGooglePlayServices();
            return;
        }

        if (!isDeviceOnline()) {
            Log.i("Parent Planet: ", "Device is offline");
            return;
        }

        if(mCredential.getSelectedAccountName() == null) {
            requireSelectAccount(REQUEST_ACCOUNT_FOR_MODIFY);
            return;
        }

         beginDeleteEvent(args);
    }

    private boolean beginDeleteEvent(final JSONObject args) {
        boolean deleteStatus = false;
        try {
            deleteStatus = new DeleteEventTask(this.cordova.getActivity(), mService, args, new DeleteEventTask.DeleteEventCallback() {
                @Override
                public void onSuccess(Boolean result) {
                    Log.i("Parent Planet: ", "Result delete event: " + result);
                    Log.i("Parent Planet: ", args.toString());
                    PluginResult res = new PluginResult(PluginResult.Status.OK, result);
                    res.setKeepCallback(true);
                    mCallbackDeleteContext.sendPluginResult(res);
                }

                @Override
                public void onFailure(Intent intent) {
                    if (intent != null) {
                        requirePermissionUseAPI(intent, REQUEST_AUTHORIZATION_AND_DELETE);
                    }
                }
            }).execute().get();
        } catch (InterruptedException e) {
            Log.i("Parent Planet - Er1", "error");
            e.printStackTrace();
        } catch (ExecutionException e) {
            Log.i("Parent Planet - Er2", "error");
            e.printStackTrace();
        }
        return deleteStatus;
    }

    private void beginFindEvent(JSONObject args) {
        new FindEventTask(this.cordova.getActivity(), mService, args, new FindEventTask.FindEventCallback() {
            @Override
            public void onSuccess(JSONArray events) {
                Log.i("Parent Planet: ", "found event: " + events.toString());
                PluginResult res = new PluginResult(PluginResult.Status.OK, events);
                res.setKeepCallback(true);
                mCallbackFindContext.sendPluginResult(res);
            }

            @Override
            public void onFailure(Intent intent) {
                if (intent != null) {
                    requirePermissionUseAPI(intent, REQUEST_AUTHORIZATION_AND_FIND);
                }
            }
        }).execute();
    }

    private void beginModifyEvent(JSONObject args) {
        new ModifyEventTask(this.cordova.getActivity(), mService, args, new ModifyEventTask.ModifyEventCallback() {
            @Override
            public void onSuccess(Boolean result) {
                PluginResult res = new PluginResult(PluginResult.Status.OK, result);
                res.setKeepCallback(true);
                mCallbackModifyContext.sendPluginResult(res);
            }

            @Override
            public void onFailure(Intent intent) {
                Log.i("Parent Planet: ", "onFailure");
                if (intent != null) {
                    requirePermissionUseAPI(intent, REQUEST_AUTHORIZATION_AND_MODIFY);
                }
            }
        }).execute();
    }

    private void beginInsertEvent(JSONObject args) {
        new InsertEventTask(this.cordova.getActivity(), mService, args, new InsertEventTask.InsertEventCallback() {
            @Override
            public void onSuccess(com.google.api.services.calendar.model.Event event) {
                Log.i("Parent Planet: ", event == null ? "null" : event.getId());
//                mCallbackInsertContext.success(event == null ? null : event.getId());
                PluginResult res = new PluginResult(PluginResult.Status.OK, event == null ? null : event.getId());
                res.setKeepCallback(true);
                mCallbackFindContext.sendPluginResult(res);
            }

            @Override
            public void onFailure(Intent intent) {
                if (intent != null) {
                    requirePermissionUseAPI(intent, REQUEST_AUTHORIZATION_AND_CREATE);
                }
            }
        }).execute();
    }

    private void acquireGooglePlayServices() {
        GoogleApiAvailability apiAvailability =
                GoogleApiAvailability.getInstance();
        final int connectionStatusCode =
                apiAvailability.isGooglePlayServicesAvailable(this.cordova.getActivity().getApplicationContext());
        Log.i("Parent Planet: ", "connectionStatusCode = " + connectionStatusCode);
        Log.i("Parent Planet: ", "isUserResolvableError = " + apiAvailability.isUserResolvableError(connectionStatusCode));
        if (apiAvailability.isUserResolvableError(connectionStatusCode)) {
            showGooglePlayServicesAvailabilityErrorDialog(apiAvailability, connectionStatusCode);
        } else {
            Toast.makeText(this.cordova.getActivity(), "This device is not supported.", Toast.LENGTH_LONG).show();
            return;
        }
    }

    void showGooglePlayServicesAvailabilityErrorDialog(final GoogleApiAvailability apiAvailability,
                                                       final int connectionStatusCode) {
        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Log.i("Parent Planet: ", apiAvailability.getErrorString(connectionStatusCode));
                Dialog dialog = apiAvailability.getErrorDialog(cordova.getActivity(), connectionStatusCode, REQUEST_GOOGLE_PLAY_SERVICES);
                dialog.show();
            }
        });
    }

    private static String convertStringToDate(Long dateString) {
        Date date=new Date(dateString);

        SimpleDateFormat df2 = new SimpleDateFormat("dd/MM/yy kk:mm");
        String dateText = df2.format(date);

        return dateText;
    }

    private void createServiceGoogleCalendar() {
//        if (mService == null) {
        Log.i("Parent Planet: ", "createServiceGoogleCalendar -> account selected = " + mCredential.getSelectedAccountName());
            mService = new com.google.api.services.calendar.Calendar.Builder(
                    HTTP_TRANSPORT, JSON_FACTORY, mCredential)
                    .setApplicationName(PRODUCT_NAME)
                    .build();
//        }
    }

    private void requireSelectAccount(int requestCode) {
        this.cordova.startActivityForResult(AbstractGoogleCalendarAccessor.this, mCredential.newChooseAccountIntent(), requestCode);
    }

    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_ACCOUNT_FOR_CREATE || requestCode == REQUEST_ACCOUNT_FOR_MODIFY || requestCode == REQUEST_ACCOUNT_FOR_DELETE || requestCode == REQUEST_ACCOUNT_FOR_FIND) {
            if (resultCode == Activity.RESULT_OK && data != null &&
                    data.getExtras() != null) {
                String accountName =
                        data.getStringExtra(AccountManager.KEY_ACCOUNT_NAME);
                Log.i("Parent Planet: ", "1.onActivityResult - accountName = " + accountName);
                Log.i("Parent Planet: ", "1.onActivityResult - selectAccount = " + mCredential.getSelectedAccountName());
                if (accountName != null) {
                    saveAccountSelected(accountName);
                    mCredential.setSelectedAccountName(accountName);

                    Log.i("Parent Planet: ", "2.onActivityResult - accountName = " + accountName);
                    Log.i("Parent Planet: ", "2.onActivityResult - selectAccount = " + mCredential.getSelectedAccountName());

                    switch (requestCode) {
                        case REQUEST_ACCOUNT_FOR_CREATE:
                            beginInsertEvent(_args);
                            break;
                        case REQUEST_ACCOUNT_FOR_MODIFY:
                            beginModifyEvent(_args);
                            break;
                        case REQUEST_ACCOUNT_FOR_DELETE:
                            beginDeleteEvent(_args);
                            break;
                        case REQUEST_ACCOUNT_FOR_FIND:
                            beginFindEvent(_args);
                            break;
                    }
                }
            }
            return;
        }

        if (resultCode == Activity.RESULT_OK) {
            switch (requestCode) {
                case REQUEST_AUTHORIZATION_AND_CREATE:
                    beginInsertEvent(_args);
                    break;
                case REQUEST_AUTHORIZATION_AND_DELETE:
                    beginDeleteEvent(_args);
                    break;
                case REQUEST_AUTHORIZATION_AND_MODIFY:
                    beginModifyEvent(_args);
                    break;
                case REQUEST_AUTHORIZATION_AND_FIND:
                    beginFindEvent(_args);
                    break;
            }
        }
    }

    private void requirePermissionUseAPI(Intent e, int token) {
        this.cordova.startActivityForResult(
                this,
                e,
                token);
    }

    private GoogleAccountCredential registerGoogleCalender(String from) {
        if (mCredential != null) {
            return mCredential;
        }

        String account = getAccountSelected();

        Log.i("Parent Planet: ", "From: " + from + " -> registerGoogleCalender -> GoogleAccountCredential - Account: " + account);

        if (mCredential == null) {
            mCredential = GoogleAccountCredential.usingOAuth2(
                    this.cordova.getActivity().getApplicationContext(),
                    Arrays.asList(SCOPES));
        }

        if (account != null) {
            mCredential.setSelectedAccountName(account);
        }

        createServiceGoogleCalendar();

        return mCredential;
    }

    private static class AuthorizationCheckTask extends AsyncTask<String, Integer, Boolean> {
        Activity mActivity;
        AuthorizationCheckCallback mCallback;

        public AuthorizationCheckTask(Activity activity, AuthorizationCheckCallback callback) {
            this.mActivity = activity;
            this.mCallback = callback;
        }

        @Override
        protected Boolean doInBackground(String... emailAccounts) {
            String emailAccount = emailAccounts[0];
            // Ensure only one task is running at a time.
            mAuthTask = this;

            // Ensure an email was selected.
            if (Strings.isNullOrEmpty(emailAccount)) {
                // Failure.
                return false;
            }

            try {
                // If the application has the appropriate access then a token will be retrieved, otherwise
                // an error will be thrown.
                mCredential = GoogleAccountCredential.usingOAuth2(mActivity,
                        Arrays.asList(AbstractGoogleCalendarAccessor.SCOPES));
                mCredential.setSelectedAccountName(emailAccount);
                String accessToken = mCredential.getToken();
                Log.e("Parent Planet: ", "ACCESS TOKEN" + accessToken);
                // Success.
                return true;
            } catch (GoogleAuthIOException unrecoverableException) {
                // Failure.
                Log.e("Parent Planet: ", "UNRECOVERABLE: " + Log.getStackTraceString(unrecoverableException));
                return false;
            } catch (IOException ioException) {
                // Failure or cancel request.
                Log.e("Parent Planet: ", "IO EXCEPTION: " + Log.getStackTraceString(ioException));
                return false;
            } catch (GoogleAuthException e) {
                e.printStackTrace();
            }

            return false;
        }

        @Override
        protected void onPostExecute(Boolean success) {
            if (success) {
                // Authorization check successful, set internal variable.
                mCallback.onSuccess(mCredential);
            } else {
                // Authorization check unsuccessful.
                mCallback.onFailure();
            }
            mAuthTask = null;
        }

        @Override
        protected void onCancelled() {
            mAuthTask = null;
        }

        public interface AuthorizationCheckCallback {
            void onSuccess(GoogleAccountCredential credential);

            void onFailure();
        }
    }

    private static class FindEventTask extends AsyncTask<Void, Integer, Boolean> {
        Activity mActivity;
        FindEventCallback mCallback;
        JSONObject args;
        com.google.api.services.calendar.Calendar mService;
        Intent mIntent;
        JSONArray results;

        public FindEventTask(Activity activity, com.google.api.services.calendar.Calendar service, JSONObject options, FindEventCallback callback) {
            this.mActivity = activity;
            this.mCallback = callback;
            this.mService = service;
            this.args = options;
        }

        @Override
        protected Boolean doInBackground(Void... params) {
            mFindTask = this;
            DateTime oldStartTime = new DateTime(Long.parseLong(args.optString("startDate")));
            com.google.api.services.calendar.model.Events events = null;
            try {
                Log.i("Parent Planet: ", "call google api for calendar");
                events = mService.events().list(PREF_ACCOUNT_NAME)
                        .setTimeMin(oldStartTime)
                        .setOrderBy("startTime")
                        .setSingleEvents(true)
                        .execute();
             } catch (final GooglePlayServicesAvailabilityIOException availabilityException) {
                 Log.i("Parent Planet: ", "GooglePlayServicesAvailabilityIOException -> " + availabilityException.getMessage());
                 mIntent = null;
                 return false;
             } catch (UserRecoverableAuthIOException e) {
                 Log.i("Parent Planet: ", "Google Calendar API require permission");
                 mIntent = e.getIntent();
                 return false;
            } catch (IOException e) {
                e.printStackTrace();
                mIntent = null;
                return false;
            }

            Log.i("Parent Planet: ", "begin get items from events fetched");
            List<com.google.api.services.calendar.model.Event> items = events.getItems();

            Log.i("Parent Planet: ", "Items count: " + items.size());

            results = new JSONArray();
            JSONObject hash = new JSONObject();

            for (com.google.api.services.calendar.model.Event event : items) {
                if(isMatchCondition(event, args)) {
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

            return true;
        }

        private boolean isMatchCondition(com.google.api.services.calendar.model.Event event, JSONObject args) {
            event.getCreated().getValue();
            return (
                    (event.getStart().getDateTime().getValue() >= Long.parseLong(args.optString("startDate")))
                    &&
                            event.getDescription().toLowerCase().equals(args.optString("notes").toLowerCase())
                    &&
                            event.getCreated().getValue() < System.currentTimeMillis()
            );
        }

        @Override
        protected void onPreExecute() {
//            super.onPreExecute();
            mActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mDialogFind = new ProgressDialog(mActivity);
                    mDialogFind.setMessage("Finding event ....");
                    mDialogFind.show();
                }
            });
        }

        @Override
        protected void onPostExecute(Boolean r) {
            mDialogFind.dismiss();
            mFindTask = null;
            if (mIntent == null) {
                mCallback.onSuccess(results);
            } else {
                mCallback.onFailure(mIntent);
            }
        }

        @Override
        protected void onCancelled() {
            mDialogFind.dismiss();
            mFindTask = null;
        }

        public interface FindEventCallback {
            void onSuccess(JSONArray events);
            void onFailure(Intent intent);
        }
    }

    private static class InsertEventTask extends AsyncTask<Void, Integer, Boolean> {
        Activity mActivity;
        InsertEventCallback mCallback;
        JSONObject args;
        com.google.api.services.calendar.model.Event mEvent;
        com.google.api.services.calendar.Calendar mService;
        Intent mIntent;

        public InsertEventTask(Activity activity, com.google.api.services.calendar.Calendar service, JSONObject options, InsertEventCallback callback) {
            this.mActivity = activity;
            this.mCallback = callback;
            this.mService = service;
            this.args = options;
        }

        @Override
        protected Boolean doInBackground(Void... params) {
            mInsertTask = this;

            mEvent = new com.google.api.services.calendar.model.Event();
            Log.i("Parent Planet: ", "args: " + args.toString());
            Log.i("Parent Planet: ", "1. generate event info");
            mEvent.setSummary(args.optString("title"));
            mEvent.setLocation(args.optString("location"));
            mEvent.setDescription(args.optString("notes").trim());

            Date oneHourFromNow = new Date(Long.parseLong(args.optString("startTime")));
            Date twoHoursFromNow = new Date(Long.parseLong(args.optString("endTime")));
            DateTime start = new DateTime(oneHourFromNow, TimeZone.getTimeZone("UTC"));
            DateTime end = new DateTime(twoHoursFromNow, TimeZone.getTimeZone("UTC"));

            Log.i("Parent Planet: ", "start: " + args.optString("startTime") + " " + start.toStringRfc3339());
            Log.i("Parent Planet: ", "end  : " + args.optString("endTime") + " " + end.toStringRfc3339());

            DateTime startTime = new DateTime(Long.parseLong(args.optString("startTime")));
            DateTime endTime = new DateTime(Long.parseLong(args.optString("endTime")));

            mEvent.setStart(
                    new EventDateTime()
                            .setDateTime(startTime)
                            .setTimeZone(
                                    TimeZone.getDefault().getID()
                            )
            );

            mEvent.setEnd(
                    new EventDateTime()
                            .setDateTime(endTime)
                            .setTimeZone(
                                    TimeZone.getDefault().getID()
                            )
            );

            Log.i("Parent Planet: ", "2. generate reminder");
            Integer firstReminderMinutes = args.optInt("firstReminderMinutes");
            Integer secondReminderMinutes= args.optInt("secondReminderMinutes");
            Log.i("Parent Planet: ", "first: " + firstReminderMinutes);
            Log.i("Parent Planet: ", "second: " + secondReminderMinutes);
            Log.i("Parent Planet: ", "Summary: " + mEvent.getSummary());
            Log.i("Parent Planet: ", "Location: " + mEvent.getLocation());
            Log.i("Parent Planet: ", "Description: " + mEvent.getDescription());
            Log.i("Parent Planet: ", "Start: " + convertStringToDate(mEvent.getStart().getDateTime().getValue()));
            Log.i("Parent Planet: ", "End: " + convertStringToDate(mEvent.getEnd().getDateTime().getValue()));
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
                Log.i("Parent Planet: ", "InsertEventTask -> recurrenceEndTime: " + args.optString("recurrenceEndTime") + " " + convertStringToDate(Long.parseLong(args.optString("recurrenceEndTime"))));
                com.google.api.services.calendar.model.Event.Reminders reminders = new com.google.api.services.calendar.model.Event.Reminders();

                Log.i("Parent Planet: ", "result: " + reminders.getOverrides());
                Log.i("Parent Planet: ", "list: " + listEventReminder);
                reminders.setUseDefault(false).setOverrides(listEventReminder);
                mEvent.setReminders(reminders);
            }

            Log.i("Parent Planet: ", "recurrence == " + args.optString("recurrence") + " == " + (args.optString("recurrence") != null));
            if (args.optString("recurrence") != "") {
                Log.i("Parent Planet: ", "RRULE: " + args.optString("RRULE"));
                mEvent.setRecurrence(Arrays.asList("RRULE:" + args.optString("RRULE")));
            }

            com.google.api.services.calendar.model.Event createdEvent = null;

            Log.i("Parent Planet: ", "3. insert event");
            Log.i("Parent Planet: ", "4." + mService);
            try {
                createdEvent = mService.events().insert(PREF_ACCOUNT_NAME, mEvent).execute();
                Log.i("Parent Planet: ", "Created event id: " + createdEvent.getId());
                Log.i("Parent Planet: ", args.toString());
                mEvent = createdEvent;
                return true;
             } catch (UserRecoverableAuthIOException e) {
                 Log.i("Parent Planet: ", "Google Calendar API require permission");
                 mIntent = e.getIntent();
                 return false;
            } catch (IOException e) {
                Log.i("Parent Planet: ", "Error while try create event: " + e.getMessage());
                Log.i("Parent Planet: ", mService.getApplicationName());
                Log.i("Parent Planet: ", mService.getRootUrl());
                Log.i("Parent Planet: ", mService.getServicePath());
                mIntent = null;
                mEvent = null;
                return false;
            }
        }

        @Override
        protected void onPreExecute() {
//            super.onPreExecute();
            mActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mDialogInsert = new ProgressDialog(mActivity);
                    mDialogInsert.setMessage("Inserting event ....");
                    mDialogInsert.show();
                }
            });
        }

        @Override
        protected void onPostExecute(Boolean res) {
            mDialogInsert.dismiss();
            mInsertTask = null;
            if (mIntent != null) {
                // Authorization check successful, set internal variable.
                mCallback.onSuccess(mEvent);
            } else {
                // Authorization check unsuccessful.
                mCallback.onFailure(mIntent);
            }
        }

        @Override
        protected void onCancelled() {
            mDialogInsert.dismiss();
            mInsertTask = null;
        }

        public interface InsertEventCallback {
            void onSuccess(com.google.api.services.calendar.model.Event event);
            void onFailure(Intent intent);
        }
    }

    private static class DeleteEventTask extends AsyncTask<Void, Integer, Boolean> {
        Activity mActivity;
        DeleteEventCallback mCallback;
        JSONObject args;
        com.google.api.services.calendar.model.Event event;
        com.google.api.services.calendar.Calendar mService;
        Intent mIntent;

        public DeleteEventTask(Activity activity, com.google.api.services.calendar.Calendar service, JSONObject options, DeleteEventCallback callback) {
            this.mActivity = activity;
            this.mCallback = callback;
            this.mService = service;
            this.args = options;
        }

        @Override
        protected Boolean doInBackground(Void... params) {
            mDeleteTask = this;

            try {
                Log.i("Parent Planet: ", "DeleteEventTask -> delete event with id " + args.optString("eventId"));
                mService.events().delete(PREF_ACCOUNT_NAME, args.optString("eventId")).execute();
                return true;
             } catch (UserRecoverableAuthIOException e) {
                 Log.i("Parent Planet: ", "Google Calendar API require permission");
                 mIntent = e.getIntent();
                 return false;
            } catch (IOException e) {
                Log.i("Parent Planet: ", "error with IOException");
                e.printStackTrace();
                mIntent = null;
                return false;
            }
        }

        @Override
        protected void onPreExecute() {
//            super.onPreExecute();
        }

        @Override
        protected void onPostExecute(Boolean success) {
            Log.i("Parent Planet: ", "deleteEventTask -> onPostExecute");
            Log.i("Parent Planet: ", args.toString());
            mDeleteTask = null;
            if (success) {
                // Authorization check successful, set internal variable.
                mCallback.onSuccess(true);
            } else {
                // Authorization check unsuccessful.
                if(mIntent != null) {
                    mCallback.onFailure(mIntent);
                } else {
                    mCallback.onSuccess(false);
                }
            }
        }

        @Override
        protected void onCancelled() {
            mDeleteTask = null;
        }

        public interface DeleteEventCallback {
            void onSuccess(Boolean result);
            void onFailure(Intent intent);
        }
    }

    private static class ModifyEventTask extends AsyncTask<Void, Integer, Boolean> {
        Activity mActivity;
        ModifyEventCallback mCallback;
        JSONObject args;
        com.google.api.services.calendar.model.Event event;
        com.google.api.services.calendar.Calendar mService;
        Intent mIntent;

        public ModifyEventTask(Activity activity, com.google.api.services.calendar.Calendar service, JSONObject options, ModifyEventCallback callback) {
            this.mActivity = activity;
            this.mCallback = callback;
            this.mService = service;
            this.args = options;
        }

        @Override
        protected Boolean doInBackground(Void... params) {
            mModifyTask = this;

            DateTime oldStartTime = new DateTime(Long.parseLong(args.optString("oldStartTime")));
            com.google.api.services.calendar.model.Events events = null;
            try {
                events = mService.events().list(PREF_ACCOUNT_NAME)
                        .setTimeMin(oldStartTime)
                        .setOrderBy("startTime")
                        .setSingleEvents(true)
                        .execute();
             } catch (UserRecoverableAuthIOException e) {
                 Log.i("Parent Planet: ", "Google Calendar API require permission");
                 mIntent = e.getIntent();
                 return false;
            } catch (IOException e) {
                e.printStackTrace();
                mIntent = null;
                return false;
            }

            List<com.google.api.services.calendar.model.Event> items = events.getItems();

            Log.i("Parent Planet: ", "Items count: " + items.size());
            for (com.google.api.services.calendar.model.Event event : items) {
                if(isMatchCondition(event, args)) {
                    DateTime start = event.getStart().getDateTime();
                    if (start == null) {
                        start = event.getStart().getDate();
                    }
                    Log.i("Parent Planet: ",
                            String.format("%s - %s - %s - (%s)", event.getSummary(), event.getId(), event.getRecurringEventId(), start));
                    Log.i("Parent Planet: ", "Date Start: " + event.getStart().getDateTime().getValue() + " === " + args.optString("oldStartTime"));
                    Log.i("Parent Planet: ", "Date Start: " + convertStringToDate(event.getStart().getDateTime().getValue()) + " === " + convertStringToDate(Long.parseLong(args.optString("oldStartTime"))));
                    Log.i("Parent Planet: ", "Replace Start: " + convertStringToDate(Long.parseLong(args.optString("startTime"))));
                    Log.i("Parent Planet: ", "Replace End: " + convertStringToDate(Long.parseLong(args.optString("endTime"))));
                    Log.i("Parent Planet: ", "Description: " + event.getDescription());
                    Log.i("Parent Planet: ", "Title: " + event.getSummary());
                    try {
                        mService.events().delete(PREF_ACCOUNT_NAME, event.getId()).execute();
                     } catch (UserRecoverableAuthIOException e) {
                         Log.i("Parent Planet: ", "Google Calendar API require permission");
                         mIntent = e.getIntent();
                         return false;
                    } catch (IOException e) {
                        e.printStackTrace();
                        mIntent = null;
                        return false;
                    }

                    Log.i("Parent Planet: ", "-----------------------------------------");
                    Log.i("Parent Planet: ", "Must re-create event");

                    com.google.api.services.calendar.model.Event newEvent = createEvent();
                    return newEvent != null ? true : false;
                }
            }
            return false;
        }

        private com.google.api.services.calendar.model.Event createEvent() {
            event = new com.google.api.services.calendar.model.Event();

            Log.i("Parent Planet: ", "1. generate event info");
            event.setSummary(args.optString("title"));
            event.setLocation(args.optString("location"));
            event.setDescription(args.optString("notes").trim());

            DateTime startTime = new DateTime(Long.parseLong(args.optString("startTime")));
            DateTime endTime = new DateTime(Long.parseLong(args.optString("endTime")));

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
            Integer firstReminderMinutes = args.optInt("firstReminderMinutes");
            Integer secondReminderMinutes= args.optInt("secondReminderMinutes");
            Log.i("Parent Planet: ", "first: " + firstReminderMinutes);
            Log.i("Parent Planet: ", "second: " + secondReminderMinutes);
            Log.i("Parent Planet: ", "Summary: " + event.getSummary());
            Log.i("Parent Planet: ", "Location: " + event.getLocation());
            Log.i("Parent Planet: ", "Description: " + event.getDescription());
            Log.i("Parent Planet: ", "Start: " + convertStringToDate(event.getStart().getDateTime().getValue()));
            Log.i("Parent Planet: ", "End: " + convertStringToDate(event.getEnd().getDateTime().getValue()));
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

                Log.i("Parent Planet: ", "result: " + reminders.getOverrides());
                Log.i("Parent Planet: ", "list: " + listEventReminder);
                reminders.setUseDefault(false).setOverrides(listEventReminder);
                event.setReminders(reminders);
            }

            Log.i("Parent Planet: ", "recurrence == " + args.optString("recurrence") + " == " + (args.optString("recurrence") != null));
            if (args.optString("recurrence") != "") {
                event.setRecurrence(Arrays.asList("RRULE:" + args.optString("RRULE")));
            }

            com.google.api.services.calendar.model.Event createdEvent = null;

            Log.i("Parent Planet: ", "3. insert event");
            Log.i("Parent Planet: ", "4." + mService);
            try {
                createdEvent = mService.events().insert(PREF_ACCOUNT_NAME, event).execute();
                Log.i("Parent Planet: ", "Created event id: " + createdEvent.getId());
                return createdEvent;
             } catch (UserRecoverableAuthIOException e) {
                 Log.i("Parent Planet: ", "Google Calendar API require permission");
                 mIntent = e.getIntent();
                 return null;
            } catch (IOException e) {
                Log.i("Parent Planet: ", "Error while try create event: " + e.getMessage());
                Log.i("Parent Planet: ", mService.getApplicationName());
                Log.i("Parent Planet: ", mService.getRootUrl());
                Log.i("Parent Planet: ", mService.getServicePath());
                Log.i("Parent Planet: ", e.getCause().getMessage());
                mIntent = null;
                return null;
            }
        }

        private boolean isMatchCondition(com.google.api.services.calendar.model.Event event, JSONObject args) {
            return event.getStart().getDateTime().getValue() == Long.parseLong(args.optString("oldStartTime"));
        }

        @Override
        protected void onPreExecute() {
//            super.onPreExecute();
            mActivity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    mDialogModify = new ProgressDialog(mActivity);
                    mDialogModify.setMessage("Modifing event ....");
                    mDialogModify.show();
                }
            });
        }

        @Override
        protected void onPostExecute(Boolean success) {
            mDialogModify.dismiss();
            mModifyTask = null;
            if (success) {
                // Authorization check successful, set internal variable.
                mCallback.onSuccess(true);
            } else {
                // Authorization check unsuccessful.
                if(mIntent != null) {
                    mCallback.onFailure(mIntent);
                } else {
                    mCallback.onSuccess(false);
                }
            }
        }

        @Override
        protected void onCancelled() {
            mDialogModify.dismiss();
            mModifyTask = null;
        }

        public interface ModifyEventCallback {
            void onSuccess(Boolean result);
            void onFailure(Intent intent);
        }
    }
}
