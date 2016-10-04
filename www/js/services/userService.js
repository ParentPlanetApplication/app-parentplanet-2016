define([
    'jquery'
], function($) {
    'use strict';

    function UserService() {
        var service = {
            getLinkedAccountUserIds: function(primaryUserIds) {
                var Parse = _parse;
                var deferred = $.Deferred();
                var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                var query = UserAcctAccess.query();
                var linkedUserIds = [];

                function success(results) {
                    results.forEach(function(userAcctAccess) {
                        var id = userAcctAccess.get('givenAccessUserId');
                        if (linkedUserIds.indexOf(id) < 0 && primaryUserIds.indexOf(id) < 0) {
                            linkedUserIds.push(id);
                        }
                    });
                    deferred.resolve(linkedUserIds);
                };

                function error(err) {
                    _alert("Can't load Linked accounts infor to send push notification" + err);
                    deferred.reject(err);
                }
                query.containedIn("parentId", primaryUserIds);

                query.find({
                    success: success,
                    error: error
                })

                return deferred;
            }


        }

        return service;
    }; //eo Spinner
    //return the ParseProxy constructor :)
    return UserService();
});