var BaseAddStudentToGroupHandler = function() {}

BaseAddStudentToGroupHandler.prototype.addStudentsToGroup = function(allStudentIdArray, orgId, groupId, groupName, redirectFunc) {
    var buildEmails = function() {
        var deferred = $.Deferred();
        console.log('Start build email at: ' + new Date());
        console.log(hashEmails);

        var getContent = function(data, type) {
            if (type === 'event') {
                return {
                    "allDay": data.get("isAllDay"),
                    "end": data.get("endDateTime"),
                    "location": data.get("location"),
                    "note": data.get("note"),
                    "repeat": data.get("repeat"),
                    "start": data.get("startDateTime"),
                    "title": data.get("title"),
                    "until": data.get("repeat") == "Never" ? undefined : data.get("untilDate")
                };
            }
            return {
                "due": data.get("dueDate"),
                "note": data.get("note"),
                "repeat": data.get("repeat"),
                "assigned": data.get("assignedDate"),
                "title": data.get("title")
            };
        }

        var createEmails = function(type, orgId, groupId, datas, customListId, customListName, recipients) {
            var deferred = $.Deferred();
            console.log('Start createEmails for <' + type + '> at: ' + new Date());
            var content;

            var emails = [];
            $.each(Object.keys(datas), function(i, item) {
                var Email = Parse.Object.extend('Email');
                var email = new Email();
                email.set("data", getContent(datas[item], type));
                email.set("organizationId", orgId);
                email.set("groupId", groupId);
                email.set("recipientAddress", recipients);
                email.set("type", type);
                email.set("customListId", customListId);
                email.set("customListName", customListName);
                emails.push(email);
            });


            Parse.Object.saveAll(emails, {
                success: function(d) {
                    console.log('End createEmails for <' + type + '> at: ' + new Date());
                    deferred.resolve();
                },
                error: function(err) {
                    _alert('Internal Error: Error while saving emails:' + err);
                    deferred.reject();
                }
            });

            return deferred;
        }

        var processingHashEmails = hashEmails;
        hashEmails = {}; // Reset this global variable to be ready for next use;

        var keys = Object.keys(processingHashEmails);
        var emailList = [];
        $.each(keys, function(i, key) {
            var dataObj = processingHashEmails[key];
            var parentIds = Object.keys(dataObj.parentId);
            var query = new Parse.Query(Parse.User);
            query.containedIn('objectId', parentIds);
            query.find({
                success: function(results) {
                    console.log('Loaded all users to send mail at: ' + new Date());
                    $.each(results, function(index, result) {
                        if (result.get('isEmailDelivery')) {
                            emailList.push(result.get('email'));
                        }
                    });
                },
                error: function(error) {
                    console.log(error);
                    deferred.reject();
                }
            }).then(function() {
                var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });

                var query = UserAcctAccess.query();
                query.containedIn('parentId', parentIds);
                query.find({
                    success: function(results) {
                        $.each(results, function(index, result) {
                            var email = result.get('givenAccessUserEmail');
                            if (email && emailList.indexOf(email) === -1) {
                                emailList.push(email);
                            }
                        });
                    },
                    error: function(error) {
                        console.log(error);
                        deferred.reject();
                    }
                }).then(function() {
                    _updateInfoCustomListToEmail(dataObj.groupId).then(function(d) {
                        if (d != undefined) {
                            createEmails(dataObj.type, dataObj.orgId, dataObj.groupId, dataObj.dataId, d[0].customListId, d[0].customListName, emailList);
                        }
                    }); // get information user custom list
                });
            });
        });
        deferred.resolve();
        return deferred;
    };

    var createRelation = function(allStudentData, groupId, groupName) {
        var totalRequest = 0;
        var totalResponse = 0;

        for (var i = 0; i < allStudentData.length; i++) {
            totalRequest++;
            var student = allStudentData[i];
            var studentId = student.id;
            var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation");
            var relation = new UserOrganizationGroupRelation();
            relation.set("organizationGroupId", groupId);
            relation.set("userId", studentId);
            relation.set("relationType", "student");
            relation.set("position", "Student");
            relation.set("groupName", groupName);
            relation.set("calendarAutoSync", false);
            relation.set("alert", true);
            relation.set("showParentFirstName", true);
            relation.set("showParentLastName", true);
            relation.set("showChildFirstName", true);
            relation.set("showChildLastName", true);
            relation.set("showEmail", true);
            relation.set("showHomePhone", true);
            relation.set("showMobilePhone", true);
            relation.set("showWorkPhone", true);
            relation.set("showAddress", true);
            relation.set("firstName", student.get("firstName"));
            relation.set("lastName", student.get("lastName"));
            relation.save(null, {
                success: function(relation) {
                    // Execute any logic that should take place after the object is saved.
                    //alert('New object created with objectId: ' + relation.id);
                    totalResponse++;
                    if (totalRequest == totalResponse) {
                        redirect();
                    }
                },
                error: function(relation, error) {
                        // Execute any logic that should take place if the save fails.
                        // error is a Parse.Error with an error code and message.
                        console.log('Failed to create new object, with error code: ' + error.message);
                        totalResponse++;
                        if (totalRequest == totalResponse) {
                            redirect();
                        } //eo if totalRequest
                    } //eo error
            }); //eo relation.save
        } //eo allStudentData.length
    }; //eo createRelation

    var getParent = function(allStudentData, orgId, groupId) {
        var deferred = $.Deferred();
        var parentObjectArray = {};

        var studentIds = [];
        var parentIdArray = [];

        allStudentData.forEach(function(student) {
            studentIds.push(student.id);
        })

        var UserParentRelation = Parse.Object.extend("UserParentRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserParentRelation.query();
        query.containedIn("childId", studentIds);
        query.find({
            success: function(results) {
                for (var j = 0; j < results.length; j++) {
                    var parent = results[j];
                    parentId = parent.get("parentId");
                    var childId = parent.get("childId");
                    if (parentIdArray.indexOf(parentId) < 0) {
                        parentIdArray.push(parentId);
                        parentObjectArray[parentId] = {
                            parent: parentId,
                            children: [childId]
                        };
                    } else {
                        parentObjectArray[parentId].children.push(childId);
                    }
                }
            },
            error: function(error) {
                console.log(error);
                deferred.reject()
            }
        }).then(function() {
            _addParentEmail(parentIdArray, groupId);
            addToCustomList(parentObjectArray, parentIdArray, orgId, groupId).then(function() { deferred.resolve() });
        });

        return deferred;
    }; //eo getParent

    var addToCustomList = function(parentObjectArray, parentIdArray, orgId, groupId) {
        var deferred = $.Deferred();
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserCustomList.query();
        query.equalTo("groupId", groupId);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var customGroup = results[i];
                    var recipientList = customGroup.get("recipientList");
                    for (var j = 0; j < parentIdArray.length; j++) {
                        parentId = parentIdArray[j];
                        var recipient = jQuery.grep(recipientList, function(n) {
                            return n.parent == parentId;
                        });
                        if (recipient.length == 0) {
                            recipientList.push(parentObjectArray[parentId]);
                        } else {
                            for (var m = 0; m < parentObjectArray[parentId].children.length; m++) {
                                var childId = parentObjectArray[parentId].children[m];
                                if (recipient[0].children.indexOf(childId) == -1) {
                                    recipient[0].children.push(childId);
                                }
                            }
                        }
                    } //eo parentIdArray for loop
                } //eo results for loop

                Parse.Object.saveAll(results);
            },
            error: function(error) {
                console.log(error);
                deferred.reject();
            }
        }).then(function() {
            var internalDeferreds = [
                addOldEvents(orgId, groupId, parentIdArray, parentObjectArray),
                addOldHomework(orgId, groupId, parentIdArray, parentObjectArray)
            ];

            $.when.apply(this, internalDeferreds).then(buildEmails).done(function() {
                deferred.resolve();
            });
        });

        return deferred;
    }; //eo addToCustomList

    var addOldEvents = function(orgId, groupId, parentIdArray, parentObjectArray) {
        var deferred = $.Deferred();
        var Today = new Date();
        var Event = Parse.Object.extend("Event", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var queryRootRepeatingEvents = Event.query();
        queryRootRepeatingEvents.equalTo("orgIdForThisObject", groupId);
        queryRootRepeatingEvents.greaterThan("untilDate", new Date());
        queryRootRepeatingEvents.endsWith("repeatId", "-0");

        var querySingleEvents = Event.query();
        querySingleEvents.equalTo("orgIdForThisObject", groupId); //orgIdForThisObject is now groupId
        querySingleEvents.greaterThanOrEqualTo("endDateTime", Today); //no events from the past
        querySingleEvents.containedIn("repeatId", ["", null]);

        var queryRepeatedEventInstance = Event.query();
        queryRepeatedEventInstance.equalTo("orgIdForThisObject", groupId);
        queryRepeatedEventInstance.notContainedIn("repeatId", ["", null]);
        queryRepeatedEventInstance.equalTo("isModifySingleEvent", true);
        queryRepeatedEventInstance.greaterThan("endDateTime", new Date());

        var mainQuery = Parse.Query.or(queryRootRepeatingEvents, querySingleEvents, queryRepeatedEventInstance);

        mainQuery.limit(500);
        mainQuery.find({
            success: function(results) {
                function appendToEmailHash() {
                    $.each(results, function(i, event) {
                        for (var m = 0; m < parentIdArray.length; m++) {
                            var parentId = parentIdArray[m];
                            var key = groupId + '_event';

                            if (hashEmails[key]) {
                                if (!hashEmails[key][event.id]) {
                                    hashEmails[key].dataId[event.id] = event;
                                }
                                hashEmails[key].parentId[parentId] = parentId;
                            } else {
                                hashEmails[key] = {
                                    dataId: {},
                                    parentId: {},
                                    type: 'event',
                                    orgId: orgId,
                                    groupId: groupId
                                };
                                hashEmails[key].dataId[event.id] = event;
                                hashEmails[key].parentId[parentId] = parentId;
                            }
                        }
                    });
                }

                function addUserEventRelations(parentIdArray, parentObjectDict, events, orgId, groupId) {
                    var addEventRelationDeferred = $.Deferred();

                    function buildEventIdToEventDictionary() {
                        var dict = {};
                        events.forEach(function(event) {
                            dict[event.id] = event;
                        });

                        return dict;
                    }

                    var eventDict = buildEventIdToEventDictionary();

                    var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserEventRelation.query();
                    query.containedIn("parentId", parentIdArray);
                    query.containedIn("eventId", Object.keys(eventDict));
                    query.find({
                        success: function(results) {
                            function buildDictKey(parentId, eventId) {
                                return parentId + '_' + eventId;
                            }

                            function buildParentIdToRelationsDictionary() {
                                var dict = {};
                                results.forEach(function(relation) {
                                    dict[buildDictKey(relation.get("parentId"), relation.get("eventId"))] = relation;
                                });

                                return dict;
                            }

                            function createUserEventRelation(parentId, childIdList, eventId, groupType, orgId, groupId) {
                                var UserEventRelation = Parse.Object.extend("UserEventRelation");
                                var relation = new UserEventRelation();
                                relation.set("childIdList", childIdList);
                                relation.set("eventId", eventId);
                                relation.set("groupType", groupType);
                                relation.set("isRead", false);
                                relation.set("isUpdated", false);
                                relation.set("parentId", parentId);
                                relation.set("organizationId", orgId);
                                relation.set("groupId", groupId);
                                return relation;
                            };

                            function createChunks(arr, chunkSize) {
                                var groups = [];
                                for (var i = 0; i < arr.length; i += chunkSize) {
                                    groups.push(arr.slice(i, i + chunkSize));
                                }
                                return groups;
                            }

                            var saveDeferred = $.Deferred();
                            saveDeferred.resolve();
                            var existingRelationDict = buildParentIdToRelationsDictionary(results);
                            var allChunks = [];
                            parentIdArray.forEach(function(parentId) {
                                var childIdList = parentObjectDict[parentId].children;
                                var allEventRelations = [];

                                events.forEach(function(event) {
                                    var eventRelation = existingRelationDict[buildDictKey(parentId, event.id)];
                                    if (eventRelation) {
                                        for (var i = 0; i < childIdList.length; i++) {
                                            var childId = childIdList[i];
                                            eventRelation.addUnique("childIdList", childId);
                                        }
                                        eventRelation.set("organizationId", orgId);
                                        if (!eventRelation.get('groupId')) {
                                            eventRelation.set("groupId", groupId);
                                        }
                                        allEventRelations.push(eventRelation);
                                    } else {
                                        allEventRelations.push(createUserEventRelation(parentId, childIdList, event.id, event.get('groupType'), orgId, groupId));
                                    }
                                });

                                function saveChunk() {
                                    var deferred = $.Deferred();
                                    var chunk = allChunks[0];
                                    console.log('In saveUserEventRelation for chunk ' + chunk[0].id + ' at: ' + new Date());
                                    Parse.Object.saveAll(chunk, {
                                        success: function(d) {
                                            allChunks.splice(0, 1);
                                            console.log('End saveUserEventRelation for chunk ' + chunk[0].id + ' at: ' + new Date() + '### remaining chunks ' + allChunks.length);

                                            if (allChunks.length == 0) {
                                                addEventRelationDeferred.resolve();
                                            }
                                            deferred.resolve();
                                        },
                                        error: function(err) {
                                            _alert('Internal Error: Error while saving event relations:' + err);
                                        }
                                    });

                                    return deferred;
                                }

                                console.log('Start saveUserEventRelation for user ' + parentId + ' at: ' + new Date());
                                createChunks(allEventRelations, 20).forEach(function(chunk) {
                                    allChunks.push(chunk);
                                    saveDeferred = saveDeferred.then(saveChunk);
                                });
                            });
                        },
                        error: function(error) {
                            _alert('Error: ' + JSON.stringify(error));
                        }
                    }); //eo query.find

                    return addEventRelationDeferred;
                }; //eo addUserEventRelation					

                if (results.length > 0) {
                    appendToEmailHash();
                    addUserEventRelations(parentIdArray, parentObjectArray, results, orgId, groupId)
                        .then(function() {
                            deferred.resolve();
                        });
                } else {
                    deferred.resolve();
                }
            },
            error: function(error) {
                alert('Error: ' + JSON.stringify(error));
                deferred.reject();
            }
        });

        return deferred;
    }; //eo addOldEvents

    var addOldHomework = function(orgId, groupId, parentIdArray, parentObjectDict) {
        var deferred = $.Deferred();
        var Today = new Date();
        var Homework = Parse.Object.extend("Homework", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = Homework.query();
        query.equalTo("orgIdForThisObject", groupId); //orgIdForThisObject is now groupId
        query.greaterThanOrEqualTo("dueDate", Today); //no homeworks from the past
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    for (var m = 0; m < parentIdArray.length; m++) {
                        var parentId = parentIdArray[m];
                        var childIdList = parentObjectDict[parentId].children;

                        var homework = results[i];
                        var homeworkId = homework.id;
                        var groupType = homework.get("groupType");
                        isUserHomeworkRelationExist(parentId, childIdList, homeworkId, groupType);

                        var key = groupId + '_homework';

                        if (hashEmails[key]) {
                            if (!hashEmails[key][homework.id]) {
                                hashEmails[key].dataId[homework.id] = homework;
                            }
                            hashEmails[key].parentId[parentId] = parentId;
                        } else {
                            hashEmails[key] = {
                                dataId: {},
                                parentId: {},
                                type: 'homework',
                                orgId: orgId,
                                groupId: groupId
                            };
                            hashEmails[key].dataId[homework.id] = homework;
                            hashEmails[key].parentId[parentId] = parentId;
                        }
                    }
                }

                deferred.resolve();
            },
            error: function(error) {
                console.log('Error: ' + JSON.stringify(error));
                deferred.reject();
            }
        });
        var createUserHomeworkRelation = function(parentId, childIdList, homeworkId, groupType) {
            var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation");
            var relation = new UserHomeworkRelation();
            relation.set("childIdList", childIdList);
            relation.set("homeworkId", homeworkId);
            relation.set("groupType", groupType);
            relation.set("isRead", false);
            relation.set("isUpdated", false);
            relation.set("parentId", parentId);
            relation.save();
        }; //eo createUserHomeworkRelation
        var isUserHomeworkRelationExist = function(parentId, childIdList, homeworkId, groupType) {
            var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserHomeworkRelation.query();
            query.equalTo("parentId", parentId);
            query.equalTo("homeworkId", homeworkId);
            query.find({
                success: function(results) {
                    if (results.length > 0) {
                        var homeworkRelation = results[0];
                        for (var i = 0; i < childIdList.length; i++) {
                            var childId = childIdList[i];
                            homeworkRelation.addUnique("childIdList", childId);
                        }
                        homeworkRelation.save();
                    } else {
                        createUserHomeworkRelation(parentId, childIdList, homeworkId, groupType);
                    }
                },
                error: function(error) {
                    console.log('Error: ' + JSON.stringify(error));
                }
            }); //eo query.find
        }; //eo isUserHomeworkRelationExist

        return deferred;
    }; //eo addOldHomework

    var addToOrgGroup = function(allStudentData, groupId) {
        var deferred = $.Deferred();
        /*
        Change code by phuongnh@vinasource.com
        We only find OrganizationGroup if exists then addToOrgGroup
        */
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = OrganizationGroup.query();
        query.equalTo("objectId", groupId);
        query.find({
            success: function(results) {
                if (results.length == 0) {
                    _alert("There was an error finding group");
                    deferred.reject();
                } else {
                    var orgGroup = results[0];
                    console.log('results = ' + results.length);
                    console.log('allStudentData = ' + allStudentData.length);
                    for (var i = 0; i < allStudentData.length; i++) {
                        var studentId = allStudentData[i].id;
                        console.log('studentId:' + studentId);
                        orgGroup.addUnique("studentIdList", studentId);
                        orgGroup.save();

                    }
                }
                deferred.resolve();
            },
            error: function(error) {
                console.log(error);
                _alert("There was an error connecting to the server, please try again");
            }
        });

        return deferred;
    }; //eo addToOrgGroup

    var loadExistingGroupRelations = function(allStudentIdArray, groupId) {
        var deferred = $.Deferred();
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserOrganizationGroupRelation.query();
        query.containedIn("userId", allStudentIdArray);
        query.equalTo("organizationGroupId", groupId);
        query.find({
            success: function(results) {
                results.forEach(function(relation) {
                    allStudentIdArray.splice(allStudentIdArray.indexOf(relation.get('userId')), 1);
                });

                deferred.resolve(allStudentIdArray);
            },
            error: function(err) {
                deferred.reject(err);
            }
        });

        return deferred;
    }

    var addStudentsToGroup = function(allStudentIdArray, orgId, groupId, groupName, redirectFunc) {
        var deferred = $.Deferred();

        if (allStudentIdArray.length == 0) {
            deferred.resolve();
            redirect();
        } else {
            //Get student name, we need this data (its easy to do it right here)
            var Child = Parse.Object.extend("Child", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });

            var query = Child.query();
            query.containedIn("objectId", allStudentIdArray);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        redirect();
                    } else {
                        getParent(results, orgId, groupId)
                            .then(function() { return addToOrgGroup(results, groupId); })
                            .then(function() { createRelation(results, groupId, groupName); })
                            .always(function() { deferred.resolve(); });
                    }
                },
                error: function(error) {
                    _alert("Error, there was a problem connecting to server");
                    redirect();
                }
            }); //eo query.find    
        }
        return deferred;
    }

    var Parse = _parse;
    var redirect = redirectFunc;
    var hashEmails = {};

    return loadExistingGroupRelations(allStudentIdArray, groupId)
        .then(function(studentIdsToAdd) {
            return addStudentsToGroup(studentIdsToAdd, orgId, groupId, groupName);
        });
}

