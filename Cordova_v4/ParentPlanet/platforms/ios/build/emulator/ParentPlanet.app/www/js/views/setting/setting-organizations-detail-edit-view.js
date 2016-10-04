define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-detail-edit-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedOrgData;
    var dropdown;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedOrgId = user.setting.selectedOrgId;
        selectedOrgData = user.setting.selectedOrgData;
    }; //eo initData

    var redirect = function() {
        spinner.hide();
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-home'
        });
    }; //eo redirect

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-detail'
            });
        });
    }; //eo initButtons

    var loadData = function() {
        var title = selectedOrgData.name + " - Edit Organization";
        var name = selectedOrgData.name;
        var id = selectedOrgData.objectId;
        var label = selectedOrgData.label;
        var desc = selectedOrgData.description;
        var addressLine1 = selectedOrgData.addressLine1;
        var addressLine2 = selectedOrgData.addressLine2 ? selectedOrgData.addressLine2 : "";
        //var address = addressLine1 + addressLine2;
        var city = selectedOrgData.city;
        var state = selectedOrgData.state;
        var zip = selectedOrgData.zip;

        $("#title").html(title);
        $("#name").val(name);
        $("#id").html(id);
        $("#orgType").text(label);
        $("#desc").val(desc);
        $("#addressLine1").val(addressLine1);
        $("#addressLine2").val(addressLine2);
        $("#city").val(city);
        $("#state").val(state);
        $("#zip").val(zip);
    }; //eo loadData

    var initDelBtn = function() {
        //ToDo...
        //Test this!!!
        var delOrg = function() {
            spinner.show();
            //Delete Organization
            var Organization = Parse.Object.extend("Organization", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = Organization.query();
            query.equalTo("objectId", selectedOrgId);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        //spinner.hide();
                        //alert("Organization not found");

                        delUserOrgRelation();
                    } else {
                        var org = results[0];
                        org.destroy({
                            success: function(group) {
                                //Delete org groups
                                delUserOrgRelation();
                            },
                            error: function(group, error) {
                                //alert("Could not delete this organization");
                                delUserOrgRelation();
                            }
                        });

                    } //eo else
                },
                error: function(error) {
                    //Todo: show error message
                    console.log(error);
                    alert("Error, could not delete this organization");
                }
            }); //eo query find
        }; //eo delOrg


        var delUserOrgRelation = function() {
            var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserOrganizationRelation.query();
            query.equalTo("organizationId", selectedOrgId);
            query.find({
                success: function(results) {
                    if (results.length == 0) {} else {
                        for (var i = 0; i < results.length; i++) {
                            var relation = results[i];
                            relation.destroy();
                        } //eo for
                    } //eo if
                    delOrgGroups();
                },
                error: function(error) {
                    //Todo: show error message
                    console.log(error);
                    delOrgGroups();
                }
            }); //eo query.find
        }; //eo delUserOrgRelation

        //Delete Group
        var delOrgGroups = function() {
            var orgGroupIdArray = [];

            var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = OrganizationGroup.query();
            query.equalTo("organizationId", selectedOrgId);
            query.find({
                success: function(results) {
                    if (results.length == 0) {
                        redirect();
                    } else {
                        var orgGroupIdArray = [];
                        for (var i = 0; i < results.length; i++) {
                            var group = results[i];
                            orgGroupIdArray.push(group.id);
                            group.destroy();
                        }

                        delUserOrgGroupRelation(orgGroupIdArray);
                    }
                },
                error: function(error) {
                    //Todo: show error message
                    console.log(error);
                    redirect();
                }
            }); //eo query.find
        }; //eo delOrgGroups

        var delUserOrgGroupRelation = function(orgGroupIdArray) {

            var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserOrganizationGroupRelation.query();
            query.containedIn("organizationGroupId", orgGroupIdArray);
            query.find({
                success: function(results) {
                    if (results.length == 0) {} else {
                        for (var i = 0; i < results.length; i++) {
                            var relation = results[i];
                            relation.destroy();
                        } //eo for
                    } //eo if
                    redirect();
                },
                error: function(error) {
                    //Todo: show error message
                    console.log(error);
                    redirect();
                }
            }); //eo query.find
        }; //eo delUserOrgGroupRelation

        $("#delBtn").on("click", function() {
            var defer = _confirm("Are you sure you want to delete this organization?");
            defer.done(function() {
                delOrg();
            }); //eo defer.done
        }); //eo delBtn click
    }; //eo initDelBtn

    var initDoneBtn = function() {
        var updateInfo = function() {
            spinner.show();
            var newName = $("#name").val();
            var newLabel = $("#orgType").text();
            var newDesc = $("#desc").val();
            var newAddressLine1 = $("#addressLine1").val();
            var newAddressLine2 = $("#addressLine2").val();
            var newCity = $("#city").val();
            var newState = $("#state").val();
            var newZip = $("#zip").val();

            var name = selectedOrgData.name;
            var label = selectedOrgData.label;
            var desc = selectedOrgData.description;
            var addressLine1 = selectedOrgData.addressLine1;
            var addressLine2 = selectedOrgData.addressLine2 ? selectedOrgData.addressLine2 : "";
            var city = selectedOrgData.city;
            var state = selectedOrgData.state;
            var zip = selectedOrgData.zip;
            var isUpdateOrgInfo = false;

            if (name != newName || label != newLabel || desc != newDesc || addressLine1 != newAddressLine1 || addressLine2 != newAddressLine2 || city != newCity || state != newState || zip != newZip) {
                isUpdateOrgInfo = true;
            }

            if (isUpdateOrgInfo) {
                //Update data locally
                selectedOrgData.name = newName;
                selectedOrgData.label = newLabel;
                selectedOrgData.description = newDesc;
                selectedOrgData.addressLine1 = newAddressLine1;
                selectedOrgData.addressLine2 = newAddressLine2;
                selectedOrgData.city = newCity;
                selectedOrgData.state = newState;
                selectedOrgData.zip = newZip;
                user.setting.selectedOrgData = selectedOrgData;
                localStorage.setItem("user", JSON.stringify(user));

                //Update data on Parse
                var Organization = Parse.Object.extend("Organization", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = Organization.query();
                query.equalTo("objectId", selectedOrgId);
                query.find({
                    success: function(results) {
                        if (results.length == 0) {
                            spinner.hide();
                            redirect();
                        } else {
                            var org = results[0];
                            org.set("name", newName);
                            org.set("description", newDesc);
                            org.set("label", newLabel);
                            org.set("addressLine1", newAddressLine1);
                            org.set("addressLine2", newAddressLine2);
                            org.set("city", newCity);
                            org.set("state", newState);
                            org.set("zip", newZip);
                            org.save({
                                success: function(org) {
                                    // The object was deleted from the Parse Cloud.
                                    spinner.hide();
                                    redirect();
                                },
                                error: function(org, error) {
                                    // The delete failed.
                                    // error is a Parse.Error with an error code and message.
                                    console.log(error.message);
                                    spinner.hide();
                                    redirect();
                                }
                            }); //eo org.size
                        } //eo else
                    },
                    error: function(error) {
                        //Todo: show error message
                        console.log(error);
                    }
                }); //eo query.find

                /*setTimeout(function() {
                    spinner.hide();
                    redirect();
                }, 1000);*/
            } else {
                redirect();
            } //eo if isUpdateOrgInfo
        }; //eo updateInfo

        $("#doneBtn").on("click", function() {
            updateInfo();
        });
    }; //eo initDoneBtn

    // http://tympanus.net/codrops/2012/10/04/custom-drop-down-list-styling/
    // EXAMPLE 3
    function DropDown(el) {
        this.dd = el;
        this.placeholder = this.dd.children('span');
        this.opts = this.dd.find('ul.dropdown > li');
        this.val = '';
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
        getValue : function() {
            return this.val;
        },
        getIndex : function() {
            return this.index;
        }
    }

    var addedToDOM = function() {
        initData();
        initButtons();
        loadData();
        initDelBtn();
        initDoneBtn();
        dropdown = new DropDown($('#dd'));
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-detail-edit-view',
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
