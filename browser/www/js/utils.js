var _setSignOut = function(Chaplin) {
    var isMobile = $("body").data("isMobile"); //attach data to body for easier flagging later
    var isBrowser = $("body").data("isBrowser");
    var now = new Date();
    var user = _getUserData(); //get user from local storage
    var Parse = _parse;

    function signout(e) {
        var username = user ? user.username : '';
        var password = ''; //fix security
        now = new Date();
        console.log('auto signout activated @ ' + now.toString());
        _signOutTimeoutID = null; //one time
        Parse.User.logOut();
        user = user.isRemember ? {
            username: username,
            password: password,
            isRemember: true
        } : {}; //kill the user object
        _setUserData(user);
        _setSignedIn(false);
        setTimeout(function() {
            Chaplin.utils.redirectTo({
                name: 'signin'
            });
        }, DEFAULT_ANIMATION_DELAY);
    };
    /*
    if(_signOutTimeoutID) {
        window.clearTimeout(_signOutTimeoutID);
        _signOutTimeoutID = null;
    }
    */
    //console.log('ready to setSignOut timer');
    //console.log('auto signout scheduled @ ' + now.toString());
    _signOutTimeoutID ? clearTimeout(_signOutTimeoutID) : $.noop();
    _signOutTimeoutID = isBrowser && !isMobile ? window.setTimeout(signout, _120minutes) : null;
}; //setSignOut

var _checkSignedIn = function(Chaplin) {
    var flag = _getSignedIn();
    var ignore = ['user-signup', 'signup-enter-kid-info-view', 'user-signin'];

    function cancelSignIn() {
        _setSignOut(Chaplin);
    };
    //console.log(_currentViewId());

    if ($.inArray(_currentViewId(), ignore) < 0) { //if a view is in the array then skip check of whether user is signed in; i.e. creating a new account
        flag ? cancelSignIn() : Chaplin.utils.redirectTo({
            name: 'signin'
        });
    }
};

