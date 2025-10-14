# Pingoコーディング規約とスタイルガイド

## 基本開発ルール

1. **質問を先にする** - 指示が不明確な場合は実装前に確認
2. **全コメントは英語** - 「何を」ではなく「なぜ」を説明
3. **型安全性が重要** - TypeScriptを厳密に使用、 `any` 型禁止
4. **全てをテストする** - テストが通るまで次に進まない
5. **標準ライブラリ優先** - 可能な限り標準ライブラリを使用
6. **Linter警告を無視しない**
7. **全コンポーネントにStorybookストーリーが必要**

## コードスタイル（Biome設定）

### フォーマット

- **インデント**: スペース2文字（.editorconfigで設定）
- **引用符**: JavaScript/TypeScriptではダブルクォート
- **インポート整理**: Biomeによる自動整理
- **行末文字**: LF（Unix形式、.editorconfigで設定）
- **文字エンコーディング**: UTF-8

### リンター規則

**ERROR（厳格）**:

- `noExplicitAny` - any型の使用禁止
- `noNonNullAssertion` - !演算子の使用を避ける
- `noUnusedImports` - 未使用インポートの除去
- `noUnusedVariables` - 未使用変数の除去
- `noBannedTypes` - 問題のある型（Object, String等）の回避

**WARN（推奨）**:

- `noNestedComponentDefinitions` - ネストされたコンポーネント定義の警告
- `noImgElement` - `<img>`より`<Image>`推奨（パフォーマンス）
- `noStaticElementInteractions` - アクセシビリティ警告
- `useSemanticElements` - セマンティックHTML推奨

**OFF（無効化）**:

- `noUnknownAtRules` - Tailwind CSS対応のため無効化

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

### 型定義のベストプラクティス

#### 基本方針: DRYと型の再利用

常に既存の基礎型を流用し、一時的な型定義は共有型として定義する

#### 型定義の配置ルール

1. **`src/types/schema.ts`** - Zodスキーマとドメインモデル型
   - アプリケーション全体で使用する型
   - Zodスキーマから推論される型
   - 例: `Game`, `User`, `Submission`

2. **`src/types/game.ts`** - Firestoreドキュメント型と変換関数
   - Firestore用のドキュメントインターフェース
   - ドメインモデル ↔ Firestoreの変換関数
   - 例: `GameDocument`, `gameFromFirestore()`

3. **`src/types/common.ts`** - 列挙型と共通型
   - プロジェクト全体で使用する定数型
   - 例: `GameStatus`, `ProcessingStatus`

#### 型の合成パターン

##### 1. Pick + 型オーバーライド（推奨）

基礎型から必要なフィールドを選択し、一部の型を上書きする場合:

```typescript
// ❌ BAD: インライン型定義（DRY違反）
const [state, setState] = useState<{
  id: string;
  title: string;
  theme: string;
  expiresAt: Date | null;  // Game型と定義が重複
} | null>(null);

// ✅ GOOD: 共有型として定義
// src/types/schema.ts
export type VerifiedGameInfo = Pick<Game, "id" | "title" | "theme"> & {
  expiresAt: Date | null;  // Game.expiresAtはDate型だが、APIレスポンスではnullable
};

// コンポーネントで使用
import type { VerifiedGameInfo } from "@/types/schema";
const [state, setState] = useState<VerifiedGameInfo | null>(null);
```

**メリット**:

- 基礎型（ `Game` ）の変更に自動追従
- 型の意図が明確（「Gameのサブセット + カスタマイズ」）
- 複数箇所で再利用可能

##### 2. Omit（不要なフィールドを除外）

```typescript
// createdAt/updatedAtを除外したゲーム作成用の型
export type GameCreationInput = Omit<Game, "createdAt" | "updatedAt">;
```

##### 3. Partial（全フィールドをオプショナルに）

```typescript
// 部分更新用の型
export type GameUpdateInput = Partial<Pick<Game, "title" | "theme" | "notes">>;
```

#### インライン型定義が許容される場合

以下の場合のみインライン型定義を許可:

1. **単一コンポーネント内のローカル状態** - 他で再利用されない
2. **非常に単純な型** - プリミティブ型の組み合わせのみ
3. **イベントハンドラーの引数型** - React固有の一時的な型

