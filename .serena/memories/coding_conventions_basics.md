# 基本開発ルール・スタイル・定数管理

## 基本開発ルール

1. **質問を先にする** - 指示が不明確な場合は実装前に確認
2. **全コメントは英語** - 「何を」ではなく「なぜ」を説明
3. **型安全性が重要** - TypeScriptを厳密に使用、`any`型禁止
4. **全てをテストする** - テストが通るまで次に進まない
5. **標準ライブラリ優先** - 可能な限り標準ライブラリを使用
6. **Linter警告を無視しない**
7. **全コンポーネントにStorybookストーリーが必要**
8. **DRY原則を遵守** - 重複コードを避け、再利用可能なコンポーネント/型を作成
9. **マジックナンバーを使用しない** - 定数として集約し、単一の真実の源を維持

## コードスタイル（Biome設定）

### フォーマット

- **インデント**: スペース2文字
- **引用符**: ダブルクォート
- **行末文字**: LF（Unix）
- **エンコーディング**: UTF-8

### リンター規則

**ERROR（厳格）**:

- `noExplicitAny` - any型禁止
- `noNonNullAssertion` - !演算子を避ける
- `noUnusedImports` / `noUnusedVariables`
- `noBannedTypes` - Object, String等を回避

**WARN（推奨）**:

- `noNestedComponentDefinitions`
- `noImgElement` - `<Image>`推奨
- `useSemanticElements`

**OFF**: `noUnknownAtRules` - Tailwind CSS対応

## 定数管理とマジックナンバーの排除

### 原則: 単一の真実の源（Single Source of Truth）

全ての設定値と制約は`src/lib/constants.ts`に集約

### パターン

```typescript
// ✅ GOOD: constants.ts
export const GAME_ID_LENGTH = 6;
export const GAME_ID_PATTERN = /^[A-Z0-9]{6}$/;
export const BOARD_SIZE = 5;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;
export const CENTER_CELL_INDEX = 12;

// 全箇所で使用
import { GAME_ID_LENGTH } from "@/lib/constants";
<Input maxLength={GAME_ID_LENGTH} />
```

**改善点**:

- ✅ 変更が1箇所で完結
- ✅ 算出可能な値は計算式で定義
- ✅ 定数名が自己説明的
- ✅ IDE補完とリファクタリング対応

**Tailwind CSS制約**: 動的クラス名は不可なので、コメントで明記

```typescript
// Note: grid-cols-5 is hardcoded in Tailwind
<div className={cn("grid grid-cols-5 gap-1", className)}>
```

### 翻訳ファイルでの定数使用

ICU Message Formatで翻訳文字列中の値も定数化

```typescript
// messages/ja.json
"gameIdDescription": "{gameIdLength}文字のアルファベット大文字"

// 使用
t("Game.gameIdDescription", { gameIdLength: GAME_ID_LENGTH })
```

### constants.tsのブラウザ互換性

Node.js専用API使用時はランタイムチェック追加

```typescript
// ✅ ブラウザとNode.js両対応
export const BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL) ||
  "http://localhost:3000";
```

**Why**: Vitest Browser Modeでは`process`が存在しない

### 定数配置ガイドライン

| 定数の種類 | 配置場所 | 例 |
|----------|---------|------|
| アプリ全体設定 | `src/lib/constants.ts` | `GAME_ID_LENGTH`, `BASE_URL` |
| 列挙型 | `src/types/common.ts` | `GameStatus`, `ProcessingStatus` |
| 正規表現 | `src/lib/constants.ts` | `GAME_ID_PATTERN` |
| Firebase設定 | `src/lib/firebase/config.ts` | `firebaseConfig` |
| 環境変数 | `.env.local` | `GEMINI_API_KEY` |

## コンポーネント規約

### ファイル構造

```plain
src/components/
├── ui/           # shadcn/ui
├── magicui/      # Magic UIアニメーション
├── auth/         # 認証
├── layout/       # Header、Footer、Navigation
└── game/         # ゲーム専用
```

### 命名パターン

- **コンポーネント**: PascalCase（例: `ImageUpload.tsx`）
- **関数**: camelCase、接頭辞付き（例: `handleClick`）
- **インターフェース**: PascalCase、接尾辞付き
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
  const handleEvent = () => { }

  // レンダー
  return <div>{/* JSX */}</div>
}
```

## Gitとブランチ規約

### ブランチ命名

- `{0埋め3桁Issue番号}_機能名`
- 例: Issue #19 → `019_prepare_github_actions`

### 作業フロー

**開始時**:

```bash
git checkout main
git pull origin main
git checkout -b 019_implement_feature
```

**完了時**:

```bash
npm run check    # コード品質
npm run test     # テスト
npm run build    # ビルド確認
git add .
git commit -m "feat: implement feature"
git push -u origin 019_implement_feature
```

### タスク完了チェック

1. `npm run check` - コード品質
2. `npm run test` - テスト
3. `npm run build` - ビルド
4. `npm run check:i18n` - 国際化（i18n変更時）

## セキュリティ

### 機密情報管理

- 秘密鍵・APIキーをコミットしない
- git-secretで暗号化
- `.env.local`に機密情報配置

### コード品質

- Biome使用（ESLint/Prettier代替）
- 型安全性最優先
- モバイルファーストデザイン
- DRY原則遵守

### パフォーマンス

- 画像最適化
- 適切なコード分割
- 不要な再レンダリング回避
