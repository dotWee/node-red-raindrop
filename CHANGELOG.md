# Changelog

All notable changes to this project will be documented in this file.

## UNRELEASED

## [v1.0.3](https://github.com/dotWee/node-red-raindrop/releases/tag/v1.0.3) - 2025-09-24

- **Refactor**: Standardized config node reference to `node.config` and added consistent try-catch for client initialization across all nodes
- **Chore**: Ran linter with fixes and ensured all tests pass after changes

## [v1.0.2](https://github.com/dotWee/node-red-raindrop/releases/tag/v1.0.2) - 2025-09-05

- **Fixed**: Create Raindrop node 400 error by adding validation for required link field and proper URL validation
- **Fixed**: Collection ID handling to avoid invalid collection references when no ID is provided

## [v1.0.1](https://github.com/dotWee/node-red-raindrop/releases/tag/v1.0.1) - 2025-09-05

- **Fixed**: Connection test error "client.getCurrentUser is not a function" by using correct UserApi instead of RaindropApi
- Minor updates and fixes in the npm package metadata

## [v1.0.0](https://github.com/dotWee/node-red-raindrop/releases/tag/v1.0.0) - 2025-05-25

- Initial release under `@dotwee/node-red-raindrop`
- Complete CRUD operations for raindrops and collections
- Advanced search and filtering capabilities
- Comprehensive test coverage
- Full API coverage based on OpenAPI specification
