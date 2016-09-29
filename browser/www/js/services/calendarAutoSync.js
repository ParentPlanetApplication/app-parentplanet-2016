define([
    'jquery',
    'parse',
    'localStorageService'
], function($, Parse, localStorageService) {
    'use strict';

    function CalendarAutoSync() {
        var autoSync = {
            coreSync: function(userId, newDeferred) {
                console.log('coreSync running');
                _autoSyncCurrent = {};

                function getReminderMinutes(reminderString) {
                    switch (reminderString) {
                        case "Never":
                            return null;
                        case "At Time of Event":
                            return 0;
                        case "5 Minutes Before":
                            return 5;
                        case "10 Minutes Before":
                            return 10;
                        case "15 Minutes Before":
                            return 15;
                        case "30 Minutes Before":
                            return 30;
                        case "1 Hour Before":
                            return 60;
                        case "2 Hours Before":
                            return 120;
                        case "4 Hours Before":
                            return 240;
                        case "1 Day Before":
                            return 24 * 60;
                        case "2 Days Before":
                            return 2 * 24 * 60;
                        case "1 Week Before":
                            return 7 * 24 * 60;
                        default:
                            return null;
                    }
                }

                function loadEventsToSync(group) {
                    var groupId = group.groupId;
                    var lastSyncDate = group.lastSyncDate;
                    var calendarToSync = group.calendarToSync;

                    function queryEventsToSync() {
                        var eventInfo = {
                            events: [],
                            calendarToSync: calendarToSync,
                            lastSyncDate: lastSyncDate
                        }

                        function loadEvents() {
                            var deferred = $.Deferred();
                            queryEvents().then(
                                function(events) {
                                    function sortEvents(events) {
                                        if (events.length === 0) {
                                            return [];
                                        }

                                        var singleEvents = [];
                                        var rootEvents = [];
                                        var updatedInstanceEvents = [];

                                        $.each(events, function(i, event) {
                                            if (!event.attributes.repeatId) {
                                                singleEvents.push(event);
                                            } else if (event.attributes.repeatId.indexOf(_firstRepeat()) >= 0) {
                                                rootEvents.push(event);
                                            } else {
                                                updatedInstanceEvents.push(event);
                                            }

                                            // The eventsLoadedTime will be used to set the last-sync-date.
                                            // This check will help handle the case when an event is added after data is returned to client.
                                            if (event.updatedAt > group.eventsLoadedTime) {
                                                group.eventsLoadedTime = event.updatedAt;
                                            }
                                        });

                                        return $.merge($.merge($.merge([], singleEvents), rootEvents), updatedInstanceEvents);
                                    }

                                    eventInfo.events = sortEvents(events);
                                    deferred.resolve(eventInfo);
                                },
                                function() {
                                    deferred.reject();
                                }
                            );

                            return deferred;
                        }

                        var deferred = $.Deferred();

                        loadEvents().then(
                            function(eventInfo) {
                                deferred.resolve(eventInfo);
                            },
                            function() {
                                deferred.reject();
                            }
                        );

                        return deferred;
                    }

                    function queryEvents() {
                        function buildQueryRootRepeatedEventUpdatedAfterLastSync() {
                            var Event = Parse.Object.extend("Event", {}, {
                                query: function() {
                                    return new Parse.Query(this.className);
                                }
                            });
                            var query = Event.query();
                            query.equalTo("orgIdForThisObject", groupId);
                            query.endsWith("repeatId", "-0");
                            query.greaterThan("updatedAt", new Date(lastSyncDate));
                            query.greaterThan("untilDate", new Date());

                            return query;
                        };

                        function buildQuerySingleEventUpdatedAfterLastSync() {
                            var Event = Parse.Object.extend("Event", {}, {
                                query: function() {
                                    return new Parse.Query(this.className);
                                }
                            });
                            var query = Event.query();
                            query.equalTo("orgIdForThisObject", groupId);
                            query.containedIn("repeatId", ["", null]);
                            query.greaterThan("updatedAt", new Date(lastSyncDate));
                            query.greaterThan("endDateTime", new Date());
                            return query;
                        }

                        function buildQueryRepeatedEventInstanceUpdatedAfterLastSync() {
                            var Event = Parse.Object.extend("Event", {}, {
                                query: function() {
                                    return new Parse.Query(this.className);
                                }
                            });
                            var query = Event.query();
                            query.equalTo("orgIdForThisObject", groupId);
                            query.notContainedIn("repeatId", ["", null]);
                            query.equalTo("isModifySingleEvent", true);
                            query.greaterThan("updatedAt", new Date(lastSyncDate));
                            query.greaterThan("endDateTime", new Date());
                            return query;
                        }
       
                        function buildQuerySubscribedEvents() {
                            var Event = Parse.Object.extend("Event", {}, {
                                query: function() {
                                    return new Parse.Query(this.className);
                                }
                            });
                            var query = Event.query();
                            query.equalTo("subscribers", _deviceToken);
                            query.greaterThan("updatedAt", new Date(lastSyncDate));
                            query.greaterThan("endDateTime", new Date());
                            return query;
                        }

                        var mainQuery = null;
       
                        if (groupId == "Subscribers") {
                            mainQuery = buildQuerySubscribedEvents();
                        } else {
                            mainQuery = Parse.Query.or(
                                buildQueryRootRepeatedEventUpdatedAfterLastSync(),
                                buildQueryRepeatedEventInstanceUpdatedAfterLastSync(),
                                buildQuerySingleEventUpdatedAfterLastSync());
                        }

                        mainQuery.ascending("startDateTime");
                        return mainQuery.find();
                    }

                    var deferred = $.Deferred();
                    queryEventsToSync().then(
                        function(eventInfo) {
                            console.log('loadEventsToSync');
                            console.log(eventInfo);
                            deferred.resolve(eventInfo);
                        },
                        function() {
                            deferred.reject();
                        }
                    );
                    return deferred;
                }

                function syncEvents(eventInfo) {
                    function syncToNativeCalendar(event, calendarToSync) {
                        function getCalendarOptions(nativeEventId, event, calendarName) {
                            var calOptions = {};

                            function setRepeatInfo() {
                                if (!event || !event.get('repeatId')) {
                                    return;
                                }

                                var repeat = event.attributes.repeat;
                                repeat = repeat.trim().toLowerCase();

                                var recurrence = null;
                                if (repeat.indexOf('day') >= 0) {
                                    recurrence = 'daily';
                                } else if (repeat.indexOf('week') >= 0) {
                                    recurrence = 'weekly';
                                } else if (repeat.indexOf('month') >= 0) {
                                    recurrence = 'monthly';
                                } else if (repeat.indexOf('year') >= 0) {
                                    recurrence = 'yearly';
                                }
                                var recurrenceEndDate = event.get('untilDate');
                                calOptions.recurrence = recurrence;
                                calOptions.recurrenceInterval = (repeat.indexOf('weeks') >= 0) ? 2 : 1; // bi-weekly case.
                                calOptions.recurrenceEndDate = recurrenceEndDate;
                            };

                            calOptions.calendarName = calendarName;

                            if (nativeEventId) {
                                calOptions.id = nativeEventId;
                            }
                            setRepeatInfo();

                            return calOptions;
                        }

                        function getLastSyncInfo(event) {
                            var lastSyncEntry = null;
                            if (event.attributes.history && event.attributes.history.length > 0) {
                                if (eventInfo.lastSyncDate.getTime() === _defaultFirstSyncDate.getTime()) {
                                    // return last element
                                    return event.attributes.history[event.attributes.history.length - 1];
                                }

                                // Find the last history entry that < sync date. This is the start & end date in the calendar.
                                $.each(event.attributes.history, function(i, historyEntry) {
                                    if (historyEntry.timestamp.getTime() <= eventInfo.lastSyncDate.getTime()) {
                                        lastSyncEntry = historyEntry;
                                    }
                                });

                                // Handle special case when instance is modified after last Sync
                                if (!lastSyncEntry) {
                                    lastSyncEntry = event.attributes.history[0];
                                }
                            }

                            return lastSyncEntry;
                        }

                        function buildSyncId(event) {
                            var historyEntry = getLastSyncInfo(event);

                            if (historyEntry) {
                                return historyEntry.syncId;
                            }

                            return event.id;
                        }

                        function getIdText(eventId) {
                            return "ID#" + eventId;
                        }
                        /*
                            add by phuongnh@vinasource.com
                            convert datetime to UTC time with format Month days, Year HourOf24:minutes:seconds
                        */
                        function utcDateTime(strDateTime) {
                            return new Date(moment.utc(strDateTime).format("MMMM D, YYYY H:mm:ss"));
                        }

                        function findNativeEvent(event, calendarToSync) {
                            var deferred = $.Deferred();

                            var error = function(error) {
                                console.log('Error findNativeEvent for eventId [' + event.id + '] in calendar [' + calendarToSync + ']: ' + error);
                                _alert('Calendar Autosync Error: an error occurred while trying to find native event [' +
                                    event.attributes.title + '] in calendar [' + calendarToSync + ']: ' + error);
                                deferred.reject();
                            };

                            var success = function(foundEvents) {
                                if (foundEvents.length > 0) {
                                    console.log('Successfully found ' + foundEvents.length + ' native event');
                                } else {
                                    console.log('No native event found for event name: ' + event.attributes.title);
                                }
                                deferred.resolve(foundEvents);
                            };

                            var lastSyncInfo = getLastSyncInfo(event);

                            window.plugins.calendar.findEventWithOptions(
                                null, null, buildSyncId(event),
                                lastSyncInfo ? lastSyncInfo.startDate : event.attributes.startDateTime,
                                // moment(lastSyncInfo ? lastSyncInfo.startDate : event.attributes.startDateTime).add(1, 'ms').toDate(),
                                moment(lastSyncInfo ? lastSyncInfo.endDate : event.attributes.endDateTime).add(1, 'ms').toDate(),
                                getCalendarOptions(null, null, calendarToSync), success, error);

                            return deferred;
                        }

                        function findAndDeleteNativeEvent(event, calendarToSync) {
                            var deferred = $.Deferred();

                            var error = function(error) {
                                console.log('Error findAndDeleteNativeEvent for eventId [' + event.id + '] in calendar [' + calendarToSync + ']: ' + error);
                                _alert('Calendar Autosync Error: an error occurred while trying to find native event [' +
                                    event.attributes.title + '] in calendar [' + calendarToSync + ']: ' + error);
                                deferred.reject();
                            };

                            var success = function(foundEvents) {
                                if (foundEvents.length > 0) {
                                    console.log('Successfully delete ' + foundEvents.length + ' native event');
                                    console.log(foundEvents);
                                } else {
                                    console.log('No native event found for event name: ' + event.attributes.title);
                                }
                                deferred.resolve(foundEvents);
                            };

                            var lastSyncInfo = getLastSyncInfo(event);

                            window.plugins.calendar.deleteEventWithOptions(
                                null, null, buildSyncId(event),
                                lastSyncInfo ? lastSyncInfo.startDate : event.attributes.startDateTime,
                                moment(lastSyncInfo ? lastSyncInfo.startDate : event.attributes.startDateTime).add(1, 'ms').toDate(),
                                getCalendarOptions(null, null, calendarToSync), success, error);

                            return deferred;
                        }

                        function deleteNativeEvent(nativeEvent, calendarToSync) {
                            var deferred = $.Deferred();
                            var error = function(error) {
                                console.log('Error deleting event id: ' + nativeEvent.id + ', name: ' + nativeEvent.title + ', error: ' + error);
                                _alert('Calendar Autosync Error while deleting event:' + eventId + ' ' + error);
                                deferred.reject();
                            };

                            var success = function(message) {
                                console.log('Successfully deleted event id: ' + nativeEvent.id + ', name: ' + nativeEvent.title);
                                deferred.resolve();
                            };

                            console.log('Deleting event (' + nativeEvent.title + ') with Id ' + nativeEvent.id);
                            /*
                                Change by phuongnh@vinasource
                                - must replace api delete event after upgrade version plugin calendar
                                - use deleteEventById function after restore function for plugin
                             */
                            window.plugins.calendar.deleteEventById(nativeEvent.id, success, error);
                            return deferred;
                        }

                        function createNativeEvent(event, calendarToSync) { //these are js Date objects NOT strings
                            var deferred = $.Deferred();

                            var errorAddCalendar = function(error) {
                                console.log('Error adding to calendar: name: ' + event.attributes.title + ', error: ' + error);
                                _alert('Calendar Autosync Error event:' + event.Id + ' ' + error);
                                deferred.reject();
                            };

                            var successAddCalendar = function(message) {
                                console.log('Successfully added event to calendar, name: ' + event.attributes.title + ', native id: ' + message);
                                console.log(event);
                                // _setUserCalendarItem(eventId, calendarItem);
                                console.log(_autoSyncCurrent[event.get('title')]);
                                console.log('calendarToSync:' + calendarToSync);
                                console.log(event.id);
                                console.log('----------------------------------');
                                if (_autoSyncCurrent[event.get('title')]) {
                                    _markAsAddedToCalendar(event.id, _getUserData());
                                }
                                deferred.resolve();
                            };

                            /*
                                edit by phuongnh@vinasource.com
                                don't need add \n in first line comment
                             */
                            var calOptions = getCalendarOptions(null, event, calendarToSync);

                            var firstReminder = getReminderMinutes(event.attributes.reminder);
                            var secondReminder = getReminderMinutes(event.attributes.reminder2);

                            if (firstReminder != null) {
                                calOptions.firstReminderMinutes = firstReminder;
                            }

                            if (secondReminder != null) {
                                calOptions.secondReminderMinutes = secondReminder;
                            }

                            window.plugins.calendar.createEventWithOptions(
                                event.attributes.title, event.attributes.location, event.attributes.note + "\n" + getIdText(event.id),
                                event.attributes.startDateTime, event.attributes.endDateTime,
                                calOptions,
                                successAddCalendar, errorAddCalendar);

                            return deferred;
                        }

                        function modifyNativeRepeatEventInstance(event, calendarToSync) {
                            var deferred = $.Deferred();
                            var error = function(error) {
                                console.log('Error modifying native repeat event, name: ' + event.attributes.title + ', error: ' + error);
                                deferred.reject();
                            };

                            var success = function(message) {
                                console.log('Successfully modifying native repeat event, name: ' + event.attributes.title);
                                deferred.resolve();
                            };

                            var historyEntry = getLastSyncInfo(event);
                            var titleId = buildSyncId(event);

                            console.log('modifyNativeRepeatEventInstance - ' + event.attributes.title);

                            window.plugins.calendar.modifyRepeatEventInstance(
                                titleId, historyEntry.startDate, historyEntry.endDate, calendarToSync,
                                event.attributes.isCanceled,
                                event.attributes.title, event.attributes.location, event.attributes.note + "\n" + getIdText(event.id),
                                event.attributes.startDateTime, event.attributes.endDateTime,
                                getReminderMinutes(event.attributes.reminder),
                                getReminderMinutes(event.attributes.reminder2), success, error);

                            //wait for 3s, and resolved the deferred
                            setTimeout(function() {
                                console.log('modifyNativeRepeatEventInstance timeout');
                                deferred.resolve();
                            }, 3000);

                            return deferred;
                        }

                        var calendarsToSync = [];
                        if (calendarToSync) {
                            calendarsToSync.push(calendarToSync);
                        }

                        // add topic to calendar system
                        if (event.get('clientsSync') != undefined) {
                            var arClientSync = event.get('clientsSync');
                            var lenArClientSync = arClientSync.length;
                            var i;
                            for (i = 0; i < lenArClientSync; i++) {
                                if (arClientSync[i].userId === userId && arClientSync[i].deviceToken === _deviceToken) {
                                    if (calendarsToSync.indexOf(arClientSync[i].AddedToSync) < 0) {
                                        calendarsToSync.push(arClientSync[i].AddedToSync);
                                    }
                                    break;
                                }
                            }
                        }

                        var deferred = $.Deferred();
                        var deferreds = [];

                        $.each(calendarsToSync, function(i, calendarName) {
                            console.log("Start AutoSyncs for calendar: " + calendarName);
                            console.log('isModifySingleEvent = ' + event.attributes.isModifySingleEvent);
                            if (!event.attributes.isModifySingleEvent) {
                                deferreds.push(findNativeEvent(event, calendarName)
                                    .then(function(nativeEvents) {
                                        var internalDeferreds = [];

                                        if (nativeEvents) {
                                            $.each(nativeEvents, function(i, nativeEvent) {
                                                internalDeferreds.push(deleteNativeEvent(nativeEvent, calendarName));
                                            });
                                        }

                                        // Don't re-create event if it's cancelled.
                                        if (!event.attributes.isCanceled) {
                                            console.log("Create event:");
                                            console.log(event);
                                            internalDeferreds.push(createNativeEvent(event, calendarName));
                                        }

                                        // Wait till all internal defferred finished.
                                        var outputDeferred = $.Deferred();
                                        $.when.apply(this, internalDeferreds)
                                            .then(
                                                function() {
                                                    outputDeferred.resolve();
                                                },
                                                function() {
                                                    outputDeferred.reject();
                                                });

                                        return outputDeferred;
                                    })
                                );
                            } else {
                                deferreds.push(modifyNativeRepeatEventInstance(event, calendarName));
                            }
                        });

                        $.when.apply(this, deferreds)
                            .then(
                                function() {
                                    deferred.resolve();
                                },
                                function() {
                                    deferred.reject();
                                });


                        return deferred;
                    }

                    var deferred = $.Deferred();
                    deferred.resolve();
                    console.log('Begin sync for ' + eventInfo.events.length + ' events.');
                    $.each(eventInfo.events, function(i, event) {
                        deferred = deferred.then(function() {
                            console.log('Start AutoSync for event: ' + event.attributes.title + ' on: ' + event.attributes.startDateTime);
                            return syncToNativeCalendar(event, eventInfo.calendarToSync);
                        }, function() {
                            return $.Deferred().reject();
                        });
                    });

                    deferred.always(function() {
                        console.log('Finish AutoSync session of last Sync date = ' + eventInfo.lastSyncDate + ' timestamp =' + eventInfo.lastSyncDate.getTime());
                    });

                    return deferred; // this is the defer of the sync of the last event in list.
                }

                function syncEventsOfGroup(group) {
                    console.log('Start new AutoSync for group:' + group.groupId + ' - Calendar: ' + group.calendarToSync + ' - last Sync date = ' + group.lastSyncDate + ' timestamp:' + group.lastSyncDate.getTime());

                    group.eventsLoadedTime = group.lastSyncDate;
                    return loadEventsToSync(group).then(syncEvents).then(
                        function() {
                            // Only update Last Sync date if sync finishes successfully
                            // if we always update, there might have some events haven't been synced
                            // and those will be ignored next time.
                            localStorageService.updateWatchingGroupLastSyncDate(group.userGroupRelationId, group.eventsLoadedTime);
                        }
                    );
                }

                function syncGroups(groups) {
                    var deferred = $.Deferred();
                    var deferreds = [];

                    var distinctGroups = [];
                    var existedGroupKeys = [];
                    var hasSubscriberGroup = false;
                    groups.forEach(function(group) {
                        var key = group.groupId + "&" + group.calendarToSync;
                        if (existedGroupKeys.indexOf(key) < 0) {
                            distinctGroups.push({
                                groupId: group.groupId,
                                lastSyncDate: group.lastSyncDate,
                                calendarToSync: group.calendarToSync,
                                userGroupRelationId: group.userGroupRelationId
                            });

                            existedGroupKeys.push(key);
                        }
                        
                        if (group.groupId == "Subscribers") {
                            hasSubscriberGroup = true;
                        }
                    });
       
                    if (!hasSubscriberGroup) {
                        var group = {
                            groupId: "Subscribers",
                            lastSyncDate: _defaultFirstSyncDate,
                            calendarToSync: "",
                            userGroupRelationId: "Subscribers"
                        };
                        distinctGroups.push(group);
       
                        localStorageService.addWatchingGroup(group.userGroupRelationId, group.groupId, "", true);
                    }
       
                    distinctGroups.forEach(function(group) {
                        deferreds.push(syncEventsOfGroup(group));
                    });
       
                    $.when
                        .apply($, deferreds)
                        .done(function() {
                            deferred.resolve();
                        })
                        .fail(function() {
                            deferred.resolve();
                        });

                    return deferred;
                }

                function loadGroupsToSync() {
                    // Use deffered to prepare for future if we need to load data from server. 
                    var deferred = $.Deferred();
                    deferred.resolve(localStorageService.getWatchingGroups());
                    return deferred;
                }

                loadGroupsToSync().then(syncGroups).always(
                    function() {
                        newDeferred.resolve();
                    }
                );
            },

            autoSyncWithCalendar: function(userId, forceResetSync) {
                if (_isMobile()) {
                    if (forceResetSync) {
                        _lastAutoSyncDeferred = null;
                    }

                    if (!_lastAutoSyncDeferred) {
                        _lastAutoSyncDeferred = $.Deferred();
                        _lastAutoSyncDeferred.resolve();
                    }

                    // TODO: Check with team why we have to do this.
                    // This causes the sync to run in parallel and mess up everything.

                    // var state = _lastAutoSyncDeferred.state();
                    // console.log('IS STATE: ' + state);

                    // if(_lastAutoSyncDeferred.state() === 'pending') {
                    //     _lastAutoSyncDeferred = autoSync.coreSync(userId);
                    // }

                    var newDeferred = $.Deferred();

                    _lastAutoSyncDeferred = autoSync.coreSync(userId, newDeferred);

                    // _lastAutoSyncDeferred.then(
                    //     function() {
                    //         _lastAutoSyncDeferred = autoSync.coreSync(userId, newDeferred);
                    //     },
                    //     function() {
                    //         _lastAutoSyncDeferred = autoSync.coreSync(userId, newDeferred);
                    //     }
                    // );

                    _lastAutoSyncDeferred = newDeferred;

                }
            }
        };

        return autoSync;
    }; //eo Spinner
    //return the ParseProxy constructor :)
    return CalendarAutoSync();
});
