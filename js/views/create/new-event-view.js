define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/create/new-event-view.hbs',
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
            user = _getUserData();
            selectedCustomListData = _getSelectedCustomListData();
        }; //eo initData
        var redirectPage = function() {
            _isRedirect = true;
            setTimeout(function() {
                spinner.hide();
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
            }, 2000);

        }; //eo redirectPage
        //various 'locals'
        var pickadateCalendar = null;
        var isMobile = false;
        var isBrowser = false;
        var selectedRepeatStr = "Never";
        var untilRepeatStr = moment().format('MM/DD/YYYY');
        var momentFormat = 'MMM D, h:mm A';
        var momentDateFormat = 'MM/DD/YY';
        var momentTimeFormat = 'H:mm A';
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
        var startClick = $.noop; //empty function
        var endClick = $.noop;
        var untilClick = $.noop;
        var toggleAllDay = false; //set to handle date picker(s)
        var defaults = {
            title: '',
            location: '',
            isAllDay: false,
            repeat: 'Never',
            until: '',
            reminder: 'Never',
            reminder2: 'Never',
            note: '',
            sendToCustomListId: '',
            startDateTime: moment(new Date()).startOf('hour').add(1, 'hours').toDate(), //local init setup
            endDateTime: moment(new Date()).startOf('hour').add(2, 'hours').toDate()
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
        };

        // http://tympanus.net/codrops/2012/10/04/custom-drop-down-list-styling/
        // EXAMPLE 3
        function DropDown(el) {
            this.dd = el;
            this.placeholder = this.dd.children('span');
            this.opts = this.dd.find('ul.dropdown > li');
            this.val = '';
            this.index = -1;
            this.initEvents();
        };

        DropDown.prototype = {
            initEvents: function() {
                var obj = this;
                obj.dd.on('click', function(event) {
                    $('#grouptype-menu-dropdown,#child-menu-dropdown').removeClass('active');
                    $(this).parent().addClass('active');
                    $(this).toggleClass('active');
                    return false;
                });
                obj.opts.on('click', function() {
                    var opt = $(this);
                    obj.val = opt.text();
                    obj.index = opt.index();
                    obj.placeholder.text(obj.val);
                });
            },
            getValue: function() {
                return this.val;
            },
            getIndex: function() {
                return this.index;
            }
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
            var hasFamilyGroup = false; //private event just for me?
            var familyGroupChild = null;
            var familyGroupType = null;

            var initEventData = function() {
                var _title, _location, _isAllDay, _startDate0, _endDate0, _untilDate0, _repeat, _until, _reminder, _reminder2, _note, _sendToCustomListId, cancelEvent;
                _event = _event || {};
                _title = _event.title || "";
                _location = _event.location || "";
                _isAllDay = _event.isAllDay || false;
                toggleAllDay = _isAllDay;
                _startDate0 = _event.startDate || null;
                _endDate0 = _event.endDate || null;
                _repeat = _event.repeat || "Never";
                _until = _event.until || '';
                _untilDate0 = _event.untilDate || null;
                _reminder = _event.reminder || "Never";
                _reminder2 = _event.reminder2 || "Never";
                _note = _event.note || "";
                _sendToCustomListId = _event.sendToCustomListId || "";
                cancelEvent = $('#cancel-event');
                $("#title").val(_title);
                $("#location").val(_location);
                allday = $('#allDay').prop('checked', _isAllDay);
                startDate = _startDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                endDate = _endDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                untilDate = _untilDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                // console.log('initEventData start/endDate:',startDate,endDate);
                // var repeat = $("#repeat").html(_repeat + '<i class="icon-right-open"></i>');
                var repeat = $("#repeat").html('<span class="reminder-val">' + _repeat + ' </span><i class="icon-right-open"></i>');

                //check the case repeat when don't have Never
                if (_repeat.trim() != 'Never') {
                    var repeatUtil = moment(_event.startDate).add(2, 'M').format('MM/DD/YY');
                    untilDate = repeatUtil;
                    isMobile ? $('#repeat-until').html(moment(new Date(repeatUtil)).format('MM/DD/YY')) : $('#repeat-until').val(repeatUtil);
                    $("#until").removeClass("hidden");
                }

                var until = $("#repeat-until").text(_until);
                var reminder = $("#reminder .reminder-val").text(_reminder);
                var reminder2 = $("#reminder2 .reminder-val").text(_reminder2);
                var _confirm = false;
                $("#note").val(_note);
            }; //eo initEventData
            var getStartEndDates = function() { //fix problems with parsing dates and times from the form
                var start, end, startTime, endTime, until;
                if (isMobile && !isBrowser) {
                    until = $("#repeat-until").text();
                    untilDate = moment(until, 'MM/DD/YY').toDate();
                    return;
                } //do not need to do anything
                start = $('#start').val(); // MM/DD/YYYY date string
                end = $('#end').val();
                until = $("#repeat-until").val();
                startTime = $('#start-time').val();
                endTime = $('#end-time').val();
                start = start + ' ' + startTime;
                end = end + ' ' + endTime;
                startDate = moment(start, 'MM/DD/YY hh:mm A').toDate();
                endDate = moment(end, 'MM/DD/YY hh:mm A').toDate();
                untilDate = moment(until, 'MM/DD/YY').toDate();
                //console.log('done start, end', startDate.toString(), endDate.toString());
            }; //eo getStartEndDates
            var saveFieldData = function() {
                var title = $("#title").val();
                var location = $("#location").val();
                var allday = $('#allDay').prop('checked');
                var repeat = $("#repeat").text();
                var until = isMobile ? $("#repeat-until").text() : $("#repeat-until").val();
                until = repeat === 'Never' ? '' : until;
                var reminder = $("#reminder .reminder-val").text();
                var reminder2 = $("#reminder2 .reminder-val").text();
                var note = $("#note").val();
                //store current event data for another day and copy it to the mediator.d
                //start and endDates taken from scope level start/endDate variables; convert to string so that we can make a copy to hold onto
                _event = { // _event is global
                    title: title,
                    location: location,
                    allday: allday,
                    startDate: startDate.toString(),
                    endDate: endDate.toString(),
                    repeat: repeat,
                    until: until,
                    untilDate: untilDate.toString(),
                    reminder: reminder,
                    reminder2: reminder2,
                    note: note
                };
                //console.log('initEventData title _event.start/endDate:',title, _event.startDate,_event.endDate);
                Chaplin.mediator.d = $.extend({}, _event); //make a copy, DONT simply bind the reference!
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
            var selectedCustomList = function() {
                if (selectedCustomListData) {
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
                        var nonUserContactEmail = selectedCustomListData.nonUserContactEmail;
                        var userContactEmail = selectedCustomListData.userContactEmail;
                        var allEmailArray = nonUserContactEmail.concat(userContactEmail);
                        //var data = {"allDay":true,"end":"Thurs","location":"617 Memak Road","note":"too fun","repeat":"monthly","start":"Wed","title":"Test 1"};
                        //Create new Email object on parse to trigger cloud code
                        var Email = Parse.Object.extend("Email");
                        var email = new Email();
                        email.set("type", "event");
                        email.set("recipientAddress", allEmailArray);
                        email.set("data", data);
                        email.set("customListId", selectedCustomListData.objectId);
                        email.set("customListName", selectedCustomListData.name);
                        email.set("groupId", selectedCustomListData.groupId);
                        email.set("organizationId", selectedCustomListData.organizationId);
                        email.save(null, {
                            success: function(email) {
                                // Execute any logic that should take place after the object is saved.
                                //alert('New object created with objectId: ' + gameScore.id);
                                // spinner.hide();
                                /*Chaplin.utils.redirectTo({
                                 name: 'home'
                                 });*/
                                //_alert("Done, a new email is sent to all contacts in your selected group!");
                            },
                            error: function(email, error) {
                                // Execute any logic that should take place if the save fails.
                                // error is a Parse.Error with an error code and message.
                                spinner.hide();
                                alert('Failed to send emails, with error: ' + error.message);
                            }
                        });
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }; //eo selectedCustomList
            /*if (_selectedCustomListId) { //See if user has already seleted a target list
             $("#sendto").html(_selectedCustomListName);
             $("#sendto").addClass("right-text");
             $("#sendto").removeClass("right-arrow");
             }*/
            //If the user has already seleted a list, then we display it
            /* click handler
             $('body').on('click','input.a.someClass',function(){
             alert("test");
             });
             */
            var familyGroupChildren = function() {
                var children = _getUserChildren();
                $('#familygroupchildren').empty();
                familyGroupChild = null;
                $.each(children, function(i, child) {
                    var el = '<li class="familygroupchildren"><a id="' + child.id + '" href="#">' + child.firstName + ' ' + child.lastName + '</a></li>'
                    $("#familygroupchildren").append(el);
                });
            }; //eo familyGroupChildren
            if (selectedCustomListData) {
                $("#sendto").html(selectedCustomListData.name);
                $("#sendto").addClass("right-text");
                $("#sendto").removeClass("right-arrow");
                if (selectedCustomListData.type === 'FamilyGroup') {
                    hasFamilyGroup = true; //initialize
                    familyGroupChild = null;
                    familyGroupType = null;
                    familyGroupChildren(); //dynamically add children to list
                    $('#grouptype-menu-dropdown').show();
                    $('#child-menu-dropdown').show();
                    $('#familygroupchildren').on('click', function(e) {
                        familyGroupChild = e.target.id;
                    });
                    $('#familygrouptype').on('click', function(e) {
                        var target = e.target;

                        familyGroupType = target.innerText;
                        console.log('familyGroupType: ' + familyGroupType);
                        console.log(target);

                        if (familyGroupType === undefined || familyGroupType === '') {
                            target = $(e.target).parent();
                            console.log(target);
                            console.log(target.text());
                            familyGroupType = target.text();
                        }

                        console.log('familyGroupType: ' + familyGroupType);

                        if (familyGroupType === _religious) {
                            familyGroupType = $(target).data('realname');
                        }

                        console.log('familyGroupType: ' + familyGroupType);
                    });
                } else {
                    hasFamilyGroup = false; //initialize
                    familyGroupChild = null;
                    familyGroupType = null;
                    $('#grouptype-menu-dropdown').hide();
                    $('#child-menu-dropdown').hide();
                    $('#familygroupchildren').off('click'); //maybe they changed their mind on the group
                    $('#familygrouptype').off('click');
                }
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
            $("#repeat").on('click', function() {
                var tagsRepeat = $("#repeat-picker > .box-wrapper > .time-wrapper > .time");
                _updateSelectedRepeat($(this).text(), tagsRepeat);

                $("#repeat-picker").removeClass("hidden");
                $("#until").removeClass("hidden");
                //$("#repeat-until").val(untilRepeatStr);
                // $('#repeat-until').val(moment(untilRepeatStr).format('M/D/YY'));
                isMobile ? $('#repeat-until').text(moment(untilRepeatStr).add(2, 'M').format('MM/DD/YY')) : $('#repeat-until').val(moment(untilRepeatStr).add(2, 'M').format('MM/DD/YY')); //2 months forward
            }); //eo #repeat click
            $("#reminder, #reminder2").on('click', function(e) {
                selectedRemindId = e.currentTarget.id;
                setReminderPicker(e.currentTarget.id);
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

                $("#repeat").html('<span class="reminder-val">' + selectedRepeatStr + ' </span><i class="icon-right-open"></i>');
                if (selectedRepeatStr === 'Never') {
                    $("#until").addClass("hidden");
                    var repeatUtil = moment(_event.startDate).format('M/DD/YY');
                    _untilDate = moment(_startDate).toDate();
                } else {
                    /*
                     add by phuongnh@vinasource.com
                     reason: only condition isMobile isn't enough, must check make sure that is using mobile app, not use web app
                     */
                    // var repeatUtil = isMobile ? moment(_startDate).add(2, 'M').format('M/DD/YY') : moment(_event.startDate).add(2, 'M').format('M/DD/YY');
                    var repeatUtil = isMobile && !isBrowser ? moment(_startDate).add(2, 'M').format('M/DD/YY') : moment(startDate).add(2, 'M').format('M/DD/YY');
                    $("#until").removeClass("hidden");
                    _untilDate = moment(_startDate).add(2, 'M').toDate();
                }

                $("#repeat-picker").addClass("hidden");
                isMobile ? $("#repeat-until").html(moment(new Date(repeatUtil)).format('MM/DD/YY')) : $("#repeatuntil").val(repeatUtil);

            }); //eo #repeat-picker .time-wrapper .time click
            $("#remind-picker .time-wrapper .time").on('click', function() {
                getReminderPicker(this.id);
            });

            //Init events
            $("#doneBtn").on('click', function(e) {
                var title = '';
                var UserCustomList = null;
                var query = null;
                var createNewEvent = function(userCustomListData, _e) {
                    var Event = Parse.Object.extend("Event");
                    var event = new Event();
                    var groupType = hasFamilyGroup ? familyGroupType : userCustomListData.get("groupType");
                    groupType = groupType ? groupType : 'ParentPlanet';

                    event.set("title", _e.title);
                    event.set("location", _e.location);
                    event.set("isAllDay", _e.allday);
                    event.set("startDateTime", startDate); //not a string, a Date object
                    event.set("endDateTime", endDate);
                    event.set("repeat", _e.repeat);
                    event.set("until", _e.until);

                    if (_e.until) {
                        event.set("untilDate", moment(_e.until).endOf('Day').toDate());
                    }

                    event.set("reminder", _e.reminder);
                    event.set("reminder2", _e.reminder2);
                    event.set("note", _e.note);
                    event.set("sendToCustomListId", selectedCustomListData.objectId);
                    event.set("senderId", user.id);
                    event.set("groupType", groupType);
                    event.set("orgIdForThisObject", userCustomListData.get("groupId"));
                    event.set("isCanceled", false);
                    return event;
                }; //eo createNewEvent
                var createRepeatingEvents = function(userCustomListData, _e) {
                    var repeatId = _generateRepeatId();
                    var repeatEvents = [];
                    var freq;
                    var interval = 1;
                    var occurrences = {}; //need to keep track of both start and end dates for each
                    //var until = moment(_e.until, "MM-DD-YYYY").toDate(); //this will always be a string to be recast as a date
                    var r = _e.repeat.trim().toLowerCase();
                    if (r.indexOf('day') >= 0) {
                        freq = RRule.DAILY;
                    } else if (r.indexOf('2') >= 0) { //order here is important 2 weeks and week
                        freq = RRule.WEEKLY;
                        interval = 2;
                    } else if (r.indexOf('week') >= 0) {
                        freq = RRule.WEEKLY;
                    } else if (r.indexOf('month') >= 0) {
                        freq = RRule.MONTHLY;
                    } else if (r.indexOf('year') >= 0) {
                        freq = RRule.YEARLY;
                    }

                    var dtstart = new Date(_e.startDate);
                    var dtStartUntil = moment(_e.untilDate).endOf("day").toDate();
                    var rule = new RRule({
                        freq: freq,
                        interval: interval,
                        dtstart: dtstart,
                        //until: until
                        until: dtStartUntil
                    });
                    occurrences.start = rule.all();

                    var dtend = new Date(_e.endDate);
                    var dtUntilEnd = moment(dtend).add(moment(dtStartUntil).diff(moment(dtstart), "day"), "day").toDate();
                    rule = new RRule({
                        freq: freq,
                        interval: interval,
                        dtstart: dtend,
                        //until: until
                        until: dtUntilEnd
                    });
                    occurrences.end = rule.all();
                    for (var i = 0; i < occurrences.start.length; i++) {
                        var event = createNewEvent(userCustomListData, _e);
                        event.set('startDateTime', occurrences.start[i]);
                        event.set('endDateTime', occurrences.end[i]);
                        event.set('repeatId', i === 0 ? _getRootRepeatId(repeatId) : repeatId);

                        repeatEvents.push(event);
                    };
                    return repeatEvents;
                }; //eo createRepeatingEvents
                var saveRepeatingEvents = function(repeatEvents, userCustomListData) {
                    Parse.Object.saveAll(repeatEvents, {
                        success: function(d) {
                            for (var i = 0; i < d.length; i++) {
                                var event = d[i];
                                _setUserEventsItem(event.id, event.attributes); //Update local storage
                                _setEventLocalNotification(event);
                            }
                            createUserRepeatEventRelations(d, userCustomListData);
                        }, //eo success
                        error: function(err) {
                            // An error occurred while saving one of the objects.
                            _alert('Internal Error: Unable to save repeating events to system calendar:' + err);
                            redirectPage();
                        }, //eo error
                    }); //eo saveAll
                }; //eo saveRepeatingEvents
                var saveNewEvent = function(localEvent, userCustomListData) {
                    var success = function(event) {
                        _setUserEventsItem(event.id, event.attributes); //Update local storage
                        _setEventLocalNotification(event);
                        //Next, create User-Event relation on Parse, pass along the event for autoSync instead of just the id
                        createUserEventRelations(event, userCustomListData);
                    };
                    var error = function(err) {
                        _alert('SaveNewEvent error:' + err.message);
                        redirectPage();
                    };
                    localEvent.save(null, {
                        success: success,
                        error: error
                    }); //eo event.save
                }; //eo saveNewEvent
                var createUserRepeatEventRelations = function(repeatEvents, userCustomListData) {
                    var recipientList = userCustomListData.get("recipientList");
                    var isUserOnListOfRecipients = false;
                    var parentIdList = [];
                    var relations = [];
                    var _autoSyncEvent = [];
                    var _autoSyncEventRelations = [];
                    var _autoSync = false;
                    var repeatId;
                    var firstRepeat = _firstRepeat();
                    var relation = null;
                    var recipient = null;
                    var parentId = null;
                    var childrenIdList = null;
                    var UserEventRelation = Parse.Object.extend("UserEventRelation");
                    var queryIOS = new Parse.Query(Parse.Installation);
                    var _event, eventId;
                    var j = 0;
                    var setRelation = function(userParentId) {
                        relation = new UserEventRelation();
                        relation.set("eventId", eventId);
                        relation.set("isRead", false);
                        relation.set("isUpdated", false);
                        relation.set("parentId", userParentId);
                        relation.set("childIdList", childrenIdList);
                        relation.set("groupType", userCustomListData.get("groupType"));
                        relation.set("groupId", userCustomListData.get("groupId"));
                        relation.set("organizationId", userCustomListData.get("organizationId"));
                    };
                    //console.log('in createUserRepeatEventRelations');
                    //start event wrap
                    var firstEventId = repeatEvents[0].id;

                    function processRepeatEvents(first, last, sendPush) { //need this function to send push only with the first event
                        var i = 0;
                        relations = [];
                        parentIdList = []; //make sure there won't be any duplicates
                        for (j = first; j < last; j++) {
                            _event = repeatEvents[j];
                            eventId = _event.id;
                            repeatId = _event.get('repeatId'); //the first of the repeat group will have a '-0' attached to the repeatId
                            if (repeatId) {
                                _autoSync = repeatId.indexOf(firstRepeat) < 0 ? false : true; //flag whether to autosync
                                _autoSync ? _autoSyncEvent.push(_event) : $.noop();
                            } else {
                                _alert('createUserRepeatEventRelations error, missing repeatId, eventId:' + eventId);
                                continue; //skip this
                            } //eo check on repeatId
                            for (i = 0; i < recipientList.length; i++) {
                                recipient = recipientList[i];
                                parentId = recipient.parent;
                                parentIdList.push(parentId); //Collect audience ids to send push notification
                                childrenIdList = recipient.children;
                                setRelation(parentId);
                                relations.push(relation);
                                if (user.id == parentId) {
                                    isUserOnListOfRecipients = true;
                                    _autoSyncEventRelations.push(relation);
                                }
                            } //eo for over recipientList.length
                            if (!isUserOnListOfRecipients) {
                                //Now, also create UserEventRelation for the creator so that they can see their own messages
                                // childrenIdList = [];
                                // family groups are now handled as a UserCustomList
                                childrenIdList = hasFamilyGroup ? [familyGroupChild] : []; //take care of case of family group
                                setRelation(user.id);
                                relations.push(relation);
                                _autoSyncEventRelations.push(relation);
                            } //eo if (!isUserOnListOfRecipients)
                        } //eo for over repeatEvents.length
                        Parse.Object.saveAll(relations, {
                            success: function(results) {
                                var parentId, eventRelation;
                                var result;

                                function repeatingResults() {
                                    $.each(results, function(i, result) {
                                        var parentId = result.get('parentId');
                                        var eventRelation = getEventRelation(result);
                                        // if(i === 0) { return; } //have already processed this one
                                        //Update content after creator's relation is created
                                        result && result.id && user.id === parentId ? _setUserEventRelationsItem(result.id, eventRelation) : $.noop();
                                    });
                                };
                                if (results.length > 0) {
                                    result = results[0];
                                } else {
                                    return;
                                }
                                var parentId = result.get('parentId');
                                var eventRelation = getEventRelation(result);
                                //Update content after creator's relation is created
                                result && result.id && user.id === parentId ? _setUserEventRelationsItem(result.id, eventRelation) : $.noop();
                                //add flag to only push the first one for repeating?
                                sendPush ? postCreateUserEventRelations(firstEventId, parentId, parentIdList, _autoSyncEvent, _autoSyncEventRelations, true) : $.noop();
                                results.length > 1 ? repeatingResults() : $.noop();
                            },
                            error: function(error) {
                                console.log("Could not saveAll createUserRepeatEventRelations: E02")
                            }
                        }); //eo Parse.Object.saveAll
                    }; //eo processRepeatEvents
                    processRepeatEvents(0, 1, true); //the first instance of a repeating event gets a push
                    processRepeatEvents(1, repeatEvents.length, false); //all others do not
                }; //eo createUserRepeatEventRelations
                var getEventRelation = function(result) {
                    var childIdList = result.get('childIdList') || [];
                    var eventId = result.get('eventId');
                    var groupType = result.get('groupType');
                    var isRead = result.get('isRead');
                    var isUpdated = result.get('isUpdated');
                    var parentId = result.get('parentId');
                    var objectId = result.id;
                    var createdAt = result.createdAt.toISOString();
                    var updatedAt = result.updatedAt.toISOString();
                    return {
                        childIdList: childIdList,
                        eventId: eventId,
                        groupType: groupType,
                        isRead: isRead,
                        isUpdated: isUpdated,
                        parentId: parentId,
                        objectId: objectId,
                        createdAt: createdAt,
                        updatedAt: updatedAt
                    };
                }; //eo getEventRelation
                var createUserEventRelations = function(event, userCustomListData) {
                    var eventId = event.id;
                    var _autoSyncEvent = [event];
                    var _autoSyncEventRelations = [];
                    var recipientList = userCustomListData.get("recipientList");
                    var isUserOnListOfRecipients = false;
                    var parentIdList = [];
                    var recipient = null;
                    var parentId = null;
                    var childrenIdList = null;
                    var UserEventRelation = Parse.Object.extend("UserEventRelation");
                    var relation = null;
                    var relations = [];
                    var setRelation = function(userParentId) {
                        relation = new UserEventRelation();
                        relation.set("eventId", eventId);
                        relation.set("isRead", false);
                        relation.set("isUpdated", false);
                        relation.set("parentId", userParentId);
                        relation.set("childIdList", childrenIdList);
                        relation.set("groupType", userCustomListData.get("groupType"));
                        relation.set("groupId", userCustomListData.get("groupId"));
                        relation.set("organizationId", userCustomListData.get("organizationId"));
                    };
                    // console.log('in createUserEventRelations');
                    for (var i = 0; i < recipientList.length; i++) {
                        recipient = recipientList[i];
                        parentId = recipient.parent;
                        parentIdList.push(parentId); //Collect audience ids to send push notification
                        // family groups are now handled as a UserCustomList
                        childrenIdList = hasFamilyGroup ? [familyGroupChild] : recipient.children; //take care of case of family group
                        setRelation(parentId);
                        relations.push(relation);
                        if (user.id == parentId) {
                            isUserOnListOfRecipients = true;
                            _autoSyncEventRelations.push(relation);
                        }
                    } //eo for over recipient list
                    if (!isUserOnListOfRecipients) {
                        //Now, also create UserEventRelation for the creator so that they can see their own messages
                        childrenIdList = hasFamilyGroup ? [familyGroupChild] : []; //handle family group
                        setRelation(user.id);
                        relations.push(relation);
                        _autoSyncEventRelations.push(relation);
                    } //eo if (!isUserOnListOfRecipients)
                    Parse.Object.saveAll(relations, {
                        success: function(results) {
                            var result = results[0];
                            var id = result.id;
                            var parentId = result.get('parentId');
                            var eventRelation = getEventRelation(result);
                            _setUserEventRelationsItem(id, eventRelation);
                            //  console.log('successful saveAll on to postCreateUserEventRelations');
                            //Update content after creator's relation is created
                            postCreateUserEventRelations(eventId, parentId, parentIdList, _autoSyncEvent, _autoSyncEventRelations, false);
                        },
                        error: function(error) {
                            _alert("Could not create new createUserEventRelations: E02");
                            redirectPage();
                        }
                    });
                }; //eo createUserEventRelations
                var postCreateUserEventRelations = function(eventId, parentId, parentIdList, autoSyncEvent, autoSyncEventRelations, isRepeating) {
                    var index = 0,
                        last = 0;
                    var promise = null;
                    var chunks = null; //array of arrays of parentIds
                    var chunk = null //one chunk
                    var chunkSize = 100; //test using size one chunks
                    function quit() {
                        //   console.log('new event pushes complete, redirect');
                        promise ? promise.resolve() : $.noop(); //resolve the top-level promise to go to the next/final step postprocess
                        redirectPage(); //only redirect AFTER pushes done!
                    }; //eo quitSend
                    function uniqueParentIdList(arr) {
                        var o = {};
                        var list = [];
                        var len = arr.length;
                        var i = 0,
                            j = 0;
                        var item;
                        for (i = 0; i < len; i++) {
                            item = arr[i];
                            if (o[item] === true) {
                                continue;
                            }
                            o[item] = true;
                            list[j++] = item;
                        }
                        return list;
                    }; //eo uniqueParentIdList

                    function sendPush(promise) {
                        var queryIOS = new Parse.Query(Parse.Installation);
                        var lagTime = Math.round(Math.random() * _pushSpreadTime); //random 0 - 30 minutes, from vars.js#287
                        var push_time;
                        var pushPrefix = isRepeating ? 'New Repeating Event: ' : 'New Event: ';
                        //var title;
                        function success() {
                            console.log('Success push for chunk index:' + index + ' pushTime:' + push_time.toString() + ' parentIdList:' + JSON.stringify(chunk));
                            ++index; //go to the next batch
                            promise.resolve(new Parse.Promise()); //recursion magic
                        }; //eo success
                        function error() {
                            console.log('Error push for chunk index:' + index + ' pushTime:' + push_time.toString() + ' parentIdList:' + JSON.stringify(chunk));
                            _alert('Error push for chunk index:' + index + ' pushTime:' + push_time.toString() + ' parentIdList:' + JSON.stringify(chunk));
                            ++index; //go to the next batch
                            promise.resolve(new Parse.Promise()); //recursion magic
                        }; //eo error
                        promise = promise || new Parse.Promise(); //first time we send, there is no promise, so create one for recursion
                        if (index >= last) { //have finished sending everything
                            quit();
                            return;
                        }
                        //recursion here:
                        promise.then(sendPush, quit); //bind a recursive send until d.index === n call quitSend if error
                        //get addresses to send to
                        chunk = chunks[index];
                        queryIOS.containedIn('userId', chunk);
                        // title = "New event: " + title.substring(0, 200) + "..."; //title
                        push_time = moment().add(lagTime, 's').toDate(); //when
                        // console.log('Queueing push for chunk index:'+index+' pushTime:'+push_time.toString()+' parentIdList:'+JSON.stringify(chunk));
                        /*
                         Add by phuongnh@vinasource.com
                         set push type for check when listen event receive push notification from app
                         */
                        Parse.Push.send({
                            where: queryIOS,
                            push_time: push_time,
                            data: { ////note: the alert title MUST contain the word 'event'
                                alert: pushPrefix + title.substring(0, 200),
                                badge: 1,
                                type: _Event_Type,
                                sound: "default",
                                'content-available': 1,
                                sender: user.id,
                                objectId: eventId
                            }
                        }, {
                            useMasterKey: true,
                            success: success,
                            error: error
                        });
                    }; //eo sendPush

                    //chunk up the parentIdList and send a staggered push for each
                    if (parentIdList.length < 1) {
                        redirectPage();
                    } //no one to send to

                    parentIdList = uniqueParentIdList(parentIdList);

                    userService.getLinkedAccountUserIds(parentIdList).then(
                        function(linkedUserIds) {
                            var userIdsToSendPush = parentIdList.concat(linkedUserIds);
                            chunks = _chunk(userIdsToSendPush, chunkSize); //array of arrays, currently of size 1
                            index = 0; //start with the first chunk
                            last = chunks.length; //how many
                            sendPush(); //start off the recursive loop                            
                        }
                    );
                }; //eo postCreateUserEventRelations
                //validate the form data and then save the event
                getStartEndDates();
                saveFieldData(); //hold on to the data while validating
                title = _event.title || ''; //set in saveFieldData!
                title = title.length > 160 ? title.substring(0, 160) + '...' : title;
                title = title + ' @ ' + moment(startDate).format('h:mma on MMM Do');

                try {
                    selectedCustomList();
                } catch (error) {
                    _alert("Please select a group and enter a title before Done");
                    return;
                }

                //if (_selectedCustomListId == null) {
                if (!selectedCustomListData) {
                    _alert("Please select a group before Done");
                } else if (!title) {
                    _alert("Please enter title before Done");
                } else {
                    //$("#email-field, #title-field, #location-field").removeClass("warning");
                    //Get CustomList data
                    UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    query = UserCustomList.query();
                    query.equalTo("ownerId", user.id);
                    query.equalTo("objectId", _selectedCustomListId);
                    spinner.show();
                    query.find({
                        success: function(results) {
                            var _e = _event || {};
                            var d = null;
                            var r = _e.repeat ? _e.repeat : 'never';
                            var isRepeating = !(r.trim().toLowerCase() === 'never' || r === null || typeof r === 'undefined');
                            var userCustomListData = results[0];

                            try {
                                d = isRepeating ? createRepeatingEvents(userCustomListData, _e) : createNewEvent(userCustomListData, _e);
                                isRepeating ? saveRepeatingEvents(d, userCustomListData) : saveNewEvent(d, userCustomListData);
                            } catch (err) {
                                //_alert("Internal error, createNewEvent:" + err.message);
                                _alert("Internal error, could not create the new event:" + err.message);
                                _event = {};
                                spinner.hide();
                                if (d.length) { //check data array
                                    redirectPage();
                                }
                            } finally {
                                _event = {};
                            } //eo try/catch/finally for create/save
                        }, //eo success query.find
                        error: function(err) {
                                _alert("Internal error, could not create the new event:" + err.message);
                                _event = {};
                                redirectPage();
                            } //eo error query.find
                    }); //eo query.find
                } //eo validation check of event form data

            }); //eo #doneBtn

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

            //handle date/time entry depending on which platform we are using
            var setupMobile = function() {
                var delta = 0; //!this is the critical variable,
                var startDateTime, endDateTime, untilDateTime;
                var startDateTimeString, endDateTimeString, untilDateTimeString;
                // console.log('setupMobile start/endDate:', startDate, endDate);
                if (startDate) { //use this if saved as a string or Date
                    startDateTime = $.type(startDate) == 'string' ? moment(new Date(startDate)) : moment(new Date(startDate.toString())); //local init setup
                } else { //null obj, just use defaults
                    startDateTime = moment(new Date()).startOf('hour').add(1, 'hours'); //local init setup
                }
                //  startDateTimeString = startDateTime.toString();
                _startDate = startDateTime.toDate(); //new Date(startDateTimeString); //use this in picker
                startDate = _startDate; //startDate is at the view scope level
                $("#start").html(startDateTime.format(momentFormat)); //don't use touch...
                if (endDate) { //use this if saved as a string
                    endDateTime = $.type(endDate) == 'string' ? moment(new Date(endDate)) : moment(new Date(endDate.toString())); //local init setup
                } else { //null obj or real Date,
                    endDateTime = moment(new Date()).startOf('hour').add(2, 'hours'); //local init setup
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
                    var mode = toggleAllDay ? 'date' : 'datetime';
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
                startDate = new Date();
                endDate = new Date();
                untilDate = new Date();

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
                startDateTime = moment().startOf('hour').add(1, 'hours');
                isStartReady = true;
                endDateTime = moment().startOf('hour').add(2, 'hours');
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
                $('#start-time').val(startDateTime.format('hh:mm A'));
                startTime = $('#start-time').val(); //!!!!!! set initial value
                $('#end').val(endDateTime.format('M/D/YY'));
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
                $("#start-date-field .icon-calendar").click(function(e) {
                    var picker = $("#start").pickadate('picker');
                    e.stopPropagation();
                    picker.open();
                    $("#start").trigger('click');
                });
                $("#end-date-field .icon-calendar").click(function(e) {
                    var picker = $("#end").pickadate('picker');
                    e.stopPropagation();
                    picker.open();
                    $("#end").trigger('click');
                });
                $("#start-date-field .icon-clock").click(function() {
                    $("#start-time").timepicker('showWidget');
                });
                $("#end-date-field .icon-clock").click(function() {
                    $("#end-time").timepicker('showWidget');
                });
                $("#repeat-until-field .icon-calendar").click(function(e) {
                    e.stopPropagation();
                    var picker = $("#repeat-until").pickadate('picker');
                    picker.open();
                    $("#repeat-until").trigger('click');
                });
            }; //eo setupWebapp

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
            });
            //Init dropdown menus
            new DropDown($('#dd-grouptype'));
            new DropDown($('#dd-child'));
            //set up for date/time entry sxm
            initEventData(); //repopulate event fields
            (isMobile ? setupMobile() : setupWebapp());
            if (isMobile) {
                $("#note").focus(function(e) {
                    $(".innerview-container").scrollTop($(".innerview-container").height() * 6 / 7);
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
        var __id = 'new-event-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            id: __id,
            container: '#main-container',
            className: 'view-container new-event-view',
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                _setCurrentView(_view.SCHEDULE_CREATION, __id);
                isMobile = _isMobile(); //are we on the mobile platform
                isBrowser = $('body').data('isBrowser'); //are we on a browser, maybe a mobile browser
                //console.log('isBrowser:', isBrowser);
                // isMobile = !isMobile; //uncomment for testing on web
                eventAttribute.call(this, 'isMobile', isMobile);
                eventAttribute.call(this, 'isBrowser', isBrowser);
                $("#footer-toolbar > li").removeClass("active"); //Reset footer
                Chaplin.View.prototype.initialize.call(this, arguments);
            },
            getTemplateData: function() {
                return {
                    event: getEvent.call(this),
                    religious: _religious
                };
            }
        }); //eo View.extend

        return View;
    }); //eo define