var _createUserFamilyGroup = function() {
    var Parse = _parse;
    var deferred = $.Deferred();
    var user = _getUserData();
    var createOrgName = function() {
        var name = user.lastName ? user.lastName : user.username;
        name = user.firstName && user.lastName ? user.firstName + ' ' + name : name;
        groupName = name + ' Family Group';
        name = groupName;
        return name;
    };
    var name = createOrgName();
    var type = 'family group'; //Can be null;
    var desc = name + ' for self entered data'; //Can be null; //Can be null
    var groupId = null; //returned after createGroup succeeds
    var checkForFamilyGroup = function() {
        var deferred = $.Deferred();
        user.familyGroup ? deferred.reject() : deferred.resolve();
        return deferred;
    }; //eo checkForFamilyGroup
    var createGroup = function() {
        var deferred = $.Deferred();
        var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var group = new UserCustomGroup();
        var success = function(group) {
            var User = Parse.Object.extend("User", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = User.query();
            //*****************
            groupId = group.id; //set in outer scope so we do not lose it somewhere, do this first!
            //*****************
            user.setting = user.setting ? user.setting : {};
            user.familyGroup = groupId;
            user.setting.selectedMyGroupId = groupId;
            user.setting.selectedMyGroupData = group;
            localStorage.setItem("user", JSON.stringify(user));
            query.get(user.id, {
                success: function(_user) { //create only one family group
                    _user.set("familyGroup", user.familyGroup);
                    _user.save();
                    deferred.resolve();
                },
                error: function(_user, error) {
                    deferred.reject();
                }
            });
            //createCustomList(groupId, name, type);
        };
        var error = function(group, error) {
            console.log("Error, could not create a new family group:" + error.message);
            deferred.reject();
        };
        group.set("userId", user.id);
        group.set("name", name);
        group.set("type", type);
        group.set("description", desc);
        group.set("nonUserContactEmail", []);
        group.set("userContactId", []);
        group.set("userContactEmail", []);
        group.set("studentIdList", []); //add a studentIdList array
        group.save(null, {
            success: success,
            error: error
        });
        return deferred;
    }; //eo createGroup
    var createCustomList = function() {
        var deferred = $.Deferred();
        var UserCustomList = Parse.Object.extend("UserCustomList");
        var customList = new UserCustomList();
        var success = function(customList) {
            deferred.resolve();
            //createOrgGroup(groupId, name, type, desc); //groupId from pervious save
        };
        var error = function(customList, error) {
            console.log("Error, could not create a new family group custom list:" + error.message);
            deferred.reject();
        };
        customList.set("groupId", groupId); //saved groupId, use parameter to be consistent with setting-mygroups-add-view.js
        customList.set("groupType", type);
        customList.set("name", name);
        customList.set("nonUserContactEmail", []);
        customList.set("organizationId", _familyCustomGroupOrgGenericId); //generic id in vars.js
        customList.set("ownerId", user.id);
        customList.set("recipientList", []);
        customList.set("type", "FamilyGroup");
        customList.set("userContactEmail", []);
        customList.set("userContactId", []);
        customList.set("studentIdList", []);
        customList.save(null, {
            success: success,
            error: error
        });
        return deferred;
    }; //eo createCustomList
    var createOrgGroup = function() { //add to OrganizationGroup table so that My Groups have all functionality of Org Groups with less queries
        var deferred = $.Deferred();
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup");
        var orgGroup = new OrganizationGroup();
        var success = function(orgGroup) {
            var adminJson = orgGroup.get("adminJsonList");
            adminJson[user.id] = "Creator";
            orgGroup.addUnique("adminIdList", user.id);
            orgGroup.save();
            deferred.resolve();
        };
        var error = function(group, error) {
            console.log("Error, could not create a new family orgGroup:" + error.message);
            deferred.resolve();
        };
        orgGroup.set("adminIdList", []);
        orgGroup.set("adminJsonList", {});
        orgGroup.set("description", desc);
        orgGroup.set("groupType", type);
        orgGroup.set("label", type);
        orgGroup.set("name", name);
        orgGroup.set("organizationId", groupId); //object/group id of UserCustomGroup, not an org id
        orgGroup.set("studentIdList", []);
        orgGroup.set("subGroupOf", "");
        orgGroup.set("isMyGroup", true);
        orgGroup.save(null, {
            success: success,
            error: error
        });
        return deferred;
    }; //eo createOrgGroup
    //promise chain to handle creation of family group, start with creating a family organization (and relation)
    //followed by group creation and ancillary customList, orgGroup
    checkForFamilyGroup() //if exists reject promise which goes to the end of the chain
        .then(createGroup)
        .then(createCustomList)
        .then(createOrgGroup)
        .then(function() {
            console.log('family group created!');
        }); //eo promise chain
}; //eo _createUserFamilyGroup

var _createUserFamilyOrganization = function() {
    var user = _getUserData();
    var children = _getUserChildren();
    var org = null;
    var relation = null;
    var group = null;
    var groupName = 'Family Group';
    var customList = null;
    var orgGroup = null;
    var Parse = _parse;
    var checkForFamilyGroup = function() {
        var deferred = $.Deferred();
        user.familyGroup ? deferred.reject() : deferred.resolve();
        return deferred;
    }; //eo checkForFamilyGroup
    var createOrg = function() {
        var deferred = $.Deferred();
        var createOrgName = function() {
            var name = user.lastName ? user.lastName : user.username;
            name = user.firstName && user.lastName ? user.firstName + ' ' + name : name;
            groupName = name + ' Family Group';
            name = groupName + ' Organization';
            return name;
        };
        var name = createOrgName();
        var addressLine1 = user.addressLine1 ? user.addressLine1 : '';
        var addressLine2 = user.addressLine2 ? user.addressLine2 : ''; //Can be null
        var city = user.city ? user.city : ''; //Can be null
        var state = user.state ? user.state : ''; //Can be null
        var zip = user.zip ? user.zip : ''; //Can be null;
        var phone = user.mobilePhone ? user.mobilePhone : ''; //Can be null;
        var fax = user.homePhone ? user.homePhone : '';
        var type = 'family group organization'; //Can be null;
        var desc = name + ' for self entered data'; //Can be null; //Can be null
        //Create organization group
        var Organization = Parse.Object.extend("Organization");
        org = new Organization();
        org.set("name", name);
        org.set("adminIdList", [user.id]);
        org.set("addressLine1", addressLine1);
        org.set("addressLine2", addressLine2);
        org.set("city", city);
        org.set("state", state);
        org.set("zip", zip);
        org.set("country", "USA");
        org.set("label", type);
        org.set("type", type);
        org.set("phone", phone);
        org.set("fax", fax);
        org.set("description", desc);
        org.save(null, {
            success: function(o) {
                org = o;
                deferred.resolve();
            },
            error: function(org, error) {
                    _alert("Error: could not create family organization!");
                    deferred.reject();
                } //eo error
        }); //eo group.save
        return deferred;
    }; //eo createOrg
    var createOrgRelation = function() {
        var deferred = $.Deferred();
        var UserOrganizationRelation;
        var type = org.get('type');
        // Execute any logic that should take place after the object is saved.
        //alert('New object created with objectId: ' + relation.id);
        user.setting = user.setting ? user.setting : {};
        user.setting.selectedOrgId = org.id;
        user.setting.selectedOrgData = org;
        localStorage.setItem("user", JSON.stringify(user));
        UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
        relation = new UserOrganizationRelation();
        relation.set("alert", true);
        relation.set("calendarAutoSync", false);
        relation.set("firstName", user.firstName);
        relation.set("lastName", user.lastName);
        relation.set("organizationId", org.id);
        relation.set("organizationType", type);
        relation.set("permission", "admin");
        relation.set("position", "Parent");
        relation.set("relation", "owner");
        relation.set("showAddress", true);
        relation.set("showEmail", true);
        relation.set("showHomePhone", true);
        relation.set("showMobilePhone", true);
        relation.set("showWorkPhone", true);
        relation.set("userId", user.id);
        relation.save(null, {
            success: function(o) {
                relation = o;
                deferred.resolve();
            },
            error: function(rel, error) {
                    _alert("Error: could not create family organization relation!");
                    deferred.reject();
                } //eo error
        }); //eo group.save
        return deferred;
    }; //eo createOrgRelation
    var createGroup = function() {
        var deferred = $.Deferred();
        var name = groupName;
        var type = 'family group'; //Group Type
        var desc = groupName; //Can be null
        var UserCustomGroup = Parse.Object.extend("UserCustomGroup");
        group = new UserCustomGroup();
        group.set("userId", user.id);
        group.set("name", name);
        group.set("type", type);
        group.set("description", desc);
        group.set("nonUserContactEmail", []);
        group.set("userContactId", []);
        group.set("userContactEmail", []);
        group.set("studentIdList", []); //add a studentIdList array
        group.save(null, {
            success: function(o) {
                var User = Parse.Object.extend("User", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                var query = User.query();
                group = o;
                user.familyGroup = group.id;
                user.setting = user.setting ? user.setting : {};
                user.setting.selectedMyGroupId = group.id;
                user.setting.selectedMyGroupData = group;
                localStorage.setItem("user", JSON.stringify(user));
                query.get(user.id, {
                    success: function(_user) {
                        _user.set("familyGroup", user.familyGroup);
                        _user.save();
                        deferred.resolve();
                    },
                    error: function(_user, error) {
                        var err = error;
                        var usr = _user;
                        deferred.reject();
                    }
                });
                //deferred.resolve();
            },
            error: function(group, error) {
                    alert("Error, could not create a new group: " + groupName);
                    deferred.reject();
                } //eo error
        }); //eo group.save
        return deferred;
    }; //eo createGroup
    var createCustomList = function() {
        var deferred = $.Deferred();
        var UserCustomList = Parse.Object.extend("UserCustomList");
        customList = new UserCustomList();
        customList.set("groupId", group.id);
        customList.set("groupType", group.get('type'));
        customList.set("name", group.get('name'));
        customList.set("nonUserContactEmail", []);
        customList.set("organizationId", org.id);
        customList.set("ownerId", user.id);
        customList.set("recipientList", []);
        customList.set("type", "FamilyGroup");
        customList.set("userContactEmail", []);
        customList.set("userContactId", []);
        customList.set("studentIdList", []);
        customList.save();
        customList.save(null, {
            success: function(o) {
                customList = o;
                deferred.resolve();
            },
            error: function(rel, error) {
                    _alert("Error: could not create family group customList!");
                    deferred.reject();
                } //eo error
        }); //eo group.save
        return deferred;
    }; //eo createCustomList
    var createOrgGroup = function() { //add to OrganizationGroup table so that My Groups have all functionality of Org Groups with less queries
        var deferred = $.Deferred();
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup");
        var error = function() {
            alert("Error, could not create a new OrgGroup: " + groupName);
            deferred.reject();
        };
        orgGroup = new OrganizationGroup();
        orgGroup.set("adminIdList", []);
        orgGroup.set("adminJsonList", {});
        orgGroup.set("description", group.get('desc'));
        orgGroup.set("groupType", group.get('type'));
        orgGroup.set("label", group.get('type'));
        orgGroup.set("name", group.get('name'));
        orgGroup.set("organizationId", org.id); //id of UserCustomGroup
        orgGroup.set("studentIdList", []);
        orgGroup.set("subGroupOf", "");
        orgGroup.set("isMyGroup", true);
        orgGroup.save(null, {
            success: function(orgGroup) {
                var adminJson = orgGroup.get("adminJsonList");
                adminJson[user.id] = "Creator";
                orgGroup.addUnique("adminIdList", user.id);
                orgGroup.save(null, {
                    success: function(o) {
                        orgGroup = o;
                        deferred.resolve();
                    },
                    error: error
                });
            },
            error: error
        });
        return deferred;
    }; //eo createOrgGroup
    //promise chain to handle creation of family group, start with creating a family organization (and relation)
    //followed by group creation and ancillary customList, orgGroup
    checkForFamilyGroup() //if exists reject promise which goes to the end of the chain
        .then(createOrg)
        .then(createOrgRelation)
        .then(createGroup)
        .then(createCustomList)
        .then(createOrgGroup)
        .then(function() {
            console.log('org created!');
        }); //eo promise chain
}; //eo _createUserFamilyOrganization

var _setHomeworkLocalNotification = function(_homework, isSecondReminder) {
    var minutes = -1;
    var date, message = '';
    var dueDateTime = _homework.get('dueDate');
    var when = moment(new Date(dueDateTime)).format('dddd MM/DD/YY h:mma');
    var cancel = false;
    //flag is always going to be false since homework only has a single reminder; but keep code consistent with that for events
    var which = isSecondReminder ? _homework.get('reminder2') : _homework.get('reminder');
    var title = _homework.get('title');
    var objectId = _homework.id;
    var id = isSecondReminder ? objectId + '_r2' : objectId; //remember about the calendar view setting, has to be the same as there
    id = _hashCode(id); //new notifications api uses numbers//.toString();//new notifications api uses numbers
    var o = null;
    var json = null;
    var success = function(status) {
        var id = o.id;
        var _o = {
            id: id,
            objectId: objectId,
            minutes: minutes,
            startDate: dueDateTime,
            date: date,
            message: message
        };
        _setUserRemindersItem(id, _o);
        //console.log(status + ", things are going well");
    }; //eo success
    var failure = function(status) {
        // _alert(status);
        console.log('setHomeworkLocalNotification error:', status);
    };
    var hasThisReminder = function() { //look up reminder, if it exists flag as true;
        var flag = true;
        var startDate, eventStartDate;
        var reminder = _getUserRemindersItem(id);

        function hasReminder() {
            startDate = reminder.startDate;
            eventStartDate = dueDateTime.toISOString();
            return moment(startDate).isSame(eventStartDate, 'minute');
        };
        flag = reminder ? hasReminder() : false;
        return flag;
    };
    var handleReminder = function() {
        json = JSON.stringify({
            objectId: objectId,
            minutes: minutes
        }); //data to add to the reminder
        //console.log('HandleReminder ',json);
        date = moment(new Date(dueDateTime)).startOf('d').add(16, 'h').subtract(minutes, 'minutes').toDate();

        message = title + ' due ' + when;
        o = {
            id: id,
            every: '0',
            at: date,
            title: 'ParentPlanet Reminder',
            text: message,
            data: json
        };
        cancel = minutes < 0;
        $.when(_setUserLocalNotification(o, cancel)).then(success, failure); //use a promise to handle
    }; //eo handleReminder
    //switch on the string being passed in and get the number of minutes from it
    switch (which) {
        case 'Never':
            minutes = -1;
            break;
        case 'At Time of Event':
            minutes = 1;
            break;
        case '5 Minutes Before':
            minutes = 5;
            break;
        case '10 Minutes Before':
            minutes = 10;
            break;
        case '15 Minutes Before':
            minutes = 15;
            break;
        case '30 Minutes Before':
            minutes = 30;
            break;
        case '1 Hour Before':
            minutes = 60;
            break;
        case '2 Hours Before':
            minutes = 120;
            break;
        case '4 Hours Before':
            minutes = 60 * 4;
            break;
        case '1 Day Before':
            minutes = 60 * 24;
            break;
        case '2 Days Before':
            minutes = 60 * 24 * 2;
            break;
        case '1 Week Before':
            minutes = 60 * 24 * 7;
            break;
        default:
            minutes = -1;
            break;
    } //eo switch over which repeat period selected
    minutes < 0 ? $.noop() : handleReminder();
}; //eo _setHomeWorkLocalNotification

var _setEventLocalNotification = function(event) {
    var internalProcess = function(isSecondReminder, _event) {

        var minutes = -1;
        var date, message = '';
        var startDateTime = _event.get('startDateTime');
        var when = moment(new Date(startDateTime)).format('dddd MM/DD/YY h:mma');
        var cancel = false;
        var which = isSecondReminder ? _event.get('reminder2') : _event.get('reminder');
        var title = _event.get('title');
        var location = _event.get('location');
        var objectId = _event.id;
        var id = isSecondReminder ? objectId + '_r2' : objectId; //remember about the calendar view setting, has to be the same as there
        id = _hashCode(id); //new notifications api uses numbers//.toString();//new notifications api uses numbers
        var o = null;
        var json = null;
        var success = function(status) {
            var id = o.id;
            var _o = {
                id: id,
                objectId: objectId,
                minutes: minutes,
                startDate: startDateTime,
                date: date,
                message: message
            }

            _setUserRemindersItem(id, _o);
            //console.log(status + ", things are going well");
        }; //eo success
        var failure = function(status) {
            console.log('setEventLocalNotification error:', status);
        };

        var handleReminder = function() {
            json = JSON.stringify({
                objectId: objectId,
                minutes: minutes
            }); //data to add to the reminder

            date = moment(new Date(startDateTime)).subtract(minutes, 'minutes').toDate();
            message = title + ' on ' + when;
            message = location && location.length > 0 ? message + ' @ ' + location : message;
            o = {
                id: id,
                every: '0',
                at: date,
                title: 'ParentPlanet Reminder',
                text: message,
                data: json
            };
            cancel = minutes < 0;
            $.when(_setUserLocalNotification(o, cancel)).then(success, failure); //use a promise to handle
        }; //eo handleReminder
        //switch on the string being passed in and get the number of minutes from it
        switch (which) {
            case 'Never':
                minutes = -1;
                break;
            case 'At Time of Event':
                minutes = 1;
                break;
            case '5 Minutes Before':
                minutes = 5;
                break;
            case '10 Minutes Before':
                minutes = 10;
                break;
            case '15 Minutes Before':
                minutes = 15;
                break;
            case '30 Minutes Before':
                minutes = 30;
                break;
            case '1 Hour Before':
                minutes = 60;
                break;
            case '2 Hours Before':
                minutes = 120;
                break;
            case '4 Hours Before':
                minutes = 60 * 4;
                break;
            case '1 Day Before':
                minutes = 60 * 24;
                break;
            case '2 Days Before':
                minutes = 60 * 24 * 2;
                break;
            case '1 Week Before':
                minutes = 60 * 24 * 7;
                break;
            default:
                minutes = -1;
                break;
        } //eo switch over which repeat period selected
        handleReminder();
    }

    event.get('reminder') ? internalProcess(false, event) : $.noop();
    event.get('reminder2') ? internalProcess(true, event) : $.noop();
}; //eo _setEventLocalNotification

var _setUserLocalNotification = function(d, cancel) { //d:data obj, start:date
    var isMobile = _isMobile(); //are we on the mobile platform
    var deferred = new jQuery.Deferred();

    function setlocalNotification(d) { //handler for sending localnotification with check for cancellation
        if (cancel) { //check to see if we want to cancel the event
            window.plugin.notification.local.isScheduled(d.id, function(isScheduled) {
                deferred.resolve();
                if (isScheduled) { //event exists in schedule, go ahead and actually cancel the event
                    window.plugin.notification.local.cancel(d.id, function() { //this cancels the event with given id, then callback to let the user know
                        console.log('Canceled reminder; for event start on: ' + d.date);
                    });
                } //eo isScheduled handler
            }); //eo is scheduled
        } else { //everything is set, send the local notification
            window.plugin.notification.local.schedule(d);
            deferred.resolve();
        } //eo if cancel
    }; //eo setlocalNotification
    if (!isMobile) {
        //   _alert('Local user notifications can only be set on the mobile app.');
        deferred.reject('Local user notifications can only be set on the mobile app.');
        return deferred.promise();
    }

    if (d.at && d.at <= new Date()) {
        deferred.reject("Won't handle notification in the past.");
        return deferred.promise();
    }

    window.plugin.notification.local.hasPermission(function(granted) { //check if we have permission to send
        if (granted) { //ok have permission to send a localnotification, now check what action to take: cancel or send
            setlocalNotification(d);
        } else { //no permission, ask once
            window.plugin.notification.local.registerPermission(function(granted) { //ok, have permission, now check
                if (granted) {
                    setlocalNotification(d);
                } else {
                    _alert('You can change settings later via the settings notification center.');
                    deferred.reject("No permission for local notifications");
                } //eo if granted for registerPermission
            }); //eo registerPermission
        } //eo granted permission to send
    }); //eo hasPermission
    return deferred.promise();
}; //eo _setUserLocalNotification

var _clearAllLocalNotifications = function() {
    window.plugin.notification.local.cancelAll(function() {
        console.log("Cancelled all notifications");
    });
}


var _syncEventLocalNotifications = function(events) {
    _clearAllLocalNotifications();

    var localItems = [];
    var bulidParams = function(events) {
        var params = [];

        var internalProcess = function(isSecondReminder, _event) {
            var minutes = -1;
            var message = '';
            var startDateTime = _event.get('startDateTime');
            var when = moment(new Date(startDateTime)).format('dddd MM/DD/YY h:mma');
            var cancel = false;
            var which = isSecondReminder ? _event.get('reminder2') : _event.get('reminder');
            var title = _event.get('title');
            var location = _event.get('location');
            var objectId = _event.id;
            var id = isSecondReminder ? objectId + '_r2' : objectId; //remember about the calendar view setting, has to be the same as there
            id = _hashCode(id); //new notifications api uses numbers//.toString();//new notifications api uses numbers
            var o = null;
            var json = null;

            var handleReminder = function() {
                var date = moment(new Date(startDateTime)).subtract(minutes, 'minutes').toDate();

                // Don't notify event in the past.
                if (date <= new Date()) {
                    return;
                }


                json = JSON.stringify({
                    objectId: objectId,
                    minutes: minutes
                }); //data to add to the reminder



                message = title + ' on ' + when;
                message = location && location.length > 0 ? message + ' @ ' + location : message;
                o = {
                    id: id,
                    every: '0',
                    at: date,
                    title: 'ParentPlanet Reminder',
                    text: message,
                    data: json
                };

                params.push(o);

                var _o = {
                    id: o.id,
                    objectId: objectId,
                    minutes: minutes,
                    startDate: startDateTime,
                    date: date,
                    message: message
                }

                localItems.push(_o);
            }; //eo handleReminder
            //switch on the string being passed in and get the number of minutes from it
            switch (which) {
                case 'Never':
                    minutes = -1;
                    break;
                case 'At Time of Event':
                    minutes = 1;
                    break;
                case '5 Minutes Before':
                    minutes = 5;
                    break;
                case '10 Minutes Before':
                    minutes = 10;
                    break;
                case '15 Minutes Before':
                    minutes = 15;
                    break;
                case '30 Minutes Before':
                    minutes = 30;
                    break;
                case '1 Hour Before':
                    minutes = 60;
                    break;
                case '2 Hours Before':
                    minutes = 120;
                    break;
                case '4 Hours Before':
                    minutes = 60 * 4;
                    break;
                case '1 Day Before':
                    minutes = 60 * 24;
                    break;
                case '2 Days Before':
                    minutes = 60 * 24 * 2;
                    break;
                case '1 Week Before':
                    minutes = 60 * 24 * 7;
                    break;
                default:
                    minutes = -1;
                    break;
            } //eo switch over which repeat period selected

            if (minutes >= 0) {
                handleReminder();
            }
        }

        events.forEach(function(event) {
            event.get('reminder') ? internalProcess(false, event) : $.noop();
            event.get('reminder2') ? internalProcess(true, event) : $.noop();
        });

        return params;
    }

    function schedule(notifParams) {
        window.plugin.notification.local.hasPermission(function(granted) { //check if we have permission to send
            if (granted) { //ok have permission to send a localnotification, now check what action to take: cancel or send
                window.plugin.notification.local.schedule(notifParams);
            } else { //no permission, ask once
                window.plugin.notification.local.registerPermission(function(granted) { //ok, have permission, now check
                    if (granted) {
                        window.plugin.notification.local.schedule(notifParams);
                    }
                }); //eo registerPermission
            } //eo granted permission to send
        }); //eo hasPermission
    }

    var eventsToRegister = events.filter(function(e) { return e.get('reminder') || e.get('reminder2'); })
    var notifParams = bulidParams(eventsToRegister);
    schedule(notifParams);
    _setUserReminders(localItems);

}; //eo _setEventLocalNotification

var _getParentEmailGivenAccessUserEmail = function(email) {
    var Parse = _parse;
    var deferred = $.Deferred();
    var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var query = UserAcctAccess.query();
    var parentEmailAddresses = [];
    var emailAddresses = [];
    var parents = [];

    function success(results) {
        $.each(results, function(i, userAcctAccess) {
            var parentEmail = userAcctAccess.get('parentEmail');
            var parentId = userAcctAccess.get('parentId');
            var givenAccessUserId = userAcctAccess.get('givenAccessUserId');
            if ($.inArray(parentEmail, parentEmailAddresses) === -1) {
                parentEmailAddresses.push(parentEmail);
                parents.push({
                    id: parentId,
                    email: parentEmail,
                    givenAccessUserId: givenAccessUserId
                });
            }
        });
        deferred.resolve(parents);
    };

    function error() {
        deferred.resolve(parents);
    }
    query.equalTo("givenAccessUserEmail", email);
    query.find({
        success: success,
        error: error
    })
    return deferred;
}; //eo _getParentEmailGivenAccessUserEmail

var _createUserAccount = function(email, pwd, success, error, firstName, lastName) {
    var Parse = _parse;
    var user = new Parse.User(); //this is an object, not an array!
    function successDefault(user) {
        _alert("Successful User Account Creation for: " + email);
    }; //eo success
    function errorDefault(user, err) {
        _alert("Error Create User Account: " + err.code + " " + err.message);
    }; //eo error
    success = success ? success : successDefault;
    error = error ? error : errorDefault;
    pwd = pwd || 'ParentPlanet1';
    // console.log('_createUserAccount pwd', pwd);
    user.set("username", email);
    user.set("password", pwd);
    user.set("email", email);
    user.set("email2", email);
    firstName ? user.set("firstName", firstName) : $.noop();
    lastName ? user.set("lastName", lastName) : $.noop();
    user.set("showParentFirstName", false);
    user.set("showParentLastName", false);
    user.set("showChildFirstName", true);
    user.set("showChildLastName", true);
    user.set("showEmail", false);
    user.set("showHomePhone", false);
    user.set("showMobilePhone", false);
    user.set("showWorkPhone", false);
    user.set("showAddress", false);
    user.set("isRegistered", true);
    user.set("isAdmin", false);
    user.set("isEmailDelivery", true);
    user.signUp(null, {
        success: success,
        error: error
    });
}; //eo createUserAccount

var _onNotificationAPN = function(event) {
    var Parse = _parse;
    var pushNotification = window.plugins.pushNotification;
    var flag = {}; //what type of event
    var showNotificationBox = function(str) {
        var noti = $("#noti-box");

        function notiAnimate() {
            setTimeout(function() {
                noti.animate({
                    "opacity": "0"
                }, 1000, function() {
                    noti.css("display", "none");
                });
            }, 5000);
        };
        noti.html(str);
        noti.css("display", "block");
        noti.animate({
            "opacity": "1"
        }, 500, notiAnimate); //eo animate callback
    }; //eo showNotificationBox
    var _updateMessage = function(messageId, senderId, Chaplin, callback) {
        var Parse = _parse;
        var getUserMessageRelations = function() {
            var user = Parse.User.current();
            var id = user.id;
            var UserMessageRelation = Parse.Object.extend("UserMessageRelation", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserMessageRelation.query();
            query.equalTo("parentId", id);
            //Caching data up to 3 months old
            var dt = new Date();
            dt.setMonth(dt.getMonth() - 3);
            query.greaterThanOrEqualTo("createdAt", dt);
            query.descending("createdAt");
            query.find({
                success: function(results) {
                    //Store using HTML5 local storage
                    var user = _getUserData();
                    user.data = user.data === null ? {} : user.data;
                    user.data.messageRelations = results;
                    _setUserData(user);
                    if (results.length == 0) {} else {
                        var messageIdList = [];
                        var messageIsRead = [];
                        var messageChildIdList = [];
                        //Collect all message ids
                        for (var i = 0; i < results.length; i++) {
                            var messageRelation = results[i];
                            //Apply filter here (kids)
                            var childIdList = messageRelation.get("childIdList");
                            if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {
                                //Do nothing
                            } else if (messageIdList.indexOf(messageRelation.get("messageId")) == -1) {
                                messageIdList.push(messageRelation.get("messageId"));
                                messageIsRead.push(messageRelation.get("isRead"));
                                messageChildIdList.push(messageRelation.get("childIdList"));
                            } //eo else if
                        } //eo for results.length
                        //Get latest messages
                        getUserMessages(messageIdList, messageIsRead, messageChildIdList);
                    } //eo results.length
                }, //eo success
                error: function(error) {}
            }); //eo query.find
        }; //eo getUserMessageRelations

        var getUserMessages = function(messageIdList, messageIsRead, messageChildIdList) {
            var Message = Parse.Object.extend("Message", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = Message.query();
            query.containedIn("objectId", messageIdList);
            query.descending("createdAt");
            query.find({
                success: function(results) {
                    //Store using HTML5 local storage
                    var user = _getUserData();
                    user.data = user.data === null ? {} : user.data;
                    user.data.messages = results;
                    _setUserData(user);
                    //Collect senders' id
                    var senderIdList = [];
                    for (var i = 0; i < results.length; i++) {
                        var message = results[i];
                        if (senderIdList.indexOf(message.get("senderId")) == -1) {
                            senderIdList.push(message.get("senderId"));
                        }
                    } //eo for results.length
                    getUserMessageSenderList(senderIdList);
                }, //eo success
                error: function(error) {}
            }); //eo query.find
        }; //eo getUserMessages

        var getUserMessageSenderList = function(senderIdList) {
            var query = new Parse.Query(Parse.User);
            query.containedIn("objectId", senderIdList);
            query.find({
                success: function(results) {
                    var user = _getUserData();
                    user.data = user.data === null ? {} : user.data;
                    user.data.messageSenderList = results;
                    _setUserData(user);
                    //This  will never be called on Sender's device
                    //It will be triggered only when recipients recieve push notification, then the page will be refreshed. It wont log the user out on mobile device
                    /*
                    //use _resume instead?
                    if (_view.currentView == _view.HOME || _view.currentView == _view.MESSAGES_INDEX) {
                        window.location.reload(true);
                    }
                    */
                    _resume();
                    callback ? callback() : $.noop();
                }, //eo success
                error: function(error) {}
            }); //eo query.find
        }; //eo getUserMessageSenderList

        getUserMessageRelations();
    }; //eo _updateMessage
    var _updateHomework = function(homeworkId, senderId, Chaplin, callback) {
        var Parse = _parse;
        var getUserHomeworkRelations = function() {
            var user = Parse.User.current();
            var id = user.id;
            var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserHomeworkRelation.query();
            query.equalTo("parentId", id);
            //Caching data up to 3 months old
            /*var dt = new Date();
            dt.setMonth(dt.getMonth() - 6);
            query.greaterThanOrEqualTo("createdAt", dt);
            query.descending("createdAt");*/
            query.find({
                success: function(results) {
                    //Update local user cache =======================
                    var user = _getUserData();
                    user.data = user.data === null ? {} : user.data;
                    user.data.homeworkRelations = results;
                    _setUserData(user);
                    // End =====================
                    if (results.length == 0) {} else {
                        var homeworkIdList = [];
                        var homeworkIsRead = [];
                        var homeworkChildIdList = [];
                        //Collect all message ids
                        for (var i = 0; i < results.length; i++) {
                            var homeworkRelation = results[i];
                            //Apply filter here (kids)
                            var childIdList = homeworkRelation.get("childIdList");
                            if (childIdList.length == 1 && _unselectedKidIdList.indexOf(childIdList[0]) != -1) {
                                //Do nothing
                            } else if (homeworkIdList.indexOf(homeworkRelation.get("homework")) == -1) {
                                homeworkIdList.push(homeworkRelation.get("homeworkId"));
                                homeworkIsRead.push(homeworkRelation.get("isRead"));
                                homeworkChildIdList.push(homeworkRelation.get("childIdList"));
                            } //eo else childIdList.length
                        } //eo results.length
                        //Get latest messages
                        getUserHomework(homeworkIdList, homeworkIsRead, homeworkChildIdList);
                    } //eo if results.length
                }, //eo success
                error: function(error) {}
            }); //eo query.find
        }; //eo getUserHomeworkRelations

        var getUserHomework = function(homeworkIdList, homeworkIsRead, homeworkChildIdList) {
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
                    //Update local user cache =======================
                    var user = _getUserData();
                    user.data = user.data === null ? {} : user.data;
                    user.data.homework = results;
                    _setUserData(user);
                    //Collect senders' id
                    var senderIdList = [];
                    for (var i = 0; i < results.length; i++) {
                        var homework = results[i];
                        if (senderIdList.indexOf(homework.get("creatorId")) == -1) {
                            senderIdList.push(homework.get("creatorId"));
                        }
                    } //eo for results.length
                    getUserHomeworkSenderList(senderIdList);
                }, //eo success
                error: function(error) {}
            }); //eo query.find
        }; //eo getUserHomework

        var getUserHomeworkSenderList = function(senderIdList) {
            var query = new Parse.Query(Parse.User);
            query.containedIn("objectId", senderIdList);
            query.find({
                success: function(results) {
                    var user = _getUserData();
                    user.data = user.data === null ? {} : user.data;
                    user.data.homeworkSenderList = results;
                    _setUserData(user);
                    //This  will never be called on Sender's device
                    //It will be triggered only when recipients recieve push notification, then the page will be refreshed. It wont log the user out on mobile device
                    /*
                    if (_view.currentView == _view.HOMEWORK_INDEX) {
                        window.location.reload(true);
                    }
                    if (callback) {
                        callback();
                    }
                    */
                    //handle this the same way as messages
                    _resume();
                    callback ? callback() : $.noop();
                }, //eo success
                error: function(error) {}
            }); //eo query.find
        }; //eo getUserHomeworkSenderList
        getUserHomeworkRelations();
    }; //eo _updateHomework
    var handleEvent = function() {
        showNotificationBox(event.message);
        _onBackgroundFetch(_resume, true); //second argument flags immediate background fetch, no lag time
    }; //eo handleEvent
    var handleMessage = function() {
        showNotificationBox(event.message);
        //   _snd.play();
        _checkUnreadMessages(_parse);
        _updateMessage(event.objectId, event.senderId);
    }; //eo handleMessage
    var handleHomework = function() {
        // showNotificationBox( event.message );
        _checkUnreadHomework(_parse);
        _updateHomework(event.objectId, event.senderId);
    }; //eo handleHomework
    var success = $.noop;
    var error = function(err) {
        _alert('setApplicationIconBadgeNumber error: ' + err);
    }; //eo badgeNumber error
    var mergeAttributes = function() {
        if (!event.additionalData.type && event.additionalData.data.type) {
            event.additionalData = $.extend({}, event.additionalData, event.additionalData.data);
            // event.additionalData = event.additionalData.data;
        }
    }
    var checkAlert = function(pattern) {
        var r = new RegExp(pattern, 'gi');
        var hasKey = r.test(event.additionalData.type);
        return hasKey;
    };
    //    var badgeCount = _notiAppBadgeCount(true);
    //  _snd.play(); //play a sound
    /*
      if(event.badge) {
          cordova.plugins.notification.badge.hasPermission(function(granted) {
              cordova.plugins.notification.badge.increase();
          });
      }
      */
    //  event.badge ? pushNotification.setApplicationIconBadgeNumber(success, error, badgeCount) : $.noop();
    //pushNotification.setApplicationIconBadgeNumber(success, error, 99);
    /*
     * Only proceed if it is an event.alert type
     */
    /*
        Edit by phuongnh@vinasource.com
        Reason: query from push notification in last plugin version changed struct data
     */
    console.log('get information from event');
    console.log(event);
    mergeAttributes();
    console.log(event);
    if (!event.additionalData.type) {
        return;
    }
    /*
    //use regexp instead of simple indexOf
    flag['event'] = event.alert.indexOf("event") != -1 && event.objectId;
    flag['message'] = event.alert.indexOf("message") != -1;
    flag['homework'] = event.alert.indexOf("homework") != -1;
    */

    /*
        Edit by phuongnh@vinasource.com
        use global variable for flag
     */
    flag['event'] = checkAlert(_Event_Type) && event.additionalData.objectId;
    flag['message'] = checkAlert(_Message_Type);
    flag['homework'] = checkAlert(_Homework_Type);
    //_alert('Push Received, flag:'+JSON.stringify(flag));
    if (flag.event) {
        console.log('Hanlde notification of event');
        handleEvent();
        _updateNotiBadgeCount('calendar', true); //update notification badges
        return;
    } else if (flag.message) {
        console.log('Hanlde notification of message');
        handleMessage();
        _updateNotiBadgeCount('messages', true);
        return;
    } else if (flag.homework) {
        console.log('Hanlde notification of homework');
        _onBackgroundFetch(_resume, true); //update count number homework
        handleHomework();
        _updateNotiBadgeCount('homework', true);
        return;
    } else {
        _alert('Unknown push event type: ' + event.alert);
    } //eo event.alert.indexOf("event") ...
    //   console.log('_onNotificationAPN');
}; //eo _onNotificationAPN

var _activityId = function(orgIdForThisObject, childId) {
    if (orgIdForThisObject.length === 0 || !childId) {
        //_alert('Error: Bad activityId org:' + orgIdForThisObject + ' child:' + childId);
        return new Date().getTime() + '_random';
    }
    return orgIdForThisObject + '_' + childId; //this is the id of the activity
}; //eo _activityId

var _firstRepeat = function() {
    return '-0';
};

var _getRepeatId = function(repeatId) {
    if (_isRootRepeatId(repeatId)) {
        var idxRoot = repeatId.indexOf(_firstRepeat());
        return repeatId.substring(0, idxRoot);
    } else {
        return repeatId;
    }
};

var _getRootRepeatId = function(repeatId) {
    return _getRepeatId(repeatId) + _firstRepeat();
}

var _isRootRepeatId = function(repeatId) {
    return repeatId.indexOf(_firstRepeat()) >= 0;
}

var _checkTimeWindow = function(interval) { //interval in minutes
    var flag = false;
    var time = _getTimeWindow(); //return from local storage
    var currentTime = new Date().getTime(); //get time returns msecs
    var delta = 0;
    interval = arguments.length === 0 ? _defaultTimeWindow : interval;
    time = time.length === 0 ? [currentTime] : time; //use currentTime if missing
    time = time[0]; //local storage always returns array
    delta = currentTime - time;
    if (delta >= interval) {
        flag = true;
        _setTimeWindow([currentTime]);
    }
    // console.log('_getTimeWindow = '+ time);
    return flag;
}; //eo _checkTimeWindow
/*
 * View Management
 */
var _goToSettingPage = function(_Chaplin) { //backBtn handler
    switch (_view.currentView) {
        case _view.USER_SIGNIN:
            _Chaplin.utils.redirectTo({
                name: 'signin'
            });
            break;
        case _view.USER_SIGNUP:
            _Chaplin.utils.redirectTo({
                name: 'signup'
            });
            break;
        case _view.HOME:
            _Chaplin.utils.redirectTo({
                name: 'setting-home'
            });
            break;
        case _view.SCHEDULE_INDEX:
            _Chaplin.utils.redirectTo({
                name: 'calendar'
            });
            break;
        case _view.MESSAGES_INDEX:
            _Chaplin.utils.redirectTo({
                name: 'message'
            });
            break;
        case _view.HOMEWORK_INDEX:
            _Chaplin.utils.redirectTo({
                name: 'homework'
            });
            break;
        case _view.CONTACTS_INDEX:
            _Chaplin.utils.redirectTo({
                name: 'contacts'
            });
            break;
        default:
            _Chaplin.utils.redirectTo({
                name: 'home'
            });
            break;
    } //eo switch
}; //eo goToSettingPage

var _setPreviousView = function() {
    _view.previousView = _view.currentView;
};
var _setCurrentView = function(currentView, id) {
    _view.currentView = currentView;
    _view.id = id ? id : null;
};
var _currentView = function() {
    return _view;
};
var _currentViewId = function() {
    return _view.id;
};
var _setAfterSendToView = function(afterSendToView) {
    _view.afterSendToView = afterSendToView;
};
var _setSubView = function(subview) {
    _view.subview = subview;
};
var _resume = function() { //call this when app moves to the foreground, make global
    //   console.log('_resume fired, send _notify("refresh")');
    // Edit by phuongnh@vinasource.com
    // instead function setApplicationIconBadgeNumber, will use cordovar.plugins.notification.badge for both platform Android, iOS

    if (_isForegroundMode) {
        cordova.plugins.notification.badge.set(0);
    }

    // if(_pushNotification) {
    //     _pushNotification.setApplicationIconBadgeNumber(
    //         function(){
    //             console.log('reset success badge to 0 from _resume function');
    //         },
    //         function() {
    //             console.log('reset faile badge from _resume function');
    //         },
    //         0);
    // }
    _notify('refresh').publish(); //use notification system to alert other views that we need to refresh
    //   console.log('_notify("refresh") done');
}; //eo _resume

//global pubsub system see $.Callbacks https://api.jquery.com/jQuery.Callbacks/
var _notifications = {}; //global list of callback objects
var _notify = function(id) {
    var callbacks;
    var notification = id && _notifications[id];
    if (!notification) { //this notification does not exist, create
        callbacks = $.Callbacks();
        notification = {
            publish: callbacks.fire,
            subscribe: callbacks.add,
            unsubscribe: callbacks.remove
        };
        if (id) {
            _notifications[id] = notification;
        } //bind this notification to the array
    } //eo singleton
    return notification;
}; //eo _notify

//split an array into subarrays of size unit
var _chunk = function(array, size) {
    var i = 0;
    var arr = [];
    var l;
    if (typeof array !== "object") {
        return array;
    }
    size = Math.abs(size);
    l = Math.ceil(array.length / size);
    for (i = 0; i < l; i++) {
        arr.push(array.slice(i * size, (i + 1) * size));
    }
    return arr;
};

//http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
var _hashCode = function(str) {
    var hash = 0,
        i, chr, len;
    if (str.length == 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}; //eo _hashCode

var _sendMandrillEmail = function(o) {
    var Parse = _parse;
    var cloudFunction = 'mandrill3';
    o = o || {};
    Parse.Cloud.run(cloudFunction, o, {
        success: function(result) {
            _alert('MandrillEmail:' + result);
        },
        error: function(error) {
            _alert('MandrillEmail Error:' + error);
        }
    });
}; //eo _sendMandrillEmail

var _cloud = function(o) {
    var Parse = _parse;
    var cloudFunction = 'hello';
    o = o || {};
    Parse.Cloud.run(cloudFunction, o, {
        success: function(result) {
            _alert('MandrillEmail:' + result);
        },
        error: function(error) {
            _alert('MandrillEmail Error:' + error);
        }
    });

}; //eo _sendMandrillEmail

var _alert = function(msg) { //global slidedown alert msg
    msg = (typeof msg === 'undefined' || msg === null ? '' : msg);
    $('#alert-msg').html(msg);
    $(".slidingalert").addClass("active");
}; //eo _alert

var _confirm = function(msg) { //global slidedown confirmation modal
    var deferred = $.Deferred();
    msg = (typeof msg === 'undefined' || msg === null ? '' : msg);
    $('#confirm-msg').html(msg);
    $(".slidingconfirm").addClass("active");
    //create deferred and add in onclick resolve/reject for OK/Cancel/Close buttons
    //return deferred obj
    $("#confirm-ok").on("click", function() {
        $(".slidingconfirm").removeClass("active");
        deferred.resolve();
    });
    $("#confirm-cancel").on("click", function() {
        $(".slidingconfirm").removeClass("active");
        deferred.reject();
    });

    $(".icon-cancel:visible").on("click", function() {
        $(".slidingconfirm").removeClass("active");
        deferred.reject();
    });
    return deferred;
}; //eo _confirm

var _yesno = function(msg, textYes, textNo) {
    var deferred = $.Deferred();
    msg = (typeof msg === 'undefined' || msg === null ? '' : msg);
    $('#yesno-msg').html(msg);
    $("#yesno-yes").text(textYes ? textYes : "Yes");
    $("#yesno-no").text(textNo ? textNo : "No");

    $(".slidingYesNo").addClass("active");
    //create deferred and add in onclick resolve/reject for OK/Cancel/Close buttons
    //return deferred obj
    $("#yesno-yes").on("click", function() {
        $(".slidingYesNo").removeClass("active");
        deferred.resolve(true);
    });
    $("#yesno-no").on("click", function() {
        $(".slidingYesNo").removeClass("active");
        deferred.resolve(false);
    });

    $(".icon-cancel:visible").on("click", function() {
        $(".slidingYesNo").removeClass("active");
        deferred.reject();
    });
    return deferred;
}; //eo _confirm

var _dropdown = function(template, o) { //general slidedown
    var templateFunc = null;
    var html = null;
    templateFunc = typeof template === 'string' ? Handlebars.compile(template) : template;
    html = templateFunc === null ? 'Error: No Template Function for Dropdown' : templateFunc(o);
    $('#alert-msg').html(html);
    $('#sliding-alert').addClass("dropdown");
    $(".slidingalert").addClass("active");
}; //eo _dropdown

var _orgIconColorForMultipleChild = "#999;";
var _getOrgIcon = function(groupType, color) { //Get organization icons
    var icon;

    function getIcon(type) {
        icon = color ? '<i class="' + type + '" style="color:' + color + '"></i>' : '<i class="' + type + '"></i>';
    };
    switch (groupType.toLowerCase()) {
        case "art":
            getIcon('p2-art-ii');
            break;
        case "baseball":
            getIcon('p2-baseball');
            break;
        case "basketball":
            getIcon('p2-basketball');
            break;
        case "birthday":
            getIcon('p2-birthday');
            break;
        case "boy scouts":
            getIcon('p2-boy-scout');
            break;
        case "buddhist":
            getIcon('p2-buddishm');
            break;
        case "camps":
            getIcon('p2-summer-camps');
            break;
        case "cheerleading":
            getIcon('p2-cheerleader');
            break;
        case "christian":
            getIcon('p2-christian');
            break;
        case "clubs":
            getIcon('p2-club');
            break;
        case "computers":
            getIcon('p2-computer');
            break;
        case "dance":
            getIcon('p2-dance');
            break;
        case "equestrian":
            getIcon('p2-equestrian');
            break;
        case "fencing":
            getIcon('p2-fencing');
            break;
        case "field trip":
            getIcon('p2-fieldtrip');
            break;
        case "football":
            getIcon('p2-football');
            break;
        case "girl scouts":
            getIcon('p2-girl-scout');
            break;
        case "golf":
            getIcon('p2-golf');
            break;
        case "gymnastics":
            getIcon('p2-gymnastic');
            break;
        case "hockey":
            getIcon('p2-ice-hockey');
            break;
        case "ice skating":
            getIcon('p2-ice-skating');
            break;
        case "jewish":
            getIcon('p2-jews');
            break;
        case "lacrosse":
            getIcon('p2-lacrosse');
            break;
        case "martial arts":
            getIcon('p2-martial-art');
            break;
        case "medical":
            getIcon('p2-medic');
            break;
        case "music":
            getIcon('p2-music');
            break;
        case "muslim":
            getIcon('p2-islam');
            break;
        case "parks":
            getIcon('p2-park');
            break;
        case "playgroup":
            getIcon('p2-playgroup');
            break;
        case "rugby":
            getIcon('p2-rugby');
            break;
        case "school":
            getIcon('p2-school');
            break;
        case "soccer":
            getIcon('p2-soccer');
            break;
        case "swimming":
            getIcon('p2-swimming');
            break;
        case "tennis":
            getIcon('p2-tennis');
            break;
        case "theater":
            getIcon('p2-drama');
            break;
        case "therapy":
            getIcon('p2-therapy');
            break;
        case "track & field":
            getIcon('p2-fieldtrip');
            break;
        case "tutor":
            getIcon('p2-tutor');
            break;
        case "volleyball":
            getIcon('p2-volleyball');
            break;
        case "water polo":
            getIcon('p2-water-polo');
            break;
        case "wrestling":
            getIcon('p2-wrestling');
            break;
        case "yoga":
            getIcon('p2-yoga');
            break;
        default:
            icon = '<i class="p2-parent-planet"></i>';
    } //eo switch groupType
    return icon;
};

var _getHomeworkIcon = function(groupType, color) {
    var icon;

    function getIcon(type) {
        icon = color ? '<i class="' + type + '" style="color:' + color + '"></i>' : '<i class="' + type + '"></i>';
    };
    switch (groupType.toLowerCase()) {
        case "test/project":
            getIcon('p2-school-test');
            break;
        case "daily":
            getIcon('p2-school-homework');
            break;
    }
    return icon;
}; //eo _getHomeworkIcon

//handle badges
var _refreshNotiBadges = function() {
    _calendar = _calendar ? _calendar : {};
    _calendar.badgeCount = 0;
    _calendar.calendarCount = 0;
    _calendar.messagesCount = 0;
    _calendar.homeworkCount = 0;
};
var _randomNotiBadges = function() {
    _calendar.calendarCount = Math.floor(100 * Math.random());
    _calendar.messagesCount = Math.floor(100 * Math.random());
    _calendar.homeworkCount = Math.floor(100 * Math.random());
    _calendar.badgeCount = _notiBadgesCount();
};
var _notiAppBadgeCount = function(flag) {
    _calendar.badgeCount = flag ? ++_calendar.badgeCount : _calendar.badgeCount;
    return _calendar.badgeCount;
};
var _notiBadgesCount = function() {
    _calendar ? $.noop() : _refreshNotiBadges();
    return _calendar.calendarCount + _calendar.messagesCount + _calendar.homeworkCount;
};
var _notiBadgeCount = function(id) {
    _calendar ? $.noop() : _refreshNotiBadges();
    id = id + 'Count';
    return _calendar[id];
};
var _updateNotiBadgeCount = function(id, increment) {
    _calendar ? $.noop() : _refreshNotiBadges();
    id = id + 'Count';
    _calendar[id] = increment ? _calendar[id] + 1 : _calendar[id] - 1;
    return _calendar[id];
};
var _setNotiBadgeCount = function(id, n) {
    _calendar ? $.noop() : _refreshNotiBadges();
    id = id + 'Count';
    _calendar[id] = n;
    return _calendar[id];
};
var _updateNotiBadge = function(id) {
    var key = 'badge'; //key for data attribute
    var attr = 'data-' + key;
    var showCurrent = arguments.length === 1 ? true : false; //if we have the updateCount flag
    var which, n, s;
    n = _notiBadgeCount(id); //this needs to be set before we get the DOM element id
    id = '#' + id + '-noti-badge'; //full id for this badge in the footer
    which = $(id); //ele
    n = n > 999 ? 999 : n;
    n = n < 0 ? 0 : n; //sanity checks
    s = (n === 999 ? '>999' : n + '');
    n > 0 ? which.attr('data-badge', s) : which.removeAttr('data-badge');
    // We always have error: Plugin 'Badge' not found, or is not a CDVPlugin. Check your plugin mapping in config.xml
    // So Nam commented out this function.
    //cordova.plugins.notification.badge.hasPermission(function(granted) {
    //    cordova.plugins.notification.badge.clear();
    //});
}; //eo global _updateNotiBadge
//redefine these until removed from codebase globally
//data is pulled from local storage, so needs to be set first there before updating view
var _checkUnreadMessages = function() {
    var n = 0;
    var r = _getUserMessageRelations();
    $.each(r, function(i, o) {
        n = o.isRead ? n : ++n;
    });
    _setNotiBadgeCount('messages', n);
    _updateNotiBadge('messages');
};
var _checkUnreadEvent = function() {
    var n = 0;
    var r = _getUserEventRelations();
    $.each(r, function(i, o) {
        n = o.isRead ? n : ++n;
    });
    _setNotiBadgeCount('calendar', n);
    _updateNotiBadge('calendar');
};
var _checkUnreadHomework = function() {
    var n = 0;
    var r = _getUserHomeworkRelations();
    $.each(r, function(i, o) {
        n = o.isRead ? n : ++n;
    });
    _setNotiBadgeCount('homework', n);
    _updateNotiBadge('homework');
};

var _backgroundFetchDone = function(_Chaplin) {
    setTimeout(function() {
        _Chaplin ? _Chaplin.utils.redirectTo({
            name: 'home'
        }) : $.noop();
    }, DEFAULT_ANIMATION_DELAY);
}; //always go back to the home
/*
 * LocalStorage Methods
 * make it easier to work with localstorage with these getter/setters
 * TODO: refactor using Object.defineProperty() !
 * _get/setUserData : gets/sets the 'user' object
 * _get/setLocalData : gets/sets the 'user.data' object
 */
var _clearUserData_ = function() {
    localStorage.removeItem('user');
};
var _getUserData = function() { //get the entire localstorage object
    var _user = localStorage.getItem("user");
    var user = _user ? JSON.parse(_user) : {}; //return an object
    user = user ? user : {};
    return user;
}; //eo _getUserData
var _setUserData = function(user) { //set the entire localstorage object
    if ($.type(user) !== 'object') {
        _alert('Internal error: _setUserData, user is not an object');
        return;
    }
    var _user = JSON.stringify(user); //set a json string
    localStorage.setItem("user", _user);
};
//next levels down
var _getUserActivations = function() {
    var _user = _getUserData();
    var data = _user.activations ? _user.activations : {};
    return data;
}; //eo _getUserActivations
var _setUserActivations = function(prop, val) {
    var _user = _getUserData();
    if ($.type(_user) !== 'object' || arguments.length < 2) {
        _alert('Internal error: _setUserActivations, activations is not an object || arguments < 2');
        return;
    }
    _user.activations = _user.activations || {};
    _user.activations[prop] = val;
    _setUserData(_user);
}; //eo _setUserActivations
var _checkUserActivations = function() {
    var prop = arguments.length > 0 ? arguments[0] : 'general';
    var activations = _getUserActivations();
    var flag = activations.hasOwnProperty(prop);
    flag = flag ? activations[prop] : false;
    return flag;
}; //eo _checkUserActivations
var _getLocalData = function() {
    var _user = _getUserData();
    var data = _user.data ? _user.data : {};
    return data;
}; //eo _getLocalData
var _setLocalData = function(data) {
    var _user = _getUserData();
    if ($.type(data) !== 'object') {
        _alert('Internal error: _setLocalData, data is not an object');
        return;
    }
    _user.data = data;
    _setUserData(_user);
}; //eo _setLocalData
//working with local storage user.data object!
//general get/set (name, array)
var _getUserLocalStorage = function(name) {
    var _data = _getLocalData();
    var o;
    if (!name || name.length === 0) {
        _alert('Internal error: _userLocalStorage, bad name');
        return;
    }
    o = _data[name] ? _data[name] : []; //create if needed
    return o;
}; //eo _getUserLocalStorage
var _setUserLocalStorage = function(name, data) {
    var _data = _getLocalData();
    if (!name || name.length === 0 || $.type(data) !== 'array') {
        _alert('Internal error: _setUserLocalStorage, bad name or data is not an array');
        return;
    }
    _data[name] = data;
    _setLocalData(_data);
    return _data;
}; //eo _setUserLocalStorage
//Specific helper get/set functions _getUserX (name, array)
var _getDefaultCustomListData = function() {
    var _user = _getUserData();
    var defaultCustomListData = _user.defaultCustomListData ? _user.defaultCustomListData : null;
    return defaultCustomListData;
}; //eo _getDefaultCustomListData
var _setDefaultCustomListData = function(defaultCustomListData) {
    var _user = _getUserData();
    _user.defaultCustomListData = defaultCustomListData;
    _setUserData(_user);
}; //eo _setDefaultCustomListData
var _getDefaultCustomListId = function() {
    var _user = _getUserData();
    var defaultCustomListId = _user.defaultCustomListId ? _user.defaultCustomListId : null;
    return defaultCustomListId;
}; //eo _getDefaultCustomListId
var _setDefaultCustomListId = function(defaultCustomListId) {
    var _user = _getUserData();
    _user.defaultCustomListId = defaultCustomListId;
    _setUserData(_user);
}; //eo _setDefaultCustomListId
var _getCustomList = function() {
    var _user = _getUserData();
    var customList = _user.customList ? _user.customList : {};
    return customList;
}; //eo _getCustomList
var _setCustomList = function(customList) {
    var _user = _getUserData();
    _user.customList = customList;
    _setUserData(_user);
}; //eo _setCustomList
var _getUserCustomList = function() {
    var _customList = _getCustomList();
    var _userCustomList = _customList.userCustomList ? _customList.userCustomList : [];
    return _userCustomList;
}; //eo _getUserCustomList
var _setUserCustomList = function(userCustomList) {
    var _customList = _getCustomList();
    _customList.userCustomList = userCustomList;
    _setCustomList(_customList);
}; //eo _setUserCustomList
var _getSelectedCustomListData = function() {
    var _customList = _getCustomList();
    var _selectedCustomListData = _customList.selectedCustomListData ? _customList.selectedCustomListData : {};
    return _selectedCustomListData;
}; //eo _getSelectedCustomListData
var _setSelectedCustomListData = function(selectedCustomListData) {
    var _customList = _getCustomList();
    _customList.selectedCustomListData = selectedCustomListData;
    _setCustomList(_customList);
}; //eo _setSelectedCustomListData
var _getUserCustomListItem = function(id) {
    var _userCustomList = _getUserCustomList();
    return _getUserItem(_userCustomList, id);
}; //eo _getUserCustomListItem
var _setUserCustomListItem = function(id, o) {
    var _userCustomList = _getUserCustomList();
    _setUserItem(_userCustomList, id, o);
    _setUserCustomList(_userCustomList);
}; //eo _setUserCustomListItem
var _getUserCustomListIdArray = function() {
    var _customList = _getCustomList();
    var _userCustomListIdArray = _customList.userCustomListIdArray ? _customList.userCustomListIdArray : [];
    return _userCustomListIdArray;
};
var _setUserCustomListIdArray = function(userCustomListIdArray) {
    var _customList = _getCustomList();
    _customList.userCustomListIdArray = userCustomListIdArray;
    _setCustomList(_customList);
}; //eo _setUserCustomListIdArray
var _getOrgGroupIdArray = function() {
    var _customList = _getCustomList();
    var _orgGroupIdArray = _customList.orgGroupIdArray ? _customList.orgGroupIdArray : [];
    return _orgGroupIdArray;
};
var _setOrgGroupIdArray = function(orgGroupIdArray) {
    var _customList = _getCustomList();
    _customList.orgGroupIdArray = orgGroupIdArray;
    _setCustomList(_customList);
}; //eo _setOrgGroupIdArray
var _getSelectedCustomListData = function() {
    var _customList = _getCustomList();
    var _selectedCustomListData = _customList.selectedCustomListData ? _customList.selectedCustomListData : {};
    return _selectedCustomListData;
};
var _setSelectedCustomListData = function(selectedCustomListData) {
    var _customList = _getCustomList();
    _customList.selectedCustomListData = selectedCustomListData;
    _setCustomList(_customList);
}; //eo _setSelectedCustomListData
var _getCustomListIsEdit = function() {
    var _customList = _getCustomList();
    var _isEdit = _customList.isEdit ? _customList.isEdit : null;
    return _isEdit;
};
var _setCustomListIsEdit = function(isEdit) {
    var _customList = _getCustomList();
    _customList.isEdit = isEdit;
    _setCustomList(_customList);
}; //eo _setCustomListIsEdit
var _loadChildrenColors = function(callback, children) {
    var i, child;
    var _children = _getUserChildren();

    function loadColors() {
        for (i = 0; i < _children.length; i++) {
            child = _children[i];
            children.id.push(child.id);
            child.color ? children.color.push(child.color) : children.color.push(child.localColor);
        }
    }; //eo colors
    //Load from cache
    _children.length > 0 ? loadColors() : $.noop();
    callback ? callback() : $.noop();
}; //eo loadChildrenColors
var _getUserChildren = function() {
    var user = _getUserData();
    user.children = user.children ? user.children : [];
    return user.children;
}; //eo _getUserChildren
var _setUserChildren = function(child) {
    var children = _getUserChildren();
    var o = null;
    var index = -1;
    if (children.length === 0) {
        children.push(child);
    } else {
        o = $.grep(children, function(e, i) {
            var flag = e.id === child.id;
            if (flag) {
                index = i;
            }
            return flag;
        }); //this returns an array
        if (index < 0) {
            children.push(child);
        } else if (o.length > 1) {
            console.log('Error: _setUserChildren multiple matches');
            children[index] = child;
        } else {
            children[index] = child;
        }
    }
    user.children = children;
    _setUserData(user);
}; //eo _setUserChildren
var _getSignedIn = function() {
    /*var data = _getLocalData();
    var flag = data['signedIn'];
    if(!flag) {
        data['signedIn'] = flag = false;
        _setLocalData(data);
    }
    */
    var _user = _getUserData();
    var flag = _user && _user.isSignedIn ? _user.isSignedIn : false;
    return flag;
}; //eo _getSignedIn
var _setSignedIn = function(flag) {
    /*
    var data = _getLocalData();
    data['signedIn'] = flag;
    _setLocalData(data);
    */
    var _user = _getUserData();
    _user.isSignedIn = flag;
    _setUserData(_user);
}; //eo _setSignedIn
var _getLastSync = function() {
    var lastSync = _getUserLocalStorage('lastSyncDate');
    if (lastSync.length === 0) {
        _setLastSync([_defaultFirstSyncDate]);
    }

    return new Date(_getUserLocalStorage('lastSyncDate')[0]);
};
var _setLastSync = function(syncDate) {
    _setUserLocalStorage('lastSyncDate', [syncDate]);
};
var _getTimeWindow = function() {
    return _getUserLocalStorage('timeWindow');
};
var _setTimeWindow = function(timeWindow) {
    _setUserLocalStorage('timeWindow', timeWindow);
};
var _getUserEvents = function() {
    var events = _getUserLocalStorage('events')
    events.sort(function(a, b) { // a < b -1, a > b 1, a = b 0 ascending
        a = a.attributes ? Date.parse(a.attributes.startDateTime) : (a.startDateTime.iso ? Date.parse(a.startDateTime.iso) : Date.parse(a.startDateTime)); //num. msec since 1970
        b = b.attributes ? Date.parse(b.attributes.startDateTime) : (b.startDateTime.iso ? Date.parse(b.startDateTime.iso) : Date.parse(b.startDateTime));
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    }); //eo sortEvents
    return events;
}; //eo _getUserEvents
var _setUserEvents = function(events) {
    _setUserLocalStorage('events', events);
};
var _getUserMessageRelations = function() {
    return _getUserLocalStorage('messageRelations');
};
var _setUserMessageRelations = function(messageRelations) {
    _setUserLocalStorage('messageRelations', messageRelations);
};
var _getUserHomeworkRelations = function() {
    return _getUserLocalStorage('homeworkRelations');
};
var _setUserHomeworkRelations = function(homeworkRelations) {
    _setUserLocalStorage('homeworkRelations', homeworkRelations);
};
var _getUserEventRelations = function() {
    return _getUserLocalStorage('eventRelations');
};
var _setUserEventRelations = function(eventRelations) {
    _setUserLocalStorage('eventRelations', eventRelations);
};
var _getUserContacts = function() {
    return _getUserLocalStorage('contacts');
};
var _setUserContacts = function(contacts) {
    _setUserLocalStorage('contacts', contacts);
};
var _getUserContactsRelations = function() {
    return _getUserLocalStorage('contactsRelations');
};
var _setUserContactsRelations = function(contactsRelations) {
    _setUserLocalStorage('contactsRelations', contactsRelations);
};
var _getUserHomework = function() {
    var homework = _getUserLocalStorage('homework');
    homework.sort(function(a, b) { //put in order of dueDate
        a = a.attributes ? Date.parse(a.attributes.dueDate) : (a.dueDate.iso ? Date.parse(a.dueDate.iso) : Date.parse(a.dueDate)); //num. msec since 1970
        b = b.attributes ? Date.parse(b.attributes.dueDate) : (b.dueDate.iso ? Date.parse(b.dueDate.iso) : Date.parse(b.dueDate));
        if (a < b) {
            return 1;
        }
        if (a > b) {
            return -1;
        }
        return 0;
    }); //eo homeworks.sort
    return homework;
}; //eo _getUserHomework
var _setUserHomework = function(homework) {
    _setUserLocalStorage('homework', homework);
};
var _getUserMessages = function() {
    var messages = _getUserLocalStorage('messages');
    messages = messages.sort(function(a, b) { // a < b -1, a > b 1, a = b 0 ascending //num. msec since 1970
        var d = new Date();
        try {
            a = a.attributes ? Date.parse(a.attributes.updatedAt) : (a.updatedAt.iso ? Date.parse(a.updatedAt.iso) : Date.parse(a.updatedAt)); //num. msec since 1970
        } catch (error) {
            a = d.getTime();
        }
        try {
            b = b.attributes ? Date.parse(b.attributes.updatedAt) : (b.updatedAt.iso ? Date.parse(b.updatedAt.iso) : Date.parse(b.updatedAt));
        } catch (error) {
            b = d.getTime();
        }
        if (a < b) {
            return 1;
        }
        if (a > b) {
            return -1;
        }
        return 0;
    });
    return messages;
}; //eo _getUserMessages
var _setUserMessages = function(messages) {
    _setUserLocalStorage('messages', messages);
};
var _getHomeworkSenderList = function() {
    return _getUserLocalStorage('homeworkSenderList');
};
var _setHomeworkSenderList = function(homeworkSenderList) {
    _setUserLocalStorage('homeworkSenderList', homeworkSenderList);
};
var _getEventSenderList = function() {
    return _getUserLocalStorage('eventSenderList');
};
var _setEventSenderList = function(eventSenderList) {
    _setUserLocalStorage('eventSenderList', eventSenderList);
};
var _getMessageSenderList = function() {
    return _getUserLocalStorage('messageSenderList');
};
var _setMessageSenderList = function(messageSenderList) {
    _setUserLocalStorage('messageSenderList', messageSenderList);
};
var _getUserCalendar = function() {
    return _getUserLocalStorage('calendar');
};
var _setUserCalendar = function(calendar) {
    _setUserLocalStorage('calendar', calendar);
};
var _getUserReminders = function() {
    return _getUserLocalStorage('reminders');
};
var _setUserReminders = function(reminders) {
    _setUserLocalStorage('reminders', reminders);
};
var _getUserActivities = function() {
    return _getUserLocalStorage('activities');
};
var _setUserActivities = function(activities) {
    _setUserLocalStorage('activities', activities);
};
//general get/set functions for get/set a specific obj of id in given array arr
var _getUserItem = function(arr, id) {
    var item = $.grep(arr, function(e, i) {
        return id === e.objectId;
    });
    item = item.length > 0 ? item[0] : null;
    return item;
}; //eo _getUserItem
var _setUserItem = function(arr, id, o) {
    var index = -1;
    var item = null;
    if (!arr) {
        return;
    }
    item = $.grep(arr, function(e, i) {
        var flag = id == e.objectId;
        if (flag) {
            index = i;
        }
        return flag;
    });
    if (index < 0) { //this event does not exist in the array
        item = {
            objectId: id
        };
        $.extend(item, o);
        arr.push(item);
    } else { //new calendar array item
        if (item.length > 1) {
            index = 0;
            _alert('Error, duplicate items from _setUserItem len=' + item.length + ' using first one.');
        }
        item = arr[index];
        $.extend(item, o);
    }
}; //eo _setUserItem
//Specific helper get/set functions for get/set a specific obj of id
var _getUserCalendarItem = function(id) {
    var calendar = _getUserCalendar(); //array of obj
    var _cal = _getUserItem(calendar, id);
    return _cal;
}; //eo _getUserCalendarItem
var _setUserCalendarItem = function(id, o) {
    var calendar = _getUserCalendar(); //array of obj
    _setUserItem(calendar, id, o);
    _setUserCalendar(calendar);
}; //eo _setUserCalendarItem
var _getUserEventsItem = function(id) {
    var events = _getUserEvents(); //array of obj
    var _event = _getUserItem(events, id);
    return _event;
}; //eo _getUserEventsItem
var _setUserEventsItem = function(id, o) {
    var events = _getUserEvents(); //array of obj
    _setUserItem(events, id, o);
    _setUserEvents(events);
}; //eo _setUserEventsItem
var _getUserEventRelationsItem = function(id) {
    var eventRelations = _getUserEventRelations(); //array of obj
    var _eventRelationsItem = _getUserItem(eventRelations, id);
    return _eventRelationsItem;
}; //eo _getUserEventsItem
var _setUserEventRelationsItem = function(id, o) {
    var eventRelations = _getUserEventRelations(); //array of obj
    _setUserItem(eventRelations, id, o);
    _setUserEventRelations(eventRelations);
}; //eo _setUserEventsItem
var _getEventSenderListItem = function(id) {
    var eventSenderList = _getEventSenderList();
    var _eventSenderListItem = _getUserItem(eventSenderList, id);
    return _eventSenderListItem;
}; //eo _getEventSenderListItem
var _setEventSenderListItem = function(id, o) {
    var eventSenderList = _getEventSenderList();
    _setUserItem(eventSenderList, id, o);
    _setEventSenderList(eventSenderList);
}; //eo _setEventSenderListItem
var _getMessageSenderListItem = function(id) {
    var messageSenderList = _getMessageSenderList();
    var _messageSenderListItem = _getUserItem(messageSenderList, id);
    return _messageSenderListItem;
}; //eo _getMessageSenderListItem
var _setMessageSenderListItem = function(id, o) {
    var messageSenderList = _getMessageSenderList();
    _setUserItem(messageSenderList, id, o);
    _setMessageSenderList(eventSenderList);
}; //eo _setMessageSenderListItem
var _getUserMessagesItem = function(id) {
    var messages = _getUserMessages(); //array of obj
    var _message = _getUserItem(messages, id);
    return _message;
}; //eo _getUserEventsItem
var _setUserMessagesItem = function(id, o) {
    var messages = _getUserMessages(); //array of obj
    _setUserItem(messages, id, o);
    _setUserMessages(messages);
}; //eo _setUserEventsItem
var _getUserMessagesRelationsItem = function(id) {
    var messageRelations = _getUserMessageRelations(); //array of obj
    var _messageRelationsItem = _getUserItem(messageRelations, id);
    return _messageRelationsItem;
}; //eo _getUserEventsItem
var _setUserMessagesRelationsItem = function(id, o) {
    var messageRelations = _getUserMessageRelations(); //array of obj
    _setUserItem(messageRelations, id, o);
    _setUserMessageRelations(messageRelations);
}; //eo _setUserEventsItem
var _getUserHomeworkItem = function(id) {
    var homework = _getUserHomework(); //array of obj
    var _homework = _getUserItem(homework, id);
    return _homework;
}; //eo _getUserEventsItem
var _setUserHomeworkItem = function(id, o) {
    var homework = _getUserHomework(); //array of obj
    _setUserItem(homework, id, o);
    _setUserHomework(homework);
}; //eo _setUserEventsItem
var _getUserHomeworkRelationsItem = function(id) {
    var homeworkRelations = _getUserHomeworkRelations(); //array of obj
    var _homeworkRelationsItem = _getUserItem(homeworkRelations, id);
    return _messageRelationsItem;
}; //eo _getUserEventsItem
var _setUserHomeworkRelationsItem = function(id, o) {
    var homeworkRelations = _getUserHomeworkRelations(); //array of obj
    _setUserItem(homeworkRelations, id, o);
    _setUserHomeworkRelations(homeworkRelations);
}; //eo _setUserEventsItem
var _getUserRemindersItem = function(id) {
    var reminders = _getUserReminders(); //array of obj
    var _reminder = _getUserItem(reminders, id);
    return _reminder;
}; //eo _getUserRemindersItem
var _setUserRemindersItem = function(id, o) {
    var reminders = _getUserReminders(); //array of obj
    _setUserItem(reminders, id, o);
    _setUserReminders(reminders);
}; //eo _setUserRemindersItem
var _getUserActivitiesItem = function(id) { //NOTE: id = OrgId + '_' + childId
    var activities = _getUserActivities(); //array of obj
    var _activity = _getUserItem(activities, id);
    return _activity;
}; //eo _getUserActivitiesItem
var _setUserActivitiesItem = function(id, o) { //NOTE: id = OrgId + '_' + childId
    var activities = _getUserActivities(); //array of obj
    _setUserItem(activities, id, o);
    _setUserActivities(activities);
}; //eo _setUserActivitiesItem

var _generateUUID = function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
}; //eo _generateUUID

var _showColorPicker = function(parent, target) {
    var child = [
        '<div id="color-picker">',
        '<div class="cp-bg"></div>',
        '<div class="cp-main">',
        '<div class="cp-title">Pick a color</div>',
        '<div class="cp-color-wrapper">',
        '<div class="cp-color" style="background:#00CCCC;"></div>',
        '<div class="cp-color" style="background:#66CCFF;"></div>',
        '<div class="cp-color" style="background:#0033FF;"></div>',
        '<div class="cp-color" style="background:#6600CC;"></div>',
        '<div class="cp-color" style="background:#CC66FF;"></div>',
        '<div class="cp-color" style="background:#FF99FF;"></div>',
        '<div class="cp-color" style="background:#FF00CC;"></div>',
        '<div class="cp-color" style="background:#FF0000;"></div>',
        '<div class="cp-color" style="background:#CC3300;"></div>',
        '<div class="cp-color" style="background:#FF6633;"></div>',
        '<div class="cp-color" style="background:#996633;"></div>',
        '<div class="cp-color" style="background:#66CC00;"></div>',
        '<div class="cp-color" style="background:#339900;"></div>',
        '<div class="cp-color" style="background:#FFCC00;"></div></div></div></div>'
    ];
    $(".cp-color, .cp-bg").off('click');
    child = child.join(' ');
    $(parent).append(child);

    $(".cp-color").on('click', function(e) {
        var color = $(this).css("background");
        $(target).css("background", color);
        $("#color-picker").remove();
    });

    $("#color-picker").css("display", "block");

    // show pp
    var pTop = $("#main-content-inner").position().top;
    if (pTop < 0) {
        var h = $("#color-picker").height();
        var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
        var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
        var top = ((height / 2) - (h / 2)) + dualScreenTop;

        $('#color-picker').offset({ top: top });
    }

    $(".cp-bg").on("click", function(e) {
        $("#color-picker").remove();
    });
}; //eo _showColorPicker

var _validateEmail = function(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!email || email.length === 0) {
        return false;
    }
    return re.test(email);
}; //eo _validateEmail

