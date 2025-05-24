module.exports = function(RED) {
    "use strict";

    function CollectionListNode(config) {
        RED.nodes.createNode(this, config);
        
        this.config = RED.nodes.getNode(config.config);
        this.includeChildCollections = config.includeChildCollections;
        
        var node = this;

        node.on('input', async function(msg, send, done) {
            // For older versions of Node-RED compatibility
            send = send || function() { node.send.apply(node, arguments); };
            done = done || function(error) { if (error) { node.error(error, msg); } };

            try {
                if (!node.config) {
                    throw new Error('Raindrop configuration is required');
                }

                const client = node.config.getClient();
                
                const includeChildren = node.includeChildCollections || msg.includeChildCollections || msg.payload.includeChildCollections || false;

                node.status({ fill: "blue", shape: "dot", text: "fetching..." });

                let collections = [];
                
                // Get root collections
                const rootResponse = await client.getRootCollections();
                collections = rootResponse.data.items;
                
                // Get child collections if requested
                if (includeChildren) {
                    try {
                        const childResponse = await client.getChildCollections();
                        collections = collections.concat(childResponse.data.items);
                    } catch (error) {
                        // Child collections might not be available for all users
                        node.warn('Could not fetch child collections: ' + error.message);
                    }
                }
                
                node.status({ fill: "green", shape: "dot", text: `found ${collections.length}` });
                
                msg.payload = collections;
                msg.count = collections.length;
                msg.includeChildCollections = includeChildren;
                
                send(msg);
                done();
                
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: "error" });
                done(error);
            }
        });

        node.on('close', function() {
            node.status({});
        });
    }

    RED.nodes.registerType("collection-list", CollectionListNode);
}; 