```typescript
// ✅ OK: ローカルなフォーム状態
const [formData, setFormData] = useState<{ name: string; age: number }>({ 
  name: "", 
  age: 0 
});

// ✅ OK: イベントハンドラー
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  // ...
};
```

#### 型キャストの禁止

**危険な型キャスト（`as Type`）は極力避ける**

```typescript
// ❌ BAD: 型キャストでnullabilityを無視
const game = {
  expiresAt: apiResponse.expiresAt as Date,  // nullの可能性を無視
};

// ✅ GOOD: 適切な型定義でnullを許容
const game: VerifiedGameInfo = {
  expiresAt: apiResponse.expiresAt,  // Date | null を正しく扱う
};
```

**許容されるキャスト**:

- Zodバリデーション後の型アサーション
- Firestore Timestamp変換後の保証されたDate型
- テストコード内のモックデータ

#### 実例: ゲーム参加ページの型定義

Before（問題あり）:

```typescript
// インライン型定義 + 危険なキャスト
const [verifiedGame, setVerifiedGame] = useState<{
  id: string;
  title: string;
  theme: string;
  expiresAt: Date | null;
} | null>(null);

// 型キャストでnullを無視
setVerifiedGame({
  id: game.id,
  title: game.title,
  theme: game.theme,
  expiresAt: game.expiresAt as Date,  // 危険！
});
```

After（改善版）:

```typescript
// src/types/schema.ts
export type VerifiedGameInfo = Pick<Game, "id" | "title" | "theme"> & {
  expiresAt: Date | null;
};

// コンポーネント
import type { VerifiedGameInfo } from "@/types/schema";

const [verifiedGame, setVerifiedGame] = useState<VerifiedGameInfo | null>(null);

// 型安全な代入
setVerifiedGame({
  id: game.id,
  title: game.title,
  theme: game.theme,
  expiresAt: game.expiresAt,  // 型安全！
});
```

**改善点**:

- ✅ DRY原則に従う（Game型から派生）
- ✅ 危険な型キャストを削除
- ✅ 複数箇所で再利用可能
- ✅ 型の意図が明確

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

- **コンポーネント**: PascalCase（例: `ImageUpload.tsx`）
- **関数**: 説明的な接頭辞付きcamelCase
  - イベントハンドラー: `handle` 接頭辞（例: `handleClick`）
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

- コンポーネント翻訳には `useTranslations()` フックを使用
  - 名前空間を省略して宣言し、ネストされた翻訳キーでも全て記述するように統一
- 翻訳キーは `messages/ja.json` と `messages/en.json` に配置
- 日本語をプライマリ言語、英語をセカンダリ言語として扱う
- 一貫した翻訳キー命名規則

## テスト規約

### テストファイル命名

- **単体テスト（jsdom）**: `*.test.tsx` または `*.test.ts`
- **ブラウザテスト**: `*.browser.test.tsx`
- **Storybookファイル**: `*.stories.tsx`

### テストタイプ

#### 1. 単体テスト（Vitest jsdom）

- APIルート、カスタムフック、サービス層
- jsdom環境で高速実行
- ファイルパターン: `src/**/*.test.{ts,tsx}`

#### 2. ブラウザテスト（Vitest Browser Mode）

- 実ブラウザ（webkit + Playwright）でコンポーネント/ページをテスト
- DOM操作、ユーザーインタラクションの統合テスト
- ファイルパターン: `src/**/*.browser.test.{ts,tsx}`
- 設定: `vitest.config.mts` のbrowserプロジェクト

### テストデータ

- `@faker-js/faker` を使用
- ULID生成: `faker.string.ulid()`
- 各テスト後にテストデータをクリーンアップ

## Gitとブランチ規約

- `main`ブランチで直接作業しない
- ブランチ命名: `{0埋め3桁Issue番号}_機能名`
- 例: Issue #19の場合は `019_prepare_github_actions`

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
- `npm run storybook` でローカル確認
- 各バリエーション（状態、Props）をカバー

## セキュリティとベストプラクティス

### 機密情報管理

- 秘密鍵やAPIキーをコミットしない
- git-secretによる暗号化を使用
- `.env.local` に機密情報を配置

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
