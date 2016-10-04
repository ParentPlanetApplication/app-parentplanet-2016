// Generated by CoffeeScript 1.7.1
(function() {
  var Backbone, localStorage;

  Backbone = window.Backbone, localStorage = window.localStorage;

  describe('monkey patching', function() {
    return it('aliases Backbone.sync to backboneSync', function() {
      expect(window.backboneSync).toBeDefined();
      return expect(window.backboneSync.identity).toEqual('sync');
    });
  });

  describe('offline localStorage sync', function() {
    var collection, model;
    collection = {}.collection;
    model = {}.model;
    model = Backbone.Model.extend({
      idAttribute: '_id'
    });
    beforeEach(function() {
      var Collection;
      localStorage.clear();
      localStorage.setItem('cats', '1,2,3,a,deadbeef-c03d-f00d-aced-dec0ded4b1ff');
      localStorage.setItem('cats_dirty', '2,a,deadbeef-c03d-f00d-aced-dec0ded4b1ff');
      localStorage.setItem('cats_destroyed', '3');
      localStorage.setItem('cats1', '{"_id": "1", "color": "translucent"}');
      localStorage.setItem('cats2', '{"_id": "2", "color": "auburn"}');
      localStorage.setItem('cats3', '{"_id": "3", "color": "burgundy"}');
      localStorage.setItem('catsa', '{"_id": "a", "color": "scarlet"}');
      localStorage.setItem('catsnew', '{"_id": "deadbeef-c03d-f00d-aced-dec0ded4b1ff", "color": "pearl"}');
      Collection = Backbone.Collection.extend({
        model: model,
        url: 'cats'
      });
      return collection = new Collection([
        {
          _id: 1,
          color: 'translucent'
        }, {
          _id: 2,
          color: 'auburn'
        }, {
          _id: 3,
          color: 'burgundy'
        }, {
          _id: 'a',
          color: 'scarlet'
        }, {
          _id: 'deadbeef-c03d-f00d-aced-dec0ded4b1ff',
          color: 'pearl'
        }
      ]);
    });
    describe('syncDirtyAndDestroyed', function() {
      return it('calls syncDirty and syncDestroyed', function() {
        var syncDestroyed, syncDirty;
        syncDirty = spyOn(Backbone.Collection.prototype, 'syncDirty');
        syncDestroyed = spyOn(Backbone.Collection.prototype, 'syncDestroyed');
        collection.syncDirtyAndDestroyed();
        expect(syncDirty).toHaveBeenCalled();
        return expect(syncDestroyed).toHaveBeenCalled();
      });
    });
    describe('syncDirty', function() {
      it('finds and saves all dirty models', function() {
        var saveInteger, saveString;
        saveInteger = spyOn(collection.get(2), 'save').andCallThrough();
        saveString = spyOn(collection.get('a'), 'save').andCallThrough();
        collection.syncDirty();
        expect(saveInteger).toHaveBeenCalled();
        expect(saveString).toHaveBeenCalled();
        return expect(localStorage.getItem('cats_dirty')).toBeFalsy();
      });
      return it('works when there are no dirty records', function() {
        localStorage.removeItem('cats_dirty');
        return collection.syncDirty();
      });
    });
    describe('syncDestroyed', function() {
      it('finds all models marked as destroyed and destroys them', function() {
        var destroy;
        destroy = spyOn(collection.get(3), 'destroy');
        collection.syncDestroyed();
        return expect(localStorage.getItem('cats_destroyed')).toBeFalsy();
      });
      return it('works when there are no destroyed records', function() {
        localStorage.setItem('cats_destroyed', '');
        return collection.syncDestroyed();
      });
    });
    describe('dirtyModels', function() {
      return it('returns the model instances that are dirty', function() {
        return expect(collection.dirtyModels().map(function(model) {
          return model.id;
        })).toEqual([2, 'a', 'deadbeef-c03d-f00d-aced-dec0ded4b1ff']);
      });
    });
    return describe('destoyedModelsIds', function() {
      return it('returns the ids of models that have been destroyed locally but not synced', function() {
        return expect(collection.destroyedModelIds()).toEqual(['3']);
      });
    });
  });

}).call(this);

//# sourceMappingURL=backbone_extensions_spec.map