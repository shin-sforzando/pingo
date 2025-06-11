# 進捗状況

## 現在の状態

Pingoプロジェクトは現在、機能実装段階に入っています。基礎構築が完了し、ゲーム作成機能、画像投稿機能、ゲームメイン画面の実装が完了しました。

> [!NOTE]
> 詳細な要件や設計の情報については、 `./cline_docs/TechnicalSpecification.md` を参照してください。
> 過去の開発履歴については、 `./cline_docs/Archived_yyyymmdd.md` を参照してください。

## 最近の変更

### ビンゴライン検出と参加者統計更新機能の完全実装

- ビンゴライン検出機能の実装
  - `detectCompletedLines`関数を追加：5x5グリッドで行、列、対角線の完成を検出
  - 画像受け入れ時に自動的にビンゴライン検出を実行
  - 新しく完成したラインのみを`playerBoard.completedLines`に追加
- 参加者統計の自動更新
  - `submissionCount`：新しいサブミッション作成時に自動インクリメント
  - `completedLines`：ビンゴライン完成時に自動更新
  - `lastCompletedAt`：新しいライン完成時にタイムスタンプを更新
- Firestoreトランザクション処理の修正
  - "Firestore transactions require all reads to be executed before all writes"エラーを解決
  - すべての読み取り操作を`Promise.all()`でまとめて実行し、その後に書き込み操作を実行
- 複合インデックスの最適化
  - `submissions`コレクション用の複合インデックス（`userId` + `submittedAt`）を作成
- 参加者一覧の表示問題解決
  - `getParticipants`メソッドを`game_participations`コレクションから統計情報付きで取得するように変更
  - 参加者APIのレスポンス型に`completedLines`と`submissionCount`を追加
  - `ParticipantsList`コンポーネントのインターフェースを更新し、TypeScriptエラーを修正

### ゲームメイン画面の完全実装完了

- ゲームメイン画面ページ（`/game/[gameId]`）の実装
- 画像アップロード→Gemini分析→セル自動更新の統合フロー完成
  - `/api/image/check`エンドポイントの完全書き直し
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

### ゲーム参加機能の実装（優先度：最高）

- ゲーム参加フォームの実装
  - QRコード表示機能
  - ゲームID（6桁）入力フォーム
  - 公開かつ有効なゲームの一覧表示
  - 参加確認とプレイヤーボード初期化

### 画像投稿機能の改善（優先度：高）

- 品質保証
  - 残りのAPIエンドポイントのテスト追加
  - エラーケースのテスト強化
  - 統合テストの実装

- 本番対応
  - デバッグログの削除
  - ユーザーフレンドリーなエラーメッセージ
  - パフォーマンス最適化

- セキュリティ強化
  - レート制限の実装
  - ファイル内容の詳細検証
  - APIキーの適切な管理

### その他の機能実装

- 認証・認可の強化
  - 認証済みユーザーのみがアクセスできるページの保護
  - 適切な権限管理

- ユーザビリティ向上
  - エラーメッセージの多言語対応
  - 操作フローの改善
  - レスポンシブデザインの最適化

## 既知の問題

### テストが不十分なファイル

- `src/components/game/ImageUpload.tsx`
- `src/lib/image-utils.ts`
- `src/services/image-upload.ts`
- `src/app/api/image/getUploadUrl/route.ts`
- `src/app/api/image/upload/route.ts`

### 技術的課題

- ページやコンポーネント内にロジックが記述されすぎてファイルが長大になっている
- Firestoreの複合インデックスを活用しきれていない
- UserMenuに表示するゲーム履歴の改善
  - ゲームIDだけでなくゲームタイトルも表示
  - ゲーム作成日時で降順
- OPEN時、BINGO時の演出の追加
  - OPEN時はMagic UIのConfettiのBasic、BINGO時はConfettiのFireworks
- ゲーム参加画面がまだ実装されていない
- シェア画面の参加者一覧をParticipantsListに差し替える
- critiqueの二か国語対応
  - `critiqueJa` と `critiqueEn` を返すようにして、現在のLocaleに合わせて表示切替
- テスト品質（自動テスト、エラーケース）
  - テストデータでULIDであるべき場所が適当な値になっている
    - `faker.string.ulid()` を活用せよ
- セキュリティ
  - 投稿回数制限が正しく機能しているか
  - ゲーム画面やゲーム作成画面を非認証ユーザーがアクセスできてはいけない
- ユーザビリティ
  - ゲームのメイン画面にアクセスした際、画面を読み込むローディングとユーザのデータを読み込むローディングが行われている
  - 画像投稿時の待ち時間が長いので、適切なローディング表示を行う
- 国際化（エラーメッセージの多言語対応）
- Storybook 9系へのアップグレード
- Storybookストーリーが存在しない画面がある
