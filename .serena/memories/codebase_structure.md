# Pingoコードベース構造とアーキテクチャ

## ディレクトリ構造

```plain
pingo/
├── src/
│   ├── app/                    # Next.js App Router ページ
│   │   ├── api/               # API ルート
│   │   ├── game/              # ゲーム関連ページ
│   │   │   └── [gameId]/hooks/ # ゲーム固有のカスタムフック
│   │   └── debug/             # デバッグ用ユーティリティ
│   ├── components/            # React コンポーネント
│   │   ├── ui/               # shadcn/ui ベースコンポーネント
│   │   ├── magicui/          # Magic UI アニメーション
│   │   ├── auth/             # 認証コンポーネント
│   │   ├── layout/           # Header、Footer、Navigation
│   │   └── game/             # ゲーム専用コンポーネント
│   ├── contexts/             # React Context プロバイダー
│   ├── hooks/                # カスタムReact Hooks
│   ├── lib/                  # ユーティリティライブラリと設定
│   ├── services/             # ビジネスロジックとAPIサービス
│   ├── types/                # TypeScript型定義
│   ├── i18n/                 # 国際化
│   ├── stories/              # Storybookストーリー
│   └── test/                 # テストユーティリティとフィクスチャ
├── messages/                 # i18n翻訳ファイル
├── docs/                     # プロジェクトドキュメント
├── public/                   # 静的アセット
├── .storybook/              # Storybook設定
├── scripts/                 # ビルドとユーティリティスクリプト
└── middleware.ts            # Next.js認証ミドルウェア（ルート階層）
```

## 主要アーキテクチャパターン

### App Router構造（Next.js 15）

- **サーバーコンポーネント**: 静的コンテンツのデフォルト
- **クライアントコンポーネント**: インタラクティブ機能（'use client'でマーク）
- **APIルート**: `/app/api/`内のRESTfulエンドポイント
- **ミドルウェア**: 認証とルーティングロジック

### コンポーネントアーキテクチャ

- **UIコンポーネント**: 再利用可能なshadcn/ui + Magic UI
- **機能コンポーネント**: Game、Auth、Layout専用
- **各コンポーネントには以下が必要**:
  - TypeScriptインターフェース
  - Storybookストーリー
  - 単体/統合テスト
  - 適切な国際化対応

### データフロー

```plain
クライアント → APIルート → サービス → Firebase/Firestore
         ↖ リアルタイム ← Firestoreリスナー ← クライアント
```

### 型システム（src/types/）

- `common.ts`: 共有enumsとユーティリティ型
- `schema.ts`: バリデーション用Zodスキーマ
- `game.ts`, `user.ts`: ドメイン固有の型
- `firestore.ts`: データベースドキュメントインターフェース
- `index.ts`: 集約エクスポート

### 状態管理

- **React Context**: グローバル状態（認証、ゲーム）
- **useState/useReducer**: ローカルコンポーネント状態
- **Firestoreリスナー**: リアルタイムデータ更新
- **React Hook Form**: フォーム状態管理

## 重要なコンポーネント

### ゲームフローコンポーネント（src/components/game/）

- `ImageUpload.tsx`: HEIC対応の写真アップロード
- `BingoBoard.tsx`: インタラクティブなビンゴグリッド
- `BingoCell.tsx`: オープン/クローズ状態の個別セル
- `SubmissionResult.tsx`: AI解析結果の表示
- `GameInfo.tsx`: ゲーム詳細情報カード
- `InfoCard.tsx`: 汎用情報カード（アイコン付き）
- `ParticipantsList.tsx`: 参加者一覧表示
- `QRCodeCard.tsx`: QRコード表示カード
- `SubjectList.tsx`: 被写体リスト（ドラッグ&ドロップ対応）
- `SubjectItem.tsx`: 個別被写体アイテム
- `DndContextWrapper.tsx`: ドラッグ&ドロップコンテキストラッパー

### 認証とレイアウト（src/components/auth/, src/components/layout/）

- `AuthGuard.tsx`: ルート保護ラッパー
- `Header.tsx`: 認証状態付きナビゲーション
- `UserMenu.tsx`: ユーザープロフィールドロップダウン
- `NotificationIcon.tsx` + `NotificationDrawer.tsx`: リアルタイム通知

### カスタムフック

**グローバルフック（src/hooks/）**:

