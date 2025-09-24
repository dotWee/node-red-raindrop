module.exports = function collectionListNode(RED) {
  function CollectionListNode(config) {
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

      const includeChildCollections = config.includeChildCollections || msg.payload?.includeChildCollections || false;

      try {
        node.status({ fill: 'blue', shape: 'dot', text: 'Fetching collections...' });
        let collections = [];
        const rootCollectionsResponse = await client.getRootCollections();
        if (rootCollectionsResponse && rootCollectionsResponse.items) {
          collections = collections.concat(rootCollectionsResponse.items);
        }

        if (includeChildCollections) {
          const childCollectionsResponse = await client.getChildCollections();
          if (childCollectionsResponse && childCollectionsResponse.items) {
            collections = collections.concat(childCollectionsResponse.items);
          }
        }

        msg.payload = collections;
        node.status({ fill: 'green', shape: 'dot', text: 'Collections fetched' });
        send(msg);
        if (done) done();
      } catch (error) {
        const errorMessage = error.message || 'Failed to fetch collections';
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

  RED.nodes.registerType('collection-list', CollectionListNode);
};
