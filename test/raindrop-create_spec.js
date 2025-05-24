const helper = require("node-red-node-test-helper");
const configNode = require("../nodes/raindrop-config.js");
const createNode = require("../nodes/raindrop-create.js");
const should = require("should");

describe('raindrop-create Node', function () {

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload();
        helper.stopServer(done);
    });

    it('should be loaded', function (done) {
        const flow = [
            { id: "c1", type: "raindrop-config", name: "test config" },
            { id: "n1", type: "raindrop-create", name: "test create", config: "c1" }
        ];
        
        helper.load([configNode, createNode], flow, function () {
            const n1 = helper.getNode("n1");
            n1.should.have.property('name', 'test create');
            done();
        });
    });

    it('should fail without config', function (done) {
        const flow = [
            { id: "n1", type: "raindrop-create", name: "test create" }
        ];
        
        helper.load(createNode, flow, function () {
            const n1 = helper.getNode("n1");
            n1.on('call:error', function(call) {
                call.firstArg.should.have.property('message', 'Raindrop configuration is required');
                done();
            });
            n1.receive({ payload: { link: "https://example.com" } });
        });
    });

    it('should build raindrop data from node config', function (done) {
        const flow = [
            { id: "c1", type: "raindrop-config", name: "test config" },
            { 
                id: "n1", 
                type: "raindrop-create", 
                name: "test create", 
                config: "c1",
                link: "https://example.com",
                title: "Test Title",
                collectionId: "123",
                tags: "tag1,tag2",
                important: true
            }
        ];
        
        // Mock the client
        const mockClient = {
            createRaindrop: function(params) {
                const data = params.createRaindropRequest;
                data.should.have.property('link', 'https://example.com');
                data.should.have.property('title', 'Test Title');
                data.should.have.property('collection');
                data.collection.should.have.property('$id', 123);
                data.should.have.property('tags');
                data.tags.should.be.an.Array();
                data.tags.should.have.length(2);
                data.tags[0].should.equal('tag1');
                data.tags[1].should.equal('tag2');
                data.should.have.property('important', true);
                
                return Promise.resolve({
                    data: {
                        item: {
                            _id: 456,
                            link: 'https://example.com',
                            title: 'Test Title'
                        }
                    }
                });
            }
        };
        
        helper.load([configNode, createNode], flow, {
            "c1": { accessToken: "test-token" }
        }, function () {
            const n1 = helper.getNode("n1");
            const c1 = helper.getNode("c1");
            
            // Mock the getClient method
            c1.getClient = function() { return mockClient; };
            
            // Override methods before triggering input
            n1.send = function(msg) {
                try {
                    msg.should.have.property('payload');
                    msg.payload.should.have.property('_id', 456);
                    msg.should.have.property('raindropId', 456);
                    done();
                } catch (e) {
                    done(e);
                }
            };
            
            n1.error = function(error) {
                done(error);
            };
            
            n1.receive({ payload: {} });
        });
    });

    it('should prioritize message data over node config', function (done) {
        const flow = [
            { id: "c1", type: "raindrop-config", name: "test config" },
            { 
                id: "n1", 
                type: "raindrop-create", 
                name: "test create", 
                config: "c1",
                link: "https://node-config.com",
                title: "Node Title"
            }
        ];
        
        const mockClient = {
            createRaindrop: function(params) {
                const data = params.createRaindropRequest;
                data.should.have.property('link', 'https://message.com');
                data.should.have.property('title', 'Message Title');
                
                return Promise.resolve({
                    data: {
                        item: {
                            _id: 789,
                            link: 'https://message.com',
                            title: 'Message Title'
                        }
                    }
                });
            }
        };
        
        helper.load([configNode, createNode], flow, {
            "c1": { accessToken: "test-token" }
        }, function () {
            const n1 = helper.getNode("n1");
            const c1 = helper.getNode("c1");
            
            c1.getClient = function() { return mockClient; };
            
            // Override methods before triggering input
            n1.send = function(msg) {
                try {
                    msg.payload.should.have.property('_id', 789);
                    done();
                } catch (e) {
                    done(e);
                }
            };
            
            n1.error = function(error) {
                done(error);
            };
            
            n1.receive({ 
                payload: { 
                    link: "https://message.com",
                    title: "Message Title"
                } 
            });
        });
    });

    it('should handle tags as string and convert to array', function (done) {
        const flow = [
            { id: "c1", type: "raindrop-config", name: "test config" },
            { id: "n1", type: "raindrop-create", name: "test create", config: "c1" }
        ];
        
        const mockClient = {
            createRaindrop: function(params) {
                const data = params.createRaindropRequest;
                data.should.have.property('tags');
                data.tags.should.be.an.Array();
                data.tags.should.containEql('javascript');
                data.tags.should.containEql('node-red');
                
                return Promise.resolve({
                    data: { item: { _id: 999, link: 'https://example.com' } }
                });
            }
        };
        
        helper.load([configNode, createNode], flow, {
            "c1": { accessToken: "test-token" }
        }, function () {
            const n1 = helper.getNode("n1");
            const c1 = helper.getNode("c1");
            
            c1.getClient = function() { return mockClient; };
            
            n1.on('input', function(msg) {
                n1.send = function(msg) {
                    done();
                };
                
                n1.error = function(error) {
                    done(error);
                };
            });
            
            n1.receive({ 
                payload: { 
                    link: "https://example.com",
                    tags: "javascript, node-red"
                } 
            });
        });
    });

    it('should handle API errors gracefully', function (done) {
        const flow = [
            { id: "c1", type: "raindrop-config", name: "test config" },
            { id: "n1", type: "raindrop-create", name: "test create", config: "c1" }
        ];
        
        const mockClient = {
            createRaindrop: function(params) {
                return Promise.reject(new Error('API Error'));
            }
        };
        
        helper.load([configNode, createNode], flow, {
            "c1": { accessToken: "test-token" }
        }, function () {
            const n1 = helper.getNode("n1");
            const c1 = helper.getNode("c1");
            
            c1.getClient = function() { return mockClient; };
            
            n1.on('call:error', function(call) {
                call.firstArg.should.have.property('message', 'API Error');
                done();
            });
            
            n1.receive({ 
                payload: { 
                    link: "https://example.com"
                } 
            });
        });
    });
}); 