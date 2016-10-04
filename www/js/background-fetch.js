var _onBackgroundFetch = function(callback, immediate, allAvailable, Chaplin, Deferred, flag) { //note: may need to resolve an outer Deferred
    var Parse = _parse;
    var timeout = null; //for staggering the background fetch action
    var lagTime = immediate ? 0 : Math.round(_backgroundFetchSpreadTime * Math.random()); //n msec to wait before continuing, staying within the 30 sec. window, from vars.js#288
    var deferred = null; //need a deferred available for all functions to use
    var events = []; //when getUserEvents called set ref. to this for use in getLocalNotifications
    var homework = []; //when getUserHomework called set ref. as done for events
    var cache = _getUserData();
    //var user = Parse.User.current();
    var userAcctAccessIds = cache.userAcctAccessIds ? cache.userAcctAccessIds : [cache.id];
    var userAcctAccessIdsCopy = userAcctAccessIds.slice();
    var generalAlert = function(err) {
        _alert(err.code + ' Connection Alert: Parent Planet may be Offline');
    };
    //Find accounts user has account access to
    var isUserAssociate = function() {
        var user = Parse.User.current();
        var children = [];
        var flag = false;
        var count = -1;
        var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserAcctAccess.query();
        deferred = $.Deferred();
        query.equalTo("givenAccessUserId", user.id);
        query.find().then(function(results) {
            userAcctAccessIds = [user.id];
            for (var i = 0; i < results.length; i++) {
                var parentId = results[i].get("parentId");
                if (userAcctAccessIds.indexOf(parentId) == -1) {
                    userAcctAccessIds.push(parentId);
                }
                if (userAcctAccessIdsCopy.indexOf(parentId) == -1) {
                    flag = true;
                    count++
                    var family = results[i].get("familyName");
                }
            }
            //if (flag) {
            //    count == 0 ? _confirm("You have been given access to the " + family + " family account. New children have been added to your list of kids and activities.") : _confirm("You have been given access to the " + family + " family and " + count + " other accounts. New children have been added to your list of kids and activities.")
            //}
            var query2 = UserParentRelation.query();
            query2.containedIn("parentId", userAcctAccessIds);
            query2.ascending("childFirstName");
            return query2.find();
        }).then(function(results) {
            var cache = _getUserData();
            var setLocalColor = function(child, result) {
                var children = _getUserChildren();
                children = jQuery.grep(children, function(n) {
                    return n.id == child.id
                }); //eo grep
                child.localColor = children.length > 0 && children[0].localColor ? children[0].localColor : result.get("color");
            }
            $.each(results, function(i, result) {
                var child = {};
                child.id = result.get("childId");
                child.firstName = result.get("childFirstName");
                child.lastName = result.get("childLastName");
                result.get("parentId") == user.id ? child.color = result.get("color") : setLocalColor(child, result); //if other account's child, set color to default blue, and set as localColor so we know not to push changes to it to Parse
                children.push(child);
            });
            cache = cache === null ? {} : cache;
            cache.children = children;
            cache.userAcctAccessIds = userAcctAccessIds;
            _setUserData(cache);
            deferred.resolve();
        }, function(error) {
            deferred.resolve();
        });
        return deferred.promise();
    }; //eo isUserAssociate
    //Simply copy the code from signin-view.js
    var getUserEventRelations = function() {
        //console.log('Start getUserEventRelations: ' + new Date());
        var user = Parse.User.current();
        var userEventRelations = _getUserEventRelations(); //keep user's data if parentId != user.id (user account access)
        var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserEventRelation.query();
        var date = new Date();
        deferred = $.Deferred(); //scope is global to background-fetch and everything else #5 :)
        query.containedIn("parentId", userAcctAccessIds);
        allAvailable ? query.limit(7500) : query.limit(1000);
        //  console.log("BackgroundFetch getUserEventRelations deferred set");
        allAvailable ? date.setFullYear(DEFAULTSTARTYEAR) : date.setMonth(date.getMonth() - 3);
        query.greaterThanOrEqualTo("createdAt", date);
        query.descending("createdAt");
        query.find({
            success: function(eventRelations) {
                var hasResults = function() {
                    var eventIdList = [];
                    var eventIsRead = [];
                    var eventChildIdList = [];
                    var temp = [];
                    var allEventRelations = [];
                    //Collect all event ids
                    $.each(eventRelations, function(i, eventRelation) {
                        var eventRelationAtt = eventRelation.attributes;
                        var childIdList = eventRelationAtt.childIdList;
                        if (!childIdList) {
                            //do nothing
                        } else if (childIdList.length == 0 && eventRelationAtt.parentId != user.id) {
                            //do nothing
                        } else if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {} else if (eventIdList.indexOf(eventRelationAtt.eventId) == -1) {
                            eventIdList.push(eventRelationAtt.eventId);
                            eventIsRead.push(eventRelationAtt.isRead);
                            eventChildIdList.push(eventRelationAtt.childIdList);
                            if (eventRelationAtt.parentId != user.id) { //check if should be replaced with localStorage data to keep user's individual isRead setting
                                temp = $.grep(userEventRelations, function(n) {
                                    return (n.eventId == eventRelationAtt.eventId && n.isUpdated == eventRelationAtt.isUpdated);
                                });
                                var pushRelation = temp.length > 0 ? temp[0] : eventRelation;
                                allEventRelations.push(pushRelation);
                            } else {
                                allEventRelations.push(eventRelation);
                            }
                        }
                    });
                    //console.log('End getUserEventRelations: ' + new Date());
                    getUserEvents(eventIdList, eventIsRead, eventChildIdList); //Get latest events
                    _setUserEventRelations(allEventRelations);
                }; //eo hasResults
                eventRelations.length === 0 ? deferred.resolve() : hasResults(); //go on to the next step: getUserHomeworkRelations
            }, //eo success
            error: function(error) { deferred.resolve(); } //go to the next step
        }); //eo query
        return deferred.promise();
    }; //eo getUserEventRelations
    var getUserEvents = function(eventIdList, eventIsRead, eventChildIdList) {
        //console.log('Start getUserEvent: ' + new Date());
        var user = Parse.User.current();
        var Event = Parse.Object.extend("Event", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = Event.query();
        //var today = new Date(); //start at midnight
        var today = moment().startOf('day').format(); //get ISO8601
        today = new Date(today); //get js Date obj
        query.containedIn("objectId", eventIdList);
        query.ascending("startDateTime");
        query.greaterThanOrEqualTo("startDateTime", today);
        query.find({
            success: function(results) {
                //console.log('In getUserEvent: got result' + new Date());
                var eventRelations = _getUserEventRelations();
                var matchingEventRelations = [];
                var temp = [];
                var senderIdList = [];
                events = results; //keep a ref. for use elsewhere (getLocalNotifications)
                
                var localEvents = _getUserEvents();
                //console.log('In getUserEvent: count result ' + events.length);
                $.each(events, function(i, event) {
                    var eventAtt = event.attributes;
                    
                    var localEvent = localEvents.find(function(e) {
                        e.objectId == event.id;
                    });
                    
                    //var localEvent = _getUserEventsItem(event.id);
                    var checkReminder = function() {
                        if (localEvent.reminder != eventAtt.reminder) {
                            event.set("reminder", localEvent.reminder);
                        }
                        if (localEvent.reminder2 != eventAtt.reminder2) {
                            event.set("reminder2", localEvent.reminder2);
                        }
                    }; //eo checkReminder
                    
                    localEvent ? checkReminder() : $.noop;
                    
                    temp = $.grep(eventRelations, function(eventRelation, j) {
                        var flag = eventRelation.eventId === event.id ? true : false;
                        if (flag) {
                            if (eventRelation.childIdList.length == 0) {
                                flag = eventRelation.parentId == user.id ? true : false;
                            }
                        }
                        return flag;
                    });
                    matchingEventRelations = matchingEventRelations.concat(temp);
                    
                    senderIdList.indexOf(eventAtt.senderId) === -1 ? senderIdList.push(eventAtt.senderId) : $.noop();
                    
                });
                //console.log('End getUserEvent: got result' + new Date());
                //console.log('background-fetch.getUserEvents._autoSyncWithCalendar');
                if (!_BackgroundFetching) {
                    _BackgroundFetching = true;
                    _autoSyncWithCalendar() //handle sync using promises
                } else {
                    console.log('background-fetch.getUserEvents._autoSyncWithCalendar running');
                }
                _setUserEvents(events);
                _setUserEventRelations(matchingEventRelations);
                getUserEventSenderList(senderIdList);

            }, //eo success query find
            error: function(error) { deferred.resolve(); } //go to the next step
        });
    }; //eo getUserEvents
    var getUserEventSenderList = function(senderIdList) {
        var query = new Parse.Query(Parse.User);
        query.containedIn("objectId", senderIdList);
        query.find({
            success: function(results) {
                _setEventSenderList(results);
                deferred.resolve(); //go on to the next step of backgroundFetch: getUserMessageRelations
            },
            error: function(error) { deferred.resolve(); } //go to the next step
        });
    }; //eo getUserEventSenderList
    var getUserMessageRelations = function() {
        var user = Parse.User.current();
        var userMessageRelations = _getUserMessageRelations();
        var UserMessageRelation = Parse.Object.extend("UserMessageRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserMessageRelation.query();
        deferred = $.Deferred(); //scope is global to background-fetch and everything else #5 :)
        query.containedIn("parentId", userAcctAccessIds);
        //Caching data up to 3 months old
        var date = new Date();
        //  console.log("BackgroundFetch getUserMessageRelations deferred set");
        allAvailable ? query.limit(7500) : query.limit(1000);
        allAvailable ? date.setFullYear(DEFAULTSTARTYEAR) : date.setMonth(date.getMonth() - 3);
        query.greaterThanOrEqualTo("createdAt", date);
        query.descending("createdAt");
        query.find({
            success: function(messageRelations) {
                //Store using HTML5 local storage
                var cache = JSON.parse(localStorage.getItem("user"));
                var hasResults = function() {
                    var messageIdList = [];
                    var messageIsRead = [];
                    var messageChildIdList = [];
                    var temp = [];
                    var allMessageRelations = [];
                    //Collect all message ids
                    $.each(messageRelations, function(i, messageRelation) {
                        var childIdList = messageRelation.get("childIdList");
                        if (!childIdList) {} else if (childIdList.length == 0 && messageRelation.get("parentId") != user.id) {
                            //do nothing
                        } else if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {} else if (messageIdList.indexOf(messageRelation.get("messageId")) == -1) {
                            messageIdList.push(messageRelation.get("messageId"));
                            messageIsRead.push(messageRelation.get("isRead"));
                            messageChildIdList.push(messageRelation.get("childIdList"));
                            if (messageRelation.get("parentId") != user.id) { //check if should be replaced with localStorage data to keep user's individual isRead setting
                                temp = $.grep(userMessageRelations, function(n) {
                                    return n.messageId == messageRelation.get("messageId");
                                });
                                var pushRelation = temp.length > 0 ? temp[0] : messageRelation;
                                allMessageRelations.push(pushRelation);
                            } else {
                                allMessageRelations.push(messageRelation);
                            }
                        }
                    });
                    //Get latest messages
                    getUserMessages(messageIdList, messageIsRead, messageChildIdList);
                    _setUserMessageRelations(allMessageRelations);
                }; //eo hasResults
                //_setUserMessageRelations(messageRelations);
                messageRelations.length === 0 ? deferred.resolve() : hasResults(); //go on to the next step:
            }, //eo success query
            error: function(error) { deferred.resolve(); } //go to the next step
        });
        return deferred.promise();
    }; //eo getUserMessageRelations
    var getUserMessages = function(messageIdList, messageIsRead, messageChildIdList) {
        var user = Parse.User.current();
        var Message = Parse.Object.extend("Message", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = Message.query();
        query.containedIn("objectId", messageIdList);
        query.descending("createdAt");
        query.find({
            success: function(messages) {
                //Store using HTML5 local storage
                var messageRelations = _getUserMessageRelations();
                var senderIdList = [];
                var temp = [];
                var matchingMessageRelations = [];
                _setUserMessages(messages);
                $.each(messages, function(i, message) {
                    temp = $.grep(messageRelations, function(messageRelation, j) {
                        var flag = messageRelation.messageId === message.id ? true : false;
                        if (flag) {
                            if (messageRelation.childIdList.length == 0) {
                                flag = messageRelation.parentId == user.id ? true : false;
                            }
                        }
                        return flag;
                    });
                    matchingMessageRelations = matchingMessageRelations.concat(temp);
                    senderIdList.indexOf(message.get("senderId")) === -1 ? senderIdList.push(message.get("senderId")) : $.noop();
                });
                getUserMessageSenderList(senderIdList);
                _setUserMessageRelations(matchingMessageRelations);
            },
            error: function(error) { deferred.resolve(); } //go to the next step
        });
    }; //eo getUserMessages
    var getUserMessageSenderList = function(senderIdList) {
        var query = new Parse.Query(Parse.User);
        query.containedIn("objectId", senderIdList);
        query.find({
            success: function(messageSenderList) {
                _setMessageSenderList(messageSenderList);
                deferred.resolve(); //go on to the next step of backgroundFetch: homework
            },
            error: function(error) { deferred.resolve(); } //go to the next step
        });
    }; //eo getUserMessageSenderList
    var getUserHomeworkRelations = function() {
        var user = Parse.User.current();
        var homeworkRelations = _getUserHomeworkRelations();
        var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var date = new Date();
        var query = UserHomeworkRelation.query();
        deferred = $.Deferred(); //scope is global to background-fetch and everything else #5 :)
        allAvailable ? query.limit(7500) : query.limit(1000);
        allAvailable ? date.setFullYear(DEFAULTSTARTYEAR) : date.setMonth(date.getMonth() - 3);
        query.greaterThanOrEqualTo("createdAt", date);
        query.containedIn("parentId", userAcctAccessIds);
        query.find({
            success: function(userHomeworkRelations) {
                //Update local cache =======================
                var cache = JSON.parse(localStorage.getItem("user"));
                var hasResults = function() {
                    var homeworkIdList = [];
                    var homeworkIsRead = [];
                    var homeworkChildIdList = [];
                    var temp = [];
                    var allHomeworkRelations = [];
                    //Collect all message ids
                    $.each(userHomeworkRelations, function(i, homeworkRelation) {
                        var childIdList = homeworkRelation.get("childIdList");
                        if (!childIdList) {} else if (childIdList.length == 0 && homeworkRelation.get("parentId") != user.id) {
                            //do nothing
                        } else if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {
                            //Do nothing
                        } else if (homeworkIdList.indexOf(homeworkRelation.get("homework")) == -1) {
                            homeworkIdList.push(homeworkRelation.get("homeworkId"));
                            homeworkIsRead.push(homeworkRelation.get("isRead"));
                            homeworkChildIdList.push(homeworkRelation.get("childIdList"));
                            if (homeworkRelation.get("parentId") != user.id) { //check if should be replaced with localStorage data to keep user's individual isRead setting
                                temp = $.grep(homeworkRelations, function(n) {
                                    return (n.homeworkId == homeworkRelation.get("homeworkId") && n.isUpdated == homeworkRelation.get("isUpdated"));
                                });
                                var pushRelation = temp.length > 0 ? temp[0] : homeworkRelation;
                                allHomeworkRelations.push(pushRelation);
                            } else {
                                allHomeworkRelations.push(homeworkRelation);
                            }

                        }
                    });
                    getUserHomework(homeworkIdList, homeworkIsRead, homeworkChildIdList);
                    _setUserHomeworkRelations(allHomeworkRelations);
                }; //eo hasResults
                //_setUserHomeworkRelations(userHomeworkRelations);
                // End =====================
                userHomeworkRelations.length === 0 ? deferred.resolve() : hasResults(); //go on to the next step of backgroundFetch: contacts
            },
            error: function(error) { deferred.resolve(); } //go to the next step
        });
        return deferred.promise();
    }; //eo getUserHomeworkRelations
    var getUserHomework = function(homeworkIdList, homeworkIsRead, homeworkChildIdList) {
        var user = Parse.User.current();
        var Homework = Parse.Object.extend("Homework", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = Homework.query();
        query.containedIn("objectId", homeworkIdList);
        query.descending("createdAt");
        query.find({
            success: function(results) {
                var homeworkRelations = _getUserHomeworkRelations();
                var senderIdList = [];
                var temp = [];
                var matchingHomeworkRelations = [];
                var limit = moment().subtract(1, 'months');
                limit = new Date(limit);
                homework = results; //set for handling global scope
                _setUserHomework(homework);
                $.each(homework, function(i, homeworkAssignment) {
                    if (homeworkAssignment.get("dueDate") < limit) { return; }
                    temp = $.grep(homeworkRelations, function(homeworkRelation, j) {
                        var flag = homeworkRelation.homeworkId === homeworkAssignment.id ? true : false;
                        if (flag) {
                            if (homeworkRelation.childIdList.length == 0) {
                                flag = homeworkRelation.parentId == user.id ? true : false;
                            }
                        }
                        return flag;
                    });
                    matchingHomeworkRelations = matchingHomeworkRelations.concat(temp);
                    senderIdList.indexOf(homeworkAssignment.get("creatorId")) === -1 ? senderIdList.push(homeworkAssignment.get("creatorId")) : $.noop();
                });
                _setUserHomeworkRelations(matchingHomeworkRelations);
                getUserHomeworkSenderList(senderIdList);
            },
            error: function(error) { deferred.resolve(); } //go to the next step
        });
    }; //eo getUserHomework
    var getUserHomeworkSenderList = function(senderIdList) {
        var query = new Parse.Query(Parse.User);
        query.containedIn("objectId", senderIdList);
        query.find({
            success: function(homeworkSenderList) {
                _setHomeworkSenderList(homeworkSenderList);
                deferred.resolve(); //go on to the next step of backgroundFetch: callback
            },
            error: function(error) { deferred.resolve(); } //go to the next step
        });
    }; //eo getUserHomeworkSenderList
    var getContacts = function() {
        var user = Parse.User.current();
        var Contacts = Parse.Object.extend("Contacts", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = Contacts.query();

        function success(results) {
            _setUserContacts(results);
            deferred.resolve();
        };

        function error(err) {
            generalAlert(err);
            deferred.resolve();
        };
        deferred = $.Deferred(); //scope is global to background-fetch and everything else #5 :)
        query.equalTo("ownerId", user.id);
        query.find({ success: success, error: error });
        return deferred.promise();
    }; //eo getContacts
    var getUserCustomList = function() {
        var user = Parse.User.current();
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserCustomList.query();

        function success(results) {
            //The following part is no longer used, we have to rework on it.
            //The part starts here
            //Update local cache =======================
            var userCustomList = _getUserCustomList();
            var userCustomListIdArray = [];
            var orgGroupIdArray = [];
            var defaultCustomListData = null;
            var d, i;
            var defaultCustomListId = _getDefaultCustomListId();
            var isDefaultCustomListFound = false;
            $.each(results, function(i, d) {
                userCustomListIdArray.push(d.id);
                orgGroupIdArray.push(d.get("groupId"));
            });
            _setUserCustomList(results);
            _setUserCustomListIdArray(userCustomListIdArray);
            _setOrgGroupIdArray(orgGroupIdArray);
            //Find default custom list then save locally
            for (var i = 0; i < results.length; i++) {
                d = results[i];
                if (d.id === defaultCustomListId) {
                    isDefaultCustomListFound = true;
                    break;
                }
            }
            isDefaultCustomListFound ? _setDefaultCustomListData(d) : _setDefaultCustomListData(null);
            deferred.resolve();
        }; //eo success
        function error(err) {
            generalAlert(err);
            deferred.resolve();
        }; //eo error
        deferred = $.Deferred(); //scope is global to background-fetch and everything else #5 :)
        query.equalTo("ownerId", user.id);
        query.find({ success: success, error: error });
        return deferred.promise();
    }; //getUserCustomList
    var getActivities = function() {
        return _getActivities();
    }; //eo getActivities
    var getLocalNotifications = function() {
        var isMobile = $('body').data('isMobile'); //are we on the mobile platform, hopefully this works in backgroundFetch too
        var setUserReminders = function() {
            //when events come in from Parse set the local notification for reminders

            _syncEventLocalNotifications(events);
            
            deferred.resolve();
        }; //eo setUserReminders
        deferred = $.Deferred(); //scope is global to background-fetch and everything else #5 :)
        isMobile ? setUserReminders() : deferred.resolve();
        return deferred.promise(); //must be in the chain after getUserEventRelations/getUserEvents
    }; //eo getLocalNotifications
    var getHomeworkLocalNotifications = function() {
        var isMobile = _isMobile(); //are we on the mobile platform, hopefully this works in backgroundFetch too
        var setUserReminders = function() { //when events come in from Parse set the local notification for reminders
            //events are set in getUserEvents
            var deferredArray = [];
            $.each(homework, function(i, _homework) {
                _homework.get('reminder') ? _setHomeworkLocalNotification(_homework, false) : $.noop(); //if a reminder has been set?
            }); //eo .each homework

            $.when.apply($, deferredArray)
                .done(function() {
                    deferred.resolve();
                    //console.log('Final resolve');
                })
                .fail(function() {
                    deferred.resolve();
                    //console.log('Final resolve - fail');
                });
        }; //eo setUserReminders
        deferred = $.Deferred(); //scope is global to background-fetch and everything else #5 :)
        isMobile ? setUserReminders() : deferred.resolve();
        return deferred.promise(); //must be in the chain after getUserEventRelations/getUserEvents
    }; //eo getHomeworkLocalNotifications
    var LocaleDateTime = function() {
        var d, s;
        d = new Date(); //Create Date object.
        s = "Date/Time: ";
        s += d.toLocaleString(); //Convert to current locale.
        return (s); //Return converted date
    }; //eo LocaleDateTime

    var resolveMainDefer = function() {
        Deferred ? Deferred.resolve() : $.noop(); //might have an 'outer/external' deferred to resolve
    };

    var backgroundFetch = function() {
        var user = Parse.User.current();
        var overlay = $('#loading-overlay');

        function refresher() {
            overlay ? overlay.show() : $.noop();
            refresh();
        }

        function refresh() {
            var res;
            var queue = [isUserAssociate, getUserEventRelations, getUserMessageRelations, getUserHomeworkRelations, getContacts, getUserCustomList, getActivities, getLocalNotifications, getHomeworkLocalNotifications];
            res = queue.reduce(function(prev, cur) { // chain to res later to hook on done
                return prev.then(cur);
            }, $.Deferred().resolve());
            res.then(function() { //a little sloppy, but easier to read and debug
                    _refreshNotiBadges(); //clear the counts
                    _checkUnreadMessages();
                    _checkUnreadEvent();
                    _checkUnreadHomework();
                    // overlay ? overlay.hide() : $.noop();
                    Chaplin ? callback(Chaplin) : callback(); //final bit
                })
                .always(function() {
                    _BackgroundFetching = false;
                    overlay ? overlay.hide() : $.noop();
                    resolveMainDefer();
                });
        }; //eo refresh
        if (_signInRefresh === 0) {
            _signInRefresh = 1;
        } else if (_signInRefresh === 1) {
            _signInRefresh = -1;
            overlay ? overlay.hide() : $.noop();
            resolveMainDefer();
            return;
        }
        user && _checkTimeWindow(-1) ? refresh() : resolveMainDefer(); //-1 to set time window to 0
    }; //eo backgroundFetch
    callback = arguments.length > 0 ? callback : $.noop; //if 'bare' backgroundFetch then no callback
    if (Parse.User.current()) {
        timeout = setTimeout(backgroundFetch, lagTime); //wait the appropriate random lag time and then proceed
    } else {
        Chaplin ? callback(Chaplin) : callback(); //final bit
        resolveMainDefer();
    }

}; //eo _onBackgroundFetch handler