BaseAddStudentToGroupHandler.prototype.addStudentToOrg = function(childId, firstName, lastName, orgId, orgType) {
    var isOrgRelationExist = function(childId, firstName, lastName, orgId, orgType) {
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserOrganizationRelation.query();
        var deferred = $.Deferred();

        function success(results) {
            if (results.length === 0) {
                addStudentsToOrg(childId, firstName, lastName, orgId, orgType)
                    .always(function() {
                        deferred.resolve(childId);
                    });
            } else {
                deferred.resolve(childId);
            }
        }; //eo success
        function error(err) {
            console.log('Error isOrgRelationExist:' + err.code + ' ' + err.message);
            deferred.reject();
        };
        query.equalTo("organizationId", orgId);
        query.equalTo("userId", childId);
        query.find({ success: success, error: error });
        return deferred;
    }; //eo isOrgRelationExist

    var addStudentsToOrg = function(childId, firstName, lastName, orgId, orgType) {
        //Create relation
        var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
        var relation = new UserOrganizationRelation();
        var deferred = $.Deferred();

        function success() {
            // Execute any logic that should take place after the object is saved.
            //alert('New object created with objectId: ' + relation.id);
            console.log('createOrgRelation: Added to organization');
            deferred.resolve();
        };

        function error(relation, err) {
            // Execute any logic that should take place if the save fails.
            // error is a Parse.Error with an error code and message.
            //alert('Failed to add child to organization: ' + error.message);
            console.log('Error: createOrgRelation' + err.code + ' ' + err.message);
            deferred.resolve();
        };
        relation.set("organizationId", orgId);
        relation.set("userId", childId);
        relation.set("organizationType", orgType);
        relation.set("permission", "student");
        relation.set("position", "Student");
        relation.set("relation", "student")
        relation.set("calendarAutoSync", false);
        relation.set("alert", true);
        relation.set("showParentFirstName", true);
        relation.set("showParentLastName", true);
        relation.set("showChildFirstName", true);
        relation.set("showChildLastName", true);
        relation.set("showEmail", true);
        relation.set("showHomePhone", true);
        relation.set("showMobilePhone", true);
        relation.set("showWorkPhone", true);
        relation.set("showAddress", true);
        relation.set("firstName", firstName);
        relation.set("lastName", lastName);
        relation.save(null, { success: success, error: error });
        return deferred;
    }; //eo createOrgRelation

    var Parse = _parse;
    return isOrgRelationExist(childId, firstName, lastName, orgId, orgType);
}