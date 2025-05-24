module.exports = function(RED) {
    "use strict";

    function TagsManageNode(config) {
        RED.nodes.createNode(this, config);
        
        this.config = RED.nodes.getNode(config.config);
        this.collectionId = config.collectionId;
        this.operation = config.operation;
        this.tags = config.tags;
        this.replaceName = config.replaceName;
        
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
                const collectionId = parseInt(node.collectionId || msg.collectionId || msg.payload.collectionId || 0);
                const operation = node.operation || msg.operation || msg.payload.operation;
                let tags = node.tags || msg.tags || msg.payload.tags;
                const replaceName = node.replaceName || msg.replaceName || msg.payload.replaceName;

                if (!operation) {
                    throw new Error('Operation is required (rename, merge, delete)');
                }

                if (!tags) {
                    throw new Error('Tags are required');
                }

                // Convert tags to array if it's a string
                if (typeof tags === 'string') {
                    tags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
                }

                if (!Array.isArray(tags) || tags.length === 0) {
                    throw new Error('Tags must be a non-empty array or comma-separated string');
                }

                node.status({ fill: "blue", shape: "dot", text: `${operation}...` });

                let response;

                switch (operation.toLowerCase()) {
                    case 'rename':
                    case 'merge':
                        if (!replaceName) {
                            throw new Error('Replace name is required for rename/merge operations');
                        }
                        
                        response = await client.renameOrMergeTags({
                            collectionId: collectionId,
                            renameOrMergeTagsRequest: {
                                replace: replaceName,
                                tags: tags
                            }
                        });
                        break;

                    case 'delete':
                        response = await client.removeTagsFromCollection({
                            collectionId: collectionId,
                            removeTagsFromCollectionRequest: {
                                tags: tags
                            }
                        });
                        break;

                    default:
                        throw new Error('Invalid operation. Use: rename, merge, or delete');
                }
                
                node.status({ fill: "green", shape: "dot", text: `${operation} completed` });
                
                msg.payload = response.data;
                msg.operation = operation;
                msg.tags = tags;
                msg.replaceName = replaceName;
                msg.collectionId = collectionId;
                
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

    RED.nodes.registerType("tags-manage", TagsManageNode);
}; 