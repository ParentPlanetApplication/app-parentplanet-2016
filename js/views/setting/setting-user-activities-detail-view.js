define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-activities-detail-view.hbs',
    'text!templates/setting/setting-user-activities-detail-view-main.hbs',
    'jquery',
    'parse',
    'localStorageService'
], function(Chaplin, View, Template, MainContent, $, Parse, localStorageService) {
    'use strict';

    var spinner = null;
    var selectedOrgId;
    var selectedKidRelation;
    var isMobile = false;
    var templateData;
    var groupData;
    var initData = function() {
        var deferred = $.Deferred();
        selectedOrgId = _selectedChildActivityId;
        activityId = _activityId(selectedOrgId, _selectedChildId);
        $("#titleStr").html(_selectedChildActivityName);

        groupData = _getUserActivitiesItem(activityId);
        if (!groupData) {
            _getActivities().then(function() {
                groupData = _getUserActivitiesItem(activityId);
                deferred.resolve();
            });
        } else {
            deferred.resolve();
        }

        return deferred;
    };



    var dirty = false; //keep track if anything has changed
    var autoSync = false;
    var relation = null;
    var admin = null;
    var activityId = null;
    var watchingGroup = null;

    var loadActivityDetail = function() {
        var spinner = _createSpinner('spinner');
        var userIdArray = [];
        var userRelationData = [];

        var userChild = function() {
            var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserOrganizationGroupRelation.query();
            query.equalTo("userId", _selectedChildId);
            query.equalTo("organizationGroupId", selectedOrgId);
            query.equalTo("relationType", "student");
            query.find({
                success: function(results) {
                    var calendarAutoSync, whichCalendarToSync = 'null';
                    var template = Handlebars.compile(MainContent);
                    var html = template(templateData);
                    var organizationId, childId;
                    var attributes, isChecked;
                    if (results.length > 0) {
                        relation = results[0];
                        organizationId = relation.get('organizationGroupId');
                        childId = relation.get('userId');
                        activityId = _activityId(organizationId, childId);
                        attributes = _getUserActivitiesItem(activityId);
                        console.log(activityId);
                        console.log(attributes);

                        watchingGroup = localStorageService.getWatchingGroupById(relation.id);
                        if (!watchingGroup) {
                            watchingGroup = localStorageService.addWatchingGroup(
                                relation.id,
                                relation.get('organizationGroupId'),
                                relation.get('whichCalendarToSync'),
                                relation.get("calendarAutoSync"));
                        }

                        $("#main-content").append(html);
                        $("#calendarAustoSyncBtn").prop('checked', watchingGroup.isWatching ? "checked" : "");
                        $("#alertsBtn").prop('checked', relation.get("alert") ? "checked" : "");
                        $('#calendarToSync').text(watchingGroup.calendarToSync ? watchingGroup.calendarToSync : 'None');

                        //UI handlers
                        $("#calendarAustoSyncBtn").on('click', function() {
                            var isChecked = $("#calendarAustoSyncBtn").prop('checked');
                            isChecked ? $('#calendar-sync-with').removeClass('hidden') : $('#calendar-sync-with').addClass('hidden');
                            attributes = relation.attributes;
                            dirty = true;

                            var whichCalendarToSync = watchingGroup.calendarToSync ? watchingGroup.calendarToSync : 'None';
                            $('#calendarToSync').text(whichCalendarToSync);

                            watchingGroup = localStorageService.addWatchingGroup(
                                watchingGroup.userGroupRelationId,
                                watchingGroup.groupId,
                                whichCalendarToSync,
                                isChecked);

                            if (isChecked) {
                                initPopupCalendar(whichCalendarToSync, relation);
                            }
                        });
                        $("#calendarToSync").on('click', function() {
                            whichCalendarToSync = $(this).text();
                            initPopupCalendar(whichCalendarToSync, relation);
                        });
                        $("#alertsBtn").on('click', function() {
                            var isChecked = $("#alertsBtn").prop('checked');
                            dirty = true;
                            relation.set("alert", isChecked);
                            relation.save();
                        });
                        $("#contactPermissionsBtn").on('click', function() {
                            $(this).addClass("bg-highlight-grey");
                            setTimeout(function() {
                                Chaplin.utils.redirectTo({
                                    name: 'setting-user-activities-detail-contactpermissions'
                                });
                            }, DEFAULT_ANIMATION_DELAY);
                        });

                        $(".big-menu-item, .menu-item, .empty-space-item").removeClass("hidden");
                        watchingGroup.isWatching ? $('#calendar-sync-with').removeClass('hidden') : $('#calendar-sync-with').addClass('hidden');
                    } //eo results find
                    $("#title").off('click');
                    spinner.stop();
                }, //eo success
                error: function(error) {
                    console.log(error);
                    spinner.stop();
                }
            }); //eo query.find
        }; //eo userChild

        var initPopupCalendar = function(whichCalendarToSync, relation) {
            _showCalendarPicker(whichCalendarToSync, function(selectedCalendar) {
                whichCalendarToSync = selectedCalendar;
                dirty = true;

                watchingGroup = localStorageService.addWatchingGroup(
                    watchingGroup.userGroupRelationId,
                    watchingGroup.groupId,
                    whichCalendarToSync == "None" ? watchingGroup.calendarToSync : whichCalendarToSync,
                    whichCalendarToSync != "None");

                if (watchingGroup.isWatching) {
                    _autoSyncWithCalendar(true);
                } else {
                    // Hide Sync with
                    $('#calendar-sync-with').addClass('hidden');
                }
                $("#calendarToSync").text(watchingGroup.calendarToSync);
            });
        };

        var loadGroupAdmin = function() {
          var query = new Parse.Query(Parse.User);
          query.containedIn("objectId", userIdArray);
          query.ascending("firstName");
          query.find({
              success: function(results) {
                  for (var i = 0; i < results.length; i++) {
                      var staff = results[i];
                      //Load staff contact info
                      var actionWrapperContent = "";
                      var mobilePhone, email;
                      //Get admin's phone number, only need one here
                      if (staff.get("workPhone") != "" && staff.get("workPhone") != null) {
                          mobilePhone = staff.get("workPhone");
                      } else if (staff.get("mobilePhone") != "" && staff.get("mobilePhone") != null) {
                          mobilePhone = staff.get("mobilePhone");
                      } else if (staff.get("homePhone") != "" && staff.get("homePhone") != null) {
                          mobilePhone = staff.get("homePhone");
                      }
                      //Get admin's email
                      if (staff.get("email") != "" && staff.get("email") != null) {
                          email = staff.get("email");
                      }
                      if (mobilePhone != "" && mobilePhone != null) {
                          actionWrapperContent = '<a href="tel:' + mobilePhone + '"><i class="icon-fontello-phone"></i></a>' + '<a href="sms:' + mobilePhone + '"><i class="icon-fontello-comment"></i></a>';
                      }
                      if (email != "" && email != null) {
                          actionWrapperContent = actionWrapperContent + '<a href="mailto:' + email + '"><i class="icon-fontello-email"></i></a>';
                      }
                      actionWrapperContent = actionWrapperContent + '<span style="position: relative; width: 10px; height: 1px;"></span>';
                      //Load staff data
                      $("#main-content").append('<div class="big-menu-item hidden">  \
                          <div class="position">' + groupData.adminJsonList[staff.id] + '</div> \
                          <div class="name">' + staff.get("firstName") + ' ' + staff.get("lastName") + '</div>   \
                          <div class="action-wrapper">' + actionWrapperContent + '</div>  \
                      </div>');
                  }

                  userChild();
              },
              error: function(error) {
                  console.log(error);
                  spinner.stop();
              }
          }); //eo query.find user data

        }
        var query;
        var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation", {}, {
          query: function(){
            return new Parse.Query(this.className);
          }
        });

        query = UserOrganizationGroupRelation.query();
        query.equalTo('organizationGroupId', selectedOrgId);
        query.equalTo('relationType', 'staff');
        query.select('userId', 'position')
        query.ascending('firstName', 'lastName');
        console.log(query);
        query.find({
          success: function(results) {
            userIdArray = [];
            groupData.adminJsonList = [];
            $.each(results, function(i, item) {
              userIdArray.push(item.get('userId'));
              groupData.adminJsonList[item.get('userId')] = item.get('position');
            });
            loadGroupAdmin();
          },
          error: function(error) {
            console.log('Error while get userId');
            console.log(error);
          }
        })
    }; //eo loadActivityDetail
    var addedToDOM = function() {
        initData().then(function() {
            loadActivityDetail();
        });

        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-user-activities-list'
            });
        });
    }; //eo addedToDOM

    var beforeControllerDispose = function() { //mixed in from Chaplin.EventBroker subscribeEvent
        dirty ? relation.save() : $.noop(); //clicked one of the buttons save
        autoSync ? _setUserActivitiesItem(activityId, relation.attributes) : $.noop(); //clicked on the auto sync button save
    }; //eo beforeControllerDispose

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container',
        id: 'setting-user-activities-detail-view',
        listen: {
            addedToDOM: addedToDOM
        },
        initialize: function(options) {
            //Reset footer
            $("#footer-toolbar > li").removeClass("active");
            isMobile = _isMobile(); //are we on the mobile platform
            // isMobile = !isMobile; //uncomment for testing on web
            templateData = {
                mobile: isMobile,
                calendars: _calendar.list
            }; //push into the template
            //this.subscribeEvent('beforeControllerDispose', beforeControllerDispose); //listen for global event call
            Chaplin.View.prototype.initialize.call(this, arguments);
        }
    }); //eo View.extend

    View = View.extend(Chaplin.EventBroker); //sxm mixin the eventBroker so to dispatch/listen to global events

    return View;
});
