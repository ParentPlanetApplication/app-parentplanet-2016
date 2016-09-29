define([
    'chaplin',
    'views/base/view',
    'text!templates/setting/setting-user-kids-home-view.hbs',
    'jquery'
], function(Chaplin, View, Template, $) {
    'use strict';

    var loadKidsInfo = function() {
        var cache = JSON.parse(_ls.getItem("user"));
        var children = cache.children;
        if (children.length == 0) {
            $("#main-content").html("No children listed");
        } else {
            //Collect list of message ids
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                var color = child.color ? child.color : child.localColor; //in case child belongs to other account
                $("#main-content").append('<div class="menu-item" uid="' + child.id + '"><div class="text-left bold" style="color:' + color + ';">' + child.firstName + '</div><div class="icon-right"><i class="icon-right-open"></i></div></div>');
            }
            $(".menu-item").on('click', function(e) {
                _selectedChildId = $(this).attr("uid");
                $(this).addClass("bg-highlight-grey");
                setTimeout(function() {
                    Chaplin.utils.redirectTo({
                        name: 'setting-user-kids-detail'
                    });
                }, DEFAULT_ANIMATION_DELAY);
            })
        }
    }; //eo loadKidsInfo

    var spinner = null;
    var addedToDOM = function() {
        spinner = _createSpinner('spinner');
        loadKidsInfo();
        spinner.stop();
        $("#backBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-user-home'
            });
        });
        $("#createBtn").on('click', function(e) {
            Chaplin.utils.redirectTo({
                name: 'setting-user-kids-addnew'
            });
        });
    }; //eo addedToDOM

    var View = View.extend({
        template: Template,
        autoRender: true,
        keepElement: false,
        container: '#main-container',
        className: 'view-container',
        id: 'setting-user-kids-home-view',
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
