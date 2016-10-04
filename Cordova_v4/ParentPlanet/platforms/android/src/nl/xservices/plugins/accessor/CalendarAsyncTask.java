package nl.xservices.plugins.accessor;

import com.google.api.client.googleapis.extensions.android.gms.auth.GooglePlayServicesAvailabilityIOException;
import com.google.api.client.googleapis.extensions.android.gms.auth.UserRecoverableAuthIOException;
import com.ppllc.p2.MainActivity;

import android.app.ProgressDialog;
import android.os.AsyncTask;
import android.util.Log;

import java.io.IOException;

/**
 * Created by phuongngo on 7/10/16.
 */
abstract class CalendarAsyncTask extends AsyncTask<Void, Void, Boolean> {

    final MainActivity activity;
    final com.google.api.services.calendar.Calendar client;
    String title = null;
    private ProgressDialog mDialog;

    CalendarAsyncTask(MainActivity activity) {
        this.activity = activity;
        client = activity.client;
    }

    @Override
    protected void onPreExecute() {
        super.onPreExecute();
        activity.numAsyncTasks++;
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                mDialog = new ProgressDialog(activity);
                if(title != null) {
                    mDialog.setMessage(title);
                }
                mDialog.show();
            }
        });
    }

    @Override
    protected final Boolean doInBackground(Void... ignored) {
        try {
            doInBackground();
            return true;
        } catch (final GooglePlayServicesAvailabilityIOException availabilityException) {
            activity.showGooglePlayServicesAvailabilityErrorDialog(
                    availabilityException.getConnectionStatusCode());
        } catch (UserRecoverableAuthIOException userRecoverableException) {
            activity.startActivityForResult(
                    userRecoverableException.getIntent(), MainActivity.REQUEST_AUTHORIZATION);
        } catch (IOException e) {
            Utils.logAndShow(activity, MainActivity.TAG, e);
        }
        return false;
    }

    @Override
    protected final void onPostExecute(Boolean success) {
        super.onPostExecute(success);
        mDialog.dismiss();
    }

    abstract protected void doInBackground() throws IOException;
}

