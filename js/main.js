requirejs.config({ // Configure the AMD module loader
    baseUrl: './js/', // The path where your JavaScripts are located
    paths: { // Specify the paths of vendor libraries
        'setting': 'setting',
        'jquery': 'bower_components/jquery/dist/jquery.min',
        'jqueryui': 'bower_components/jquery-ui.custom/jquery-ui.min',
        'animate': 'bower_components/jquery.animate.enhanced/jquery.animate-enhanced.min',
        'underscore': 'bower_components/lodash/dist/lodash',
        'backbone': 'bower_components/backbone/backbone',
        'handlebars': 'bower_components/handlebars/handlebars.min',
        'text': 'bower_components/requirejs-text/text',
        'chaplin': 'bower_components/chaplin/chaplin',
        'jquerymobile': 'lib/gumby/jquery.mobile.custom.min',
        'modernizr': 'lib/gumby/modernizr.custom.30562',
        'gumby': 'lib/gumby/gumby',
        'toggleswitch': 'lib/gumby/ui/gumby.toggleswitch',
        'checkbox': 'lib/gumby/ui/gumby.checkbox',
        'tabs': 'lib/gumby/ui/gumby.tabs',
        'retina': 'lib/gumby/ui/gumby.retina',
        'howler': 'bower_components/howlerjs/howler.min',
        'backbone.touch': 'bower_components/backbone.touch/backbone.touch.min',
        'localstorage': 'bower_components/Backbone.localStorage/backbone.localStorage',
        'dualstorage': 'bower_components/Backbone.dualStorage/backbone.dualstorage.amd',
        'ical': 'lib/ical/IcalParser',
        'moment': 'bower_components/momentjs/min/moment.min',
        'underscore.string': 'bower_components/underscore.string/dist/underscore.string.min',
        'jqueryparse': 'lib/jqueryparse/jquery.parse',
        'parse': 'bower_components/parse/parse',
        'parseproxy': 'parseproxy',
        'spinner': 'spinner',
        'calendarAutoSync': 'services/calendarAutoSync',
        'eventService': 'services/eventService',
        'userService': 'services/userService',
        'localStorageService': 'services/localStorageService',
        'rrule': 'bower_components/rrule/lib/rrule', //load in normally for now, don't use requirejs
        'nlp': 'bower_components/rrule/lib/nlp',
        'picker': 'bower_components/pickadate/lib/picker',
        'picker.date': 'bower_components/pickadate/lib/picker.date',
        // 'filesaver': 'lib/Filesaver/Filesaver',
        // 'blob': 'lib/Blob/Blob',
        //'ics': 'lib/ics/ics',
        //'vcard': 'lib/vcard/vcard',
        //'maskedinput': 'lib/maskedinput/jquery.mask'
        'timepicker': 'lib/bootstrap-timepicker/bootstrap-timepicker',
        'stepper': 'lib/stepper/stepper',
        'pgenerator': 'lib/pGenerator-master/pGenerator.jquery'
            //scrolling, keyboard support
            /*
            'transitionize': 'bower_components/transitionize-master/transitionize',
            'fastclick': 'bower_components/fastclick-master/lib/fastclick',
            'switchery': 'bower_components/switchery/dist/switchery'
            */
    },
    // Underscore and Backbone are not AMD-capable per default,
    // so we need to use the AMD wrapping of RequireJS
    shim: {
        'underscore': { exports: '_' },
        'jqueryui': { deps: ['jquery'] },
        'animate': { deps: ['jquery'] },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'handlebars': { exports: 'Handlebars' },
        'modernizr': { exports: 'Modernizr' },
        'gumby': {
            deps: ['jquery', 'modernizr'], //Shim to ensure jquery is loaded first
            exports: 'Gumby'
        },
        'toggleswitch': { deps: ['gumby'] },
        'checkbox': { deps: ['gumby'] },
        'tabs': { deps: ['gumby'] },
        'retina': { deps: ['gumby'] },
        'jqueryparse': { deps: ['jquery'] },
        'parse': {
            deps: ['underscore', 'jquery'],
            exports: 'Parse'
        },
        'parseproxy': { deps: ['parse'] },
        'backbone.touch': { deps: ['jquery', 'underscore', 'backbone'] },
        'picker': { deps: ['jquery'] },
        'picker.date': { deps: ['jquery', 'picker'] },
        'pgenerator': { deps: ['jquery'] }
    },
    //this is a global config object available from requirejs by requiring 'module'
    // var size = module.config().size;
    config: {
        // 'parseproxy': {
        //     applicationId: 'C5E7FSUJXEJ7gTODpBLCuZShhJUxhu9AHjdlU4QR',
        //     clientKey: 'ifftxPsVeidLeCCvgaGIZHEC3bO4g3MP9UwaZHxM',
        //     javascriptKey: '5PjDnc2yHl0WvzsZkLZKy5OozAxGFwFKKQoe4ZHP',
        //     RESTKey: 'HFmn1hbRX75QufD9Pan9vJcqAMLY47MQHvJJ8rge',
        //     masterKey: '7Awx4E21biT2iEfViPATX1r44YlYNUOISyxQoIr9',
        //     serverURL: 'https://mighty-hamlet-52509.herokuapp.com/parse'
        // },
        'parseproxy': _config.parse,
        'models/events': {
            debug: true //global flag
        }
    }
    // For easier development, disable browser caching
    // Of course, this should be removed in a production environment
    //, urlArgs: 'bust=' +  (new Date()).getTime()
}); //eo requirejs.config

