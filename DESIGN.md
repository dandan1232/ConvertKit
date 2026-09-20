# ConvertKit Design System

## Direction

活泼的实用工具。采用平面色块、轻微错位和硬朗投影营造轻快感，核心转换区域保持稳定、清楚。

## Color

- Ink: `oklch(24% 0.055 264)`，主要文字与结构线。
- Blue: `oklch(58% 0.22 264)`，主要操作与品牌重点。
- Yellow: `oklch(86% 0.17 91)`，品牌识别与强调。
- Orange: `oklch(72% 0.19 48)`，焦点与小面积点缀。
- Mint: `oklch(87% 0.11 158)`，安全、本地处理与成功语义。
- Page: `oklch(96% 0.018 264)`，带品牌色倾向的浅色背景。

## Typography

界面正文使用 Aptos / Segoe UI / 中文系统无衬线字体。大标题使用 Arial Rounded MT Bold 或同级回退字体，字距不低于 `-0.04em`。正文最大宽度约 35rem。

## Components

- 主要面板使用 2px 深色边框、16px 圆角与 9px 硬投影。
- 主要按钮使用品牌蓝、深色边框和 4px 硬投影；按下时投影收起。
- 输入控件高度 48px、圆角 10px，并提供 3px 橙色可见焦点环。
- 状态色同时搭配文字，不单独依赖颜色。

## Layout

桌面端为说明与转换器左右分栏，900px 以下改为上下布局，640px 以下将格式选择改为纵向流程。页面最大宽度 1180px。

## Motion

仅用于拖放、按钮按压和转换进度等状态反馈，通常为 160–180ms 的 ease-out。遵循 `prefers-reduced-motion`。
