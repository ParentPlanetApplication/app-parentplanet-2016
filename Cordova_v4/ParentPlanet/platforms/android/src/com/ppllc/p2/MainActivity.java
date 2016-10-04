/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package com.ppllc.p2;

import android.accounts.AccountManager;
import android.app.Activity;
import android.app.Dialog;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.os.Bundle;
import android.util.Log;

import com.google.android.gms.common.GoogleApiAvailability;
import com.google.api.client.extensions.android.http.AndroidHttp;
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.calendar.CalendarScopes;

import org.apache.cordova.*;

import java.util.Collections;
import java.util.logging.Logger;

import java.util.logging.Level;

import nl.xservices.plugins.accessor.PPDatabaseHelper;

public class MainActivity extends CordovaActivity
{
    private static final Level LOGGING_LEVEL = Level.OFF;
    public static final String PREF_ACCOUNT_NAME = "primary";

    private static final String PRODUCT_NAME = "Google-CalendarAndroid";

    static final int REQUEST_GOOGLE_PLAY_SERVICES = 0;
    public static final int REQUEST_AUTHORIZATION = 1;
    static final int REQUEST_ACCOUNT_PICKER = 2;

    GoogleAccountCredential credential;
    public com.google.api.services.calendar.Calendar client;

    final HttpTransport transport = AndroidHttp.newCompatibleTransport();
    final JsonFactory jsonFactory = GsonFactory.getDefaultInstance();

    public int numAsyncTasks;

    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        Logger.getLogger("com.google.api.client").setLevel(LOGGING_LEVEL);

        // Set by <content src="index.html" /> in config.xml
        loadUrl(launchUrl);
    }

    public void createCredential() {
        credential =
                GoogleAccountCredential.usingOAuth2(this, Collections.singleton(CalendarScopes.CALENDAR));
        credential.setSelectedAccountName(getAccountSelected());

        client = new com.google.api.services.calendar.Calendar.Builder(
                transport, jsonFactory, credential).setApplicationName(PRODUCT_NAME)
                .build();

    }

    public void showGooglePlayServicesAvailabilityErrorDialog(final int connectionStatusCode) {
        final GoogleApiAvailability apiAvailability =
                GoogleApiAvailability.getInstance();

        runOnUiThread(new Runnable() {
            public void run() {
                Dialog dialog = apiAvailability.getErrorDialog(
                       MainActivity.this, connectionStatusCode, REQUEST_GOOGLE_PLAY_SERVICES);
                dialog.show();
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
//        if (checkGooglePlayServicesAvailable()) {
//            haveGooglePlayServices();
//        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {
            case REQUEST_GOOGLE_PLAY_SERVICES:
                if (resultCode == Activity.RESULT_OK) {
                    haveGooglePlayServices();
                } else {
                    checkGooglePlayServicesAvailable();
                }
                break;
            case REQUEST_AUTHORIZATION:
                if (resultCode != Activity.RESULT_OK) {
                    chooseAccount();
                }
                break;
            case REQUEST_ACCOUNT_PICKER:
                if (resultCode == Activity.RESULT_OK && data != null && data.getExtras() != null) {
                    String accountName = data.getExtras().getString(AccountManager.KEY_ACCOUNT_NAME);
                    if (accountName != null) {
                        saveAccountSelected(accountName);
                        credential.setSelectedAccountName(accountName);
                    }
                }
                break;
        }
    }

    /** Check that Google Play services APK is installed and up to date. */
    public boolean checkGooglePlayServicesAvailable() {
        final GoogleApiAvailability apiAvailability =
                GoogleApiAvailability.getInstance();

        final int connectionStatusCode = apiAvailability.isGooglePlayServicesAvailable(this);

        if (apiAvailability.isUserResolvableError(connectionStatusCode)) {
            showGooglePlayServicesAvailabilityErrorDialog(connectionStatusCode);
            return false;
        }

        return true;
    }

    public String getSelectedAccountName() {
        return credential.getSelectedAccountName();
    }

    public void haveGooglePlayServices() {
        // check if there is already an account selected
        if (credential.getSelectedAccountName() == null) {
            // ask user to choose account
            chooseAccount();
        }
    }

    private void chooseAccount() {
        startActivityForResult(credential.newChooseAccountIntent(), REQUEST_ACCOUNT_PICKER);
    }

    private void saveAccountSelected(String accountSelected) {
        PPDatabaseHelper dbHelper = new PPDatabaseHelper(MainActivity.this.getApplicationContext());
        SQLiteDatabase database = dbHelper.getWritableDatabase();

        ContentValues values = new ContentValues();
        values.put(dbHelper.getColumnId(), 1);
        values.put(dbHelper.getColumnName(), accountSelected);
        if (database.insert(dbHelper.getTableName(), null, values) != -1){
            Log.i("Parent Planet: ", "Save account selected (" + accountSelected + ") in database success");
        } else {
            Log.i("Parent Planet: ", "Save account selected (" + accountSelected + ") in databse not success");
        }

        database.close();
    }

    protected String getAccountSelected() {
        PPDatabaseHelper dbHelper = new PPDatabaseHelper(MainActivity.this.getApplicationContext());
        SQLiteDatabase database = dbHelper.getReadableDatabase();

        String[] cols = new String[] {dbHelper.getColumnId(), dbHelper.getColumnName()};
        Cursor mCursor = database.query(true, dbHelper.getTableName(), cols, null
                , null, null, null, null, null);

        while (mCursor.moveToNext()) {
            String accountName = mCursor.getString(mCursor.getColumnIndex(dbHelper.getColumnName()));
            database.close();
            return accountName;
        }

        database.close();

        return null;
    }

}
