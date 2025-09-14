# Pingoプロジェクト概要

## プロジェクト基本情報

- **プロジェクト名**: Pingo
- **概要**: AIによる画像判定を用いたビンゴゲームアプリケーション
- **プラットフォーム**: macOS (Darwin)
- **リポジトリ**: <https://github.com/shin-sforzando/pingo>

## 技術スタック

### フロントエンド

- Next.js 15.5.3 (App Router)
- React 19.1.0
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui コンポーネントライブラリ
- next-intl (多言語対応)

### バックエンド・インフラ

- Node.js 22
- Firebase (Authentication, Firestore)
- Google Cloud Storage
- Google Gemini API (@google/genai)
- Docker対応
- Google Cloud Run (デプロイ)

### 開発ツール

- Biome (フォーマッター・リンター)
- Vitest (単体テスト)
- Playwright (E2Eテスト)
- Storybook 9 (UIコンポーネント開発)
- lefthook (Gitフック管理)
- git-secret (機密情報管理)

## プロジェクト構造

```plain
/
├── src/
│   ├── app/          # Next.js App Router
│   ├── components/   # Reactコンポーネント
│   ├── contexts/     # React Context
│   ├── i18n/         # 多言語対応
│   ├── lib/          # ユーティリティ
│   ├── services/     # ビジネスロジック
│   ├── stories/      # Storybook
│   ├── test/         # テストユーティリティ
│   └── types/        # TypeScript型定義
├── messages/         # 多言語メッセージ
├── public/           # 静的ファイル
├── scripts/          # ビルドスクリプト
├── cline_docs/       # Cline用ドキュメント
└── e2e/              # E2Eテスト
```

## 主な機能

- 5x5のビンゴゲーム（中央はFree）
- 各マスには被写体候補が表示される
- プレイヤーは写真を撮影してアップロード
- AIが写真を判定してマスをOPEN
- ハンドルネームとパスワードによる簡易認証
- QRコードによるゲーム共有
- リアルタイム更新

## 環境変数

- `.env`: 公開可能な環境変数（Firebase設定など）
- `.env.local`: 機密環境変数（APIキー、認証情報）
  - GOOGLE_CLOUD_PROJECT_ID
  - GEMINI_API_KEY
  - GOOGLE_APPLICATION_CREDENTIALS
  - GOOGLE_CLOUD_STORAGE_BUCKET
