var zesk = require('../es');

let assert = require('assert');
let should = require('should')

describe('zesk', () => {
  it('should be an object', () => {
	  zesk.should.be.an.object(zesk);
  });
});