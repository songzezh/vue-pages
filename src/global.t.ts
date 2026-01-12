/// <reference types="vite/client" />
declare module '*.vue' {                  // 为所有 `.vue` 文件注册全局模块声明
  import { DefineComponent } from 'vue';  // 从 vue 引入组件类型助手
  const component: DefineComponent<       // 定义该模块默认导出的形状
    {},                                   // props 类型（此处留空，运行时由 vue 编译器填充）
    {},                                   // 原始 props（同上）
    any                                   // 其他自定义选项
  >;
  export default component;               // 默认导出就是这个组件对象
}