var _toTitleCase = function(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}; //simple one
/*
 * To Title Case 2.1 – http://individed.com/code/to-title-case/
 * Copyright © 2008–2013 David Gouch. Licensed under the MIT License.
 */
//generate an array containing the passed string containing it, and upper/lower/titlecase versions
//used for Parse .containedIn queries
var _containedIn = function(str) {
    var arr = [];

    function gen() {
        str = str.trim(); //take off leading and trailing spaces
        arr.push(str); //original string
        arr.push(str.toUpperCase());
        arr.push(str.toLowerCase());
        arr.push(str.toTitleCase()); //see below
    };
    str ? gen() : $.noop();
    return arr;
}; //eo _containedIn

//return a fully formed Parse query using their Parse.Query.or function
//NOTE: EXPERIMENTAL, NOT TESTED!
var _queryOr = function(type, obj) {
    'use strict';
    var Parse = _parse;
    var q = [];
    var query = null;

    function build() {
        $.each(obj, function(prop, val) {
            q.push(new Parse.Query(type).containedIn(prop, _containedIn(val)));
        });
        query = Parse.Query.or.apply(Parse.Query, q);
    }; //eo build
    obj && Object.keys(obj).length > 0 ? build() : _alert('Internal Error: _queryOr, No object data: ');
    return query;
}; //eo _queryOr

