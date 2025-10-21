# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Pingoは、AIによる画像判定を活用したビンゴゲームです。
プレイヤーが写真を撮影し、AIが被写体を判定してビンゴを楽しめるシステムです。

## プロジェクトルール

- ユーザとの応答は必ず **日本語で対応** せよ
  - **質問を先にする** - 指示が不明確な場合は実装前に確認
  - **不確かな情報は必ず確認してから回答** せよ（特に日付、バージョン情報、コマンド名など）
    - **最新ドキュメントを読む** - 外部サービス連携前に公式ドキュメントを確認
    - 現在は2025年10月、Claude Codeの知識はここから1年ほど古い
    - ユーザから提示されたURLは必ず参照せよ
    - Playwright, Context 7, Serena等のMCPを積極的に活用せよ
- **全コメントは英語** - "何を"ではなく"なぜ"を説明
- **作業前に必ずGitブランチを作成** せよ
  - Issue番号がある場合: `{0埋め3桁のIssue番号}_機能名` 形式でブランチを作成
  - 例: Issue #19の場合は `019_prepare_github_actions` のようなブランチ名
  - mainブランチで直接作業することは厳禁
- **既存の実装パターンを必ず確認** せよ
  - **新機能実装前の必須チェックリスト**（すべて実施してから実装開始）：
    1. **メモリーバンクを読む**：
       - `mcp__serena__read_memory` で `codebase_structure` と `coding_conventions` を参照
       - プロジェクト全体のアーキテクチャと既存パターンを理解
    2. **類似コンポーネント/関数を検索**：
       - `mcp__serena__find_symbol` で既存の実装を検索（例：`GameInfoCard`、`resolveCellId`）
       - `Grep` ツールでキーワード検索（例：「image upload」、「validation」）
       - 既存コードを **必ず読んでから** 新規実装を判断
    3. **重複チェック**：
       - 同じ機能が既に実装されていないか確認
       - 既存の関数/コンポーネントを再利用できないか検討
       - **車輪の再発明を絶対に避ける**
    4. **型定義の確認**：
       - `src/types/schema.ts` で既存のZodスキーマと型定義を確認
       - Pick、Omit、Partialで既存型を流用できないか検討
       - **インライン型定義を避け、共有型を作成**
    5. **実装パターンの踏襲**：
       - 既存コードのスタイル、構造、命名規則に従う
       - 一貫性のある実装を心がける
  - **重要**：類似機能を発見したら、必ずユーザーに報告して確認を取る
- **型安全性が重要** - TypeScriptを厳密に使用
- **全てをテストする** - テストが通るまで次に進まない
  - テスト用のユーザ
    - demo / daredem0
    - demo1 / daredem0
    - demo2 / daredem0
    - demo3 / daredem0
- **標準ライブラリ優先** - 可能な限り標準ライブラリを使用
- **Linter警告を無視しない**
- **全コンポーネントにStorybookストーリーが必要**

## 主要技術仕様

### 技術スタック

- **フロントエンド**: Next.js 15 + React 19 + TypeScript 5
- **バックエンド**: Node.js 22 + Firebase/Firestore + Google Cloud Storage  
- **AI**: Google Gemini API
- **UI**: shadcn/ui + Tailwind CSS
- **テスト**: Vitest
- **多言語**: next-intl（日本語・英語）

### アーキテクチャ

- App Router（Next.js 15）
- GeminiによるサーバーサイドAI処理
- Firestoreリスナーによるリアルタイム更新
- 署名付きURLによる直接GCSアップロード
- ゲームID以外はすべてULID使用

## 優先タスク

### テストカバレッジ（高）

以下の重要コンポーネントでテストが不足:

- `src/components/game/ImageUpload.tsx`
- `src/services/image-upload.ts`
- `src/app/api/image/upload/route.ts`
- `src/app/api/game/[gameId]/submission/analyze/route.ts`

### セキュリティ・本番対応（高）

- APIキーのセキュリティレビュー
- デバッグログの削除

## メモリーバンクファイル

### 重要：タスク開始時に必ず関連メモリーを読むこと

利用可能なメモリー（`mcp__serena__read_memory` で読み込み）：

- **`codebase_structure`** - ディレクトリ構造、アーキテクチャパターン、主要コンポーネント
  - **すべてのタスクで最初に読む**
  - 既存の実装場所、パターン、依存関係を理解
- **`coding_conventions`** - コーディング規約、ベストプラクティス、実例
  - DRY原則、型定義、LLM出力処理、定数管理等
  - **既存パターンに従うために必読**
- **`project_overview`** - 技術スタック、プロジェクト構造、主な機能
  - プロジェクト全体の理解に使用
- **`current_status_priorities`** - 現在の状況と優先タスク
  - 進行中の作業や優先度の把握
- **`suggested_commands`** - よく使うコマンド、デバッグ手順
- **`task_completion_checklist`** - タスク完了時のチェックリスト

参考ドキュメント（`docs/`内）：

- `ProjectBrief.md` - プロジェクトの目標と要件
- `TechnicalSpecification.md` - 完全な技術仕様
- `Progress.md` - 現在の状況と次のステップ
- `Archived_YYYYMMDD.md` - 過去の開発履歴

## 開発時の注意事項

- **モバイルファースト設計** - 主にスマートフォンを対象
- **ファミリーフレンドリー** - 全年齢対象のコンテンツ
- **多言語対応** - 日本語メイン、英語サブ
- **リアルタイム** - Firestoreリスナーでゲーム状況を即座に反映
- **AI駆動** - 被写体候補生成と画像解析にGeminiを使用

## リファレンス

外部サービス統合や最新機能実装時は、必ず公式ドキュメントを確認すること。

### フレームワーク・ライブラリ

- [Next.js 15](https://nextjs.org/docs) - App Router、Server Components
- [React 19](https://react.dev/reference/react) - Hooks、Server Components
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/) - UIコンポーネント
- [next-intl](https://next-intl-docs.vercel.app/) - 多言語対応

### バックエンド・AI

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) - サーバーサイド操作
- [Firestore](https://firebase.google.com/docs/firestore) - データベース
- [Google Cloud Storage](https://cloud.google.com/storage/docs)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs) - AI統合

### テスト

- [Vitest](https://vitest.dev/) - 単体テスト
- [Playwright](https://playwright.dev/) - E2Eテスト
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
