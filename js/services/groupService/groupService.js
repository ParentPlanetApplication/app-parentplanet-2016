define([
    'jquery', 'parse'
], function($, Parse) {
    'use strict';

    function GroupService() {
        var service = {
            addStudentsToGroup: function(allStudentIdArray, orgId, groupId, groupName, redirectFun) {
                var handler = new AddStudentsToGroupHandler();
                return handler.addStudentsToGroup(allStudentIdArray, orgId, groupId, groupName, redirectFun);
            },

            addStudentToGroupByMail: function(senderUser, firstName, lastName, email, pwd, orgId, orgName, orgType, groupId, groupName, redirectFunc) {
                var handler = new AddStudentToGroupByMailHandler();
                return handler.add(senderUser, firstName, lastName, email, pwd, orgId, orgName, orgType, groupId, groupName, redirectFunc);
            },

            addStudentToGroupById: function(childId, orgId, orgName, orgType, groupId, groupName, redirectFunc) {
                var handler = new AddStudentToGroupByIdHandler();
                return handler.add(childId, orgId, orgName, orgType, groupId, groupName, redirectFunc);
            }
        };

        return service;
    };
    return GroupService();
});