define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-groups-detail-edit-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedOrgData;
    var selectedOrgData;
    var selectedOrgGroupId;
    var selectedOrgGroupData;
    var newSubGroup;
    var dropdown;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
        selectedOrgData = user.setting.selectedOrgData;
        selectedOrgGroupId = user.setting.selectedOrgGroupId;
        selectedOrgGroupData = user.setting.selectedOrgGroupData;
        newSubGroup = selectedOrgGroupData.subGroupOf;
    }

    var checkPermissions = function() {
        if (user.isAdmin || user.setting.permissonOfSelectedOrg == "faculty" || user.setting.permissonOfSelectedOrg == "teacher" || user.setting.permissonOfSelectedOrg == "admin") {
            $("#delBtn").removeClass("hidden");
        }
    }

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-groups-detail'
        });
    }

    var redirectToGroupList = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-groups-list'
        });
    }

    var deleteGroup = function() {
        //Delete Group
        var _deleteGroup = function() {

            var groupId = selectedOrgGroupId;
            var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = OrganizationGroup.query();
            query.equalTo("objectId", selectedOrgGroupId);

            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        redirect();
                    } else {
                        var group = results[0];
                        group.destroy({
                            success: function(group) {
                                // The object was deleted from the Parse Cloud.
                                var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
                                  query: function(){
                                    return new Parse.Query(this.className);
                                  }
                                });
                                var query2 = UserCustomList.query();
                                query2.equalTo("groupId", groupId)
                                query2.find({
                                    success: function(results) {
                                        for (var i = 0; i < results.length; i++) {
                                            var customList = results[i];
                                            customList.destroy();
                                        }
                                    },
                                    error: function(error) {
                                        console.log('Error: '+error);
                                    }
                                });
                                spinner.hide();
                                redirectToGroupList();
                            },
                            error: function(group, error) {
                                // The delete failed.
                                // error is a Parse.Error with an error code and message.
                                console.log(error.message);
                                redirectToGroupList();
                            }
                        }); //eo group.destroy
                    } //eo else results.length
                },
                error: function(error) {
                    //Todo: show error message
                    console.log(error);
                    spinner.hide();
                }
            }); //eo query.find
        };

        //Delete UserOrganizationGroupRelation first
        //Delete relationships first, then we delete the group
        spinner.show();
        var groupId = selectedOrgGroupId;
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("organizationGroupId", selectedOrgGroupId);
        query.find({
            success: function(results) {
                if (results.length == 0) {
                    _deleteGroup();
                } else {
                    var totalResponses = 0;
                    for (var i = 0; i < results.length; i++) {
                        var relation = results[i];
                        relation.destroy({
                            success: function(relation) {
                                // The object was deleted from the Parse Cloud.
                                totalResponses++;
                                if (results.length == totalResponses) {
                                    _deleteGroup();
                                }
                            },
                            error: function(relation, error) {
                                // The delete failed.
                                // error is a Parse.Error with an error code and message.
                                console.log(error.message);
                                totalResponses++;
                                if (results.length == totalResponses) {
                                    _deleteGroup();
                                }
                            }
                        }); //eo relation.destroy
                    } //eo for results.length
                } //eo else results.length
                //spinner.hide();
            },
            error: function(error) {
                //Todo: show error message
                console.log(error);
                spinner.hide();
                redirectToGroupList();
            }
        });

    }; //eo deleteGroup

    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            redirect();
        });

        $("#delBtn").on("click", function(e) {
            var defer = _confirm("Are you sure you want to delete this group?");
            defer.then(function() {
                deleteGroup();
            }, function() {
                console.log('delBtn rejected');
            });
        }); //eo #delBtn.click

        $("#doneBtn").on("click", function(e) {
            var title = selectedOrgData.name + " - " + selectedOrgGroupData.name;
            var label = selectedOrgGroupData.label;
            var newGroupName = $("#groupName").val();
            var newGroupDesc = $("#groupDesc").val();
            var newLabel = $("#groupType").text();
            var updateGroupDetail = false;

            if (newGroupName != selectedOrgData.name) {
                updateGroupDetail = true;
            } else if (newGroupDesc != selectedOrgGroupData.description) {
                updateGroupDetail = true;
            } else if (newLabel != label) {
                updateGroupDetail = true;
            }
            if (!updateGroupDetail) {
                redirect();
            } else {
                //Update group info locallly
                selectedOrgGroupData.name = newGroupName;
                selectedOrgGroupData.description = newGroupDesc;
                selectedOrgGroupData.label = newLabel;
                user.setting.selectedOrgGroupData = selectedOrgGroupData;
                localStorage.setItem("user", JSON.stringify(user));
                //Update group info on Parse
                var groupId = selectedOrgGroupId;
                var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = OrganizationGroup.query();
                query.equalTo("objectId", selectedOrgGroupId);
                spinner.show();
                query.find({
                    success: function(results) {
                        if (results.length == 0) {
                            spinner.hide();
                            redirect();
                        } else {
                            var group = results[0];
                            group.set("name", newGroupName);
                            group.set("description", newGroupDesc);
                            group.set("label", newLabel);
                            group.set("groupType", dropdown.val);
                            group.set("subGroupOf", newSubGroup);
                            group.save({
                                success: function(group) {
                                    // The object was deleted from the Parse Cloud.
                                    redirect();
                                },
                                error: function(group, error) {
                                    // The delete failed.
                                    // error is a Parse.Error with an error code and message.
                                    console.log(error.message);
                                    redirect();
                                }
                            }); //eo group.save
                        } //eo else results.length
                        spinner.hide();
                    },
                    error: function(error) {
                            //Todo: show error message
                            console.log(error);
                            spinner.hide();
                        } //eo error
                }); //eo query.find
            } //eo else updateGroupDetail
        }); //eo doneBtn click
    }; //eo initButtons

    var loadData = function() {
        var title = selectedOrgData.name + " - " + selectedOrgGroupData.name;
        var label = selectedOrgGroupData.label;
        $("#title").html(title);
        $("#groupName").val(selectedOrgGroupData.name);
        $("#groupId").html(selectedOrgGroupData.objectId);
        $("#groupDesc").val(selectedOrgGroupData.description);
        $("#groupType").text(label);
    }

    var initSubGroupForms = function() {
        //Load groups for sub-group form
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = OrganizationGroup.query();
        query.equalTo("organizationId", selectedOrgId);
        query.ascending("name");
        spinner.show();
        query.find({
            success: function(results) {
                if (results.length == 0) {} else {
                    for (var i = 0; i < results.length; i++) {
                        var orgGroup = results[i];
                        if (orgGroup.id == selectedOrgGroupId) { continue; }
                        if (orgGroup.id == newSubGroup) {
                            $("#subGroupType").text(orgGroup.get("name"));
                        }
                        $("#subGroupSelector").append('<li value="' + orgGroup.id + '"><a href="#">' + orgGroup.get("name") + '</a></li>');
                    }
                }
                $("#subGroupType").val(selectedOrgGroupData.subGroupOf);
                $("#content").removeClass("hidden");
                new DropDown($('#dd2'));
                spinner.hide();
            },
            error: function(error) {
                console.log(error);
                $("#content").removeClass("hidden");
                $("#subGroupWrapper").addClass("hidden");
                alert("There was an error loading sub-groups from the server, please try again");
                spinner.hide();
            }
        });
    }

    function DropDown(el) {
        this.dd = el;
        this.placeholder = this.dd.children('span');
        this.opts = this.dd.find('ul.dropdown > li');
        this.val = '';
        this.value = this.dd.value;
        this.index = -1;
        this.initEvents();
    }
    DropDown.prototype = {
        initEvents : function() {
            var obj = this;

            obj.dd.on('click', function(event){
                $(this).toggleClass('active');
                return false;
            });

            obj.opts.on('click',function(){
                var opt = $(this);
                obj.val = opt.text();
                obj.index = opt.index();
                obj.placeholder.text(obj.val);
                newSubGroup = opt.attr('value') ? opt.attr('value') : newSubGroup; //check if setting subGroup and not label type
            });
        },
        getValue : function() {
            return this.val;
        },
        getIndex : function() {
            return this.index;
        }
    }

    var addedToDOM = function() {
        initData();
        checkPermissions();
        initButtons();
        loadData();
        initSubGroupForms();
        dropdown = new DropDown($('#dd'));
    };

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-groups-detail-edit-view',
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        },
        getTemplateData: function () {
          return {
            religious: _religious
          };
        }
    });

    return View;
});
