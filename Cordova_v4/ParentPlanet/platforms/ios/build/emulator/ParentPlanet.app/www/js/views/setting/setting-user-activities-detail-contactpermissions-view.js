define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-activities-detail-contactpermissions-view.hbs',
    'jquery',
    'parse'
], function(Chaplin, View, Template, $, Parse) {
    'use strict';

    var relation;

    var loadPermissions = function() {
        var spinner = _createSpinner('spinner');
        $("#nameOfActivity").html(_selectedChildActivityName);


        //Load  selected kid permissions
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });
        var query = UserOrganizationGroupRelation.query();
        query.equalTo("userId", _selectedChildId);
        query.equalTo("organizationGroupId", _selectedChildActivityId);
        query.equalTo("relationType", "student");
        query.find({
            success: function(results) {
                if (results.length == 0) {
                    $("#main-content").html("Activity info not found.");
                } else {
                    relation = results[0];
                    var showParentFirstName = relation.get("showParentFirstName") ? "checked" : "";
                    var showParentLastName = relation.get("showParentLastName") ? "checked" : "";
                    var showChildFirstName = relation.get("showChildFirstName") ? "checked" : "";
                    var showChildLastName = relation.get("showChildLastName") ? "checked" : "";
                    var showEmail = relation.get("showEmail") ? "checked" : "";
                    var showHomePhone = relation.get("showHomePhone") ? "checked" : "";
                    var showMobilePhone = relation.get("showMobilePhone") ? "checked" : "";
                    var showWorkPhone = relation.get("showWorkPhone") ? "checked" : "";
                    var showAddress = relation.get("showAddress") ? "checked" : "";

                    $("#main-content").append(
                        '<div class="menu-item hidden">    \
                            <div class="text-left">Parent First Name</div>  \
                            <div class="switch-right">  \
                                <div class="toggle">    \
                                    <input id="parentFirstNameBtn" type="checkbox" name="toggle9" class="toggle9" '+ showParentFirstName + '> \
                                </div>  \
                            </div>  \
                        </div>  \
                        <div class="menu-item hidden"> \
                            <div class="text-left">Parent Last Name</div>   \
                            <div class="switch-right">  \
                                <div class="toggle">    \
                                    <input id="parentLastNameBtn" type="checkbox" name="toggle9" class="toggle9" '+ showParentLastName + '> \
                                </div>  \
                            </div>  \
                        </div>  \
                        <div class="menu-item hidden"> \
                            <div class="text-left">Child First Name</div>   \
                            <div class="switch-right">  \
                                <div class="toggle">    \
                                    <input id="childFirstNameBtn" type="checkbox" name="toggle9" class="toggle9" '+ showChildFirstName + '> \
                                </div>  \
                            </div>  \
                        </div>  \
                        <div class="menu-item hidden"> \
                            <div class="text-left">Child Last Name</div>    \
                            <div class="switch-right">  \
                                <div class="toggle">    \
                                    <input id="childLastNameBtn" type="checkbox" name="toggle9" class="toggle9" '+ showChildLastName + '>  \
                                </div>  \
                            </div>  \
                        </div>  \
                        <div class="menu-item hidden"> \
                            <div class="text-left">E-Mail</div> \
                            <div class="switch-right">  \
                                <div class="toggle">    \
                                    <input id="emailBtn" type="checkbox" name="toggle9" class="toggle9" '+ showEmail + '>  \
                                </div>  \
                            </div>  \
                        </div>  \
                        <div class="menu-item hidden"> \
                            <div class="text-left">Home Phone</div> \
                            <div class="switch-right">  \
                                <div class="toggle">    \
                                    <input id="homePhoneBtn" type="checkbox" name="toggle9" class="toggle9" '+ showHomePhone + '>  \
                                </div>  \
                            </div>  \
                        </div>  \
                        <div class="menu-item hidden"> \
                            <div class="text-left">Mobile Phone</div>   \
                            <div class="switch-right">  \
                                <div class="toggle">    \
                                    <input id="mobilePhoneBtn" type="checkbox" name="toggle9" class="toggle9" '+ showMobilePhone + '>    \
                                </div>  \
                            </div>  \
                        </div>  \
                        <div class="menu-item hidden"> \
                            <div class="text-left">Work Phone</div> \
                            <div class="switch-right">  \
                                <div class="toggle">    \
                                    <input id="workPhoneBtn" type="checkbox" name="toggle9" class="toggle9" '+ showWorkPhone + '>  \
                                </div>  \
                            </div>  \
                        </div>  \
                        <div class="menu-item hidden"> \
                            <div class="text-left">Address</div>    \
                            <div class="switch-right">  \
                                <div class="toggle">    \
                                    <input id="addressBtn" type="checkbox" name="toggle9" class="toggle9" '+ showAddress + '>    \
                                </div>  \
                            </div>  \
                        </div>  \
                        <div class="empty-space-item hidden"></div>'
                    );
                    $("#parentFirstNameBtn").on('click', function() {
                        relation.set("showParentFirstName", $("#parentFirstNameBtn").prop('checked'));
                        relation.save();
                    });
                    $("#parentLastNameBtn").on('click', function() {
                        relation.set("showParentLastName", $("#parentLastNameBtn").prop('checked'));
                        relation.save();
                    });
                    $("#childFirstNameBtn").on('click', function() {
                        relation.set("showChildFirstName", $("#childFirstNameBtn").prop('checked'));
                        relation.save();
                    });
                    $("#childLastNameBtn").on('click', function() {
                        relation.set("showChildLastName", $("#childLastNameBtn").prop('checked'));
                        relation.save();
                    });
                    $("#emailBtn").on('click', function() {
                        relation.set("showEmail", $("#emailBtn").prop('checked'));
                        relation.save();
                    });
                    $("#homePhoneBtn").on('click', function() {
                        relation.set("showHomePhone", $("#homePhoneBtn").prop('checked'));
                        relation.save();
                    });
                    $("#mobilePhoneBtn").on('click', function() {
                        relation.set("showMobileWork", $("#mobilePhoneBtn").prop('checked'));
                        relation.save();
                    });
                    $("#workPhoneBtn").on('click', function() {
                        relation.set("showWorkPhone", $("#workPhoneBtn").prop('checked'));
                        relation.save();
                    });
                    $("#addressBtn").on('click', function() {
                        relation.set("showAddress", $("#addressBtn").prop('checked'));
                        relation.save();
                    });
                    $(".desc").removeClass("hidden");
                    $(".menu-item").removeClass("hidden");
                    $(".empty-space-item").removeClass("hidden");
                    $("#title").off('click');
                }

                spinner.stop();
            }, //eo success
            error: function(error) { spinner.stop(); }
        }); //eo query.find
        //ToDo
        $("#parentFirstNameBtn").on('click', function() {
            console.log("ss")
        });
    }; //eo loadPermissions

    var spinner = null;
    var addedToDOM = function() {
        loadPermissions();
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-user-activities-detail'
            });
        });
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container',
        id: 'setting-user-activities-detail-contactpermissions-view',
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
