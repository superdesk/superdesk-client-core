var tagDefFactory = require('./throws-tag');

describe("returns tagDef", function() {
  it("should add the injected transforms to the transforms property", function() {
    var extractTypeTransform = function() {};
    var extractNameTransform = function() {};
    var wholeTagTransform = function() {};

    var tagDef = tagDefFactory(extractTypeTransform, extractNameTransform, wholeTagTransform);
    expect(tagDef.transforms).toEqual([extractTypeTransform, extractNameTransform, wholeTagTransform]);
  });
});