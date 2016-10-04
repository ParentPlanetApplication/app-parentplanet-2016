define(
    [
        'chaplin',
        'views/base/view',
        'text!templates/create/group-info.hbs',
        'jquery',
        'parse',
        'spinner'
    ],
    function(Chaplin, View, Template, $, Parse, spinner) {
        'use strict';



        //when the DOM has been updated let gumby reinitialize UI modules
        var addedToDOM = function() {
            var latestSelectedStudentId = [];

            //Init touch/click events
            $("#cancelBtn").on('click', function(e) {
                //Clear the latest selected student IDs
                if(latestSelectedStudentId.length > 0){
                    var studentId, index;
                    for(var i=0; i<latestSelectedStudentId.length; i++){
                        studentId = latestSelectedStudentId[i];

                        if(_selectedStudentIdFromGroup[_group.id].indexOf(studentId) != -1 ){
                            index = _selectedStudentIdFromGroup[_group.id].indexOf(studentId);
                            _selectedStudentIdFromGroup[_group.id].splice(index, 1);
                        }
                    }
                }

                Chaplin.utils.redirectTo({
                    name: 'create-custom-list'
                });
            });

            $("#doneBtn").on('click', function(e) {
                Chaplin.utils.redirectTo({
                    name: 'create-custom-list'
                });
            });

            //Adjust interface
            $("#group-name").html(_group.name);

            //Load data from server
            var P2Group = Parse.Object.extend("Group", {}, {
              query: function(){
                return new Parse.Query(this.className);
              }
            });
            var groupQuery = P2Group.query();
            groupQuery.equalTo("objectId", _group.id);

            groupQuery.find({
                success: function(results) {
                    // results has the list of users with a hometown team with a winning record
                    var object = results[0];
                    var members = object.get("members");

                    var Student = Parse.Object.extend("Student", {}, {
                      query: function(){
                        return new Parse.Query(this.className);
                      }
                    });
                    var studentQuery = Student.query();
                    studentQuery.containedIn("objectId", members);
                    studentQuery.ascending("firstName");
                    studentQuery.find({
                        success: function(student_results) {
                            // results has the list of users with a hometown team with a winning record
                            for(var i=0; i<student_results.length; i++){
                                var obj = student_results[i];
                                $(".inner").append(
                                    '<div class="item-list">'
                                        + '<div class="icon-wrapper" studentId="' + obj.id + '"><i class="icon-fontello-circle icon-grey"></i></div>'
                                        + '<div class="name-wrapper pointer" id="' + obj.id + '" studentId="' + obj.id + '">' + obj.get("firstName") + " " + obj.get("lastName") + '</div>'
                                        + '</div>'
                                    + '</div>'
                                );

                            }

                            //Init events
                            $(".item-list").on("click", function(e){
                                var studentId = $(this).children().first().attr("studentId");

                                if(_selectedStudentIdFromGroup[_group.id].indexOf(studentId) == -1){
                                    _selectedStudentIdFromGroup[_group.id].push(studentId);
                                    latestSelectedStudentId.push(studentId);
                                    $(this).children().first().html('<i class="icon-fontello-ok-circled icon-red"></i>');

                                }else{
                                    var index = _selectedStudentIdFromGroup[_group.id].indexOf(studentId);
                                    _selectedStudentIdFromGroup[_group.id].splice(index, 1);
                                    index = latestSelectedStudentId.indexOf(studentId);
                                    latestSelectedStudentId.splice(index, 1);
                                    $(this).children().first().html('<i class="icon-fontello-circle icon-grey"></i>');
                                }
                            });

                            //Clear all selected students
                            $("#clear-all").on("click", function(e){
                                $(".icon-wrapper").html('<i class="icon-fontello-circle icon-grey"></i>');
                                _selectedStudentIdFromGroup[_group.id] = [];
                            });
                            _clearClickEventOnMobile("#clear-all");

                            //Select all students
                            $("#select-all").on("touchend click", function(e){
                                $(".icon-wrapper").html('<i class="icon-fontello-ok-circled icon-red"></i>');

                                $(".icon-wrapper").each(function(){
                                    var studentId = $(this).attr("studentId");
                                    if(_selectedStudentIdFromGroup[_group.id].indexOf(studentId) == -1){
                                        _selectedStudentIdFromGroup[_group.id].push(studentId);
                                    }
                                });
                            });

                            //Read selected student data and draw red circled icon
                            if(_selectedStudentIdFromGroup[_group.id]){
                                if(_selectedStudentIdFromGroup[_group.id].length > 0){
                                    var studentId;
                                    for(var i=0; i<_selectedStudentIdFromGroup[_group.id].length; i++){
                                        studentId = _selectedStudentIdFromGroup[_group.id][i];
                                        console.log(studentId);
                                        $("#"+studentId).parent().children().first().html('<i class="icon-fontello-ok-circled icon-red"></i>');
                                    }
                                }
                            }


                            //Show this view
                            $("#innerview").removeClass("hidden");
                            //Hide spinner
                            spinner.fade();

                        },

                        error: function(error) {
                            _alert("Error: " + error.code + " " + error.message);
                            $("#innerview").removeClass("hidden");
                            spinner.fade();
                        }
                    });

                },
                error: function(error) {
                    _alert("Error: " + error.code + " " + error.message);
                    $("#innerview").removeClass("hidden");
                    spinner.fade();
                }

            });
        };

        var View = View.extend({
            template: Template,
            autoRender: true,
            keepElement: false,
            container: '#main-container',
            className: 'view-container group-info-view',
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
