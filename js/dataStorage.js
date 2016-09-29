define("SomeCollection", ["localstorage"], function() {
    var SomeCollection = Backbone.Collection.extend({
        localStorage: new Backbone.LocalStorage("SomeCollection") // Unique name within your app.
    });

    return SomeCollection;
});