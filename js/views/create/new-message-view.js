define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/create/new-message-template.hbs',
        'jquery',
        'parseproxy',
        'spinner',
        'parse',
        'userService'
    ],
    function(Chaplin, View, Template, $, ParseProxy, spinner, Parse, userService) {
        'use strict';
        var user;
        var selectedCustomListData;
        var initData = function() {
            user = _getUserData();
            selectedCustomListData = _getSelectedCustomListData();
        };
        //Redirect to another page once a new message is created
        var redirectPage = function() {
            spinner.hide();
            _isRedirect = true;
            Chaplin.utils.redirectTo({
                name: 'message'
            });
        }; //eo redirectPage
        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {
            initData();
            //Adjust message textarea's height
            //$("#message").height($(".innerview-container").height() - $("#email-field").height() - $("#title-field").height() - 70);
            var initMessageData = function() {
                //  console.log('initMessageData:', JSON.stringify(_message));
                _message = _message || {};
                var _title = _message.title || '';
                var _msg = _message.msg || '';
                $("#title").val(_title);
                $("#message").val(_msg);
            }; //eo initMessageData
            var saveFieldData = function() {
                var title = $("#title").val();
                var msg = $("#message").val();
                _message = {
                    title: title,
                    msg: msg
                };
                Chaplin.mediator.d = $.extend({}, _message); //make a copy, DONT simply bind the reference!
                //    console.log('saveFieldData:', JSON.stringify(_message));
            }; //eo saveFieldData
            var redirect = function() {
                spinner.hide();
                _isRedirect = true;
                switch (_view.previousView) {
                    case _view.HOME:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'home'
                        });
                        break;
                    case _view.SCHEDULE_INDEX:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'calendar'
                        });
                        break;
                    case _view.MESSAGES_INDEX:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'message'
                        });
                        break;
                    case _view.HOMEWORK_INDEX:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'homework'
                        });
                        break;
                    case _view.CREATION:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'create'
                        });
                        break;
                    default:
                        _setPreviousView();
                        Chaplin.utils.redirectTo({
                            name: 'message'
                        });
                        break;
                } //eo switch
            }; //eo redirect
            if (selectedCustomListData) {
                $("#sendto").html(selectedCustomListData.name);
                $("#sendto").addClass("right-text");
                $("#sendto").removeClass("right-arrow");
            }
            $("#backBtn").on('click', function(e) {
                _closeByKeyboard();
                _message = {}; //clean up!
                redirect();
            }); //eo backBtn click
            $("#sendto").on('click', function(e) {
                saveFieldData(); //hold on to data
                $(this).addClass("text-highlight-grey");
                setTimeout(function() {
                    _setAfterSendToView(_view.currentView);
                    Chaplin.utils.redirectTo({
                        name: 'create-sendto'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            }); //eo sendto
            //Prevent touchevent to be triggered from previous view
            setTimeout(function() {
                $("#message").removeAttr("disabled");
                $("#title").removeAttr("disabled");
            }, 1000);
            //Init more click events
            $("#doneBtn").on('click', function(e) {
                var title = $("#title").val();
                var msg = $("#message").val();
                var userCustomListData = null;
                var messageId = null;
                var parentIdList = [];
                var isUserOnOfRecipients = false;
                var done = function() { //always called at the end of the chain
                    spinner.hide();
                    _message = {};
                    redirect();
                }; //eo done
                var addUserMessageRelation = function() {
                    var deferred = $.Deferred();
                    //Now, also create UserEventRelation for the creator so that they can see their own messages
                    var UserMessageRelation = Parse.Object.extend("UserMessageRelation");
                    var relation = new UserMessageRelation();
                    var success = function(d) {
                        var id = d.id;
                        _setUserMessagesRelationsItem(id, d.attributes);
                        deferred.resolve();
                    };
                    var error = function(err) {
                        console.log("addUserEventRelation error id:", messageId + ' message:' + err.message);
                        deferred.resolve();
                    };
                    if (isUserOnOfRecipients) {
                        deferred.resolve();
                        return;
                    }
                    relation.set("messageId", messageId);
                    relation.set("isRead", false);
                    relation.set("parentId", user.id);
                    relation.set("childIdList", []);
                    relation.set("groupType", userCustomListData.get("groupType"));
                    relation.set("groupId", userCustomListData.get("groupId"));
                    relation.set("organizationId", userCustomListData.get("organizationId"));
                    relation.save(null, {
                        success: success,
                        error: error
                    }); //eo relation.save
                    return deferred;
                }; //eo addUserEventRelation
                var sendPush = function() {
                    var deferred = $.Deferred();
                    var queryIOS = new Parse.Query(Parse.Installation);
                    var o = null;
                    var success = function() {
                        deferred.resolve();
                    };
                    var error = function(err) {
                        // Handle error
                        console.log("Push Notification error... id:", messageId + ' message:' + err.message);
                        _alert("Push Notification error... id:", messageId + ' message:' + err.message);
                        deferred.resolve();
                    };
                    /*
                        Add by phuongnh@vinasource.com
                        set push type for check when listen event receive push notification from app
                     */
                    o = {
                        where: queryIOS,
                        data: { //note: the alert title MUST contain the word 'message'
                            //alert: "New message: " + title.substring(0, 80) + "...",
                            alert: "New message: " + title.substring(0, 200),
                            badge: 1,
                            type: _Message_Type,
                            sound: "default",
                            'content-available': 1, //Request clients to trigger background fetch
                            sender: user.id,
                            objectId: messageId
                        }
                    }; //eo o
                    //Send push notification for target audiences
                    queryIOS.containedIn('userId', parentIdList);
                    Parse.Push.send(o, {
                        useMasterKey: true,
                        success: success,
                        error: error
                    }); //eo Parse.push
                    return deferred;
                }; //eo sendPush
                var createUserMessageRelations = function() {
                    var deferred = $.Deferred();
                    var recipientList = userCustomListData.get("recipientList");
                    //console.log(recipientList);
                    var recipient;
                    var parentId;
                    var childrenIdList;
                    var UserMessageRelation = Parse.Object.extend("UserMessageRelation");
                    var relation = null;
                    var deferreds = [];
                    var i = 0;
                    var _createUserMessageRelations = function() {
                        var _deferred = $.Deferred();
                        var success = function(d) {
                            var id = d.id;
                            _setUserMessagesRelationsItem(id, d.attributes);
                            _deferred.resolve();
                        };
                        var error = function(err) {
                            _alert("E02 Could not create new messageRelations: " + err.message);
                            _deferred.resolve();
                        };
                        recipient = recipientList[i];
                        parentId = recipient.parent;
                        childrenIdList = recipient.children;
                        if (user.id === parentId) {
                            isUserOnOfRecipients = true;
                        }
                        relation = new UserMessageRelation();
                        relation.set("messageId", messageId); //set in createNewMessage
                        relation.set("isRead", false);
                        relation.set("parentId", parentId);
                        relation.set("childIdList", childrenIdList);
                        relation.set("groupType", userCustomListData.get("groupType"));
                        relation.set("groupId", userCustomListData.get("groupId"));
                        relation.set("organizationId", userCustomListData.get("organizationId"));
                        relation.save(null, {
                            success: success,
                            error: error
                        }); //eo relation.save
                        //Collect audience ids to send push notification
                        parentIdList.push(parentId);
                        return _deferred;
                    }; //eo inner _createUserMessageRelations
                    for (i = 0; i < recipientList.length; i++) {
                        deferreds.push(_createUserMessageRelations()); //using closure and returns a deferred specific to that messageRelation request
                    } //eo for recipientList.length
                    $.when.apply($, deferreds).then(function() {
                        userService.getLinkedAccountUserIds(parentIdList).then(
                            function(linkedUserIds) {
                                parentIdList = parentIdList.concat(linkedUserIds);
                                deferred.resolve();
                            },
                            function() {
                                deferred.reject();
                            }
                        );

                    }, function(err) {
                        _alert("E03 Could not create new messageRelations: " + err.message);
                        deferred.reject();
                    });

                    return deferred;
                }; //eo createUserMessageRelations
                var createNewMessage = function() {
                    var deferred = $.Deferred();
                    var Message = Parse.Object.extend("Message");
                    var message = new Message();
                    var _m = _message || {};
                    var date = new Date();
                    var success = function(d) { //create UserEventRelation
                        var id = d.id;
                        var createdAt = d.createdAt.toISOString();
                        var updatedAt = d.updatedAt.toISOString();
                        messageId = id; //need this in createUserMessageRelations
                        $.extend(d.attributes, {
                            createdAt: createdAt,
                            updatedAt: updatedAt,
                            objectId: id
                        });
                        _setUserMessagesItem(id, d.attributes);
                        deferred.resolve();
                    };
                    var error = function(d, err) {
                        _alert("E06 Could not create new message: " + err.message);
                        console.log(err.message);
                        deferred.reject();
                    }; //eo error callback
                    message.set("title", _m.title);
                    message.set("message", _m.msg);
                    message.set("sendToCustomListId", selectedCustomListData.objectId);
                    message.set("senderId", user.id);
                    message.set("groupType", userCustomListData.get("groupType"));
                    message.set("orgIdForThisObject", userCustomListData.get("groupId"));
                    message.save(null, {
                        success: success,
                        error: error
                    }); //eo messageSave
                    return deferred;
                }; //eo createNewMessage
                var getCustomListData = function() {
                    var deferred = $.Deferred();
                    var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                        query: function() {
                            return new Parse.Query(this.className);
                        }
                    });
                    var query = UserCustomList.query();
                    query.equalTo("ownerId", user.id);
                    query.equalTo("objectId", selectedCustomListData.objectId);
                    query.find({
                        success: function(results) {
                            userCustomListData = results[0]; //put this is top scope so everyone can see it
                            deferred.resolve();
                        }, //eo query.find success
                        error: function(err) {
                            _alert('Internal error, createNewMessage error:' + err.message);
                            deferred.reject();
                        }
                    }); //eo query.find
                    return deferred;
                }; //eo saveNewMessage
                var sendEmail = function() {
                    var deferred = $.Deferred();
                    var nonUserContactEmail = selectedCustomListData.nonUserContactEmail;
                    var userContactEmail = selectedCustomListData.userContactEmail;
                    var allEmailArray = nonUserContactEmail.concat(userContactEmail);
                    var data = {
                        "message": msg,
                        "title": title
                    }; //after getting values from form
                    var success = function(email) {
                        deferred.resolve();
                    };
                    var error = function(email, err) {
                        _alert('Failed to send emails, with error: ' + err.message);
                        deferred.resolve();
                    };
                    var Email = Parse.Object.extend("Email");
                    var email = new Email(); //Create an email object
                    var flag = selectedCustomListData.nonUserContactEmail && selectedCustomListData.nonUserContactEmail.length > 0;
                    flag = flag || selectedCustomListData.userContactId && selectedCustomListData.userContactId.length > 0;
                    flag = flag || selectedCustomListData.userContactEmail.length > 0;
                    if (!flag) {
                        deferred.resolve();
                        return deferred;
                    }
                    //var data = {"allDay":true,"end":"Thurs","location":"617 Memak Road","note":"too fun","repeat":"monthly","start":"Wed","title":"Test 1"};
                    //Create new Email object on parse to trigger cloud code
                    email.set("type", "message");
                    email.set("recipientAddress", allEmailArray);
                    email.set("data", data);
                    email.set("customListId", selectedCustomListData.objectId);
                    email.set("customListName", selectedCustomListData.name);
                    email.set("groupId", selectedCustomListData.groupId);
                    email.set("organizationId", selectedCustomListData.organizationId);
                    email.save(null, {
                        success: success,
                        error: error
                    });
                    return deferred;
                }; //eo sendEmail
                //
                //MAIN PROCESSING STARTS HERE
                //
                saveFieldData(); //hold on to the data while validating
                if (!selectedCustomListData || $.isEmptyObject(selectedCustomListData)) {
                    _alert("Please select a group before selecting Done");
                } else if (!title) { //empty string is falsy
                    _alert("Please enter the message title before selecting Done");
                } else {
                    spinner.show();
                    sendEmail() //If user selects mygroup custom list, we send emails to recipients
                        .then(getCustomListData) //go on to saving data
                        .then(createNewMessage)
                        .then(createUserMessageRelations)
                        .then(sendPush)
                        .then(addUserMessageRelation)
                        .always(done); //
                } //eo else validation
            }); //eo doneBtn click

            $("#message").focus(function(e) {
                $(".innerview-container").scrollTop($(".innerview-container").height() / 5);
            }); //eo #message .focus

            //
            //set up DOM
            //
            initMessageData(); //repopulate message fields
            //
        }; //eo addedToDOM
        var __id = 'new-message-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            id: __id,
            container: '#main-container',
            className: 'view-container new-message-view',
            //containerMethod: "prepend",
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                _setCurrentView(_view.MESSAGE_CREATION, __id);
                //Reset footer
                $("#footer-toolbar > li").removeClass("active");
                Chaplin.View.prototype.initialize.call(this, arguments);
            }
        }); //eo View.extend

        return View;
    });