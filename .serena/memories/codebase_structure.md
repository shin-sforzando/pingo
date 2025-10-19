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
# 画像投稿フロー（3段階処理 - Single Responsibility Principle）
クライアント
  ↓ 1. Upload to GCS
  POST /api/image/getUploadUrl
  ↓
  PUT to signed URL (GCS)
  ↓
  ↓ 2. Appropriateness Check
  POST /api/image/check { gameId, imageUrl }
  ↓ { appropriate: boolean, reason?: string }
  ↓
  ↓ 3. Bingo Matching Analysis
  POST /api/game/[gameId]/submission/analyze { submissionId, imageUrl }
  ↓ { matchedCellId, confidence, critique_ja, critique_en, acceptanceStatus }
  ↓
  ↓ 4. State Update
  POST /api/game/[gameId]/submission { submissionId, imageUrl, analysisResult }
  ↓ { newlyCompletedLines, totalCompletedLines, requiredBingoLines }
  ↓
クライアント（結果表示）

# リアルタイム更新
クライアント ← Firestoreリスナー ← ゲーム状態変更
```

### 画像処理APIアーキテクチャ（Single Responsibility Principle）

#### 1. `/api/image/check` - 適切性チェック専用

**責任**: 画像が全年齢対象として適切かを検証（ゲーム設定によりスキップ可能）

```typescript
// Request
POST /api/image/check
{
  gameId: string,     // ゲーム設定を確認するために必要
  imageUrl: string
}

// Response (skipImageCheck=false)
{
  success: true,
  data: {
    appropriate: boolean,
    reason?: string  // AI生成の説明（適切/不適切の理由）
  }
}

// Response (skipImageCheck=true)
{
  success: true,
  data: {
    appropriate: true,
    reason: "Check skipped per game settings"
  }
}
```

**処理フロー**:

1. 認証確認
2. リクエストの検証（`gameId`, `imageUrl`）
3. ゲーム設定を取得（`AdminGameService.getGame()`）
4. `game.skipImageCheck === true` の場合は早期リターン（AIチェックをスキップ）
5. 画像をフェッチしてBase64エンコード
6. Gemini APIで適切性チェック
7. 結果を返す（状態更新なし）

#### 2. `/api/game/[gameId]/submission/analyze` - 分析専用

**責任**: 画像とビンゴセルのマッチング分析

```typescript
// Request
POST /api/game/[gameId]/submission/analyze
{
  submissionId: string,
  imageUrl: string
}

// Response
{
  success: true,
  data: {
    matchedCellId: string | null,
    confidence: number,
    critique_ja: string,  // 日本語の詳細分析
    critique_en: string,  // 英語の詳細分析
    acceptanceStatus: "accepted" | "no_match" | "inappropriate_content"
  }
}
```

**処理フロー**:

1. 認証＋参加者確認
2. 利用可能なセル取得（未開封のみ）
3. Gemini APIでマッチング分析（多言語critique生成）
4. 分析結果を返す（状態更新なし）

#### 3. `/api/game/[gameId]/submission` - 状態管理専用

**責任**: Submission作成＋PlayerBoard更新＋ビンゴライン検出

```typescript
// Request
POST /api/game/[gameId]/submission
{
  submissionId: string,
  imageUrl: string,
  analysisResult: AnalysisResult
}

