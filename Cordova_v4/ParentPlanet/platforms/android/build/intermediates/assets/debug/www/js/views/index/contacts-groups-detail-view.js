define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/index/contacts-groups-detail-view.hbs',
        'jquery',
        'parseproxy',
        'moment',
        'parse'
    ],
    function(Chaplin, View, Template, $, ParseProxy, moment, Parse) {
        'use strict';
        var contactsList = null;

        var loadContacts = function() {
            var contactsDataArray = null;
            function noContacts() {
                $("#contacts-content").html('<div style="text-align:center; padding:0 10px;">No contact information available.</div>');
            }; //eo noContacts
            function hasContacts() {
                var id = _selectedContactId;
                var arr = [];
                arr.push(id);
                $("#contacts-content").empty();
                //Load students
                var Contact = Parse.Object.extend("User", {}, {
                  query: function(){
                    return new Parse.Query(this.className);
                  }
                });
                var query = Contact.query();
                query.containedIn("objectId", arr);
                query.find({
                    success: function(results) {
                        var hasContacts = function() {
                            var parentNum = 1;
                            $.each(contactsDataArray, function(i, contact) {
                                var addressFull = "";
                                var addressInfo = "";
                                var firstName = contact.get("showParentFirstName") ? contact.get("firstName") : "";
                                var lastName = contact.get("showParentLastName") ? contact.get("lastName") : "";
                                var fullName =  firstName.length > 0 || lastName.length > 0 ? firstName + " " + lastName : "Private";
                                var pName = "<span class='p-name' style='font-size: 18px;'>" + fullName + "</span>";
                                var homePhone = contact.get("showHomePhone") ? contact.get("homePhone") : null;
                                var mobilePhone = contact.get("showMobilePhone") ? contact.get("mobilePhone") : null;
                                var workPhone = contact.get("showWorkPhone") ? contact.get("workPhone") : null;
                                var email = contact.get("showEmail") ? contact.get("email") : "";
                                var city = contact.get("city");
                                var zip = contact.get("zip");
                                var state = contact.get("state");
                                var addToContacts = addTo();
                                function addTo() {
                                    var isMobile = _isMobile(); //are we on the mobile platform
                                    var s = isMobile ? '<div id="addtocontacts" class="add-to-contacts">Add to Contacts <i class="icon-user-add"></i></div>' : '';
                                    return s;
                                };
                                // $("#title").html(contact.get('lastName') + " Family");
                                // $("#studentDetail").append('<div class="line-wrapper"><div class="left">' + _selectedContact.c.lastName + ', ' + _selectedContact.c.firstName + '</div>');
                                var showAddress = function() {
                                    addressInfo += contact.get("addressLine1") ? '<a id="maplink" class="active-link" >' + contact.get("addressLine1") + "<br/>" : '<a id="maplink" class="active-link" >' ;
                                    addressInfo += contact.get("addressLine2") ? contact.get("addressLine2") + "<br/>" : "";
                                    addressInfo = city.length > 0 && state.length > 0 ? addressInfo + city + ", " + state + " " + zip : addressInfo + city + state + " " + zip;
                                    addressInfo = city.length > 0 || state.length || zip.length > 0 ? addressInfo + "<br/>" : addressInfo;
                                    addressInfo += "</a>"; //close maplink anchor
                                //  addressInfo += '<a id="maplink" ><i class="icon-location"></i>Open Map Link</a><br/>';
                                    addressFull += contact.get("addressLine1") ? contact.get("addressLine1") : "";
                                    addressFull += contact.get("addressLine2") ? " " + contact.get("addressLine2") : "";
                                    addressFull += city.length > 0 ? " " + city : "";
                                    addressFull += state.length > 0 ? ", " + state : "";
                                    addressFull += zip.length > 0 ? " " + zip : "";
                                }; //eo showAddress
                                addressInfo += pName + "<br/>";
                                contact.get("showAddress") ? showAddress() : $.noop();
                                addressInfo += '<a href="mailto:'+email+'"><span class="p-email">' + email + '</span></a><br/>';
                                addressInfo += homePhone ? '<a href="tel:'+homePhone.replace(/-/g,"")+'"><span class="fa fa-phone" style="font-size:small;">  home: ' + homePhone + "</span></a><br/>" : "";
                                addressInfo += mobilePhone ? '<a href="tel:'+mobilePhone.replace(/-/g,"")+'"><span class="fa fa-phone" style="font-size:small;">  cell: ' + mobilePhone + "</span></a><br/>" : "";
                                addressInfo += workPhone ? '<a href="tel:'+workPhone.replace(/-/g,"")+'"><span class="fa fa-phone" style="font-size:small;">  work: ' + workPhone + "</span></a><br/>" : "";
                             // remove addToContacts for now
                             //   $("#contect-detail-content").append('<div id="parent' + parentNum + '" class="box parent hidden"><div class="title"> Contact #' + parentNum + ' </div><div class="parent-info-left">' + addressInfo + '</div>'+addToContacts+'</div>');
                                $("#contect-detail-content").append('<div id="parent' + parentNum + '" class="box parent hidden"><div class="title"> Contact #' + parentNum + ' </div><div class="parent-info-left">' + addressInfo + '</div>&nbsp;</div>');

                                parentNum++;
                                $("#maplink").on("click", function(e) {
                                    var href = encodeURI(addressFull);
                                    console.log('clicked on map link', href);
                                    href = _googleMaps + href;
                                   // var href = 'http://maps.google.com/?q=1200%20Pennsylvania%20Ave%20SE,%20Washington,%20District%20of%20Columbia,%2020003';
                                    var ref = window.open(href, '_system', 'location=no');
                                });
                                $("#addtocontacts").on("click", function(e) {
                                    var contact;
                                    var phoneNumbers = [];
                                    var addresses = [];
                                    event.preventDefault();
                                    if (!navigator.contacts) {
                                        _alert("Internal Error: Contacts API not supported");
                                        return;
                                    }
                                    contact = navigator.contacts.create();
                                    contact.name = {givenName: firstName, familyName: lastName};
                                    phoneNumbers[0] = new ContactField('work', workPhone, false);
                                    phoneNumbers[1] = new ContactField('mobile', mobilePhone, true);
                                    phoneNumbers[2] = new ContactField('home', homePhone, true);
                                    contact.phoneNumbers = phoneNumbers;
                                    addresses[0] = new ContactAddress(false,'home',null,addressFull,city,state,zip,null);
                                    contact.addresses = addresses;
                                    contact.save();
                                    return false;
                                });
                            }); //eo each contactsDataArray loop
                            $("#studentDetail").removeClass("hidden");
                            $(".parent").removeClass("hidden");
                        }; //eo inner hasContacts
                        var success = function(results) {
                            contactsDataArray = results;
                            contactsDataArray.length == 0 ? noContacts() : hasContacts();
                        }; //eo inner success
                        var error = function(err) {
                            _alert("Internal Error, Contacts loading data:"+err.code+' '+err.message);
                        }; //eo inner error
                        contactsDataArray = results;
                        $.each(contactsDataArray, function(i, contact) {
                            var associates = contact.get("associates");
                            arr = associates ? arr.concat(associates) : arr;
                            $("#title").html(contact.get('lastName') + " Family");
                            $("#studentDetail").append('<div class="line-wrapper"><div class="left">' + _selectedContact.c.lastName + ', ' + _selectedContact.c.firstName + '</div>');
                        });
                        query.containedIn("objectId", arr);
                        query.find({    success: success,    error: error    });
                        // contactsDataArray.length == 0 ? noContacts() : hasContacts();
                    }, //eo outer success
                    error: function(err) {
                        _alert("Internal Error, Contacts loading data:"+err.code+' '+err.message);
                    } //eo outer error
                }); //eo query.find
            }; //eo outer hasContacts
            _selectedContactId ? hasContacts() : noContacts();
        }; //eo loadChildren
        // var loadContactDetail = function() {
        //     var isStudentInfoReady = false;
        //     var isParentInfoReady = false;
        //     /*
        //     Load student's classes
        //     */
        //     var contacts = user.data.contacts;
        //     var contact;
        //     loop: for (var i = 0; i < contacts.length; i++) {
        //         contact = contacts[i];
        //         if (_selectedContact.orgId != "all-contacts") {
        //             if (contact.objectId == _selectedContactId && contact.organizationId == _selectedContact.orgId) {
        //                 break loop;
        //             }
        //         } else if (contact.objectId == _selectedContactId) {
        //             break loop;
        //         }
        //     } //eo loop
        //     var totalStudentResponses = 0;
        //     for (var i = 0; i < contact.studentIdList.length; i++) {
        //         var childId = contact.studentIdList[i];
        //         var UserOrganizationGroupRelation = Parse.Object.extend("UserOrganizationGroupRelation");
        //         var query = new Parse.Query(UserOrganizationGroupRelation);
        //         query.equalTo("userId", childId);
        //         var spinner = _createSpinner('spinner');
        //         query.find({
        //             success: function(results) {
        //                 if (results.length == 0) {} else {
        //                     var fullGroupName = "";
        //                     for (var i = 0; i < results.length; i++) {
        //                         var result = results[i];
        //                         fullGroupName += result.get("groupName");
        //                         if (i < (results.length - 1)) {
        //                             fullGroupName += ", ";
        //                         }
        //                     }
        //                     $("#studentDetail").append('<div class="line-wrapper"><div class="left">' + results[0].get("firstName") + '</div><div class="right">' + fullGroupName + '</div></div>');
        //                 } //eo results.length
        //                 totalStudentResponses++;
        //                 if (contact.studentIdList.length == totalStudentResponses) {
        //                     isStudentInfoReady = true;
        //                     if (isParentInfoReady) {
        //                         $("#title").html(contact.familyTitle + " Family");
        //                         $("#studentDetail").removeClass("hidden");
        //                         $(".parent").removeClass("hidden");
        //                     }
        //                 } //eo contact.studentIdList.length
        //                 spinner.stop();
        //             }, //eo success
        //             error: function(error) {
        //                 spinner.stop();
        //                 _alert("Could not connect to server, please try again later.");
        //             } //eo error
        //         }); //eo query.find
        //     } //eo for contact.studentIdList.length
        //     /*
        //         Load parent contact info
        //     */
        //     var parentNum = 1;
        //     var totalParentResponses = 0;
        //     for (var i = 0; i < contact.parentIdList.length; i++) {
        //         var parentId = contact.parentIdList[i];
        //         var query = new Parse.Query(Parse.User);
        //         query.equalTo("objectId", parentId);
        //         var spinner = _createSpinner('spinner');
        //         query.find({
        //             success: function(results) {
        //                 if (results.length == 0) {} else {
        //                     var parent = results[0];
        //                     var addressFull = "";
        //                     var addressInfo = "";
        //                     addressInfo += "<span class='p-name' style='font-size: 18px;'>" + parent.get("firstName") + " " + parent.get("lastName") + "</span><br/>";
        //                     addressInfo += '<a id="maplink" class="active-link" >' + parent.get("addressLine1") + "<br/>";
        //                     if (parent.get("addressLine2") != "" && parent.get("addressLine2") != null) {
        //                         addressInfo += parent.get("addressLine2") + "<br/>";
        //                     }
        //                     addressInfo += parent.get("city") + ", " + parent.get("state") + " " + parent.get("zip") + "<br/>";
        //                     addressInfo += "</a>"; //close maplink anchor
        //                   //  addressInfo += '<a id="maplink" ><i class="icon-location"></i>Open Map Link</a><br/>';
        //                     addressInfo += "<span class='p-email'>" + parent.get("email") + "</span><br/>";
        //                     addressFull += parent.get("addressLine1") ? parent.get("addressLine1") : "";
        //                     addressFull += parent.get("addressLine2") ? " " + parent.get("addressLine2") : "";
        //                     addressFull += parent.get("city") ? " " + parent.get("city") : "";
        //                     addressFull += parent.get("state") ? ", " + parent.get("state") : "";
        //                     addressFull += parent.get("zip") ? " " + parent.get("zip") : "";
        //                     if (parent.get("homePhone") != "" && parent.get("homePhone") != null) {
        //                         addressInfo += "<span class='p-homephone'>" + parent.get("homePhone") + "</span> home<br/>";
        //                     }
        //                     if (parent.get("mobilePhone") != "" && parent.get("mobilePhone") != null) {
        //                         addressInfo += "<span class='p-mobilephone'>" + parent.get("mobilePhone") + "</span> cell<br/>";
        //                     }
        //                     if (parent.get("workPhone") != "" && parent.get("workPhone") != null) {
        //                         addressInfo += "<span class='p-workphone'>" + parent.get("workPhone") + "</span> work<br/>";
        //                     }
        //                     $("#contect-detail-content").append('<div id="parent' + parentNum + '" class="box parent hidden"><div class="title">Parent ' + parentNum + '</div><div class="parent-info-left">' + addressInfo + '</div><div class="add-to-contacts">Add to Contacts <i class="icon-user-add"></i></div></div>');
        //                     parentNum++;
        //                     $("#maplink").on("click", function(e) {
        //                         var href = encodeURI(addressFull);
        //                         console.log('clicked on map link', href);
        //                         href = 'http://maps.google.com/?q=' + href;
        //                        // var href = 'http://maps.google.com/?q=1200%20Pennsylvania%20Ave%20SE,%20Washington,%20District%20of%20Columbia,%2020003';
        //                         var ref = window.open(href, '_blank', 'location=no');
        //                     });
        //                 }
        //                 totalParentResponses++;
        //                 if (totalParentResponses == contact.parentIdList.length) {
        //                     isParentInfoReady = true;
        //                     //Init events
        //                     $(".add-to-contacts").on('click', function(e) {
        //                         var parent = $(this).parent().children(".parent-info-left:eq(0)");
        //                         var name = parent.children(".p-name:eq(0)").html();
        //                         var emails = [];
        //                         emails.push(new ContactField('work', parent.children(".p-email:eq(0)").html(), true));
        //                         var phoneNumbers = [];
        //                         if (parent.children(".p-homephone:eq(0)")) {
        //                             phoneNumbers.push(new ContactField('home', parent.children(".p-homephone:eq(0)").html(), false));
        //                         }
        //                         if (parent.children(".p-mobilephone:eq(0)")) {
        //                             phoneNumbers.push(new ContactField('cell', parent.children(".p-mobilephone:eq(0)").html(), true));
        //                         }
        //                         if (parent.children(".p-workphone:eq(0)")) {
        //                             phoneNumbers.push(new ContactField('work', parent.children(".p-workphone:eq(0)").html(), false));
        //                         }
        //                         //Create contact
        //                         function addToContactsMobile(o) {
        //                             var myContact = navigator.contacts.create(o);
        //                             myContact.save(function() {
        //                                 _alert("Successfully added contact");
        //                             }, function(contactError) {
        //                                 _alert("Error = " + contactError.code);
        //                             });
        //                         };
        //                         function addToContacts(o) {
        //                             var _vcard = vcard();
        //                             _vcard.addVcard(o);
        //                             _vcard.download();
        //                         };
        //                         var o = {
        //                             "displayName": name,
        //                             "name": name,
        //                             "emails": emails,
        //                             "phoneNumbers": phoneNumbers
        //                         };
        //                         ($('body').data('isMobile') ? addToContactsMobile(o) : addToContacts(o));
        //                     });
        //                     if (isStudentInfoReady) {
        //                         $("#title").html(contact.familyTitle + " Family");
        //                         $("#studentDetail").removeClass("hidden");
        //                         $(".parent").removeClass("hidden");
        //                     } //eo isStudentInfoReady
        //                 } //eo totalParentResponses
        //                 spinner.stop();
        //             }, //eo success
        //             error: function(error) {
        //                 spinner.stop();
        //             }
        //         }); //eo query.find
        //     } //eo for contact.parentIdList.length
        // }; //eo loadContactDetail
        var spinner = null;
        var addedToDOM = function() {
            spinner = _createSpinner('spinner');
            loadContacts();
            //Init touch events
            $("#backBtn").on('click', function() {
                _setPreviousView();
                Chaplin.utils.redirectTo({
                    name: 'contacts-groups'
                });
            });
            spinner.stop();
        }; //eo addedToDOM

        var View = View.extend({
            template: Template,
            autoRender: true,
            //keepElement: true,
            container: '#main-container',
            id: 'contacts-groups-detail-view',
            className: 'view-container',
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                //Reset footer
                $("#footer-toolbar > li").removeClass("active");
                $("#contacts-tool").addClass("active");
                Chaplin.View.prototype.initialize.call(this, arguments);
            }
        }); //eo View.extend

        return View;
    });
