define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/index/homework-view.hbs',
        'jquery',
        'parseproxy',
        'moment',
        'parse'
    ],
    function(Chaplin, View, Template, $, ParseProxy, moment, Parse) {
        'use strict';
        var homeworkContent = null;
        var skipToTargetId = null;
        var skipTo = function() { // slide to position of target
            var target = skipToTargetId;
            if(!skipToTargetId) {
                return;
            }
            target = $(target);
            homeworkContent.animate({
                scrollTop: target.offset().top - homeworkContent.offset().top + homeworkContent.scrollTop()
            }, 'slow');
        }; //eo skipTo
        var loadHomework = function(homeworkIdList, homeworkIsRead, homeworkChildIdList) {
           // var user = JSON.parse(localStorage.getItem("user"));
            var homeworks = _getUserHomework();
            function noHomework() {
                homeworkContent.html('<div style="text-align:center;">There are no homework assignments to view</div>');
            }; //eo noHomework
            function hasHomework() {
                var customListId = null;
                var minDuration = Number.POSITIVE_INFINITY; //really big number
                var now = moment(); //for date handling
                var limit = moment().subtract(1, 'months'); //one month back;
                //Change format
                moment.lang('en', { //customize moment formatting of calendar
                    calendar: {
                        lastDay: '[Yesterday]',
                        sameDay: '[Today]',
                        nextDay: '[Tomorrow]',
                        lastWeek: 'MM/DD/YY',
                        nextWeek: 'MM/DD/YY',
                        sameElse: 'MM/DD/YY'
                    }
                });
                homeworkContent.empty();
                $.each(homeworks, function(i, homework) {
                    var flag = false;
                    var title = '';
                    var formatDate = function(date) {
                        var str = 'none';
                        if(date) {
                            str = date.iso ? moment(new Date(date.iso)).calendar('DD') : moment(new Date(date)).calendar('DD');
                        }
                        return str;
                    }; //eo formatDate
                    var momentDate = function(date) {
                        var _date = null;
                        if(date) {
                            _date = date.iso ? moment(new Date(date.iso)) : moment(new Date(date));
                        }
                        return _date;
                    }; //momentDate
                    function addElement() {
                        var isRead, color, childId;
                        var el;
                        var clr;
                        var grp = homework.type;
                        var customListId = homework.sendToCustomListId;
                        var dueDate = momentDate(homework.dueDate);
                        var duration = moment.duration(dueDate.diff(now));
                        var days = duration.asDays();
                        if(momentDate(homework.dueDate).isBefore(limit)) {  return;    } //display one month back
                        days = Math.abs(days);
                        if(days<minDuration) {
                            minDuration = days;
                            skipToTargetId = '#' + homework.objectId;
                        }
                        isRead = homeworkIsRead[homeworkIdList.indexOf(homework.objectId)];
                        clr = color = "#000000";
                        if (homeworkChildIdList[homeworkIdList.indexOf(homework.objectId)].length > 1) {
                            clr = color = _orgIconColorForMultipleChild;
                        } else if (homeworkChildIdList[homeworkIdList.indexOf(homework.objectId)].length == 1) {
                            childId = homeworkChildIdList[homeworkIdList.indexOf(homework.objectId)].toString();
                            clr = color = children.color[children.id.indexOf(childId)];
                        }
                        title += homework.isCanceled ? 'CANCELED: ' + homework.title : homework.title;
                        el = '<div class="content-item homework" type="homework" id="' + homework.objectId + '" isRead="' + isRead + '" grp="' + grp +   '" clr="' + clr + '">';
                        el += _getHomeworkIcon(grp, color) + ' <span class="topic-text">' + homework.groupName + '</span><span class="note-text">' + title + '</span><span class="date-text">Due: ' + formatDate(homework.dueDate) + '</span></div>';
                        homeworkContent.prepend(el);
                    }; //eo addElement
                    flag = _unselectedActivityIdList.indexOf(homework.orgIdForThisObject) === -1 && homeworkIdList.indexOf(homework.objectId) !== -1;
                    flag ? addElement() : $.noop();
                });
                //Bold unread homework
                $(".homework[isRead='false']").addClass("text-bold");
                //Init events
                $(".content-item.homework").on('click', function(e) {
                    var that = $(this);
                    var color, groupType;
                    var isRead = that.attr('isread') === 'true';
                    isRead ? $.noop() : _updateNotiBadgeCount('homework', false);
                    color = that.attr("clr");
                    groupType = that.attr("grp");
                    that.addClass("bg-highlight-grey");
                    _selectedHomeworkId = that.attr("id");
                    _selectedIcon = _getHomeworkIcon(groupType, color);
                    setTimeout(function() {
                        _setPreviousView();
                        Chaplin.utils.redirectTo({    name: 'read-homework'    });
                    }, DEFAULT_ANIMATION_DELAY);
                }); //eo .content-item.homework click
                //Reset config
                moment.lang('en', { //customize moment formatting of calendar()
                    calendar: {
                        lastDay: '[Yesterday, ]MM/DD/YY',
                        sameDay: '[Today, ]MM/DD/YY',
                        nextDay: '[Tomorrow, ] MM/DD/YY',
                        lastWeek: '[Last ]dddd, MM/DD/YY',
                        nextWeek: '[Next ]dddd, MM/DD/YY',
                        sameElse: 'dddd, MM/DD/YY'
                    }
                });
            }; //eo hasHomework
            homeworks.length > 0 ? hasHomework() : noHomework();
            skipTo(); //scroll down a bit?
        }; //eo loadHomework

        var loadHomeworkRelations = function() {
            var children = _getUserChildren();
            var homeworkIdList = [];
            var homeworkIsRead = [];
            var homeworkChildIdList = [];
            var homeworkRelations = _getUserHomeworkRelations();
            function containsAll(element, index, array) {
              return _unselectedKidIdList.indexOf(element) != -1;
            }; //eo containsAll
            function noHomework() {
                homeworkContent.html('<div style="text-align:center;">No homework</div>');
            };
            function hasHomework() {
                for (var i = 0; i < homeworkRelations.length; i++) {
                    var homeworkRelation = homeworkRelations[i];
                    //Apply children filtering here
                    var childIdList = homeworkRelation.childIdList;
                    if ((children.length != 0) && (children.length == _unselectedKidIdList.length)) {
                        //Do nothing
                    } else if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {
                        //Do nothing
                    } else if (childIdList.length > 0 && childIdList.every(containsAll)) {
                        //Do nothing
                    } else if (homeworkIdList.indexOf(homeworkRelation.homework) == -1) {
                        homeworkIdList.push(homeworkRelation.homeworkId);
                        homeworkIsRead.push(homeworkRelation.isRead);
                        homeworkChildIdList.push(homeworkRelation.childIdList);
                    }
                } //eo loop over relations
                homeworkIdList.length == 0 ? noHomework() : loadHomework(homeworkIdList, homeworkIsRead, homeworkChildIdList);
            }; //eo hasHomework
            homeworkRelations.length == 0 ? noHomework() : hasHomework();
        }; //eo loadHomeworkRelations

        var spinner = null;
        var children = {    id: [],    color: []    };
        var addedToDOM = function() {
            spinner = _createSpinner('spinner');
            homeworkContent = $('#homework-content');
            children = {    id: [],    color: []    };
            _loadChildrenColors(function() {
                _checkUnreadMessages(Parse);
                _checkUnreadEvent(Parse);
                _checkUnreadHomework(Parse);
                loadHomeworkRelations();
            }, children);
            //Init touch events
            $("#createBtn").on('click', function() {    _setPreviousView();    Chaplin.utils.redirectTo({    name: 'create'    });    });
            $("#settingBtn").on('click', function() {   _setPreviousView();    Chaplin.utils.redirectTo({    name: 'setting-home'    });    });
            $("#filter").on('click', function() {    _setPreviousView();    Chaplin.utils.redirectTo({    name: 'filter'    });    });
            $("#search").on('click', function() {    _setPreviousView();    Chaplin.utils.redirectTo({    name: 'search'    });    });
            spinner.stop();
            _isRedirect ? refreshView() : $.noop();
        }; //eo addedToDOM
        var dispose = function() {
            _notify( 'refresh' ).unsubscribe( refreshView );
            Chaplin.View.prototype.dispose.call(this, arguments);
        }; //eo dispose
        var refreshView = function() {
            if(__id !== _currentViewId()) { return; }
            _isRedirect = false;
            loadHomeworkRelations();
        }; //eo refreshView
        var __id = 'homework-index-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            //keepElement: true,
            container: '#main-container',
            id: __id,
            className: 'view-container',
            listen: {
                addedToDOM: addedToDOM,
                dispose: dispose
            },
            initialize: function(options) {
                _setCurrentView(_view.HOMEWORK_INDEX, __id);
                //Reset footer
                $("#footer-toolbar > li").removeClass("active");
                $("#homework-tool").addClass("active");
                _notify('refresh').subscribe(refreshView);
                Chaplin.View.prototype.initialize.call(this, arguments);
            }
        }); //eo View.extend

        return View;
    });
