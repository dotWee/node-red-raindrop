module.exports = function (RED) {
  function RaindropCreateNode(config) {
    RED.nodes.createNode(this, config);

    this.config = RED.nodes.getNode(config.config);
    this.collectionId = config.collectionId;
    this.link = config.link;
    this.title = config.title;
    this.excerpt = config.excerpt;
    this.tags = config.tags;
    this.important = config.important;

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

        // Build raindrop data from node config and message
        const raindropData = {
          link: msg.link || msg.payload.link || node.link,
          collection: {
            $id: parseInt(msg.collectionId || msg.payload.collectionId || node.collectionId || 0)
          }
        };

        // Optional fields
        if (msg.title || msg.payload.title || node.title) {
          raindropData.title = msg.title || msg.payload.title || node.title;
        }

        if (msg.excerpt || msg.payload.excerpt || node.excerpt) {
          raindropData.excerpt = msg.excerpt || msg.payload.excerpt || node.excerpt;
        }

        if (msg.tags || msg.payload.tags || node.tags) {
          const tags = msg.tags || msg.payload.tags || node.tags;
          raindropData.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim());
        }

        if (msg.important !== undefined || msg.payload.important !== undefined || node.important !== undefined) {
          raindropData.important = msg.important !== undefined ? msg.important : (msg.payload.important !== undefined ? msg.payload.important : node.important);
        }

        // Additional fields from message payload
        if (msg.payload.cover) raindropData.cover = msg.payload.cover;
        if (msg.payload.note) raindropData.note = msg.payload.note;
        if (msg.payload.type) raindropData.type = msg.payload.type;
        if (msg.payload.media) raindropData.media = msg.payload.media;
        if (msg.payload.highlights) raindropData.highlights = msg.payload.highlights;

        node.status({ fill: 'blue', shape: 'dot', text: 'creating...' });

        const response = await client.createRaindrop({ createRaindropRequest: raindropData });

        node.status({ fill: 'green', shape: 'dot', text: 'created' });

        msg.payload = response.data.item;
        msg.raindropId = response.data.item._id;

        send(msg);
        done();
      } catch (error) {
        node.status({ fill: 'red', shape: 'ring', text: 'error' });
        done(error);
      }
    });

    node.on('close', () => {
      node.status({});
    });
  }

  RED.nodes.registerType('raindrop-create', RaindropCreateNode);
};
