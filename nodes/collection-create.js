module.exports = function(RED) {
    "use strict";

    function CollectionCreateNode(config) {
        RED.nodes.createNode(this, config);
        
        this.config = RED.nodes.getNode(config.config);
        this.title = config.title;
        this.description = config.description;
        this.view = config.view;
        this.public = config.public;
        this.parentId = config.parentId;
        
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
                
                // Build collection data from node config and message
                const collectionData = {
                    title: node.title || msg.title || msg.payload.title || 'New Collection',
                    view: node.view || msg.view || msg.payload.view || 'list',
                    sort: 0, // Default sort
                    public: (node.public !== undefined) ? node.public : (msg.public !== undefined) ? msg.public : (msg.payload.public !== undefined) ? msg.payload.public : false,
                    cover: []
                };

                // Optional description
                if (node.description || msg.description || msg.payload.description) {
                    collectionData.description = node.description || msg.description || msg.payload.description;
                }

                // Optional parent collection
                if (node.parentId || msg.parentId || msg.payload.parentId) {
                    collectionData.parent = {
                        $ref: 'collections',
                        $id: parseInt(node.parentId || msg.parentId || msg.payload.parentId)
                    };
                }

                // Cover images from message
                if (msg.payload.cover && Array.isArray(msg.payload.cover)) {
                    collectionData.cover = msg.payload.cover;
                }

                node.status({ fill: "blue", shape: "dot", text: "creating..." });

                const response = await client.createCollection({ createCollectionRequest: collectionData });
                
                node.status({ fill: "green", shape: "dot", text: "created" });
                
                msg.payload = response.data.item;
                msg.collectionId = response.data.item._id;
                
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

    RED.nodes.registerType("collection-create", CollectionCreateNode);
}; 