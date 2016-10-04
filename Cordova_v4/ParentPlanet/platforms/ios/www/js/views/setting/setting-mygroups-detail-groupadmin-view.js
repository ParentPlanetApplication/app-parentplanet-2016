define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-mygroups-detail-groupadmin-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, spinner, Parse) {
    'use strict';

    var user;
    var userId;
    var selectedGroupId;
    var selectedGroupData;
    var relationDataArray;
    var selectedStaffIdArray;
    var staffIdArray;
    var staffPositionArray;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
        selectedGroupId = user.setting.selectedOrgGroupId;
        selectedGroupData = user.setting.selectedOrgGroupData;
        selectedStaffIdArray = [];
        staffIdArray = [];
        staffPositionArray = [];
    }; //eo initData

    var loadStaffs = function() {
        $("#titleTxt").html("Group Admin - " + selectedGroupData.name);
        //Load staffs
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("organizationGroupId", selectedGroupId);
        query.equalTo("relationType", "staff");
        query.ascending("firstName");
        var spinner = _createSpinner('spinner');
        query.find({
            success: function(results) {
                $("#title").removeClass("hidden");
                $("#spinner").addClass("hidden");
                //Save data for future use
                relationDataArray = results;
                user.setting.addStaff = {};
                user.setting.addStaff.relationDataArray = relationDataArray;
                localStorage.setItem("user", JSON.stringify(user));
                if (results.length == 0) {
                    $("#content").html('<div style="text-align:center;padding:0 10px;">No staff found</div>');
                } else {
                    for (var i = 0; i < results.length; i++) {
                        var relation = results[i];
                        var name = relation.get("firstName") + " " + relation.get("lastName");
                        $("#content").append('<div id="' + relation.get("userId") + '" class="menu-staff-editor">   \
                            <div class="circle-icon-wrapper"><i class="icon-fontello-circle icon-grey"></i></div>   \
                            <div class="info"><span>' + name + '</span>  \
                                <div class="field"> \
                                    <input class="input" type="text" placeholder="Position" value="' + relation.get("position") + '">   \
                                </div>  \
                            </div>  \
                            <div class="delete-btn hidden">Delete</div>    \
                        </div>');
                        staffIdArray.push(relation.get("userId"));
                        staffPositionArray.push(relation.get("position"));
                    }
                    $("#doneBtn").removeClass("hidden");
                    initEvents();
                } //eo else
                spinner.stop();
            },
            error: function(error) {
                //Todo: show error message
                console.log(error);
                spinner.stop();
            }
        }); //eo query.find
    }; //eo loadStaffs

    var initEvents = function() {
        $(".circle-icon-wrapper").off("click");
        $(".circle-icon-wrapper").on("click", function(e) {
            var staffId = $(this).parent().attr("id"); //student's id = Kid's id
            var index = selectedStaffIdArray.indexOf(staffId);
            var div = $(this).children().eq(0);
            var delBtn = $(this).parent().children().eq(2);
            if (index == -1) {
                selectedStaffIdArray.push(staffId);
                div.removeClass("icon-fontello-circle");
                div.removeClass("icon-grey");
                div.addClass("icon-fontello-ok-circled");
                div.addClass("icon-red");
                delBtn.removeClass("hidden");
            } else {
                selectedStaffIdArray.splice(index, 1);
                div.addClass("icon-fontello-circle");
                div.addClass("icon-grey");
                div.removeClass("icon-fontello-ok-circled");
                div.removeClass("icon-red");
                delBtn.addClass("hidden");
            }
        }); //eo circle-icon-wrapper click
        $("span").off("click");
        $("span").on("click", function(e) {
            var staffId = $(this).parent().parent().attr("id"); //student's id = Kid's id
            var index = selectedStaffIdArray.indexOf(staffId);
            var div = $(this).parent().parent().children().children().eq(0);
            var delBtn = $(this).parent().parent().children().eq(2);
            if (index == -1) {
                selectedStaffIdArray.push(staffId);
                div.removeClass("icon-fontello-circle");
                div.removeClass("icon-grey");
                div.addClass("icon-fontello-ok-circled");
                div.addClass("icon-red");
                delBtn.removeClass("hidden");
            } else {
                selectedStaffIdArray.splice(index, 1);
                div.addClass("icon-fontello-circle");
                div.addClass("icon-grey");
                div.removeClass("icon-fontello-ok-circled");
                div.removeClass("icon-red");
                delBtn.addClass("hidden");
            }
        }); //eo span click

        $(".delete-btn").off("click");
        $(".delete-btn").on("click", function(e) {
            //Delete the staff from this group
            var staffId = $(this).parent().attr("id");
            var name = $(this).parent().children().eq(1).children().eq(0).html();
            var defer = _confirm('Do you want to delete "' + name + '" from this group ?');
            defer.done(function() {
                $(this).parent().animate({
                    "opacity": 0
                }, 1000, function() {
                    $(this).remove();
                });
                removeStaff(staffId);
            }); //eo defer
        }); //eo delete-btn click

        $("#doneBtn").on('click', function(e) {
            var totalResponse = 0;
            var redirect = function() {
                if ($("input").length == totalResponse) {
                    Chaplin.utils.redirectTo({
                        name: 'setting-organizations-groups-detail'
                    });
                }
            }; //eo redirect
                //Check if any staffs' position changed
            $("input").each(function() {
                var staffId = $(this).parent().parent().parent().attr("id");
                var newPosition = $(this).val();
                var index = staffIdArray.indexOf(staffId);
                var oldPosition = staffPositionArray[index];
                if (newPosition == oldPosition) {
                    //Do nothing
                    //...
                    totalResponse++;
                    redirect();
                } else {
                    //Update data on parse
                    //Load staffs
                    var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
                      query: function(){
                        return new Parse.Query(this.className);
                      }
                    });
                    var query = UserOrganizationGroupRelation.query();
                    query.equalTo("organizationGroupId", selectedGroupId);
                    query.equalTo("userId", staffId);
                    var spinner = _createSpinner('spinner');
                    query.find({
                        success: function(results) {
                            if (results.length == 1) {
                                var object = results[0];
                                object.set("position", newPosition);
                                object.save();
                            }
                            totalResponse++;
                            spinner.stop();
                            redirect();
                        },
                        error: function(error) {
                            //Todo: show error message
                            console.log(error);
                            totalResponse++;
                            spinner.stop();
                            redirect();
                        }
                    }); //eo query.find
                } //eo else
            }); //eo input

            //Not sure if you should delete all selected staffs here
            //ToDo....
        }); //eo doneBtn click
    }; //eo initEvents

    var removeStaff = function(staffId) {
        //Delete locally
        var index = staffIdArray.indexOf(staffId);
        if (index != -1) {
            staffPositionArray.splice(index, 1);
            staffIdArray.splice(index, 1);
        }
        var indexSelected = selectedStaffIdArray.indexOf(staffId);
        if (indexSelected != -1) {
            selectedStaffIdArray.splice(indexSelected, 1);
        }
        var object = relationDataArray[index];
        //Delete on Parse
        //ToDo: Test this part!!!
        if (object) {
            var groupId = object.get("organizationGroupId");
            object.destroy({
                success: function(myObject) {
                    // The object was deleted from the Parse Cloud.
                    console.log("Successfully remove staff from a group: " + groupId);
                },
                error: function(myObject, error) {
                    // The delete failed.
                    // error is a Parse.Error with an error code and message.
                    console.log("Error")
                }
            });
        } //eo object
    }; //eo removeStaff

    var initButtons = function() {
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail'
            });
        });
        $("#addBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-organizations-groups-detail-groupadmin-add'
            });
        });
    }; //eo initButtons
    var spinner = null;
    var addedToDOM = function() {
        initData();
        initButtons();
        loadStaffs();
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-mygroups-detail-groupadmin-view',
        className: 'view-container',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo View.extend

    return View;
});
