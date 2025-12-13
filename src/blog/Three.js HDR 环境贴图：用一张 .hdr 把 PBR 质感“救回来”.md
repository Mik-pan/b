---
title: "Three.js HDR 环境贴图：用一张 .hdr 把 PBR 质感“救回来”"
date: "2025-12-13"
episode: "E03"
cover: "/covers/threejs-hdr-envmap.jpg"
description: "一个从零可复现的小 Demo：用 HDR + PMREM 给 Three.js 场景加上真实的环境光与反射，让材质不再“塑料”。"
tags:
  - three.js
  - 3d
  - webgl
  - pbr
  - hdr
---

## 大纲

- 为什么要用 HDR：让材质“吃到环境”，不靠堆灯
- Demo 项目结构：最小文件夹 + 最少代码先跑起来
- 引入 HDR 的完整步骤：加载 → PMREM → scene.environment
- 让模型真的变好看：envMapIntensity、roughness/metalness、曝光
- 踩坑清单：为什么“加了 HDR 但看不出变化”

## 背景

我第一次给 Three.js 场景加 HDR 的时候，心里想得挺美：**一张环境贴图就能立刻“电影感”**。结果一跑——怎么还是灰灰的、塑料的，像是灯打不进材质里一样。

后来才慢慢明白：HDR 不是“贴上去就完事”，它更像是给场景补上一个真实世界的“空气”和“房间”。对于 PBR（`MeshStandardMaterial / MeshPhysicalMaterial`）来说，HDR 主要解决两件事：

- **间接光**：没有环境光时，物体暗面会死黑，层次很难出来。
- **环境反射**：金属、漆面、潮湿表面，靠的就是“反射周围世界”。

这篇文章把我现在项目里用到的 HDR 思路拆成一个最小 Demo，读者照着做就能复现：**加载 `.hdr` → PMREM 预过滤 → 设置 `scene.environment` → 调好材质强度与曝光**。

---

## 0. 一个最小 Demo 的文件结构

你可以用任何脚手架（Vite / CRA / Next.js 都行）。为了让步骤更直观，我们假设你建了一个 `three-hdr-demo/` 项目，结构大概这样：

```
three-hdr-demo/
  public/
    hdr/
      studio_1k.hdr
  src/
    main.ts
    scene/
      SceneManager.ts
      RendererManager.ts
      CameraManager.ts
      ControlsManager.ts
      EnvironmentManager.ts
      ModelManager.ts
    config/
      environment.ts
      renderer.ts
```

你会看到：我故意把它拆成几个小文件（`xxxManager.ts`），因为这就是我在真实项目里最习惯的组织方式：**逻辑分层清楚，调试的时候也好找。**

---

## 1. 场景先跑起来：Renderer / Camera / Controls

HDR 再高级，也得先让场景能渲染；不然你会在“没画出来”和“HDR 不生效”之间来回怀疑人生。

**文件：`src/scene/RendererManager.ts`**

```ts
import * as THREE from 'three';
import { rendererConfig } from '../config/renderer';

export class RendererManager {
  private renderer: THREE.WebGLRenderer;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({
      antialias: rendererConfig.antialias,
      alpha: rendererConfig.alpha,
    });
  }

  init() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(rendererConfig.pixelRatio);
    this.renderer.outputColorSpace = rendererConfig.outputColorSpace;
    this.renderer.toneMapping = rendererConfig.toneMapping;
    this.renderer.toneMappingExposure = rendererConfig.toneMappingExposure;
    this.container.appendChild(this.renderer.domElement);
    return this.renderer;
  }

  resize() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  dispose() {
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  get instance() {
    return this.renderer;
  }
}
```

**文件：`src/config/renderer.ts`**

```ts
import * as THREE from 'three';

export const rendererConfig = {
  antialias: true,
  alpha: true,
  outputColorSpace: THREE.SRGBColorSpace,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.2,
  pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
};
```

**文件：`src/scene/CameraManager.ts`**

```ts
import * as THREE from 'three';

export class CameraManager {
  private camera: THREE.PerspectiveCamera;

  constructor(private container: HTMLElement) {
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
    this.camera.position.set(3, 2, 5);
  }

  init() {
    return this.camera;
  }

  resize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  get instance() {
    return this.camera;
  }
}
```

**文件：`src/scene/ControlsManager.ts`**