// Response
{
  success: true,
  data: {
    newlyCompletedLines: number,
    totalCompletedLines: number,
    requiredBingoLines: number
  }
}
```

**処理フロー**:

1. 認証＋参加者確認
2. Submission レコード作成
3. 受理された場合:
   - PlayerBoard の cellStates 更新
   - ビンゴライン検出
   - completedLines 更新
   - トランザクションで原子的に保存
4. ライン完成情報を返す

### 型システム（src/types/）

- `common.ts`: 共有enumsとユーティリティ型
- `schema.ts`: バリデーション用Zodスキーマ
  - `gameSchema`, `gameCreationSchema`: `skipImageCheck: boolean`を含む
  - `analysisResultSchema`: 分析結果のスキーマ（多言語critique含む）
- `game.ts`: ドメイン固有の型
  - `Game`: `skipImageCheck: boolean`を含む
  - `GameDocument`: Firestore文書型、`skipImageCheck: boolean`を含む
  - `gameFromFirestore()`, `gameToFirestore()`: 変換関数、`skipImageCheck`をマッピング
- `user.ts`: ユーザー固有の型
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
- `SubmissionResult.tsx`: AI解析結果の表示（多言語critique対応）
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
- `useImageSubmission.ts`: 画像投稿処理（3段階API呼び出し）

### サービス層（src/services/）

#### `image-upload.ts` - 画像投稿サービス（3段階処理）

```typescript
export async function submitImage(
  processedImage: ProcessedImage,
  submissionData: ImageSubmissionData,
  authToken: string,
): Promise<ImageSubmissionResult>
```

**処理フロー**:

1. 署名付きURLを取得（`POST /api/image/getUploadUrl`）
2. GCSに直接アップロード（`PUT` to signed URL）
3. 適切性チェック（`POST /api/image/check`）
   - `gameId`を含むリクエスト
   - `skipImageCheck`が有効な場合は自動的にスキップ
   - 不適切な場合は早期リターン
4. ビンゴマッチング分析（`POST /api/game/[gameId]/submission/analyze`）
5. 状態更新（`POST /api/game/[gameId]/submission`）

#### その他サービス

- `game.ts`: ゲームビジネスロジック（Firestore操作、トランザクション処理）
- `locale.ts`: ロケール管理とバリデーション

**統合**:

- Firebase Admin SDKによるデータベースアクセス
- Google Cloud Storageとの統合
- Google Gemini APIとのAI統合（多言語critique生成）
- 型安全なデータ変換ユーティリティ

### ユーティリティライブラリ（src/lib/）

- `firebase/admin.ts`: Firebase Admin SDK初期化と設定
- `firebase/admin-collections.ts`: Firestoreコレクション型安全アクセス
  - `AdminTransactionService`: トランザクション処理
    - `createSubmissionAndUpdateBoard()`: Submission作成とPlayerBoard更新をアトミックに実行
  - `AdminGameService`: ゲーム操作
    - `getGame()`: ゲーム設定を取得（`skipImageCheck`含む）
- `firebase/client.ts`: Firebase Client SDK初期化（認証、Firestore）
- `image-utils.ts`: 画像処理ユーティリティ（HEIC変換、リサイズ、圧縮）
- `cell-utils.ts`: セルID処理ユーティリティ（LLM出力のフォールバック処理）
  - `resolveCellId()`: LLMが件名を返した場合にセルIDに変換
  - `getCellSubject()`: セルIDから件名を取得
- `api-utils.ts`: APIレスポンスヘルパー、エラーハンドリング
- `utils.ts`: 汎用ユーティリティ（cn、日付フォーマット、バリデーション）
- `constants.ts`: アプリケーション定数（URL、制限値、Gemini設定）
  - `GEMINI_MODEL`: "gemini-2.5-flash"
  - `GEMINI_THINKING_BUDGET`: 0

### 実装済みページ

**認証不要**:

- `/` - ホームページ（ランディングページ）

**認証必要**:

- `/game/create` - ゲーム作成ページ
  - 被写体生成、設定
  - **スキップ機能**:
    - `skipSubjectsCheck`: ローカル状態、被写体候補チェックをスキップ（UI専用）
    - `skipImageCheck`: データベース保存、投稿画像チェックをスキップ（ゲーム設定）
- `/game/join` - ゲーム参加ページ（ID入力、公開ゲーム一覧、参加中ゲーム一覧）
- `/game/[gameId]` - ゲームメインページ（ビンゴボード、画像投稿、リアルタイム更新）
- `/game/[gameId]/share` - ゲーム共有ページ（QRコード、参加者一覧）

**デバッグ**:

- `/debug/*` - 開発用デバッグツール

## データモデル

### 主要コレクション（Firestore）

- `users/`: ユーザープロフィールと認証
- `games/`: ゲームメタデータと設定
  - `skipImageCheck: boolean` - 投稿画像の適切性チェックをスキップするか
- `games/{id}/playerBoards/`: 個別プレイヤーの進行状況
- `games/{id}/submissions/`: 写真投稿とAI解析結果（多言語critique含む）
  - `critique_ja`: 日本語の詳細分析
  - `critique_en`: 英語の詳細分析
  - `acceptanceStatus`: "accepted" | "no_match" | "inappropriate_content"

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
  - `maxForks: 3`: Gemini APIレート制限対策

### エントリーポイント

- `src/app/layout.tsx`: プロバイダー付きルートレイアウト
- `src/app/page.tsx`: ホームページ
- `middleware.ts`: 認証ミドルウェア（ルート階層）
- `src/lib/firebase/`: Firebase設定とユーティリティ

## 開発パターン

- **Single Responsibility Principle**: 各APIエンドポイントは単一の責任のみを持つ
- **モバイルファーストデザイン**: Tailwindレスポンシブクラス
- **コンポーネント合成**: 再利用可能なUIビルディングブロック
- **エラーバウンダリ**: 適切なエラーハンドリング
- **ローディング状態**: スケルトンコンポーネントとスピナー
- **アクセシビリティ**: ARIAラベル、キーボードナビゲーション
- **パフォーマンス**: 画像最適化、コード分割
- **AI品質保証**: プロンプトエンジニアリング + 内部検証で安定性向上
- **開発環境最適化**: チェックスキップ機能で開発効率向上

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
- **テスト並行度**: maxForks: 3（Gemini APIレート制限対策）
- **リトライメカニズム**: AI依存テストは `{ retry: 2 }` で安定化

### 開発ツール

- **Biome**: 2.2.4（ESLint + Prettierの代替）
- **Storybook**: 9.1.6
- **lefthook**: 1.13.0（Gitフック管理）
