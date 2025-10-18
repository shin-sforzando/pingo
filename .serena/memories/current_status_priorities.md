# Pingo開発状況と優先タスク

## 現在の開発状況

### ✅ 完了済み機能

#### コア機能

- **ゲーム作成**: Gemini AIによる被写体生成を含む完全なフロー
- **画像アップロード**: HEIC対応、リサイズ/圧縮、GCS統合
- **ゲームメイン画面**: ビンゴボード、リアルタイム更新、AI解析
- **認証機能**: Firebase Authによるユーザー管理
- **リアルタイム更新**: ゲーム状態のFirestoreリスナー
- **ビンゴライン検出**: 行/列/斜めの自動完了検出

#### ゲーム参加機能

- **ゲーム参加UI**: `/game/join`ページの完全実装
  - 手動ID入力と検証（6文字、大文字のみ）
  - ゲーム情報の事前確認（参加者数を含む）
  - 参加中のゲーム一覧表示（クリックで直接ゲームページへ）
  - 公開ゲーム一覧表示（クリックで直接参加→シェアページへ）
  - GameInfoCardによる統一された表示
  - FormControl/Label適切な関連付け（アクセシビリティ対応）
  - 「参加する」ボタンを検証済みゲームカード内に配置（UX改善）
- **カスタムフック**:
  - `useGameJoin`: ゲーム参加処理（楽観的UI更新、トランザクション対応）
  - `useGameParticipation`: ゲーム参加状態の確認
  - `useParticipatingGames`: 参加中のゲームリスト取得（依存配列最適化済み）
  - `useGameData`: ゲームデータ取得の統一インターフェース
- **APIエンドポイント**:
  - `/api/game/public` - 公開ゲーム一覧取得（isPublicフィールド含む）
  - `/api/game/[gameId]/join` - ゲーム参加処理
  - `/api/game/[gameId]/participants` - 参加者一覧取得
- **QRコード機能**: QRコード表示機能の完全実装（スキャンはOS標準機能を利用）

#### UI/UXコンポーネント

- **UI基盤**: shadcn/ui + Magic UIコンポーネント with Storybook
- **GameInfoCard**: 再利用可能なゲーム情報カードコンポーネント
  - DRY原則適用により重複コード80行以上削減
  - 検証済みゲーム、参加中ゲーム、公開ゲームで共通利用
  - 7つのStorybookストーリー（FullInfo, MinimalInfo, LongNotes, ExpiringSoon, JapaneseLocale, VerifiedGame）
  - 13のブラウザテストケース
- **UserMenu**: 参加中ゲーム表示機能（最大10件）
- **認証状態管理**: ログアウト時のリダイレクト最適化
  - ゲームページからログアウト時にトップページへ正しくリダイレクト
  - useEffect race conditionの解決

#### 型定義とコード品質

- **型の統合**: `GameInfo`型の導入
  - `PublicGameInfo`と`VerifiedGameInfo`を`GameInfo`に統合
  - 公開/非公開に関係なく使用可能
  - `isPublic`フィールドでゲームの公開状態を明示
  - `isParticipating`フィールドでユーザーの参加状態を表示
- **翻訳構造の最適化**: 共通フィールドラベルの統合、重複削除、命名規則統一
  - 総キー数232→215（-7.3%）
  - 重複0、未使用キー0
  - `useTranslations()`（引数なし）でフルパス参照に統一
- **国際化対応**: next-intlによる日本語/英語サポート

#### テスト

- **テストカバレッジ**: 281個のテスト（36ファイル）、主要APIエンドポイントのテスト実装済み
- **ブラウザテスト**: Vitest Browserモード（Playwright + webkit）で11ファイル実装済み
- **合格率**: 100%（281/281）

## 開発コンテキストメモ

### 対象ユーザー

- **モバイルファースト**: スマートフォンが主要プラットフォーム
- **コンテンツポリシー**: ファミリーフレンドリー、全年齢対象
- **言語**: 日本語メイン、英語サブ
- **AI統合**: Google Gemini による画像解析と被写体生成

### 技術的制約

- **モバイル互換性**: iOS Safariでの完璧な動作が必須
- **パフォーマンス目標**:
  - 画像解析: 3秒以内（最大5秒）
  - ページロード: 2秒以内
  - 最大50プレイヤー/ゲーム
  - 最大1,000同時接続ユーザー
- **データ制限**: プレイヤーあたり最大30回の画像投稿/ゲーム

### 開発ワークフローの注意点

- `main`ブランチで直接作業しない
- コミット前に必ず`npm run test:once`を実行
- 全コンポーネントにStorybookストーリーが必要
- 6文字ゲームID以外は全てULIDを使用
- 類似コンポーネントの既存パターンに従う
- 翻訳キーは`useTranslations()`（引数なし）でフルパス参照を使用
- DRY原則を遵守し、再利用可能なコンポーネントを作成

## 現在の技術仕様

### 最新技術スタック

- **Next.js**: 15.5.3（App Router）
- **React**: 19.1.1
- **TypeScript**: 5系
- **Tailwind CSS**: 4系
- **Firebase**: 12.2.1
- **Google Gemini**: @google/genai 1.19.0

