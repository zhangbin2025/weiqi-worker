# 上游引擎对接（web-katrain）

## 定位与差异

本仓库只取 [Sir-Teo/web-katrain](https://github.com/Sir-Teo/web-katrain) 引擎的
import 闭包（29 个文件，不碰 React/Zustand/UI），固定到仓库根 `UPSTREAM_SHA`
指向的 commit。上游是私有 SPA（`name: app` / `private: true` / 无 npm 包），部署
假设与 weiqi-bot 不同，因此用一组补丁适配：backend 降级链、WASM 相对路径、
模型下载进度与缓存、init 协议字段。

门面 `src/index.ts` / `src/katago/` 维持 weiqi-bot 依赖的导出与消息协议不变，
引擎实现全部来自 `src/upstream/`。

## 补丁

补丁**只存在于本仓库**，不在上游分支：`scripts/sync-upstream.mjs` 从 pin commit
的 git 对象读出 29 个文件，`scripts/apply-patches.mjs` 和
`scripts/patch-worker.mjs` 对纯上游源码做确定性文本替换；任一处找不到唯一匹配
即报错退出，升级时能立刻发现上游漂移。

| # | 改动 | 文件 | 原因 |
|---|------|------|------|
| P1 | backend 链 `webgpu → webgl → wasm → cpu` | `types.ts`, `backendFallback.ts`, `worker.ts` | 上游默认 webgpu，不支持时直接掉单线程 WASM；`@tensorflow/tfjs` 聚合包已注册 webgl，插进链里避免性能退化。`setBackend` 失败链和 warmup 失败链**都要改**，否则 warmup 失败仍会跳过 webgl |
| P2 | `WEBGL_DELETE_TEXTURE_THRESHOLD=0` | `worker.ts` | 启用 webgl 后，长复盘会累积大量 NN 推理，TFJS 的 GL 纹理缓存会让显存无界增长；置 0 关闭该缓存 |
| P3 | `setWasmPaths('../tfjs/')` | `worker.ts` | 上游 `publicUrl('tfjs/')` 依赖 `import.meta.env.BASE_URL`（绝对 `/`），weiqi-bot 是 `base:''` + 子路径部署（`review/`、`play/`）；相对 `assets/worker.js` 才能取到 |
| P4 | 下载进度 `katago:progress` + IndexedDB 模型缓存 | `worker.ts` | 上游 `ensureModel()` 是裸 `fetch().arrayBuffer()`，无进度、无持久化；Cloudflare Worker Assets 的响应也无法用 `Cache.put` 写入。保住刷新不重下模型 + weiqi-bot 的进度 UI |
| P5 | 协议适配（init 参数 / pass 归一化） | `worker.ts` | 门面 `client.init(modelUrl, onProgress, baseUrl)` 发 `baseUrl`，上游 init 只认 `backend?`；门面 moveHistory 含 `{pass:true,player}`，上游 `positionInputsV7` 要求 `x<0||y<0` |

另有一步确定性裁剪，写进 `sync-upstream.mjs`（不是手工改源码）：`src/types.ts`
的 `LegacyGameEncoding` 是 type-only import，只服务一个 UI 字段却会拉进一批
SGF/棋盘导入 utils；替换为内联字符串字面量联合，使闭包保持最小。

构建产物由 `vite.config.js` 固定输出 `dist/assets/worker.js`。

## 对接方式

- weiqi-bot 以本地兄弟仓库引用（`package.json` 的 `file:../weiqi-worker` +
  vite alias 指向 `../weiqi-worker/src`），未发布 npm 包。
- 运行时 `setWorkerUrl(toAbsoluteUrl('assets/worker.js'))` 指向构建产物。
- 同步产物：`cp dist/assets/worker.js ../weiqi-bot/clients/web/public/assets/worker.js`

## 升级

```bash
# 1. 修改 UPSTREAM_SHA 为新 commit
# 2. 重放源码与补丁（任一处失败都会明确报错）
node scripts/sync-upstream.mjs /path/to/web-katrain-checkout
# 3. 验证
npm run typecheck && npm run test:run && npm run build
# 4. 提交 src/upstream/、scripts/、UPSTREAM_SHA、本文档
```

补丁与上游冲突时，唯一匹配检查会抛错，不会静默产出半补丁源码；按报错定位
对应 patch，人工判断是调整匹配串还是改写适配逻辑。

## 待实测

warmup + webgl + `WEBGL_DELETE_TEXTURE_THRESHOLD=0` 三者叠加，可能触发 TFJS
显存警告；不下结论，以浏览器实测为准。Android 走 native KataGo，不在此范围。