// Bootstrap the application, use P2 for the ParentPlanet classname
require(['application', 'routes', 'jquery', 'modernizr', 'gumby', 'parse', 'backbone.touch', 'parseproxy', 'animate', 'toggleswitch', 'checkbox', 'tabs', 'retina'],
    function(ParentPlanet, routes, $, modernizr, Gumby, Parse, touch, ParseProxy) {
        //This function is called when scripts/helper/util.js is loaded.
        //If util.js calls define(), then this function is not fired until
        //util's dependencies have loaded, and the util argument will hold
        //the module value for "helper/util".
        //create an application; then init gumby after so that elements are in place beforehand
        new ParentPlanet({ routes: routes, controllerSuffix: '-controller' });
        // not touch device or no touch events required so auto initialize here
        if ((!Gumby.touchDevice || !Gumby.touchEvents) && Gumby.autoInit) {
            Gumby.init({ debug: false });
            $("body").data("isMobile", false); //attach data to body for easier flagging later
            $("body").data("isBrowser", true);
            _customUIBrowserOnDevice(); //add Class for firefox device
            console.log('Modernizer complete: isMobile false');
            // load jQuery mobile touch events
        } else if (Gumby.touchEvents && Gumby.touchDevice) {
            $("body").data("isMobile", true);
            (cordova.platformId !== "browser") ? $("body").data("isBrowser", false): $("body").data("isBrowser", true); // check web app or mobile app on devices
            Gumby.debug('Loading jQuery mobile touch events');
            console.log('Gumby touch device: isMobile ', $("body").data("isMobile"));
            yepnope.errorTimeout = 2000; // set modernizer timeout to 2sec
            if (!_isMobile()) _customUIBrowserOnDevice(); //add Class for firefox device
            Modernizr.load({
                test: Modernizr.touch,
                yep: Gumby.touchEvents + '/jquery.mobile.custom.min.js',
                complete: function() {
                    // error loading jQuery mobile
                    if (!$.mobile) { Gumby.error('Error loading jQuery mobile touch events'); }
                    // if not auto initializing
                    // this will allow helpers to fire when initialized
                    Gumby.touchEventsLoaded = true;
                    // auto initialize
                    if (Gumby.autoInit) {
                        Gumby.init({
                            uiModules: ['toggleswitch', 'checkbox', 'tabs', 'retina'],
                            debug: false
                        });
                        // if already manually initialized then fire helpers
                    } else if (Gumby.uiModulesReady) {
                        Gumby.helpers();
                    }
                }, //eo complete
                callback: function(url, result, key) {
                    if ($.mobile) { window.Gumby.click += ' tap'; } // check jQuery mobile has successfully loaded before updating Gumby.click
                }
            });
        } //eo if !touch etc
        //Cordova has to be loaded first before you call this function
        (function() { // Cordova application Constructor
            // Bind any events that are required on startup. Common events are:
            // 'load', 'deviceready', 'offline', and 'online'.
            // The scope of 'this' is the event. In order to call the 'receivedEvent'
            // function, we must explicity call 'app.receivedEvent(...);'
            var isMobile = $('body').data('isMobile');

            var unload = function() {
                var user = _getUserData(); //get user from local storage
                user.isRemember ? $.noop() : _setSignedIn(false);
            }; //eo unload
            var resize = function() {
                $("#site-container").height($(window).height());
                setTimeout(function() {
                    $("#site-container").height($(window).height());
                }, 100);
                setTimeout(function() {
                    $("#site-container").height($(window).height());
                }, 500);
            }; //eo resize
            var onDeviceReady = function() {
                _deviceReady = true;
                var deferred = null; //handle asynchronous calls
                var keyboard_min_height = 120; //Init iOS native keyboard handler
                //cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                var keyboardShowHandler = function(e) {
                    //keyboard_min_height = e.keyboardHeight + 50;
                    $(".innerview-container").append('<div id="kyb-shim" style="position: relative; background: none; width: 100%; min-height:' + keyboard_min_height + 'px;"></div>');
                    // $(".innerview-container").getComputedStyle()  **Removed this line to fix type errors.
                };
                var keyboardHideHandler = function(e) { $("#kyb-shim").remove(); };
                var pushNotificationTimeoutDelay = 500;
                var Fetcher = window.plugins.backgroundFetch;
                var fetchCallback = function() { _onBackgroundFetch(Fetcher.finish, true); };
                // pushConfig is where we set up what to do when one comes in; _onNotificationAPN is the global handler for the push
                // Edit by phuongnh@vinasource.com
                // Add more config for Android platform
                var pushConfig = {
                    android: {
                        senderID: _senderID,
                        sound: true,
                        vibrate: true,
                        clearNotifications: true,
                        iconColor: '#ffffff',
                        icon: 'icon',
                        forceShow: true
                    },
                    ios: {
                        badge: true,
                        sound: true,
                        alert: true
                    }
                }
                var timeout0 = null;

                /*
                    Add by: phuongnh@vinasource.com
                */

                if (!window.plugins.pushNotification) {
                    window.plugins.pushNotification = PushNotification.init(_pushConfig);
                }

                function startPush() {
                    var deferred = $.Deferred(); //defined at top scope
                    var initParsePushNotification = function() {
                        // var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
                        // Edit by phuongnh@vinasource.com
                        // use cordova to detect which platform using
                        var iAndroid = cordova.platformId === 'android';

                        function deviceToken() {
                            var user = Parse.User.current();
                            var Installation = Parse.Object.extend("Installation", {}, {
                                query: function() {
                                    return new Parse.Query(this.className);
                                }
                            });
                            var query = Installation.query();

                            function success(results) {
                                if (results.length > 0) { return; }
                                //Create Parse Installation Id for this user
                                ParseProxy.REST.post('installations', {
                                        "appIdentifier": _appIdentifier, //Chanat, ToDo: We should use a global var instead of plain text
                                        "appName": _AppName,
                                        "appVersion": _AppVersion,
                                        "deviceType": cordova.platformId,
                                        "GCMSenderId": _senderID,
                                        "deviceToken": _deviceToken,
                                        "pushType": iAndroid ? 'gcm' : undefined,
                                        "channels": [""],
                                        "installationId": _generateUUID(),
                                        "timeZone": getTimeZone(),
                                        "userId": user.id
                                    },
                                    function(o) { //Success    _parseInstallation = o;
                                        // Add by phuongnh@vinasource.com
                                        // make sure after install device into parse, will reset badge to 0
                                        cordova.plugins.notification.badge.set(0);

                                        console.log('Post Parse Installation Object Success:' + JSON.stringify(o));
                                        deferred ? deferred.resolve() : angular.noop();
                                    },
                                    function(o) { //Error
                                        console.log('Post Parse Installation Object Error:' + JSON.stringify(o));
                                        deferred ? deferred.resolve() : angular.noop();
                                        //_alert('Post Parse Installation Object Error:' + JSON.stringify(o));
                                    }); //eo post via proxy
                            }; //success
                            function error(error) {
                                console.log(error);
                                deferred ? deferred.resolve() : angular.noop();
                                //spinner.hide();
                            };

                            query.equalTo("userId", user.id);

                            // Edit by phuongnh@vinasource.com
                            // must check platform before call query
                            iAndroid ? query.equalTo("GCMSenderId", _senderID) : query.equalTo("deviceToken", _deviceToken);

                            //var spinner = _createSpinner('spinner');
                            query.find({ success: success, error: error }); //eo find push installations for this user's device
                        }; //eo deviceToken

                        //iOS && _deviceToken ? deviceToken() : $.noop();
                        _deviceToken && Parse.User.current() ? deviceToken() : (deferred ? deferred.resolve() : angular.noop()); //relax condition about being on iOS (for now)
                    }; //eo initParsePushNotification
                    var pushErrorHandler = function(error) {
                        if (_isMobile()) {
                            _alert('Error: Push register ' + error);
                            _hasNetworkConnection = true;
                        }
                        deferred ? deferred.resolve() : angular.noop();
                    }; // result contains any error description text returned from the plugin call

                    var error = function() {
                        _alert('Error: null _pushNotification');
                        _hasNetworkConnection = true;
                        timeout0 ? clearTimeout(timeout0) : $.noop();
                        deferred.resolve();
                    };
                    var pushTokenHandler = function(result) {
                        // Your iOS push server needs to know the token before it can push to this device
                        // here is where you might want to send it the token for later use.
                        _hasNetworkConnection = true;
                        timeout0 ? clearTimeout(timeout0) : $.noop();
                        /*
                            Add by: phuongnh@vinasource.com
                        */
                        console.log('--------------result--------------------');
                        console.log(result.registrationId);
                        console.log('--------------result--------------------');
                        _deviceToken = result.registrationId; //   console.log("Token: " + _deviceToken);
                        initParsePushNotification(); //now initialize pushes
                    }; //eo pushTokenHandler

                    /*
                        Remove by: phuongnh@vinasource.com
                    */
                    //_pushNotification ? _pushNotification.register(pushTokenHandler,pushErrorHandler, pushConfig) : error(); //Init Push Notification (Official Phonegap Plugin)
                    // _pushNotification ? _pushNotification.init(pushConfig) : error(); //Init Push Notification (Official Phonegap Plugin)
                    //
                    //
                    _pushNotification = window.plugins.pushNotification;

                    /*
                        Add by: phuongnh@vinasource.com
                    */

                    _pushNotification.on('error', function(e) {
                        console.log('error', e.message);
                        pushErrorHandler();
                    });

                    _pushNotification.on('registration', function(data) {
                        console.log('registration');
                        console.log('_deviceToken:' + _deviceToken);
                        pushTokenHandler(data);
                    });

                    _pushNotification.on('notification', function(data) {
                        console.log('notification');
                        console.log(data);
                        _onNotificationAPN(data);
                        // Edit by phuongnh@vinasource.com
                        // make sure after show notification, will set icon badge to 1
                        cordova.plugins.notification.badge.set(1);

                    });

                    timeout0 = setTimeout(function() {
                        _hasNetworkConnection = false;
                        deferred ? deferred.reject() : angular.noop();
                    }, 5000);
                    return deferred;
                };

                function pauseResume() {
                    /*
                        Add by: phuongnh@vinasource
                        add for debug function
                     */
                    console.log('call pauseResume function');
                    var deferred = $.Deferred(); //defined at top scope
                    //setTimeout(function() {
                    function successHandler(result) { _alert('result = ' + result); }; // result contains any message sent from the plugin call
                    function resumeHandler() {
                        _isForegroundMode = true;
                        var deferred = $.Deferred();
                        //Refresh current page when app moves to foreground;
                        //NOTE: see http://www.telerik.com/blogs/phonegap-apache-cordova-lifecycle-events about need to wrap this in a timeout
                        setTimeout(function() {
                            _onBackgroundFetch(_resume, true, false, null, deferred); //add in the callback to refresh the home view if we are there
                            if (_calendar) {
                                _calendar.badgeCount = 0; //initialize when we startup using global _calendar
                            }
                        }, DEFAULT_OS_DELAY);

                        return deferred;
                    }; //eo resumeHandler
                    function pauseHandler() { //app goes into background
                        console.log('app is running background mode');
                        _isForegroundMode = false;
                    };
                    //pushNotification.register(tokenHandler,errorHandler, pushConfig); //Init Push Notification (Official Phonegap Plugin)
                    document.addEventListener("resume", resumeHandler, false); //follow Cordova docs exactly http://cordova.apache.org/docs/en/1.6.0/cordova_events_events.md.html#resume
                    document.addEventListener("pause", pauseHandler, false); //follow Cordova docs exactly http://cordova.apache.org/docs/en/1.6.0/cordova_events_events.md.html#resume
                    deferred.resolve();
                    //}, pushNotificationTimeoutDelay); //eo setTimeout
                    return deferred;
                }; //what to do when paused or resumed
                function backgroundFetch() {
                    var deferred = $.Deferred();
                    Parse.User.current() ? _onBackgroundFetch(_resume, true, false, null, deferred) : deferred.resolve(); //either on app start-up or coming out of suspend state, update the data

                    return deferred;
                };

                function done() {
                    /*
                        remove by phuongnh@vinasource.com
                        fix issue object is undefined
                     */
                    // navigator.splashscreen.hide(); //done, hide the splash
                    if (Fetcher != undefined) {
                        Fetcher.configure(fetchCallback, null, [-1]); //sxm add interval for background fetch, with [-1] use default
                    }
                    cordova.plugins.Keyboard.disableScroll(true);
                    window.addEventListener('native.keyboardshow', keyboardShowHandler);
                    window.addEventListener('native.keyboardhide', keyboardHideHandler);
                    if (_calendar) {
                        _calendar.badgeCount = 0; //initialize when we startup using global _calendar
                    }
                    /* Moved Claendar Plugin w/in app views that need it to fix iOS prompt issue
                    window.plugins.calendar.listCalendars(function(o) {
                        _calendar.list = o; //hand the calendar list to the view for display
                    }, $.noop); //eo window.plugins.calendar.listCalendars
                    */
                }; //last bits

                // Main deviceReady Chain Starts here

                $("body").data("isBrowser", false); //Cordova has fired, hence use device features
                // _snd = new Media('/media/chord.mp3'); //global sound
                // OK, do all the setup/init work starting here with pushes
                startPush()
                    .then(pauseResume)
                    .then(backgroundFetch)
                    .always(done);
            }; //eo onDeviceReady

            // Initialize global variable _parse so that it's ready to use elsewhere in the app.
            _parse = Parse;
            /*
             * Set Up Listeners here
             */
            if (_isMobile()) {
                document.addEventListener('deviceready', onDeviceReady, false);
            }

            $(window).unload(unload); //eo unload
            $(window).resize($.noop);

        })(); //eo self-executing main
    }); //eo require load of application