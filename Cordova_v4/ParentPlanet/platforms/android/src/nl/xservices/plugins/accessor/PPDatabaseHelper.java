package nl.xservices.plugins.accessor;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.util.Log;

/**
 * Created by phuongngo on 6/30/16.
 */
public class PPDatabaseHelper extends SQLiteOpenHelper {
    private static final String DATABASE_NAME = "ParentPlanet";

    private static final int DATABASE_VERSION = 2;
    private static String PP_COLUMN_ID = "_id";
    private static String PP_COLUMN_NAME = "name";
    private static String PP_TABLE = "accountSelected";

    // Database creation sql statement
    private static final String DATABASE_CREATE = "create table " + PP_TABLE + "(" + PP_COLUMN_ID + " integer primary key, " + PP_COLUMN_NAME + " text not null);";

    public PPDatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(DATABASE_CREATE);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        Log.w(PPDatabaseHelper.class.getName(),
                "Upgrading database from version " + oldVersion + " to "
                        + newVersion + ", which will destroy all old data");
        db.execSQL("DROP TABLE IF EXISTS accountSelected");
        onCreate(db);
    }

    public String getTableName() {
        return PP_TABLE;
    }

    public String getColumnId() {
        return PP_COLUMN_ID;
    }

    public String getColumnName() {
        return PP_COLUMN_NAME;
    }
}
