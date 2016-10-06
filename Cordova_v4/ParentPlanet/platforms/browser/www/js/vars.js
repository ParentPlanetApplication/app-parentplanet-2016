/*
    Global variables used across multiple modules.
    Not the best solution but let's use it for now
*/

var _config = {
    parse: {
        // applicationId: 'C5E7FSUJXEJ7gTODpBLCuZShhJUxhu9AHjdlU4QR',
        applicationId: APPLICATIONID,
        clientKey: 'ifftxPsVeidLeCCvgaGIZHEC3bO4g3MP9UwaZHxM',
        javascriptKey: '5PjDnc2yHl0WvzsZkLZKy5OozAxGFwFKKQoe4ZHP',
        RESTKey: 'HFmn1hbRX75QufD9Pan9vJcqAMLY47MQHvJJ8rge',
        masterKey: '7Awx4E21biT2iEfViPATX1r44YlYNUOISyxQoIr9',
        // serverURL: 'https://mighty-hamlet-52509.herokuapp.com/parse'
        // serverURL: 'https://server.parentplanet.com:1337/parse',
        serverURL: SERVERURL,
    }
};

//sxm retain event, message, homework data between views
var _event; //current event we are working with
var _message;
var _homework;
var _eventIdList; //keep a global around

var _targetMesageId;
var _targetEventId;
var _targetHomeworkId;

var _selectedMessageId;
var _selectedEventId;
var _selectedHomeworkId;
var _selectedContactId;

var _selectedCustomListId;
var _selectedCustomListName;

var _selectedOrganizationGroup;

var OTHER_VIEW = -1;
var HOME_VIEW = 0;
var CALENDAR_VIEW = 1;
var MESSAGES_VIEW = 2;
var HOMEWORK_VIEW = 3;
var CONTACTS_VIEW = 4;
var DEFAULTSTARTYEAR = 2010; //used for backgroundFetch and other searches where we want everything

var _view = {};
_view.HOME = 0;
_view.SCHEDULE_INDEX = 1;
_view.MESSAGES_INDEX = 2;
_view.HOMEWORK_INDEX = 3;
_view.CONTACTS_INDEX = 4;
_view.CONTACTS_GROUPS_INDEX = 4.1;

_view.SINGLE_SCHEDULE = 5;
_view.SINGLE_MESSAGE = 6;
_view.SINGLE_HOMEWORK = 7;

_view.CREATION = 8;
_view.SCHEDULE_CREATION = 9;
_view.MESSAGE_CREATION = 10;
_view.HOMEWORK_CREATION = 11;
_view.SEND_TO = 12;
_view.FILTER = 13;
_view.SEARCH = 14;

_view.USER_SIGNIN = 20;
_view.USER_SIGNUP = 21;

_view.SETTING_HOME_VIEW = 30;
_view.SETTING_USER_HOME_VIEW = 31;

/* The following are subviews of setting view, meaning that they can go back and forward */
_view.SETTING_USER_CONTACTPERMISSIONS_VIEW = 32;

_view.currentView;
_view.previousView;
_view.afterSendToView;
_view.subView;


/* Sign Up */
var _signupEmail = '';
var _signupMobilePhone = '';
var _signupPassword = '';
var _signupUser = null; //complete user object from successful signup then info added

var _previousView;

//For routing in sendto-view
var CREATE_EVENT_VIEW = 'create-event';
var CREATE_MESSAGE_VIEW = 'create-message';
var CREATE_HOMEWORK_VIEW = 'create-homework';
var CREATE_SENDTO = 'create-sendto';
var _previousCreateView;

/*
    Add by phuongnh@vinasource.com
    Set global variable for purple use mutitle times
 */
var _Message_Type = 'message';
var _Event_Type = 'event';
var _Homework_Type = 'homework';
var _AppName = 'ParentPlanet';
var _senderID = '52244621335';
var _pushConfig = {
    android: {
        senderID: _senderID,
        sound: true,
        vibrate: true,
        clearNotifications: true,
    },
    ios: {
        badge: true,
        sound: true,
        alert: true
    }
}
// use this variable to show status app is background or foreground mode
var _isForegroundMode = true;
var _AppVersion = '1.0';

//Vars for custom-list-view, when user chooses to view individual group info
var _group = {
    id: "",
    name: "",
};

//Vars for custom-list-view, when user chooses multiple group
var _selectedGroupId = [];
var _selectedGroupName = [];
var _selectedStudentIdFromGroup = {}; //Contains student IDs
var _familyCustomGroupOrgGenericId = "jXkZjUzi9T";

var _spinnerOpts = {
    lines: 11, // The number of lines to draw
    length: 4, // The length of each line
    width: 2, // The line thickness
    radius: 4, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 7, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#000', // #rgb or #rrggbb or array of colors
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: true, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: '50%', // Top position relative to parent
    left: '50%' // Left position relative to parent
};

