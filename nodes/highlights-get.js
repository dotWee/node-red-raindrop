module.exports = function(RED) {
    "use strict";

    function HighlightsGetNode(config) {
        RED.nodes.createNode(this, config);
        
        this.config = RED.nodes.getNode(config.config);
        this.collectionId = config.collectionId;
        this.perpage = config.perpage;
        this.page = config.page;
        
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
                
                // Get parameters from node config or message
                const collectionId = parseInt(node.collectionId || msg.collectionId || msg.payload.collectionId);
                const perpage = parseInt(node.perpage || msg.perpage || msg.payload.perpage || 50);
                const page = parseInt(node.page || msg.page || msg.payload.page || 0);

                node.status({ fill: "blue", shape: "dot", text: "fetching..." });

                let response;
                
                if (collectionId) {
                    // Get highlights from specific collection
                    response = await client.getHighlightsInCollection({ 
                        collectionId: collectionId,
                        perpage: Math.min(perpage, 50),
                        page: page
                    });
                } else {
                    // Get all highlights
                    response = await client.getAllHighlights({
                        perpage: Math.min(perpage, 50),
                        page: page
                    });
                }
                
                node.status({ fill: "green", shape: "dot", text: `found ${response.data.items.length}` });
                
                msg.payload = response.data.items;
                msg.count = response.data.items.length;
                msg.collectionId = collectionId || null;
                msg.searchParams = {
                    collectionId: collectionId || null,
                    perpage: Math.min(perpage, 50),
                    page: page
                };
                
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

    RED.nodes.registerType("highlights-get", HighlightsGetNode);
}; 