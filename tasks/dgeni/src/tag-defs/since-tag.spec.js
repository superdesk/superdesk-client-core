var tagDefFactory = require('./since-tag');

describe("returns tagDef", function() {
  it("should add the injected transforms to the transforms property", function() {
    var trimWhitespaceTransform = function() {};

    var tagDef = tagDefFactory(trimWhitespaceTransform);
    expect(tagDef.transforms).toEqual([trimWhitespaceTransform]);
  });
});