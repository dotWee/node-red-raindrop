module.exports = function(RED) {
    "use strict";

    function RaindropGetNode(config) {
        RED.nodes.createNode(this, config);
        
        this.config = RED.nodes.getNode(config.config);
        this.raindropId = config.raindropId;
        
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
                
                // Get raindrop ID from node config or message
                const raindropId = parseInt(node.raindropId || msg.raindropId || msg.payload.raindropId || msg.payload);
                
                if (!raindropId) {
                    throw new Error('Raindrop ID is required');
                }

                node.status({ fill: "blue", shape: "dot", text: "fetching..." });

                const response = await client.getRaindrop({ id: raindropId });
                
                node.status({ fill: "green", shape: "dot", text: "fetched" });
                
                msg.payload = response.data.item;
                msg.raindropId = response.data.item._id;
                msg.author = response.data.author;
                
                send(msg);
                done();
                
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: "error" });
                if (error.response && error.response.status === 404) {
                    done(new Error('Raindrop not found'));
                } else {
                    done(error);
                }
            }
        });

        node.on('close', function() {
            node.status({});
        });
    }

    RED.nodes.registerType("raindrop-get", RaindropGetNode);
}; 