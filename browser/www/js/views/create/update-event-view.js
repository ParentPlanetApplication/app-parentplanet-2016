define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/create/update-event-view.hbs',
        'jquery',
        'backbone.touch',
        'parse',
        'parseproxy',
        'moment',
        'spinner',
        'picker',
        'eventService',
        'userService'
    ],
    function(Chaplin, View, Template, $, touch, Parse, ParseProxy, moment, spinner, picker, eventService, userService) {
        'use strict';

        var redirectPage = function() { //Redirect to another page once a new message is created
            _isRedirect = true;
            refeshDataUpdateEvent();
            setTimeout(function() {
                spinner.hide();
                Chaplin.utils.redirectTo({
                    name: 'calendar'
                });
            }, 2000);
        }; //eo redirectPage

        moment().format('L');
        //various 'locals'
        var pickadateCalendar = null;
        var isMobile = false;
        var isEdit = false;
        var roundMinutes = function(date) {
            date.setHours(date.getHours() + Math.round((date.getMinutes() + 30) / 60));
            date.setMinutes(0);
            return date;
        }; //eo roundMinutes
        var selectedRepeatStr = "Never";
        var selectedRemindId = '';
        var selectedRemindStr = "Never";
        var selectedRemindMinutes = -1;
        var momentFormat = 'MMM D, h:mm A';
        var momentDateFormat = 'MM/DD/YY';
        var momentTimeFormat = 'H:mm A';
        var momentDateTimeFormat = 'MM/DD/YY hh:mm A';
        var isStartReady = false;
        var isEndReady = false;
        var _startDate = null,
            _endDate = null;
        var _startDateDate, _startDateTime;
        var _endDateDate, _endDateTime;
        var startClick = $.noop; //empty function
        var endClick = $.noop;
        var toggleAllDay = false; //set to handle date picker(s)
        var _isCanceled = false;
        var done = $.noop; //noop until it is defined in addedToDOM
        var _untilDate = null;
        var newInitialStartDate = null;
        var modifyEvent = {};
        var defaults = {
            title: '',
            location: '',
            isAllDay: false,
            repeat: 'Never',
            reminder: 'Never',
            reminder2: 'Never',
            note: '',
            sendToCustomListId: '',
            isCanceled: false,
            startDateTime: moment(new Date()).startOf('hour').add(1, 'hours').toDate(), //local init setup
            endDateTime: moment(new Date()).startOf('hour').add(2, 'hours').toDate()
        }; //eo defaults

        var untilClick = $.noop; //set until datapicker
        var getUserCustomListItem = function(d) { //given objectId, return full userCustomList item
            var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserCustomList.query();
            query.equalTo("objectId", d);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        _alert('Edit event internal error, no group found for id:' + d);
                        _selectedCustomListName = null;
                    } else {
                        //Collect list of message ids
                        _selectedCustomListName = results[0].attributes.name;
                        $("#sendto").html(_selectedCustomListName);
                        $("#sendto").addClass("right-text");
                        $("#sendto").removeClass("right-arrow");
                    }
                },
                error: function(err) {
                    _alert('Edit event internal error:' + err);
                    console.log('Edit event internal error:' + err);
                    _selectedCustomListName = null;
                }
            });
        }; //eo getUserCustomListItem

        var setFieldData = function(d) {
            var date = null; //date objects being returned from Parse are a little funny, be careful!
            var userCustomListData = null;
            $("#title").val(d.title);
            $("#location").val(d.location);
            $('#allDay').prop('checked', d.isAllDay);
            $("#repeat").text(d.repeat);
            $("#reminder").text(d.reminder);
            $("#reminder2").text(d.reminder2);
            $("#note").val(d.note);
            if (typeof d.startDateTime === 'string') {
                date = new Date(d.startDateTime); //events updated after last login
            } else {
                date = new Date(d.startDateTime.iso); //format the date correctly using the .iso string
            }
            _startDate = date;
            $("#start").html(moment(date).format(momentFormat)); //don't use touch... label
            if (typeof d.startDateTime === 'string') {
                date = new Date(d.endDateTime); //events updated after last login
            } else {
                date = new Date(d.endDateTime.iso); //format the date correctly using the .iso string
            }
            _endDate = date;
            $("#end").html(moment(date).format(momentFormat)); //don't use touch... label
            _selectedCustomListId = d.sendToCustomListId; //set global
            getUserCustomListItem(_selectedCustomListId);
        }; //eo setFieldData
        //if edit event populate the view with event data
        var editEvent = function() {
            _event = $.extend(defaults, _event);
            setFieldData(_event);
            var deferred = null;
            var cancelSuccess = function() {
                _isCanceled = true;
                done();
            };
            var cancelFailure = function() {
                _alert('Error: Unable to cancel this event.')
                _isCanceled = false;
            };
            var cancelEvent = $('#cancel-event');
            cancelEvent.show();
            cancelEvent.on('click', function(e) { //handle the cancel button
                deferred = _confirm('Do you want to cancel this event, this cannot be undone?');
                deferred.done(cancelSuccess).fail(cancelFailure); //use a promise because this is async!
            });
        }; //eo editEvent
        //when the DOM has been updated let gumby reinitialize UI modules
        var refeshDataUpdateEvent = function() {
            _refreshNotiBadges(); //clear the counts
            _checkUnreadMessages();
            _checkUnreadEvent();
            _checkUnreadHomework();
        };
        var backCancelBtnClick = function(e) {
            _closeByKeyboard();
            _selectedCustomListId = null;
            _selectedCustomListName = null;
            _event = {}; //clean up
            switch (_view.previousView) {
                case _view.HOME:
                    Chaplin.utils.redirectTo({
                        name: 'home'
                    });
                    break;
                case _view.SCHEDULE_INDEX:
                    Chaplin.utils.redirectTo({
                        name: 'calendar'
                    });
                    break;
                case _view.MESSAGES_INDEX:
                    Chaplin.utils.redirectTo({
                        name: 'message'
                    });
                    break;
                case _view.HOMEWORK_INDEX:
                    Chaplin.utils.redirectTo({
                        name: 'homework'
                    });
                    break;
                case _view.CREATION:
                    Chaplin.utils.redirectTo({
                        name: 'create'
                    });
                    break;
                default:
                    Chaplin.utils.redirectTo({
                        name: 'home'
                    });
                    break;
            }; //eo switch
        }; //backCancelBtnClick
        var checkModifyEvent = function() {
            var Event = Parse.Object.extend("Event", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = Event.query();
            var objectId = _event.objectId;
            query.equalTo("objectId", objectId);
            query.find({
                success: function(event) {
                    event[0].get("isModifySingleEvent") !== undefined && event[0].get("isModifySingleEvent") ?
                        (function() {
                            $("#repeat").parent('.create-menu-item').hide();
                        })() : "";
                },
                error: function(error) {
                    console.log("Error load Event: " + error);
                }
            });
        };
        var addedToDOM = function() {
            //dates and times
            var isStartReady = false;
            var startDate = null;
            var isEndReady = false;
            var endDate = null;
            var allday = false;
            var reminderSelect = ''; //which reminder btn clicked
            var untilDate = null;
            var initEventData = function() {
                _event = _event || {};
                var _title = _event.title || "";
                var _location = _event.location || "";
                var _isAllDay = _event.isAllDay || false;
                toggleAllDay = _isAllDay;
                var _startDate0 = _event.startDate || null;
                var _endDate0 = _event.endDate || null;
                var _untilDate0 = _event.untilDate || null;
                var _repeat = _event.repeat || "Never";
                var _reminder = _event.reminder || "Never";
                var _reminder2 = _event.reminder2 || "Never";
                var _note = _event.note || "";
                var _sendToCustomListId = _event.sendToCustomListId || "";
                _isCanceled = _event.isCanceled;
                var cancelEvent = $('#cancel-event');
                $("#title").val(_title);
                $("#location").val(_location);
                allday = $('#allDay').prop('checked', _isAllDay);
                startDate = _startDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                endDate = _endDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                untilDate = _untilDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                // console.log('initEventData start/endDate:',startDate,endDate);
                var repeat = $("#repeat").text(_repeat);
                var reminder = $("#reminder").text(_reminder);
                var reminder2 = $("#reminder2").text(_reminder2);
                var _confirm = false;
                $("#note").val(_note);
                showRepeatUntil(_event); // show repeat until
                newInitialStartDate = _event.startDateTime.iso;
            }; //eo initEventData
            var getDateTime = function() {
                if (isMobile) {
                    _startDate = $('#start').text();
                    startDate = moment(_startDate, momentFormat).toDate();
                    _endDate = $('#end').text();
                    endDate = moment(_endDate, momentFormat).toDate();
                } else {
                    _startDate = $('#start').val() + ' ' + $('#start-time').val();
                    startDate = moment(_startDate, momentDateTimeFormat).toDate();
                    _endDate = $('#end').val() + ' ' + $('#end-time').val();
                    endDate = moment(_endDate, momentDateTimeFormat).toDate();
                }
                console.log("html start: " + _startDate);
                console.log("html end: " + _endDate);
                console.log("format: " + momentDateTimeFormat);
                console.log('done start, end', startDate.toString(), endDate.toString());
            }; //eo getDateTime
            var saveFieldData = function() {
                var title = $("#title").val();
                var location = $("#location").val();
                var allday = $('#allDay').prop('checked');
                var repeat = $("#repeat").html();
                var reminder = $("#reminder").html();
                var reminder2 = $("#reminder2").html();
                var note = $("#note").val();
                var until = isMobile ? $('#repeat-until').text() : $('#repeat-until').val();
                var untilDate = moment(until, 'MM/DD/YY').toDate();
                //store current event data for another day and copy it to the mediator.d
                //start and endDates taken from scope level start/endDate variables; convert to string so that we can make a copy to hold onto
                $.extend(_event, {
                    title: title,
                    location: location,
                    allday: allday,
                    startDate: startDate, //date objects
                    endDate: endDate,
                    until: until,
                    untilDate: untilDate,
                    repeat: repeat,
                    reminder: reminder,
                    reminder2: reminder2,
                    note: note,
                    isCanceled: _isCanceled //get value from global scope where it can be set
                });
                console.log('Start Date: ' + _event.startDate);
                console.log('End Date: ' + _event.endDate);
                //console.log('initEventData title _event.start/endDate:',title, _event.startDate,_event.endDate);
                //Chaplin.mediator.d = $.extend({}, _event); //make a copy, DONT simply bind the reference!
            }; //eo saveFieldData

            var setReminderPicker = function(id) {
                var which = '';
                var select = '#' + id; //which reminder string to read
                reminderSelect = select;
                var which = $(select).text();
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
            }; //eo setReminderPicker
            //original, new one sets a reminder
            var getReminderPicker = function(id) {
                var char2clip = 7;
                var which = id.substring(char2clip); //take just the numeric portion of the id: remind-N
                which = +which; //convert to int
                selectedRemindStr = 'Never';

                function setSelection(str, minutes) {
                    selectedRemindStr = str;
                    selectedRemindMinutes = minutes;
                    $(reminderSelect).text(selectedRemindStr);
                    $("#remind-picker").addClass("hidden");
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
            }; //eo getReminderPicker
            //show or hide repeat until
            var showRepeatUntil = function(event) {

                var tagsRepeat = $("#repeat-picker > .box-wrapper > .time-wrapper > .time");
                _updateSelectedRepeat(event.repeat, tagsRepeat);

                if (event.repeat.trim() != 'Never') {
                    $("#until").removeClass("hidden");
                    isMobile ? $('#repeat-until').text(moment(event.until).format('M/DD/YY')) : $('#repeat-until').val(moment(event.until).format('M/DD/YY'));
                }
            };
            var transformEditedEvent = function(event) {
                var repeatId = chance.string({
                    length: 12,
                    pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                });
                var firstRepeat = _firstRepeat();
                event.set('repeatId', repeatId + firstRepeat);
            };

            var selectedCustomList = function(eventType) {
                var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                var user = _getUserData();
                var query = UserCustomList.query();
                query.equalTo("ownerId", user.id);
                query.equalTo("objectId", _selectedCustomListId);
                query.find({
                    success: function(results) {
                        console.log(results);
                        if (results.length != 0) {
                            var userCustomListData = results[0];
                            var selectedCustomListData = userCustomListData.attributes;
                            console.log(selectedCustomListData);
                            console.log(selectedCustomListData.nonUserContactEmail.length);
                            console.log(selectedCustomListData.userContactId.length);
                            console.log(selectedCustomListData.userContactEmail.length);
                            if (selectedCustomListData.nonUserContactEmail.length > 0 || selectedCustomListData.userContactId.length > 0 || selectedCustomListData.userContactEmail.length > 0) {
                                //alert("Please wait for the cloud code component to be finished in order to send messages to non-existing contacts.");
                                spinner.show();
                                var data = {
                                    "allDay": _event.allday,
                                    "end": endDate,
                                    "location": _event.location,
                                    "note": _event.note,
                                    "repeat": _event.repeat,
                                    "until": _event.untilDate,
                                    "start": startDate,
                                    "title": _event.title
                                };
                                console.log(data);
                                var nonUserContactEmail = selectedCustomListData.nonUserContactEmail;
                                var userContactEmail = selectedCustomListData.userContactEmail;
                                var allEmailArray = nonUserContactEmail.concat(userContactEmail);
                                //var data = {"allDay":true,"end":"Thurs","location":"617 Memak Road","note":"too fun","repeat":"monthly","start":"Wed","title":"Test 1"};
                                //Create new Email object on parse to trigger cloud code
                                var Email = Parse.Object.extend("Email");
                                var email = new Email();
                                email.set("type", eventType);
                                email.set("recipientAddress", allEmailArray);
                                email.set("data", data);
                                email.set("customListId", selectedCustomListData.objectId);
                                email.set("customListName", selectedCustomListData.name);
                                email.set("groupId", selectedCustomListData.groupId);
                                email.set("organizationId", selectedCustomListData.organizationId);
                            }
                            email.save(null, {
                                success: function(email) {
                                    console.log(email);
                                },
                                error: function(email, error) {
                                    // Execute any logic that should take place if the save fails.
                                    // error is a Parse.Error with an error code and message.
                                    spinner.hide();
                                    alert('Failed to send emails, with error: ' + error.message);
                                }
                            });
                        }
                    },
                    error: function(err) {}
                });
            }; //eo selectedCustomList


            /*
             *   MAIN DONE ACTION HERE
             */
            done = function(e) {
                //Update event on the server
                var title = '';
                var Event = Parse.Object.extend("Event", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                // var query = new Parse.Query(Event);
                var query = Event.query();
                var objectId = _event.objectId; //?
                var relation = []; //use to update native calendar

                var getRecipients = function(event) {
                    //1. Pull UserEventRelation to get recipient list
                    var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserEventRelation.query();
                    query.equalTo("eventId", event.id);
                    query.find({
                        success: function(results) {
                            //Collect user id here
                            var parentIdList = [];
                            var parentId;
                            for (var i = 0; i < results.length; i++) {
                                var eventRelation = results[i];
                                parentId = results[i].get("parentId");
                                if (parentIdList.indexOf(parentId) == -1) {
                                    parentIdList.push(parentId);
                                }
                                eventRelation.set("isUpdated", true);
                                eventRelation.set("isRead", false);
                                eventRelation.save();
                            } //eo array of push recipients

							userService.getLinkedAccountUserIds(parentIdList).then(
								function(linkedUserIds) {
									parentIdList = parentIdList.concat(linkedUserIds);
									sendUpdatePush(parentIdList, event);
								},
								function() {
									deferred.reject();
								}
							);

                            relation.push(results[0]);
                            // isMobile ? _autoSyncWithCalendar([event], relation) : console.log('Webapp'); //sync update to native calendar
                        },
                        error: function(error) {
                            _alert("Error update event: " + error);
                            spinner.hide();
                        }
                    });
                }; //eo getRecipients
                var sendUpdatePush = function(userIdArray, event) {
                    //Send push notification for target audiences
                    var queryIOS = new Parse.Query(Parse.Installation);
                    queryIOS.containedIn('userId', userIdArray);
                    var pushSuccess = function() { // Push was successful
                        console.log("Push Notification sent for event update");
                        //redirectPage();
                    };
                    var pushFailure = function(error) {
                        _alert('Error: unable to send notification; ' + error);
                        console.log('Error: unable to send notification; ', error);
                    };
                    var canceled = event.get('isCanceled');
                    var eventType = canceled ? "cancel" : "update";
                    var alert = canceled ? 'Event Canceled: ' : 'Event Updated: ';
                    //alert += event.get("title").substring(0, 80) + "..."; set on line 362
                    /*
                        Add by phuongnh@vinasource.com
                        set push type for check when listen event receive push notification from app
                     */
                    Parse.Push.send({ //when push comes in then remove from native calendar
                        where: queryIOS,
                        data: {
                            alert: alert + title.substring(0, 200),
                            badge: 1,
                            type: _Event_Type,
                            sound: "default",
                            'content-available': 1, //Request clients to trigger background fetch
                            sender: Parse.User.current().id,
                            objectId: event.id,
                            eventType: eventType
                        }
                    }, {
                        useMasterKey: true,
                        success: pushSuccess,
                        failure: pushFailure
                    }); //eo Parse.Push
                }; //eo sendUpdatePush

                spinner.show();

                getDateTime();
                saveFieldData(); //hold on to the data while validating
                selectedCustomList(_isCanceled ? 'cancel' : 'update');

                title = _event.title || ''; //set in saveFieldData!
                title = title.length > 160 ? title.substring(0, 160) + '...' : title;
                title = title + ' @ ' + moment(startDate).format('h:mma on MMM Do');
                console.log(title);
                query.equalTo("objectId", objectId);
                query.find({
                    success: function(results) {
                        var event = results[0];

                        var showConfirmMessage = function(localEvent, serverEvent) {
                            var deferred = $.Deferred();

                            function areRecurringDataModified(localEvent, serverEvent) {
                                return localEvent.repeat != serverEvent.get('repeat') ||
                                    _isRepeat(localEvent.repeat) &&
                                    moment(localEvent.untilDate).startOf('Day').toDate().getTime() != moment(serverEvent.get('untilDate')).startOf('Day').toDate().getTime();
                            }

                            if (_isRepeat(serverEvent.get('repeat')) && _isRepeat(localEvent.repeat)) {
                                if (!areRecurringDataModified(localEvent, serverEvent)) {
                                    _yesno("Save this event only or future events?", "This event", "Future events").done(function(isYes) {
                                        //autoSyncCalendarFunc(); // auto sign calendar when update
                                        deferred.resolve(isYes ? UpdateOption.ThisEvent : UpdateOption.AllFutureEvents);

                                    }).fail(function() {
                                        //autoSyncCalendarFunc(); // auto sign calendar when update
                                        deferred.reject();

                                    });
                                    return deferred;
                                } else {
                                    //autoSyncCalendarFunc(); // auto sign calendar when update
                                    deferred.resolve(UpdateOption.AllFutureEvents);
                                    return deferred;
                                }
                            }
                            //autoSyncCalendarFunc(); // auto sign calendar when update
                            deferred.resolve(UpdateOption.ThisEvent);
                            return deferred;
                        }

                        showConfirmMessage(_event, event).done(function(option) {
                            eventService
                                .updateEvent(_event, event, option)
                                .then(function(updatedEvent) {
                                    getRecipients(updatedEvent);
                                    autoSyncCalendarFunc(); // auto sign calendar when update
                                })
                                .then(redirectPage);
                        });
                        spinner.hide();
                    }, //eo find success
                    error: function(error) {
                        alert("Error: " + error.code + " " + error.message);
                    }
                }); //eo query.find

            }; //eo done

            //create the time widgets
            //http://www.timlabonne.com/2013/07/parsing-a-time-string-with-javascript/
            //timeStr = time string to parse
            //return dt = date object with time set to the input timeStr, or current date with it if no dt
            var parseTime = function(timeStr, dt) { //parse the time string value and modify the input date with it
                var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
                if (!dt) {
                    dt = new Date();
                }
                if (!time) {
                    return NaN;
                }
                var hours = parseInt(time[1], 10);
                if (hours == 12 && !time[3]) {
                    hours = 0;
                } else {
                    hours += (hours < 12 && time[3]) ? 12 : 0;
                }
                dt.setHours(hours);
                dt.setMinutes(parseInt(time[2], 10) || 0);
                dt.setSeconds(0, 0);
                return dt;
            }; //eo parseTime

            //click handlers
            $("#doneBtn").on('click', done);
            $("#backBtn").on('click', function(e) {
                backCancelBtnClick(e);
            }); //eo #backBtn click
            $("#repeat").on('click', function() {
                $("#repeat-picker").removeClass("hidden");
            });
            $("#repeat-cancel").on('click', function() {
                $("#repeat-picker").addClass("hidden");
            });
            // $("#reminder").on('click', function() {    $("#reminder-picker").removeClass("hidden");    });
            // $("#reminder2").on('click', function() {    $("#reminder-picker").removeClass("hidden");    });
            $("#reminder, #reminder2").on('click', function(e) {
                selectedRemindId = e.currentTarget.id;
                setReminderPicker(e.currentTarget.id);
            }); //eo #reminder, #reminder2 click
            // $("#reminder-cancel").on('click', function() {    $("#reminder-picker").addClass("hidden");    });
            $("#repeat-ok").on('click', function() {

                var newStartDateTime = isMobile ? newInitialStartDate : $("#start").val();
                $("#repeat-picker").addClass("hidden");
                $("#repeat").html(selectedRepeatStr);

                //show or hide repeat until
                if (selectedRepeatStr === 'Never') {
                    $("#until").addClass("hidden");
                    var repeatUtil = moment(newStartDateTime).format('M/DD/YY');
                } else {
                    var repeatUtil = moment(newStartDateTime).add(2, 'M').format('M/DD/YY');
                    $("#until").removeClass("hidden");

                    isMobile ? $('#repeat-until').html(moment(new Date(repeatUtil)).format('MM/DD/YY')) : $('#repeat-until').val(repeatUtil);
                }
            });
            $("#repeat-picker > .box-wrapper > .time-wrapper > .time").on('click', function() {
                $("#repeat-picker > .box-wrapper > .time-wrapper > .time > .checked").addClass("hidden");
                $(this).children(".checked").removeClass("hidden");
                selectedRepeatStr = $(this).children("span").html();
            });
            // $("#reminder-ok").on('click', function() {
            //     $("#reminder-picker").addClass("hidden");
            //     $("#reminder").html(selectedReminderStr);
            // });
            // $("#reminder-picker > .box-wrapper > .time-wrapper > .time").on('click', function() {
            //     $("#reminder-picker > .box-wrapper > .time-wrapper > .time > .checked").addClass("hidden");
            //     $(this).children(".checked").removeClass("hidden");
            //     selectedReminderStr = $(this).children("span").html();
            // });
            $("#remind-picker .time-wrapper .time").on('click', function() {
                getReminderPicker(this.id);
            });
            //Init all-day button TODO: move into setupMobile and write equiv. for webapp
            $("#allDayToggle").on('click', function(e) {
                var flag = $('#allDay').prop('checked');
                var startDateTimeString, endDateTimeString;
                if (flag) { //rebind click handling TODO: setup start/endClick for webapp?
                    allday = true;
                    _startDate = new Date().setHours(0, 0, 0, 0);
                    _startDate = moment(_startDate);
                    startDateTimeString = _startDate.format(momentFormat);
                    _startDate = _startDate.toDate();
                    $("#start").html(startDateTimeString);
                    _endDate = new Date().setHours(23, 59, 59, 0);
                    _endDate = moment(_endDate);
                    endDateTimeString = _endDate.format(momentFormat);
                    _endDate = _endDate.toDate();
                    $("#end").html(endDateTimeString);
                    isStartReady = true;
                    isEndReady = true;
                    toggleAllDay = true;
                } else {
                    allday = false;
                    toggleAllDay = false;
                } //eo else if(allday)
                console.log('toggleAllDay', toggleAllDay);
            }); //eo allDayToggle

            //handle date/time entry depending on which platform we are using
            var setupMobile = function() {
                var delta = 0; //!this is the critical variable,
                var startDateTime;
                var endDateTime;
                var startDateTimeString;
                var endDateTimeString;
                var untilDateTime;
                var untilDateTimeString;
                if (typeof _event.startDateTime === 'string') { //updated after last login
                    startDateTime = _event.startDateTime;
                    endDateTime = _event.endDateTime;
                } else {
                    startDateTime = _event.startDateTime.iso;
                    endDateTime = _event.endDateTime.iso;
                }
                //console.log('422: '+startDateTime);
                startDateTime = moment(startDateTime);
                endDateTime = moment(endDateTime);
                startDate = _startDate = startDateTime.toDate();
                endDate = _endDate = endDateTime.toDate();
                $("#end").html(endDateTime.format(momentFormat));

                if (_event.until) { //use this if saved as a string
                    untilDateTime = $.type(_event.until) == 'string' ? moment(new Date(_event.until)) : moment(new Date(_event.until.toString())); //local init setup
                } else { //null obj or real Date,
                    untilDateTime = moment(new Date()); //local init setup
                }
                //untilDateTimeString = untilDateTime.toString();
                _untilDate = untilDateTime.toDate();
                // _untilDate = new Date(untilDateTimeString); //use this in picker
                untilDate = _untilDate; //startDate is at the view scope level
                $("#repeat-until").html(untilDateTime.format(momentDateFormat));

                var incrementByDelta = function() {
                    var msec = _startDate.getTime();
                    msec += delta;
                    return new Date(msec)
                };
                var calculateDelta = function() {
                    delta = _endDate.getTime() - _startDate.getTime(); //delta in mSec.
                    return delta;
                };
                // ------------------- start off with a delta of 1 hour --
                // ? must have calculateDelta function defined before this, do not know why hoisting is not working  as expected ????
                // ? anyway call order works just fine like this
                calculateDelta(); //starting delta is 1 hour
                // -------------------------------------------------------
                startClick = function(e) {
                    var options = null;
                    var date = _startDate; //when editing a date use the one already picked
                    console.log('445: ' + _startDate);
                    var mode = toggleAllDay ? 'date' : 'datetime';
                    options = {
                        date: date,
                        allowOldDates: true,
                        doneButtonColor: '#439a9a',
                        mode: mode
                    };
                    //  console.log('toggleAllDay startclick', toggleAllDay);
                    datePicker.show(options, function(date) { // calling show() function with options and a result handler
                        var _date = null;
                        date = date ? date : _startDate; //handle case of cancel button where date = ''
                        //    console.log('start datepicker callback:' + date.toString());
                        //    console.log('***************** toggleAllDay startclick', toggleAllDay);
                        $("#start").html(moment(date).format(momentFormat));
                        _startDate = date; //picked a date store for later use
                        newInitialStartDate = _startDate; // picked a date store for calculate until date
                        if (toggleAllDay) {
                            _date = moment(date).toDate();
                            date = _date.setHours(23, 59, 59, 0);
                            date = new Date(date);
                            _endDate = date;
                        } else {
                            _endDate = incrementByDelta();
                            //console.log('new _endDate after increment:'+_endDate.toString());
                            date = _endDate;
                        }
                        $("#end").html(moment(date).format(momentFormat));
                        startDate = _startDate;
                        endDate = _endDate;
                    });
                }; //eo #start click
                $("#start").on('click', startClick);
                endClick = function(e) { // defining options
                    var date = _endDate; //when editing a date use the one already picked
                    var mode = toggleAllDay ? 'date' : 'datetime';
                    var options = {
                        date: date,
                        allowOldDates: true,
                        doneButtonColor: '#439a9a',
                        mode: mode
                    }; //eo #end click
                    if (toggleAllDay) {
                        _alert('For all day events only a start date can be selected.');
                        return; //dont allow user to send end date for allDay, only start ...
                    }
                    datePicker.show(options, function(date) { // calling show() function with options and a result handler
                        //alert("date result " + date) ---> Thu Jul 13 1471 12:39:56 GMT+0700 (ICT)
                        date = date ? date : _endDate; //handle case of cancel button where date = ''
                        // date = toggleAllDay ? date.setHours(23,59,59,0) : date;
                        $("#end").html(moment(date).format(momentFormat));
                        if (calculateDelta() < 0) {
                            _alert('Please Pick an End Date that is After the Start Date');
                            return;
                        }
                        _endDate = date;
                        endDate = _endDate;
                        delta = calculateDelta(); //set the delta based on the set time;
                    });
                }; //eo #end click
                $("#end").on('click', endClick);

                untilClick = function(e) {
                    var date = _untilDate;
                    var options = {
                        date: date,
                        allowOldDates: true,
                        doneButtonColor: '#439a9a',
                        mode: 'date'
                    }; //eo #end click
                    datePicker.show(options, function(date) { // calling show() function with options and a result handler
                        //alert("date result " + date) ---> Thu Jul 13 1471 12:39:56 GMT+0700 (ICT)
                        date = date ? date : _untilDate; //handle case of cancel button where date = ''
                        $("#repeat-until").html(moment(date).format(momentDateFormat));
                        _untilDate = date;
                        untilDate = _untilDate;
                    });
                }; //eo #repeat-until click
                $("#repeat-until").on('click', untilClick);

            }; //eo setupMobile
            var setupWebapp = function() {
                var delta = 0;
                var startDateTime, endDateTime;
                var startTime, endTime; //for use with delta
                var calculateDelta = function() {
                    var delta = 0;
                    var _start = parseTime($('#start-time').val());
                    _start = moment(_start);
                    var _end = parseTime($('#end-time').val());
                    _end = moment(_end);
                    delta = _end.diff(_start);
                    delta = delta / 60000.
                        //   console.log('calculateDelta:'+delta);
                    return delta;
                };
                var incrementByDelta = function() {
                    //  console.log('incrementByDelta startTime:'+startTime);
                    var _start0 = parseTime(startTime);
                    _start0 = moment(_start0);
                    var _start = parseTime($('#start-time').val());
                    _start = moment(_start);
                    var _delta = _start.diff(_start0);
                    _delta = _delta / 60000.
                        //  console.log('_delta:'+_delta);
                    var _end = parseTime($('#end-time').val());
                    _end = moment(_end).add(_delta, 'minutes');
                    _end = _end.format('hh:mm A');
                    _end = (_end.substring(0, 1) === '0' ? _end.substring(1) : _end);
                    $('#end-time').val(_end);
                };
                var highlightEventDay = function(id, date) {
                    var _year, _month, _day;
                    date = date.split('/');
                    _year = parseInt('20' + date[2]);
                    _month = parseInt(date[0]) - 1;
                    _day = parseInt(date[1]);
                    //var UTC = Date.UTC(_year, _month, _day);
                    var UTC = new Date(_year, _month, _day);
                    UTC = UTC.getTime();
                    var pickadateDay = '#' + id + '_table div.pickadate__day[data-pick="' + UTC + '"]';
                    pickadateDay = $(pickadateDay);
                    pickadateDay.addClass('pickadate__day--highlighted--event');
                    pickadateDay.data('isEvent', 'true');
                };
                var virtualInput = $('#start, #end, #repeat-until').pickadate({
                    container: '#create-new-event-view', //#create-new-event-view
                    format: 'mm/dd/yy',
                    formatSubmit: 'dd/mm/yy',
                    onOpen: function() {
                        var _date = null;
                        var _id = this.$node.attr('id');
                        _date = $('#' + _id).val();

                        if (_id === 'repeat-until') {
                            var today = new Date();
                            this.set('view', [today.getFullYear(), today.getMonth(), today.getDate()]);
                        }

                        highlightEventDay(_id, _date);
                        $('#' + _id + '_root').css("pointer-events", "all");
                        $('#' + _id + '_root').show();
                        console.log(_id + ' onOpen pickadate:' + _date);
                    },
                    onClose: function() {
                        var _date = pickadateCalendar.get();
                        var _id = this.$node.attr('id');
                        var _v;
                        if (_id === 'start') {
                            $('#end').removeAttr('disabled').prop('placeholder', _date).val(_date);
                            $('#end-date-field input[name="_submit"]').attr('value', _date);
                            $('#start_root').css("pointer-events", "none").hide();
                        } else if (_id === 'end') {
                            $('#end-date-field input[name="_submit"]').attr('value', _date);
                            $('#end_root').css("pointer-events", "none").hide();
                        } else {
                            $('#repeat-until_root').css("pointer-events", "none").hide();
                        }

                        _v = $('#' + _id).val();
                        _v = _v.split('/');
                        _date = (_id === 'start' ? startDate : endDate); //update the start/endDate for the event
                        _date.setFullYear(20 + _v[2], _v[0] - 1, _v[1]);
                        // console.log(_v + ' close calendar:' + _date.toString());
                    }
                }); //eo virtualInput
                //use the preset start/end dates from _event
                if (typeof _event.startDateTime === 'string') { //updated after last login
                    startDateTime = _event.startDateTime;
                    endDateTime = _event.endDateTime;
                } else {
                    startDateTime = _event.startDateTime.iso;
                    endDateTime = _event.endDateTime.iso;
                }
                startDateTime = moment(startDateTime);
                endDateTime = moment(endDateTime);
                startDate = _startDate = startDateTime.toDate(); //kludge to handle various scopes that need these dates
                endDate = _endDate = endDateTime.toDate();
                isStartReady = true;
                isEndReady = true;
                //create the calendar widgets
                pickadateCalendar = virtualInput.pickadate('picker');
                //$('.icon-calendar').on('click', function() {    pickadateCalendar.open(false);    });
                $("#start-date-field .icon-calendar").click(function(e) {
                    e.stopPropagation();
                    var picker = $("#start").pickadate('picker');
                    picker.open();
                    $("#start").trigger('click');
                });

                $("#end-date-field .icon-calendar").click(function(e) {
                    e.stopPropagation();
                    var picker = $("#end").pickadate('picker');
                    picker.open();
                    $("#end").trigger('click');
                });

                $("#repeat-until-field .icon-calendar").click(function(e) {
                    e.stopPropagation();
                    var picker = $("#repeat-until").pickadate('picker');
                    picker.open();
                    $("#repeat-until").trigger('click');
                });

                $('#start').val(startDateTime.format('MM/DD/YY'));
                $('#start-time').val(startDateTime.format('hh:mm A'));
                startTime = $('#start-time').val(); //!!!!!! set initial value
                $('#end').val(endDateTime.format('MM/DD/YY'));
                $('#end-time').val(endDateTime.format('hh:mm A'));
                delta = calculateDelta();
                $("#start-time, #end-time").timepicker({
                    minuteStep: 5,
                    secondStep: 5,
                    orientation: {
                        x: 'right',
                        y: 'top'
                    }
                }).on('changeTime.timepicker', function(e) {
                    var timeString = e.time.value;
                    var dt = (this.id === 'start-time' ? startDate : endDate);
                    dt = parseTime(timeString, dt);
                    if (this.id === 'start-time') {
                        incrementByDelta();
                        startTime = $('#start-time').val();
                    }
                    if (this.id === 'end-time') {
                        delta = calculateDelta();
                    }
                    //   console.log('The time is ' + timeString + ' parsed:' + dt.toString());
                }).on('show.timepicker', function(e) {
                    var dt = (this.id === 'start-time' ? $('#start-time').val() : $('#end-time').val());
                    // console.log('on show timepicker id:'+this.id+" time:"+dt);
                    if (this.id === 'start-time') {
                        $('#start-time').timepicker('setTime', dt);
                    }
                    if (this.id === 'end-time') {
                        $('#end-time').timepicker('setTime', dt);
                    }
                    //   console.log('The time is ' + timeString + ' parsed:' + dt.toString());
                });
                $("#start-date-field .icon-clock").click(function() {
                    $("start-time").timepicker('showWidget');
                });
            }; //eo setupWebapp

            if (_selectedCustomListId) { //See if user has already seleted a target list
                $("#sendto").html(_selectedCustomListName);
                $("#sendto").addClass("right-text");
                $("#sendto").removeClass("right-arrow");
            }
            //set up for date/time entry sxm
            initEventData(); //repopulate event fields
            checkModifyEvent(); // check modify event
            (isMobile ? setupMobile() : setupWebapp());
            editEvent();
            //if(isEdit) {    editEvent();    }

        }; //eo addedToDOM

        var eventAttribute = function(key, val) {
            if (key.length === 0 || key === null || key === 'undefined') {
                return;
            }
            if (arguments.length === 1) {
                return this.model.attributes.event[key];
            }
            this.model.attributes.event[key] = val;
        };
        var getEvent = function() {
            return this.model.attributes.event;
        };
        var autoSyncCalendarFunc = function() {
            setTimeout(function() {
                _autoSyncWithCalendar(false); // auto sign calendar when update
            });
        };
        var __id = 'update-event-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            container: '#main-container',
            id: __id,
            className: 'view-container new-event-view',
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                _setCurrentView(_view.SCHEDULE_CREATION, __id);
                isMobile = _isMobile(); //are we on the mobile platform
                eventAttribute.call(this, 'isMobile', isMobile);
                $("#footer-toolbar > li").removeClass("active"); //Reset footer
                Chaplin.View.prototype.initialize.call(this, arguments);
            },
            getTemplateData: function() {
                return {
                    event: getEvent.call(this)
                };
            }
        }); //eo View.extend

        return View;
    }); //eo define