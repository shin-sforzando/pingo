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
  - 新しい機能を追加する前に、必ず既存コードの実装パターンを確認すること
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

### 1. ゲーム参加機能（重要・未実装）

- `/game/join`ページの作成（現在404エラー）
- 参加用APIエンドポイントの実装
- QRコードスキャン + 手動ゲームID入力
- 公開ゲーム一覧表示

### 2. テストカバレッジ（高）

以下の重要コンポーネントでテストが不足：

- `src/components/game/ImageUpload.tsx`
- `src/services/image-upload.ts`
- `src/app/api/image/upload/route.ts`
- `src/app/api/game/[gameId]/submission/analyze/route.ts`

### 3. セキュリティ・本番対応（高）

- レート制限の実装
- APIキーのセキュリティレビュー
- デバッグログの削除

## メモリーバンクファイル

`docs/`内の主要ドキュメント：

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

- [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite)
