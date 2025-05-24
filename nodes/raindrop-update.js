module.exports = function (RED) {
  function RaindropUpdateNode(config) {
    RED.nodes.createNode(this, config);

    this.config = RED.nodes.getNode(config.config);
    this.raindropId = config.raindropId;
    this.title = config.title;
    this.excerpt = config.excerpt;
    this.tags = config.tags;
    this.important = config.important;
    this.collectionId = config.collectionId;

    const node = this;

    node.on('input', async (msg, send, done) => {
      // For older versions of Node-RED compatibility
      send = send || function () { node.send.apply(node, arguments); };
      done = done || function (error) { if (error) { node.error(error, msg); } };

      try {
        if (!node.config) {
          throw new Error('Raindrop configuration is required');
        }

        const client = node.config.getClient();

        // Get raindrop ID from node config or message
        const raindropId = parseInt(node.raindropId || msg.raindropId || msg.payload.raindropId || msg.payload._id);

        if (!raindropId) {
          throw new Error('Raindrop ID is required');
        }

        // Build update data from node config and message
        const updateData = {};

        // Handle title
        if (node.title !== undefined || msg.title !== undefined || msg.payload.title !== undefined) {
          updateData.title = node.title || msg.title || msg.payload.title;
        }

        // Handle excerpt
        if (node.excerpt !== undefined || msg.excerpt !== undefined || msg.payload.excerpt !== undefined) {
          updateData.excerpt = node.excerpt || msg.excerpt || msg.payload.excerpt;
        }

        // Handle tags
        if (node.tags !== undefined || msg.tags !== undefined || msg.payload.tags !== undefined) {
          const tags = node.tags || msg.tags || msg.payload.tags;
          updateData.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()) : []);
        }

        // Handle important flag
        if (node.important !== undefined || msg.important !== undefined || msg.payload.important !== undefined) {
          updateData.important = node.important || msg.important || msg.payload.important;
        }

        // Handle collection change
        if (node.collectionId !== undefined || msg.collectionId !== undefined || msg.payload.collectionId !== undefined) {
          updateData.collection = {
            $id: parseInt(node.collectionId || msg.collectionId || msg.payload.collectionId)
          };
        }

        // Additional fields from message payload
        if (msg.payload.cover !== undefined) updateData.cover = msg.payload.cover;
        if (msg.payload.note !== undefined) updateData.note = msg.payload.note;
        if (msg.payload.link !== undefined) updateData.link = msg.payload.link;
        if (msg.payload.type !== undefined) updateData.type = msg.payload.type;
        if (msg.payload.media !== undefined) updateData.media = msg.payload.media;
        if (msg.payload.highlights !== undefined) updateData.highlights = msg.payload.highlights;

        // Only proceed if there's something to update
        if (Object.keys(updateData).length === 0) {
          throw new Error('No update data provided');
        }

        node.status({ fill: 'blue', shape: 'dot', text: 'updating...' });

        const response = await client.updateRaindrop({
          id: raindropId,
          updateRaindropRequest: updateData
        });

        node.status({ fill: 'green', shape: 'dot', text: 'updated' });

        msg.payload = response.data.item;
        msg.raindropId = response.data.item._id;

        send(msg);
        done();
      } catch (error) {
        node.status({ fill: 'red', shape: 'ring', text: 'error' });
        if (error.response && error.response.status === 404) {
          done(new Error('Raindrop not found'));
        } else {
          done(error);
        }
      }
    });

    node.on('close', () => {
      node.status({});
    });
  }

  RED.nodes.registerType('raindrop-update', RaindropUpdateNode);
};
