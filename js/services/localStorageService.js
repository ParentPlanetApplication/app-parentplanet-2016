define([
    'jquery'
], function($) {
    'use strict';

    function LocalStorageService() {
        var defaultStartSyncDate = new Date(2000, 1, 1);
        

        var service = {
            getDeviceId: function () {
                if (_isMobile()) {
                    return device.uuid;
                } else {
                    return null;
                }
            },
            getDeviceSetting: function () {
                var self = this;
                var Parse = _parse;
                var deferred = $.Deferred();
                var query = new Parse.Query("AutoSyncSettings");
                query.equalTo("DeviceId", self.getDeviceId());
                query.find({
                    success: function (results) {
                        var rs = results.length > 0 ? results[0].get('Settings') : [];
                        deferred.resolve(rs);
                    },
                    error: function (error) {
                        console.log('Error: ' + JSON.stringify(error));
                        deferred.resolve([]);
                    }
                });

                return deferred;
            },
            setDeviceSettingWatchingGroups: function (groups) {
                var self = this;
                var deviceId = self.getDeviceId();
                if (deviceId != null) {
                    var Parse = _parse;
                    var query = new Parse.Query("AutoSyncSettings");
                    query.equalTo("DeviceId", deviceId);
                    query.find({
                        success: function (results) {
                            if (results.length > 0) {
                                var deviceSetting = results[0];
                                deviceSetting.set("Settings", groups);
                                deviceSetting.save();
                            } else {
                                var AutoSyncSettings = Parse.Object.extend("AutoSyncSettings");
                                var autoSyncSettings = new AutoSyncSettings();
                                autoSyncSettings.set("DeviceId", deviceId);
                                autoSyncSettings.set("Settings", groups);
                                autoSyncSettings.save();
                            }
                        }
                    });
                }
            },

            getAllWatchingGroupsLocalStorage: function() {
                return this.getDeviceSetting();
            },

            getWatchingGroups: function () {
                var self = this;

                var deferred = $.Deferred();
                this.getAllWatchingGroupsLocalStorage().done(function (groups) {
                    if (!groups) {
                        groups = [];
                        self.setDeviceSettingWatchingGroups(groups);
                    };
                    var watchingGroups = [];
                    groups.forEach(function (group) {
                        if (group.isWatching) {
                            group.lastSyncDate = new Date(group.lastSyncDate);
                            watchingGroups.push(group);
                        }
                    });

                    deferred.resolve(watchingGroups);
                });

                return deferred;
            },

            getWatchingGroupById: function (userGroupRelationId) {
                var self = this;
                var deferred = $.Deferred();
                this.getAllWatchingGroupsLocalStorage().done(function (groups) {
                    var group = self.getGroupById(groups, userGroupRelationId);
                    deferred.resolve(group);
                });
                return deferred;
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

            updateWatchingGroupLastSyncDate: function (userGroupRelationId, lastSyncDate) {
                var self = this;
                this.getAllWatchingGroupsLocalStorage().done(function (groups) {
                    var group = self.getGroupById(groups, userGroupRelationId);
                    group.lastSyncDate = lastSyncDate;
                    self.setDeviceSettingWatchingGroups(groups);
                });
            },

            addWatchingGroup: function (userGroupRelationId, groupId, calendarToSync, isWatching) {
                var self = this;
                var deferred = $.Deferred();
                this.getAllWatchingGroupsLocalStorage().done(function (groups) {
                    var group = self.getGroupById(groups, userGroupRelationId);

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

                    self.setDeviceSettingWatchingGroups(groups);
                    deferred.resolve(group);
                });
                
                return deferred;
            },

            removeWatchingGroup: function (group) {
                var self = this;
                this.getAllWatchingGroupsLocalStorage().done(function (groups) {
                    function deleteGroupFromLocalStorage() {
                        var idx = groups.indexOf(group);
                        if (idx >= 0) {
                            groups.splice(idx, 1);
                        }
                    }

                    function updateIsWatching() {
                        var group = self.getGroupById(groups, group.userGroupRelationId);
                        group.isWatching = false;
                    }

                    if (group.lastSyncDate == defaultStartSyncDate) {
                        deleteGroupFromLocalStorage();
                    } else {
                        updateIsWatching();
                    }

                    self.setDeviceSettingWatchingGroups(groups);
                });
            }
        }

        return service;
    };
    return LocalStorageService();
});
