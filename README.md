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


