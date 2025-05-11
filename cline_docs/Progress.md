# 進捗状況

## 現在の状態

Pingoプロジェクトは現在、基礎構築段階にあります。要件定義と技術設計が完了し、これからの開発作業の準備が整いました。

> [!NOTE]
> 詳細な要件や設計の情報については、 `./cline_docs/TechnicalSpecification.md` を参照してください。
> このファイルには、UIコンポーネントの実装上の懸念点や画面の詳細説明、ユーザーフローの図など、より詳細な情報が含まれています。

## 最近の変更

- プロジェクト要件の整理と技術仕様の策定
- データモデルの設計と修正
- APIエンドポイントの定義
- 画像処理フローの確立
- UI/UXデザインの基本方針決定
- メモリーバンクの作成
- next-intlを用いた多言語対応（日英）の基盤構築
- モバイルファーストのHeaderコンポーネント実装
  - 中央配置されたシステム名「Pingo」
  - 通知ドロワー機能（Drawerコンポーネント）
  - ユーザーメニュー（Popoverコンポーネント）
  - 言語切り替え機能（サーバーサイドアクション）
- 画面下部固定のFooterコンポーネント実装
  - サービス利用規約へのリンク
  - Hacking Papa画像（[はっきんぐパパ](https://hacking-papa.com)へのリンク付き）
  - 2025年固定のコピーライト表記
- ホームページの実装
  - UI改善
    - AnimatedGridPatternを背景に配置（z-indexの調整）
    - ボタンのサイズと配置の統一
  - 多言語対応（日英）の実装
  - テストとStorybookの作成
- データモデルの実装
  - Firestoreのタイムスタンプ処理に関する型定義とユーティリティ関数
  - アプリケーション全体で使用される共通の型定義（列挙型など）
  - Zodスキーマとそこから派生する型定義
  - ユーザー関連のFirestoreドキュメントインターフェースと変換関数
  - ゲーム関連のFirestoreドキュメントインターフェースと変換関数
  - 型定義のエクスポート
- ID形式の統一（ULIDへの移行）
  - ゲームID以外のすべてのIDをULIDに統一
  - schema.tsのバリデーションルールを更新
  - 関連するコメントの更新
  - ID生成ロジックの更新
  - userSchema.shape.idを使用した一貫性のあるバリデーション実装
- 認証系APIのテスト実装
  - `/me` APIのテスト実装（カバレッジ 88.88%）
  - `/logout` APIのテスト実装（カバレッジ 69.23%）
  - `/update` APIのテスト実装（カバレッジ 72.5%）
  - `/register` APIの既存テスト確認（カバレッジ 85.71%）
  - `/login` APIの既存テスト確認（カバレッジ 86.95%）
  - Firebase AuthenticationとFirestoreに期待通りのデータが登録されることを確認

## 次のステップ

優先度に基づいて、以下の順序で開発を進めていきます：

- 認証系の実装（Firebase Authentication）
  - 認証状態に合わせたUIの変更
  - 認証済みユーザーのみがアクセスできるページの保護
- 基本コンポーネントの実装と拡充
  - ビンゴボードコンポーネント
  - 画像アップロードコンポーネント
  - ゲーム作成フォーム
  - ゲーム参加フォーム

## アクティブな決定事項と検討事項

### 決定済み事項

1. 技術スタック
   - フロントエンド: Next.js (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4
   - バックエンド: Node.js 22 + Firebase (Authentication, Firestore, Storage)
   - AI/ML: Google Gemini API
   - デプロイ: Docker → Google Cloud Run
   - テスト: Vitest, Playwright, Firebase Emulator

2. データモデル
   - ユーザー、ゲーム、ビンゴボード、提出物などの基本構造を定義
   - Firestoreのコレクション設計を完了

3. API設計
   - RESTful APIエンドポイントの定義
   - 画像処理フローの確立（署名付きURL方式）

4. UI/UXデザイン
   - カラーパレット: #08d9d6, #252a34, #ff2e63, #eaeaea
   - フォント: M PLUS Rounded 1c, M PLUS 1 Code
   - モバイルファーストのレスポンシブデザイン

5. 多言語対応
   - next-intlを使用した日本語と英語の2言語対応
   - デフォルト言語は日本語
   - 翻訳リソースはJSON形式で管理
   - Cookieを使用したユーザー言語設定の保存
   - Storybookでの多言語対応テスト環境も整備済み

6. テスト
   - Vitest（単体テスト、APIテスト）
   - Playwright（E2Eテスト）
   - Storybook Test（コンポーネントテスト）
   - Firebase Emulator（Firestore、Authentication）

7. 開発ツール
   - コード品質: Biome.js
   - Git フック: Lefthook

### 検討中の事項

現時点では、主要な検討事項はすべて決定済みです。今後の開発過程で新たな検討事項が発生した場合は、ここに追加していきます。

## 残りの作業

T. B. D.

## 既知の問題

T. B. D.
