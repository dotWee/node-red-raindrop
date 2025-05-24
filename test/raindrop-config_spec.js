const helper = require('node-red-node-test-helper');
const should = require('should');
const configNode = require('../nodes/raindrop-config.js');

describe('raindrop-config Node', function() {
  beforeEach(function(done) {
    helper.startServer(done);
  });

  afterEach(function(done) {
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', function(done) {
    const flow = [{
      id: 'n1',
      type: 'raindrop-config',
      name: 'test config',
      server: 'https://api.raindrop.io'
    }];

    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('n1');
      n1.should.have.property('name', 'test config');
      n1.should.have.property('server', 'https://api.raindrop.io');
      done();
    });
  });

  it('should use default server URL when none provided', function(done) {
    const flow = [{
      id: 'n1',
      type: 'raindrop-config',
      name: 'test config'
    }];

    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('n1');
      n1.should.have.property('server', 'https://api.raindrop.io');
      done();
    });
  });

  it('should throw error when no access token is provided', function(done) {
    const flow = [{
      id: 'n1',
      type: 'raindrop-config',
      name: 'test config'
    }];

    helper.load(configNode, flow, () => {
      const n1 = helper.getNode('n1');
      try {
        n1.getClient();
        done(new Error('Should have thrown an error'));
      } catch (error) {
        error.message.should.equal('No access token configured');
        done();
      }
    });
  });

  it('should create client when access token is provided', function(done) {
    const flow = [{
      id: 'n1',
      type: 'raindrop-config',
      name: 'test config'
    }];

    helper.load(configNode, flow, {
      n1: { accessToken: 'test-token' }
    }, () => {
      const n1 = helper.getNode('n1');
      try {
        const client = n1.getClient();
        client.should.be.an.Object();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('should handle test connection with invalid token', function(done) {
    const flow = [{
      id: 'n1',
      type: 'raindrop-config',
      name: 'test config'
    }];

    helper.load(configNode, flow, {
      n1: { accessToken: 'invalid-token' }
    }, async () => {
      const n1 = helper.getNode('n1');
      const result = await n1.testConnection();
      result.should.have.property('success', false);
      result.should.have.property('message');
      done();
    });
  });
});
