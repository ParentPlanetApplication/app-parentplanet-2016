define([
    'chaplin',
    'views/base/view',
    'text!templates/index/search-view.hbs',
    'jquery'

], function(Chaplin, View, Template, $) {
    'use strict';

    /*
        0 = Schedule
        1 = Messages
        2 = Homework
        3 = Contacts
    */
    var MINSEARCHLENGTH = 3;
    var selectedMenu = 0;
    var user = JSON.parse(_ls.getItem("user"));
    var _children = {     id: [],    color: []    };
    var searchSchedule = function() {
        var events = _getUserEvents();
        var eventRelations = _getUserEventRelations();
        var n = 0;
        var str = $("#searchTxt").val().toLowerCase();
        var search = function() {
            var found = {};
            $.each(events, function(i,event) {
                var flag = event.title.toLowerCase().indexOf(str) !== -1;
                var id = event.objectId;
                if(flag && !found.hasOwnProperty(id)) {
                    found[id] = {e:event, r:null};
                    n++;
                }
            }); //eo loop over events
            $.each(eventRelations, function(i, relation) {
                var id = relation.eventId;
                if(found.hasOwnProperty(id)) {
                    found[id].r = relation;
                }
            }); //eo loop over relations
            events = []; //reinitialize
            eventRelations = [];
            Object.getOwnPropertyNames(found).forEach(function(val, i) {
                var e = found[val].e;
                var r = found[val].r;
                if(!e || !r) { return; }
                events.push(e);
                eventRelations.push(r)
            });
        }; //eo search
        var found = function() {
            var dateIndex = [];
            var dateArrayForCalendarWidget = [];
            $.each(events, function(i, event) {
                //Check date for displaying appropriated title
                var r = eventRelations[i];
                var date = moment(event.startDateTime.iso).calendar();
                var isAllDay = event.isAllDay;
                var time = isAllDay ? "All-Day" : moment(event.startDateTime.iso).format('h:mm a');
                var isRead = r.isRead;
                var color, childId;
                if (dateIndex.indexOf(date) === -1) {
                    dateIndex.push(date);
                    dateArrayForCalendarWidget.push(moment(event.startDateTime.iso).format("MM/DD/YY"));
                    $("#lower-area").append('<div class="content-title">' + date + '</div>');
                }
                if (r.childIdList.length > 1) {
                    color = _orgIconColorForMultipleChild;
                } else if (r.childIdList.length == 1) {
                    childId = r.childIdList[0];
                    color = _children.color[_children.id.indexOf(childId)];
                }
                $("#lower-area").append('<div class="content-item event" type="calendar" uid="' + event.objectId + '" isRead="' + isRead + '">' + '<div class="text-wrapper">' + _getOrgIcon(event.groupType, color) + ' ' + event.title + '</div><div class="time-info">' + time + '</div>' + '</div>');
            }); //eo each
            //Create dashed lines
            $(".content-title").each(function() {    $(this).prev().css("border-bottom", "dashed 1px #bbb");    });
            //Bold unread event
            $(".event[isRead='false']").addClass("text-bold");
            //Init events
            $(".content-item.event").on("click", function(e) {
                $(this).addClass("bg-highlight-grey");
                _selectedEventId = $(this).attr("uid");
                setTimeout(function() {
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'read-calendar'    });
                }, DEFAULT_ANIMATION_DELAY);
            }); //eo click
        }; //eo found
        var notFound = function() {
            $("#lower-area").html('<div style="text-align:center;">No events found.</div>');
        };
        $("#lower-area").empty();
        search();
        n > 0 ? found() : notFound();
    }; //eo searchSchedule
    var searchMessages = function() {
        var messages = _getUserMessages();
        var messageRelations = _getUserMessageRelations();
        var n = 0;
        var str = $("#searchTxt").val().toLowerCase();
        var search = function() {
            var found = {};
            $.each(messages, function(i,message) {
                var flag = message.title.toLowerCase().indexOf(str) !== -1;
                var id = message.objectId;
                if(flag && !found.hasOwnProperty(id)) {
                    found[id] = {e:message, r:null};
                    n++;
                }
            }); //eo loop over events
            $.each(messageRelations, function(i, relation) {
                var id = relation.messageId;
                if(found.hasOwnProperty(id)) {
                    found[id].r = relation;
                }
            }); //eo loop over relations
            messages = []; //reinitialize
            messageRelations = [];
            Object.getOwnPropertyNames(found).forEach(function(val, i) {
                var e = found[val].e;
                var r = found[val].r;
                if(!e || !r) { return; }
                messages.push(e);
                messageRelations.push(r)
            });
        }; //eo search
        var found = function() {
            moment.lang('en', { //customize moment formatting of calendar()
                calendar: {lastDay: '[Yesterday]', sameDay: '[Today]', nextDay: '[Tomorrow]', lastWeek: 'dddd', nextWeek: 'dddd', sameElse: 'MM/DD/YY' }
            }); //eo custom moment format
            $.each(messages, function(i,message) {
                var isRead = messageRelations[i].isRead;
                var color;
                if (messageRelations[i].childIdList.length > 1) {
                    color = _orgIconColorForMultipleChild;
                } else if (messageRelations[i].childIdList.length == 1) {
                    var childId = messageRelations[i].childIdList[0];
                    color = _children.color[_children.id.indexOf(childId)];
                }
                $("#lower-area").append('<div class="content-item message" type="message" uid="' + message.objectId + '" isRead="' + isRead + '"">' + _getOrgIcon(message.groupType, color) + ' <span class="topic-text">' + message.title + '</span><span class="note-text">' + message.message + '</span><span class="date-text">' + moment(new Date(message.createdAt)).calendar('DD') + '</span></div>');
            });
            //Bold unread message
            $(".message[isRead='false']").addClass("text-bold");
            //Init events
            $(".content-item.message").on('click', function(e) {
                $(this).addClass("bg-highlight-grey");
                _selectedMessageId = $(this).attr("uid");
                setTimeout(function() {
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'read-message'    });
                }, DEFAULT_ANIMATION_DELAY);
            });
            //Reset config back to normal
            moment.lang('en', { //customize moment formatting of calendar()
                calendar: { lastDay: '[Yesterday, ]MM/DD/YY', sameDay: '[Today, ]MM/DD/YY', nextDay: '[Tomorrow, ] MM/DD/YY', lastWeek: '[Last ]dddd, MM/DD/YY', nextWeek: '[Next ]dddd, MM/DD/YY', sameElse: 'dddd, MM/DD/YY' }
            });
        }; //eo found
        var notFound = function() {
            $("#lower-area").html('<div style="text-align:center;">No messages found.</div>');
        };
        $("#lower-area").empty();
        search();
        n > 0 ? found() : notFound();
    }; //eo searchMessages
    var searchHomework = function() {
        var homeworks = _getUserHomework();
        var homeworkRelations = _getUserHomeworkRelations();
        var n = 0;
        var str = $("#searchTxt").val().toLowerCase();
        var search = function() {
            var found = {};
            $.each(homeworks, function(i,homework) {
                var flag = homework.title.toLowerCase().indexOf(str) !== -1;
                var id = homework.objectId;
                if(flag && !found.hasOwnProperty(id)) {
                    found[id] = {e:homework, r:null};
                    n++;
                }
            }); //eo loop over events
            $.each(homeworkRelations, function(i, relation) {
                var id = relation.homeworkId;
                if(found.hasOwnProperty(id)) {
                    found[id].r = relation;
                }
            }); //eo loop over relations
            homeworks = []; //reinitialize
            homeworkRelations = [];
            Object.getOwnPropertyNames(found).forEach(function(val, i) {
                var e = found[val].e;
                var r = found[val].r;
                if(!e || !r) { return; }
                homeworks.push(e);
                homeworkRelations.push(r)
            });
        }; //eo search
        var found = function() {
            moment.lang('en', { //customize moment formatting of calendar()
                calendar: {lastDay: '[Yesterday]', sameDay: '[Today]', nextDay: '[Tomorrow]', lastWeek: 'dddd', nextWeek: 'dddd', sameElse: 'MM/DD/YY' }
            }); //eo custom moment format
            $.each(homeworks, function(i,homework) {
                var isRead = homeworkRelations[i].isRead;
                var color;
                var dueDate = homework.dueDate.iso ? homework.dueDate.iso : homework.dueDate;
                if (homeworkRelations[i].childIdList.length > 1) {
                    color = _orgIconColorForMultipleChild;
                } else if (homeworkRelations[i].childIdList.length == 1) {
                    var childId = homeworkRelations[i].childIdList[0];
                    color = _children.color[_children.id.indexOf(childId)];
                }
                $("#lower-area").append('<div class="content-item homework" type="homework" uid="' + homework.objectId + '" isRead="' + isRead + '"">' + _getHomeworkIcon(homework.type, color) + ' <span class="topic-text">' + homework.title + '</span><span class="note-text">' + homework.note + '</span><span class="date-text">Due: ' + moment(new Date(dueDate)).calendar('DD') + '</span></div>');
            });
            //Bold unread homework
            $(".homework[isRead='false']").addClass("text-bold");
            //Init events
            $(".content-item.homework").on('click', function(e) {
                $(this).addClass("bg-highlight-grey");
                _selectedHomeworkId = $(this).attr("uid");
                setTimeout(function() {
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'read-homework'    });
                }, DEFAULT_ANIMATION_DELAY);
            });
            //Reset config back to normal
            moment.lang('en', { //customize moment formatting of calendar()
                calendar: { lastDay: '[Yesterday, ]MM/DD/YY', sameDay: '[Today, ]MM/DD/YY', nextDay: '[Tomorrow, ] MM/DD/YY', lastWeek: '[Last ]dddd, MM/DD/YY', nextWeek: '[Next ]dddd, MM/DD/YY', sameElse: 'dddd, MM/DD/YY' }
            });
        }; //eo found
        var notFound = function() {
            $("#lower-area").html('<div style="text-align:center;">No messages found.</div>');
        };
        $("#lower-area").empty();
        search();
        n > 0 ? found() : notFound();
    }; //eo searchHomework

    var searchContacts = function() {
        $("#lower-area").empty();
        $("#lower-area").html('<div id="spinner" class="spinner-wrapper text-center"></div>');
        spinner = _createSpinner("spinner");
        var str = $("#searchTxt").val().toLowerCase();
        var contacts = user.data.contacts;
        var resultContactArray = [];
        for (var i = 0; i < contacts.length; i++) {
            var contact = contacts[i];
            //Check family name
            if (contact.familyTitle.toLowerCase().indexOf(str) != -1) {
                resultContactArray.push(contact);
            } else {
                //Check students' name
                var studentNameList = contact.studentNameList;
                loop: for (var j = 0; j < studentNameList.length; j++) {
                    var studentName = studentNameList[j];
                    if (studentName.toLowerCase().indexOf(str) != -1) {
                        resultContactArray.push(contact);
                        break loop;
                    }
                } //eo loop
            } //eo else
        } //eo for contacts.length
        //console.log(resultContactArray);
        //Generate results
        if (resultContactArray.length == 0) {
            $("#lower-area").html('<div style="text-align:center; padding:0 10px;> No contact found</div>');
        } else {
            $("#lower-area").empty();
            //Generate HTML contect
            for (var i = 0; i < resultContactArray.length; i++) {
                var contact = resultContactArray[i];
                $("#lower-area").append('<div uid=' + contact.objectId + ' class="content-item contact">' + contact.familyTitle + '<div class="kids-name">' + contact.studentName + '</div></div>')
            }
            //Todo
            $(".contact").click(function(e) {
                _selectedContactId = $(this).attr("uid");
                $(this).addClass("bg-highlight-grey");
                setTimeout(function() {
                    _setPreviousView();
                    Chaplin.utils.redirectTo({
                        name: 'contacts-groups-detail'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            }); //eo click
        } //eo resultContactArray.length
        spinner.stop();
    }; //eo searchContacts

    var spinner = null;
    var addedToDOM = function() {
        var menuClick = function(menuIndex, searchFunction, id) {
            $(".search-menu-item").removeClass("active");
            $(id).addClass("active");
            selectedMenu = menuIndex;
            $("#lower-area").empty();
            searchFunction();
        }; //eo menuClick
        $("#backBtn").on('click', function(e) {
            _setPreviousView();
            switch (_view.previousView) {
                case _view.HOME:    Chaplin.utils.redirectTo({    name: 'home'    });    break;
                case _view.SCHEDULE_INDEX:    Chaplin.utils.redirectTo({    name: 'calendar'    });    break;
                case _view.MESSAGES_INDEX:    Chaplin.utils.redirectTo({    name: 'message'    });    break;
                case _view.HOMEWORK_INDEX:    Chaplin.utils.redirectTo({    name: 'homework'    });    break;
                case _view.CONTACTS:    Chaplin.utils.redirectTo({    name: 'contacts'    });    break;
                default:    Chaplin.utils.redirectTo({    name: 'home'    });    break;
            } //eo switch
        }); //eo backBtn.click
        $("#scheduleMenu").on('click', function(e) {    menuClick(0, searchSchedule, "#scheduleMenu");    });
        $("#messagesMenu").on('click', function(e) {    menuClick(1, searchMessages, "#messagesMenu");    });
        $("#homeworkMenu").on('click', function(e) {    menuClick(2, searchHomework, "#homeworkMenu");    });
        $("#contactsMenu").on('click', function(e) {    menuClick(3, searchContacts, "#contactsMenu");    });
        $("#searchTxt").focus(function() {    $("#searchBtn").css("color", "#439a9a");    });
        $("#searchTxt").blur(function() {    $("#searchBtn").css("color", "#bbb");    });
        $("#searchBtn").on('click', function() {
            switch (selectedMenu) {
                case 0:    searchSchedule();    break;
                case 1:    searchMessages();    break;
                case 2:    searchHomework();    break;
                case 3:    searchContacts();    break;
                default:    searchSchedule();
            } //eo switch
        }); //eo searchBtn click
        //Init search function
        var doSearch = function() {
            var str = $("#searchTxt").val().toLowerCase();
            if(str && str.length < MINSEARCHLENGTH) { return; }
            switch (selectedMenu) {
                case 0:    searchSchedule();    break;
                case 1:    searchMessages();    break;
                case 2:    searchHomework();    break;
                case 3:    searchContacts();    break;
                default:    searchSchedule();
            } //eo switch
        }; //eo doSearch
        $("#searchTxt").keyup(function(e) {
            switch (e.keyCode) {
                case 8: // Backspace
                    var str = $("#searchTxt").val().toLowerCase();
                    $("#searchTxt").val(str.substring(0, str.length));
                    doSearch();
                break;
                /*
                case 9:     doSearch();    break; // Tab
                case 13:    doSearch();    break; // Enter
                case 37:    doSearch();    break; // Left
                case 38:    doSearch();    break; // Up
                case 39:    doSearch();    break; // Right
                case 40:    doSearch();    break; // Down
                */
                default:    doSearch();
            } //eo switch
        }); //eo keyup
        $("#filter").on('click', function() {
            _setPreviousView();
            Chaplin.utils.redirectTo({    name: 'filter' });
        });
        $("#search").on('click', function() {
            _setPreviousView();
            Chaplin.utils.redirectTo({    name: 'search'    });
        });
        _children = {    id: [],    color: []    };
        _loadChildrenColors($.noop, _children);
        searchSchedule();
    }; //eo addedToDOM
    var __id = 'search-view';
    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: __id,
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            _setCurrentView(_view.SEARCH, __id);
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo View.extend

    return View;
});
