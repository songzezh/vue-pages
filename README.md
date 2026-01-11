# 基于 Vue 的 Web 应用页面

A Web page project based on Vue.js 3.

## 构建运行

### 技术栈说明

| 技术栈  | 版本 | 作用   |
|------|---|------|
| Vue.js | 3 | 开发框架 |
| Quasar | 2.18.6 | UI 框架 |
| Vue Router | | 路由机制 |

### 启动项目

```sh
npm install
```

#### 开发模式：编译和热加载

```sh
npm run dev
```

#### 生产构建：类型检查，编译和优化

```sh
npm run build
```

### [Vitest](https://vitest.dev/) 执行单元测试

```sh
npm run test:unit
```

### [Playwright](https://playwright.dev) 执行端到端测试

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### [ESLint](https://eslint.org/) 检查语法

```sh
npm run lint
```

### 项目结构

项目根据 [Atomic Design](https://www.geeksforgeeks.org/websites-apps/atomic-design/) 的方法组织结构：

```text
/src
|-- /components
|   |-- /atoms
|   |   |-- AtomButton.vue
|   |   |-- AtomIcon.vue
|   |-- /molecules
|   |-- /organisms
|   |-- /templates
|-- /pages
|   |-- PageHome.vue
|   |-- PagePokemonDetail.vue
|-- /utils
|-- /layout
|-- /plugins
|-- /router
|   |-- index.js
|-- /store
|   |-- index.js
|-- /assets
|   |-- /images
|   |-- /styles
|-- /tests
|   |-- ...
|-- App.vue
|-- main.js
```

1. 原子 (Atoms)。原子是设计系统中最小的构建模块。它们是单个、独立的元素，在整个网站或应用程序中被重复使用。原子的示例包括按钮、表单输入框、图标和排版样式。原子是无法再进一步分解的基本组件。

2. 分子 (Molecules)。分子是由原子组合而成的更复杂组件。虽然仍然简单且自成一体，但分子能执行更具体的功能。分子的示例包括搜索栏、导航栏和产品列表项。

3. 有机体 (Organisms)。有机体是由分子组成的、构成网站或应用程序中更完整功能区块的组件。它们更为复杂，可包含多种功能。有机体的示例包括页头、照片画廊和产品详情页。有机体既可作为独立组件使用，也可与其他组件组合。

4. 模板 (Templates)。模板提供了网站或应用程序的骨架结构。它们为内容填充提供了布局框架。线框图和网格布局都是模板的示例。一套模板集合构成了整个网站或应用程序的架构。

5. 页面 (Pages)。页面是设计过程的最终产物，是网站或应用程序的完整实现版本。页面包含所有最终确定的设计内容，仅在定稿后做微小调整。页面的示例包括主页、着陆页和产品详情页。

---
*注：这是Brad Frost提出的原子设计理论(Atomic Design)的标准中文译法，广泛应用于UI/UX设计领域。*

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).


