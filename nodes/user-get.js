const { UserApi } = require('@lasuillard/raindrop-client').generated;

module.exports = function (RED) {
  function UserGetNode(config) {
    RED.nodes.createNode(this, config);

    this.config = RED.nodes.getNode(config.config);

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
          client = node.config.getUserClient();
        } catch (err) {
          node.status({ fill: 'red', shape: 'dot', text: 'API client not initialized' });
          done('API client not initialized. Check credentials in config node.');
          return;
        }

        node.status({ fill: 'blue', shape: 'dot', text: 'fetching...' });

        const response = await client.getCurrentUser();

        node.status({ fill: 'green', shape: 'dot', text: 'fetched' });

        msg.payload = response.data.user;
        msg.userId = response.data.user._id;
        msg.userEmail = response.data.user.email;
        msg.userFullName = response.data.user.fullName;
        msg.isPro = response.data.user.pro;

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

  RED.nodes.registerType('user-get', UserGetNode);
};
