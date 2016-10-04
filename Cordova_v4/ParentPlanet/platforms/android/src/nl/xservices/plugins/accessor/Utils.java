package nl.xservices.plugins.accessor;

import com.google.android.gms.auth.GoogleAuthException;
import com.google.api.client.googleapis.json.GoogleJsonError;
import com.google.api.client.googleapis.json.GoogleJsonResponseException;

import android.app.Activity;
import android.content.res.Resources;
import android.util.Log;
import android.widget.Toast;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by phuongngo on 7/10/16.
 */
public class Utils {

    /**
     * Logs the given throwable and shows an error alert dialog with its message.
     *
     * @param activity activity
     * @param tag log tag to use
     * @param t throwable to log and show
     */
    public static void logAndShow(Activity activity, String tag, Throwable t) {
        Log.e(tag, "Error", t);
        String message = t.getMessage();
        if (t instanceof GoogleJsonResponseException) {
            GoogleJsonError details = ((GoogleJsonResponseException) t).getDetails();
            if (details != null) {
                message = details.getMessage();
            }
        } else if (t.getCause() instanceof GoogleAuthException) {
            message = ((GoogleAuthException) t.getCause()).getMessage();
        }
        showError(activity, message);
    }

    /**
     * Logs the given message and shows an error alert dialog with it.
     *
     * @param activity activity
     * @param tag log tag to use
     * @param message message to log and show or {@code null} for none
     */
    public static void logAndShowError(Activity activity, String tag, String message) {
        String errorMessage = getErrorMessage(activity, message);
        Log.e(tag, errorMessage);
        showErrorInternal(activity, errorMessage);
    }

    /**
     * Shows an error alert dialog with the given message.
     *
     * @param activity activity
     * @param message message to show or {@code null} for none
     */
    public static void showError(Activity activity, String message) {
        String errorMessage = getErrorMessage(activity, message);
        showErrorInternal(activity, errorMessage);
    }

    private static void showErrorInternal(final Activity activity, final String errorMessage) {
        activity.runOnUiThread(new Runnable() {
            public void run() {
                Toast.makeText(activity, errorMessage, Toast.LENGTH_LONG).show();
            }
        });
    }

    private static String getErrorMessage(Activity activity, String message) {
        return message;
    }

    public static String convertStringToDate(Long dateString) {
        Date date=new Date(dateString);

        SimpleDateFormat df2 = new SimpleDateFormat("dd/MM/yy kk:mm");
        String dateText = df2.format(date);

        return dateText;
    }

    public static boolean get_match(String s, String p) {
        // returns first match of p in s for first group in regular expression
        Matcher m = Pattern.compile(p).matcher(s);
        return m.find() ? true : false;
    }
}
