define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/create/update-homework-template.hbs',
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

        var redirectPage = function() { //Redirect to another page once a new message is created
            spinner.hide();
            _isRedirect = true;
            Chaplin.utils.redirectTo({
                name: 'homework'
            });
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
        var selectedReminderStr = "Never";
        var momentFormat = 'MMM D, h:mm A';
        var momentDateFormat = 'MM/DD/YY';
        ///var momentTimeFormat = 'H:mm A';
        //var momentDateTimeFormat = 'MM/DD/YY hh:mm A';
        var isStartReady = false;
        var isEndReady = false;
        var _startDate = null,
            _endDate = null;
        var _startDateDate, _assignedDate;
        var _endDateDate, _dueDate;
        var startClick = $.noop; //empty function
        var endClick = $.noop;
        //var toggleAllDay = false; //set to handle date picker(s)
        var done = $.noop; //noop until it is defined in addedToDOM
        var defaults = {
            title: '',
            type: 'Daily',
            repeat: 'Never',
            reminder: 'Never',
            note: '',
            sendToCustomListId: '',
            assignedDate: moment(new Date()).toDate(), //local init setup
            dueDate: moment(new Date()).toDate()
        }; //eo defaults

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
                        _alert('Edit homework internal error, no group found for id:' + d);
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
                    _alert('Edit homework internal error:' + err);
                    console.log('Edit homework internal error:' + err);
                    _selectedCustomListName = null;
                }
            });
        }; //eo getUserCustomListItem

        var setFieldData = function(d) {
            var date = null; //date objects being returned from Parse are a little funny, be careful!
            var userCustomListData = null;
            $("#title").val(d.title);
            //$("#location").val(d.location);
            //$('#allDay').prop('checked', d.isAllDay);
            $("#repeat").text(d.repeat);
            $("#reminder").text(d.reminder);
            $("#note").val(d.note);
            if (typeof d.assignedDate === 'string') {
                date = new Date(d.assignedDate); //homeworks updated after last login
            } else {
                date = new Date(d.assignedDate.iso); //format the date correctly using the .iso string
            }
            _startDate = date;
            $("#start").html(moment(date).format(momentDateFormat)); //don't use touch... label
            if (typeof d.assignedDate === 'string') {
                date = new Date(d.dueDate); //homeworks updated after last login
            } else {
                date = new Date(d.dueDate.iso); //format the date correctly using the .iso string
            }
            _endDate = date;
            $("#end").html(moment(date).format(momentDateFormat)); //don't use touch... label
            _selectedCustomListId = d.sendToCustomListId; //set global
            getUserCustomListItem(_selectedCustomListId);
        }; //eo setFieldData
        //if edit homework populate the view with homework data
        var editHomework = function() {
            _homework = $.extend(defaults, _homework);
            setFieldData(_homework);
            var deferred = null;
            var cancelSuccess = function() {
                done(null, true);
            };
            var cancelFailure = function() {
                _alert('Error: Unable to cancel this homework.')
            };
            var cancelHomework = $('#cancel-event');
            cancelHomework.show();
            cancelHomework.on('click', function(e) { //handle the cancel button
                deferred = _confirm('Do you want to cancel this homework, this cannot be undone?');
                deferred.done(cancelSuccess).fail(cancelFailure); //use a promise because this is async!
            });
        }; //eo editHomework
        //when the DOM has been updated let gumby reinitialize UI modules
        var backCancelBtnClick = function(e) {
            _closeByKeyboard();
            _selectedCustomListId = null;
            _selectedCustomListName = null;
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
        }; //backCancelBtnClick
        var addedToDOM = function() {
            //dates and times
            var isStartReady = false;
            var startDate = null;
            var isEndReady = false;
            var endDate = null;
            var isProject = false;
            var type = 'Daily';
            var initHomeworkData = function() {
                _homework = _homework || {};
                var _title = _homework.title || "";
                //var _location = _homework.location || "";
                // var _isAllDay = _homework.isAllDay || false;
                // toggleAllDay = _isAllDay;
                var _type = _homework.type || "Daily";
                var _startDate0 = _homework.startDate || null;
                var _endDate0 = _homework.endDate || null;
                var _repeat = _homework.repeat || "Never";
                var _reminder = _homework.reminder || "Never";
                var _note = _homework.note || "";
                var _sendToCustomListId = _homework.sendToCustomListId || "";
                var cancelHomework = $('#cancel-event');
                $("#title").val(_title);
                //$("#location").val(_location);
                //allday = $('#allDay').prop('checked', _isAllDay);
                isProject = _type == "Test/Project" ? true : false;
                $('#hwType').prop('checked', isProject); //set toggle to Test/Project
                startDate = _startDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                endDate = _endDate0; //this is a string that is converted to proper Date in setupMobile/webApp
                // console.log('initHomeworkData start/endDate:',startDate,endDate);
                var repeat = $("#repeat").text(_repeat);
                var reminder = $("#reminder").text(_reminder);
                var _confirm = false;
                $("#note").val(_note);
            }; //eo initHomeworkData
            var getDateTime = function() {
                if (isMobile) {
                    _startDate = $('#start').text();
                    startDate = moment(_startDate, momentDateFormat).toDate();
                    _endDate = $('#end').text();
                    endDate = moment(_endDate, momentDateFormat).toDate();
                } else {
                    _startDate = $('#start').val() + ' ' + $('#start-time').val();
                    startDate = moment(_startDate, momentDateFormat).toDate();
                    _endDate = $('#end').val() + ' ' + $('#end-time').val();
                    endDate = moment(_endDate, momentDateFormat).toDate();
                }
                console.log('done start, end', startDate.toString(), endDate.toString());
            }; //eo getDateTime
            var saveFieldData = function(homeworkCancelled) {
                var title = $("#title").val();
                //var location = $("#location").val();
                //var allday = $('#allDay').prop('checked');
                var repeat = $("#repeat").html();
                var reminder = $("#reminder").html();
                var note = $("#note").val();
                //store current homework data for another day and copy it to the mediator.d
                //start and endDates taken from scope level start/endDate variables; convert to string so that we can make a copy to hold onto
                $.extend(_homework, {
                    title: title,
                    assignedDate: startDate, //date objects
                    dueDate: endDate,
                    repeat: repeat,
                    reminder: reminder,
                    note: note,
                    isCanceled: homeworkCancelled ? true : false //get value from global scope where it can be set
                });
                console.log('Start Date: ' + _homework.startDate);
                //console.log('initHomeworkData title _homework.start/endDate:',title, _homework.startDate,_homework.endDate);
                //Chaplin.mediator.d = $.extend({}, _homework); //make a copy, DONT simply bind the reference!
            }; //eo saveFieldData

            /*
             *   MAIN DONE ACTION HERE
             */
            done = function(e, homeworkCancelled) {
                //Update homework on the server
                var Homework = Parse.Object.extend("Homework", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                var query = Homework.query();
                var objectId = _homework.objectId; //?
                var relation = []; //use to update native calendar
                var getRecipients = function(homework) {
                    //1. Pull UserHomeworkRelation to get recipient list
                    var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserHomeworkRelation.query();
                    query.equalTo("homeworkId", homework.id);
                    query.find({
                        success: function(results) {
                            //Collect user id here
                            var parentIdList = [];
                            var parentId;
                            for (var i = 0; i < results.length; i++) {
                                var homeworkRelation = results[i];
                                parentId = results[i].get("parentId");
                                if (parentIdList.indexOf(parentId) == -1) {
                                    parentIdList.push(parentId);
                                }
                                homeworkRelation.set("isUpdated", true);
                                homeworkRelation.set("isRead", false);
                                homeworkRelation.save();
                                _homework = {};
                                redirectPage();
                            } //eo array of push recipients

                            userService.getLinkedAccountUserIds(parentIdList).then(
                                function(linkedUserIds) {
                                    parentIdList = parentIdList.concat(linkedUserIds);
                                    sendUpdatePush(parentIdList, homework); //Send update push
                                },
                                function() {
                                    deferred.reject();
                                }
                            );

                            relation.push(results[0]);
                            // isMobile ? _autoSyncWithCalendar([homework], relation) : console.log('Webapp'); //sync update to native calendar
                        },
                        error: function(error) {
                            _alert("Error update homework: " + error);
                            spinner.hide();
                        }
                    });
                }; //eo getRecipients
                var sendUpdatePush = function(userIdArray, homework) {
                    //Send push notification for target audiences
                    var queryIOS = new Parse.Query(Parse.Installation);
                    queryIOS.containedIn('userId', userIdArray);
                    var pushSuccess = function() { // Push was successful
                        console.log("Push Notification sent for homework update");
                        redirectPage();
                    };
                    var pushFailure = function(error) {
                        _alert('Error: unable to send notification; ' + error);
                        console.log('Error: unable to send notification; ', error);
                    };
                    var canceled = homework.get('isCanceled');
                    var homeworkType = canceled ? "cancel" : "update";
                    var alert = canceled ? 'Homework Canceled: ' : 'Homework Updated: ';
                    alert += homework.get("title").substring(0, 80) + "...";
                    /*
                        Add by phuongnh@vinasource.com
                        set push type for check when listen event receive push notification from app
                     */
                    Parse.Push.send({ //when push comes in then remove from native calendar
                        where: queryIOS,
                        data: { //note: for homework push, it should not make sound or alert for the user
                            badge: 1,
                            type: _Homework_Type,
                            sound: "",
                            sender: Parse.User.current().id,
                            objectId: homework.id
                        }

                    }, {
                        useMasterKey: true,
                        success: pushSuccess,
                        failure: pushFailure
                    }); //eo Parse.Push
                }; //eo sendUpdatePush
                var homeworksItem = null; //from local storage
                spinner.show();
                getDateTime();
                saveFieldData(homeworkCancelled); //hold on to the data while validating
                query.equalTo("objectId", objectId);
                query.find({
                    success: function(results) {
                        var homework = results[0];
                        var saveSuccess = function(d) {
                            var id = d.id;
                            console.log('update success!', d);
                            _setUserHomeworkItem(id, d.attributes); //Update local storage
                            if (d.get('reminder')) {
                                _setHomeworkLocalNotification(d, false);
                            }
                            getRecipients(d); //Send update push notification
                        }; //eo findSuccess
                        var saveError = function(error) {
                            _alert("Error: Could not update even; " + error);
                            spinner.hide();
                            console.log(error);
                        }; //eo saveError
                        //set homework data here
                        //Update homework
                        homework.set('title', _homework.title);
                        homework.set('type', _homework.type);
                        homework.set('assignedDate', _homework.assignedDate);
                        homework.set('dueDate', _homework.dueDate);
                        homework.set('repeat', _homework.repeat);
                        homework.set('reminder', _homework.reminder);
                        homework.set('note', _homework.note);
                        homework.set('isCanceled', _homework.isCanceled);
                        //save onto parse
                        homework.save(null, {
                            success: saveSuccess,
                            error: saveError
                        });
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
            // var parseTime = function(timeStr, dt) { //parse the time string value and modify the input date with it
            //     var time = timeStr.match(/(\d+)(?::(\d\d))?\s*(p?)/i);
            //     if (!dt) {    dt = new Date();    }
            //     if (!time) {    return NaN;    }
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

            //click handlers
            $("#doneBtn").on('click', done);
            $("#backBtn").on('click', function(e) {
                backCancelBtnClick(e);
            }); //eo #backBtn click
            // $("#daily").on('click', function(e) {
            //     var flag = $('#hwType').prop('checked');
            //     $('#hwType').prop('checked', !flag);
            //     _homework.type = flag ? 'Test/Project' : 'Daily';
            // });
            // $("#project").on('click', function(e) {
            //     var flag = $('#hwType').prop('checked');
            //     $('#hwType').prop('checked', !flag);
            //     _homework.type = flag ? 'Test/Project' : 'Daily';
            // });
            $("#hwType").on('click', function(e) {
                var flag = $('#hwType').prop('checked');
                _homework.type = flag ? 'Test/Project' : 'Daily';
            }); //eo hwType click
            $("#repeat").on('click', function() {
                $("#repeat-picker").removeClass("hidden");
            });
            $("#repeat-cancel").on('click', function() {
                $("#repeat-picker").addClass("hidden");
            });
            $("#reminder").on('click', function() {
                $("#reminder-picker").removeClass("hidden");
            });
            $("#reminder-cancel").on('click', function() {
                $("#reminder-picker").addClass("hidden");
            });
            $("#repeat-ok").on('click', function() {
                $("#repeat-picker").addClass("hidden");
                $("#repeat").html(selectedRepeatStr);
            });
            $("#repeat-picker > .box-wrapper > .time-wrapper > .time").on('click', function() {
                $("#repeat-picker > .box-wrapper > .time-wrapper > .time > .checked").addClass("hidden");
                $(this).children(".checked").removeClass("hidden");
                selectedRepeatStr = $(this).children("span").html();
            });
            $("#reminder-ok").on('click', function() {
                $("#reminder-picker").addClass("hidden");
                $("#reminder").html(selectedReminderStr);
            });
            $("#reminder-picker > .box-wrapper > .time-wrapper > .time").on('click', function() {
                $("#reminder-picker > .box-wrapper > .time-wrapper > .time > .checked").addClass("hidden");
                $(this).children(".checked").removeClass("hidden");
                selectedReminderStr = $(this).children("span").html();
            });
            //Init all-day button TODO: move into setupMobile and write equiv. for webapp
            // $("#allDayToggle").on('click', function(e) {
            //     var flag = $('#allDay').prop('checked');
            //     var assignedDateString, dueDateString;
            //     if (flag) { //rebind click handling TODO: setup start/endClick for webapp?
            //         allday = true;
            //         _startDate = new Date().setHours(0, 0, 0, 0);
            //         _startDate = moment(_startDate);
            //         assignedDateString = _startDate.format(momentDateFormat);
            //         _startDate = _startDate.toDate();
            //         $("#start").html(assignedDateString);
            //         _endDate = new Date().setHours(23, 59, 59, 0);
            //         _endDate = moment(_endDate);
            //         dueDateString = _endDate.format(momentDateFormat);
            //         _endDate = _endDate.toDate();
            //         $("#end").html(dueDateString);
            //         isStartReady = true;
            //         isEndReady = true;
            //         toggleAllDay = true;
            //     } else {
            //         allday = false;
            //         toggleAllDay = false;
            //     } //eo else if(allday)
            //     console.log('toggleAllDay', toggleAllDay);
            // }); //eo allDayToggle

            //handle date/time entry depending on which platform we are using
            var setupMobile = function() {
                var delta = 0; //!this is the critical variable,
                var assignedDate;
                var dueDate;
                var assignedDateString;
                var dueDateString;
                /*
                console.log('setupMobile start/endDate:', startDate, endDate);
                if (startDate) { //use this if saved as a string or Date
                    assignedDate = $.type(startDate) == 'string' ? moment(new Date(startDate)) : moment(new Date(startDate.toString())); //local init setup
                } else { //null obj, just use defaults
                    assignedDate = moment(new Date()).startOf('hour').add(1, 'hours'); //local init setup
                }
                //  assignedDateString = assignedDate.toString();
                _startDate = assignedDate.toDate(); //new Date(assignedDateString); //use this in picker
                startDate = _startDate; //startDate is at the view scope level
                $("#start").html(assignedDate.format(momentDateFormat)); //don't use touch...
                if (endDate) { //use this if saved as a string
                    dueDate = $.type(endDate) == 'string' ? moment(new Date(endDate)) : moment(new Date(endDate.toString())); //local init setup
                } else { //null obj or real Date,
                    dueDate = moment(new Date()).startOf('hour').add(2, 'hours'); //local init setup
                }
                //dueDateString = dueDate.toString();
                _endDate = dueDate.toDate();
                // _endDate = new Date(dueDateString); //use this in picker
                endDate = _endDate; //startDate is at the view scope level
                */
                if (typeof _homework.assignedDate === 'string') { //updated after last login
                    assignedDate = _homework.assignedDate;
                    dueDate = _homework.dueDate;
                } else {
                    assignedDate = _homework.assignedDate.iso;
                    dueDate = _homework.dueDate.iso;
                }
                //console.log('422: '+assignedDate);
                assignedDate = moment(assignedDate);
                dueDate = moment(dueDate);
                startDate = _startDate = assignedDate.toDate();
                endDate = _endDate = dueDate.toDate();
                $("#end").html(dueDate.format(momentDateFormat));
                // var incrementByDelta = function() {
                //     var msec = _startDate.getTime();
                //     msec += delta;
                //     return new Date(msec)
                // };
                // var calculateDelta = function() {
                //     delta = _endDate.getTime() - _startDate.getTime(); //delta in mSec.
                //     return delta;
                // };
                // // ------------------- start off with a delta of 1 hour --
                // // ? must have calculateDelta function defined before this, do not know why hoisting is not working  as expected ????
                // // ? anyway call order works just fine like this
                // calculateDelta(); //starting delta is 1 hour
                // -------------------------------------------------------
                startClick = function(e) {
                    var options = null;
                    var date = _startDate; //when editing a date use the one already picked
                    console.log('445: ' + _startDate);
                    var mode = 'date';
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
                        $("#start").html(moment(date).format(momentDateFormat));
                        _startDate = date; //picked a date store for later use
                        // if (toggleAllDay) {
                        //     _date = moment(date).toDate();
                        //     date = _date.setHours(23, 59, 59, 0);
                        //     date = new Date(date);
                        //     _endDate = date;
                        // } else {
                        //     _endDate = incrementByDelta();
                        //     //console.log('new _endDate after increment:'+_endDate.toString());
                        //     date = _endDate;
                        // }
                        // $("#end").html(moment(date).format(momentDateFormat));
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
                    //     _alert('For all day homeworks only a start date can be selected.');
                    //     return; //dont allow user to send end date for allDay, only start ...
                    // }
                    datePicker.show(options, function(date) { // calling show() function with options and a result handler
                        //alert("date result " + date) ---> Thu Jul 13 1471 12:39:56 GMT+0700 (ICT)
                        date = date ? date : _endDate; //handle case of cancel button where date = ''
                        // date = toggleAllDay ? date.setHours(23,59,59,0) : date;
                        $("#end").html(moment(date).format(momentDateFormat));
                        // if (calculateDelta() < 0) {
                        //     _alert('Please Pick an End Date that is After the Start Date');
                        //     return;
                        // }
                        _endDate = date;
                        endDate = _endDate;
                        // delta = calculateDelta(); //set the delta based on the set time;
                    });
                }; //eo #end click
                $("#end").on('click', endClick);
            }; //eo setupMobile
            var setupWebapp = function() {
                var delta = 0;
                var assignedDate, dueDate;
                //var startTime, endTime; //for use with delta
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
                    var UTC = Date.UTC(_year, _month, _day);
                    var pickadateDay = '#' + id + '_table div.pickadate__day[data-pick="' + UTC + '"]';
                    pickadateDay = $(pickadateDay);
                    pickadateDay.addClass('pickadate__day--highlighted--event');
                    pickadateDay.data('isEvent', 'true');
                };
                var virtualInput = $('#start, #end').pickadate({
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
                            // $('#end').removeAttr('disabled').prop('placeholder', _date).val(_date);
                            // $('#end-date-field input[name="_submit"]').attr('value', _date);
                            $('#start_root').css("pointer-events", "none").hide();
                        } else {
                            $('#end-date-field input[name="_submit"]').attr('value', _date);
                            $('#end_root').css("pointer-events", "none").hide();
                        }
                        _v = $('#' + _id).val();
                        _v = _v.split('/');
                        _date = (_id === 'start' ? startDate : endDate); //update the start/endDate for the homework
                        _date.setFullYear(20 + _v[2], _v[0] - 1, _v[1]);
                        // console.log(_v + ' close calendar:' + _date.toString());
                    }
                }); //eo virtualInput
                //use the preset start/end dates from _homework
                if (typeof _homework.assignedDate === 'string') { //updated after last login
                    assignedDate = _homework.assignedDate;
                    dueDate = _homework.dueDate;
                } else {
                    assignedDate = _homework.assignedDate.iso;
                    dueDate = _homework.dueDate.iso;
                }
                assignedDate = moment(assignedDate);
                dueDate = moment(dueDate);
                startDate = _startDate = assignedDate.toDate(); //kludge to handle various scopes that need these dates
                endDate = _endDate = dueDate.toDate();
                isStartReady = true;
                isEndReady = true;
                //create the calendar widgets
                pickadateCalendar = virtualInput.pickadate('picker');
                $('.icon-calendar').on('click', function() {
                    pickadateCalendar.open(false);
                });
                $('#start').val(assignedDate.format('MM/DD/YY'));
                //$('#start-time').val(assignedDate.format('hh:mm A'));
                //startTime = $('#start-time').val(); //!!!!!! set initial value
                $('#end').val(dueDate.format('MM/DD/YY'));
                $ //('#end-time').val(dueDate.format('hh:mm A'));
                //delta = calculateDelta();
                // $("#start-time, #end-time").timepicker({
                //     minuteStep: 5,
                //     secondStep: 5,
                //     orientation: {x:'right', y:'top'}
                // }).on('changeTime.timepicker', function(e) {
                //     var timeString = e.time.value;
                //     var dt = (this.id === 'start-time' ? startDate : endDate);
                //     dt = parseTime(timeString, dt);
                //     if (this.id === 'start-time') {
                //         incrementByDelta();
                //         startTime = $('#start-time').val();
                //     }
                //     if (this.id === 'end-time') {   delta = calculateDelta();    }
                //     //   console.log('The time is ' + timeString + ' parsed:' + dt.toString());
                // }).on('show.timepicker', function(e) {
                //     var dt = (this.id === 'start-time' ? $('#start-time').val() : $('#end-time').val());
                //     // console.log('on show timepicker id:'+this.id+" time:"+dt);
                //     if (this.id === 'start-time') {    $('#start-time').timepicker('setTime', dt);    }
                //     if (this.id === 'end-time') {    $('#end-time').timepicker('setTime', dt);    }
                //     //   console.log('The time is ' + timeString + ' parsed:' + dt.toString());
                // });
                // $("#start-date-field .icon-clock").click(function() {    $("start-time").timepicker('showWidget');    });
            }; //eo setupWebapp

            if (_selectedCustomListId) { //See if user has already seleted a target list
                $("#sendto").html(_selectedCustomListName);
                $("#sendto").addClass("right-text");
                $("#sendto").removeClass("right-arrow");
            }
            //set up for date/time entry sxm
            initHomeworkData(); //repopulate homework fields
            (isMobile ? setupMobile() : setupWebapp());
            editHomework();
            //if(isEdit) {    editHomework();    }

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
        var getHomework = function() {
            return this.model.attributes.event;
        };
        var __id = 'update-homework-view';
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
                    event: getHomework.call(this)
                };
            }
        }); //eo View.extend

        return View;
    }); //eo define