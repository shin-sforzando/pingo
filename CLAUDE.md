# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Pingoは、AIによる画像判定を用いたビンゴゲームアプリケーションです。プレイヤーが撮影した写真をGoogle Gemini APIで判定し、ビンゴマスを開けていく新しい形のエンターテイメントツールです。

## 開発ガイドライン

- 英語で考えても良いが、ユーザとの応答は必ず **日本語で対応** せよ
- **不確かな情報は必ず確認してから回答** せよ（特に日付、バージョン情報、コマンド名など）
  - Claude Codeの知識は2年ほど古い
  - ユーザから提示されたURLは必ず参照せよ
  - Playwright, Context 7, Serena等のMCPを積極的に活用せよ
- Pythonコードは[Googleスタイル](https://google.github.io/styleguide/pyguide.html)に準拠せよ
- **作業前に必ずGitブランチを作成** せよ
  - Issue番号がある場合: `{0埋め3桁のIssue番号}_機能名` 形式でブランチを作成
  - 例: Issue #19の場合は `019_iam_logging` のようなブランチ名
  - mainブランチで直接作業することは厳禁

## 開発コマンド

### 基本コマンド

```bash
# 開発サーバー起動（http://localhost:3000）
npm run dev

# コード品質チェック（Biome）
npm run check

# テスト実行（単回）
npm run test:once

# ビルド
npm run build
```

### タスク完了時の必須確認

タスクを完了する前に、必ず以下のコマンドを順番に実行してください：

1. `npm run check` - コードフォーマット・リントチェック
2. `npm run test:once` - 全テストの実行
3. `npm run build` - ビルドエラーの確認

### その他の重要コマンド

```bash
# Storybook起動（UIコンポーネント確認）
npm run storybook

# E2Eテスト
npm run test:e2e

# 国際化チェック（i18n変更時）
npm run check:i18n

# Dockerビルド＆実行
npm run docker
```

## アーキテクチャ

### 技術スタック

- **フロントエンド**: Next.js 15.3.3 (App Router), React 19, TypeScript 5, Tailwind CSS 4
- **バックエンド**: Firebase (Auth, Firestore), Google Cloud Storage, Gemini API
- **開発ツール**: Biome (リンター), Vitest (テスト), Storybook, Playwright (E2E)

### ディレクトリ構造

```plain
src/
├── app/          # Next.js App Router（ページ・API）
├── components/   # 再利用可能なReactコンポーネント
├── contexts/     # React Context（状態管理）
├── i18n/         # 多言語対応設定
├── lib/          # ユーティリティ関数
├── services/     # ビジネスロジック・外部API連携
├── stories/      # Storybookストーリー
├── test/         # テストユーティリティ
└── types/        # TypeScript型定義
```

### データフロー

1. **クライアント**: 画像撮影 → 前処理 → 署名付きURLでGCSに直接アップロード
2. **サーバー**: API Routes → Firestore操作、Gemini API呼び出し
3. **リアルタイム**: Firestore onSnapshotでゲーム状態を同期

### 主要な型定義とスキーマ

- `src/types/schema.ts`: Zodスキーマによるバリデーション
- `src/types/firestore.ts`: Firestore型変換ユーティリティ
- `src/types/game.ts`, `user.ts`: ドメインモデル

## 重要な規約

### コードスタイル

- **型安全性**: `any`型禁止、`import type`使用、非null演算子`!`禁止
- **命名規則**: コンポーネントはPascalCase、関数はcamelCase
- **フォーマット**: Biomeで自動整形（インデント2スペース、ダブルクォート）
- **コメント**: **なぜ**を説明するコメントのみ記載

### テスト戦略

- 単体テスト: Vitest（`*.test.tsx`）
- ブラウザテスト: Vitest Browser（`*.browser.test.tsx`）
- E2Eテスト: Playwright（モバイルファースト）
- カバレッジ目標: 70%以上

### セキュリティ

- 機密情報は`.env.local`に記載（git-secretで暗号化）
- クライアント用環境変数は`NEXT_PUBLIC_`プレフィックス必須
- Google Cloud認証: ADC（開発）、Service Account（本番）

### 国際化

- 対応言語: 日本語(ja)、英語(en)
- メッセージファイル: `/messages`ディレクトリ
- ソースコード内のコメント・ログは英語

## 開発時の注意事項

1. **既存パターンの踏襲**: 新機能追加時は既存のコンポーネントやサービスの実装パターンに従う
2. **型の厳格性**: TypeScriptの型チェックエラーは必ず解決
3. **テストファースト**: 新機能には必ず対応するテストを追加
4. **Storybookストーリー**: UIコンポーネントは必ずストーリーを作成
5. **パフォーマンス**: 画像判定3秒以内、ページロード2秒以内を目標

## Firebase/GCS設定

### ローカル開発環境

```bash
# ADC設定（初回のみ）
gcloud auth application-default login

# 環境変数（.env.local）
GOOGLE_CLOUD_PROJECT_ID=xxx
GEMINI_API_KEY=xxx
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
GOOGLE_CLOUD_STORAGE_BUCKET=xxx
```

### CORS設定（GCS直接アップロード用）

```bash
gsutil cors set cors.json gs://gcs-pingo
```

## トラブルシューティング

- **ビルドエラー**: `npm run build`でTypeScriptエラーを確認
- **テスト失敗**: `npm run test:once -- --reporter=verbose`で詳細確認
- **リント警告**: `npm run check`で自動修正
- **型エラー**: VSCodeのTypeScript言語サービスを再起動
