define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/index/content/calendar-view.hbs',
        'jquery',
        'parseproxy',
        'spinner',
        'moment',
        'text!templates/phonelist-dropdown-menu.hbs',
        'parse'
        //'ics'   //This plugin causes issue #153 on Github - Chanat - The problem was that it is not written as a module. Qucik fix is to just import this lib in index.html
    ],
    function(Chaplin, View, Template, $, ParseProxy, spinner, moment, phonelistTemplate, Parse) {
        'use strict';
        var reminderCalendar = null;
        var reminderCalendarPicker = null;
        var isMobile = false;
        var namedCalendars = [];
        var _contact = {};
        var calendarView = null;
        var event = null;
        var ics = null;
        var selectedRemindId = '';
        var selectedRemindStr = "Never";
        var prevSelectedRemindStr = '';
        var selectedRemindMinutes = -1;
        var markAsAddedToCalendar = function(eventId, user) {
            var calendarItem = _getUserCalendarItem(eventId);
            var newEvent = _getUserEventsItem(eventId);
            if (calendarItem) {
                calendarItem.hasAddedToCalendar = true;
            } else {
                calendarItem = {
                    hasAddedToCalendar: true
                };
            }
            if (newEvent.attributes) {
                var title = newEvent.attributes.title;
                var location = newEvent.attributes.location;
                var note = newEvent.attributes.note;
                var startDate = newEvent.attributes.startDateTime.toISOString();
                var endDate = newEvent.attributes.endDateTime.toISOString();
            } else {
                var title = newEvent.title;
                var location = newEvent.location;
                var note = newEvent.note;
                var startDate = newEvent.startDateTime.iso;
                var endDate = newEvent.endDateTime.iso;
            }
            // set attributes to use if event is updated and needs to be modified
            calendarItem.title = title;
            calendarItem.location = location;
            calendarItem.note = note;
            calendarItem.startDate = startDate;
            calendarItem.endDate = endDate;
            //console.log('Mark as added event:',JSON.stringify(newEvent));
            //console.log('53:',JSON.stringify(calendarItem));
            _setUserCalendarItem(eventId, calendarItem);
            calendarItem = _getUserCalendarItem(eventId);
            if (user) {
                user.data.calendar != undefined ? user.data.calendar.push(calendarItem) :
                    (function(calendarItem) {
                        user.data.calendar = [];
                        user.data.calendar.push(calendarItem);
                    }(calendarItem));
            }
        };

        var hasAddedToCalendar = false;
        var whichCalendarToSync = 'null';
        var updateReadEvent = function() {
            var eventRelations = _getUserEventRelations(); //array of obj
            var eventRelationArray = $.grep(eventRelations, function(eventRelation, i) {
                return eventRelation.eventId == _selectedEventId;
            });
            var eventRelation = eventRelationArray.length > 0 ? eventRelationArray[0] : null;
            var update = function() {
                var id = eventRelation.objectId;
                eventRelation.isRead = true;
                _setUserEventRelationsItem(id, eventRelation); //set locally
            }; //eo update
            $.each(eventRelationArray, function(i, relation) { //can have more than one
                eventRelation = relation;
                update();
            })
        }; //eo updateReadEvent
        //two different addToCalendar functions
        var addToCalendarMobile = function(calendarToSync) {
            //  console.log('addToCalendarMobile event:\n', JSON.stringify(event));
            if (!calendarToSync || calendarToSync == "None") {
                return;
            }

            var event = _event;
            var user = _getUserData();
            var success = function(user) {
                var eventId = event.objectId;
                event.id = event.objectId;
                _markAsAddedToCalendar(eventId, user);
                reminderCalendarPicker.html("Already Added"); //selector is set around line #403
                reminderCalendarPicker.addClass('already-added');
                hasAddedToCalendar = true;
            };
            var error = function(message) {
                _alert('Event:' + event.title + ' error ' + message);
                hasAddedToCalendar = false;
            };
            var title, location, note, startDate, endDate;
            var calOptions = {};
            var repeater = function() {
                var recurrence = event.repeat.trim().toLowerCase();
                var recurrenceEndDate;
                if (recurrence.indexOf('day') >= 0) {
                    recurrence = 'daily';
                } else if (recurrence.indexOf('week') >= 0) {
                    recurrence = 'weekly';
                } else if (recurrence.indexOf('month') >= 0) {
                    recurrence = 'monthly';
                } else if (recurrence.indexOf('year') >= 0) {
                    recurrence = 'yearly';
                } else {
                    recurrence = false;
                }
                if (recurrence) {
                    calOptions.recurrence = recurrence;
                    recurrenceEndDate = event.until;
                    recurrenceEndDate = moment(recurrenceEndDate, 'MM/DD/YY').toDate();
                    calOptions.recurrenceEndDate = recurrenceEndDate;
                }
            }; //eo repeater

            var subscribeToEvent = function(event, userId, calendarName) {
                var objSyncUser = {
                   userId: userId,
                   deviceToken: _deviceToken,
                   AddedToSync: whichCalendarToSync
                };
                event.addUnique("clientsSync", objSyncUser);
                event.addUnique("subscribers", _deviceToken);
            };

            var addedToSyncEvent = function(eventId, whichCalendarToSync) {
                var deferred = $.Deferred();
                var Event = Parse.Object.extend("Event", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                var query = Event.query();
                query.equalTo("objectId", eventId);
                query.find({
                    success: function(results) {
                        var event = results[0];
                        var repeatEvent = event.get("repeatId");
                        var repeatRoot = '';
                        
                        
                        repeatEvent == undefined ?
                            subscribeToEvent(event, user.id, whichCalendarToSync) :
                            (function() {
                                if (!_isRootRepeatId(repeatEvent)) {
                                    repeatRoot = _getRootRepeatId(repeatEvent);
                                    var EventRoot = Parse.Object.extend("Event", {}, {
                                        query: function() {
                                            return new Parse.Query(this.className);
                                        }
                                    });
                                    var queryRoot = EventRoot.query();
                                    queryRoot.equalTo("repeatId", repeatRoot);
                                    queryRoot.find({
                                        success: function(results) {
                                            var rootEvent = results[0];
                                            subscribeToEvent(rootEvent, user.id, whichCalendarToSync)
                                            rootEvent.save();
                                        },
                                        error: function(error) {
                                            console.log(error);
                                        }
                                    });
                                }
                            }());

                        event.save();
                        deferred.resolve(event);
                    },
                    error: function(error) {
                        console.log("Add to Sync: " + error);
                        deferred.resolve();
                    }
                });

                return deferred;
            };
            if (event.hasAddedToCalendar || hasAddedToCalendar) {
                _alert('Event:' + event.title + ' already added to calendar');
                return;
            }
            // create an event in a named calendar (iOS only for now)
            whichCalendarToSync = calendarToSync;
            if (whichCalendarToSync == 'null') { //yes it is a string
                return; //don't want to add to calendar
            } else {
                success(user);
                addedToSyncEvent(event.objectId, whichCalendarToSync).then(function(result) {
                    _autoSyncWithCalendar(false);
                }); //Add to Sync Calendar
                _setUserData(user); //keep the last selection handy for future use?
            }
            _setExistingEvents(event);
            console.log('Events in calendar: ' + JSON.stringify(_existingEvents));
        }; //eo addToCalendarMobile

        var addToCalendar = function(event) {
            var eventId = event.objectId;
            var ics, title, location, note, startDate, endDate;
            var success = function(message) {
                var eventId = event.objectId;
                markAsAddedToCalendar(eventId);
                reminderCalendarPicker.html("Already Added"); //selector is set around line #403
                reminderCalendarPicker.addClass('already-added');
                hasAddedToCalendar = true;
            };
            var calOptions = {};
            var rrule = '';
            var repeater = function() {
                var rule;
                var recurrence = event.repeat.trim().toLowerCase();
                var recurrenceEndDate;
                if (recurrence.indexOf('day') >= 0) {
                    recurrence = RRule.DAILY;
                } else if (recurrence.indexOf('week') >= 0) {
                    recurrence = RRule.WEEKLY;
                } else if (recurrence.indexOf('month') >= 0) {
                    recurrence = RRule.MONTHLY;
                } else if (recurrence.indexOf('year') >= 0) {
                    recurrence = RRule.YEARLY;
                } else {
                    recurrence = Infinity;
                }
                if (recurrence < Infinity) {
                    calOptions.recurrence = recurrence;
                    recurrenceEndDate = event.until;
                    recurrenceEndDate = moment(recurrenceEndDate, 'MM/DD/YY').toDate();
                    rule = new RRule({
                        freq: recurrence,
                        until: recurrenceEndDate
                    });
                    rrule = rule ? rule.toString() : '';
                }
            }; //eo repeater
            if (event.hasAddedToCalendar || hasAddedToCalendar) {
                _alert('Event:' + event.title + ' already added to calendar');
                return;
            }
            if (typeof event.startDateTime === 'string') {
                startDate = event.startDateTime;
                endDate = event.endDateTime;
            } else {
                startDate = event.startDateTime.iso;
                endDate = event.endDateTime.iso;
            }
            title = event.title;
            note = event.note;
            location = event.location;
            ics = window.ics();
            repeater();
            if ($.type(ics) == 'object') {
                ics.addEvent(title, note, location, startDate, endDate, rrule);
                ics.download();
                success();
            }
        }; //eo addToCalendar

        var enableEdit = function(event) { //edit event using data sitting in Chaplin.mediator.d; pass flag through redirectTo to create-controller.js which passes it on new-event-view.js
            _event = event; //keep the results handy for editing
            $("#editBtn").on('click', function(e) {
                //Chaplin.mediator.d = event;
                Chaplin.utils.redirectTo({
                    name: 'update-event',
                    params: {
                        type: 'edit',
                        event: event
                    }
                });
            }); //eo click
        }; //eo enableEdit

        var addTopIcon = function() {
            var el = _selectedIcon ? _selectedIcon : ''; //handle if null or none
            $('.center-icon-menu').append(el);
        }; //eo addTopIcon

        var loadEvent = function() { //load the event for display
            var user = _getUserData(); //localstorage user.data
            var events = _getUserEvents(); //localstorage user.data.events array
            var User, query;
            var _cal = _getUserCalendarItem(_selectedEventId); //localstorage user.data.calendar[] match against event id
            hasAddedToCalendar = _cal && _cal.hasAddedToCalendar ? true : false;
            whichCalendarToSync = 'null'; //always use 'Add To' as the default since the event will be added if a definite choice is made
            var reminderStr = '';
            var reminderSelect = ''; //which reminder btn clicked
            var event = _getUserEventsItem(_selectedEventId); //use localstorage method in utils #387
            var sender = null;
            var getSenderFromParse = function() { //don't have sender in localStorage, go up to Parse
                var _success = function(results) {
                    var sender = results[0];
                    if (!sender) {
                        error();
                        return;
                    }
                    _setEventSenderListItem(sender.objectId, sender);
                    success(results);
                    spinner.hide();
                }; //eo _success
                User = Parse.Object.extend("User", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                }); //Get sender name
                query = User.query();
                query.equalTo("objectId", event.senderId);
                query.find({
                    success: _success,
                    error: error
                });
                spinner.show();
            }; //eo getSenderFromParse
            var success = function(results) {
                var user, showPhoneList, getTemplateData;
                var start, end, startEndString;
                var repeat, reminder;
                var __cal = _cal;
                var phone;
                var setReminderPicker = function(id) {
                    var which = '';
                    var select = '#' + id + ' .reminder-val'; //which reminder string to read
                    reminderSelect = select; //which of the two fields we are currently working with
                    var which = $(select).text(); //the currently selected reminder string
                    prevSelectedRemindStr = which; //keep a copy in case of failure
                    which = which.trim().toLowerCase();
                    $('#remind-picker .time-wrapper .time div').each(function(i, el) { //hide all checkmarks
                        $(this).addClass('hidden');
                    });
                    switch (which) {
                        case 'never':
                            id = 0;
                            break;
                        case 'at time of event':
                            id = 1;
                            break;
                        case '5 minutes before':
                            id = 2;
                            break;
                        case '10 minutes before':
                            id = 3;
                            break;
                        case '15 minutes before':
                            id = 4;
                            break;
                        case '30 minutes before':
                            id = 5;
                            break;
                        case '1 hour before':
                            id = 6;
                            break;
                        case '2 hours before':
                            id = 7;
                            break;
                        case '4 hours before':
                            id = 8;
                            break;
                        case '1 day before':
                            id = 9;
                            break;
                        case '2 days before':
                            id = 10;
                            break;
                        case '1 week before':
                            id = 11;
                            break;
                        default:
                            id = 0;
                    } //eo switch over which repeat period selected
                    $('#remind-picker #remind-' + id + ' div').removeClass('hidden');
                    $('#remind-picker').removeClass('hidden');
                };
                var getReminderPicker = function(id) {
                    var char2clip = 7;
                    var which = id.substring(char2clip); //take just the numeric portion of the id: remind-N
                    which = +which; //convert to int
                    selectedRemindStr = 'Never';

                    function setLocalNotification(id, minutes) {
                        if (typeof event.startDateTime === 'string') { //updated event
                            var start0 = event.startDateTime;
                        } else {
                            var start0 = event.startDateTime.iso;
                        }
                        var o;
                        var date, message = '';
                        var when = moment(new Date(start0)).format('dddd MM/DD/YY h:mma');
                        var cancel = false;
                        var json = JSON.stringify({
                            objectId: event.objectId,
                            minutes: minutes,
                            startDate: start0
                        });
                        var success = function(status) {
                            var id = o.id;
                            var _o = {
                                    id: o.id,
                                    objectId: event.objectId,
                                    minutes: minutes,
                                    startDate: start0,
                                    date: o.date,
                                    message: o.message
                                }
                                //_alert( status);
                            _setUserRemindersItem(id, _o);
                        }; //eo success
                        var failure = function(status) {
                            console.log("Change event remidner: " + status);
                        }; //eo promise failure
                        if (minutes < 0) {
                            date = when;
                            cancel = true;
                        } else {
                            date = moment(new Date(start0)).subtract(minutes, 'minutes').toDate();
                            message = event.title + ' on ' + when;
                            message = event.location && event.location.length > 0 ? message + ' @ ' + event.location : message;
                        }
                        o = {
                            id: id,
                            at: date,
                            title: 'ParentPlanet Reminder',
                            message: message,
                            json: json
                        };
                        $.when(_setUserLocalNotification(o, cancel)).then(success, failure); //use a promise to handle
                    };

                    function setSelection(str, minutes) {
                        var o = {};
                        var remindAt;
                        var id = selectedRemindId.indexOf('2') < 0 ? event.objectId : event.objectId + '_r2';
                        id = _hashCode(id); //new notifications api uses numbers//.toString();//new notifications api uses numbers
                        selectedRemindStr = str;
                        selectedRemindMinutes = minutes;
                        $(reminderSelect).text(selectedRemindStr);
                        $("#remind-picker").addClass("hidden"); //do this first in case there is an error
                        var eventReminder = reminderSelect.indexOf('2') == -1 ? 'reminder' : 'reminder2';
                        event[eventReminder] = selectedRemindStr;
                        _setUserEventsItem(event.objectId, event);
                        setLocalNotification(id, minutes);
                    };
                    switch (which) {
                        case 0:
                            setSelection('Never', -1);
                            break;
                        case 1:
                            setSelection('At Time of Event', 1);
                            break;
                        case 2:
                            setSelection('5 Minutes Before', 5);
                            break;
                        case 3:
                            setSelection('10 Minutes Before', 10);
                            break;
                        case 4:
                            setSelection('15 Minutes Before', 15);
                            break;
                        case 5:
                            setSelection('30 Minutes Before', 30);
                            break;
                        case 6:
                            setSelection('1 Hour Before', 60);
                            break;
                        case 7:
                            setSelection('2 Hours Before', 120);
                            break;
                        case 8:
                            setSelection('4 Hours Before', 480);
                            break;
                        case 9:
                            setSelection('1 Day Before', 1440);
                            break;
                        case 10:
                            setSelection('2 Days Before', 2880);
                            break;
                        case 11:
                            setSelection('1 Week Before', 10080);
                            break;
                        default:
                            setSelection('Never', -1);
                    } //eo switch over which repeat period selected
                };
                //    $("#spinner").addClass("hidden");
                if (results.length == 0) {
                    $("#sender").html('Name not available');
                } else {
                    user = results[0];
                    showPhoneList = false;
                    getTemplateData = View.getTemplateData;

                    $("#sender").html(user.get("firstName") + " " + user.get("lastName"));
                    _contact['showEmail'] = user.get("showEmail");
                    _contact['email'] = user.get("email");

                    if (_contact['showEmail']) {
                        $('#emailto').show();
                        $('#emailto').attr('href', 'mailto:' + _contact['email']);
                    }

                    /*
                        Move by: phuongnh@vinasource.com
                        fix issue link map can't working
                    */

                    _contact['showMobilePhone'] = user.get("showMobilePhone");
                    showPhoneList = showPhoneList || _contact['showMobilePhone'];
                    _contact['mobilePhone'] = user.get("mobilePhone");
                    _contact['showWorkPhone'] = user.get("showWorkPhone");
                    showPhoneList = showPhoneList || _contact['showWorkPhone'];
                    _contact['workPhone'] = user.get("workPhone");
                    _contact['showHomePhone'] = user.get("showHomePhone");
                    showPhoneList = showPhoneList || _contact['showHomePhone'];
                    _contact['homePhone'] = user.get("homePhone");
                    _contact['showPhoneList'] = showPhoneList; //overall show

                    if (_contact['showMobilePhone']) {
                        if (_contact.mobilePhone) {
                            phone = _contact.mobilePhone;
                        } else if (_contact.workPhone) {
                            phone = _contact.workPhone;
                        } else if (_contact.homePhone) {
                            phone = _contact.homePhone;
                        }
                        if (phone) {
                            phone = phone.replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, '');
                            $('#smsto').attr("href", "sms://" + phone);
                            // $('#smsto').show(); //do not show if not on mobile device
                        }
                    } //eo phone

                    if (isMobile && _contact['showMobilePhone']) {
                        $('#smsto').show();
                    }

                    if (showPhoneList) {
                        $("#phoneto").show();
                        $("#phoneto").on('click', function(e) {
                            var o = calendarView.getTemplateData(); //use closure to grab the data from the view
                            _dropdown(phonelistTemplate, o); //show the dropdown
                        });
                    } //eo showPhoneList
                } //eo have results
                if (event.isCanceled) {
                    $("#title").html('CANCELED: ' + event.title);
                } else {
                    $("#title").html(event.title);
                }
                $("#message").html(event.note);
                if (typeof event.startDateTime === 'string') { //updated event
                    start = moment(new Date(event.startDateTime)).format('dddd MM/DD/YY ');
                    end = moment(new Date(event.endDateTime)).format('dddd MM/DD/YY ');
                    end = start == end ? " until " + moment(new Date(event.endDateTime)).format('h:mma') : " To: " + end + " until " + moment(new Date(event.endDateTime)).format('h:mma');
                    start = start + " from " + moment(new Date(event.startDateTime)).format('h:mma');
                } else {
                    start = moment(new Date(event.startDateTime.iso)).format('dddd MM/DD/YY ');
                    end = moment(new Date(event.endDateTime.iso)).format('dddd MM/DD/YY ');
                    end = start == end ? " until " + moment(new Date(event.endDateTime.iso)).format('h:mma') : " To: " + end + " until " + moment(new Date(event.endDateTime.iso)).format('h:mma');
                    start = start + " from " + moment(new Date(event.startDateTime.iso)).format('h:mma');
                }
                $("#starts").html(start + end);
                if (event.location.length) {
                    $("#location #maplink").html(event.location);
                    $("#map-detail").show();
                    $("#maplink").on("click", function(e) {
                        console.log('clicked on map link', event.location);
                        var href = encodeURI(event.location);
                        href = _googleMaps + href;
                        // var href = 'http://maps.google.com/?q=1200%20Pennsylvania%20Ave%20SE,%20Washington,%20District%20of%20Columbia,%2020003';
                        // var ref = window.open(href, '_system', 'location=no');
                        /*
                            Change by: phuongnh@vinasource.com
                            when use window.open, app can't back to app
                        */
                        console.log('href:' + href);
                        var ref = cordova.InAppBrowser.open(href, '_system', 'location=no');
                    });
                }
                //handle repeat data
                repeat = event.repeat.trim().toLowerCase();
                if (repeat.length > 0 && repeat !== 'never') {
                    $('#reminder-repeat').html(event.repeat);
                    $('#repeat-detail').removeClass('hidden');
                }
                //handle reminder data
                reminderStr = event.reminder ? event.reminder : 'Never';
                $("#reminder-reminder .reminder-val").text(reminderStr);
                reminderStr = event.reminder2 ? event.reminder2 : 'Never';
                $("#reminder-reminder2 .reminder-val").text(reminderStr);
                //show items
                $("#creator-detail, #event-detail, #message-detail, #reminder-detail, #calendar-detail").removeClass("hidden");
                //set the whichCalendarToSync
                //isMobile ? $('#reminder-calendar-picker').val(whichCalendarToSync) : $.noop();
                //reminders
                $("#reminder-detail, #reminder2-detail").on('click', function(e) {
                    selectedRemindId = e.currentTarget.id;
                    setReminderPicker(selectedRemindId);
                });
                $("#remind-picker .time-wrapper .time").on('click', function() {
                    getReminderPicker(this.id);
                });
                reminderCalendar = $("#calendar-detail"); //sxm addTo or Sync
                reminderCalendarPicker = $('#reminder-calendar');
                if (hasAddedToCalendar) {
                    reminderCalendarPicker.html("Already Added");
                    reminderCalendarPicker.addClass('already-added');
                } else {
                    if (isMobile) {
                        //$('#reminder-calendar-picker').change(function() {
                        //  addToCalendarMobile(event);
                        // var eventId = event.objectId;
                        // _autoSyncWithCalendar([_selectedEventId], [eventId]);
                        // reminderCalendarPicker.html("Already Added"); //selector is set around line #403
                        // reminderCalendarPicker.addClass('already-added');
                        // hasAddedToCalendar = true;
                        //});
                    } else {
                        reminderCalendar.on("click", function() {
                            addToCalendar(event);
                        }); //eo click on add to calendar
                    } //eo isMobile
                } //eo hadAddedToCalendar
                enableEdit(event); //let the user edit test
                //       spinner.stop();
            }; //eo success
            var error = function(error) {
                //Hide spinner
                //     spinner.stop();
                _alert("Error: " + error.code + " " + error.message);
            }; //eo error
            if (!event || !event.senderId) {
                _alert('Error: loadEvent, unable to find:' + _selectedEventId + ' in cache');
                return;
            }
            /*
            User = Parse.Object.extend("User");   //Get sender name
            query = new Parse.Query(User);
            query.equalTo("objectId", event.senderId);
            */
            sender = _getEventSenderListItem(event.senderId);
            if (!sender) {
                getSenderFromParse();
            } else {
                /*
                 * Edit by phuongnh@vinasource.com
                 * With new version Parse Server, Parse.Object.extend will return to Object not Json data
                 */
                //  User = Parse.Object.extend("User");   //Get sender name
                // User = new User(); //Get sender name
                // User.id = sender.objectId;
                // User.attributes = sender;
                User = new Parse.Object("User", sender); //Get sender name
                success([User]);
            }
            //   getSenderFromParse();
            //  spinner = _createSpinner('spinner');
            //  query.find({success: success,     error: error    });
        }; //eo loadEvent
        var permission = function() { // see if user has permission to edit event
            var event = _getUserEventsItem(_selectedEventId);
            if (event.isCanceled) {
                // Don't allow user to edit canceled event.
                return;
            }

            var user = _getUserData();
            var selectedOrgGroupId = event.orgIdForThisObject;
            var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = OrganizationGroup.query();
            var success = function(results) {
                if (results.length === 0) {
                    return;
                }
                var group = results[0];
                var adminJsonList = group.get("adminJsonList");
                if (adminJsonList[user.id] == "Admin" || adminJsonList[user.id] ==
                    "Faculty") {
                    $("#editBtn").removeClass("hidden");
                } else {
                    var orgId = group.get("organizationId");
                    var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserOrganizationRelation.query();
                    query.equalTo("organizationId", orgId);
                    query.equalTo("userId", user.id);
                    query.find({
                        success: function(results) {
                            if (results.length > 0) {
                                var orgRelation = results[0];
                                var permission = orgRelation.get("permission");
                                if (permission == "admin" || permission == "faculty") {
                                    $("#editBtn").removeClass("hidden");
                                    return;
                                }
                            }
                        },
                        error: function(err) {
                            error(err);
                        }
                    }); //ep query.find
                }
            }; //eo success
            var error = function(error) {
                spinner.hide();
                _alert('Permissions error:' + err.message);
            };
            if (user.isAdmin || (user.id == event.senderId)) {
                $("#editBtn").removeClass("hidden");
            } else {
                query.equalTo("objectId", selectedOrgGroupId);
                query.find({
                    success: success,
                    error: error
                }); //eo query.find
            }
        }; //eo permission
        var updateIsReadParse = function() {
            var user = _getUserData();
            var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserEventRelation.query();
            query.equalTo('parentId', user.id);
            query.equalTo('eventId', _selectedEventId);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        return;
                    }
                    var relation = results[0];
                    relation.set('isRead', true);
                    relation.save();
                },
                error: function(err) {

                }
            });
        }; //eo updateIsReadParse
        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {
            //   markAsRead();
            //   setEvent("isRead", true);
            if (!_selectedEventId) {
                _alert('Internal Error: No SelectedEventId');
                switch (_view.previousView) {
                    case _view.HOME:
                        Chaplin.utils.redirectTo({
                            name: 'home'
                        });
                        break;
                    case _view.CALENDAR_INDEX:
                        Chaplin.utils.redirectTo({
                            name: 'calendar'
                        });
                        break;
                    default:
                        Chaplin.utils.redirectTo({
                            name: 'calendar'
                        });
                        break;
                } //eo switch
            }
            updateReadEvent();
            addTopIcon();
            loadEvent();
            permission();
            _checkUnreadEvent(); //update counter always!
            $("#addToCalendar").on('click', function() {
                _showCalendarPicker("None", addToCalendarMobile);
            });
            $("#backBtn").on('click', function(e) {
                switch (_view.previousView) {
                    case _view.HOME:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'home'
                        });
                        break;
                    case _view.SCHEDULE_INDEX:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'calendar'
                        });
                        break;
                    default:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'calendar'
                        });
                        break;
                }
            }); //eo backBtn click
            updateIsReadParse();
        }; //eo addedToDOM
        var __id = 'schedule-single-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            id: __id,
            container: '#main-container',
            className: 'inner-container calendar-view',
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                _setCurrentView(_view.SINGLE_SCHEDULE, __id);
                $("#footer-toolbar > li").removeClass("active"); //Reset footer
                isMobile = _isMobile(); //are we on the mobile platform
                // isMobile = true; //debugging sxm
                Chaplin.View.prototype.initialize.call(this, arguments);
                calendarView = this;
            },
            getTemplateData: function() {
                return {
                    mobile: isMobile,
                    calendars: '',
                    contact: _contact
                }; //send data to template
            }
        });

        return View;
    });
