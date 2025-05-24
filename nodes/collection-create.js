module.exports = function collectionCreateNode(RED) {
  function CollectionCreateNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    node.configNode = RED.nodes.getNode(config.config);

    node.on('input', async function onInput(msg, _send, _done) {
      // Deliberately not reassigning send and done for linting
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

      const title = config.title || msg.payload?.title;
      const description = config.description || msg.payload?.description;
      const view = config.view || msg.payload?.view;
      const publicCollection = config.public || msg.payload?.public || false;
      const parentId = config.parentId || msg.payload?.parentId;

      if (!title) {
        node.status({ fill: 'red', shape: 'dot', text: 'Title is required' });
        done('Title is required to create a collection.');
        return;
      }

      try {
        node.status({ fill: 'blue', shape: 'dot', text: 'Creating collection...' });

        const collectionData = {
          title,
          description,
          view,
          public: publicCollection
        };

        if (parentId) {
          collectionData.parent = { $id: parseInt(parentId, 10) };
        }

        const response = await client.collection.createCollection(collectionData);

        if (response && response.item) {
          msg.payload = response.item;
          node.status({ fill: 'green', shape: 'dot', text: 'Collection created' });
          send(msg);
        } else {
          const errorText = 'Failed to create collection: No item in response';
          node.status({ fill: 'red', shape: 'dot', text: errorText });
          msg.payload = response; // Send full response for debugging
          msg.error = errorText;
          send(msg); // Send error on output 1
        }
        if (done) done();
      } catch (error) {
        const errorMessage = error.message || 'Failed to create collection';
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

  RED.nodes.registerType('collection-create', CollectionCreateNode);
};
