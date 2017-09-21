var zesk = require('../src/index');

let assert = require('assert');
let should = require('should')

describe('zesk', () => {
  it('should contain a member ZeskObject', () => {
	  should(zesk).have.property('ZeskObject');
  });
});