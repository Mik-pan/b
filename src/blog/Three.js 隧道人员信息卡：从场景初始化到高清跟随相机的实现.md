# Three.js 3D场景自定义标签窗口：从场景初始化到高清跟随相机的实现

## 大纲
- 场景初始化：Renderer/Camera/Controls 的骨架搭建
- 工人交互链路：命中检测到信息卡弹出
- 信息卡核心实现：高清纹理、屏幕空间缩放、水平跟随
- 动态宽度与竖排布局：按内容测量生成画布
- 踩坑笔记：清晰度、对齐、缩放

## 背景
在隧道三维场景中点击人员时，需要弹出一张高清、可跟随相机的“信息卡”。旧版是清晰的，但尺寸、模糊、跟随等细节容易踩坑。下面用当前代码实现做一个可复用的 Demo 记录。

---

## 1. 场景初始化骨架
文件：`src/pages/mainRoutes/HomeOverview/components/three-scene/scene-manager/SceneManager.ts`

```ts
// 构造函数内初始化核心管理器
this.scene = new THREE.Scene();
this.rendererManager = new RendererManager(this.container);
this.cameraManager = new CameraManager(this.container);
this.modelManager = new ModelManager(this.scene, this.rendererManager.instance, this.cameraManager.instance, this.debugManager);
// ...
this.animationFrameId = requestAnimationFrame(this.animate);
```

动画循环里更新各管理器并渲染：
```ts
private animate = () => {
  this.controlsManager.update();
  this.lightingManager.update();
  this.performanceManager.update();
  this.meteorEffectManager.update();
  this.animationManager.update();
  this.modelManager.update(this.cameraManager.instance); // 信息卡在这里做 billboard 更新
  this.rendererManager.instance.render(this.scene, this.cameraManager.instance);
  this.animationFrameId = requestAnimationFrame(this.animate);
};
```

要点：让 `ModelManager.update(camera)` 每帧拿到相机引用，后续信息卡的屏幕空间缩放和朝向都依赖它。

---

## 2. 交互链路：命中 -> 显示卡片
文件：`scene-manager/model-manager/ModelManager.ts` 中挂接交互与信息卡：

```ts
// 设置上下文和回调
this.workerMarkerManager?.setContext(this.camera, this.renderer);
this.workerInfoCardManager?.setContext(this.camera, this.renderer);
const domElement = this.renderer?.domElement ?? null;
this.workerInteractionManager?.setContext(this.camera, this.renderer, domElement);

// 点击命中后展示信息卡
this.workerInteractionManager?.setOnSelect((personId, object, meta) => {
  if (!personId || !object) {
    this.workerInfoCardManager?.hide();
    return;
  }
  const detail = meta ?? data.activePersons?.find(p => p.personId === personId);
  this.workerInfoCardManager?.show(personId, object, {
    personId: detail?.personId,
    personName: detail?.personName,
    distance: detail?.distanceToEntrance ?? null,
    voltage: detail?.voltage ?? null,
    rssi: detail?.rssi ?? null,
    isSos: detail?.isSos ?? null,
  });
});
```

`WorkerInteractionManager` 内部用 `THREE.Raycaster` 在 pointerup 时做命中，核心是把 DOM 坐标转为 NDC：
```ts
private updatePointer(event: PointerEvent) {
  const rect = this.renderer.domElement.getBoundingClientRect();
  this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  this.pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  return Number.isFinite(this.pointer.x) && Number.isFinite(this.pointer.y);
}
```

---

## 3. 信息卡核心：高清纹理 + 屏幕空间缩放 + 水平跟随
文件：`scene-manager/model-manager/WorkerInfoCardManager.ts`

### 3.1 绘制高清纹理
根据内容测量宽度，按设备像素比放大画布，关闭 mipmap 并开启各向异性，保证清晰：
```ts
const textureScale = this.getTextureScale();           // renderer/devicePixelRatio，封顶 3
canvas.width = Math.round(logicalWidth * textureScale);
canvas.height = Math.round(logicalHeight * textureScale);
ctx.scale(textureScale, textureScale);
// 纹理质量设置
const texture = new THREE.CanvasTexture(canvas);
(texture as any).colorSpace = THREE.SRGBColorSpace;
texture.generateMipmaps = false;
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
texture.anisotropy = this.getMaxAnisotropy();
texture.needsUpdate = true;
```

