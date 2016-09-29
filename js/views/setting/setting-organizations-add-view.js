define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-organizations-add-view.hbs',
    'jquery',
    'spinner',
    'parse'
], function(Chaplin, View, Template, $, overlaySpinner, Parse) {
    'use strict';

    var user;
    var selectedOrgId;
    var selectedOrgData;
    var dropdown;

    var initData = function() {
        user = JSON.parse(localStorage.getItem("user"));
    }; //eo initData

    var initButtons = function() {
        $("#cancelBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-home'
            });
        });
        $("#doneBtn").on('click', function(e) {
            createOrg();
        });
    }; //eo initButtons

    var createOrg = function() {
        var name = $("#name").val();
        var addressLine1 = $("#addressLine1").val();
        var addressLine2 = $("#addressLine2").val(); //Can be null
        var city = $("#city").val();
        var state = $("#state").val();
        var zip = $("#zip").val();
        var phone = $("#phone").val();
        var fax = $("#fax").val(); //Can be null
        var type = $("#orgType").text();
        var desc = $("#desc").val(); //Can be null
        if (name == "" || addressLine1 == "" || city == "" || state == "" || zip == "" || phone == "" || type == "") {
            _alert("Please enter all fields with *");
        } else {
            overlaySpinner.show();
            //Create organization group
            var Organization = Parse.Object.extend("Organization");
            var org = new Organization();
            org.set("name", name);
            org.set("adminIdList", [user.id]);
            org.set("addressLine1", addressLine1);
            org.set("addressLine2", addressLine2);
            org.set("city", city);
            org.set("state", state);
            org.set("zip", zip);
            org.set("country", "USA");
            org.set("label", type);
            org.set("type", dropdown.val);
            org.set("phone", phone);
            org.set("fax", fax);
            org.set("description", desc);
            org.save(null, {
                success: function(org) {
                    // Execute any logic that should take place after the object is saved.
                    //alert('New object created with objectId: ' + relation.id);
                    if (user.setting == null) {
                        user.setting = {};
                    }
                    user.setting.selectedOrgId = org.id;
                    user.setting.selectedOrgData = org;
                    localStorage.setItem("user", JSON.stringify(user));
                    overlaySpinner.hide();
                    var UserOrganizationRelation = Parse.Object.extend("UserOrganizationRelation");
                    var relation = new UserOrganizationRelation();
                    relation.set("alert", true);
                    relation.set("calendarAutoSync", false);
                    relation.set("firstName", user.firstName);
                    relation.set("lastName", user.lastName);
                    relation.set("organizationId", org.id);
                    relation.set("organizationType", type);
                    relation.set("permission", "admin");
                    relation.set("position", "Faculty");
                    relation.set("relation", "staff");
                    relation.set("showAddress", true);
                    relation.set("showEmail", true);
                    relation.set("showHomePhone", true);
                    relation.set("showMobilePhone", true);
                    relation.set("showWorkPhone", true);
                    relation.set("userId", user.id);
                    relation.save();
                    redirect();
                },
                error: function(org, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and message.
                    //alert('Failed to add child to organization: ' + error.message);
                    _alert("Error, could not create organization!");
                    overlaySpinner.hide();
                } //eo error
            }); //eo group.save
        } //eo else if name
    }; //eo createOrg

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

    var redirect = function() {
        Chaplin.utils.redirectTo({
            name: 'setting-organizations-detail'
        });
    }; //eo redirect

    var spinner = null;
    var addedToDOM = function() {
        initData();
        initButtons();
        $("#content").removeClass("hidden");
        $("#city").focus(function(e) {
                $(".innerview-container").scrollTop($(".info-wrapper").height() - 510);
        }); //eo #city .focus
        $("#state").focus(function(e) {
                $(".innerview-container").scrollTop($(".info-wrapper").height() - 510);
        }); //eo #state .focus
        $("#zip").focus(function(e) {
                $(".innerview-container").scrollTop($(".info-wrapper").height() - 510);
        }); //eo #zip .focus
        $("#phone").focus(function(e) {
                $(".innerview-container").scrollTop($(".info-wrapper").height() - 300);
        }); //eo #phone .focus
        $("#fax").focus(function(e) {
                $(".innerview-container").scrollTop($(".info-wrapper").height() - 300);
        }); //eo #fax .focus
        $("#desc").focus(function(e) {
                $(".innerview-container").scrollTop($(".info-wrapper").height() - 100);
        }); //eo #desc .focus
        dropdown = new DropDown($('#dd'));
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        id: 'setting-organizations-add-view',
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