```ts
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';

export class ControlsManager {
  private controls: OrbitControls;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.controls = new OrbitControls(camera, domElement);
  }

  init() {
    this.controls.enableDamping = true;
  }

  update() {
    this.controls.update();
  }

  dispose() {
    this.controls.dispose();
  }
}
```

**文件：`src/scene/SceneManager.ts`**

```ts
import * as THREE from 'three';
import { RendererManager } from './RendererManager';
import { CameraManager } from './CameraManager';
import { ControlsManager } from './ControlsManager';
import { EnvironmentManager } from './EnvironmentManager';
import { ModelManager } from './ModelManager';

export class SceneManager {
  private scene = new THREE.Scene();
  private rendererManager: RendererManager;
  private cameraManager: CameraManager;
  private controlsManager!: ControlsManager;
  private environmentManager!: EnvironmentManager;
  private modelManager!: ModelManager;
  private raf: number | null = null;

  constructor(private container: HTMLElement) {
    this.rendererManager = new RendererManager(container);
    this.cameraManager = new CameraManager(container);
  }

  init() {
    const renderer = this.rendererManager.init();
    const camera = this.cameraManager.init();
    this.controlsManager = new ControlsManager(camera, renderer.domElement);
    this.controlsManager.init();

    this.scene.background = new THREE.Color('#101015');

    this.environmentManager = new EnvironmentManager(this.scene, renderer);
    this.environmentManager.load().catch(console.error);

    this.modelManager = new ModelManager(this.scene);
    this.modelManager.init();

    window.addEventListener('resize', this.onResize);
    this.animate();
  }

  private onResize = () => {
    this.cameraManager.resize();
    this.rendererManager.resize();
  };

  private animate = () => {
    this.controlsManager.update();
    this.rendererManager.instance.render(this.scene, this.cameraManager.instance);
    this.raf = requestAnimationFrame(this.animate);
  };

  dispose() {
    if (this.raf) cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.environmentManager?.dispose();
    this.controlsManager?.dispose();
    this.rendererManager.dispose();
  }
}
```

**文件：`src/main.ts`**

```ts
import { SceneManager } from './scene/SceneManager';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.style.width = '100vw';
app.style.height = '100vh';
app.style.overflow = 'hidden';

const scene = new SceneManager(app);
scene.init();
```

到这里，你应该能看到一个背景色场景 + 可旋转相机。接下来才轮到 HDR 上场。

---

## 2. 准备 HDR：放进 `public/hdr/`

**文件：`public/hdr/studio_1k.hdr`**

你只需要准备一张 `.hdr` 文件放进这个位置（名字随意）。我建议先用 **1k** 的，调参数方便、加载也快。等效果确定了再换 2k/4k。

---

## 3. 核心步骤：HDR → PMREM → scene.environment

这一节是整篇文章的心脏。

你会看到三个关键词：

- `HDRLoader`：把 `.hdr` 读成一张“等距柱状环境贴图”
- `PMREMGenerator`：把这张贴图“预过滤”（让粗糙度不同的材质有对应的模糊反射）
- `scene.environment`：把环境贴图交给 PBR 管线，材质才会真的“吃到环境”

**文件：`src/config/environment.ts`**

```ts
export const environmentConfig = {
  enabled: true,
  hdrUrl: '/hdr/studio_1k.hdr',
  useAsBackground: false,
  backgroundColor: '#101015',
  materialEnvMapIntensity: 1.0,
};
```

**文件：`src/scene/EnvironmentManager.ts`**

```ts
import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader';
import { environmentConfig } from '../config/environment';

export class EnvironmentManager {
  private pmrem: THREE.PMREMGenerator;
  private envMap: THREE.Texture | null = null;

  constructor(private scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.pmrem.compileEquirectangularShader();
  }

  async load() {
    if (!environmentConfig.enabled) return;

    const loader = new HDRLoader();
    // HalfFloatType 通常够用且更省；FloatType 更“硬”，但更吃性能/显存
    loader.setDataType(THREE.HalfFloatType);

    const hdr = await loader.loadAsync(environmentConfig.hdrUrl);

    // PMREM 输出的是“适合 PBR 的环境贴图”，不要把原始 hdr 直接塞给材质
    const envMap = this.pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();

    this.envMap = envMap;
    this.scene.environment = envMap;
    this.scene.background = environmentConfig.useAsBackground
      ? envMap
      : new THREE.Color(environmentConfig.backgroundColor);

    // 可选：统一调一下场景里 PBR 材质的环境反射强度
    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const material = (mesh as any).material;
      const materials: THREE.Material[] = Array.isArray(material)
        ? material
        : material
          ? [material]
          : [];
      materials.forEach((mat: any) => {
        if (mat && mat.isMeshStandardMaterial && mat.envMapIntensity !== undefined) {
          mat.envMapIntensity = environmentConfig.materialEnvMapIntensity;
          mat.needsUpdate = true;
        }
      });
    });
  }

  dispose() {
    this.envMap?.dispose();
    this.envMap = null;
    this.pmrem.dispose();
  }
}
```