### 3.2 屏幕空间缩放 + 父级缩放抵消
计算想要的“屏幕像素高度”，换算到世界尺寸，并抵消工人节点自身的缩放：
```ts
const pixelHeight = this.config.screenSpaceScaling.enabled
  ? this.config.screenSpaceScaling.pixelHeight
  : REFERENCE_PIXEL_HEIGHT;
const scale = this.computeScale(distance, pixelHeight);   // 视锥公式或正交公式
const adjustedScale = scale / this.getParentWorldScale(); // 抵消父节点缩放
this.cardGroup.scale.setScalar(adjustedScale);
```

`computeScale` 使用相机 fov、视口高度，把像素高度换成世界单位。`getParentWorldScale` 读取父节点世界缩放（工人模型可能被整体缩小过）。

### 3.3 水平跟随相机（不随俯仰）
只让卡片绕垂直轴转向相机，保持横平：
```ts
const worldPos = this.tempVec;
this.cardGroup.getWorldPosition(worldPos);
const target = this.tempTarget.copy(camera.position);
target.y = worldPos.y;                         // 锁定高度
if (target.distanceToSquared(worldPos) < 1e-6) target.copy(camera.position);
this.cardGroup.lookAt(target);
```

---

## 4. 动态宽度与竖排布局 Demo
当前版本不再写死宽度，而是测量标题、字段、SOS 徽章：
```ts
const infoLines = [
  { label: 'ID', value: this.truncate(details.personId ?? '-', 10) },
  { label: '距离', value: details.distance != null ? `${details.distance.toFixed(2)} m` : '--' },
  { label: '电压', value: details.voltage != null ? `${details.voltage.toFixed(1)} V` : '--' },
  { label: '信号', value: details.rssi != null ? `${details.rssi.toFixed(0)} dBm` : '--' },
];

let maxContentWidth = measureCtx.measureText(details.personName || '-').width;
// label + value 宽度
infoLines.forEach((line, idx) => {
  const labelText = `${line.label}:`;
  const w = measureCtx.measureText(labelText).width
    + labelGap
    + measureCtx.measureText(line.value).width;
  maxContentWidth = Math.max(maxContentWidth, w);
});
// SOS 徽章宽度
const badgeWidth = measureCtx.measureText('SOS').width + badgePaddingX * 2;
logicalWidth = Math.max(maxContentWidth + pad * 2, badgeWidth + pad * 2);
```

绘制时字段竖排，每行“标签: 值”，ID 仅保留前 10 位并加省略号。徽章只保留 SOS，缩小字号和内边距。

---

## 5. 踩坑与对照
- **模糊问题**：  
  - 错误写法：直接用逻辑尺寸创建画布，默认 mipmap，未设置 colorSpace/anisotropy。放大后必糊。  
  - 现有写法：按设备像素比放大画布，禁用 mipmap，线性过滤 + anisotropy，sRGB。
- **卡片大小不对**：  
  - 错误写法：忽略父节点缩放，导致卡片和工人一起被缩得极小。  
  - 现有写法：`scale / parentWorldScale` 抵消父级缩放。
- **跟随方向不对**：  
  - 错误写法：`lookAt(camera.position)` 直接朝向，俯仰时卡片歪斜。  
  - 现有写法：锁定 y 轴，只绕水平面转向。
- **宽度不自适应**：  
  - 错误写法：写死 `style.width`。  
  - 现有写法：测量文本与徽章后决定 `logicalWidth`。

---

## 6. Demo 复用步骤
1) **初始化场景**：用 `SceneManager(container, onProgress, onReady, dataPromise)`，它内部拉起 renderer/camera/controls 并启动动画循环。  
2) **同步数据**：确保 `modelManager.applySceneData` 运行，把人员列表喂给 `workerManager`、`workerInteractionManager`、`workerInfoCardManager`。  
3) **挂交互回调**：如上代码，在 `setOnSelect` 中调用 `workerInfoCardManager.show(personId, object, details)`。  
4) **每帧更新**：`SceneManager.animate` 已调用 `modelManager.update(camera)`，无需额外处理；如果单独使用，需要在你的渲染循环中调用 `workerInfoCardManager.updateBillboard()`。

至此，一个高清、随相机水平跟随、宽度自适应的人员信息卡 Demo 就完成了。整个实现完全基于当前仓库代码，可直接对照路径和函数复用或裁剪。***