### 開発・テスト環境

- **リンター/フォーマッター**: Biome 2.2.4
- **単体テスト**: Vitest 3.2.4
- **E2Eテスト**: Playwright 1.55.0
- **UI開発**: Storybook 9.1.6
- **Gitフック**: lefthook 1.13.0

### 実装済みAPIエンドポイント

- **ヘルスチェック**: `/api/health`
- **認証**: `/api/auth/*`（login, register, logout, update, me）
- **ゲーム管理**:
  - `/api/game/create` - ゲーム作成
  - `/api/game/[gameId]` - ゲーム情報取得
  - `/api/game/[gameId]/board` - ゲームボード取得
  - `/api/game/[gameId]/events` - ゲームイベント
- **公開ゲーム**: `/api/game/public` - 公開ゲーム一覧取得（isPublicフィールド含む）
- **ゲーム参加**: `/api/game/[gameId]/join` - ゲーム参加処理
- **参加者管理**: `/api/game/[gameId]/participants` - 参加者一覧取得
- **プレイヤーボード**: `/api/game/[gameId]/playerBoard/[userId]` - 個別プレイヤーボード
- **画像管理**:
  - `/api/image/getUploadUrl` - GCS署名付きURL取得
  - `/api/image/upload` - 画像アップロード
  - `/api/image/check` - 画像適切性チェック（AI）
- **画像投稿**:
  - `/api/game/[gameId]/submission` - 投稿作成
  - `/api/game/[gameId]/submission/[submissionId]` - 投稿詳細
  - `/api/game/[gameId]/submission/analyze` - AI画像解析
- **被写体管理**:
  - `/api/subjects/generate` - AI被写体生成
  - `/api/subjects/check` - 被写体チェック

### 実装済みカスタムフック

- **useGameJoin**: ゲーム参加処理（楽観的UI更新、トランザクション対応）
- **useGameParticipation**: ゲーム参加状態の確認
- **useParticipatingGames**: 参加中のゲームリスト取得（依存配列最適化、GameInfo型使用）
- **useGameData**: ゲームデータ取得の統一インターフェース
- **useAuthenticatedFetch**: 認証付きフェッチのユーティリティ

### 実装済みコンポーネント

#### 再利用可能コンポーネント

- **GameInfoCard**: ゲーム情報表示カード
  - 検証済み/参加中/公開ゲーム一覧で使用
  - GameInfo型を受け取り統一された表示
  - 7つのStorybookストーリー
  - 13のブラウザテストケース

### 実装済みページ

- **`/game/join`**: ゲーム参加ページ（手動ID入力、検証、公開ゲーム一覧、参加中ゲーム一覧）
- **`/game/[gameId]`**: ゲームメインページ（ログアウトリダイレクト修正済み）
- **`/game/[gameId]/share`**: ゲーム共有ページ
- **`/game/create`**: ゲーム作成ページ

### 型定義

#### GameInfo型

`src/types/schema.ts`で定義された統一ゲーム情報型：

```typescript
export interface GameInfo {
  id: string;
  title: string;
  theme: string;
  notes?: string;
  participantCount: number;
  createdAt: Date | null;
  expiresAt: Date | null;
  isPublic?: boolean;
  isParticipating?: boolean;
}
```

**用途**:

- ゲーム参加ページの検証済みゲーム表示
- 参加中のゲーム一覧
- 公開ゲーム一覧
- GameInfoCardコンポーネント

**以前の型**: `PublicGameInfo`と`VerifiedGameInfo`を統合して`GameInfo`に変更

## 品質保証状況

### テストカバレッジ現況

- **テスト総数**: 281個（36ファイル）
- **合格率**: 100%（281/281）
- **API routes**: 大部分でテスト実装済み
- **Components**: レイアウトコンポーネント、GameInfoCard等でテスト済み
- **Hooks**: useGameJoin、useGameParticipation、useGameData、useParticipatingGamesのテスト完了
- **Services**: 一部のサービス層でテスト不足
- **ブラウザテスト**: Vitest Browserモード（Playwright + webkit）で11ファイル実装済み
  - GameInfoCard.browser.test.tsx: 13テストケース

### 翻訳ファイル状況

- **総キー数**: 215個（ja.json、en.json）
- **名前空間**: Common、Game、Auth、Header、Footer、HomePage、ImageUpload、Notification、ParticipantsList
- **重複**: 0個（すべて解消済み）
- **未使用キー**: 0個（すべて削除済み）
- **命名規則違反**: 0個（すべて修正済み）

## 優先タスク

### 1. テストカバレッジ（高優先度）

以下の重要コンポーネントでテストが不足:

- `src/components/game/ImageUpload.tsx`
- `src/services/image-upload.ts`
- `src/app/api/image/upload/route.ts`
- `src/app/api/game/[gameId]/submission/analyze/route.ts`

### 2. セキュリティ・本番対応（高優先度）

- レート制限の実装
- APIキーのセキュリティレビュー
- デバッグログの削除

### 3. パフォーマンス最適化（中優先度）

- 画像最適化の強化
- コード分割の改善
- リアルタイム更新の最適化
