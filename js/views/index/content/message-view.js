define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/index/content/message-view.hbs',
        'jquery',
        'parseproxy',
        'spinner',
        'moment',
        'underscore',
        'text!templates/phonelist-dropdown-menu.hbs',
        'parse'
    ],
    function(Chaplin, View, Template, $, ParseProxy, spinner, moment, _, phonelistTemplate, Parse) {
        'use strict';
        var isMobile = false;
        var sender = {};
        var messageView = null;
        var addTopIcon = function() {
            var el = _selectedIcon ? _selectedIcon : ''; //handle if null or none
            $('.center-icon-menu').append(el);
        }; //eo addTopIcon
        var updateReadMessage = function() { //set locally
            var messageRelations = _getUserMessageRelations(); //array of obj
            var messageRelationArray = $.grep(messageRelations, function(messageRelation, i) {
                return messageRelation.messageId == _selectedMessageId;
            });
            var messageRelation = messageRelationArray.length > 0 ? messageRelationArray[0] : null;
            var update = function() {
                var id = messageRelation.objectId;
                messageRelation.isRead = true;
                _setUserMessagesRelationsItem(id, messageRelation); //set locally
            }; //eo update
            messageRelation ? update() : $.noop();
        }; //eo updateReadMessage
        var loadMessage = function() {
            var showPhoneList = false;
            var phone;
            var message = _getUserMessagesItem(_selectedMessageId);
            var senderList = _getMessageSenderList();
            var senderArray = [];
            //var sender = null;
            var formatSender = function() {
                if (sender['showEmail']) {
                    $('#emailto').show();
                    $('#emailto').attr('href', 'mailto:' + sender['email']);
                } //eo email
                if (sender['showMobilePhone']) {
                    if (sender.mobilePhone) {    phone = sender.mobilePhone;
                    } else if (sender.workPhone) {    phone = sender.workPhone;
                    } else if (sender.homePhone) {    phone = sender.homePhone;    }
                    if (phone) {
                        phone = phone.replace(/[&\/\\#,+()$~%.'":*?<>{}-]/g,'');
                        $('#smsto').attr("href", "sms://" + phone);
                        //$('#smsto').show(); //do not show if not on mobile device
                    }
                } //eo phone
                if(isMobile && sender['showMobilePhone']) {
                    $('#smsto').show();
                }
                showPhoneList = showPhoneList || sender['showMobilePhone'] || sender['showWorkPhone'] || sender['showHomePhone'];
                sender['showPhoneList'] = showPhoneList; //overall show
                if (showPhoneList) {
                    $("#phoneto").show();
                    $("#phoneto").on('click', function(e) {
                        var o = messageView.getTemplateData(); //use closure to grab the data from the view
                        _dropdown(phonelistTemplate, o); //show the dropdown
                    });
                } //eo showPhoneList
                $("#sender").html(sender.firstName + " " + sender.lastName);
                $("#sender-detail").removeClass("hidden");
            }; //eo formatSender
            if(!message) {
                _alert('Selected Message Not Found:'+_selectedMessageId);
                return;
            } //eo no message
            senderArray = $.grep(senderList, function(sender,i) {
                return sender.objectId === message.senderId;
            });
            sender = senderArray.length > 0 ? senderArray[0] : null;
            sender ? formatSender() : $.noop();
            $("#title").html(message.title);
            $("#posted").html("Posted: " + moment(new Date(message.createdAt)).format('dddd MM/DD/YY, h:mm a'));
            $("#message").html(message.message);
            $("#message-detail, #reminder-detail, #createdby-detail").removeClass("hidden");
        }; //eo loadMessage
        var handleOverthrow = function() { //set the height of the message-detail in pixels so that overthrow can work
            var viewHeight = $('.view-container').height();
            var shim = -1;
            var h = viewHeight - shim;
            var arr = ["#createdby-detail", "#sender-detail", "#reminder-detail"];
            _.each(arr, function(id, i) {
                var _h = $(id).outerHeight(true);
                h = h - _h;
            });
            $('#message-detail').css('height', h + 'px');
            //Fix overthrown issue, iOS safari behave differently from Chrome
            //It looks like if the parent's overflow css is set to be none, then its child is set to be none as well (weird)
            $("#message-detail").css("position", "absolute");
            $("#message-detail").css("top", $("#message-detail").offset().top + "px");
            $("#message-detail").detach().appendTo(".view-container");
            $("#reminder-detail").css({
                "position": "absolute",
                "bottom": "49px",
                "border-bottom": "none",
                "width": "100%"
            });
        }; //eo handleOverthrow

        var updateIsReadParse = function() {
            var user = _getUserData();
            var UserMessageRelation = Parse.Object.extend("UserMessageRelation", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = UserMessageRelation.query();
            query.equalTo('parentId', user.id);
            query.equalTo('messageId', _selectedMessageId);
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
        //var spinner = null;
        var addedToDOM = function() {
            if(!_selectedMessageId) {
                _alert('Internal Error: No SelectedMessageId');
                switch (_view.previousView) {
                    case _view.HOME:    Chaplin.utils.redirectTo({    name: 'home'    });    break;
                    case _view.MESSAGES_INDEX:    Chaplin.utils.redirectTo({    name: 'message'    });    break;
                    default:    Chaplin.utils.redirectTo({    name: 'message'    });    break;
                } //eo switch
            }
            updateReadMessage();
            addTopIcon();
            loadMessage();
            //handleOverthrow();
            $("#backBtn").on('click', function(e) {
                switch (_view.previousView) {
                    case _view.HOME:
                    _setPreviousView();
                    Chaplin.utils.redirectTo({   name: 'home'    });
                    break;
                    case _view.MESSAGES_INDEX:
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'message'    });
                    break;
                    default:
                    _setPreviousView();
                    Chaplin.utils.redirectTo({    name: 'message'    });
                    break;
                } //eo switch
            }); //eo backBtn
            updateIsReadParse();
        }; //eo addedToDOM
        var __id = 'message-single-view';
        var View = View.extend({
            template: Template,
            autoRender: true,
            id: __id,
            container: '#main-container',
            className: 'inner-container message-view',
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                _setCurrentView(_view.SINGLE_MESSAGE, __id);
                isMobile = _isMobile(); //are we on the mobile platform
                //Reset footer
                $("#footer-toolbar > li").removeClass("active");
                Chaplin.View.prototype.initialize.call(this, arguments);
                messageView = this;
            },
            getTemplateData: function() {
                return { mobile:isMobile, contact: sender }; //send data to template
            }
        });

        return View;
    });
