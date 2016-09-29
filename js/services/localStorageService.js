define([
    'jquery'
], function($) {
    'use strict';

    function LocalStorageService() {
        var defaultStartSyncDate = new Date(2000, 1, 1);

        var service = {
            getAllWatchingGroupsLocalStorage: function() {
                return _getUserLocalStorage('watchingGroups');
            },

            getWatchingGroups: function() {
                var groups = this.getAllWatchingGroupsLocalStorage();
                if (!groups) {
                    groups = [];
                    _setUserLocalStorage('watchingGroups', groups);
                }

                var watchingGroups = [];

                groups.forEach(function(group) {
                    if (group.isWatching) {
                        group.lastSyncDate = new Date(group.lastSyncDate);
                        watchingGroups.push(group);
                    }
                });

                return watchingGroups;
            },

            getWatchingGroupById: function(userGroupRelationId) {
                var groups = this.getAllWatchingGroupsLocalStorage();
                var group = this.getGroupById(groups, userGroupRelationId);
                return group;
            },

            getGroupById: function(groups, userGroupRelationId) {
                var result = null;
                groups.forEach(function(item) {
                    if (item.userGroupRelationId == userGroupRelationId) {
                        result = item;
                    }
                });

                if (result) {
                    result.lastSyncDate = new Date(result.lastSyncDate);
                }
                return result;
            },

            updateWatchingGroupLastSyncDate: function(userGroupRelationId, lastSyncDate) {
                var groups = this.getAllWatchingGroupsLocalStorage();
                var group = this.getGroupById(groups, userGroupRelationId);
                group.lastSyncDate = lastSyncDate;
                _setUserLocalStorage('watchingGroups', groups);
            },

            addWatchingGroup: function(userGroupRelationId, groupId, calendarToSync, isWatching) {
                var groups = this.getAllWatchingGroupsLocalStorage();
                var group = this.getGroupById(groups, userGroupRelationId);

                if (group == null) {
                    group = {};
                    group.userGroupRelationId = userGroupRelationId;
                    group.lastSyncDate = defaultStartSyncDate;
                    groups.push(group);
                } else {
                    if (group.calendarToSync != calendarToSync) {
                        // Watching calendar changed => reset last sync date. 
                        group.lastSyncDate = defaultStartSyncDate;
                    }
                }

                if (calendarToSync != "None") {
                    group.calendarToSync = calendarToSync;
                }

                group.groupId = groupId;
                group.isWatching = isWatching;

                _setUserLocalStorage('watchingGroups', groups);
                return group;
            },

            removeWatchingGroup: function(group) {
                var groups = this.getAllWatchingGroupsLocalStorage();

                function deleteGroupFromLocalStorage() {
                    var idx = groups.indexOf(group);
                    if (idx >= 0) {
                        groups.splice(idx, 1);
                    }
                }

                function updateIsWatching() {
                    var group = this.getGroupById(groups, group.userGroupRelationId);
                    group.isWatching = false;
                }

                if (group.lastSyncDate == defaultStartSyncDate) {
                    deleteGroupFromLocalStorage();
                } else {
                    updateIsWatching();
                }

                _setUserLocalStorage('watchingGroups', groups);
            }
        }

        return service;
    };
    return LocalStorageService();
});
