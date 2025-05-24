module.exports = function(RED) {
    "use strict";

    function RaindropSearchNode(config) {
        RED.nodes.createNode(this, config);
        
        this.config = RED.nodes.getNode(config.config);
        this.collectionId = config.collectionId;
        this.search = config.search;
        this.sort = config.sort;
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
                
                // Get parameters from node config or message, ensuring msg.payload exists
                const payload = msg.payload || {};
                const collectionId = parseInt(msg.collectionId || payload.collectionId || node.collectionId || 0);
                const search = msg.search || payload.search || node.search || undefined;
                const sort = msg.sort || payload.sort || node.sort || undefined;
                const perpage = parseInt(msg.perpage || payload.perpage || node.perpage || 50);
                const page = parseInt(msg.page || payload.page || node.page || 0);

                node.status({ fill: "blue", shape: "dot", text: "searching..." });

                // Build query parameters
                const queryParams = {};
                if (search) queryParams.search = search;
                if (sort) queryParams.sort = sort;
                if (perpage) queryParams.perpage = Math.min(perpage, 50); // API limit is 50
                if (page) queryParams.page = page;

                const response = await client.getRaindrops({ 
                    collectionId: collectionId,
                    ...queryParams
                });
                
                node.status({ fill: "green", shape: "dot", text: `found ${response.data.items.length}` });
                
                msg.payload = response.data.items;
                msg.count = response.data.count;
                msg.collectionId = response.data.collectionId;
                msg.searchParams = {
                    collectionId,
                    search,
                    sort,
                    perpage,
                    page
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

    RED.nodes.registerType("raindrop-search", RaindropSearchNode);
}; 