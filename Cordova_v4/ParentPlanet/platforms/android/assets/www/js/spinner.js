define([
    'chaplin', 
    'jquery', 
    'module'
], function(Chaplin, $, module) {
    'use strict';

    function Spinner() {
        var spinner = {
            show: function(text){
                if(text) $("#spinner-text").html(text);
                $("#spinner-container").removeClass("hidden");
                $("#spinner-text").addClass("blink");
            },
            hide: function(){
                $("#spinner-container").addClass("hidden");
                $("#spinner-text").html("Loading...");
            },
            fade: function(callback){
                $("#spinner-container").animate({"opacity": 0}, 250, function(){
                    $("#spinner-container").addClass("hidden");
                    //Give the browser/webview some time to add class before setting CSS to prevent some abnormal bug
                    setTimeout(function(){
                        $("#spinner-container").css("opacity", 1);
                        $("#spinner-text").html("Loading...");
                        if(callback) callback();
                    }, 250);
                });
            },
            setText: function(text, callback){
                $("#spinner-text").html(text);
                if(callback) callback();
            },
            setFinalText: function(text, callback){
                $("#spinner-text").html(text);
                $("#spinner-text").removeClass("blink");
                if(callback) callback();
            }
        }; //eo spinner
        //return this === ParseProxy initialized!
        return spinner;
    }; //eo Spinner
    //return the ParseProxy constructor :)
    return Spinner();
});
