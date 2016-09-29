define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/create/new-homework-template.hbs',
        'jquery',
        'backbone.touch',
        'parse',
        'parseproxy',
        'moment',
        'spinner',
        'picker',
        'underscore',
        'userService',
        'picker.date',
        'timepicker'
    ],
    function(Chaplin, View, Template, $, touch, Parse, ParseProxy, moment, spinner, picker, _, userService) {
        'use strict';
        //Redirect to another page once a new message is created
        var user;
        var selectedCustomListData;
        var initData = function() {
            user = JSON.parse(localStorage.getItem("user"));
            selectedCustomListData = user.customList.selectedCustomListData;
        }; //eo initData
        //various 'locals'
        var pickadateCalendar = null;
        var isMobile = false;
        var selectedRepeatStr = "Never";
        var untilRepeatStr = moment().format('MM/DD/YYYY');
        var momentFormat = 'ddd MMM D';
        var momentDateFormat = 'MM/DD/YY';
        var momentTimeFormat = '';
        var selectedRemindId = '';
        var selectedRemindStr = "Never";
        var selectedRemindMinutes = -1;
        var isStartReady = false;
        var isEndReady = false;
        var _startDate = null,
            _endDate = null,
            _untilDate = null;
        var _startDateDate, _startDateTime;
        var _endDateDate, _endDateTime;
        var _untilDateDate, _untilDateTime;
        var startClick = $.noop; //empty function
        var endClick = $.noop;
        var untilClick = $.noop;
        //var toggleAllDay = false; //set to handle date picker(s)
        var type = "Daily";
        var defaults = {
            title: '',
            repeat: 'Never',
            until: '',
            untilDate: moment(new Date()).toDate(),
            reminder: 'Never',
            reminder2: 'Never',
            note: '',
            sendToCustomListId: '',
            assignedDate: moment(new Date()).toDate(), //local init setup
            dueDate: moment(new Date()).toDate()
        };
        var roundMinutes = function(date) {
            date.setHours(date.getHours() + Math.round((date.getMinutes() + 30) / 60));
            date.setMinutes(0);
            return date;
        }; //eo roundMinutes
        moment().format('L'); //how to show dates with moment
        //when the DOM has been updated let gumby reinitialize UI modules
        var backCancelBtnClick = function(e) {
            _closeByKeyboard();
            //_selectedCustomListId = null;
            //_selectedCustomListName = null;
            _homework = {}; //clean up
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
        };

        var addedToDOM = function() {
            initData();
            //dates and times
            var isStartReady = false;
            var startDate = null;
            var isEndReady = false;
            var endDate = null;
            var untilDate = null;
            var allday = false;
            var reminderSelect = ''; //which reminder btn clicked
            var redirect = function() {
                spinner.hide();
                _isRedirect = true;
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
                    case _view.MESSAGES_INDEX:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'message'
                        });
                        break;
                    case _view.HOMEWORK_INDEX:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'homework'
                        });
                        break;
                    case _view.CREATION:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'create'
                        });
                        break;
                    default:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'message'
                        });
                        break;
                } //eo switch
            }; //eo redirect
            var initEventData = function() {
                var _title, _isAllDay, _startDate0, _endDate0, _repeat, _until, _untilDate0, _reminder, _reminder2, _note, _sendToCustomListId, cancelEvent;
                _homework = defaults;
                _title = _homework.title || "";
                //_isAllDay = _homework.isAllDay || false;
                //toggleAllDay = _isAllDay;
                _startDate0 = _homework.assignedDate || null;
                _endDate0 = _homework.dueDate || null;
                _repeat = _homework.repeat || "Never";
                _until = _homework.until || '';
                _untilDate0 = _homework.untilDate || null;
                _reminder = _homework.reminder || "Never";
                _note = _homework.note || "";
                _sendToCustomListId = _homework.sendToCustomListId || "";
                // _homework = {};
                // _title = "";
                // //_isAllDay = _homework.isAllDay || false;
                // //toggleAllDay = _isAllDay;
                // _startDate0 = null;
                // _endDate0 = null;
                // _repeat = "Never";
                // _until = '';
                // _reminder = "Never";
                // _note = "";
                // _sendToCustomListId = "";
                cancelEvent = $('#cancel-event');
                $("#title").val(_title);
                //allday = $('#allDay').prop('checked', _isAllDay);
                startDate = _startDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                endDate = _endDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                untilDate = _untilDate0;
                // console.log('initEventData start/endDate:',startDate,endDate);
                var repeat = $("#repeat").html(_repeat + '<i class="icon-right-open"></i>');
                var until = $("#repeat-until").text(_until);
                var reminder = $("#reminder .reminder-val").text(_reminder);
                var _confirm = false;
                $("#note").val(_note);
            }; //eo initEventData
            var getStartEndDates = function() { //fix problems with parsing dates and times from the form
                var start, end, until, startTime, endTime;
                if (isMobile) {
                    return;
                } //do not need to do anything
                start = $('#start').val(); // MM/DD/YYYY date string
                end = $('#end').val();
                until = $('#repeat-until').val();
                /*startTime = $('#start-time').val();
                endTime = $('#end-time').val();
                start = start + ' ' + startTime;
                end = end + ' ' + endTime;*/
                startDate = moment(start, 'MM/DD/YY').toDate();
                endDate = moment(end, 'MM/DD/YY').toDate();
                untilDate = moment(until, 'MM/DD/YY').toDate();
                //console.log('done start, end', startDate.toString(), endDate.toString());
            }; //eo getStartEndDates
            var saveFieldData = function() {
                var title = $("#title").val();
                var repeat = $("#repeat").text();
                var until = $("#repeat-until").val();
                until = repeat === 'Never' ? '' : until;
                var reminder = $("#reminder .reminder-val").text();
                var note = $("#note").val();
                getStartEndDates();
                //store current event data for another day and copy it to the mediator.d
                //start and endDates taken from scope level start/endDate variables; convert to string so that we can make a copy to hold onto
                _homework = {
                    title: title,
                    dueDate: endDate.toString(),
                    assignedDate: startDate.toString(),
                    repeat: repeat,
                    until: until,
                    untilDate: untilDate.toString(),
                    reminder: reminder,
                    note: note
                };
                //  console.log('initEventData _homework.start/endDate:',_homework.startDate,_homework.endDate);
                Chaplin.mediator.d = $.extend({}, _homework); //make a copy, DONT simply bind the reference!
            }; //eo saveFieldData
            var setReminderPicker = function(id) {
                var which = '';
                var select = '#' + id + ' .reminder-val'; //which reminder string to read
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

            //handle selectedCustomListData for sending emails etc.
            //If the user has already seleted a list, then we display it
            if (selectedCustomListData) {
                $("#sendto").html(selectedCustomListData.name);
                $("#sendto").addClass("right-text");
                $("#sendto").removeClass("right-arrow");
            } //eo selectedCustomListData if
            //click handling
            $("#backBtn").on('click', function(e) {
                backCancelBtnClick(e);
            }); //eo #backBtn click
            $("#sendto").on('click', function(e) {
                saveFieldData(); //hold on to data
                $(this).addClass("text-highlight-grey");
                setTimeout(function() {
                    _setAfterSendToView(_view.currentView);
                    Chaplin.utils.redirectTo({
                        name: 'create-sendto'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            }); //eo #sendTo click
            // $("#daily").on('click', function(e) {
            //     type = "Daily";
            // });
            // $("#project").on('click', function(e) {
            //     type = "Test/Project";
            // });
            $("#hwType").on('click', function(e) {
                var flag = $('#hwType').prop('checked');
                type = flag ? 'Test/Project' : 'Daily';
            }); //eo hwType click
            $("#repeat").on('click', function() {
                $("#repeat-picker").removeClass("hidden");
                $("#until").removeClass("hidden");
                //$("#repeat-until").val(untilRepeatStr);
                $('#repeat-until').val(moment(untilRepeatStr).format('M/D/YY'));
            }); //eo #repeat click
            $("#reminder, #reminder2").on('click', function(e) {
                selectedRemindId = e.currentTarget.id;
                setReminderPicker(e.currentTarget.id)
            }); //eo #reminder, #reminder2 click
            $("#repeat-picker .time-wrapper .time").on('click', function() {
                var id = this.id;
                var which = id.substring(7);
                which = +which;
                selectedRepeatStr = 'Never';
                switch (which) {
                    case 0:
                        selectedRepeatStr = 'Never';
                        break;
                    case 1:
                        selectedRepeatStr = 'Every Day';
                        break;
                    case 2:
                        selectedRepeatStr = 'Every Week';
                        break;
                    case 3:
                        selectedRepeatStr = 'Every 2 Weeks';
                        break;
                    case 4:
                        selectedRepeatStr = 'Every Month';
                        break;
                    case 5:
                        selectedRepeatStr = 'Every Year';
                        break;
                    default:
                        selectedRepeatStr = 'Never';
                } //eo switch over which repeat period selected
                $("#repeat").html(selectedRepeatStr + '<i class="icon-right-open"></i>');
                if (selectedRepeatStr === 'Never') {
                    $("#until").addClass("hidden");
                }
                $("#repeat-picker").addClass("hidden");
            }); //eo #repeat-picker .time-wrapper .time click
            $("#remind-picker .time-wrapper .time").on('click', function() {
                getReminderPicker(this.id);
            });
            //Init events
            $("#doneBtn").on('click', function(e) {
                var title = $("#title").val();
                var userCustomListData = null;
                //var user = Parse.User.current();
                var UserCustomList = null;
                var query = null;
                var homeworkId = null;
                var parentIdList = [];
                var isUserOnOfRecipients = false;
                var done = function() { //always called at the end of the chain
                    spinner.hide();
                    _homework = {};
                    redirect();
                }; //eo done


                var addUserHomeworkRelation = function() {
                    var deferred = $.Deferred();
                    //Now, also create UserEventRelation for the creator so that they can see their own messages
                    var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation");
                    var relation = new UserHomeworkRelation();
                    var success = function(d) {
                        var id = d.id;
                        _setUserHomeworkRelationsItem(id, d.attributes);
                        deferred.resolve();
                    };
                    var error = function(err) {
                        console.log("addUserHomeworkRelation error id:", homeworkId + ' message:' + err.message);
                        deferred.resolve();
                    };
                    if (isUserOnOfRecipients) {
                        deferred.resolve();
                        return;
                    }
                    relation.set("homeworkId", homeworkId);
                    relation.set("isRead", false);
                    relation.set("parentId", user.id);
                    relation.set("childIdList", []);
                    relation.set("groupType", userCustomListData.get("groupType"));
                    relation.save(null, {
                        success: success,
                        error: error
                    }); //eo relation.save
                    return deferred;
                }; //eo addUserEventRelation
                var sendPush = function() {
                    var deferred = $.Deferred();
                    var queryIOS = new Parse.Query(Parse.Installation);
                    var o = null;
                    var success = function() {
                        deferred.resolve();
                    };
                    var error = function(err) {
                        // Handle error
                        console.log("Push Notification error... id:", homeworkId + ' message:' + err.message);
                        _alert("Push Notification error... id:", homeworkId + ' message:' + err.message);
                        deferred.resolve();
                    };
                    /*
                        Add by phuongnh@vinasource.com
                        set push type for check when listen event receive push notification from app
                     */
                    o = {
                        where: queryIOS,
                        data: { //note: the alert title MUST contain the word 'homework'
                            //alert: "New homework: " + title.substring(0, 80) + "...",
                            alert: "New homework: " + title.substring(0, 200),
                            badge: 1,
                            type: _Homework_Type,
                            sound: "default",
                            'content-available': 1, //Request clients to trigger background fetch
                            sender: user.id,
                            objectId: homeworkId
                        }
                    }; //eo o
                    //Send push notification for target audiences
                    queryIOS.containedIn('userId', parentIdList);
                    Parse.Push.send(o, {
                        useMasterKey: true,
                        success: success,
                        error: error
                    }); //eo Parse.push
                    return deferred;
                }; //eo sendPush
                var createUserHomeworkRelations = function() {
                    var deferred = $.Deferred();
                    var recipientList = userCustomListData.get("recipientList");
                    var recipient = null;
                    var parentId = null;
                    var childrenIdList = null;
                    var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation");
                    var relation = null;
                    var deferreds = [];
                    var i = 0;
                    var _createUserHomeworkRelations = function() {
                        var _deferred = $.Deferred();
                        var success = function(d) {
                            // Fix JIRA#52: Only push the homework relation to local storage if the created userHomeworkRelation is for current user.
                            if (d.attributes.parentId === user.id) {
                                var id = d.id;
                                _setUserHomeworkRelationsItem(id, d.attributes);
                            }
                            _deferred.resolve();
                        };
                        var error = function(err) {
                            _alert("E02 Could not create new homeworkRelations: " + err.message);
                            _deferred.resolve();
                        };
                        recipient = recipientList[i];
                        parentId = recipient.parent;
                        childrenIdList = recipient.children;
                        if (user.id === parentId) {
                            isUserOnOfRecipients = true;
                        }
                        relation = new UserHomeworkRelation();
                        relation.set("homeworkId", homeworkId); //set in createNewHomework
                        relation.set("isRead", false);
                        relation.set("isUpdated", false);
                        relation.set("parentId", parentId);
                        relation.set("childIdList", childrenIdList);
                        relation.set("groupType", userCustomListData.get("groupType"));
                        relation.set("groupId", userCustomListData.get("groupId"));
                        relation.set("organizationId", userCustomListData.get("organizationId"));
                        relation.save(null, {
                            success: success,
                            error: error
                        });
                        //Collect audience ids to send push notification
                        parentIdList.push(parentId);
                        return _deferred;
                    }; //eo inner _createUserHomeworkRelations
                    for (i = 0; i < recipientList.length; i++) {
                        deferreds.push(_createUserHomeworkRelations()); //using closure and returns a deferred specific to that messageRelation request
                    } //eo for recipientList.length
                    $.when.apply($, deferreds).then(function() {
                        userService.getLinkedAccountUserIds(parentIdList).then(
                            function(linkedUserIds) {
                                parentIdList = parentIdList.concat(linkedUserIds);
                                deferred.resolve();
                            },
                            function() {
                                deferred.reject();
                            }
                        );
                    }, function(err) {
                        _alert("E03 Could not create new homeworkRelations: " + err.message);
                        deferred.reject();
                    });

                    return deferred;
                }; //eo createUserHomeworkRelations
                var createNewHomework = function() {
                    var deferred = $.Deferred();
                    var Homework = Parse.Object.extend("Homework");
                    var homework = new Homework();
                    var _h = _homework || {};
                    var success = function(d) { //create UserEventRelation
                        var id = d.id;
                        var createdAt = d.createdAt.toISOString();
                        var updatedAt = d.updatedAt.toISOString();
                        homeworkId = id; //need this in createUserHomeworkRelations
                        $.extend(d.attributes, {
                            createdAt: createdAt,
                            updatedAt: updatedAt,
                            objectId: id
                        });
                        _setUserHomeworkItem(id, d.attributes);

                        if (d.get('reminder')) {
                            _setHomeworkLocalNotification(d, false);
                        }

                        deferred.resolve();
                    };
                    var error = function(d, err) {
                        _alert("E06 Could not create new homework: " + err.message);
                        console.log(err.message);
                        deferred.reject();
                    }; //eo error callback
                    homework.set("title", _h.title);
                    homework.set("assignedDate", startDate); //not a string, a Date object
                    homework.set("dueDate", endDate);
                    homework.set("repeat", _h.repeat);
                    homework.set("repeatId", '');
                    homework.set("reminder", _h.reminder);
                    homework.set("note", _h.note);
                    homework.set("until", _h.until);
                    homework.set("untilDate", untilDate);
                    homework.set("type", type); //this is at the top level scope line#54
                    homework.set("groupName", userCustomListData.get("name"));
                    homework.set("sendToCustomListId", selectedCustomListData.objectId);
                    homework.set("creatorId", user.id);
                    homework.set("groupType", userCustomListData.get("groupType"));
                    homework.set("orgIdForThisObject", userCustomListData.get("groupId"));
                    homework.save(null, {
                        success: success,
                        error: error
                    });

                    return deferred;
                }; //eo createNewEvent
                var getCustomListData = function() {
                    var deferred = $.Deferred();
                    var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserCustomList.query();
                    query.equalTo("ownerId", user.id);
                    query.equalTo("objectId", selectedCustomListData.objectId);
                    query.find({
                        success: function(results) {
                            userCustomListData = results[0]; //put this is top scope so everyone can see it
                            deferred.resolve();
                        }, //eo query.find success
                        error: function(err) {
                            _alert('Internal error, createNewHomework error:' + err.message);
                            deferred.reject();
                        }
                    }); //eo query.find
                    return deferred;
                }; //eo getCustomListData
                var sendEmail = function() {
                    var deferred = $.Deferred();
                    var nonUserContactEmail = selectedCustomListData.nonUserContactEmail;
                    var userContactEmail = selectedCustomListData.userContactEmail;
                    var allEmailArray = nonUserContactEmail.concat(userContactEmail);
                    var data = {
                        'due': endDate,
                        'note': _homework.note,
                        'repeat': _homework.repeat,
                        'until': _homework.untilDate,
                        'assigned': startDate,
                        'title': _homework.title
                    };
                    var success = function(email) {
                        deferred.resolve();
                    };
                    var error = function(email, err) {
                        _alert('Failed to send emails, with error: ' + err.message);
                        deferred.resolve();
                    };
                    var Email = Parse.Object.extend("Email");
                    var email = new Email(); //create an email object
                    var flag = selectedCustomListData.nonUserContactEmail && selectedCustomListData.nonUserContactEmail.length > 0;
                    flag = flag || selectedCustomListData.userContactId && selectedCustomListData.userContactId.length > 0;
                    flag = flag || selectedCustomListData.userContactEmail.length > 0;
                    if (!flag) {
                        deferred.resolve();
                        return deferred;
                    }
                    email.set("type", "homework");
                    email.set("recipientAddress", allEmailArray);
                    email.set("data", data);
                    email.set("customListId", selectedCustomListData.objectId);
                    email.set("customListName", selectedCustomListData.name);
                    email.set("groupId", selectedCustomListData.groupId);
                    email.set("organizationId", selectedCustomListData.organizationId);
                    email.save(null, {
                        success: success,
                        error: error
                    });
                    return deferred;
                }; //eo sendEmail

                //
                //MAIN PROCESSING STARTS HERE
                //
                saveFieldData(); //hold on to the data while validating
                //if (_selectedCustomListId == null) {
                if (!selectedCustomListData || $.isEmptyObject(selectedCustomListData)) {
                    _alert("Please select a group before selecting Done");
                } else if (!title) { //empty string is falsy
                    _alert("Please enter the homework title before selecting Done");
                } else {
                    spinner.show();
                    sendEmail() //If user selects mygroup custom list, we send emails to recipients
                        .then(getCustomListData)
                        .then(createNewHomework)
                        .then(createUserHomeworkRelations)
                        .then(sendPush)
                        .then(addUserHomeworkRelation)
                        .always(done);
                } //eo validation check of homework form data
            }); //eo #doneBtn
            //create the time widgets
            //http://www.timlabonne.com/2013/07/parsing-a-time-string-with-javascript/
            //timeStr = time string to parse
            //return dt = date object with time set to the input timeStr, or current date with it if no dt
            // var parseTime = function(timeStr, dt) { //parse the time string value and modify the input date with it
            //     var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
            //     if (!dt) {
            //         dt = new Date();
            //     }
            //     if (!time) {
            //         return NaN;
            //     }
            //     var hours = parseInt(time[1], 10);
            //     if (hours == 12 && !time[3]) {
            //         hours = 0;
            //     } else {
            //         hours += (hours < 12 && time[3]) ? 12 : 0;
            //     }
            //     dt.setHours(hours);
            //     dt.setMinutes(parseInt(time[2], 10) || 0);
            //     dt.setSeconds(0, 0);
            //     return dt;
            // }; //eo parseTime

            //handle date/time entry depending on which platform we are using
            var setupMobile = function() {
                var delta = 0; //!this is the critical variable,
                var startDateTime, endDateTime, untilDateTime;
                var startDateTimeString, endDateTimeString, untilDateTimeString;
                // console.log('setupMobile start/endDate:', startDate, endDate);
                if (startDate) { //use this if saved as a string or Date
                    startDateTime = $.type(startDate) == 'string' ? moment(new Date(startDate)) : moment(new Date(startDate.toString())); //local init setup
                } else { //null obj, just use defaults
                    startDateTime = moment(new Date()); //local init setup
                }
                //  startDateTimeString = startDateTime.toString();
                _startDate = startDateTime.toDate(); //new Date(startDateTimeString); //use this in picker
                startDate = _startDate; //startDate is at the view scope level
                $("#start").html(startDateTime.format(momentFormat)); //don't use touch...
                if (endDate) { //use this if saved as a string
                    endDateTime = $.type(endDate) == 'string' ? moment(new Date(endDate)) : moment(new Date(endDate.toString())); //local init setup
                } else { //null obj or real Date,
                    endDateTime = moment(new Date()); //local init setup
                }
                //endDateTimeString = endDateTime.toString();
                _endDate = endDateTime.toDate();
                // _endDate = new Date(endDateTimeString); //use this in picker
                endDate = _endDate; //startDate is at the view scope level
                $("#end").html(endDateTime.format(momentFormat));
                if (untilDate) { //use this if saved as a string
                    untilDateTime = $.type(untilDate) == 'string' ? moment(new Date(untilDate)) : moment(new Date(untilDate.toString())); //local init setup
                } else { //null obj or real Date,
                    untilDateTime = moment(new Date()); //local init setup
                }
                //untilDateTimeString = untilDateTime.toString();
                _untilDate = untilDateTime.toDate();
                // _untilDate = new Date(untilDateTimeString); //use this in picker
                untilDate = _untilDate; //startDate is at the view scope level
                $("#repeat-until").html(untilDateTime.format(momentDateFormat));
                // var incrementByDelta = function() {
                //     var msec = _startDate.getTime();
                //     msec += delta;
                //     return new Date(msec)
                // };
                // var calculateDelta = function() {
                //     delta = _endDate.getTime() - _startDate.getTime(); //delta in mSec.
                //     return delta;
                // };
                // ------------------- start off with a delta of 1 hour --
                // ? must have calculateDelta function defined before this, do not know why hoisting is not working  as expected ????
                // ? anyway call order works just fine like this
                //calculateDelta(); //starting delta is 1 hour
                // -------------------------------------------------------
                startClick = function(e) {
                    var options = null;
                    var date = _startDate; //when editing a date use the one already picked
                    var mode = 'date';
                    options = {
                        date: date,
                        allowOldDates: true,
                        doneButtonColor: '#439a9a',
                        mode: mode
                    };
                    //         console.log('toggleAllDay startclick', toggleAllDay);
                    datePicker.show(options, function(date) { // calling show() function with options and a result handler
                        var _date = null;
                        date = date ? date : _startDate; //handle case of cancel button where date = ''
                        // console.log('start datepicker callback:'+date.toString());
                        //  console.log('***************** toggleAllDay startclick', toggleAllDay);
                        $("#start").html(moment(date).format(momentFormat));
                        _startDate = date; //picked a date store for later use
                        _date = moment(date).toDate();
                        date = _date.setHours(23, 59, 59, 0);
                        date = new Date(date);
                        //_endDate = date;
                        //$("#end").html(moment(date).format(momentFormat));
                        startDate = _startDate;
                        endDate = _endDate;
                    });
                }; //eo #start click
                $("#start").on('click', startClick);
                endClick = function(e) { // defining options
                    var date = _endDate; //when editing a date use the one already picked
                    var mode = 'date';
                    var options = {
                        date: date,
                        allowOldDates: true,
                        doneButtonColor: '#439a9a',
                        mode: mode
                    }; //eo #end click
                    // if (toggleAllDay) {
                    //     _alert('For all day events only a start date can be selected.');
                    //     return; //dont allow user to send end date for allDay, only start ...
                    // }
                    datePicker.show(options, function(date) { // calling show() function with options and a result handler
                        //alert("date result " + date) ---> Thu Jul 13 1471 12:39:56 GMT+0700 (ICT)
                        date = date ? date : _endDate; //handle case of cancel button where date = ''
                        // date = toggleAllDay ? date.setHours(23,59,59,0) : date;
                        $("#end").html(moment(date).format(momentFormat));
                        // if (calculateDelta() < 0) {
                        //     _alert('Please Pick an End Date that is After the Start Date');
                        //     return;
                        // }
                        _endDate = date;
                        endDate = _endDate;
                        //delta = calculateDelta(); //set the delta based on the set time;
                    });
                }; //eo #end click
                $("#end").on('click', endClick);
                untilClick = function(e) { // defining options
                    var date = _untilDate; //when editing a date use the one already picked
                    var mode = 'date';
                    var options = {
                        date: date,
                        allowOldDates: true,
                        doneButtonColor: '#439a9a',
                        mode: mode
                    }; //eo #until click
                    datePicker.show(options, function(date) { // calling show() function with options and a result handler
                        //alert("date result " + date) ---> Thu Jul 13 1471 12:39:56 GMT+0700 (ICT)
                        date = date ? date : _untilDate; //handle case of cancel button where date = ''
                        // date = toggleAllDay ? date.setHours(23,59,59,0) : date;
                        $("#repeat-until").html(moment(date).format(momentDateFormat));
                        _untilDate = date;
                        untilDate = _untilDate;
                    });
                }; //eo #until click
                $("#repeat-until").on('click', untilClick);
            }; //eo setupMobile

            var setupWebapp = function() {
                var delta = 0;
                var startDateTime, endDateTime;
                var startTime, endTime, untilDate; //for use with delta
                startDate = new Date();
                endDate = new Date();
                untilDate = new Date();

                // var calculateDelta = function() {
                //     var delta = 0;
                //     var _start = parseTime($('#start-time').val());
                //     _start = moment(_start);
                //     var _end = parseTime($('#end-time').val());
                //     _end = moment(_end);
                //     delta = _end.diff(_start);
                //     delta = delta / 60000.
                //         //   console.log('calculateDelta:'+delta);
                //     return delta;
                // };
                // var incrementByDelta = function() {
                //     //  console.log('incrementByDelta startTime:'+startTime);
                //     var _start0 = parseTime(startTime);
                //     _start0 = moment(_start0);
                //     var _start = parseTime($('#start-time').val());
                //     _start = moment(_start);
                //     var _delta = _start.diff(_start0);
                //     _delta = _delta / 60000.
                //         //  console.log('_delta:'+_delta);
                //     var _end = parseTime($('#end-time').val());
                //     _end = moment(_end).add(_delta, 'minutes');
                //     _end = _end.format('hh:mm A');
                //     _end = (_end.substring(0, 1) === '0' ? _end.substring(1) : _end);
                //     $('#end-time').val(_end);
                // };
                var highlightEventDay = function(id, date) {
                    var _year, _month, _day;
                    date = date.split('/');
                    _year = parseInt('20' + date[2]);
                    _month = parseInt(date[0]) - 1;
                    _day = parseInt(date[1]);
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
                            //$('#end').removeAttr('disabled').prop('placeholder', _date).val(_date);
                            //$('#end-date-field input[name="_submit"]').attr('value', _date);
                            $('#start_root').css("pointer-events", "none").hide();
                        } else if (_id === 'end') {
                            $('#end-date-field input[name="_submit"]').attr('value', _date);
                            $('#end_root').css("pointer-events", "none").hide();
                        } else {
                            $('#repeat-until_root').css("pointer-events", "none").hide();
                        }
                        _v = $('#' + _id).val();
                        _v = _v.split('/');
                        //_date = (_id === 'start' ? startDate : endDate); //update the start/endDate for the event
                        if (_id === 'start') {
                            _date = startDate;
                        } else if (_id === 'end') {
                            _date = endDate;
                        } else {
                            _date = untilDate;
                        }
                        _date.setFullYear(20 + _v[2], _v[0] - 1, _v[1]);
                        // console.log(_v + ' close calendar:' + _date.toString());
                    }
                }); //eo virtualInput
                //startDateTimeDefaults
                startDateTime = moment();
                isStartReady = true;
                endDateTime = moment();
                isEndReady = true;
                //create the calendar widgets
                pickadateCalendar = virtualInput.pickadate('picker');
                // $('.icon-calendar').on('click', function() {
                //     pickadateCalendar.open(false);
                // });
                $('#start_root').css("pointer-events", "none");
                $('#start_root').css("display", "none");
                $('#end_root').css("pointer-events", "none");
                $('#end_root').css("display", "none");
                $('#repeat-until_root').css("pointer-events", "none");
                $('#repeat-until_root').css("display", "none");
                $('#start').val(startDateTime.format('M/D/YY'));
                //$('#start-time').val(startDateTime.format('hh:mm A'));
                //startTime = $('#start-time').val(); //!!!!!! set initial value
                $('#end').val(endDateTime.format('M/D/YY'));
                //$('#end-time').val(endDateTime.format('hh:mm A'));
                //delta = calculateDelta();
                // $("#start-time, #end-time").timepicker({
                //     minuteStep: 5,
                //     secondStep: 5,
                //     orientation: {x:'right', y:'top'}
                // });
                //.on('changeTime.timepicker', function(e) {
                //     var timeString = e.time.value;
                //     var dt = (this.id === 'start-time' ? startDate : endDate);
                //     dt = parseTime(timeString, dt);
                //     if (this.id === 'start-time') {
                //         incrementByDelta();
                //         startTime = $('#start-time').val();
                //     }
                //     if (this.id === 'end-time') {
                //         delta = calculateDelta();
                //     }
                //     //   console.log('The time is ' + timeString + ' parsed:' + dt.toString());
                // }).on('show.timepicker', function(e) {
                //     var dt = (this.id === 'start-time' ? $('#start-time').val() : $('#end-time').val());
                //     // console.log('on show timepicker id:'+this.id+" time:"+dt);
                //     if (this.id === 'start-time') {
                //         $('#start-time').timepicker('setTime', dt);
                //     }
                //     if (this.id === 'end-time') {
                //         $('#end-time').timepicker('setTime', dt);
                //     }
                //     //   console.log('The time is ' + timeString + ' parsed:' + dt.toString());
                // });
                // $("#start-date-field .icon-clock").click(function() {
                //     $("start-time").timepicker('showWidget');
                // });
            }; //eo setupWebapp

            //Init all-day button TODO: move into setupMobile and write equiv. for webapp
            // $("#allDayToggle").on('click', function(e) {
            //     var flag = $('#allDay').prop('checked');
            //     var startDateTimeString, endDateTimeString;
            //     if (flag) { //rebind click handling TODO: setup start/endClick for webapp?
            //         allday = true;
            //         _startDate = new Date().setHours(0, 0, 0, 0);
            //         _startDate = moment(_startDate);
            //         startDateTimeString = _startDate.format(momentFormat);
            //         _startDate = _startDate.toDate();
            //         $("#start").html(startDateTimeString);
            //         _endDate = new Date().setHours(23, 59, 59, 0);
            //         _endDate = moment(_endDate);
            //         endDateTimeString = _endDate.format(momentFormat);
            //         _endDate = _endDate.toDate();
            //         $("#end").html(endDateTimeString);
            //         isStartReady = true;
            //         isEndReady = true;
            //         toggleAllDay = true;
            //     } else {
            //         allday = false;
            //         toggleAllDay = false;
            //     } //eo else if(allday)
            //     console.log('toggleAllDay', toggleAllDay);
            // });

            //set up for date/time entry sxm
            initEventData(); //repopulate event fields
            (isMobile ? setupMobile() : setupWebapp());
            if (isMobile) {
                $("#note").focus(function(e) {
                    $(".innerview-container").scrollTop($(".innerview-container").height() * 2 / 3);
                }); //eo #note .focus
            }
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
        var __id = 'new-homework-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            id: __id,
            container: '#main-container',
            className: 'view-container new-homework-view',
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                _setCurrentView(_view.HOMEWORK_CREATION, __id);
                isMobile = _isMobile(); //are we on the mobile platform
                // isMobile = !isMobile; //uncomment for testing on web
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