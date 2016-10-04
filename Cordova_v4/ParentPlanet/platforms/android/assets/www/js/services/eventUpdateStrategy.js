var BaseEventUpdateStrategy = function() {
    var Parse = _parse;
    var publicApi = {
        updateEventHistory: updateEventHistory,
        setEventDataFromLocalEvent: setEventDataFromLocalEvent
    }

    function updateEventHistory(localEvent, serverEvent, rootEventIdWhenFirstTimeEditInstance) {
        function getSyncId() {
            if (rootEventIdWhenFirstTimeEditInstance) {
                return rootEventIdWhenFirstTimeEditInstance;
            } else {
                return serverEvent.id;
            }
        }

        function addHistoryEntry(history, entry) {
            if (history.length > 0) {
                var lastHistoryEntry = history[history.length - 1];

                if (lastHistoryEntry.startDate.getTime() !== entry.startDate.getTime() ||
                    lastHistoryEntry.endDate.getTime() !== entry.endDate.getTime() ||
                    lastHistoryEntry.syncId !== entry.syncId) {
                    history.push(entry);
                }
            } else {
                history.push(entry);
            }
        }

        var historyEntry = {
            timestamp: serverEvent.updatedAt,
            startDate: serverEvent.attributes.startDateTime,
            endDate: serverEvent.attributes.endDateTime,
            syncId: getSyncId()
        }

        var history = serverEvent.get('history') !== undefined ? serverEvent.get('history') : [];
        addHistoryEntry(history, historyEntry);
        serverEvent.set('history', history);
    };

    function setEventDataFromLocalEvent(localEvent, serverEvent, rootEventIdWhenFirstTimeEditInstance) {
        function setUntilDateWhenEventCancelled() {
            if (localEvent.isCanceled && localEvent.repeat.trim() !== "Never") {
                serverEvent.set('until', moment(localEvent.startDate).format('MM/DD/YY'));
                serverEvent.set('untilDate', moment(localEvent.startDate).endOf('Day').toDate());
            }
        }

        updateEventHistory(localEvent, serverEvent, rootEventIdWhenFirstTimeEditInstance);
        serverEvent.set('title', localEvent.title);
        serverEvent.set('location', localEvent.location);
        serverEvent.set('allday', localEvent.allday);
        serverEvent.set('startDate', localEvent.startDate);
        serverEvent.set('startDateTime', localEvent.startDate);
        serverEvent.set('endDate', localEvent.endDate);
        serverEvent.set('endDateTime', localEvent.endDate);
        if (localEvent.untilDate) {
            serverEvent.set('untilDate', moment(localEvent.untilDate).endOf('Day').toDate());
        }
        serverEvent.set('until', localEvent.until);
        serverEvent.set('repeat', localEvent.repeat);
        serverEvent.set('reminder', localEvent.reminder);
        serverEvent.set('reminder2', localEvent.reminder2);
        serverEvent.set('note', localEvent.note);
        serverEvent.set('isCanceled', localEvent.isCanceled);

        setUntilDateWhenEventCancelled();
    }

    return publicApi;
};

var EventSingleToRepeatStrategy = function(localEvent, serverEvent, selectedUpdateOption) {
    var publicApi = {
        updateEvent: updateEvent
    }

    function updateEvent() {
        var deferred = $.Deferred();

        console.log('EventSingleToRepeatStrategy.updateEvent');
        publicApi.setEventDataFromLocalEvent(localEvent, serverEvent);
        serverEvent.set("repeatId", _generateRootRepeatId(serverEvent.id));

        serverEvent.save().then(function(updatedEvent) {
            _setUserEventsItem(updatedEvent.id, updatedEvent.attributes);
            _setEventLocalNotification(updatedEvent);
            _convertSingleToRepeatEvent(updatedEvent);
            deferred.resolve(updatedEvent);
        });

        return deferred.promise();
    }

    publicApi = $.extend(new BaseEventUpdateStrategy(), publicApi);
    return publicApi;
}

var EventSingleUpdatedStrategy = function(localEvent, serverEvent, selectedUpdateOption) {
    var publicApi = {
        updateEvent: updateEvent
    }

    function updateEvent() {
        var deferred = $.Deferred();
        console.log('EventSingleUpdatedStrategy.updateEvent');
        publicApi.setEventDataFromLocalEvent(localEvent, serverEvent);
        serverEvent.save().then(function(updatedEvent) {
            _setUserEventsItem(updatedEvent.id, updatedEvent.attributes);
            _setEventLocalNotification(updatedEvent);
            deferred.resolve(updatedEvent);
        });
        return deferred.promise();
    }

    publicApi = $.extend(new BaseEventUpdateStrategy(), publicApi);
    return publicApi;
}

