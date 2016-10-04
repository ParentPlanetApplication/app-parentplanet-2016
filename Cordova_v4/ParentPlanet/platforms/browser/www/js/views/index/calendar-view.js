define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/index/calendar-view.hbs',
        'jquery',
        'backbone.touch',
        'parseproxy',
        'moment',
        'picker',
        'underscore',
        'handlebars',
        'text!templates/index/calendar-item.hbs',
        'picker.date',
        'jqueryui',
        'parse'
    ],
    function(Chaplin, View, Template, $, touch, ParseProxy, moment, picker, _, handlebars, template2, Parse) {
        'use strict';
        var isMobile = false;
        var pickadateCalendar = null;
        var totalNew;
        var eventDaysUTC = [];
        var today = {    nav: 0    };
        var repeatingEvents = []; //need array of eventIds for repeating events
        var adjustCalendarHeights = function() {
            var calendarTopHeight = $("#calendar-top").height();
            $("#calendar-bottom").height($(".calendar-content").height() - calendarTopHeight);
            $("datepicker2").height(calendarTopHeight);
        };
        //change name so as to be able to use 'children' as a var from localStorage fetch
        var _children = {     id: [],    color: []    };
        var loadEvents = function(eventIdList, eventIsRead, eventChildIdList) {
            eventDaysUTC = [];
            var events = _getUserEvents();
            function noEvents () {
                $("#calendar-bottom").html('<div style="text-align:center;">You have no upcoming events</div>');
            }; //eo noEvents
            function hasEvents () {
                $("#calendar-bottom").empty();
                var dateIndex = [];
                //var dateArrayForCalendarWidget = [];
                var startDate = null;
                var startYear, startMonth, startDay;
                var UTC, date, date0;
                var cls, isAllDay, time, isRead, color, childId;
                var contentCount = 0;
                var el;
                var clr, grp;
                var elTemplate = template2;
                var context = null;
                var prefix = { cls: '', title: '' };
                elTemplate = handlebars.compile(elTemplate);
                _.each(events, function(event, i) {
                    //Filter unwanted activities (activites equal to organizationGroup, said Michael in July-August)
                    var customListId = event.sendToCustomListId;
                    var isCanceled = function () {
                            return event.isCanceled ? { cls: ' canceled', title: 'CANCELED: ' } : { cls: '', title: '' } ;
                    }; //eo isCanceled
                    if(event.repeatId) {
                        repeatingEvents.push(event.objectId); //need this to distinguish events from repeats
                    }
                    if (_unselectedActivityIdList.indexOf(event.orgIdForThisObject) == -1) {
                        //Check date for displaying appropriated title
                        if (eventIdList.indexOf(event.objectId) != -1) {
                            if (typeof event.startDateTime === 'string') { //for updated events
                                date = moment(event.startDateTime).calendar();
                                date0 = moment(event.startDateTime);
                                startDate = new Date(event.startDateTime);
                            } else {
                                date = moment(event.startDateTime.iso).calendar();
                                date0 = moment(event.startDateTime.iso);
                                startDate = new Date(event.startDateTime.iso);
                            }

                            startYear = startDate.getFullYear();
                            startMonth = startDate.getMonth();
                            startDay = startDate.getDate();
                            UTC = new Date(startYear, startMonth, startDay);
                            UTC = UTC.getTime();

                            //UTC = date0.valueOf(); //use moment the way it is supposed to be used, local time

                            eventDaysUTC.push(UTC);
                            cls = false; //add a 'first' class to the item if it immediately follows a date title
                            if (dateIndex.indexOf(date) === -1) {
                                dateIndex.push(date);
                                // dateArrayForCalendarWidget.push(moment(event.startDateTime.iso).format("MM/DD/YY"));
                                $("#calendar-bottom").append('<div class="content-title" id="' + UTC + '">' + date + '</div>');
                                cls = true; //have a calendar title, add a .first to the item that immediately follows
                            }
                            isAllDay = event.isAllDay;
                            time = isAllDay ? "All-Day" : date0.format('h:mm a');
                            isRead = eventIsRead[eventIdList.indexOf(event.objectId)];
                            if (eventChildIdList[eventIdList.indexOf(event.objectId)].length > 1) {
                                color = _orgIconColorForMultipleChild;
                            } else if (eventChildIdList[eventIdList.indexOf(event.objectId)].length == 1) {
                                childId = eventChildIdList[eventIdList.indexOf(event.objectId)].toString();
                                color = _children.color[_children.id.indexOf(childId)];
                            } else {
                                color = "#000000";
                            }
                            //add a .first class to first item for custom css
                            clr = color;
                            grp = event.groupType;
                            prefix = isCanceled();
                            cls = (cls ? 'content-item event first' : 'content-item event');
                            cls += prefix.cls; //canceled class for canceled events
                            context = {
                                cls: cls,
                                objectId: event.objectId,
                                isRead: JSON.stringify(isRead),
                                grp: grp,
                                clr: clr,
                                orgIcon: _getOrgIcon(event.groupType, color),
                                prefixTitle: prefix.title,
                                eventTitle: event.title,
                                time: time
                            }; // data that is injected into function el
                            // cls = cls.slice(0, -1) + prefix.cls; //canceled class for canceled events
                            // el = '<div class=' + cls + ' type="calendar" uid="' + event.objectId + '" isRead="' + isRead + '" grp="' + grp + '" clr="' + clr + '">';
                            // el += '<div class="text-wrapper">' + _getOrgIcon(event.groupType, color) + ' ' + prefix.title + event.title + '</div><div class="time-info">' + time + '</div>' + '</div>';
                            el = elTemplate(context);
                            $("#calendar-bottom").append(el);
                            cls = false; //always reset
                            contentCount++;
                        } //eo if eventidlist
                    } //eo if stuff
                    //}
                }); //eo _each
                if (contentCount == 0) {
                    $("#calendar-bottom").html('<div style="text-align:center;">You have no upcoming events</div>');
                }
                //highlight the days having events in the calendar
                highlightEventDays();
                //Create solid lines
                $(".content-title").each(function() {
                    $(this).prev().css("border-bottom", "solid 1px #ccc");
                });
                //Bold unread event
                $(".event[isRead='false']").addClass("text-bold");
                //Init jQuery UI date picker
                //var datesArray=['7/17/2014','8/27/2014'];
                //Init events
                $(".content-item.event").on("click", function(e) {
                    var that = $(this);
                    var color, groupType;
                    var isRead = that.attr('isread') === 'true';
                    isRead ? $.noop() : _updateNotiBadgeCount('messages', false);
                    color = that.attr("clr");
                    groupType = that.attr("grp");
                    that.addClass("bg-highlight-grey");
                    _selectedEventId = that.attr("uid");
                    _selectedIcon = _getOrgIcon(groupType, color);
                    setTimeout(function() {
                        _setPreviousView();
                        Chaplin.utils.redirectTo({    name: 'read-calendar'    });
                    }, DEFAULT_ANIMATION_DELAY);
                }); //eo click
            }; //eo hasEvents
            events.length === 0 ? noEvents() : hasEvents();
            $("#spinner-top").remove();
        }; // eo load events

        var loadEventRelations = function() {
            var children = _getUserChildren();
            var eventRelations = _getUserEventRelations();
            function noEvents() {
                $("#calendar-bottom").html('<div style="text-align:center; padding:0 10px;">You have no upcoming or pending events</div>');
            }; //eo noEvents
            function hasEvents() {
                var eventIdList = [];
                var eventIsRead = [];
                var eventChildIdList = [];
                var eventRelation;
                var childIdList;
                function containsAll(element, index, array) {
                  return _unselectedKidIdList.indexOf(element) != -1;
                }; //eo containsAll
                //Collect all event ids
                for (var i = 0; i < eventRelations.length; i++) {
                    eventRelation = eventRelations[i];
                    //Apply children filtering here
                    childIdList = eventRelation.childIdList;
                    if ((children.length != 0) && (children.length == _unselectedKidIdList.length)) {
                        //Do nothing
                    } else if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {
                        //Do nothing
                    } else if (childIdList.length > 0 && childIdList.every(containsAll)) {
                        //Do nothing
                    } else if (eventIdList.indexOf(eventRelation.eventId) == -1) {
                        eventIdList.push(eventRelation.eventId);
                        eventIsRead.push(eventRelation.isRead);
                        eventChildIdList.push(eventRelation.childIdList);
                    }
                }
                eventIdList.length == 0 ? noEvents() : loadEvents(eventIdList, eventIsRead, eventChildIdList);
            }; //eo hasEvents
            eventRelations.length == 0 ? noEvents() : hasEvents();
            $("#spinner-top").remove();
        }; //eo loadEventRelations

        var highlightEventDays = function() {
            var pickadateDay;
            _.each(eventDaysUTC, function(UTC, index) {
                function highlight() {
                    pickadateDay.addClass('pickadate__day--highlighted--event');
                    pickadateDay.data('isEvent', 'true');
                    //console.log('highlighted day:',moment(UTC).toString());
                };
                pickadateDay = 'div.pickadate__day[data-pick="' + UTC + '"]';
                pickadateDay = $(pickadateDay);
                pickadateDay.length > 0 ? highlight() : $.noop();
            });
        }; //eo highlightEventDays

        var displayNewAndUpdatedEvents = function() {
            var eventRelations = _getUserEventRelations();
            var events = _getUserEvents();
            var newEventRelations = [];
            var updatedEventRelations = [];
            var repeatIdArray = []; //need array of repeatIds to get number of different events that repeat
            var eventRelation = null;
            var totalUpdate = 0, totalRepeats = 0;
            totalNew = 0;
            for (var i = 0; i < eventRelations.length; i++) {
                eventRelation = eventRelations[i];
                if (eventRelation.isRead == false && eventRelation.isUpdated == false) {
                    repeatingEvents.indexOf(eventRelation.eventId) < 0 ? $.noop() : totalRepeats++;
                    newEventRelations.push(eventRelation);
                }
                if (eventRelation.isRead == false && eventRelation.isUpdated == true) {
                    updatedEventRelations.push(eventRelation);
                }
            }
            for (var i = 0; i < newEventRelations.length; i++) {
                var unreadEvent = $.grep(events, function(e){
                            return e.objectId == newEventRelations[i].eventId;
                    });

                if(unreadEvent[0] != undefined) {
                    var repeatId = unreadEvent[0].repeatId;
                    if (repeatId) {
                        repeatIdArray.indexOf(repeatId.substring(0, 12)) == -1 ? repeatIdArray.push(repeatId.substring(0, 12)) : $.noop();
                    }
                }
            }
            if (totalRepeats != 0) { //count first repeat
                totalRepeats = totalRepeats - repeatIdArray.length;
            }
            totalNew = newEventRelations.length - totalRepeats; //do not count the repeats
            totalUpdate = updatedEventRelations.length;
            $("#calendar-bar").empty();
            $("#calendar-bar").append('<div id="event-new">' + totalNew + ' New</div><div id="event-updated">' + totalUpdate + ' Updated</div>');
            _checkUnreadEvent();
            initCalendarBarEventHandler();
        }; //eo displayNewAndUpdatedEvents

        var initCalendarBarEventHandler = function() {
            $("#event-new").on('click', function(e) {
                var spinner = _createSpinner("box-spinner");
                var eventRelations = _getUserEventRelations();
                var newEventRelations = [];
                var updatedEventRelations = [];
                var eventIdList = [];
                var eventChildIdList = [];
                $("#new-event-box > .box-content").html('<div id="box-spinner" class="spinner-wrapper text-center"></div>');
                $("#new-event-box").css("display", "block");
                $("#new-event-box > .bg").animate({
                    "opacity": "0.6"
                }, 1000, "easeOutCirc");
                $("#new-event-box > .box-content").animate({
                    "opacity": "1",
                    "height": "65px"
                }, 1000, "easeOutCirc");
                for (var i = 0; i < eventRelations.length; i++) {
                    var eventRelation = eventRelations[i];
                    if (eventRelation.isRead == false && eventRelation.isUpdated == false) {
                        newEventRelations.push(eventRelation);
                    }
                    if (eventRelation.isRead == false && eventRelation.isUpdated == true) {
                        updatedEventRelations.push(eventRelation);
                    }
                } //eo for eventRelations
                //Collect all event ids
                for (var i = 0; i < newEventRelations.length; i++) {
                    var eventRelation = newEventRelations[i];
                    if (eventIdList.indexOf(eventRelation.eventId) == -1) {
                        eventIdList.push(eventRelation.eventId);
                        eventChildIdList.push(eventRelation.childIdList);
                    }
                }
                //Get latest events
                initNewEventBox(eventIdList, eventChildIdList);
                spinner.stop();
            }); //eo #event-new click

            $("#event-updated").on('click', function(e) {
                var spinner = _createSpinner("box-spinner");
                var eventRelations = _getUserEventRelations();
                var newEventRelations = [];
                var updatedEventRelations = [];
                var eventIdList = [];
                var eventChildIdList = [];
                $("#updated-event-box > .box-content").html('<div id="box-spinner" class="spinner-wrapper text-center"></div>');
                $("#updated-event-box").css("display", "block");
                $("#updated-event-box > .bg").animate({
                    "opacity": "0.6"
                }, 1000, "easeOutCirc");
                $("#updated-event-box > .box-content").animate({
                    "opacity": "1",
                    "height": "65px"
                }, 1000, "easeOutCirc");
                for (var i = 0; i < eventRelations.length; i++) {
                    var eventRelation = eventRelations[i];
                    if (eventRelation.isRead == false && eventRelation.isUpdated == false) {
                        newEventRelations.push(eventRelation);
                    }
                    if (eventRelation.isRead == false && eventRelation.isUpdated == true) {
                        updatedEventRelations.push(eventRelation);
                    }
                } //eo for eventRelations.length
                //Collect all event ids
                for (var i = 0; i < updatedEventRelations.length; i++) {
                    var eventRelation = updatedEventRelations[i];
                    if (eventIdList.indexOf(eventRelation.eventId) == -1) {
                        eventIdList.push(eventRelation.eventId);
                        eventChildIdList.push(eventRelation.childIdList);
                    }
                }
                //Get latest events
                initUpdatedEventBox(eventIdList, eventChildIdList);
                spinner.stop();
            }); //eo #event-updated click
        }; //eo initCalendarBarEventHandler

        var initNewEventBox = function(eventIdList, eventChildIdList) {
            var events = _getUserEvents();
            var temp = [];
            var newEventsLength = totalNew;
            var repeatIdsArray = []; // store repeat id after listing first instance of repeating event
            function sortEvents() {
                events = events.sort(function(a, b) { // a < b -1, a > b 1, a = b 0 ascending
                    a = Date.parse(a.startDateTime.iso); //num. msec since 1970
                    b = Date.parse(b.startDateTime.iso);
                    if(a < b) { return -1; }
                    if(a > b) { return 1;  }
                    return 0;
                });
            }; //eo sortEvents
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                if (eventIdList.indexOf(event.objectId) != -1) {
                    temp.push(event);
                }
            }
            events = temp;
            sortEvents();
            if (events.length == 0) {
                $("#new-event-box > .status-bar").html("0 New");
                $("#new-event-box > .box-content").html('<div style="text-align:center;">You have no new events.</div>');
            } else {
                $("#new-event-box > .box-content").empty();
                var dateIndex = [];
                // var dateArrayForCalendarWidget = [];
                for (var i = 0; i < events.length; i++) {
                    var event = events[i];
                    if (typeof event.startDateTime === 'string') { //updated events
                        var date = moment(event.startDateTime).calendar();
                        var date0 = moment(event.startDateTime);
                    } else {
                        var date = moment(event.startDateTime.iso).calendar();
                        var date0 = moment(event.startDateTime.iso);
                    }
                    var isAllDay = event.isAllDay;
                    var time = isAllDay ? "All-Day" : date0.format('h:mm a');
                    var color;
                    if (eventChildIdList[eventIdList.indexOf(event.objectId)].length > 1) {
                        color = _orgIconColorForMultipleChild;
                    } else if (eventChildIdList[eventIdList.indexOf(event.objectId)].length == 1) {
                        var childId = eventChildIdList[eventIdList.indexOf(event.objectId)].toString();
                        color = _children.color[_children.id.indexOf(childId)];
                    } else {
                        color = "#000000";
                    }
                    if (event.repeatId) {
                        if (repeatIdsArray.indexOf(event.repeatId.substring(0, 12)) == -1) {
                            repeatIdsArray.push(event.repeatId.substring(0, 12));
                            $("#new-event-box > .box-content").append('<div class="box-item" type="calendar" eventId="' + event.objectId + '">' + _getOrgIcon(event.groupType, color) + ' ' + event.title + '<span class="text">'+event.repeat+'</span><span class="date-time">' + date + " " + time + '</span><div class="view-event-btn">View Event</div><div class="ok-btn">OK</div></div>');
                        }
                    } else {
                        $("#new-event-box > .box-content").append('<div class="box-item" type="calendar" eventId="' + event.objectId + '">' + _getOrgIcon(event.groupType, color) + ' ' + event.title + '<span class="date-time">' + date + " " + time + '</span><div class="view-event-btn">View Event</div><div class="ok-btn">OK</div></div>');
                    }

                }
                var h = events.length * 90 + 26;
                //Trigger animation
                $("#new-event-box > .status-bar").html(totalNew + " New");
                $("#new-event-box > .box-content").animate({
                    "height": h + "px"
                }, 500, "easeOutCirc", function() {
                    $("#new-event-box > .box-content").css("height", "auto");
                });
                $(".ok-btn").on('click', function() {
                    //closeNewEventBox();
                    _selectedEventId = $(this).parent().attr("eventId");
                    var selectedEvent = $.grep(events, function(e){
                            return e.objectId == _selectedEventId;
                    });
                    var markAsRead = function() {
                        var user = _getUserData();
                        var eventRelations = user.data.eventRelations;
                        var indexEventRelation = -1;
                        var eventRelation = $.grep(eventRelations, function(e, i){
                            var flag = e.eventId == _selectedEventId;
                            if(flag) { indexEventRelation = i; }
                            return flag;
                        });
                        if(eventRelation[0] && indexEventRelation > -1 ) { //update the cache
                            eventRelations[indexEventRelation].isRead = true;
                            _setUserData(user);
                        }
                    }; //eo markAsRead
                    var setEvent = function(k, v) {
                        var Parse = _parse;
                        var user = Parse.User.current();
                        var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
                          query: function(){
                            return new Parse.Query(this.className);
                          }
                        });
                        var query = UserEventRelation.query();
                        query.equalTo("parentId", user.id);
                        query.equalTo("eventId", _selectedEventId);
                        var spinner = _createSpinner("box-spinner");
                        query.find({
                            success: function(results) {
                                spinner.stop();
                                event = results[0];
                                if($.isArray(k) && $.isArray(v)) { //Set read message
                                    for(var i=0; i < k.length; i++) {
                                        event.set(k[i],v[i])
                                    }
                                } else if(!$.isArray(k) && !$.isArray(v)) {
                                  event.set(k,v);
                                }
                                event.save(null, {
                                    success: function(gameScore) {
                                    },
                                    error: function(error) {
                                        spinner.stop();
                                        _alert('Error: Unable to save event '+_selectedEventId);
                                    }
                                });
                            },
                            error: function(error) { spinner.stop(); }
                        });
                    }; //eo setEvent
                    markAsRead();
                    setEvent("isRead", true);
                    $(this).parent().remove();
                    $(".event[uid="+_selectedEventId+"]").removeClass("text-bold");
                    newEventsLength --
                    _checkUnreadEvent();
                    if (selectedEvent[0].repeatId) {
                        var eventRepeats = $.grep(events, function(e){
                            return e.repeatId.substring(0,12) == selectedEvent[0].repeatId.substring(0,12);
                        });
                        for (var i = 0; i < eventRepeats.length; i++) {
                            _selectedEventId = eventRepeats[i].objectId;
                            markAsRead();
                            setEvent("isRead", true);
                            $(".event[uid="+_selectedEventId+"]").removeClass("text-bold");
                            _checkUnreadEvent();

                        }
                    }
                    if (newEventsLength == 0) {    closeNewEventBox();    }
                    $("#event-new").remove();
                    $("#calendar-bar").prepend('<div id="event-new">' + newEventsLength + ' New</div>');
                }); //eo click ok-btn
                $(".view-event-btn").on("click", function(e) {
                    $(this).addClass("text-highlight-grey");
                    _selectedEventId = $(this).parent().attr("eventId");
                    setTimeout(function() {
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'read-calendar'
                        });
                    }, DEFAULT_ANIMATION_DELAY);
                }); //eo view-event-btn click
            } //eo else events.length
            $(".bg").on('click', function() {    closeNewEventBox();    });
        }; //eo initNewEventBox

        var initUpdatedEventBox = function(eventIdList, eventChildIdList) {
            var events = _getUserEvents();
            var temp = [];
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                if (eventIdList.indexOf(event.objectId) != -1) {
                    temp.push(event);    }
                }
            events = temp;
            var updatedEventsLength = events.length;
            if (events.length == 0) {
                $("#updated-event-box > .status-bar").html(events.length + " Updated")
                $("#updated-event-box > .box-content").html('<div style="text-align:center;">You have no updated events.</div>');
            } else {
                $("#updated-event-box > .box-content").empty();
                var dateIndex = [];
                // var dateArrayForCalendarWidget = [];
                for (var i = 0; i < events.length; i++) {
                    var color;
                    var event = events[i];
                    if (typeof event.startDateTime === 'string') { //updated events
                            var date = moment(event.startDateTime).calendar();
                            var date0 = moment(event.startDateTime);
                    } else {
                        var date = moment(event.startDateTime.iso).calendar();
                        var date0 = moment(event.startDateTime.iso);
                    }
                    var isAllDay = event.isAllDay;
                    var time = isAllDay ? "All-Day" : date0.format('h:mm a');
                    if (eventChildIdList[eventIdList.indexOf(event.objectId)].length > 1) {
                        color = _orgIconColorForMultipleChild;
                    } else if (eventChildIdList[eventIdList.indexOf(event.objectId)].length == 1) {
                        var childId = eventChildIdList[eventIdList.indexOf(event.objectId)].toString();
                        color = _children.color[_children.id.indexOf(childId)];
                    } else {
                        color = "#000000";
                    }
                    $("#updated-event-box > .box-content").append('<div class="box-item" type="calendar" eventId="' + event.objectId + '">' + _getOrgIcon(event.groupType, color) + ' ' + event.title + '<span class="date-time">' + date + " " + time + '</span><div class="view-event-btn">View Event</div><div class="ok-btn">OK</div></div>');
                }
                var h = events.length * 90 + 26;
                //Trigger animation
                $("#updated-event-box > .status-bar").html(events.length + " Updated");
                $("#updated-event-box > .box-content").animate({
                    "height": h + "px"
                }, 500, "easeOutCirc", function() {
                    $("#updated-event-box > .box-content").css("height", "auto");
                });
                $(".ok-btn").on('click', function() {
                    //closeUpdatedEventBox();
                    _selectedEventId = $(this).parent().attr("eventId");
                    var markAsRead = function() {
                        var user = _getUserData();
                        var eventRelations = user.data.eventRelations;
                        var indexEventRelation = -1;
                        var eventRelation = $.grep(eventRelations, function(e, i){
                            var flag = e.eventId == _selectedEventId;
                            if(flag) { indexEventRelation = i; }
                            return flag;
                        });
                        if(eventRelation[0] && indexEventRelation > -1 ) { //update the cache
                            eventRelations[indexEventRelation].isRead = true;
                            _setUserData(user);
                        }
                    }; //eo markAsRead
                    var setEvent = function(k, v) {
                        var user = Parse.User.current();
                        var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
                          query: function(){
                            return new Parse.Query(this.className);
                          }
                        });
                        var query = UserEventRelation.query();
                        query.equalTo("parentId", user.id);
                        query.equalTo("eventId", _selectedEventId);
                        var spinner = _createSpinner("box-spinner");
                        query.find({
                            success: function(results) {
                                spinner.stop();
                                event = results[0];
                                if($.isArray(k) && $.isArray(v)) { //Set read message
                                    for(var i=0; i < k.length; i++) {
                                        event.set(k[i],v[i])
                                    }
                                } else if(!$.isArray(k) && !$.isArray(v)) {
                                  event.set(k,v);
                                }
                                event.save(null, {
                                    success: function(gameScore) {
                                    },
                                    error: function(error) {
                                        spinner.stop();
                                        _alert('Error: Unable to save event '+_selectedEventId);
                                    }
                                });
                            },
                            error: function(error) { spinner.stop(); }
                        });
                    }; //eo setEvent
                    markAsRead();
                    setEvent("isRead", true);
                    $(this).parent().remove();
                    $(".event[uid="+_selectedEventId+"]").removeClass("text-bold");
                    updatedEventsLength--;
                    updatedEventsLength == 0 ? closeUpdatedEventBox() : $.noop();
                    $("#event-updated").remove();
                    $("#calendar-bar").append('<div id="event-updated">' + updatedEventsLength + ' Updated</div>');
                }); //eo click ok-btn
            } //eo else events.length
            $(".bg").on('click', function() {    closeUpdatedEventBox();    });
        }; //eo initUpdatedEventBox

        var closeNewEventBox = function() {
            $("#new-event-box > .bg").css("opacity", "0.6");
            $("#new-event-box").css("display", "none");
            $("#new-event-box > .status-bar").html("Loading...");
            $("#new-event-box > .box-content").empty();
            $("#new-event-box > .box-content").css("height", "0px");
        }; //eo closeNewEventBox
        var closeUpdatedEventBox = function() {
            $("#updated-event-box > .bg").css("opacity", "0.6");
            $("#updated-event-box").css("display", "none");
            $("#updated-event-box > .status-bar").html("Loading...");
            $("#updated-event-box > .box-content").empty();
            $("#updated-event-box > .box-content").css("height", "0px");
        }; //eo closeUpdateEventBox

        var skipTo = function(UTC) { // slide to position of target
            var id = '#' + UTC;
            var target = $(id);
            var calendarBottom = $('#calendar-bottom');
            calendarBottom.animate({
                scrollTop: target.offset().top - calendarBottom.offset().top + calendarBottom.scrollTop()
            }, 'slow');
        }; //eo skipTo

        //when the DOM has been updated let gumby reinitialize UI modules
        var _spinner = null;
        var addedToDOM = function() {
            var _handlebars = handlebars;
            _spinner = _createSpinner('spinner-top');
            adjustCalendarHeights();
            today = { //add the new calendar to calendarTop and initialize navigation
                nav: 0
            }; //remember where today is
            var virtualInput = $('#datepicker2').pickadate({
                container: '#datepicker2'
            });
            pickadateCalendar = virtualInput.pickadate('picker');
            pickadateCalendar._set = pickadateCalendar.set;
            pickadateCalendar.set = function(type, value, options) { //user has selected a date, value is the UTC
                var calendar = this;
                var pickadateDay = 'div.pickadate__day[data-pick="' + value + '"]';
                pickadateDay = $(pickadateDay);
                if (pickadateDay.data('isEvent')) {    skipTo(value);    }
                if (!_.isUndefined(options) && _.has(options, 'nav')) {    today.nav -= options.nav;    }
                return (type === 'select' ? calendar : this._set(type, value, options));
            }; //pickadateCalendar.set
            pickadateCalendar.close = $.noop; //for use here don't ever close :)
            //sxm callback functions to use with the calendar box: open, close, render, set ...
            //see: http://amsul.ca/pickadate.js/api/
            //set callback is called after the box has been rendered, so use it to 'post' highlight event days :))
            pickadateCalendar.on({
                set: function() {
                    highlightEventDays();
                }
            });
            pickadateCalendar.open(false);
            //if 'Today' in bar clicked navigate back to it
            $('#calendar-bar-today').on('click', function() {
                var value = pickadateCalendar.get('highlight');
                pickadateCalendar._set('highlight', value, today);
                today = {    nav: 0    };
            });
            _children = {    id: [],    color: []    };
            _loadChildrenColors(function() {
                _checkUnreadMessages(Parse);
                _checkUnreadEvent(Parse);
                _checkUnreadHomework(Parse);
                loadEventRelations(); //this is where the events are added to the view, and calendar hilite
                displayNewAndUpdatedEvents();
            }, _children);

            //Init touch events
            $("#createBtn").on('click', function() {    _setPreviousView();    Chaplin.utils.redirectTo({    name: 'create'    });    });
            $("#settingBtn").on('click', function() {    _setPreviousView();    Chaplin.utils.redirectTo({    name: 'setting-home'    });    });
            $("#filter").on('click', function() {    _setPreviousView();    Chaplin.utils.redirectTo({    name: 'filter'    });    });
            $("#search").on('click', function() {    _setPreviousView();    Chaplin.utils.redirectTo({    name: 'search'    });    });
            $("#new-event-box > .status-bar").on('click', function() {    closeNewEventBox();    });
            $("#updated-event-box > .status-bar").on('click', function() {    closeUpdatedEventBox();    });
            //_spinner.stop();
            _isRedirect ? refreshView() : $.noop();
         //   window.setTimeout(highlightEventDays, 5000);
        }; //eo addedToDOM
        var dispose = function() {
            _notify( 'refresh' ).unsubscribe( refreshView );
            Chaplin.View.prototype.dispose.call(this, arguments);
        }; //eo dispose
        var refreshView = function() { //simply update the view with whatever data is available
            if(__id !== _currentViewId()) { return; }
            _isRedirect = false;
            loadEventRelations(); //this is where the events are added to the view, and calendar hilite
            displayNewAndUpdatedEvents();
        }; //eo refreshHomeView
        var __id = 'calendar-index-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            container: '#main-container',
            id: __id,
            className: 'view-container',
            listen: {
                addedToDOM: addedToDOM,
                dispose: dispose
            },
            initialize: function(options) {
                _setCurrentView(_view.SCHEDULE_INDEX, __id);
                isMobile =_isMobile(); //are we on the mobile platform
                //Reset footer
                $("#footer-toolbar > li").removeClass("active");
                $("#calendar-tool").addClass("active");
                _notify('refresh').subscribe(refreshView);
                Chaplin.View.prototype.initialize.call(this, arguments);
            }
        });

        return View;
    }); //eo view function
