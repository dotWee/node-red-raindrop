module.exports = function collectionUpdateNode(RED) {
  function CollectionUpdateNode(config) {
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

      const collectionId = config.collectionId || msg.payload?.collectionId;
      if (!collectionId) {
        node.status({ fill: 'red', shape: 'dot', text: 'Collection ID is required' });
        done('Collection ID is required to update.');
        return;
      }

      const updateData = {};
      if (config.title || msg.payload?.title) updateData.title = config.title || msg.payload?.title;
      if (config.description || msg.payload?.description) updateData.description = config.description || msg.payload?.description;
      if (config.view || msg.payload?.view) updateData.view = config.view || msg.payload?.view;
      if (config.public !== undefined || msg.payload?.public !== undefined) {
        updateData.public = config.public !== undefined ? config.public : msg.payload?.public;
      }
      if (config.parentId || msg.payload?.parentId) {
        updateData.parent = { $id: parseInt(config.parentId || msg.payload?.parentId, 10) };
      }
      if (config.cover || msg.payload?.cover) {
        let coverVal = config.cover || msg.payload?.cover;
        if (typeof coverVal === 'string') {
          try {
            coverVal = JSON.parse(coverVal); // Expects array or stringified array
          } catch (e) {
            // If not JSON, treat as a single URL string
            coverVal = [coverVal];
          }
        }
        updateData.cover = Array.isArray(coverVal) ? coverVal : [coverVal];
      }

      if (Object.keys(updateData).length === 0) {
        node.status({ fill: 'yellow', shape: 'dot', text: 'No update data provided' });
        send(msg); // Pass through if no update data
        if (done) done();
        return;
      }

      try {
        node.status({ fill: 'blue', shape: 'dot', text: `Updating collection ${collectionId}...` });

        const response = await client.updateCollection(parseInt(collectionId, 10), updateData);

        if (response && response.item) {
          msg.payload = response.item;
          node.status({ fill: 'green', shape: 'dot', text: `Collection ${collectionId} updated` });
          send(msg);
        } else {
          const errorText = `Failed to update collection ${collectionId}`;
          node.status({ fill: 'red', shape: 'dot', text: errorText });
          msg.payload = { collectionId, success: false, updateData, response };
          msg.error = errorText;
          send(msg);
        }
        if (done) done();
      } catch (error) {
        const errorMessage = error.message || `Failed to update collection ${collectionId}`;
        node.status({ fill: 'red', shape: 'dot', text: errorMessage });
        if (done) {
          done(error);
        } else {
          node.error(errorMessage, msg);
        }
      }
    });
  }
  RED.nodes.registerType('collection-update', CollectionUpdateNode);
}; 