var EventRepeatToSingleStrategy = function(localEvent, serverEvent, selectedUpdateOption) {
    var publicApi = {
        updateEvent: updateEvent
    }

    function updateEvent() {
        var deferred = $.Deferred();
        console.log('EventRepeatToSingleStrategy.updateEvent');
        _terminateRepeatEvent(serverEvent)
            .then(function() {
                publicApi.setEventDataFromLocalEvent(localEvent, serverEvent);
                serverEvent.unset('repeatId');

                serverEvent.save().then(function(updatedEvent) {
                    _setUserEventsItem(updatedEvent.id, updatedEvent.attributes);
                    _setEventLocalNotification(updatedEvent);
                    deferred.resolve(updatedEvent);
                });
            });
        return deferred.promise();
    }

    publicApi = $.extend(new BaseEventUpdateStrategy(), publicApi);
    return publicApi;
}

var EventRepeatUpdatedStrategy = function(localEvent, serverEvent, selectedUpdateOption) {
    var Parse = _parse;
    var publicApi = {
        updateEvent: updateEvent
    }

    function updateEvent() {
        var deferred = $.Deferred();
        console.log('EventRepeatUpdatedStrategy.updateEvent');
        _terminateRepeatEvent(serverEvent)
            .then(function() {
                function isRootRepeatEvent(serverEvent) {
                    var repeatId = serverEvent.get('repeatId');
                    return repeatId && repeatId.indexOf(_firstRepeat()) >= 0;
                }

                publicApi.setEventDataFromLocalEvent(localEvent, serverEvent);

                var subDeferred = $.Deferred();
                if (!isRootRepeatEvent(serverEvent)) {
                    var serverRepeatId = serverEvent.get("repeatId");
                    var repeatRoot = _getRootRepeatId(serverRepeatId);
                    var EventRoot = Parse.Object.extend("Event", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var queryRoot = EventRoot.query();
                    var rootEvent;
                    queryRoot.equalTo("repeatId", repeatRoot);
                    queryRoot.find({
                        success: function(results) {
                            rootEvent = results[0];
                            subDeferred.resolve();
                        },
                        error: function(error) {
                            subDeferred.reject();
                            console.log(error);
                        }
                    });

                    subDeferred.done(function() {
                        subDeferred = $.Deferred();
                        serverEvent.set("clientsSync", rootEvent.get("clientsSync"));
                        serverEvent.set("repeatId", _generateRootRepeatId());
                    }, function() {
                        subDeferred = $.Deferred();
                        serverEvent.set("repeatId", _generateRootRepeatId());
                    });
                } else {
                    subDeferred.resolve();
                }
                subDeferred.done(function() {
                    serverEvent.save().then(function(updatedEvent) {
                        _setUserEventsItem(updatedEvent.id, updatedEvent.attributes);
                        _setEventLocalNotification(updatedEvent);
                        
                        var user = _getUserData();
                        var userCustomListObject = Parse.Object.extend("UserCustomList", {}, {
                            query: function() {
                                return new Parse.Query(this.className);
                            }
                        });
                        var updateSendId = user.id;
                        var query = userCustomListObject.query();
                        query.equalTo("ownerId", user.id);
                        query.equalTo("objectId", _selectedCustomListId);
                        query.find({
                            success: function(results) {
                                var userCustomListData = results[0];
                                var repeatEvents = _createRepeatingEvents(userCustomListData, serverEvent, updateSendId);
                                _saveRepeatingEvents(repeatEvents, userCustomListData, user);
                                deferred.resolve(updatedEvent);
                            }, //eo success query.find
                            error: function(err) {
                                _alert("Internal error, could not create the new event:" + err.message);
                                deferred.resolve(updatedEvent);
                            }
                        });
                    });
                });

            });
        return deferred.promise();
    }

    publicApi = $.extend(new BaseEventUpdateStrategy(), publicApi);
    return publicApi;
}

var EventRepeatInstanceUpdatedStrategy = function(localEvent, serverEvent, selectedUpdateOption) {
    var Parse = _parse;
    var publicApi = {
        updateEvent: updateEvent
    }

    function updateEvent() {
        console.log('EventRepeatInstanceUpdatedStrategy.updateEvent');
        var deferred = $.Deferred();
        var isFirstTimeEditInstance = !serverEvent.attributes.isModifySingleEvent;

        function coreUpdate(rootEvent) {
            publicApi.setEventDataFromLocalEvent(localEvent, serverEvent, rootEvent ? rootEvent[0].id : null);
            if (rootEvent) {
                serverEvent.set("clientsSync", rootEvent[0].get("clientsSync"));
            }
            serverEvent.set("repeat", "Never");
            serverEvent.set("isModifySingleEvent", true);
            serverEvent.save().then(function(updatedEvent) {
                _setUserEventsItem(updatedEvent.id, updatedEvent.attributes);
                _setEventLocalNotification(updatedEvent);
                deferred.resolve(updatedEvent);
            });
        }

        if (isFirstTimeEditInstance) {
            if (_isRootRepeatId(serverEvent.attributes.repeatId)) {
                coreUpdate([serverEvent]);
            } else {
                var Event = Parse.Object.extend("Event", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                })
                var query = Event.query();
                query.equalTo("repeatId", _getRootRepeatId(serverEvent.attributes.repeatId));
                query.find().then(coreUpdate);
            }
        } else {
            coreUpdate(null);
        }


        return deferred.promise();
    }

    publicApi = $.extend(new BaseEventUpdateStrategy(), publicApi);
    return publicApi;
}