define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/create/sendto-template.hbs',
        'jquery',
        'backbone.touch',
        'parse',
        'spinner'
    ],
    function(Chaplin, View, Template, $, touch, Parse, spinner) {
        'use strict';

        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {

            //Init touch/click events
            $("#cancelBtn").on('click', function(e) {
                Chaplin.utils.redirectTo({
                    name: 'create-sendto'
                });
            });
            $("#doneBtn").on('click', function(e) {

            });

            //Load data from server
            var user = Parse.User.current();
            var P2Group = Parse.Object.extend("Group", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var query = P2Group.query();
            query.equalTo("organizationId", user.get("organizationId"));
            query.ascending("groupName");
            query.find({
                success: function(results) {
                    console.log("Successfully retrieved " + results.length + " group(s).");
                    // Do something with the returned Parse.Object values

                    for (var i = 0; i < results.length; i++) {
                        var object = results[i];

                        $("#innerview").append(
                            '<div class="create-menu-item pointer group-item">'
                            + '<div class="text" groupId="' + object.id + '">' + object.get("groupName") + '</div>'
                            + '</div>'
                        );
                    }

                    touch.$(".group-item").on("click", function(e){

                    });

                    spinner.fade();
                },
                error: function(error) {
                    _alert("Error: " + error.code + " " + error.message);
                    spinner.fade();
                }
            });
        };

        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            container: '#main-container',
            className: 'view-container custom-list-view',
            //containerMethod: "prepend",
            listen: {
                addedToDOM: addedToDOM
            },
            initialize: function(options) {
                spinner.show("Loading");
                Chaplin.View.prototype.initialize.call(this, arguments);
            }
        }); //eo View.extend

        return View;
    });
