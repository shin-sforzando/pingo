# 進捗状況

## 現在の状態

Pingoプロジェクトは現在、機能実装段階に入っています。基礎構築が完了し、ゲーム作成機能、画像投稿機能、ゲームメイン画面の実装が完了しました。

> [!NOTE]
> 詳細な要件や設計の情報については、 `./docs/TechnicalSpecification.md` を参照してください。
> 過去の開発履歴については、 `./docs/Archived_yyyymmdd.md` を参照してください。

## 最近の変更

### ビンゴライン検出と参加者統計更新機能の完全実装

- ビンゴライン検出機能の実装
  - `detectCompletedLines` 関数を追加: 5x5グリッドで行、列、対角線の完成を検出
  - 画像受け入れ時に自動的にビンゴライン検出を実行
  - 新しく完成したラインのみを `playerBoard.completedLines` に追加
- 参加者統計の自動更新
  - `submissionCount`: 新しいサブミッション作成時に自動インクリメント
  - `completedLines`: ビンゴライン完成時に自動更新
  - `lastCompletedAt`: 新しいライン完成時にタイムスタンプを更新
- Firestoreトランザクション処理の修正
  - "Firestore transactions require all reads to be executed before all writes"エラーを解決
  - すべての読み取り操作を `Promise.all()` でまとめて実行し、その後に書き込み操作を実行
- 複合インデックスの最適化
  - `submissions` コレクション用の複合インデックス（`userId` + `submittedAt`）を作成
- 参加者一覧の表示問題解決
  - 参加者APIのレスポンス型に `completedLines` と `submissionCount` を追加
  - `ParticipantsList` コンポーネントのインターフェースを更新し、TypeScriptエラーを修正

### ゲームメイン画面の完全実装完了

- ゲームメイン画面ページ（`/game/[gameId]`）の実装
- 画像アップロード→Gemini分析→セル自動更新の統合フロー完成
  - `/api/image/check` エンドポイントの完全書き直し
  - Gemini分析、Submissionレコード作成、セル状態更新を統合
  - 公序良俗チェック + ビンゴセル分析の2段階処理
  - 確信度による自動承認/拒否判定
- SubmissionResult表示問題の解決
  - ImageSubmissionResult型の拡張（Gemini分析結果フィールド追加）
  - 画像プレビュー機能追加（24x24px）
  - アップロード完了後のImageUploadプレビュー自動クリア
- リアルタイム更新機能
  - Firestoreリスナーでプレイヤーボード状態を即座に反映
  - セルOPEN状態の視覚的更新
  - 投稿履歴の自動更新
- エラーハンドリング改善
  - 各API呼び出しで適切なエラーハンドリング
  - インライン表示でユーザーフレンドリーなエラーメッセージ

## 完了済み機能

### ✅ ゲーム作成機能

- ゲーム作成フォーム（タイトル、テーマ、被写体候補）
- Gemini APIによる被写体候補生成・検証
- ビンゴボードプレビュー
- 多言語対応（日英）

### ✅ 画像投稿機能

- ImageUploadコンポーネント（HEIC対応、リサイズ・圧縮）
- Google Cloud Storage連携
- Gemini AI画像内容チェック
- 署名付きURL生成

### ✅ ゲームメイン画面

- ビンゴボード表示
- 画像アップロード機能
- AI判定結果表示
- ゲーム情報・参加者一覧
- リアルタイム更新

### ✅ 基盤機能

- Firebase Authentication
- Firestore データベース
- データアクセス層（Admin Services）
- 多言語対応（next-intl）
- UI コンポーネント（shadcn/ui + Magic UI）

## 次のステップ

### 1. ゲーム参加機能の実装（優先度: 最高・未実装）

重要: ホームページで`/game/join`へのリンクが存在するが、実際のページとAPIが未実装

- ゲーム参加画面（`/game/join`）の作成
  - ページファイル自体が存在しない
  - QRコード読み取り機能
  - ゲームID（6桁）手動入力フォーム
  - 公開ゲーム一覧表示

- ゲーム参加API（`/api/game/join` または `/api/game/[gameId]/join`）の実装
  - 現在、参加用APIが存在しない
  - 参加確認とプレイヤーボード初期化

### 2. テスト不足の解消（優先度: 高）

現状: 28個のテストファイルが存在するが、重要なコンポーネントのテストが不足

- テストが存在しないファイル:
  - `src/components/game/ImageUpload.tsx`（重要）
  - `src/services/image-upload.ts`（重要）
  - `src/app/api/image/upload/route.ts`（テストなし）
  - `src/app/api/game/[gameId]/submission/analyze/route.ts`（テストなし）

- テスト品質の改善:
  - ULIDテストデータの適切な使用（`faker.string.ulid()`）
  - エラーケースのテスト強化

### 3. 本番対応とセキュリティ（優先度: 高）

- セキュリティ強化
  - レート制限の実装
  - 投稿回数制限の検証
  - APIキーの適切な管理

### 4. ユーザビリティ向上（優先度: 中）

- ローディング・エラー表示の改善
- 演出の追加（Confetti等）
- 多言語対応の完全化（critique結果等）

## 既知の問題と課題

### 1. 重大な未実装機能

- ゲーム参加機能が完全に未実装
  - `/game/join` ページが存在しない（ホームページからリンクされているが404エラー）
  - ゲーム参加用API（`/api/game/join`等）が存在しない
  - 参加フローが実装されていない

### 2. テスト不足（28個のテストファイル存在、しかし重要な部分が不足）

- テストが存在しないファイル:
  - `src/components/game/ImageUpload.tsx`（重要コンポーネント）
  - `src/services/image-upload.ts`（重要サービス）
  - `src/app/api/image/upload/route.ts`
  - `src/app/api/game/[gameId]/submission/analyze/route.ts`

- テスト品質の問題:
  - ULIDであるべき場所で適当な値を使用
  - `faker.string.ulid()` の活用不足
  - エラーケースのテスト不足

### 3. 技術的課題

- 画像判定の不具合:
  - `matchedCellId` が「cell_22」でなく「山の稜線」等の文字列で返る場合がある
  - 以降の処理が適切に行われない

- コード構造の問題:
  - ページやコンポーネント内のロジックが長大
  - 責任分離の改善が必要

- データベース最適化:
  - Firestoreの複合インデックス活用不足

### 4. ユーザビリティ課題

- ローディング状態:
  - ゲームメイン画面の複数ローディング状態
  - 画像投稿時の長い待ち時間に対する適切な表示不足

- 演出の不足:
  - セルOPEN時の演出（Confetti Basic）
  - ビンゴ達成時の演出（Confetti Fireworks）

- UserMenu改善:
  - ゲーム履歴でゲームタイトル表示
  - 作成日時での降順ソート

### 5. 国際化・多言語対応

- critique結果の多言語対応:
  - `critiqueJa` と `critiqueEn` の分離
  - 現在のLocaleに応じた表示切り替え

- エラーメッセージの多言語対応

### 6. セキュリティ・本番対応

- 認証・認可: ✅ 実装済み
  - ゲーム作成・ゲームメイン画面でAuthGuard適用済み

- レート制限・制約:
  - 投稿回数制限の検証
  - APIレート制限の実装

### 7. 開発環境・ツール

- Storybook関連:
  - 一部画面のStorybookストーリー不足

- その他:
  - シェア画面の参加者一覧をParticipantsListに差し替え
