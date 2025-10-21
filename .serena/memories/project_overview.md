# Pingoプロジェクト概要

## プロジェクト基本情報

- **プロジェクト名**: Pingo
- **概要**: AIによる画像判定を用いたビンゴゲームアプリケーション
- **プラットフォーム**: macOS (Darwin)
- **リポジトリ**: <https://github.com/shin-sforzando/pingo>

## 技術スタック

### フロントエンド

- Next.js 15.5.3 (App Router)
- React 19.1.1
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui コンポーネントライブラリ
- next-intl 4.3.8 (多言語対応)

### バックエンド・インフラ

- Node.js 22
- Firebase (Authentication, Firestore)
- Google Cloud Storage
- Google Gemini API (@google/genai)
- Docker対応
- Google Cloud Run (デプロイ)

### 開発ツール

- Biome 2.2.4 (フォーマッター・リンター)
- Vitest 3.2.4 (単体テスト)
- Playwright 1.55.0 (E2Eテスト)
- Storybook 9.1.6 (UIコンポーネント開発)
- lefthook 1.13.0 (Gitフック管理)
- git-secret (機密情報管理)

## プロジェクト構造

```plain
/
├── src/
│   ├── app/          # Next.js App Router
│   ├── components/   # Reactコンポーネント
│   ├── contexts/     # React Context
│   ├── hooks/        # カスタムReact Hooks
│   ├── i18n/         # 多言語対応
│   ├── lib/          # ユーティリティ
│   ├── services/     # ビジネスロジック
│   ├── stories/      # Storybook
│   ├── test/         # テストユーティリティ
│   └── types/        # TypeScript型定義
├── messages/         # 多言語メッセージ
├── docs/             # プロジェクトドキュメント
├── public/           # 静的ファイル
├── scripts/          # ビルドスクリプト
├── .storybook/       # Storybook設定
└── middleware.ts     # Next.js認証ミドルウェア
```

## 主な機能

- 5x5のビンゴゲーム（中央はFree）
- 各マスには被写体候補が表示される（AI生成）
- プレイヤーは写真を撮影してアップロード（HEIC対応）
- AIが写真を判定してマスをOPEN
- ハンドルネームとパスワードによる認証
- QRコードによるゲーム共有（スマートフォンOS標準機能で読み取り）
- ゲーム参加機能（手動ID入力、公開ゲーム一覧）
- リアルタイム更新（Firestoreリスナー）
- 多言語対応（日本語/英語）

## テスト戦略

### 単体テスト（Vitest jsdom）
- APIルート、カスタムフック、サービス層
- 255個のテスト、100%合格率

### ブラウザテスト（Vitest Browser Mode）
- Playwright + webkitで実ブラウザ実行
- ページとコンポーネントの統合テスト
- 10ファイル実装済み（ホーム、ゲーム作成/参加、レイアウトコンポーネント）

## 環境変数

- `.env`: 公開可能な環境変数（Firebase設定など）
- `.env.local`: 機密環境変数（APIキー、認証情報）
  - GOOGLE_CLOUD_PROJECT_ID
  - GEMINI_API_KEY
  - GOOGLE_APPLICATION_CREDENTIALS
  - GOOGLE_CLOUD_STORAGE_BUCKET
