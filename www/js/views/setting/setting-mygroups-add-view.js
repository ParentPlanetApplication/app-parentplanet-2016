define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-add-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var dropdown;

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({    name: 'setting-mygroups-detail'    });
    }; //eo redirect

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {   Chaplin.utils.redirectTo({    name: 'setting-mygroups'    });    }); //eo cancelBtn click
    }; //eo initButtons

    var initDoneBtn = function() {
        $("#doneBtn").on("click", function(e) {
            createGroup();
        });
        var createGroup = function() {
            var name = $("#groupName").val();
            var type = dropdown.val; //Group Type
            var desc = $("#groupDesc").val(); //Can be null
            if (name == "") {
                _alert("Please enter name");
            } else {
                //Create organization group
                spinner.show();
                var UserCustomGroup = Parse.Object.extend("UserCustomGroup");
                var group = new UserCustomGroup();
                group.set("userId", user.id);
                group.set("name", name);
                group.set("type", type);
                group.set("description", desc);
                group.set("nonUserContactEmail", []);
                group.set("userContactId", []);
                group.set("userContactEmail", []);
                group.set("studentIdList", []); //add a studentIdList array
                group.save(null, {
                    success: function(group) {
                        // Execute any logic that should take place after the object is saved.
                        //alert('New object created with objectId: ' + relation.id);
                        if (user.setting == null) {    user.setting = {};    }
                        user.setting.selectedMyGroupId = group.id;
                        user.setting.selectedMyGroupData = group;
                        localStorage.setItem("user", JSON.stringify(user));
                        createCustomList(group.id, name, type);
                        createOrgGroup(group.id, name, type, desc);
                        redirect();
                    },
                    error: function(group, error) {
                            // Execute any logic that should take place if the save fails.
                            // error is a Parse.Error with an error code and message.
                            //alert('Failed to add child to organization: ' + error.message);
                            alert("Error, could not create a new group!");
                            spinner.hide();
                        } //eo error
                }); //eo group.save
            }
        }; //eo createGroup
        var createCustomList = function(id, name, type) {
            var UserCustomList = Parse.Object.extend("UserCustomList");
            var customList = new UserCustomList();
            customList.set("groupId", id);
            customList.set("groupType", type);
            customList.set("name", name);
            customList.set("nonUserContactEmail", []);
            customList.set("organizationId",  _familyCustomGroupOrgGenericId);
            customList.set("ownerId", user.id);
            customList.set("recipientList", []);
            customList.set("type", "MyGroup");
            customList.set("userContactEmail", []);
            customList.set("userContactId", []);
            customList.set("studentIdList", []);
            customList.save();
        }; //eo createCustomList
    }; //eo initNextButton

    var createOrgGroup = function(id, name, type, desc) { //add to OrganizationGroup table so that My Groups have all functionality of Org Groups with less queries
        var OrganizationGroup = Parse.Object.extend("OrganizationGroup");
        var orgGroup = new OrganizationGroup();
        orgGroup.set("adminIdList", []);
        orgGroup.set("adminJsonList", {});
        orgGroup.set("description", desc);
        orgGroup.set("groupType", type);
        orgGroup.set("label", type);
        orgGroup.set("name", name);
        orgGroup.set("organizationId", id); //id of UserCustomGroup
        orgGroup.set("studentIdList", []);
        orgGroup.set("subGroupOf", "");
        orgGroup.set("isMyGroup", true);
        orgGroup.save(null, {
            success: function(orgGroup) {
                if (user.id) {
                    var adminJson = orgGroup.get("adminJsonList");
                    adminJson[user.id] = "Creator";
                    orgGroup.addUnique("adminIdList", user.id);
                    orgGroup.save();
                }
            },
            error: function(orgGroup, error) {

            }
        })
    }; //eo createOrgGroup

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
        initDoneBtn();
        $("#content").removeClass("hidden");
        dropdown = new DropDown($('#dd'));
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-mygroups-add-view',
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
