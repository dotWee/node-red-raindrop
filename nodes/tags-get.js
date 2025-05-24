module.exports = function(RED) {
    "use strict";

    function TagsGetNode(config) {
        RED.nodes.createNode(this, config);
        
        this.config = RED.nodes.getNode(config.config);
        this.collectionId = config.collectionId;
        
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
                
                // Get collection ID from node config or message
                const collectionId = parseInt(node.collectionId || msg.collectionId || msg.payload.collectionId || 0);

                node.status({ fill: "blue", shape: "dot", text: "fetching..." });

                const response = await client.getTagsInCollection({ collectionId: collectionId });
                
                node.status({ fill: "green", shape: "dot", text: `found ${response.data.items.length}` });
                
                // Extract just the tag names and counts
                const tags = response.data.items.map(item => ({
                    name: item._id,
                    count: item.count
                }));
                
                msg.payload = tags;
                msg.collectionId = collectionId;
                msg.totalTags = response.data.items.length;
                
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

    RED.nodes.registerType("tags-get", TagsGetNode);
}; 