define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/index/contacts-groups-view.hbs',
        'jquery',
        'parseproxy',
        'moment',
        'parse'
    ],
    function(Chaplin, View, Template, $, ParseProxy, moment, Parse) {
        'use strict';
        var childrenList = null;
        var hasChildren = false;
        var studentDataArray = null;
        var loadChildren = function() {
            var id = _selectedContact.orgId; //what did we click in the previous view
            var org = _getUserCustomListItem(id); //data associated with
            var childIdArray = [];
            function getChildren() {
                //Load students
                var parentIdArray = [];
                var childIdArray = _selectedContact.o.studentIdList;
                var Child = Parse.Object.extend("Child", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = Child.query();
                query.containedIn("objectId", childIdArray);
                query.ascending("lastName");
                query.find({
                    success: function(results) {
                        $.each(results, function(i, student) {
                            var creatorParentId = student.get('creatorParentId');
                            var lastName = student.get('lastName');
                            var firstName = student.get('firstName');
                            parentIdArray.push(creatorParentId);
                            studentDataArray.push({
                                i: i,
                                creatorParentId: creatorParentId,
                                lastName: lastName,
                                firstName: firstName
                            });
                        }); //eo each
                        getParentPermission(parentIdArray);
                        // studentDataArray.length == 0 ? __this.render() : hasChildren();
                    }, //eo success
                    error: function(err) {
                        _alert("Internal Error, Contacts loading students data:"+err);
                        __this.render();
                    } //eo error
                }); //eo query.find
                function getParentPermission(parentIdArray) {
                    function hasChildren() {
                        __this.render();
                        $(".content-item.contact").click(function(e) {
                            var index = $(this).data('index');
                            _selectedContact.c = studentDataArray[index];
                            _selectedContactId = $(this).attr("id");
                            $(this).addClass("bg-highlight-grey");
                            setTimeout(function() {
                                _setPreviousView();
                                Chaplin.utils.redirectTo({    name: 'contacts-groups-detail'    });
                            }, DEFAULT_ANIMATION_DELAY);
                        }); //eo click handler
                       $("#backBtn").on('click', function() {
                            _setPreviousView();
                            Chaplin.utils.redirectTo({    name: 'contacts'    });
                        }); //eo backBtn click
                    }; //eo hasChildren
                    var hideFirstName = function(children) {
                        for (var i = 0; i < children.length; i++) {
                            children[i].firstName = 'Private';
                        }
                    }; //eo hideFirstName
                    var hideLastName = function(children) {
                        for (var i = 0; i < children.length; i++) {
                            children[i].lastName = 'Private';
                        }
                    }; //eo hideLastName
                    var query = new Parse.Query(Parse.User);
                    query.containedIn("objectId", parentIdArray);
                    query.find({
                        success: function(results) {
                            if (results.length > 0) {
                                $.each(results, function(j, parent) {
                                    var children = [];
                                    children = $.grep(studentDataArray, function(n) {
                                        return n.creatorParentId == parent.id;
                                    }); //eo grep
                                    parent.get("showChildFirstName") ? $.noop() : hideFirstName(children);
                                    parent.get("showChildLastName") ? $.noop() : hideLastName(children);
                                }); //eo each
                            }
                            studentDataArray.length == 0 ? __this.render() : hasChildren();
                        },
                        error: function(err) {
                            _alert("Internal Error, Contacts loading students data:"+err)
                        }
                    }); //eo query.find
                }; //eo getParentPermission
            }; //eo getChildren
            studentDataArray = [];
            _selectedContact.o.studentIdList.length == 0 ? __this.render() : getChildren();
            spinner ? spinner.stop() : $.noop();
        }; //eo loadChildren
        var refreshView = function() {
            loadChildren();
        }; //eo refreshView
        var spinner = null;
        var addedToDOM = function() {
            spinner = _createSpinner('spinner');
            //Init touch events
            loadChildren();
        }; //eo addedToDOM
        var __this = null;
        var __id = 'contacts-groups-view';
        var view = View.extend({
            template: Template,
            autoRender: false,
            //keepElement: true,
            container: '#main-container',
            id: __id,
            className: 'view-container',
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                //Reset footer
                __this = this;
                _setCurrentView(_view.CONTACTS_GROUPS_INDEX, __id);
                $("#footer-toolbar > li").removeClass("active");
                $("#contacts-tool").addClass("active");
                Chaplin.View.prototype.initialize.call(this, arguments);
                refreshView();
            },
            getTemplateData: function() { //this is called before addedToDOM is
                hasChildren = studentDataArray.length > 0;
                return { hasChildren:hasChildren, children:studentDataArray }; //send data to template
            }
        });

        return view;
    });
