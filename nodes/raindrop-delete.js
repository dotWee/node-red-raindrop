module.exports = function (RED) {
  function RaindropDeleteNode(config) {
    RED.nodes.createNode(this, config);

    this.config = RED.nodes.getNode(config.config);
    this.raindropId = config.raindropId;

    const node = this;

    node.on('input', async (msg, send, done) => {
      // For older versions of Node-RED compatibility
      send = send || function () { node.send.apply(node, arguments); };
      done = done || function (error) { if (error) { node.error(error, msg); } };

      try {
        if (!node.config) {
          throw new Error('Raindrop configuration is required');
        }

        let client;
        try {
          client = node.config.getClient();
        } catch (err) {
          node.status({ fill: 'red', shape: 'dot', text: 'API client not initialized' });
          done('API client not initialized. Check credentials in config node.');
          return;
        }

        // Get raindrop ID from node config or message
        const raindropId = parseInt(node.raindropId || msg.raindropId || msg.payload.raindropId || msg.payload._id || msg.payload);

        if (!raindropId) {
          throw new Error('Raindrop ID is required');
        }

        node.status({ fill: 'blue', shape: 'dot', text: 'deleting...' });

        const response = await client.removeRaindrop({ id: raindropId });

        node.status({ fill: 'green', shape: 'dot', text: 'deleted' });

        msg.payload = response.data.item;
        msg.raindropId = raindropId;
        msg.deleted = true;

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

  RED.nodes.registerType('raindrop-delete', RaindropDeleteNode);
};