String.prototype.toTitleCase = function() {
    var smallWords = /^(a|an|and|as|at|but|by|en|for|if|in|nor|of|on|or|per|the|to|vs?\.?|via)$/i;
    var lc = this.toLowerCase();
    return lc.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title) {
        if (index > 0 && index + match.length !== title.length &&
            match.search(smallWords) > -1 && title.charAt(index - 2) !== ":" &&
            (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
            title.charAt(index - 1).search(/[^\s-]/) < 0) {
            return match.toLowerCase();
        }
        if (match.substr(1).search(/[A-Z]|\../) > -1) {
            return match;
        }
        return match.charAt(0).toUpperCase() + match.substr(1);
    });
}; //better one

var _existingEvents = {};
var _setExistingEvents = function(event) {
    _existingEvents = _existingEvents || {};
    _existingEvents[event.id] = event;
    return _existingEvents;
}; //eo setExistingEvents
var _getExistingEvents = function(id) {
    _existingEvents = _existingEvents || {};
    return _existingEvents.hasOwnProperty(id) ? _existingEvents[id] : null;
}; //eo _getExistingEvents
var _addOldEvents = function(groupId, childId, parentId, orgId) {
    var Parse = _parse;
    var parentId = parentId;
    var childId = childId;
    var Today = new Date();
    var Event = Parse.Object.extend("Event", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var query = Event.query();
    var deferred = $.Deferred();
    var createUserEventRelation = function(parentId, eventId, groupType) {
        var UserEventRelation = Parse.Object.extend("UserEventRelation");
        var relation = new UserEventRelation();
        var deferred = $.Deferred();
        childId = childId ? [childId] : [];
        relation.set("childIdList", childId);
        relation.set("eventId", eventId);
        relation.set("groupType", groupType);
        relation.set("isRead", false);
        relation.set("isUpdated", false);
        relation.set("parentId", parentId);
        relation.save();
        deferred.resolve();
        return deferred;
    }; //eo createUserEventRelation
    var isUserEventRelationExist = function(parentId, eventId, groupType) {
        var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserEventRelation.query();
        var deferred = $.Deferred();
        query.equalTo("parentId", parentId);
        query.equalTo("eventId", eventId);
        query.find({
            success: function(results) {
                if (results.length > 0) {
                    var eventRelation = results[0];
                    if (childId) {
                        eventRelation.addUnique("childIdList", childId);
                        eventRelation.save();
                        deferred.resolve();
                    }
                } else {
                    createUserEventRelation(parentId, eventId, groupType)
                        .then(function() {
                            deferred.resolve();
                        });
                }
            },
            error: function(error) {
                console.log('Error: ' + JSON.stringify(error));
                deferred.resolve();
            }
        }); //eo query.find
        return deferred;
    }; //eo isUserEventRelationExist
    var createEmails = function(event, groupId, orgId, parentId) {
        var customListId, customListName, customInfo = {};
        var data = {
            "allDay": event.get("isAllDay"),
            "end": event.get("endDateTime"),
            "location": event.get("location"),
            "note": event.get("note"),
            "repeat": event.get("repeat"),
            "start": event.get("startDateTime"),
            "title": event.get("title"),
            "until": event.get("untilDate")
        };

        _updateInfoCustomListToEmail(groupId).then(function(d) {
            if (d != undefined) {
                window.customListId = d[0].customListId;
                window.customListName = d[0].customListName;
            }
        }); // get information user custom list

        var deferred = $.Deferred();
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", parentId);
        query.find({
            success: function(results) {
                var parent = results[0];
                var parentEmail, Email, email;
                if (parent.get("isEmailDelivery")) {
                    parentEmail = parent.get("email");
                    if (_emailList.indexOf(parentEmail) === -1) {
                        _emailList.push(parentEmail);
                    }
                    Email = Parse.Object.extend('Email');
                    email = new Email();
                    email.set("data", data);
                    email.set("organizationId", orgId);
                    email.set("groupId", groupId);
                    email.set("recipientAddress", _emailList);
                    email.set("type", "event");
                    email.set("customListId", window.customListId);
                    email.set("customListName", window.customListName);
                    email.save();
                }
                deferred.resolve();
            },
            error: function(error) {
                console.log('Error: ' + JSON.stringify(error));
                deferred.resolve();
            }
        });

        return deferred;
    }; //eo createEmails

    query.equalTo("orgIdForThisObject", groupId); //orgIdForThisObject is now groupId
    query.greaterThanOrEqualTo("startDateTime", Today); //no events from the past
    query.ascending("startDateTime");
    query.limit(500);
    query.find({
        success: function(results) {
            var promises = [];
            var sentRepeatId = [];
            $.each(results, function(i, event) {
                var eventId = event.id;
                var groupType = event.get("groupType");
                var deferred;

                // parentId ? isUserEventRelationExist(parentId, eventId, groupType) : findParentId();
                deferred = isUserEventRelationExist(parentId, eventId, groupType);
                promises.push(deferred);

                if (event.get('repeat').trim() === "Never") {
                    deferred = createEmails(event, groupId, orgId, parentId);
                } else {

                    if (sentRepeatId.indexOf(_getRepeatId(event.get('repeatId'))) < 0) {
                        deferred = createEmails(event, groupId, orgId, parentId);
                        sentRepeatId.push(_getRepeatId(event.get('repeatId')));
                    }
                }

                promises.push(deferred);
            });
            $.when.apply($, promises).always(function() {
                deferred.resolve();
            });
        }, //eo success
        error: function(error) {
            console.log('Error: ' + JSON.stringify(error));
            deferred.resolve();
        }
    }); //eo query.find
    return deferred;
}; //eo _addOldEvents
var _addOldHomework = function(groupId, childId, parentId, orgId) {
    var Parse = _parse;
    var parentId = parentId;
    var childId = childId;
    var Today = new Date();
    var Homework = Parse.Object.extend("Homework", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var query = Homework.query();
    var deferred = $.Deferred();
    var createUserHomeworkRelation = function(parentId, homeworkId, groupType) {
        var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation");
        var relation = new UserHomeworkRelation();
        var deferred = $.Deferred();
        childId = childId ? [childId] : [];
        relation.set("childIdList", childId);
        relation.set("homeworkId", homeworkId);
        relation.set("groupType", groupType);
        relation.set("isRead", false);
        relation.set("isUpdated", false);
        relation.set("parentId", parentId);
        relation.save();
        deferred.resolve();
        return deferred;
    }; //eo createUserHomeworkRelation
    var isUserHomeworkRelationExist = function(parentId, homeworkId, groupType) {
        var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = UserHomeworkRelation.query();
        var deferred = $.Deferred();
        query.equalTo("parentId", parentId);
        query.equalTo("homeworkId", homeworkId);
        query.find({
            success: function(results) {
                if (results.length > 0) {
                    var homeworkRelation = results[0];
                    if (childId) {
                        homeworkRelation.addUnique("childIdList", childId);
                        homeworkRelation.save();
                        deferred.resolve();
                    }
                } else {
                    createUserHomeworkRelation(parentId, homeworkId, groupType)
                        .then(function() {
                            deferred.resolve();
                        });
                }
            },
            error: function(error) {
                console.log('Error: ' + JSON.stringify(error));
                deferred.resolve;
            }
        }); //eo query.find
        return deferred;
    }; //eo isUserHomeworkRelationExist
    var createEmails = function(homework, groupId, orgId, parentId) {
        var data = {
            "due": homework.get("dueDate"),
            "note": homework.get("note"),
            "repeat": homework.get("repeat"),
            "assigned": homework.get("assignedDate"),
            "title": homework.get("title")
        };

        _updateInfoCustomListToEmail(groupId).then(function(d) {
            if (d != undefined) {
                window.customListIdHomework = d[0].customListId;
                window.customListNameHomework = d[0].customListName;
            }
        }); // get information user custom list
        var deferred = $.Deferred();
        var query = new Parse.Query(Parse.User);
        query.equalTo("objectId", parentId);
        query.find({
            success: function(results) {
                var parent = results[0];
                if (parent.get("isEmailDelivery")) {
                    var parentEmail = parent.get("email");
                    if (_emailList.indexOf(parentEmail) === -1) {
                        _emailList.push(parentEmail);
                    }
                    var Email = Parse.Object.extend('Email');
                    var email = new Email();
                    email.set("data", data);
                    email.set("organizationId", orgId);
                    email.set("groupId", groupId);
                    email.set("recipientAddress", _emailList);
                    email.set("type", "homework");
                    email.set("customListId", window.customListIdHomework);
                    email.set("customListName", window.customListNameHomework);
                    email.save();
                    deferred.resolve();
                }
            },
            error: function(error) {
                console.log('Error: ' + JSON.stringify(error));
                deferred.resolve();
            }
        });

        return deferred;
    }; //eo createEmails
    query.equalTo("orgIdForThisObject", groupId); //orgIdForThisObject is now groupId
    query.greaterThanOrEqualTo("dueDate", Today); //no events from the past
    query.find({
        success: function(results) {
            var promises = [];
            $.each(results, function(i, homework) {
                var homeworkId = homework.id;
                var groupType = homework.get("groupType");
                var deferred;
                // parentId ? isUserEventRelationExist(parentId, homeworkId, groupType) : findParentId();
                deferred = isUserHomeworkRelationExist(parentId, homeworkId, groupType);
                promises.push(deferred);
                deferred = createEmails(homework, groupId, orgId, parentId);
                promises.push(deferred);
            });
            $.when.apply($, promises).always(function() {
                deferred.resolve();
            });
        }, //eo success
        error: function(error) {
            console.log('Error: ' + JSON.stringify(error));
            deferred.resolve();
        }
    }); //eo query.find
    return deferred;
}; //eo _addOldHomework
var _updateInfoCustomListToEmail = function(groupId) {
    var Parse = _parse;
    var deferred = $.Deferred();
    var customlistId, customListName;
    var custlistInfo = [];
    var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var query = UserCustomList.query();

    function success(results) {
        $.each(results, function(i, result) {
            var customListId = result.id;
            var customListName = result.get('name');
            custlistInfo.push({
                customListId: customListId,
                customListName: customListName
            });
        });
        deferred.resolve(custlistInfo);
    }; //eo success
    function error(err) {
        deferred.resolve(custlistInfo);
    };

    query.equalTo("groupId", groupId);
    query.find({
        success: success,
        error: error
    });
    return deferred;
}; //eo update Info custom list
// update selection repeat
var _updateSelectedRepeat = function(textRepeat, arrRepeat) { // eo update selected repeat
    var textRepeat = textRepeat;
    var tagsRepeat = arrRepeat;
    $(tagsRepeat).find('> div').addClass('hidden');
    $.each(tagsRepeat, function(idx, tagRepeat) {
        if ($(tagRepeat).find('> span').text() === textRepeat.trim()) {
            $(tagRepeat).find('> div').removeClass('hidden');
        }
    });
};
//init first push notification when create user or login
var _initFirstPushNotification = function(user, spinner, proxy) {
    var Parse = _parse;
    if (window.plugins != undefined) {
        // Edit by phuongnh@vinasource.com
        // will use
        var iOS = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
        var iAndroid = cordova.platformId === 'android';

        var pushNotification = window.plugins.pushNotification;
        var currentUser = user;
        var pushConfig = {
            badge: "true",
            sound: "true",
            alert: "true",
            ecb: "_onNotificationAPN"
        };
        pushConfig = {
            android: {
                senderID: '908497910909',
                sound: true,
                vibrate: true,
                clearNotifications: true,
                iconColor: '#ffffff',
                icon: 'icon',
                forceShow: true
            },
            ios: {
                badge: true,
                sound: true,
                alert: true
            }
        }


        if (!_pushNotification) {
            _pushNotification = PushNotification.init(pushConfig);
        }

        function initParsePushNotification(user, spinner, proxy) {
            function deviceToken() {
                var Installation = Parse.Object.extend("Installation", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                var query = Installation.query();

                function success(results) {
                    if (results.length > 0) {
                        return;
                    }
                    //Create Parse Installation Id for this user

                    // Edit by phuongnh@vinasource.com
                    // add more config for android platform
                    proxy.REST.post('installations', {
                            "appIdentifier": _appIdentifier, //Chanat, ToDo: We should use a global var instead of plain text
                            "appName": _AppName,
                            "appVersion": _AppVersion,
                            "deviceType": cordova.platformId,
                            "GCMSenderId": _senderID,
                            "deviceToken": _deviceToken,
                            "pushType": iAndroid ? 'gcm' : undefined,
                            "channels": [""],
                            "installationId": _generateUUID(),
                            "timeZone": getTimeZone(),
                            "userId": user.id
                        },
                        function(o) {
                            //Success    _parseInstallation = o;
                            cordova.plugins.notification.badge.set(0);
                            console.log('Post Parse Installation Object Success:' + JSON.stringify(o));
                        },
                        function(o) {
                            //error    _alert('Post Parse Installation Object Error:' + JSON.stringify(o));
                            console.log('Post Parse Installation Object Error:' + JSON.stringify(o));
                        }
                    );
                }; //success

                function error(error) {
                    console.log('have error when call query');
                    spinner.hide();
                };

                query.equalTo("userId", user.id);

                // Edit by phuongnh@vinasource.com
                // must check platform before call query
                iAndroid ? query.equalTo("GCMSenderId", _senderID) : query.equalTo("deviceToken", _deviceToken);

                //var spinner = _createSpinner('spinner');
                query.find({
                    success: success,
                    error: error
                }); //eo find push installations for this user's device
            }; //eo deviceToken

            (iOS || iAndroid) && _deviceToken ? deviceToken() : $.noop();
        };

        function errorHandler(error) {
            if (_isMobile()) {
                _alert('Error: Push register ' + error);
            }
        }; // result contains any error description text returned from the plugin call
        function tokenHandler(result) {
            // Your iOS push server needs to know the token before it can push to this device
            // here is where you might want to send it the token for later use.
            _deviceToken = result; //   console.log("Token: " + _deviceToken);
            initParsePushNotification(currentUser, spinner, proxy);
        };
        //pushNotification.register(tokenHandler,errorHandler, pushConfig); //Init Push Notification (Official Phonegap Plugin)
        // pushNotification.init(pushConfig); //Init Push Notification (Official Phonegap Plugin)
        /*
            Add by: phuongnh@vinasource.com
            fix issue spinner loading never stop when login user
        */
        console.log('_pushNotification');
        console.log(_pushNotification);
        console.log('deviceToke:', _deviceToken);
        pushNotification = _pushNotification;

        // Add by phuongnh@vinasource.com
        // after login, will check which platform, if is iOS or Android then need register notification with Parse

        if ((iOS || iAndroid) && _deviceToken) {
            tokenHandler(_deviceToken);

            document.addEventListener("resume", function() {
                _isForegroundMode = true;
            }, false);

            document.addEventListener("pause", function() {
                console.log('app is running background mode from utils');
                _isForegroundMode = false;
            }, false);
        }

        _pushNotification.on('error', function(e) {
            console.log('error', e.message);
            errorHandler();
        });

        _pushNotification.on('registration', function(data) {
            console.log('registration');
            tokenHandler(data);
        });

        _pushNotification.on('notification', function(data) {
            console.log('notification');
            console.log(data);
            if (iOS || iAndroid) {
                _onNotificationAPN(data);
                // Edit by phuongnh@vinasource.com
                // make sure after show notification, will set icon badge to 1
                cordova.plugins.notification.badge.set(1);
            }
        });

    }

};

_calendar.initialized = false;
var _initCalendar = function() {
    var deffer = $.Deferred();

    if (!_calendar.initialized) {
        window.plugins.calendar.listCalendars(function(o) {
            _calendar.list = o;
            _calendar.initialized = true;
            deffer.resolve(o);
        }, function(error) {
            deffer.resolve(null);
            console.log(error);
        });
    } else {
        setTimeout(function() {
            deffer.resolve(_calendar.list);
        }, 10);
    }
    return deffer;
};

var _showCalendarPicker = function(whichCalendarToSync, callBack) {
    var calendarPickerList = $('#calendar-picker-list');
    calendarPickerList.empty();

    setTimeout(function() { // Need to setTimeout otherwise there is exception "multiple locks on web thread not allowed"
        _initCalendar().then(function(calendars) {
            if (calendars && calendars.length > 0) {
                $("<div class='time' name='None'><span>None</span><div class='checked hide'><i class='icon-fontello-ok'></i></div></div>").appendTo(calendarPickerList);

                $.each(calendars, function(idx, option) {
                    var eleListCalendar = "<div class='time' name='" + option.name + "'><span>" + option.name + "</span>";
                    eleListCalendar += "<div class='checked hide'><i class='icon-fontello-ok'></i></div></div>"
                    $(eleListCalendar).appendTo(calendarPickerList);
                });

                $('#calendar-picker .time-wrapper .time').on('click', function() {
                    $('#calendar-picker').hide();
                    callBack($(this).attr("name"));

                });
                $('#calendar-picker .time-wrapper .time[name="' + whichCalendarToSync + '"]').find('.checked').removeClass('hide');
                $('#calendar-picker').show();
            }
        });
    }, 100);
}

var _autoSyncWithCalendar = function(forceResetSync) {
    require(['calendarAutoSync'], function(calendarAutoSync) {
        calendarAutoSync.autoSyncWithCalendar(_getUserData().id, forceResetSync);
    });
}

// edit repeat event
var _createNewEvent = function(user, eventData) {
    var Parse = _parse;
    var Event = Parse.Object.extend("Event");
    var event = new Event();
    event.set("title", eventData.get("title"));
    event.set("location", eventData.get("location"));
    event.set("isAllDay", eventData.get("isAllDay"));
    event.set("startDateTime", eventData.get("startDateTime")); //not a string, a Date object
    event.set("endDateTime", eventData.get("endDateTime"));
    event.set("repeat", eventData.get("repeat"));
    event.set("until", eventData.get("until"));
    event.set("untilDate", eventData.get("untilDate"));
    event.set("reminder", eventData.get("reminder"));
    event.set("reminder2", eventData.get("reminder2"));
    event.set("note", eventData.get("note"));
    event.set("sendToCustomListId", eventData.get("sendToCustomListId"));
    event.set("senderId", user.id);
    event.set("groupType", user.get("groupType"));
    event.set("orgIdForThisObject", user.get("groupId"));
    event.set("isCanceled", false);
    return event;
};
var _createRepeatingEvents = function(userCustomListData, rootEvent, updateSendId) {

    var title; //add 'Repeating: ' to occurences
    var repeatEvents = [];
    var freq;
    var interval = 1;
    var occurrences = {}; //need to keep track of both start and end dates for each

    var r = rootEvent.get('repeat').trim().toLowerCase();
    //event.set('repeatId', repeatId);
    if (r.indexOf('day') >= 0) {
        freq = RRule.DAILY;
    } else if (r.indexOf('2') >= 0) { //order here is important 2 weeks and week
        freq = RRule.WEEKLY;
        interval = 2;
    } else if (r.indexOf('week') >= 0) {
        freq = RRule.WEEKLY;
    } else if (r.indexOf('month') >= 0) {
        freq = RRule.MONTHLY;
    } else if (r.indexOf('year') >= 0) {
        freq = RRule.YEARLY;
    }

    var dtstart = new Date(rootEvent.get("startDateTime"));
    var dtStartUntil = moment(rootEvent.get("untilDate")).endOf("day").toDate();
    var startRule = new RRule({
        freq: freq,
        interval: interval,
        dtstart: dtstart,
        //until: until
        until: dtStartUntil
    });
    occurrences.start = startRule.all();

    var dtend = new Date(rootEvent.get("endDateTime"));
    var dtUntilEnd = moment(dtend).add(moment(dtStartUntil).diff(moment(dtstart), "day"), "day").toDate();
    var endRule = new RRule({
        freq: freq,
        interval: interval,
        dtstart: dtend,
        //until: until
        until: dtUntilEnd
    });
    occurrences.end = endRule.all();
    for (var i = 1; i < occurrences.start.length; i++) {
        var event = _createNewEvent(userCustomListData, rootEvent);
        var indexRepeat = rootEvent.get('repeatId').lastIndexOf(_firstRepeat());
        var newRepeatId = rootEvent.get('repeatId').substring(0, indexRepeat);
        title = rootEvent.get('title');
        event.set('title', title);
        event.set('startDateTime', occurrences.start[i]);
        event.set('endDateTime', occurrences.end[i]);
        event.set('repeatId', newRepeatId);
        event.set('senderId', updateSendId);
        repeatEvents.push(event);
    };
    return repeatEvents;
}; //eo createRepeatingEvents
var _saveRepeatingEvents = function(repeatEvents, userCustomListData, user) {
    var Parse = _parse;
    Parse.Object.saveAll(repeatEvents, {
        success: function(d) {
            for (var i = 0; i < d.length; i++) {
                _setUserEventsItem(d[i].id, d[i].attributes); //Update local storage
                _setEventLocalNotification(d[i]);
            }
            _createUserRepeatEventRelations(d, userCustomListData, user);
        }, //eo success
        error: function(err) {
                // An error occurred while saving one of the objects.
                _alert('Internal Error: Unable to save repeating events to system calendar:' + err);
            } //eo error
    }); //eo saveAll
}; //eo saveRepeatingEvents
var _createUserRepeatEventRelations = function(repeatEvents, userCustomListData, user) {
    var Parse = _parse;
    if (repeatEvents === null || !repeatEvents.length) return;
    var recipientList = userCustomListData.get("recipientList");
    var isUserOnListOfRecipients = false;
    var parentIdList = [];
    var relations = [];
    var _autoSyncEvent = [];
    var _autoSyncEventRelations = [];
    var _autoSync = false;
    var repeatId;
    var firstRepeat = _firstRepeat();
    var relation = null;
    var recipient = null;
    var parentId = null;
    var childrenIdList = null;
    var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var queryIOS = new Parse.Query(Parse.Installation);
    var _event, eventId;
    var j = 0;
    var setRelation = function(userParentId) {
        relation = new UserEventRelation();
        relation.set("eventId", eventId);
        relation.set("isRead", false);
        relation.set("isUpdated", false);
        relation.set("parentId", userParentId);
        relation.set("childIdList", childrenIdList);
        relation.set("groupType", userCustomListData.get("groupType"));
        relation.set("groupId", userCustomListData.get("groupId"));
        relation.set("organizationId", userCustomListData.get("organizationId"));
    };
    //console.log('in createUserRepeatEventRelations');
    //start event wrap
    var firstEventId = repeatEvents[0].id;
    var getEventRelation = function(result) {
        var childIdList = result.get('childIdList') || [];
        var eventId = result.get('eventId');
        var groupType = result.get('groupType');
        var isRead = result.get('isRead');
        var isUpdated = result.get('isUpdated');
        var parentId = result.get('parentId');
        var objectId = result.id;
        var createdAt = result.createdAt.toISOString();
        var updatedAt = result.updatedAt.toISOString();
        return {
            childIdList: childIdList,
            eventId: eventId,
            groupType: groupType,
            isRead: isRead,
            isUpdated: isUpdated,
            parentId: parentId,
            objectId: objectId,
            createdAt: createdAt,
            updatedAt: updatedAt
        };
    }; //eo getEventRelation
    function processRepeatEvents(first, last, sendPush, user) { //need this function to send push only with the first event
        var i = 0;
        relations = [];
        parentIdList = []; //make sure there won't be any duplicates
        for (j = first; j < last; j++) {
            _event = repeatEvents[j];
            eventId = _event.id;
            repeatId = _event.get('repeatId'); //the first of the repeat group will have a '-0' attached to the repeatId
            if (repeatId) {
                _autoSync = repeatId.indexOf(firstRepeat) < 0 ? false : true; //flag whether to autosync
                _autoSync ? _autoSyncEvent.push(_event) : $.noop();
            } else {
                _alert('createUserRepeatEventRelations error, missing repeatId, eventId:' + eventId);
                continue; //skip this
            } //eo check on repeatId
            for (i = 0; i < recipientList.length; i++) {
                recipient = recipientList[i];
                parentId = recipient.parent;
                parentIdList.push(parentId); //Collect audience ids to send push notification
                childrenIdList = recipient.children;
                setRelation(parentId);
                relations.push(relation);
                if (user.id == parentId) {
                    isUserOnListOfRecipients = true;
                    _autoSyncEventRelations.push(relation);
                }
            } //eo for over recipientList.length
            if (!isUserOnListOfRecipients) {
                //Now, also create UserEventRelation for the creator so that they can see their own messages
                childrenIdList = [];
                setRelation(user.id);
                relations.push(relation);
                _autoSyncEventRelations.push(relation);
            } //eo if (!isUserOnListOfRecipients)
        } //eo for over repeatEvents.length
        Parse.Object.saveAll(relations, {
            success: function(results) {
                var parentId, eventRelation;
                var result;

                function repeatingResults() {
                    $.each(results, function(i, result) {
                        var parentId = result.get('parentId');
                        var eventRelation = getEventRelation(result);
                        if (i === 0) {
                            return;
                        } //have already processed this one
                        //Update content after creator's relation is created
                        result && result.id && user.id === parentId ? _setUserEventRelationsItem(result.id, eventRelation) : $.noop();
                    });
                };
                if (results.length > 0) {
                    result = results[0];
                } else {
                    return;
                }
                var parentId = result.get('parentId');
                var eventRelation = getEventRelation(result);
                //Update content after creator's relation is created
                result && result.id && user.id === parentId ? _setUserEventRelationsItem(result.id, eventRelation) : $.noop();
                //add flag to only push the first one for repeating?
                //sendPush ? _postCreateUserEventRelations(firstEventId, parentId, parentIdList, _autoSyncEvent, _autoSyncEventRelations, true, user) : $.noop();
                results.length > 1 ? repeatingResults() : $.noop();
            },
            error: function(error) {
                console.log("Could not saveAll createUserRepeatEventRelations: E02")
            }
        }); //eo Parse.Object.saveAll
    }; //eo processRepeatEvents
    processRepeatEvents(0, 1, true, user); //the first instance of a repeating event gets a push
    processRepeatEvents(1, repeatEvents.length, false, user); //all others do not
}; //eo createUserRepeatEventRelations
var _postCreateUserEventRelations = function(eventId, parentId, parentIdList, autoSyncEvent, autoSyncEventRelations, isRepeating, user) {
    var Parse = _parse;
    var index = 0,
        last = 0;
    var promise = null;
    var chunks = null; //array of arrays of parentIds
    var chunk = null //one chunk
    var chunkSize = 1; //test using size one chunks
    function quit() {
        //   console.log('new event pushes complete, redirect');
        promise ? promise.resolve() : $.noop(); //resolve the top-level promise to go to the next/final step postprocess
    }; //eo quitSend
    function uniqueParentIdList(arr) {
        var o = {};
        var list = [];
        var len = arr.length;
        var i = 0,
            j = 0;
        var item;
        for (i = 0; i < len; i++) {
            item = arr[i];
            if (o[item] === true) {
                continue;
            }
            o[item] = true;
            list[j++] = item;
        }
        return list;
    }; //eo uniqueParentIdList

    function sendPush(promise) {
        var queryIOS = new Parse.Query(Parse.Installation);
        var lagTime = Math.round(Math.random() * _pushSpreadTime); //random 0 - 30 minutes, from vars.js#287
        var push_time;
        var pushPrefix = isRepeating ? 'New Repeating Event: ' : 'New Event: ';
        //var title;
        function success() {
            console.log('Success push for chunk index:' + index + ' pushTime:' + push_time.toString() + ' parentIdList:' + JSON.stringify(chunk));
            ++index; //go to the next batch
            promise.resolve(new Parse.Promise()); //recursion magic
        }; //eo success
        function error() {
            console.log('Error push for chunk index:' + index + ' pushTime:' + push_time.toString() + ' parentIdList:' + JSON.stringify(chunk));
            ++index; //go to the next batch
            promise.resolve(new Parse.Promise()); //recursion magic
        }; //eo error
        promise = promise || new Parse.Promise(); //first time we send, there is no promise, so create one for recursion
        if (index >= last) { //have finished sending everything
            quit();
            return;
        }
        //recursion here:
        promise.then(sendPush, quit); //bind a recursive send until d.index === n call quitSend if error
        //get addresses to send to
        chunk = chunks[index];
        queryIOS.containedIn('userId', chunk);
        // title = "New event: " + title.substring(0, 200) + "..."; //title
        push_time = moment().add(lagTime, 's').toDate(); //when
        // console.log('Queueing push for chunk index:'+index+' pushTime:'+push_time.toString()+' parentIdList:'+JSON.stringify(chunk));
        Parse.Push.send({
            where: queryIOS,
            push_time: push_time,
            data: { ////note: the alert title MUST contain the word 'event'
                //"alert": pushPrefix + title.substring(0, 200),
                badge: 1,
                type: _Event_Type,
                sound: "default",
                'content-available': 1,
                'sender': user.id,
                'objectId': eventId
            }
        }, {
            useMasterKey: true,
            success: success,
            error: error
        });
    }; //eo sendPush
    //Get rid of user id from the parentIdList then send push notificaiton
    if (parentIdList.indexOf(user.id) != -1) {
        index = parentIdList.indexOf(user.id);
        parentIdList.splice(index, 1);
    }
    //get rid of duplicates
    parentIdList = uniqueParentIdList(parentIdList);
    //chunk up the parentIdList and send a staggered push for each
    if (parentIdList.length < 1) {
        redirectPage();
    } //no one to send to
    chunks = _chunk(parentIdList, chunkSize); //array of arrays, currently of size 1
    index = 0; //start with the first chunk
    last = chunks.length; //how many
    sendPush(); //start off the recursive loop
    //chunkFlag = chunks.length - 1; //flag next to last chunk for special handling
    //sequentialPushes(); //OK start up chain of chunked pushes, each with their own timing
}; //eo postCreateUserEventRelations
var _isValidDateTime = function(_event) {
    var endDate = moment(_event.endDate),
        startDate = moment(_event.startDate),
        untilDate = moment(_event.untilDate),
        newEndDate = new Date(endDate),
        newStartDate = new Date(startDate),
        newUntilDate = new Date(untilDate);

    if (_event.repeat.trim() != "Never") {
        return (newEndDate.getTime() > newUntilDate.getTime()) || (newStartDate.getTime() > newUntilDate.getTime()) ? false : true;
    } else {
        return (_event.endDate.getTime() < _event.startDate.getTime()) ? false : true;
    }
};
var _convertSingleToRepeatEvent = function(eventData) {
    var Parse = _parse;
    var user = _getUserData();
    var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var updateSendId = user.id;
    var query = UserCustomList.query();
    query.equalTo("ownerId", user.id);
    query.equalTo("objectId", _selectedCustomListId);
    query.find({
        success: function(results) {
            var userCustomListData = results[0];
            if (eventData.get("repeat").trim() != "Never") {
                var repeatEvents = _createRepeatingEvents(userCustomListData, eventData, updateSendId);
                _saveRepeatingEvents(repeatEvents, userCustomListData, user);
            }
        }, //eo success query.find
        error: function(err) {
                _alert("Internal error, could not create the new event:" + err.message);
            } //eo error query.find
    }); //eo query.find
};
var _terminateRepeatEvent = function(originalServerEvent) {
        var Parse = _parse;
        var deffer = $.Deferred();
        var startDate = new Date(originalServerEvent.attributes.startDateTime);

        var groupId = originalServerEvent.get("orgIdForThisObject");
        var eventObject = Parse.Object.extend("Event", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = eventObject.query();
        var updatedEvents = [];
        var removedEvents = [];
        var removedEventIds = [];
        query.equalTo("orgIdForThisObject", groupId); //orgIdForThisObject is now groupId
        query.startsWith("repeatId", _getRepeatId(originalServerEvent.attributes.repeatId));
        query.ascending("startDateTime");
        query.find({
            success: function(results) {
                var newUntilDateTime = null;
                for (var i = results.length - 1; i >= 0; i--) {
                    if (startDate > results[i].get("startDateTime")) {
                        newUntilDateTime = moment(new Date(results[i].get("startDateTime"))).endOf('Day').toDate();
                        break;
                    }
                }

                var newUntilDate = moment(newUntilDateTime).format('MM/DD/YY');
                $.each(results, function(i, event) {
                    if (event.id !== originalServerEvent.id) { // Don't process event which is being eddited.
                        if (new Date(event.attributes.startDateTime).getTime() < startDate.getTime()) {
                            //update item event
                            event.set('untilDate', newUntilDateTime);
                            event.set('until', newUntilDate);
                            updatedEvents.push(event);
                        } else {
                            removedEvents.push(event);
                            removedEventIds.push(event.id);
                        }
                    }
                });

                Parse.Object.saveAll(updatedEvents)
                    .then(function(serverUpdatedEvents) {
                        _updateEventLocalStorge(serverUpdatedEvents);
                    })
                    .then(function() {
                        Parse.Object.destroyAll(removedEvents);
                        removedEvents.forEach(function(deletedEvent) {
                            deletedEvent.set('reminder', 'Never');
                            deletedEvent.set('reminder2', 'Never');
                            _setEventLocalNotification(deletedEvent);
                        });

                    })
                    .then(function() {
                        _removeEventRelation(removedEventIds);
                    })
                    .always(function() {
                        deffer.resolve(originalServerEvent);
                    });
            }, //eo success
            error: function(error) {
                console.log('Error: ' + JSON.stringify(error));
                deffer.reject();
            }
        });
        return deffer;

    } //eo query.find

var _updateEventLocalStorge = function(arrayEventUpdateLocalStore) {
    var arrayLocalEvent = _getUserLocalStorage('events');
    $.each(arrayEventUpdateLocalStore, function(idx, event) {
        var lenArrayEventStorge = arrayLocalEvent.length;
        for (var i = 0; i < lenArrayEventStorge; i++) {
            if (arrayLocalEvent[i].objectId === event.id) {
                event.attributes.objectId = arrayLocalEvent[i].objectId;
                arrayLocalEvent[i] = event.attributes;
                break;
            }
        }
    });
    _setUserLocalStorage('events', arrayLocalEvent);
};
var _removeEventRelation = function(removedEventIds) {
    var Parse = _parse;
    var UserEventRelation = Parse.Object.extend("UserEventRelation", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var query = UserEventRelation.query();
    var removeEventFromLocalStorge = function(removedEventIds) {
        var arrayLocalEvent = _getUserLocalStorage('events');
        var arrayLocalEventRelation = _getUserLocalStorage('eventRelations');

        $.each(removedEventIds, function(idx, eventId) {
            var lenArrayEventStorge = arrayLocalEvent.length;
            for (var i = 0; i < lenArrayEventStorge; i++) {
                if (arrayLocalEvent[i].objectId === eventId) {
                    arrayLocalEvent.splice(i, 1);
                    break;
                }
            }
        });
        $.each(removedEventIds, function(idx, eventId) {
            var lenArrayEventStorge = arrayLocalEventRelation.length;
            for (var i = 0; i < lenArrayEventStorge; i++) {
                if (arrayLocalEventRelation[i].eventId === eventId) {
                    arrayLocalEventRelation.splice(i, 1);
                    break;
                }
            }
        });

        _setUserLocalStorage('events', arrayLocalEvent);
        _setUserLocalStorage('eventRelations', arrayLocalEventRelation);
    };

    removeEventFromLocalStorge(removedEventIds);
};

var _updateListEventsInGroup = function(_eventView, repeatId, arrUpdateEvent) {
    var Parse = _parse;
    var Event = Parse.Object.extend("Event", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var query = Event.query();
    var repeatIdList = repeatId.split('-');
    query.equalTo('repeatId', repeatIdList[0]);
    query.limit(100);
    query.find({
        success: function(results) {
            $.each(results, function(idx, result) {
                var event = result;
                //set event data here
                //Update event
                event.set('title', _eventView.title);
                event.set('location', _eventView.location);
                event.set('allday', _eventView.allday);

                //event.set('startDate', _event.startDate);
                //event.set('startDateTime', _event.startDate);
                //event.set('endDate', _event.endDate);
                //event.set('endDateTime', _event.endDate);
                event.set('untilDate', _eventView.untilDate);
                event.set('until', _eventView.until);
                event.set('repeat', _eventView.repeat);
                event.set('reminder', _eventView.reminder);
                event.set('reminder2', _eventView.reminder2);
                event.set('note', _eventView.note);
                event.set('isModifySingleEvent', false);
                //save onto parse
                //event.save(null, { success: saveSuccess, error: saveError });
                arrUpdateEvent.push(event);
            });
            Parse.Object.saveAll(arrUpdateEvent);
            _updateEventLocalStorge(arrUpdateEvent, repeatId);
        },
        error: function(error) {
            console.log(error);
        }
    });
}; // update list events group have repeats
var _updateSomeFieldsInstancesEventFromCurEvent = function(_eventView, eventData) {
    var Parse = _parse;
    var repeatId = eventData.get("repeatId");
    var startDate = eventData.get("startDateTime");
    var Event = Parse.Object.extend("Event", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var query = Event.query();
    query.equalTo("repeatId", repeatId);
    query.greaterThanOrEqualTo("startDateTime", startDate);
    query.find({

        success: function(results) {
            var arrAllInstancesEvent = [];
            $.each(results, function(i, event) {
                //set event data here
                //Update event
                if (window.isChangeDateTimeEvent) {
                    event.set('startDate', _eventView.startDate);
                    event.set('startDateTime', _eventView.startDate);
                    event.set('endDate', _eventView.endDate);
                    event.set('endDateTime', _eventView.endDate);
                }
                event.set('title', _eventView.title);
                event.set('location', _eventView.location);
                event.set('allday', _eventView.allday);
                event.set('reminder', _eventView.reminder);
                event.set('reminder2', _eventView.reminder2);
                event.set('note', _eventView.note);
                event.set('isModifySingleEvent', false);

                arrAllInstancesEvent.push(event);
            });
            //save onto parse
            Parse.Object.saveAll(arrAllInstancesEvent);
            _updateEventLocalStorge(arrAllInstancesEvent, repeatId);
        },
        error: function(error) {
            console.log('Error update all instances event ' + error);
        }
    });
};

var _generateRepeatId = function() {
    return chance.string({
        length: 12,
        pool: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    });
};

var _generateRootRepeatId = function() {
    return _generateRepeatId() + _firstRepeat();
};

var _isRepeat = function(repeatString) {
    return repeatString && repeatString.trim() !== "" && repeatString.trim() !== "Never";
}

/*
 * add parent and secondary parents email to UserCustomList table in the userContactEmail array
 * parentId: Parent's id of the child.
 */
var _addParentEmail = function(parentId, selectedOrgGroupId) {
    var Parse = _parse;
    var deferred = $.Deferred();
    var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var query = UserAcctAccess.query();
    query.equalTo("parentId", parentId);
    query.find({
        success: function(results) {
            return results;
        },
        error: function(error) {
            deferred.reject();
            return error;
        }
    }).then(function(results) {
        if (results.length === 0) {
            deferred.resolve();
            return;
        }

        var user = JSON.parse(localStorage.getItem("user"));
        //var selectedOrgGroupId = user.setting.selectedOrgGroupId;
        var User = Parse.Object.extend("User", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var query = User.query();
        var uList = [];
        var givenAccessUserId = [parentId];

        _.each(results, function(value) {
            givenAccessUserId.push(value.attributes.givenAccessUserId);
        });


        var accessDeferred = $.Deferred();
        //Get Email list from User table base on isEmailDelivery is true
        query.containedIn("objectId", givenAccessUserId);
        query.find({
            success: function(results) {
                if (results.length) {
                    uList = _.filter(results, function(user) {
                        return !!user.get("isEmailDelivery");
                    });

                    accessDeferred.resolve(uList);
                    //return uList;
                }
            },
            error: function(error) {
                return uList;
            }
        }).then(function(results) {

            accessDeferred.done(function() {
                if (results.length === 0) {
                    deferred.resolve();
                    return;
                }

                var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                    query: function() {
                        return new Parse.Query(this.className);
                    }
                });
                var query = UserCustomList.query();
                var userAcctAccessList = results;
                var userAcctAccessListLength = userAcctAccessList.length;

                query.equalTo("groupId", selectedOrgGroupId);
                query.find({
                    success: function(results) {
                        for (var i = 0; i < results.length; i++) {
                            var customGroup = results[i];
                            var j = 0;

                            //Add email to userContactEmail
                            for (j = 0; j < userAcctAccessListLength; j++) {
                                customGroup.addUnique("userContactEmail", userAcctAccessList[j].attributes.email);
                            }
                            customGroup.save();
                        }
                        console.log('save custom list successful');
                    },
                    error: function(error) {
                        console.log(error);
                    }
                });

                var emailList = [];
                for (var index = 0; index < userAcctAccessListLength; index++) {
                    emailList.push(userAcctAccessList[index].attributes.email);
                }
                _emailList = emailList;
                deferred.resolve(emailList);
            });

        });
    });

    return deferred;
};


/*
 * Remove parent and secondary parents email to UserCustomList table in the userContactEmail array
 * parentId: Parent's id of the child.
 * customList: List in UserCustomList table query base on group id
 * deferred: function need a deferred or not.
 */
var _deleteParentEmail = function(parentId, customList, selectedOrgGroupId) {
    var Parse = _parse;
    var query = new Parse.Query(Parse.User);
    query.equalTo("objectId", parentId);
    query.find({
        success: function(results) {
            var parentAcctListEmail = [];
            var parentUser = results[0];
            var parentEmail = parentUser.get("email");
            parentAcctListEmail.push(parentEmail);

            //Get all secondary parent base all the parentId
            var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserAcctAccess.query();
            query.equalTo("parentId", parentId);
            query.find({
                success: function(results) {

                    var user = JSON.parse(localStorage.getItem("user"));
                    //var selectedOrgGroupId = user.setting.selectedOrgGroupId;
                    var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserCustomList.query();
                    var userAcctList = results;

                    var parentAcctList = [];
                    // Get list users have givenAccessUserId
                    _.map(results, function(user) {
                        parentAcctList.push(user.get("givenAccessUserId"));
                        parentAcctListEmail.push(user.get("givenAccessUserEmail"));
                    });


                    //Get all groups relate to the child has been removed.
                    query.equalTo("groupId", selectedOrgGroupId);
                    query.find({
                        success: function(results) {
                            var parentIdList = [];
                            //get all parentId of that group
                            recipientList = _.map(results, function(value) {
                                _.each(value.get("recipientList"), function(value1) {
                                    parentIdList.push(value1.parent);
                                });
                            });
                            parentIdList = _.uniq(parentIdList); //Remove duplicate parentId

                            //One again base on parentIds of the group we get the list of secondary parent and merge them to current ParentIds
                            var UserAcctAccess = Parse.Object.extend("UserAcctAccess", {}, {
                                query: function() {
                                    return new Parse.Query(this.className);
                                }
                            })
                            var query = UserAcctAccess.query();
                            query.containedIn("parentId", parentIdList);
                            query.find({
                                success: function(results) {

                                    _.map(results, function(value) {
                                        parentIdList.push(value.get("givenAccessUserId"));
                                    });
                                    parentIdList = _.uniq(parentIdList);

                                    //Get all emails exist in parentIdList
                                    var User = Parse.Object.extend("User", {}, {
                                        query: function() {
                                            return new Parse.Query(this.className);
                                        }
                                    })
                                    var query = User.query();
                                    query.containedIn("objectId", parentIdList);
                                    query.find({
                                        success: function(results) {
                                            var userEmailList = [];
                                            _.map(results, function(value) {
                                                userEmailList.push(value.get("email"));
                                            });

                                            //Before remove email from userContactEmail column we need to make sure that email is not used for other parents
                                            _.each(parentAcctListEmail, function(value) {
                                                if (_.contains(userEmailList, value) != true) {
                                                    customList.remove("userContactEmail", value);
                                                };
                                            });

                                            customList.save();
                                        },
                                        error: function(error) {
                                            return error;
                                        }
                                    });

                                },
                                error: function(error) {
                                    return error;
                                }
                            });


                        },
                        error: function(error) {
                            console.log(error);
                        }
                    });


                },
                error: function(error) {
                    return error;
                }
            })
        },
        error: function(error) {
            console.log(error);
        }
    });
}

var _getUserContactEmailFromUserCustomList = function(orgId, groupId, parentId) {
    var Parse = _parse;
    var deferred = $.Deferred();
    var userCustomList = Parse.Object.extend("UserCustomList", {}, {
        query: function() {
            return new Parse.Query(this.className);
        }
    });
    var query = userCustomList.query();
    var emailList = [];
    query.equalTo("groupId", groupId);
    //organization is null when my group
    if (orgId !== null) {
        query.equalTo("organizationId", orgId);
    }
    //query.equalTo("ownerId", parentId);
    query.find({
        success: function(results) {
            $.each(results, function(i, item) {
                var userContactEmail = item.get("userContactEmail");
                if (userContactEmail && userContactEmail.length > 0) {

                    $.each(userContactEmail, function(j, eUser) {
                        if (emailList.indexOf(eUser) === -1) {
                            emailList.push(eUser);
                        }

                    });
                }
            });

            console.log('get user contact list successful: ' + emailList);
            deferred.resolve(emailList);
        },
        error: function(error) {
            deferred.resolve([]);
        }
    });
    return deferred;
};

var _isMobile = function() {
    return $("body").data("isMobile") && !$("body").data("isBrowser"); // check hybrid app
}

var _closeByKeyboard = function() {
    if (cordova.plugins != undefined && cordova.plugins.Keyboard != undefined) {
        cordova.plugins.Keyboard.close();
    }
}

var _customUIBrowserOnDevice = function() {
    if (navigator.vendor != undefined && navigator.vendor == "") {
        $('body').addClass('noVendor');
    }
}

/*
  Add by phuongnh@vinasource.com
  Use this function when add event to calendar from action AutoSync
 */
var _markAsAddedToCalendar = function(eventId, user) {
    var setEvent2AlreadyAdded = function(event, eventID) {
        var calendarItem = _getUserCalendarItem(eventID);

        if (calendarItem) {
            calendarItem.hasAddedToCalendar = true;
        } else {
            calendarItem = {
                hasAddedToCalendar: true
            };
        }

        if (event.attributes) {
            var title = event.attributes.title;
            var location = event.attributes.location;
            var note = event.attributes.note;
            var startDate = event.attributes.startDateTime.toISOString();
            var endDate = event.attributes.endDateTime.toISOString();
        } else {
            var title = event.title;
            var location = event.location;
            var note = event.note;
            var startDate = event.startDateTime.iso;
            var endDate = event.endDateTime.iso;
        }
        // set attributes to use if event is updated and needs to be modified
        calendarItem.title = title;
        calendarItem.location = location;
        calendarItem.note = note;
        calendarItem.startDate = startDate;
        calendarItem.endDate = endDate;
        // console.log('Mark as added event:', JSON.stringify(event));
        // console.log('53:',JSON.stringify(calendarItem));
        _setUserCalendarItem(eventID, calendarItem);
        calendarItem = _getUserCalendarItem(eventID);
        if (user) {
            user.data.calendar != undefined ? user.data.calendar.push(calendarItem) :
                (function(calendarItem) {
                    user.data.calendar = [];
                    user.data.calendar.push(calendarItem);
                }(calendarItem));
        }
    };

    console.log('_maskAsAddedToCalendar:' + eventId);
    var newEvent = _getUserEventsItem(eventId);
    setEvent2AlreadyAdded(newEvent, eventId);
    var eventRepeat = newEvent.attributes ? newEvent.attributes.repeatId : newEvent.repeatId;

    console.log('eventRepeat:' + eventRepeat);
    if (eventRepeat) {
        var repeatId = _getRepeatId(eventRepeat);
        var Parse = _parse;
        var Event = Parse.Object.extend("Event", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        })
        var eventQuery = Event.query();
        eventQuery.equalTo("repeatId", repeatId);
        eventQuery.find().then(
            function(events) {
                $.each(events, function(i, event) {
                    setEvent2AlreadyAdded(event, event.id);
                });
            },
            function() {
                console.log('Could not found any repeat events for Event (' + eventId + ')');
            }
        );
    }
};

var _getActivities = function() {
    var user = _getUserData();
    var childArray = _getUserChildren();
    var childIdArray = [];
    var childAccount = {};
    var events = _getUserEvents();
    var eventRelations = _getUserEventRelations();
    var Parse = _parse;
    var UserOrganizationGroupRelation = Parse.Object.extend(
        "UserOrganizationGroupRelation", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });

    function success(results) {
        var orgGroupIdArray = [];
        var activityIdArray = [];
        var calSyncArray = [];
        var whichCalendarArray = [];
        var alertArray = [];
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
            query: function() {
                return new Parse.Query(this.className);
            }
        });
        var queryOrgGroup = OrganizationGroup.query();
        var queryMyGroup = OrganizationGroup.query();
        var i = 0;
        var relation;

        function success(results) {
            var orgGroupIdArray = [];
            var orgGroupArray = [];
            var activities = [];
            var orgGroup;
            var i = 0;
            var activityId;
            var orgGroupId;
            var childId;
            var index;
            var orgGroup;
            var tmp;
            //now set items
            var setLocalDataAccessed = function(activityId, orgGroupValue, i) { //if child is from accessed account we do not want to override local activity settings
                var localActivity = _getUserActivitiesItem(activityId);
                if (localActivity) {
                    orgGroupValue.accessed = true;
                    orgGroupValue.calendarAutoSync = localActivity.calendarAutoSync;
                    orgGroupValue.whichCalendarToSync = localActivity.whichCalendarToSync;
                    orgGroupValue.alert = localActivity.alert;
                } else {
                    orgGroupValue.calendarAutoSync = calSyncArray[i];
                    orgGroupValue.whichCalendarToSync = whichCalendarArray[i];
                    orgGroupValue.alert = alertArray[i];
                    orgGroupValue.accessed = true;
                }
            }; //eo setLocalSettings
            var setLocalData = function(orgGroupValue, i) {
                orgGroupValue.calendarAutoSync = calSyncArray[i];
                orgGroupValue.whichCalendarToSync = whichCalendarArray[i];
                orgGroupValue.alert = alertArray[i];
            }; //eo setLocalSettings
            for (i = 0; i < results.length; i++) {
                orgGroup = results[i];
                orgGroup.get("isMyGroup") ? orgGroupIdArray.push(orgGroup.get("organizationId")) : orgGroupIdArray.push(orgGroup.id);
                orgGroupArray.push(orgGroup);
            }
            //Create activities array
            for (var i = 0; i < activityIdArray.length; i++) {
                activityId = activityIdArray[i];
                orgGroupId = activityId.split("_")[0];
                childId = activityId.split("_")[1];
                index = orgGroupIdArray.indexOf(orgGroupId);
                orgGroup = orgGroupArray[index];
                tmp = orgGroup.id;
                /*
                 * Edit by phuongnh@vinasource.com
                 * With version Parse Server open source, we can't assign change id, because Parse return Object not Json
                 */
                // orgGroup.id = activityId; //Updaet it id to be OrgGroupId + _ + ChildId
                //We want to clone an object and make change the id to compatible with the pattern above.
                //But since we cannot clone parse object directly, we are going to do some cheating here.
                //We copy the object by doing serializion and deserialization here - Chanat
                var orgGroupValue = JSON.parse(JSON.stringify(orgGroup));
                /*
                 * Edit by phuongnh@vinasource.com
                 * Will assign change id after parser to Json data
                 */
                orgGroupValue.objectId = activityId;
                // orgGroup.id = tmp;   //Reset orgGroup id
                childAccount[childId] == "accessChild" ? setLocalDataAccessed(activityId, orgGroupValue, i) : setLocalData(orgGroupValue, i);
                //console.log('Signin 788 orgGroupValue:',JSON.stringify(orgGroupValue));
                //console.log(orgGroupValue.objectId);
                activities.push(orgGroupValue);
            }
            //Update activites id to be OrgGroupId + _ + ChildId
            //   console.log(activityIdArray);
            _setUserActivities(activities);

            deferred.resolve();
        }; //eo inner success
        function error(err) {
            generalAlert(err);
            deferred.resolve();
        }; //eo error
        for (i = 0; i < results.length; i++) {
            relation = results[i];
            if (orgGroupIdArray.indexOf(relation.get("organizationGroupId")) == -1) {
                orgGroupIdArray.push(relation.get("organizationGroupId"));
            }
            calSyncArray.push(relation.get("calendarAutoSync"));
            whichCalendarArray.push(relation.get("whichCalendarToSync"));
            alertArray.push(relation.get("alert"));
            activityIdArray.push(relation.get("organizationGroupId") + "_" + relation.get("userId"));
        }
        //Download the actual orgGroup data
        queryOrgGroup.containedIn("objectId", orgGroupIdArray);
        queryMyGroup.containedIn("organizationId", orgGroupIdArray);
        var query = Parse.Query.or(queryOrgGroup, queryMyGroup);
        query.ascending("name");
        query.find({ success: success, error: error });
    }; //eo outer success
    function error(err) {
        generalAlert(err);
        deferred.resolve();
    }; //eo error
    deferred = $.Deferred(); //scope is global to background-fetch and everything else #5 :)
    for (var i = 0; i < childArray.length; i++) {
        var child = childArray[i];
        if (childIdArray.indexOf(child.id) == -1) {
            childIdArray.push(child.id);
            if (child.localColor) {
                childAccount[child.id] = "accessChild"; // child of accessed account
            } else {
                childAccount[child.id] = "userChild"; // child of user's account
            }
        }
    }

    var query = UserOrganizationGroupRelation.query();
    query.containedIn("userId", childIdArray);
    query.equalTo("relationType", "student");
    query.find({ success: success, error: error }); //eo query.find
    return deferred.promise();
}; //eo getActivities

function _createNativeEvent(event, calendarToSync) { //these are js Date objects NOT strings
    var deferred = $.Deferred();

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


    var errorAddCalendar = function(error) {
        console.log('Error adding to calendar: name: ' + event.attributes.title + ', error: ' + error);
        _alert('Calendar Autosync Error event:' + event.Id + ' ' + error);
        deferred.reject();
    };

    var successAddCalendar = function(message) {
        deferred.resolve();
    };

    function getIdText(eventId) {
        return "ID#" + eventId;
    }

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