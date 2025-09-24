module.exports = function collectionGetNode(RED) {
  function CollectionGetNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.config = RED.nodes.getNode(config.config);

    node.on('input', async function onInput(msg, _send, _done) {
      const send = _send;
      const done = _done;

      if (!node.config) {
        node.status({ fill: 'red', shape: 'dot', text: 'Configuration node not set' });
        done('Configuration node not set');
        return;
      }

      let client;
      try {
        client = node.config.getClient();
      } catch (err) {
        node.status({ fill: 'red', shape: 'dot', text: 'API client not initialized' });
        done('API client not initialized. Check credentials in config node.');
        return;
      }

      const collectionId = config.collectionId || msg.payload?.collectionId || msg.payload;

      if (!collectionId) {
        node.status({ fill: 'red', shape: 'dot', text: 'Collection ID is required' });
        done('Collection ID is required.');
        return;
      }

      try {
        node.status({ fill: 'blue', shape: 'dot', text: `Fetching collection ${collectionId}...` });

        const response = await client.collection.getCollection(parseInt(collectionId, 10));

        if (response && response.item) {
          msg.payload = response.item;
          node.status({ fill: 'green', shape: 'dot', text: `Collection ${collectionId} fetched` });
          send(msg);
        } else {
          const errorText = `Failed to fetch collection ${collectionId}: No item in response`;
          node.status({ fill: 'red', shape: 'dot', text: errorText });
          msg.payload = response; // Send full response for debugging
          msg.error = errorText;
          send(msg);
        }
        if (done) done();
      } catch (error) {
        const errorMessage = error.message || `Failed to fetch collection ${collectionId}`;
        node.status({ fill: 'red', shape: 'dot', text: errorMessage });
        if (done) {
          done(error);
        } else {
          node.error(errorMessage, msg);
        }
      }
    });
  }
  RED.nodes.registerType('collection-get', CollectionGetNode);
}; 