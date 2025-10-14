# Pingo開発状況と優先タスク

## 現在の開発状況

### ✅ 完了済み機能

- **ゲーム作成**: Gemini AIによる被写体生成を含む完全なフロー
- **画像アップロード**: HEIC対応、リサイズ/圧縮、GCS統合
- **ゲームメイン画面**: ビンゴボード、リアルタイム更新、AI解析
- **認証機能**: Firebase Authによるユーザー管理
- **UI基盤**: shadcn/ui + Magic UIコンポーネント with Storybook
- **国際化対応**: next-intlによる日本語/英語サポート
- **リアルタイム更新**: ゲーム状態のFirestoreリスナー
- **ビンゴライン検出**: 行/列/斜めの自動完了検出
- **参加者管理API**: `/api/game/[gameId]/participants`エンドポイント
- **テストカバレッジ**: 255個のテスト、主要APIエンドポイントのテスト実装済み
- **ゲーム参加機能**: カスタムフック（useGameJoin、useGameParticipation、useParticipatingGames）による完全な参加フロー実装
- **ゲーム参加UI**: `/game/join`ページの完全実装（手動ID入力、検証、参加機能）
- **公開ゲーム一覧**: `/api/game/public`エンドポイントと一覧表示UI
- **参加中のゲーム一覧**: UserMenuおよびjoinページでの表示機能
- **翻訳構造の最適化**: 共通フィールドラベルの統合、重複削除、命名規則統一
- **QRコード機能**: QRコード表示機能の完全実装（スキャンはOS標準機能を利用）

### 🔄 最近完了した作業（ブランチ049_game_participation_feature）

#### ゲーム参加機能の完全実装

- **useGameJoin**: ゲーム参加処理のカスタムフック（トランザクション対応）
- **useGameParticipation**: ゲーム参加状態の確認フック
- **useParticipatingGames**: 参加中のゲームリストを取得するフック
- **useGameData**: ゲームデータ取得の統一インターフェース
- **`/game/join`ページ**: 527行の完全な実装
  - ゲームID手動入力と検証
  - リアルタイム入力検証（6文字、大文字のみ）
  - ゲーム情報の事前確認
  - 参加中のゲーム一覧表示
  - 公開ゲーム一覧表示（クリックで自動参加）
- **`/api/game/public`エンドポイント**: 公開ゲームの取得
- **参加状態チェックの強化**: 参加済みユーザーへのリダイレクトメッセージ
- **UserMenuでの参加中ゲーム表示機能**
- **QRコード表示**: `QRCodeCard`コンポーネントによるゲームURL/IDのQRコード表示（スキャンはスマートフォンOS標準機能）

#### 翻訳構造のリファクタリング

- **共通フィールドラベルの抽出**: 11個のラベルを`Game.*`レベルに統合
  - `status`, `expirationDate`, `photoSharing`, `lines`
  - `public`, `private`, `on`, `off`, `active`, `ended`, `archived`
- **重複削除**: `Game.Share.*`から14個の重複キーを削除
- **未使用名前空間の削除**: `GameInfo.*`全体（15キー）を削除
- **命名規則統一**: `imageUpload.*` → `ImageUpload.*`にリネーム
- **翻訳パターンの標準化**:
  - 常に`useTranslations()`（引数なし）を使用
  - フルパスキー（例：`Game.status`）で参照
  - 3層階層構造：共通（`Game.*`）、ページ固有（`Game.Share.*`）、コンポーネント固有（`ImageUpload.*`）
- **成果**: 総キー数232→215（-7.3%）、重複0、未使用キー0、テスト255/255合格

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
- **公開ゲーム**: `/api/game/public` - 公開ゲーム一覧取得
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
- **useParticipatingGames**: 参加中のゲームリスト取得
- **useGameData**: ゲームデータ取得の統一インターフェース
- **useAuthenticatedFetch**: 認証付きフェッチのユーティリティ

### 実装済みページ

- **`/game/join`**: ゲーム参加ページ（手動ID入力、検証、公開ゲーム一覧、参加中ゲーム一覧）
- **`/game/[gameId]`**: ゲームメインページ
- **`/game/[gameId]/share`**: ゲーム共有ページ
- **`/game/create`**: ゲーム作成ページ

## 品質保証状況

### テストカバレッジ現況

- **テスト総数**: 255個（34ファイル）
- **合格率**: 100%（255/255）
- **API routes**: 大部分でテスト実装済み
- **Components**: レイアウトコンポーネント中心にテスト済み
- **Hooks**: useGameJoin、useGameParticipation、useGameData、useParticipatingGamesのテスト完了
- **Services**: 一部のサービス層でテスト不足
- **ブラウザテスト**: Vitest Browserモード（Playwright + webkit）で10ファイル実装済み

### 翻訳ファイル状況

- **総キー数**: 215個（ja.json、en.json）
- **名前空間**: Common、Game、Auth、Header、Footer、HomePage、ImageUpload、Notification、ParticipantsList
- **重複**: 0個（すべて解消済み）
- **未使用キー**: 0個（すべて削除済み）
- **命名規則違反**: 0個（すべて修正済み）