- `useGameJoin.ts`: ゲーム参加処理（楽観的UI更新、トランザクション対応）
- `useGameParticipation.ts`: ゲーム参加状態の確認
- `useParticipatingGames.ts`: 参加中のゲームリスト取得
- `useAuthenticatedFetch.ts`: 認証付きフェッチのユーティリティ

**ゲーム固有フック（src/app/game/[gameId]/hooks/）**:

- `useGameData.ts`: ゲームデータ取得の統一インターフェース（Firestoreリスナー統合）
- `useImageSubmission.ts`: 画像投稿処理

### サービス層（src/services/）

- `game.ts`: ゲームビジネスロジック（Firestore操作、トランザクション処理）
- `image-upload.ts`: 画像アップロードロジック（GCS署名付きURL、メタデータ管理）
- `locale.ts`: ロケール管理とバリデーション
- Firebase Admin SDKによるデータベースアクセス
- Google Cloud Storageとの統合
- Google Gemini APIとのAI統合
- 型安全なデータ変換ユーティリティ

### ユーティリティライブラリ（src/lib/）

- `firebase/admin.ts`: Firebase Admin SDK初期化と設定
- `firebase/admin-collections.ts`: Firestoreコレクション型安全アクセス
- `firebase/client.ts`: Firebase Client SDK初期化（認証、Firestore）
- `image-utils.ts`: 画像処理ユーティリティ（HEIC変換、リサイズ、圧縮）
- `api-utils.ts`: APIレスポンスヘルパー、エラーハンドリング
- `utils.ts`: 汎用ユーティリティ（cn、日付フォーマット、バリデーション）
- `constants.ts`: アプリケーション定数（URL、制限値）

### 実装済みページ

**認証不要**:

- `/` - ホームページ（ランディングページ）

**認証必要**:

- `/game/create` - ゲーム作成ページ（被写体生成、設定）
- `/game/join` - ゲーム参加ページ（ID入力、公開ゲーム一覧、参加中ゲーム一覧）
- `/game/[gameId]` - ゲームメインページ（ビンゴボード、画像投稿、リアルタイム更新）
- `/game/[gameId]/share` - ゲーム共有ページ（QRコード、参加者一覧）

**デバッグ**:

- `/debug/*` - 開発用デバッグツール

## データモデル

### 主要コレクション（Firestore）

- `users/`: ユーザープロフィールと認証
- `games/`: ゲームメタデータと設定
- `games/{id}/playerBoards/`: 個別プレイヤーの進行状況
- `games/{id}/submissions/`: 写真投稿とAI解析結果

### ID規則

- **ULID**: すべての内部ID（ユーザー、投稿など）
- **6文字ゲームID**: ユーザー向けゲームコード（例: 「ABCDEF」）
- **タイムスタンプ**: 適切な変換ユーティリティ付きFirestore Timestamp

## 理解すべき重要ファイル

### 設定

- `biome.json`: リンティングとフォーマット規則
- `tsconfig.json`: TypeScript設定
- `next.config.ts`: Next.jsビルド設定
- `vitest.config.mts`: テスト設定

### エントリーポイント

- `src/app/layout.tsx`: プロバイダー付きルートレイアウト
- `src/app/page.tsx`: ホームページ
- `middleware.ts`: 認証ミドルウェア（ルート階層）
- `src/lib/firebase/`: Firebase設定とユーティリティ

## 開発パターン

- **モバイルファーストデザイン**: Tailwindレスポンシブクラス
- **コンポーネント合成**: 再利用可能なUIビルディングブロック
- **エラーバウンダリ**: 適切なエラーハンドリング
- **ローディング状態**: スケルトンコンポーネントとスピナー
- **アクセシビリティ**: ARIAラベル、キーボードナビゲーション
- **パフォーマンス**: 画像最適化、コード分割

## 最新技術仕様

### 技術スタック

- **Next.js**: 15.5.3（最新版）
- **React**: 19.1.1（最新版）
- **TypeScript**: 5系
- **Tailwind CSS**: 4系
- **Firebase**: 12.2.1
- **Google Gemini**: @google/genai 1.19.0

### テスト環境

- **単体テスト**: Vitest 3.2.4
- **E2Eテスト**: Playwright 1.55.0
- **ブラウザテスト**: @vitest/browser 3.2.4
- **テストライブラリ**: @testing-library/react 16.3.0

### 開発ツール

- **Biome**: 2.2.4（ESLint + Prettierの代替）
- **Storybook**: 9.1.6
- **lefthook**: 1.13.0（Gitフック管理）
