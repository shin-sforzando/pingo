# Pingoコーディング規約とスタイルガイド

## 基本開発ルール

1. **質問を先にする** - 指示が不明確な場合は実装前に確認
2. **全コメントは英語** - 「何を」ではなく「なぜ」を説明
3. **型安全性が重要** - TypeScriptを厳密に使用、`any`型禁止
4. **全てをテストする** - テストが通るまで次に進まない
5. **標準ライブラリ優先** - 可能な限り標準ライブラリを使用
6. **Linter警告を無視しない**
7. **全コンポーネントにStorybookストーリーが必要**

## コードスタイル（Biome設定）

### フォーマット

- **インデント**: スペース（.editorconfigで設定）
- **引用符**: JavaScript/TypeScriptではダブルクォート
- **インポート整理**: Biomeによる自動整理
- **行末文字**: .editorconfigによる自動検出

### リンター規則（厳格）

- `noExplicitAny`: ERROR - any型の使用禁止
- `noNonNullAssertion`: ERROR - !演算子の使用を避ける
- `noUnusedImports`: ERROR - 未使用インポートの除去
- `noUnusedVariables`: ERROR - 未使用変数の除去
- `noBannedTypes`: ERROR - 問題のある型の回避

## TypeScript規約

### 設定

- **ターゲット**: ES2017
- **厳格モード**: 有効
- **パスマッピング**: `@/*` → `./src/*`
- **JSX**: preserve（Next.jsがコンパイル処理）

### 型定義

- バリデーション + TypeScript型にはZodスキーマを使用
- 6文字ゲームID以外は全てULIDを使用
- ビジネスロジック型とは別のFirestoreドキュメントインターフェース
- TimestampInterfaceによる適切なタイムスタンプ処理

## コンポーネント規約

### ファイル構造

```plain
src/components/
├── ui/           # shadcn/uiコンポーネント
├── magicui/      # Magic UIアニメーション
├── auth/         # 認証コンポーネント
├── layout/       # Header、Footer、Navigation
└── game/         # ゲーム専用コンポーネント
```

### 命名パターン

- **コンポーネント**: PascalCase（例：`ImageUpload.tsx`）
- **関数**: 説明的な接頭辞付きcamelCase
  - イベントハンドラー: `handle`接頭辞（例：`handleClick`）
  - ユーティリティ関数: 説明的な名前
- **インターフェース**: 説明的な接尾辞付きPascalCase
- **定数**: UPPER_SNAKE_CASE

### コンポーネント構造

```typescript
// 1. インポート（外部、内部、型の順）
import { useState } from "react"
import { useTranslations } from "next-intl"
import type { ComponentProps } from "@/types"

// 2. インターフェース定義
interface ComponentNameProps {
  prop: string
}

// 3. コンポーネント定義
export function ComponentName({ prop }: ComponentNameProps) {
  // フックを最初に
  const t = useTranslations()
  const [state, setState] = useState<Type>(initialValue)

  // イベントハンドラー
  const handleEvent = () => {
    // 実装
  }

  // レンダー
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

## 国際化（next-intl）

- コンポーネント翻訳には`useTranslations()`フックを使用
  - 名前空間を省略して宣言し、ネストされた翻訳キーでも全て記述するように統一
- 翻訳キーは`messages/ja.json`と`messages/en.json`に配置
- 日本語をプライマリ言語、英語をセカンダリ言語として扱う
- 一貫した翻訳キー命名規則

## テスト規約

- **テストファイル**: `*.test.tsx`または`*.browser.test.tsx`
- **Storybookファイル**: `*.stories.tsx`
- テストデータには`@faker-js/faker`を使用
- ULID生成: `faker.string.ulid()`
- 各テスト後にテストデータをクリーンアップ

## Gitとブランチ規約

- `main`ブランチで直接作業しない
- ブランチ命名: `{0埋め3桁Issue番号}_機能名`
- 例: Issue #19の場合は`019_prepare_github_actions`

## ブランチ作業フロー

### 作業開始時

```bash
# mainブランチから最新を取得
git checkout main
git pull origin main

# 新しいブランチを作成（Issue番号付き）
git checkout -b 019_implement_game_join_ui
```

### 作業完了時

```bash
# コード品質チェック
npm run check

# テスト実行
npm run test:once

# ビルド確認
npm run build

# コミット（lefthookが自動チェック実行）
git add .
git commit -m "feat: implement game join UI components"

# プッシュしてPR作成
git push -u origin 019_implement_game_join_ui
```

## 必須チェック項目

### タスク完了時

1. `npm run check` - コード品質
2. `npm run test:once` - テスト実行
3. `npm run build` - ビルド確認
4. `npm run check:i18n` - 国際化確認（i18n関連変更時）

### Storybookの使用

- 新コンポーネントには必ずストーリーを作成
- `npm run storybook`でローカル確認
- 各バリエーション（状態、Props）をカバー

## セキュリティとベストプラクティス

### 機密情報管理

- 秘密鍵やAPIキーをコミットしない
- git-secretによる暗号化を使用
- `.env.local`に機密情報を配置

### コード品質

- ESLintやPrettierの代わりにBiomeを使用
- 型安全性を最優先
- 再利用可能なコンポーネントパターンに従う
- モバイルファーストのレスポンシブデザイン

### パフォーマンス

- 画像最適化の実装
- 適切なコード分割
- Reactのベストプラクティスに従う
- 不要な再レンダリングの回避
