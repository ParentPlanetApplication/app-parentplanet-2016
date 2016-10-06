var AddStudentToGroupByIdHandler = function() {}

_inheritsFrom(AddStudentToGroupByIdHandler, BaseAddStudentToGroupHandler);

AddStudentToGroupByIdHandler.prototype.add = function(childId, orgId, orgName, orgType, groupId, groupName, redirectFunc) {

    function getChildById(childId) {
        var deferred = $.Deferred();
        var Child = Parse.Object.extend("Child", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = Child.query();
        query.equalTo("objectId", childId);
        query.find({
            success: function(results) {
                if (results.length == 0) {
                    _alert("No student with the given ID found");
                    deferred.reject();
                } else {
                    deferred.resolve(results[0]);
                }
            },
            error: function(error) {
                console.log(error);
                _alert("There was an error connecting to the server, please try again");
                deferred.reject();
            }
        });

        return deferred;
    }

    var Parse = _parse;
    var m_this = this;
    return getChildById(childId)
        .then(function(child) {
            return m_this.addStudentToOrg(childId, child.get('firstName'), child.get('lastName'), orgId, orgType);
        }).then(function(childId) {
            return m_this.addStudentsToGroup([childId], orgId, groupId, groupName, redirectFunc);
        }).then(function() {

        });
}