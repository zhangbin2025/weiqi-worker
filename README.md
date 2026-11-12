# @weiqi/worker

KataGo 风格的围棋 AI 推理 Web Worker。被 [weiqi-bot](https://github.com/zhangbin2025/weiqi-bot) 以**本地兄弟仓库**方式引用（vite alias 指向 `../weiqi-worker/src`），未发布到 npm。

## 架构与上游

引擎实现来自 [Sir-Teo/web-katrain](https://github.com/Sir-Teo/web-katrain) 的固定 commit（见仓库根 `UPSTREAM_SHA`）：取其引擎 import 闭包的 29 个文件放入 `src/upstream/`，再施加 5 组确定性补丁。门面层 `src/index.ts` / `src/katago/` 维持 weiqi-bot 依赖的导出与消息协议不变。

- 补丁、裁剪理由、升级流程、已知待实测点：见 [docs/UPSTREAM.md](./docs/UPSTREAM.md)
- 补丁脚本：`scripts/sync-upstream.mjs`、`scripts/apply-patches.mjs`、`scripts/patch-worker.mjs`
- 构建产物固定为 `dist/assets/worker.js`；weiqi-bot 通过 `setWorkerUrl(toAbsoluteUrl('assets/worker.js'))` 指向该路径

## 公开 API

从 `src/index.ts` 导出：

| 符号 | 说明 |
|------|------|
| `getKataGoEngineClient()` | 同步返回单例 `KataGoEngineClient` |
| `setWorkerUrl(url: string)` | 指定 worker.js 的 URL（子目录部署时需调用） |
| `KataGoCanceledError` / `isKataGoCanceledError()` | 分析被取消时的错误与判定 |
| `getOpponent(player)` | 取对手颜色 |
| `BoardState` / `Player` / `Move` / `GameRules` / `AnalysisResult` 等 | 类型导出 |

客户端方法（`getKataGoEngineClient()` 返回值）：

| 方法 | 签名 |
|------|------|
| `init` | `(modelUrl, onProgress?, baseUrl?) => Promise<void>` |
| `analyze` | `(args: { modelUrl, board, currentPlayer, moveHistory, komi, ... }) => Promise<Analysis>` |
| `evaluate` | `(args: { modelUrl, board, currentPlayer, moveHistory, komi, ... }) => Promise<EvalResult>` |
| `evaluateBatch` | `(args: { modelUrl, positions, ... }) => Promise<EvalBatchResult>` |
| `getEngineInfo` | `() => { backend, modelName }` |

完整参数形状以 `src/katago/client.ts`、`src/katago/types.ts` 为准。

## 构建

```bash
npm install
npm run build          # tsc && vite build -> dist/assets/worker.js
```

同步到 weiqi-bot（供其 3000 dev 服务 / 打包使用）：

```bash
cp dist/assets/worker.js ../weiqi-bot/clients/web/public/assets/worker.js
```

## 开发

```bash
npm run typecheck      # tsc --noEmit
npm run test:run       # vitest run（跑一次）
npm test               # vitest watch（不退出）
npm run dev            # vite build --watch
```

## 上游升级

改 `UPSTREAM_SHA` 后，从 pin commit 重放源码与补丁，再跑 typecheck / test / build：

```bash
node scripts/sync-upstream.mjs /path/to/web-katrain-checkout
```

细节与冲突处理见 [docs/UPSTREAM.md](./docs/UPSTREAM.md)。

## License

MIT。第三方声明（Web KaTrain、KataGo）见 [LICENSE](./LICENSE)。
