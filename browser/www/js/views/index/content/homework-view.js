define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/index/content/homework-view.hbs',
        'jquery',
        'parseproxy',
        'spinner',
        'moment',
        'text!templates/phonelist-dropdown-menu.hbs',
        'parse'
    ],
    function(Chaplin, View, Template, $, ParseProxy, spinner, moment, phonelistTemplate, Parse) {
        'use strict';
        var isEdit;
        var sender = {};
        var homeworkView = null;
        var isMobile = false;

        var updateReadHomework = function() { //set locally
            var homeworkRelations = _getUserHomeworkRelations(); //array of obj
            var homeworkRelationArray = $.grep(homeworkRelations, function(homeworkRelation, i) {
                return homeworkRelation.homeworkId == _selectedHomeworkId;
            });
            var homeworkRelation = homeworkRelationArray.length > 0 ? homeworkRelationArray[0] : null;
            var update = function() {
                var id = homeworkRelation.objectId;
                homeworkRelation.isRead = true;
                _setUserHomeworkRelationsItem(id, homeworkRelation); //set locally
            }; //eo update
            $.each(homeworkRelationArray, function(i, relation) { //can have more than one
                homeworkRelation = relation;
                update();
            })
        }; //eo updateReadMessage
        var loadHomework = function() {
            var user = _getUserData();
            var showPhoneList = false;
            var phone;
            var homework = _getUserHomeworkItem(_selectedHomeworkId);
            var senderList = _getHomeworkSenderList();
            var senderArray = [];
            //var sender = null;
            var formatDate = function(date) {
                var str = date ? (date.iso ? moment(new Date(date.iso)).calendar('DD') : moment(new Date(date)).calendar('DD')) : 'none';
                return str;
            }; //eo formatDate
            var formatSender = function() {
                if (sender['showEmail']) {
                    $('#emailto').show();
                    $('#emailto').attr('href', 'mailto:' + sender['email']);
                } //eo email
                if (sender['showMobilePhone']) {
                    if (sender.mobilePhone) {
                        phone = sender.mobilePhone;
                    } else if (sender.workPhone) {
                        phone = sender.workPhone;
                    } else if (sender.homePhone) { phone = sender.homePhone; }
                    if (phone) {
                        phone = phone.replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g, '');
                        $('#smsto').attr("href", "sms://" + phone);
                        //$('#smsto').show(); //only show if mobile
                    }
                } //eo phone
                if (isMobile && sender['showMobilePhone']) {
                    $('#smsto').show();
                }
                showPhoneList = showPhoneList || sender['showMobilePhone'] || sender['showWorkPhone'] || sender['showHomePhone'];
                sender['showPhoneList'] = showPhoneList; //overall show
                if (showPhoneList) {
                    $("#phoneto").show();
                    $("#phoneto").on('click', function(e) {
                        var o = homeworkView.getTemplateData(); //use closure to grab the data from the view
                        _dropdown(phonelistTemplate, o); //show the dropdown
                    });
                } //eo showPhoneList
                $("#sender").html(sender.firstName + " " + sender.lastName);
                $("#sender-detail").removeClass("hidden");
            }; //eo formatSender
            if (!homework) {
                _alert('Selected Homework Not Found:' + _selectedHomeworkId);
                return;
            } //eo no message
            senderArray = $.grep(senderList, function(sender, i) {
                return sender.objectId === homework.creatorId;
            });
            sender = senderArray.length > 0 ? senderArray[0] : null;
            sender ? formatSender() : $.noop();
            if (homework.isCanceled) {
                $("#title").html('CANCELED: ' + homework.title);
            } else {
                $("#title").html(homework.title);
            }
            $("#due").html("Due: " + formatDate(homework.dueDate));
            $("#assigned").html("Assigned: " + formatDate(homework.assignedDate));
            $("#message").html(homework.note);
            $("#message-detail, #reminder-detail, #createdby-detail").removeClass("hidden");
            $("#reminder").html(homework.reminder);
            permissions(user, homework);
            _homework = homework; //grab for edit
        }; //eo loadHomework
        var addTopIcon = function() {
            var el = _selectedIcon ? _selectedIcon : ''; //handle if null or none
            $('.center-icon-menu').append(el);
        }; //eo addTopIcon
        var permissions = function(user, homework) {
            var selectedOrgGroupId = homework.orgIdForThisObject;
            var OrganizationGroup = Parse.Object.extend("OrganizationGroup", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = OrganizationGroup.query();
            var success = function(results) {
                if (results.length === 0) { return; }
                var group = results[0];
                var adminIdList = group.get("adminIdList");
                if (adminIdList.indexOf(user.id) != -1) { $("#editBtn").removeClass("hidden"); }
            }; //eo success
            var error = function(err) { _alert('Permissions error:' + err.message); }; //eo error
            if (user.isAdmin || user.id == homework.creatorId) {
                $("#editBtn").removeClass("hidden");
            } else {
                query.equalTo("objectId", selectedOrgGroupId);
                query.find({ success: success, error: error }); //eo query.find
            }
        }; //eo permissions

        var updateIsReadParse = function() {
            var user = _getUserData();
            var UserHomeworkRelation = Parse.Object.extend("UserHomeworkRelation", {}, {
                query: function() {
                    return new Parse.Query(this.className);
                }
            });
            var query = UserHomeworkRelation.query();
            query.equalTo('parentId', user.id);
            query.equalTo('homeworkId', _selectedHomeworkId);
            query.find({
                success: function(results) {
                    if (results.length == 0) { return; }
                    var relation = results[0];
                    relation.set('isRead', true);
                    relation.save();
                },
                error: function(err) {

                }
            });
        }; //eo updateIsReadParse

        //when the DOM has been updated let gumby reinitialize UI modules
        var spinner = null;
        var addedToDOM = function() {
            if (!_selectedHomeworkId) {
                _alert('Internal Error: No SelectedHomeworkId');
                switch (_view.previousView) {
                    case _view.HOME:
                        Chaplin.utils.redirectTo({ name: 'home' });
                        break;
                    case _view.HOMEWORK_INDEX:
                        Chaplin.utils.redirectTo({ name: 'homework' });
                        break;
                    default:
                        Chaplin.utils.redirectTo({ name: 'homework' });
                        break;
                } //eo switch
            }
            //   markAsRead(); //work locally
            updateReadHomework();
            addTopIcon();
            loadHomework();
            $("#backBtn").on('click', function(e) {
                _setPreviousView();
                Chaplin.utils.redirectTo({ name: 'homework' });
            });
            $("#editBtn").on('click', function(e) {
                // var editHomework = function() {
                //     isEdit = true;
                //     $("#editBtn").html("Done");
                // }; //eo editHomework
                // var doneEdit = function() {
                //     isEdit = false;
                //     $("#editBtn").html("Edit");
                // }; //eo doneEdit
                // isEdit ? doneEdit() : editHomework();
                Chaplin.utils.redirectTo({ name: 'update-homework' });
            }); //eo edit click
            updateIsReadParse();
        }; //eo addedToDOM
        var __id = 'homework-single-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            container: '#main-container',
            id: __id,
            className: 'inner-container',
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                isMobile = _isMobile(); //are we on the mobile platform
                _setCurrentView(_view.SINGLE_HOMEWORK, __id);
                //Reset footer
                $("#footer-toolbar > li").removeClass("active");
                Chaplin.View.prototype.initialize.call(this, arguments);
                homeworkView = this;
            },
            getTemplateData: function() {
                return { mobile: isMobile, contact: sender }; //send data to template
            }
        }); //eo View.extend

        return View;
    });