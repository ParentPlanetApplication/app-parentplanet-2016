define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/index/messages-view.hbs',
        'jquery',
        'parseproxy',
        'spinner',
        'moment',
        'parse'
    ],
    function(Chaplin, View, Template, $, ParseProxy, spinner, moment, Parse) {
        'use strict';

        var loadMessages = function(messageIdList, messageIsRead, messageChildIdList) {
            //var user = JSON.parse(localStorage.getItem("user"));
            //var messages = user.data.messages;
            var messages = _getUserMessages();
            function noMessages() {
                $("#messages-content").html('<div style="text-align:center;">You have no messages</div>');
            }; //eo noMessages
            function hasMessages() {
                //change config to make it suits the Messages View
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
                for (var i = 0; i < messages.length; i++) {
                    message = messages[i];
                    //Apply activity filtering here
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
                                color = "#000000"
                            }
                            clr = color;
                            grp = message.groupType;
                            el = '<div class="content-item message" type="message" uid="' + message.objectId + '" isRead="' + isRead + '" grp="' + grp +   '" clr="' + clr + '">';
                            el +=  _getOrgIcon(message.groupType, color) + ' <span class="topic-text">' + message.title + '</span><span class="note-text">' + message.message + '</span><span class="date-text">' + moment(new Date(message.createdAt)).calendar('DD') + '</span></div>';
                            $("#messages-content").append(el);
                            contentCount++;
                        } //eo if messageIdList
                    } //eo if _unselectedActivityIdList
                } //eo for messages.length
                if (contentCount == 0) {
                    $("#messages-content").html('<div style="text-align:center;">You have 0 messages</div>');
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
                    _selectedMessageId = that.attr("uid");
                    _selectedIcon = _getOrgIcon(groupType, color);
                    setTimeout(function() {
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'read-message'
                        });
                    }, DEFAULT_ANIMATION_DELAY);
                });
                //Reset config back to normal
                moment.lang('en', { //customize moment formatting of calendar()
                    calendar: {
                        lastDay: '[Yesterday, ]MM/DD/YY',
                        sameDay: '[Today, ]MM/DD/YY',
                        nextDay: '[Tomorrow, ] MM/DD/YY',
                        lastWeek: '[Last ]dddd, MM/DD/YY',
                        nextWeek: '[Next ]dddd, MM/DD/YY',
                        sameElse: 'dddd, MM/DD/YY'
                    }
                }); //eo moment.lang
            }; //eo has Messages
            messages.length > 0 ? hasMessages() : noMessages();
        }; //eo loadMessages

        var loadMesssageRelations = function() {
            var messageIdList = [];
            var messageIsRead = [];
            var messageChildIdList = [];
            //var user = JSON.parse(localStorage.getItem("user"));
            //var messageRelations = user.data.messageRelations;
            var messageRelations = _getUserMessageRelations();
            function containsAll(element, index, array) {
              return _unselectedKidIdList.indexOf(element) != -1;
            }; //eo containsAll
            function noMessages() {
                $("#messages-content").html('<div style="text-align:center; padding:0 10px;">You have no messages</div>');
            };
            function hasMessages() {
                var messageRelation;
                var childIdList;
                var children = _getUserChildren();
                for (var i = 0; i < messageRelations.length; i++) {
                    messageRelation = messageRelations[i];
                    //Apply children filtering here
                    childIdList = messageRelation.childIdList;
                    if ((children.length != 0) && (children.length == _unselectedKidIdList.length)) {
                        //Do nothing
                    } else if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {
                        //Do nothing
                    } else if (childIdList.length > 0 && childIdList.every(containsAll)) {
                        //Do nothing
                    } else if (messageIdList.indexOf(messageRelation.messageId) == -1) {
                        messageIdList.push(messageRelation.messageId);
                        messageIsRead.push(messageRelation.isRead);
                        messageChildIdList.push(messageRelation.childIdList);
                    }
                }
                //If user filter not to show any messages related to their children
                messageIdList.length == 0 ? noMessages() : loadMessages(messageIdList, messageIsRead, messageChildIdList);
            };
            messageRelations.length == 0 ? noMessages() : hasMessages();
        }; //eo loadMessageRelation

        //when the DOM has been updated let gumby reinitialize UI modules
        var spinner = null;
        var children = {    id: [],    color: []    };
        var addedToDOM = function() {
            spinner = _createSpinner('spinner');
            children = {    id: [],    color: []    };
            _loadChildrenColors(function() {
                _checkUnreadMessages(Parse);
                _checkUnreadEvent(Parse);
                _checkUnreadHomework(Parse);
                loadMesssageRelations();
            }, children);
            //Init touch events
            $("#createBtn").on('click', function() {    _setPreviousView();    Chaplin.utils.redirectTo({    name: 'create'    });    });
            $("#settingBtn").on('click', function() {    _setPreviousView();    Chaplin.utils.redirectTo({    name: 'setting-home'    });    });
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
            loadMesssageRelations();
        };
        var __id = 'messages-index-view';
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
                _setCurrentView(_view.MESSAGES_INDEX, __id);
                //Reset footer
                $("#footer-toolbar > li").removeClass("active");
                $("#messages-tool").addClass("active");
                _notify( 'refresh' ).subscribe(refreshView);
                Chaplin.View.prototype.initialize.call(this, arguments);
            }
        });

        return View;
    });
