# @weiqi/worker

**Weiqi AI Inference Worker** - Neural network and MCTS analysis engine for the game of Go (Weiqi/Baduk).

## Overview

`@weiqi/worker` is a web worker-based AI inference engine optimized for analyzing Go game positions. It provides:

- **Neural Network Inference**: TensorFlow.js-based neural network evaluation
- **MCTS Search**: Monte Carlo Tree Search for move analysis
- **Board Analysis**: Position evaluation, move prediction, and game analysis
- **Web Worker Architecture**: Non-blocking background computation

## Features

- 🧠 **AI-Powered Analysis**: Deep neural network evaluation of board positions
- 🔍 **MCTS Search**: Monte Carlo Tree Search for accurate move recommendations
- ⚡ **Web Worker**: Runs in background thread, doesn't block UI
- 🎯 **Type-Safe**: Written in TypeScript with strict type checking
- 🌐 **Cross-Platform**: Works in browsers and Node.js environments
- 📦 **Zero Dependencies**: Minimal runtime dependencies (TensorFlow.js, pako)

## Installation

```bash
npm install @weiqi/worker
```

## Usage

```typescript
import { getKataGoEngineClient, setWorkerUrl } from '@weiqi/worker';

// Set the worker URL (required for web usage)
setWorkerUrl('/path/to/worker.js');

// Get the engine client
const client = await getKataGoEngineClient();

// Analyze a position
const result = await client.analyze({
  board: [...], // Board state
  player: 'B',  // Current player
  rules: {...}  // Game rules
});

console.log(result.moves); // Recommended moves
```

## API

### `getKataGoEngineClient()`

Returns the singleton engine client instance.

### `setWorkerUrl(url: string)`

Sets the URL for the worker.js file (required for web environments).

### `KataGoCanceledError`

Error thrown when an analysis is canceled.

## Building

```bash
# Install dependencies
npm install

# Build the worker
npm run build

# Output: dist/assets/worker.js
```

## Development

```bash
# Run tests
npm test

# Type checking
npm run typecheck

# Watch mode
npm run dev
```

## Architecture

```
weiqi-worker/
├── src/
│   ├── board/          # Board simulation and state management
│   ├── analysis/       # Position analysis logic
│   ├── search/         # MCTS search algorithms
│   ├── model/          # Neural network model loading
│   ├── worker/         # Web worker implementation
│   └── index.ts        # Public API exports
├── dist/
│   └── assets/
│       └── worker.js   # Built worker file
└── tests/              # Test suites
```

## Performance

- **Startup Time**: ~500ms (model loading)
- **Analysis Speed**: ~100-500ms per position (depends on hardware)
- **Memory Usage**: ~50-100MB (varies with model size)

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

Requires WebAssembly and Web Workers support.

## Acknowledgments

This project is based on the [Web KaTrain](https://github.com/Sir-Teo/web-katrain) project.

Web KaTrain is a browser-based Go study app that runs KataGo-style neural network evaluation locally in the browser with TensorFlow.js.

This project also includes code from the [KataGo](https://github.com/lightvector/KataGo) project by David J Wu ("lightvector").

KataGo is a powerful open-source Go engine that combines Monte Carlo Tree Search with deep neural networks.

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Copyright Notice

Copyright (c) 2026 Weiqi Project Contributors

This project includes code derived from the KataGo project. See LICENSE for third-party license information.

## Disclaimer

THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**Use at your own risk.** The authors and contributors of this software make no guarantees about the accuracy, reliability, or suitability of this software for any particular purpose. The user assumes all responsibility for the use of this software.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## Support

- **Issues**: [GitHub Issues](https://github.com/zhangbin2025/weiqi-worker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zhangbin2025/weiqi-worker/discussions)

---

**Made with ❤️ for the Go community**
