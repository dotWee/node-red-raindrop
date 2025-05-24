const { RaindropApi, Configuration } = require('@lasuillard/raindrop-client').generated;

module.exports = function (RED) {
  function RaindropConfigNode(config) {
    RED.nodes.createNode(this, config);

    this.name = config.name;
    this.server = config.server || 'https://api.raindrop.io';

    // Store credentials securely
    this.accessToken = this.credentials.accessToken;

    // Create API client instance
    this.getClient = function () {
      if (!this.accessToken) {
        throw new Error('No access token configured');
      }

      const configuration = new Configuration({
        basePath: this.server,
        accessToken: this.accessToken
      });

      return new RaindropApi(configuration);
    };

    // Test the connection
    this.testConnection = async function () {
      try {
        const client = this.getClient();
        await client.getCurrentUser();
        return { success: true, message: 'Connection successful' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    };
  }

  RED.nodes.registerType('raindrop-config', RaindropConfigNode, {
    credentials: {
      accessToken: { type: 'password' }
    }
  });

  // API endpoint for testing connection
  RED.httpAdmin.post('/raindrop-config/:id/test', RED.auth.needsPermission('raindrop-config.write'), async (req, res) => {
    const node = RED.nodes.getNode(req.params.id);
    if (node) {
      try {
        const result = await node.testConnection();
        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    } else {
      res.status(404).json({ success: false, message: 'Configuration node not found' });
    }
  });
};
