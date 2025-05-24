# Node-RED Raindrop Client

A comprehensive Node-RED contribution package for interacting with the Raindrop.io API. This package provides a complete set of nodes for managing bookmarks, collections, tags, and user information in Raindrop.io.

## Features

- ✅ **Full CRUD Operations** for raindrops (bookmarks) and collections
- ✅ **Advanced Search & Filtering** with support for Raindrop.io search operators
- ✅ **Tag Management** for organizing and retrieving tags
- ✅ **User Information** access and management
- ✅ **Authentication** via OAuth access tokens
- ✅ **Comprehensive Testing** with unit test coverage
- ✅ **TypeScript Client** integration using `@lasuillard/raindrop-client`

## Installation

### From npm

```bash
cd ~/.node-red
npm install @dotwee/node-red-raindrop
```

### From GitHub Packages

```bash
cd ~/.node-red
npm install @dotwee/node-red-raindrop --registry=https://npm.pkg.github.com
```

### From source

```bash
cd ~/.node-red
# Clone the repository first if you haven't
# git clone https://github.com/dotWee/node-red-raindrop.git
# cd node-red-raindrop
npm install
# cd ..
# Then link it or install directly
npm install /path/to/your-local/node-red-raindrop
```

## Quick Start

### 1. Get Your API Access Token

1. Go to [Raindrop.io Integrations](https://app.raindrop.io/settings/integrations)
2. Create a new app to get your access token
3. Copy the access token for use in Node-RED

### 2. Configure Authentication

1. Add a **Raindrop Config** node to your flow
2. Enter your access token
3. Test the connection to verify it works

### 3. Start Using the Nodes

You can now use any of the Raindrop nodes in your flows. All operational nodes require a Raindrop Config node to be configured.

## Available Nodes

### Configuration

- **raindrop-config** - Authentication and API configuration

### Raindrop Operations

- **raindrop-create** - Create new bookmarks
- **raindrop-get** - Retrieve individual bookmarks by ID
- **raindrop-update** - Update existing bookmarks
- **raindrop-delete** - Delete bookmarks
- **raindrop-search** - Search and filter bookmarks with pagination

### Collection Operations

- **collection-create** - Create new collections
- **collection-get** - Retrieve individual collections by ID
- **collection-update** - Update existing collections
- **collection-delete** - Delete collections
- **collection-list** - List all collections

### Tag Operations

- **tags-get** - Retrieve tags from collections
- **tags-manage** - Manage tags (rename, merge, delete)

### User Operations

- **user-get** - Get current user information

### Highlight Operations

- **highlights-get** - Retrieve text highlights

## Node Details

### Raindrop Search Node

The search node supports all Raindrop.io search operators:

```text
tag:javascript          # Search by tag
type:article           # Search by type
domain:github.com      # Search by domain
important:true         # Important bookmarks only
broken:true           # Broken links only
created:2023          # By creation year
"exact phrase"        # Exact phrase search
```

### Collection IDs

Special collection IDs in Raindrop.io:

- **0** - All raindrops (except Trash)
- **-1** - Unsorted collection  
- **-99** - Trash collection

### Error Handling

All nodes include comprehensive error handling:

- Invalid authentication tokens
- Network connectivity issues
- API rate limiting
- Missing required parameters
- Invalid data formats

## Examples

### Create a Bookmark

```json
[
    {
        "id": "create-example",
        "type": "raindrop-create", 
        "name": "Create Bookmark",
        "config": "raindrop-config-node-id"
    }
]
```

Input message:

```json
{
    "payload": {
        "link": "https://nodejs.org",
        "title": "Node.js Official Website", 
        "tags": ["nodejs", "javascript", "development"],
        "important": true,
        "collectionId": 12345
    }
}
```

### Search Bookmarks

```json
[
    {
        "id": "search-example",
        "type": "raindrop-search",
        "name": "Search JS Articles", 
        "config": "raindrop-config-node-id",
        "search": "tag:javascript type:article",
        "sort": "-created",
        "perpage": "10"
    }
]
```

### List Collections

```json
[
    {
        "id": "list-example", 
        "type": "collection-list",
        "name": "Get All Collections",
        "config": "raindrop-config-node-id",
        "includeChildCollections": true
    }
]
```

## Development

### Requirements

- Node.js 14+
- Node-RED 2.0+

### Dependencies

- `@lasuillard/raindrop-client` - TypeScript client for Raindrop.io API
- `axios` - HTTP client

### Development Dependencies

- `node-red-node-test-helper` - Testing framework
- `mocha` - Test runner
- `should` - Assertion library

### Running Tests

```bash
npm test
```

### Project Structure

```text
node-red-raindrop/
├── nodes/                 # Node implementations
│   ├── raindrop-config.js # Configuration node
│   ├── raindrop-*.js      # Raindrop operation nodes  
│   ├── collection-*.js    # Collection operation nodes
│   ├── tags-*.js          # Tag operation nodes
│   └── user-*.js          # User operation nodes
├── test/                  # Unit tests
│   └── *_spec.js          # Test files
├── package.json           # Package configuration
├── openapi.yaml          # API specification
└── README.md             # This file
```

## API Coverage

This package provides nodes for the following Raindrop.io API endpoints:

### Raindrops

- ✅ Create raindrop
- ✅ Get raindrop  
- ✅ Update raindrop
- ✅ Delete raindrop
- ✅ Search raindrops
- ✅ Upload files
- ✅ Upload covers

### Collections

- ✅ Create collection
- ✅ Get collection
- ✅ Update collection
- ✅ Delete collection
- ✅ List collections
- ✅ Upload collection covers
- ✅ Merge collections
- ✅ Share collections

### Tags

- ✅ Get tags
- ✅ Rename/merge tags
- ✅ Delete tags

### Users

- ✅ Get current user
- ✅ Update user
- ✅ Get public user

### Highlights

- ✅ Get highlights

### Authentication  

- ✅ OAuth token management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the WTFPL License.

## Links

- [Raindrop.io](https://raindrop.io)
- [Raindrop.io API Documentation](https://developer.raindrop.io)
- [Node-RED](https://nodered.org)
- [OpenAPI Specification](./openapi.yaml)

## Support

For issues and questions:

- [GitHub Issues](https://github.com/dotWee/node-red-raindrop/issues)
- [Node-RED Forum](https://discourse.nodered.org)

## Changelog

### v1.0.0

- Initial release under `@dotwee/node-red-raindrop`
- Complete CRUD operations for raindrops and collections
- Advanced search and filtering capabilities
- Comprehensive test coverage
- Full API coverage based on OpenAPI specification
