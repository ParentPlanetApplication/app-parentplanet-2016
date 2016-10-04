package nl.xservices.plugins.accessor;

import android.accounts.Account;
import android.accounts.AccountManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.Environment;
import android.util.Log;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

/**
 * Created by phuongngo on 6/8/16.
 */
public class GoogleCalendarProviderAccessor extends AbstractGoogleCalendarAccessor {
    private String KEY_EVENT_HASH = "EventsCreateOnDay_";
    private static String PP_ID = "_id";
    private static String PP_NAME = "name";
    private static String PP_TABLE = "accountSelected";

    public GoogleCalendarProviderAccessor(CordovaInterface cordova) {
        super(cordova);
    }

    @Override
    public void insertEvent(JSONObject args, CallbackContext callbackContext) {
        super.insertEvent(args, callbackContext);
    }

    @Override
    public void modifyEvent(JSONObject args, CallbackContext callbackContext) {
        super.modifyEvent(args, callbackContext);
    }

    @Override
    public void deleteEvent(JSONObject args, CallbackContext callbackContext) {
        super.deleteEvent(args, callbackContext);
    }

    @Override
    public void findEvent(JSONObject args, CallbackContext callbackContext) {
        super.findEvent(args, callbackContext);
    }

    @Override
    protected String getPrimaryAccount() {
        AccountManager manager = AccountManager.get(this.cordova.getActivity().getApplicationContext());
        Account[] accounts = manager.getAccountsByType("com.google");

        String account_name = this.cordova.getActivity().
                getPreferences(Context.MODE_PRIVATE).
                getString(GoogleCalendarProviderAccessor.PREF_ACCOUNT_NAME, null);

//        Log.i("Parent Planet: ", "getPrimaryAccount - Account: " + account_name);

        if (account_name == null) {
            return accounts.length == 1 ? accounts[0].name : null;
        }

        List<String> possibleEmails = new LinkedList<String>();

//        Log.i("Parent Planet: ", "getPrimaryAccount - Account: " + account_name);
        for (Account account : accounts) {
//            Log.i("Parent Planet: ", "Compare [" + account_name + "][" + account.name + "]");
            if (account.name.toLowerCase().equals(account_name.toLowerCase())) {
                possibleEmails.add(account.name);
                break;
            }
        }

        if (!possibleEmails.isEmpty() && possibleEmails.get(0) != null) {
            return possibleEmails.get(0);
        }

        return null;
    }

    @Override
    protected Boolean isGooglePlayServicesAvailable() {
        GoogleApiAvailability apiAvailability =
                GoogleApiAvailability.getInstance();
        final int connectionStatusCode =
                apiAvailability.isGooglePlayServicesAvailable(this.cordova.getActivity().getApplicationContext());
        return connectionStatusCode == ConnectionResult.SUCCESS;
    }

    @Override
    protected Boolean isDeviceOnline() {
        ConnectivityManager connMgr =
                (ConnectivityManager) this.cordova.getActivity().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo networkInfo = connMgr.getActiveNetworkInfo();
        return (networkInfo != null && networkInfo.isConnected());
    }

    @Override
    protected void saveAccountSelected(String accountSelected) {
      PPDatabaseHelper dbHelper = new PPDatabaseHelper(this.cordova.getActivity().getApplicationContext());
      SQLiteDatabase database = dbHelper.getWritableDatabase();

      ContentValues values = new ContentValues();
      values.put(PP_ID, 1);
      values.put(PP_NAME, accountSelected);
      if (database.insert(PP_TABLE, null, values) != -1){
          Log.i("Parent Planet: ", "Save account selected (" + accountSelected + ") in database success");
      } else {
          Log.i("Parent Planet: ", "Save account selected (" + accountSelected + ") in databse not success");
      }

      database.close();
    }

    @Override
    protected String getAccountSelected() {
      PPDatabaseHelper dbHelper = new PPDatabaseHelper(this.cordova.getActivity().getApplicationContext());
      SQLiteDatabase database = dbHelper.getReadableDatabase();

      String[] cols = new String[] {PP_ID, PP_NAME};
      Cursor mCursor = database.query(true, PP_TABLE, cols, null
              , null, null, null, null, null);
      while (mCursor.moveToNext()) {
          String accountName = mCursor.getString(mCursor.getColumnIndex(PP_NAME));
          database.close();
          return accountName;
      }

      database.close();

      return null;
    }
}
