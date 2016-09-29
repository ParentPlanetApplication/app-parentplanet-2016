define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-edit-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var data;
    var selectedMyGroupId;
    var dropdown;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        data = user.setting.selectedMyGroupData;
        selectedMyGroupId = user.setting.selectedMyGroupId;
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-mygroups-detail'
            });
        }); //eo cancelBtn click
        $("#delBtn").on("click", function(e) {
            //ToDo...
            //Test this out
            var defer = _confirm("Are you sure you want to delete this group?");
            defer.then(function() {
                deleteGroup();
            }, function() {
                console.log('delBtn rejected');
            });
        }); //eo #delBtn.click
        initDoneBtn();
    }; //eo initButtons

    var initDoneBtn = function() {
        $("#doneBtn").on("click", function(e) {
            updateGroup();
        });

        var updateGroup = function() {
            var name = $("#groupName").val();
            var type = _.isEmpty(dropdown.val) ? data.type : dropdown.val;
            var desc = $("#groupDesc").val(); //Can be null
            if (name == "") {
                alert("Please enter name");
            } else {
                spinner.show();
                //Create organization group
                var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = UserCustomGroup.query();
                query.equalTo("objectId", data.objectId);
                query.find({
                    success: function(groups) {
                        var group = groups[0]
                        group.set("name", name);
                        group.set("type", type);
                        group.set("description", desc);
                        group.save(null, {
                            success: function(group) {
                                user.setting.selectedMyGroupId = group.id;
                                user.setting.selectedMyGroupData = group;
                                localStorage.setItem("user", JSON.stringify(user));
                                updateCustomList(name, type);
                                updateOrgGroup(name, type, desc);
                                redirect();
                            },
                            error: function(group, error) {
                                    redirect();
                                } //eo error
                        });
                    },
                    error: function(group, error) {
                            redirect();
                        } //eo error
                }); //eo group.save
            }
        }; //eo updateGroup

        var updateOrgGroup = function(name, type, desc) {
            var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = new Parse.Query("OrganizationGroup");
            query.equalTo("organizationId", selectedMyGroupId);
            query.find({
                success: function(results) {
                    for (var i = 0; i < results.length; i++) {
                        var orgGroup = results[i];
                        orgGroup.set("name", name);
                        orgGroup.set("groupType", type);
                        orgGroup.set("description", desc);
                        orgGroup.save();
                    }
                },
                error: function(error) {
                    spinner.hide();
                    _alert('Error: '+JSON.stringify(error));
                }
            }); //eo query.find
        }; //eo updateOrgGroup

        var updateCustomList = function(name, type) {
            var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserCustomList.query();
            query.equalTo("groupId", selectedMyGroupId);
            query.find({
                success: function(results) {
                    for (var i = 0; i < results.length; i++) {
                        var customList = results[i];
                        customList.set("name", name);
                        customList.set("groupType", type);
                        customList.save();
                    }
                },
                error: function(error) {
                    spinner.hide();
                    _alert('Error: '+JSON.stringify(error));
                }
            }); //eo query.find
        }; //eo updateCustomList
    }; //eo initNextButton

    var deleteGroup = function() {

        spinner.show();
        var UserCustomGroup = Parse.Object.extend("UserCustomGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomGroup.query();
        query.equalTo("objectId", selectedMyGroupId);
        query.find({
            success: function(results) {
                if (results.length == 0) {
                    redirect();
                } else {
                    var group = results[0];
                    group.destroy({
                        success: function(group) {
                            deleteCustomList();
                            deleteOrgGroup();
                            deleteUserOrgGroupRelations();
                            // The object was deleted from the Parse Cloud.
                            redirectToMyGroup();
                        },
                        error: function(group, error) {
                            // The delete failed.
                            // error is a Parse.Error with an error code and message.
                            console.log(error.message);
                            redirectToMyGroup();
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
    }; //eo deleteGroup

    var deleteOrgGroup = function() {
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = OrganizationGroup.query();
        query.equalTo("organizationId", selectedMyGroupId);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var orgGroup = results[i];
                    orgGroup.destroy();
                }
            },
            error: function(error) {
                spinner.hide();
                _alert('Error: '+JSON.stringify(error));
            }
        }); //eo query.find
    }; //eo deleteOrgGroup

    var deleteCustomList = function() {
        var UserCustomList = Parse.Object.extend("UserCustomList", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserCustomList.query();
        query.equalTo("groupId", selectedMyGroupId);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var customList = results[i];
                    customList.destroy();
                }
            },
            error: function(error) {
                spinner.hide();
                _alert('Error: '+JSON.stringify(error));
            }
        }); //eo query.find
    }; //eo deleteCustomList

    var deleteUserOrgGroupRelations = function() {
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("organizationGroupId", selectedMyGroupId);
        query.find({
            success: function(results) {
                for (var i = 0; i < results.length; i++) {
                    var relation = results[i];
                    relation.destroy();
                }
            },
            error: function(error) {
                spinner.hide();
                _alert('Error: '+JSON.stringify(error));
            }
        }); //eo query.find
    }; //eo deleteUserOrgGroupRelations

    var loadData = function() {
        $("#groupName").val(data.name);
        if (data.type === 'Muslim' || data.type === 'Jewish' || data.type === 'Christian' || data.type === 'Buddhist') {
          $("#groupType").val(_religious);
          $("#groupType").text(_religious);
        } else {
          $("#groupType").val(data.type);
          $("#groupType").text(data.type);
        }
        $("#groupDesc").val(data.description);
        console.log(data);
    }; //eo loadData

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-mygroups-detail'
        });
    }; //eo redirect

    var redirectToMyGroup = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-mygroups'
        });
    }; //eo redirect

    // http://tympanus.net/codrops/2012/10/04/custom-drop-down-list-styling/
    // EXAMPLE 3
    function DropDown(el) {
        this.dd = el;
        this.placeholder = this.dd.children('span');
        this.opts = this.dd.find('ul.dropdown > li');
        this.val = '';
        this.index = -1;
        this.initEvents();
    };

    DropDown.prototype = {
        initEvents : function() {
            var obj = this;
            obj.dd.on('click', function(event){
                $(this).toggleClass('active');
                return false;
            });

            obj.opts.on('click',function(){
                var opt = $(this);
                console.log(opt);
                obj.val = opt.text();
                obj.index = opt.index();
                obj.placeholder.text(obj.val);

                if (obj.val === _religious) {
                  obj.val = $($(opt).children()).data('realname');
                }
                console.log(obj);
            });
        },
        getValue : function() {    return this.val;    },
        getIndex : function() {    return this.index;    }
    };
    var addedToDOM = function() {

        initData();
        initButtons();
        loadData();
        dropdown = new DropDown($('#dd'));
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-mygroups-edit-view',
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
    }); //eo View.extend

    return View;
});
