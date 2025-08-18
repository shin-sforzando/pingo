# コードスタイルと規約

## TypeScript規約

### 型定義

- **厳格な型定義**: `any`型の使用禁止
- **型インポート**: `import type`を使用
- **非null演算子**: `!`の使用禁止
- Zodスキーマによる実行時バリデーション

### 命名規則

- コンポーネント: PascalCase
- 関数・変数: camelCase
- 定数: UPPER_SNAKE_CASE
- ファイル名: kebab-case（Reactコンポーネントを除く）

## Biome設定

### フォーマット

- インデント: スペース2文字
- 引用符: ダブルクォート
- 行幅: 80文字
- editorconfig設定を尊重

### リンター規則

- `noExplicitAny`: any型の使用禁止
- `noForEach`: for...of文を推奨
- `noNonNullAssertion`: !演算子の使用禁止
- `noUnusedImports`: 未使用のインポート禁止
- `noUnusedVariables`: 未使用の変数禁止
- `useImportType`: 型のインポート推奨
- `useTemplate`: テンプレートリテラル推奨
- `useSortedClasses`: Tailwindクラスのソート

## React/Next.js規約

### コンポーネント構造

- 関数コンポーネントのみ使用
- React Hooksの規約に従う
- カスタムフックは`use`プレフィックス
- サーバーコンポーネントを優先

### ディレクトリ構造

- `/app`: ページとルーティング
- `/components`: 再利用可能なコンポーネント
- `/lib`: ユーティリティ関数
- `/services`: ビジネスロジック
- `/types`: 型定義

## テスト規約

### 単体テスト (Vitest)

- ファイル名: `*.test.ts(x)`または`*.spec.ts(x)`
- ブラウザテスト: `*.browser.test.ts(x)`
- テストタイムアウト: 10秒

### E2Eテスト (Playwright)

- モバイルファーストのテスト戦略
- iPhone 14を優先テスト対象

## 国際化 (i18n)

### メッセージ管理

- `/messages`ディレクトリで管理
- 対応言語: 日本語(ja)、英語(en)
- next-intlを使用

### ドキュメント言語

- README.md: 英語
- その他のドキュメント: 日本語
- ソースコード内コメント: 英語
- コミットメッセージ: 英語

## Git規約

### コミット

- Commitizen friendly
- GitHub flow準拠
- 英語でコミットメッセージ記述

### ブランチ戦略

- mainブランチが本番
- フィーチャーブランチで開発
- プルリクエストでマージ

## セキュリティ

### 機密情報管理

- git-secretで暗号化
- `.env.local`に機密情報を記載
- APIキーやトークンをコミットしない

### 環境変数

- 公開可能: `.env`
- 機密: `.env.local`
- クライアント用: `NEXT_PUBLIC_`プレフィックス

## パフォーマンス目標

- 画像判定応答: 3秒以内（最大5秒）
- ページロード: 2秒以内
- 同時接続: 最大1,000ユーザー
- ゲーム参加者: 最大50人/ゲーム

## 注意事項

- 外部ライブラリの使用は最小限に
- 標準ライブラリを優先
- 既存のコンポーネントやパターンに従う
- **なぜ**を説明するコメントのみ記載
- self-explanatoryなコメントは不要