**要点（请一定看一眼）**

- `PMREMGenerator.fromEquirectangular()` 不是“锦上添花”，它是让反射看起来像真的的关键。
- HDR 是线性的：一般不需要你手动把它设成 `SRGBColorSpace`，否则很可能“越调越怪”。
- 你只要设置 `scene.environment`，PBR 材质就能自动吃到环境，不用手动给每个材质塞 `envMap`。

---

## 4. 让效果一眼看出来：放一个“爱反光”的材质

很多人加完 HDR 说“没变化”，其实是场景里刚好都是粗糙材质、反射弱，看起来像没生效。

所以我们在 Demo 里放一个最直观的对照：**金属球**。

**文件：`src/scene/ModelManager.ts`**

```ts
import * as THREE from 'three';

export class ModelManager {
  constructor(private scene: THREE.Scene) {}

  init() {
    const geo = new THREE.SphereGeometry(1, 64, 64);

    const shiny = new THREE.MeshStandardMaterial({
      color: '#d9dee7',
      metalness: 1.0,
      roughness: 0.15,
      envMapIntensity: 1.0,
    });

    const ball = new THREE.Mesh(geo, shiny);
    ball.position.set(0, 1, 0);
    this.scene.add(ball);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: '#22242a', roughness: 0.95, metalness: 0 })
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // 一盏弱一点的光：让你更容易看清“直射 + 环境”的区别
    const dir = new THREE.DirectionalLight('#ffffff', 0.6);
    dir.position.set(3, 6, 2);
    this.scene.add(dir);
  }
}
```

现在你转动相机，球体表面应该能明显看到“环境反射”带来的层次。那种“不是我画出来的、是世界倒映进来的”的感觉，就是 HDR 的价值。

---

## 5. 核心点：怎么把“质感”调到你想要的样子

这一段我不想写成“参数表”，更像是我调项目时常走的几步路。

### 5.1 `envMapIntensity`：反射强度旋钮

- 太小：像没开 HDR（尤其是金属）
- 太大：像“镀铬球”，到处发白

一般我会先把它调到 **1**，确认反射存在，再按材质类型分区微调。

### 5.2 `roughness / metalness`：反射“清晰度”和“材质性格”

- `metalness` 决定“反射是不是主角”
- `roughness` 决定“反射是镜子还是磨砂玻璃”

如果你的项目里把 `roughness` 拉得很高（比如统一乘了一个 `> 1` 的系数），HDR 会变得很“温柔”，甚至看不出来。

### 5.3 `toneMappingExposure`：整个世界的曝光

你用的是 `ACESFilmic` 的话，曝光的手感会比较“摄影”。我通常这么做：

- 先把曝光调低一点（比如 1.0~1.5），看清层次
- 如果整体灰，就调一点曝光；如果高光死白，就反向调

HDR 不是单独存在的，它最终是被 tone mapping “拍成”屏幕上的样子。

---

## 6. 踩坑与对照：为什么我“加了 HDR 但看不出变化”

- **材质不是 PBR**：`MeshBasicMaterial / MeshLambertMaterial` 基本吃不到 `scene.environment` 的那套好处，先换成 `MeshStandardMaterial` 试试。
- **`envMapIntensity` 被设成 0**：这真的很常见——你以为是 HDR 不对，其实是材质自己把反射关了。
- **粗糙度太高**：反射全糊了，看起来像没效果；拿一个金属球做对照最直接。
- **把 HDR 当 sRGB 处理**：HDR 是线性的，乱设 `SRGBColorSpace` 容易发灰/发脏。
- **忘了 PMREM**：直接用 equirectangular HDR 当环境贴图，高光会很不对劲（尤其是粗糙度变化时）。

---

## 总结

HDR 环境贴图这件事，说白了就是：**把“世界”塞进你的材质里**。

如果你只记住一句话，我希望是这一句：

> 想让 PBR 材质有质感：先让 `scene.environment` 生效，再用 `PMREM + envMapIntensity + exposure` 把它调到舒服。
