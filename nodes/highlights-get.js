module.exports = function highlightsGetNode(RED) {
  function HighlightsGetNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.configNode = RED.nodes.getNode(config.config);

    node.on('input', async function onInput(msg, _send, _done) {
      const send = _send;
      const done = _done;

      if (!node.configNode) {
        node.status({ fill: 'red', shape: 'dot', text: 'Configuration node not set' });
        done('Configuration node not set');
        return;
      }

      const { client } = node.configNode;
      if (!client) {
        node.status({ fill: 'red', shape: 'dot', text: 'API client not initialized' });
        done('API client not initialized. Check credentials in config node.');
        return;
      }

      const collectionId = config.collectionId || msg.payload?.collectionId;
      const perPage = parseInt(config.perPage || msg.payload?.perPage || 30, 10);
      const page = parseInt(config.page || msg.payload?.page || 0, 10);

      try {
        node.status({ fill: 'blue', shape: 'dot', text: 'Fetching highlights...' });
        let response;
        if (collectionId && collectionId !== '0') {
          response = await client.highlight.getHighlightsInCollection(parseInt(collectionId, 10), { perpage: perPage, page });
        } else {
          response = await client.highlight.getAllHighlights({ perpage: perPage, page });
        }

        if (response && response.items) {
          msg.payload = response.items;
          msg.count = response.items.length;
          msg.collectionId = collectionId || 'all';
          node.status({ fill: 'green', shape: 'dot', text: `Found ${response.items.length} highlights` });
          send(msg);
        } else {
          const errorText = 'Failed to fetch highlights: No items in response';
          node.status({ fill: 'red', shape: 'dot', text: errorText });
          msg.payload = response; // Send full response for debugging
          msg.error = errorText;
          send(msg);
        }
        if (done) done();
      } catch (error) {
        const errorMessage = error.message || 'Failed to fetch highlights';
        node.status({ fill: 'red', shape: 'dot', text: errorMessage });
        if (done) {
          done(error);
        } else {
          node.error(errorMessage, msg);
        }
      }
    });

    node.on('close', () => {
      node.status({});
    });
  }
  RED.nodes.registerType('highlights-get', HighlightsGetNode);
};
