const helper = require('node-red-node-test-helper');
const should = require('should');
const configNode = require('../nodes/raindrop-config.js');
const searchNode = require('../nodes/raindrop-search.js');

describe('raindrop-search Node', function() {
  beforeEach(function(done) {
    helper.startServer(done);
  });

  afterEach(function(done) {
    helper.unload();
    helper.stopServer(done);
  });

  it('should be loaded', function(done) {
    const flow = [
      { id: 'c1', type: 'raindrop-config', name: 'test config' },
      {
        id: 'n1', type: 'raindrop-search', name: 'test search', config: 'c1'
      }
    ];

    helper.load([configNode, searchNode], flow, () => {
      const n1 = helper.getNode('n1');
      n1.should.have.property('name', 'test search');
      done();
    });
  });

  it('should use default parameters when none provided', function(done) {
    const flow = [
      { id: 'c1', type: 'raindrop-config', name: 'test config' },
      {
        id: 'n1', type: 'raindrop-search', name: 'test search', config: 'c1'
      }
    ];

    const mockClient = {
      getRaindrops(params) {
        params.should.have.property('collectionId', 0);
        // Should not have search, sort parameters when not provided
        params.should.not.have.property('search');
        params.should.not.have.property('sort');

        return Promise.resolve({
          data: {
            items: [
              { _id: 1, title: 'Test 1', link: 'https://test1.com' },
              { _id: 2, title: 'Test 2', link: 'https://test2.com' }
            ],
            count: 50,
            collectionId: 0
          }
        });
      }
    };

    helper.load([configNode, searchNode], flow, {
      c1: { accessToken: 'test-token' }
    }, () => {
      const n1 = helper.getNode('n1');
      const c1 = helper.getNode('c1');

      c1.getClient = function () { return mockClient; };

      n1.send = function (msg) {
        try {
          msg.should.have.property('payload');
          msg.payload.should.be.an.Array();
          msg.payload.should.have.length(2);
          msg.should.have.property('count', 50);
          msg.should.have.property('collectionId', 0);
          msg.should.have.property('searchParams');
          done();
        } catch (e) {
          done(e);
        }
      };

      n1.error = function (error) {
        done(error);
      };

      n1.receive({ payload: {} });
    });
  });

  it('should use node configuration parameters', function(done) {
    const flow = [
      { id: 'c1', type: 'raindrop-config', name: 'test config' },
      {
        id: 'n1',
        type: 'raindrop-search',
        name: 'test search',
        config: 'c1',
        collectionId: '123',
        search: 'test query',
        sort: '-created',
        perpage: '25',
        page: '1'
      }
    ];

    const mockClient = {
      getRaindrops(params) {
        params.should.have.property('collectionId', 123);
        params.should.have.property('search', 'test query');
        params.should.have.property('sort', '-created');
        params.should.have.property('perpage', 25);
        params.should.have.property('page', 1);

        return Promise.resolve({
          data: {
            items: [],
            count: 0,
            collectionId: 123
          }
        });
      }
    };

    helper.load([configNode, searchNode], flow, {
      c1: { accessToken: 'test-token' }
    }, () => {
      const n1 = helper.getNode('n1');
      const c1 = helper.getNode('c1');

      c1.getClient = function () { return mockClient; };

      n1.send = function (msg) {
        try {
          msg.searchParams.should.have.property('collectionId', 123);
          msg.searchParams.should.have.property('search', 'test query');
          msg.searchParams.should.have.property('sort', '-created');
          msg.searchParams.should.have.property('perpage', 25);
          msg.searchParams.should.have.property('page', 1);
          done();
        } catch (e) {
          done(e);
        }
      };

      n1.error = function (error) {
        done(error);
      };

      n1.receive({ payload: {} });
    });
  });

  it('should prioritize message parameters over node config', function(done) {
    const flow = [
      { id: 'c1', type: 'raindrop-config', name: 'test config' },
      {
        id: 'n1',
        type: 'raindrop-search',
        name: 'test search',
        config: 'c1',
        collectionId: '123',
        search: 'node query'
      }
    ];

    const mockClient = {
      getRaindrops(params) {
        params.should.have.property('collectionId', 456);
        params.should.have.property('search', 'message query');

        return Promise.resolve({
          data: { items: [], count: 0, collectionId: 456 }
        });
      }
    };

    helper.load([configNode, searchNode], flow, {
      c1: { accessToken: 'test-token' }
    }, () => {
      const n1 = helper.getNode('n1');
      const c1 = helper.getNode('c1');

      c1.getClient = function () { return mockClient; };

      n1.send = function (msg) {
        done();
      };

      n1.error = function (error) {
        done(error);
      };

      n1.receive({
        payload: {
          collectionId: 456,
          search: 'message query'
        }
      });
    });
  });

  it('should enforce perpage limit of 50', function(done) {
    const flow = [
      { id: 'c1', type: 'raindrop-config', name: 'test config' },
      {
        id: 'n1',
        type: 'raindrop-search',
        name: 'test search',
        config: 'c1',
        perpage: '100' // This should be limited to 50
      }
    ];

    const mockClient = {
      getRaindrops(params) {
        params.should.have.property('perpage', 50); // Should be capped at 50

        return Promise.resolve({
          data: { items: [], count: 0, collectionId: 0 }
        });
      }
    };

    helper.load([configNode, searchNode], flow, {
      c1: { accessToken: 'test-token' }
    }, () => {
      const n1 = helper.getNode('n1');
      const c1 = helper.getNode('c1');

      c1.getClient = function () { return mockClient; };

      n1.send = function (msg) {
        done();
      };

      n1.error = function (error) {
        done(error);
      };

      n1.receive({ payload: {} });
    });
  });

  it('should handle search with tag operator', function(done) {
    const flow = [
      { id: 'c1', type: 'raindrop-config', name: 'test config' },
      {
        id: 'n1', type: 'raindrop-search', name: 'test search', config: 'c1'
      }
    ];

    const mockClient = {
      getRaindrops(params) {
        params.should.have.property('search', 'tag:javascript');

        return Promise.resolve({
          data: {
            items: [
              { _id: 1, title: 'JS Tutorial', tags: ['javascript'] }
            ],
            count: 1,
            collectionId: 0
          }
        });
      }
    };

    helper.load([configNode, searchNode], flow, {
      c1: { accessToken: 'test-token' }
    }, () => {
      const n1 = helper.getNode('n1');
      const c1 = helper.getNode('c1');

      c1.getClient = function () { return mockClient; };

      n1.send = function (msg) {
        try {
          msg.payload.should.have.length(1);
          msg.payload[0].should.have.property('tags');
          msg.payload[0].tags.should.containEql('javascript');
          done();
        } catch (e) {
          done(e);
        }
      };

      n1.error = function (error) {
        done(error);
      };

      n1.receive({
        search: 'tag:javascript'
      });
    });
  });

  it('should handle empty search results', function(done) {
    const flow = [
      { id: 'c1', type: 'raindrop-config', name: 'test config' },
      {
        id: 'n1', type: 'raindrop-search', name: 'test search', config: 'c1'
      }
    ];

    const mockClient = {
      getRaindrops(params) {
        return Promise.resolve({
          data: {
            items: [],
            count: 0,
            collectionId: 0
          }
        });
      }
    };

    helper.load([configNode, searchNode], flow, {
      c1: { accessToken: 'test-token' }
    }, () => {
      const n1 = helper.getNode('n1');
      const c1 = helper.getNode('c1');

      c1.getClient = function () { return mockClient; };

      n1.send = function (msg) {
        try {
          msg.payload.should.be.an.Array();
          msg.payload.should.have.length(0);
          msg.count.should.equal(0);
          done();
        } catch (e) {
          done(e);
        }
      };

      n1.error = function (error) {
        done(error);
      };

      n1.receive({ search: 'nonexistent' });
    });
  });

  it('should handle API errors', function(done) {
    const flow = [
      { id: 'c1', type: 'raindrop-config', name: 'test config' },
      {
        id: 'n1', type: 'raindrop-search', name: 'test search', config: 'c1'
      }
    ];

    const mockClient = {
      getRaindrops(params) {
        return Promise.reject(new Error('Search failed'));
      }
    };

    helper.load([configNode, searchNode], flow, {
      c1: { accessToken: 'test-token' }
    }, () => {
      const n1 = helper.getNode('n1');
      const c1 = helper.getNode('c1');

      c1.getClient = function () { return mockClient; };

      n1.on('call:error', (call) => {
        call.firstArg.should.have.property('message', 'Search failed');
        done();
      });

      n1.receive({ payload: {} });
    });
  });
});
