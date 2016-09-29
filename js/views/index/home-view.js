// define( [
//     'chaplin',
//     'views/base/view',
//     'text!templates/index/home-view.hbs',
//     'js/lib/draggabilly/draggabilly.pkgd.js',
//     'moment',
//     'text!data/basic.ics',
//     'parseproxy',
//     'parse',
//     'handlebars',
//     'text!templates/index/calendar-item.hbs'
// ], function ( Chaplin, View, template, Draggabilly, moment, ics, ParseProxy, Parse, handlebars, template2 ) {
// 	'use strict';
//
define([
    'chaplin',
    'views/base/view',
    'text!templates/index/home-view.hbs',
    'js/lib/draggabilly/draggabilly.pkgd.js',
    'moment',
    'text!data/basic.ics',
    'parseproxy',
    'parse',
    'handlebars',
    'text!templates/index/calendar-item.hbs'
], function(Chaplin, View, template, Draggabilly, moment, ics, ParseProxy, Parse, handlebars, template2) {
    'use strict';

    var user; //declare at top scope

    var initSplitPaneBar = function() {
        //Init calendar bar
        var homeBottom = $("#homebottom");
        var navbarHeight = $(".navbar").height();
        var originalHeight = homeBottom.height();
        var originalTop = homeBottom.offset().top - navbarHeight;
        //Change homebottom position to absolute
        homeBottom.css({
            "position": "absolute",
            "top": originalTop + "px",
            "height": originalHeight + "px"
        });
        //Re-init hometop height, do this after position is changed to absolute
        var hometop = $("#hometop");
        hometop.height(parseInt($("#view-container").height() - parseInt(homeBottom.height())));
        //Create Resizable Calendar Bar
        var calendarBar = $("#calendar-bar");
        var allowResize = false;
        var pageY;
        $("#slider-btn").on("touchstart", function(e) {
            allowResize = true;
            pageY = e.touches[0].pageY;
        });
        $(window).on("touchend", function(e) {
            allowResize = false;
            $("#messages-content").css("display", "block");
            $("#calendar-content").css("display", "block");
        });
        $(window).on("touchmove", function(event) {
            var e = event.originalEvent
            if (allowResize && e.touches[0].pageY > 134 && e.touches[0].pageY < $("#view-container").height()) {
                event.preventDefault();
                $("#calendar-content").css("display", "none"); //This is a trick to prevent scolling bug on iOS
                homeBottom.css("top", (e.touches[0].pageY - navbarHeight - 15));
                homeBottom.height(parseInt($("#view-container").height() - parseInt(homeBottom.css("top")) + parseInt($("#view-container").css("padding-top"))));
                $("#messages-content").css("display", "none"); //This is a trick to prevent scolling bug on iOS
                hometop.height(parseInt($("#view-container").height() - parseInt(homeBottom.height())));
                $("#calendar-content").css("overflow-y", "scroll");
                $("#messages-content").css("overflow-y", "scroll");
            }
        });
        $("#view-container").css("overflow-y", "hidden");
    }; //eo initSplitPaneBar

    var loadMessages = function(messageIdList, messageIsRead, messageChildIdList) {
        var messages = _getUserMessages();

        function noMessages() {
            $("#messages-content").html('<div style="text-align:center;">You have no messages</div>');
        }; //eo noMessages
        function hasMessages() {
            //change config to make it suits the Messages View
            var i;
            var contentCount = 0;
            var el;
            var clr, grp;
            var message, customListId, isRead, color, childId;
            moment.lang('en', { //customize moment formatting of calendar()
                calendar: {
                    lastDay: '[Yesterday]',
                    sameDay: '[Today]',
                    nextDay: '[Tomorrow]',
                    lastWeek: 'dddd',
                    nextWeek: 'dddd',
                    sameElse: 'MM/DD/YY'
                }
            });
            $("#messages-content").empty();
            for (i = 0; i < messages.length; i++) {
                message = messages[i];
                //Filter unwanted activities (activites equal to organizationGroup, said Michael in July-August)
                customListId = message.sendToCustomListId;
                if (_unselectedActivityIdList.indexOf(message.orgIdForThisObject) == -1) {
                    if (messageIdList.indexOf(message.objectId) != -1) {
                        isRead = messageIsRead[messageIdList.indexOf(message.objectId)];
                        if (messageChildIdList[messageIdList.indexOf(message.objectId)].length > 1) {
                            color = _orgIconColorForMultipleChild;
                        } else if (messageChildIdList[messageIdList.indexOf(message.objectId)].length == 1) {
                            childId = messageChildIdList[messageIdList.indexOf(message.objectId)].toString();
                            color = children.color[children.id.indexOf(childId)];
                        } else {
                            color = "#000000";
                        }
                        clr = color;
                        grp = message.groupType;
                        el = '<div class="content-item message" type="message" uid="' + message.objectId + '" isRead="' + isRead + '" clr="' + clr + '" grp="' + grp + '"">';
                        el += _getOrgIcon(message.groupType, color) + ' <span class="topic-text">' + message.title + '</span><span class="note-text">' + message.message + '</span><span class="date-text">' + moment(new Date(message.createdAt)).calendar('DD') + '</span></div>';
                        $("#messages-content").append(el);
                        contentCount++;
                    }
                }
            } //eo for messages.length
            if (contentCount == 0) {
                $("#messages-content").html('<div style="text-align:center;">You have no new messages</div>');
            }
            //Bold unread message
            $(".message[isRead='false']").addClass("text-bold");
            //Init events
            $(".content-item.message").on('click', function(e) {
                var that = $(this);
                var color, groupType;
                var isRead = that.attr('isread') === 'true';
                isRead ? $.noop() : _updateNotiBadgeCount('messages', false);
                color = that.attr("clr");
                groupType = that.attr("grp");
                that.addClass("bg-highlight-grey");
                _selectedIcon = _getOrgIcon(groupType, color);
                _selectedMessageId = that.attr("uid");
                setTimeout(function() {
                    _setPreviousView();
                    Chaplin.utils.redirectTo({
                        name: 'read-message'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            }); //eo content-item.message click
            //Reset config back to normal
            moment.lang('en', { //customize moment formatting of calendar()
                calendar: {
                    lastDay: '[Yesterday, ]MM/DD/YY',
                    sameDay: '[Today, ]MM/DD/YY',
                    nextDay: '[Tomorrow, ] MM/DD/YY',
                    lastWeek: 'dddd, MM/DD/YY',
                    nextWeek: 'dddd, MM/DD/YY',
                    sameElse: 'dddd, MM/DD/YY'
                }
            }); //eo moment
        }; //eo hasMessages
        spinnerTop = _createSpinner('spinner-top');
        messages.length > 0 ? hasMessages() : noMessages();
        spinnerTop.stop();
    }; //eo loadMessages

    var loadMesssageRelations = function() {
        var children = _getUserChildren();
        var messageRelations = _getUserMessageRelations();

        function noMessages() {
            $("#messages-content").html('<div style="text-align:center;padding:0 10px;">You have no messages</div>');
        };

        function hasMessages() {
            var i;
            var messageIdList = [];
            var messageIsRead = [];
            var messageChildIdList = [];

            function containsAll(element, index, array) {
                return _unselectedKidIdList.indexOf(element) != -1;
            }; //eo containsAll
            //Collect all message ids
            for (i = 0; i < messageRelations.length; i++) {
                var messageRelation = messageRelations[i];
                //Apply children filtering here
                var childIdList = messageRelation.childIdList;
                if ((children.length != 0) && (children.length == _unselectedKidIdList.length)) {
                    continue; //Do nothing
                } else if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {
                    continue; //Do nothing
                } else if (childIdList.length > 0 && childIdList.every(containsAll)) {
                    continue; //Do nothing
                } else if (messageIdList.indexOf(messageRelation.messageId) == -1) {
                    messageIdList.push(messageRelation.messageId);
                    messageIsRead.push(messageRelation.isRead);
                    messageChildIdList.push(messageRelation.childIdList);
                }
            } //eo for messageRelations.length
            messageIdList.length == 0 ? noMessages() : loadMessages(messageIdList, messageIsRead, messageChildIdList);
        }; //eo hasMessages
        messageRelations.length == 0 ? noMessages() : hasMessages();
    }; //eo loadMesssageRelations

    var loadEvents = function(eventIdList, eventIsRead, eventChildIdList) {
        var events = _getUserEvents();

        function noEvents() {
            $("#calendar-content").html('<div style="text-align:center;">You have no upcoming events</div>');
        }; //eo noEvents
        function hasEvents() {
            var i;
            var event;
            var customListId, cls, date, date0;
            var dateIndex = [];
            var dateArrayForCalendarWidget = [];
            var contentCount = 0;
            var elTemplate = template2;
            //var elTemplate = '<div class="{{cls}}" type="calendar" uid="{{objectId}}" isRead="{{isRead}}" grp="{{grp}}" clr="{{clr}}"><div class="text-wrapper"> {{{orgIcon}}} {{prefixTitle}} {{eventTitle}}</div><div class="time-info">{{time}}</div></div>'; //is a string
            var context = null;
            var isAllDay;
            var time;
            var isRead;
            var color;
            var clr, grp;
            var prefix;
            var el;
            var childId;
            //var el = '<div class="{{cls}}" type="calendar" uid="{{objectId}}" isRead="{{isRead}}" grp="{{grp}}" clr="{{clr}}"><div class="text-wrapper"> {{orgIcon}} {{prefixTitle}} {{eventTitle}}</div><div class="time-info">{{time}}</div></div>'; //is a string
            var isCanceled = function() {
                return event.isCanceled ? {
                    cls: ' canceled',
                    title: 'CANCELED: '
                } : {
                    cls: '',
                    title: ''
                };
            }; //eo isCanceled

            user = _getUserData(); //get user from local storage
            $("#calendar-content").empty();
            elTemplate = handlebars.compile(elTemplate); //now is a function
            for (i = 0; i < events.length; i++) {
                event = events[i];
                //Filter unwanted activities (activites equal to organizationGroup, said Michael in July-August)
                customListId = event.sendToCustomListId;
                if (_unselectedActivityIdList.indexOf(event.orgIdForThisObject) == -1) {
                    cls = false; //add a 'first' class to the item if it immediately follows a date title
                    if (eventIdList.indexOf(event.objectId) != -1) {
                        //Check date for displaying appropriated title
                        if (typeof event.startDateTime === 'string') { //updated events
                            date = moment(event.startDateTime).calendar();
                            date0 = moment(event.startDateTime);
                        } else {
                            date = moment(event.startDateTime.iso).calendar();
                            date0 = moment(event.startDateTime.iso);
                        }
                        if (dateIndex.indexOf(date) == -1) {
                            dateIndex.push(date);
                            dateArrayForCalendarWidget.push(date0.format("MM/DD/YY"));
                            $("#calendar-content").append('<div class="content-title">' + date + '</div>');
                            cls = true; //OK, now be sure to add the .first so we can do custom css
                        }
                        isAllDay = event.isAllDay;
                        time = isAllDay ? "All-Day" : date0.format('h:mm a');
                        isRead = eventIsRead[eventIdList.indexOf(event.objectId)];
                        prefix = {
                            cls: '',
                            title: ''
                        };
                        //el = handlebars.compile(el); //now is a function
                        if (eventChildIdList[eventIdList.indexOf(event.objectId)].length > 1) {
                            color = _orgIconColorForMultipleChild;
                        } else if (eventChildIdList[eventIdList.indexOf(event.objectId)].length == 1) {
                            childId = eventChildIdList[eventIdList.indexOf(event.objectId)].toString();
                            color = children.color[children.id.indexOf(childId)];
                        } else {
                            color = "#000000";
                        }
                        clr = color;
                        grp = event.groupType;
                        //console.log('clr, grp:',clr, grp);
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
                        // el = '<div class=' + cls + ' type="calendar" uid="' + event.objectId + '" isRead="' + isRead + '" grp="' + grp +   '" clr="' + clr + '">';
                        // el += '<div class="text-wrapper">' + _getOrgIcon(event.groupType, color) + ' ' + prefix.title + event.title + '</div><div class="time-info">' + time + '</div>' + '</div>';
                        el = elTemplate(context);
                        //el = $(el);
                        $("#homebottom > #calendar-content").append(el);
                    }
                    cls = false; //always reset no matter what
                    contentCount++;
                }
            } //eo for events.length
            if (contentCount == 0) {
                $("#calendar-content").html('<div style="text-align:center;">You have no upcoming events</div>');
            }
            //Create solid lines, dashed in css
            $(".content-title").each(function() {
                $(this).prev().css("border-bottom", "solid 1px #ccc");
            });
            //Bold unread event
            $(".event[isRead='false']").addClass("text-bold");
            //Init events
            $(".content-item.event").on('click', function(e) {
                var that = $(this);
                var color, groupType;
                var isRead = that.attr('isread') === 'true';
                isRead ? $.noop() : _updateNotiBadgeCount('calendar', false);
                color = that.attr("clr");
                groupType = that.attr("grp");
                that.addClass("bg-highlight-grey");
                _selectedEventId = that.attr("uid");
                _selectedIcon = _getOrgIcon(groupType, color);
                //console.log(_selectedIcon);
                setTimeout(function() {
                    _setPreviousView();
                    Chaplin.utils.redirectTo({
                        name: 'read-calendar'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            }); //eo content-item.event click
        }; //eo hasEvents
        spinnerBottom = _createSpinner('spinner-bottom');
        // sortEvents();
        events.length === 0 ? noEvents() : hasEvents();
        spinnerBottom.stop();
    }; //eo loadEvents
    var loadEventRelations = function() {
        var i;
        var children = _getUserChildren();
        //var user = _getUserData(); //get user from local storage
        //var eventRelations = user.data.eventRelations;
        var eventRelations = _getUserEventRelations();
        var eventIdList = []; //make this globally accessible
        var eventIsRead = [];
        var eventChildIdList = [];

        function noEvents() {
            $("#calendar-content").html('<div style="text-align:center; padding:0 10px;">You have no upcoming events</div>');
        }; //eo noEvents
        function hasEvents() {
            _eventIdList = eventIdList; //bind local to global list
            //Collect all event ids
            function containsAll(element, index, array) {
                return _unselectedKidIdList.indexOf(element) != -1;
            }; //eo containsAll
            for (var i = 0; i < eventRelations.length; i++) {
                var eventRelation = eventRelations[i];
                //Apply children filtering here
                var childIdList = eventRelation.childIdList;
                if ((children.length > 0) && children.length == _unselectedKidIdList.length) {
                    continue; //Do nothing
                } else if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {
                    continue; //Do nothing
                } else if (childIdList.length > 0 && childIdList.every(containsAll)) {
                    continue; //Do nothing
                } else if (eventIdList.indexOf(eventRelation.eventId) == -1) {
                    eventIdList.push(eventRelation.eventId);
                    eventIsRead.push(eventRelation.isRead);
                    eventChildIdList.push(eventRelation.childIdList);
                }
            } //eo for eventRelations
            eventIdList.length == 0 ? noEvents() : loadEvents(eventIdList, eventIsRead, eventChildIdList);
        }; //eo hasEvents
        eventRelations.length == 0 ? noEvents() : hasEvents();
    }; //eo loadEventRelations


    var getAllData = function(d, val) {
        _setUserActivations('general', true);
        /*
         * Edit by phuongnh@vinasource.com
         * Don't call _backgroundFetchDone when staying at self
         * Instead after fetch all data, we need refresh home view
         */
        _onBackgroundFetch(function() {
            children = {
                id: [],
                color: []
            };
            _loadChildrenColors(function() { //update notiBadge do not check here, only when a push comes in do we increment
                _checkUnreadMessages(Parse);
                _checkUnreadEvent(Parse);
                _checkUnreadHomework(Parse);
                loadMesssageRelations();
                loadEventRelations();
                var overlay = $('#loading-overlay');
                overlay ? overlay.hide() : $.noop();
            }, children);
        }, true, true, Chaplin);
    };
    var spinnerTop = null;
    var spinnerBottom = null;
    var children = {
        id: [],
        color: []
    };
    var addedToDOM = function(e) {
        var _handlebars = handlebars;
        var overlay = $('#loading-overlay');
        overlay ? overlay.show() : $.noop();
        var fetching = false;

        if (_checkUserActivations()) {
            $.noop();
        } else {
            fetching = true;
            getAllData();
        }

        initSplitPaneBar();
        //Reset variable

        if (!fetching) {
            children = {
                id: [],
                color: []
            };
            _loadChildrenColors(function() { //update notiBadge do not check here, only when a push comes in do we increment
                _checkUnreadMessages(Parse);
                _checkUnreadEvent(Parse);
                _checkUnreadHomework(Parse);
                loadMesssageRelations();
                loadEventRelations();

                overlay ? overlay.hide() : $.noop();
            }, children);
        }

        //Init events
        $("#createBtn").on('click', function() {
            _setPreviousView();
            Chaplin.utils.redirectTo({
                name: 'create'
            });
        });
        $("#settingBtn").on('click', function() {
            _setPreviousView();
            Chaplin.utils.redirectTo({
                name: 'setting-home'
            });
        });
        $("#filter").on('click', function() {
            _setPreviousView();
            Chaplin.utils.redirectTo({
                name: 'filter'
            });
        });
        $("#search").on('click', function() {
            _setPreviousView();
            Chaplin.utils.redirectTo({
                name: 'search'
            });
        });

        _checkTimeWindow(-1);
        refreshView();
    }; //eo addedToDOM

    var refreshView = function() { //simply update the view with whatever data is available
        console.log(__id + ' === ' + _currentViewId());
        if (__id !== _currentViewId()) {
            return;
        }
        _isRedirect = false;

        children = {
            id: [],
            color: []
        };
        _loadChildrenColors(function() { //update notiBadge do not check here, only when a push comes in do we increment
            _checkUnreadMessages(Parse);
            _checkUnreadEvent(Parse);
            _checkUnreadHomework(Parse);
            loadMesssageRelations();
            loadEventRelations();
            var overlay = $('#loading-overlay');
            overlay ? overlay.hide() : $.noop();
        }, children);

    }; //eo refreshHomeView

    var dispose = function() {
        _notify('refresh').unsubscribe(refreshView);
        Chaplin.View.prototype.dispose.call(this, arguments);
    }; //eo dispose

    var __id = 'home-view';
    var View = View.extend({
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container',
        id: __id,
        containerMethod: "prepend",
        template: template,
        listen: {
            'addedToDOM': addedToDOM,
            'dispose': dispose
        },
        initialize: function(options) {
            // var _view = View;
            _setCurrentView(_view.HOME, __id);
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            $('#home-tool').addClass('active');
            _notify('refresh').subscribe(refreshView);
            Chaplin.View.prototype.initialize.call(this, arguments);
        },
        dispose: dispose
    }); //eo View.extend

    return View;
});