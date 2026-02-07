# Minimal Plugin Example

This is a minimal FlowGuard plugin that demonstrates the basic structure.

## plugin.json

```json
{
  "id": "example.minimal-plugin",
  "name": "Minimal Plugin",
  "version": "1.0.0",
  "description": "A minimal example plugin",
  "author": "FlowGuard Team",
  "main": "index.js",
  "engines": {
    "flowguard": "^0.1.0"
  }
}
```

## index.js

```javascript
import { FlowGuardPlugin, PluginContext } from 'flowguard/plugins/types';

export default class MinimalPlugin {
  id = 'example.minimal-plugin';
  name = 'Minimal Plugin';
  version = '1.0.0';
  description = 'A minimal example plugin';

  async activate(context) {
    context.logger.info('Minimal plugin activated');
  }

  async deactivate() {
    // Cleanup if needed
  }
}
```

## Usage

1. Create a new directory in `.flowguard/plugins/`
2. Copy the above files into the directory
3. Restart FlowGuard or reload plugins
4. The plugin will be loaded and activated
