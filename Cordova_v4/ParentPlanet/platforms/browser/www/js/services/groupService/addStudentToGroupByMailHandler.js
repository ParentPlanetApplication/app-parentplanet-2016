var AddStudentToGroupByMailHandler = function() {}

_inheritsFrom(AddStudentToGroupByMailHandler, BaseAddStudentToGroupHandler);

AddStudentToGroupByMailHandler.prototype.add = function(senderUser, firstName, lastName, email, pwd, orgId, orgName, orgType, groupId, groupName, redirectFunc) {
    function createAccount(email, senderUser) {
        var deferred = $.Deferred();

        function success(parent) {
            //NOTE: email and pwd are created prior and have global/function scope
            var senderName = [senderUser.firstName, senderUser.lastName].join(' ');
            var who = firstName + ' ' + lastName; //student name
            var d = { password: pwd, username: email, senderName: senderName, who: who, organizationName: orgName, groupName: groupName };
            Parse.Cloud.run('welcomeSender', d, {
                success: function(result) { deferred.resolve(parent.id) },
                error: function(err) {
                    _alert('Error: Unable to Send mail: ' + err.code + ' ' + err.message);
                    deferred.resolve(parent.id);
                }
            });
        }; //eo success
        function error(user, err) {
            _alert('Error: Unable to Create User Account: ' + err.code + ' ' + err.message);
            deferred.reject();
        }; //eo error
        _createUserAccount(email, pwd, success, error, null, null);

        return deferred;
    }; //eo createAccount

    function findChild(parentIds, childFirstName, childLastName) {
        var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserParentRelation.query();

        function success(results) { //results is an array of child obj.; actually one child [child]
            if (results.length > 0) {
                userParentRelation = results[0];
                childId = userParentRelation ? userParentRelation.get('childId') : null;
                deferred.resolve(childId);
            } else {
                deferred.resolve(null);
            }
        };

        function error(results) {
            deferred.reject(null);
        };
        deferred = $.Deferred(); //initial deferred
        query.containedIn("parentId", parentIds);
        query.containedIn("childFirstName", _containedIn(childFirstName));
        query.containedIn("childLastName", _containedIn(childLastName));
        query.find({ success: success, error: error })
        return deferred;
    }; //eo hasChild

    function createChildUser(parentId, childFirstName, childLastName) {
        var deferred = $.Deferred();
        var colors = ['#439a9a', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'];
        var colorIndex = Math.floor(Math.random() * colors.length); //
        var color = colors[colorIndex];
        //Create child data on server
        var Child = Parse.Object.extend("Child");
        var child = new Child();

        function success(child) {
            //Create parent-child relation
            var UserParentRelation = Parse.Object.extend("UserParentRelation");
            var relation = new UserParentRelation();
            relation.set("childFirstName", child.get("firstName"));
            relation.set("childLastName", child.get("lastName"));
            relation.set("color", child.get("color"));
            relation.set("parentId", parentId);
            relation.set("childId", child.id);
            // console.log(child.get("firstName"))
            relation.save(null, {
                success: function(relation) { deferred.resolve(child.id); },
                error: function(relation, error) {
                    deferred.reject();
                    console.log('Failed to create new UserParentRelation, with error code: ' + error.message);
                }
            }); //eo relation.save
        }; //eo success
        child.set("firstName", childFirstName);
        child.set("lastName", childLastName);
        child.set("isUser", false);
        child.set("creatorParentId", parentId);
        child.set("color", color);
        child.save(null, {
            success: success,
            error: function(child, error) {
                console.log('Failed to create new Child, with error code: ' + error.message);
            }
        }); //eo child.save

        return deferred;
    }; //eo createChildAccount

    function findParentIdsRelatedToMail(email) {
        var mainDeferred = $.Deferred();
        var m_parentIds = [];

        function getUserByEmail(email) {
            var deferred = $.Deferred();
            var userTable = Parse.Object.extend("User", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = userTable.query();
            query.equalTo("email", email);
            query.find(function(results) {
                if (results.length > 0) {
                    m_parentIds.push(results[0].id);
                }

                deferred.resolve();
            });

            return deferred;
        }

        getUserByEmail(email).then(function() {
            _getParentEmailGivenAccessUserEmail(email)
                .then(function(d) {
                    d.forEach(function(accessInfo) {
                        m_parentIds.push(accessInfo.id);
                    })
                    mainDeferred.resolve(m_parentIds);
                });
        });

        return mainDeferred;
    }; //eo checkForLinkedUser

    var Parse = _parse;
    var m_this = this;
    return findParentIdsRelatedToMail(email)
        .then(function(parentIds) {
            if (parentIds.length == 0) {
                function createAccountAndChild() {
                    return createAccount(email, senderUser)
                        .then(function(parentId) {
                            return createChildUser(parentId, firstName, lastName);
                        });
                }

                return createAccountAndChild();
            } else {
                function findChildAndCreateIfNotExist() {
                    return findChild(parentIds, firstName, lastName)
                        .then(function(childId) {
                            if (childId) {
                                return childId;
                            }

                            return createChildUser(parentIds[0], firstName, lastName);
                        });
                }

                return findChildAndCreateIfNotExist();
            }
        })
        .then(function(childId) {
            return m_this.addStudentToOrg(childId, firstName, lastName, orgId, orgType)
        })
        .then(function(childId) {
            return m_this.addStudentsToGroup([childId], orgId, groupId, groupName, redirectFunc)
        });

}