var _createSpinner = function(targetDom) {
    var target = document.getElementById(targetDom);
    var spinner = {};   //Do not use null here, bugs were founded in calendar-view.js when clicking the tap
    if (target) {
        spinner = new Spinner(_spinnerOpts).spin(target); //.spin is in lib/spin/spin.js:175
    }

    spinner.stop = function() {
        $("#" + targetDom).addClass("hidden");
    }
    return spinner;
};
// change by phuongnh@vinasource.com
// var DEFAULT_OS_DELAY = 250;
var DEFAULT_OS_DELAY = 10;
var DEFAULT_ANIMATION_DELAY = 500;

var _clearClickEventOnMobile = function(dom) {
    var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
    if (iOS) $(dom).off('click');
};
/* Filter */
var _unselectedKidIdList = [];
var _unselectedActivityIdList = [];
/* contact */
var _selectedContact = {
    orgId: "",
    childId: "",
    parentId: "",
    o: null,
    c: null
};
/* localstorage */
var _ls = localStorage;
/* Push Notification */
var _deviceToken;
var _parseInstallation;
//Var for signup process, we usually dont know the user id unless they sign in
var _signupUserId;
var _signupUserLastName;
/* calendar / event related */
var _calendar = {};
_calendar.parentPlanetCalendar = false;
_calendar.name = "ParentPlanet";
_calendar.color = "#009999";
_calendar.badgeCount = 0;
_calendar.calendarCount = 0;
_calendar.messagesCount = 0;
_calendar.homeworkCount = 0;
_calendar.list = [{
    name: 'ParentPlanet Calendar'
}]; //for mobile replaced with plugin values

var _moment;
var _snd;
var _parse;
var _bgf = 0; //For background fetch testing
/*
    This is a reminder of the local cache data structure (stored within localStorage)
    DO NOT DELETE THIS!
var _userCache = {
    id: '',
    username: '',
    password: '',
    isRemember: true,
    signedIn: false, //sxm july 15
    firstName: '',
    lastName: '',
    userOrganizationRelationArray: []
    children: [{id, firstName, lastName, color}],
    isAdmin: '',
    defaultCustomListId: '',
    defaultCustomListData: '',
    view: {
        beforeCustomListView: ''
    },
    data: {
        messages: '',
        messageRelations: '',
        messageSenderList: '',
        events: '',
        eventRelations: '',
        eventSenderList: '',
        homework: '',
        homeoworkRelations: '',
        homeworkSenderList: '',
        contacts: ''
    },
    customList: {
        userCustomList: '',
        userCustomListIdArray: '',
        orgGroupIdArray: '',
        selectedCustomListData: '',
        //In custom-list page, these variables will be stored when an org (or mygroup) is selected
        selectedId: '',
        selectedName: '',
        selectedGroupType: '',
        isEdit: '',
    },
    setting: {
        selectedOrgId: '',
        selectedOrgData: '',
        permissonOfSelectedOrg: '',
        selectedOrgGroupList: '',
        selectedOrgGroupId: '',
        selectedOrgGroupData: '',
        selectedOrgGroupStudentRelationData: '',    //M6, an array of relation of student-orgGroup
        addStudent: {   //M8, M9
            selectedGroupId: '',
            selectedGroupIdArray: '',
            wholeGroupSelectedFlagArray: '',
        },
        addStaff:{
            relationDataArray: '',
        },
        selectedMyGroupId: '',
        selectedMyGroupData: '',
    }
}
*/
//  eof reminder
/* Setting Views */
var _selectedChildId;
var _selectedChildActivityId;
var _selectedChildActivityName;
var _selectedActivityId;
var _selectedIcon;
var _selectedIconColor;
/* sending pushes and background fetches */
var _pushSpreadTime = 10; //in seconds, we are using moment.js!
var _backgroundFetchSpreadTime = 15000; //15 sec in msec
var _1minute = 60000; //1 minute to be consistent in naming
var _minute = 60000; //1 minute in msec
var _5minutes = 300000;
var _10minutes = 600000;
var _15minutes = 900000;
var _30minutes = 1800000;
var _60minutes = 3600000;
var _120minutes = 7200000;
var _defaultTimeWindow = 28800000; //8 hours in msec
_signOutTimeoutID = null;
//_defaultTimeWindow = _5minutes; //sxm for testing
/* signin */
var _signedIn = false;
var _signInRefresh = false;
var _appIdentifier = "com.ppllc.p2";
var _isRedirect = false;
/* linked account access */
var _selectedUserAcctAccess;
/* for repeating events */
var REPEATINGPREFIX = '';
/* google maps */
var _googleMaps = 'https://maps.google.com/?q=';
var _parentPlanetGreen = '#439a9a';
var _parentPlanetOrange = '#fc8d59';
/* pointer to pushNotifications object */
var _pushNotification = null;
var _history = [];
/* keep track if we are online or not; always initialize to true for webapp use; mobile will change it accordingly in main.js */
var _hasNetworkConnection = true;
var currentDate = new Date()
var minutesAgo = 10;
// var _defaultFirstSyncDate = new Date(currentDate.getTime() - minutesAgo*60000);
var _defaultFirstSyncDate = new Date(2000, 0, 1);
var _lastAutoSyncDeferred = null;
var _emailList = [];
var _deviceReady = false;
var _autoSyncCurrent = {};
var _BackgroundFetching = false;
var _religious = 'Religious';
