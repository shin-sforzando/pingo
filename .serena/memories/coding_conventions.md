# Pingoコーディング規約とスタイルガイド

## 基本開発ルール

1. **質問を先にする** - 指示が不明確な場合は実装前に確認
2. **全コメントは英語** - 「何を」ではなく「なぜ」を説明
3. **型安全性が重要** - TypeScriptを厳密に使用、 `any` 型禁止
4. **全てをテストする** - テストが通るまで次に進まない
5. **標準ライブラリ優先** - 可能な限り標準ライブラリを使用
6. **Linter警告を無視しない**
7. **全コンポーネントにStorybookストーリーが必要**
8. **DRY原則を遵守** - 重複コードを避け、再利用可能なコンポーネント/型を作成
9. **マジックナンバーを使用しない** - 定数として集約し、単一の真実の源を維持

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

## 定数管理とマジックナンバーの排除

### 原則: 単一の真実の源（Single Source of Truth）

すべての設定値と制約は `src/lib/constants.ts` に集約し、コード全体で再利用する

### 実例: ゲームID長さ制約の集約

Before（問題あり）:

```typescript
// ❌ BAD: コード全体にマジックナンバー "6" が散在（12箇所以上）

// src/app/api/game/create/route.ts
const GAME_ID_LENGTH = 6;  // ローカル定数

// src/app/game/join/page.tsx
const joinGameSchema = z.object({
  gameId: z.string()
    .min(6)  // マジックナンバー
    .max(6)  // マジックナンバー
    .regex(/^[A-Z0-9]{6}$/)  // マジックナンバー
});
const upperValue = value.slice(0, 6);  // マジックナンバー
if (gameIdValue.length !== 6) { }  // マジックナンバー
<Input maxLength={6} />  // マジックナンバー

// src/components/game/GameInfo.stories.tsx
id: faker.string.alphanumeric(6)  // マジックナンバー

// messages/ja.json
"gameIdDescription": "6文字のアルファベット大文字（例: ABCDEF）"

// messages/en.json
"gameIdDescription": "6 uppercase letters (e.g., ABCDEF)"
```

After（改善版）:

```typescript
// ✅ GOOD: src/lib/constants.ts - 単一の真実の源
/**
 * Game ID configuration
 */
export const GAME_ID_LENGTH = 6;
export const GAME_ID_PATTERN = /^[A-Z0-9]{6}$/;

// src/app/api/game/create/route.ts
import { GAME_ID_LENGTH } from "../../../../lib/constants";
const nanoid = customAlphabet(alphabet, GAME_ID_LENGTH);

// src/app/game/join/page.tsx
import { GAME_ID_LENGTH, GAME_ID_PATTERN } from "@/lib/constants";

const joinGameSchema = z.object({
  gameId: z.string()
    .min(GAME_ID_LENGTH)
    .max(GAME_ID_LENGTH)
    .regex(GAME_ID_PATTERN)
});
const upperValue = value.slice(0, GAME_ID_LENGTH);
if (gameIdValue.length !== GAME_ID_LENGTH) { }
<Input maxLength={GAME_ID_LENGTH} />

// src/components/game/GameInfo.stories.tsx
import { GAME_ID_LENGTH } from "@/lib/constants";
id: faker.string.alphanumeric(GAME_ID_LENGTH)

// messages/ja.json
"gameIdDescription": "{gameIdLength}文字のアルファベット大文字（例: ABCDEF）"

// messages/en.json
"gameIdDescription": "{gameIdLength} uppercase letters (e.g., ABCDEF)"

// 翻訳呼び出し側
t("Game.gameIdDescription", { gameIdLength: GAME_ID_LENGTH })
```

**改善点**:

- ✅ 変更が1箇所で完結（ `constants.ts` のみ修正）
- ✅ コンパイル時の型安全性
- ✅ IDE補完とリファクタリング対応
- ✅ 翻訳文字列も定数から値を取得
- ✅ コード全体で一貫した値

### 翻訳ファイルでの定数使用（next-intl）

next-intlのICU Message Formatを活用して、翻訳文字列中のマジックナンバーも定数化する

**パターン**: 翻訳文字列に `{variableName}` プレースホルダーを配置し、呼び出し側でパラメータとして渡す

```typescript
// messages/ja.json
{
  "Game": {
    "gameIdDescription": "{gameIdLength}文字のアルファベット大文字（例: ABCDEF）",
    "joinGameDescription": "{gameIdLength}文字のゲームIDを入力してゲームに参加してください"
  }
}

// messages/en.json
{
  "Game": {
    "gameIdDescription": "{gameIdLength} uppercase letters (e.g., ABCDEF)",
    "joinGameDescription": "Enter a {gameIdLength}-character game ID to join a game"
  }
}

// コンポーネントでの使用
import { GAME_ID_LENGTH } from "@/lib/constants";

const t = useTranslations();
<p>{t("Game.gameIdDescription", { gameIdLength: GAME_ID_LENGTH })}</p>
```

**メリット**:

- ✅ 翻訳文字列も定数から値を取得
- ✅ 多言語対応しながら値の一貫性を保持
- ✅ 翻訳者は `{gameIdLength}` の意味を理解しやすい

### constants.tsのブラウザ互換性

Node.js専用APIを使用する場合は、ランタイムチェックを追加する

```typescript
// ❌ BAD: ブラウザテストで失敗
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// ✅ GOOD: ブラウザとNode.js両対応
export const BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_URL) ||
  "http://localhost:3000";
```

**Why**: Vitest Browser Mode（webkit/chromium）では `process` が存在しないため、ランタイムチェックが必要

### 定数配置のガイドライン

| 定数の種類 | 配置場所 | 例 |
|----------|---------|---|
| アプリケーション全体の設定 | `src/lib/constants.ts` | `GAME_ID_LENGTH`, `BASE_URL` |
| 列挙型 | `src/types/common.ts` | `GameStatus`, `ProcessingStatus` |
| バリデーション正規表現 | `src/lib/constants.ts` | `GAME_ID_PATTERN` |
| Firebase設定 | `src/lib/firebase/config.ts` | `firebaseConfig` |
| 環境変数 | `.env.local` | `GEMINI_API_KEY` |

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
   - 例: `Game`, `User`, `Submission`, `PublicGameInfo`, `VerifiedGameInfo`

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

- ✅ 基礎型（ `Game` ）の変更に自動追従
- ✅ 型の意図が明確（「Gameのサブセット + カスタマイズ」）
- ✅ 複数箇所で再利用可能

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

### DRY原則の適用

重複コードを発見したら、即座に再利用可能なコンポーネントに抽出する

#### 実例: GameInfoCardの作成

Before（問題あり）:

```typescript
// join/page.tsx - 参加中ゲーム表示（80行）
{participatingGames.map((game) => (
  <Card key={game.id} className="cursor-pointer hover:bg-muted/50">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{game.title}</h4>
            <span className="font-mono text-muted-foreground text-xs">{game.id}</span>
          </div>
          <p className="text-muted-foreground text-sm">{game.theme}</p>
          {/* ... さらに40行 ... */}
        </div>
      </div>
    </CardContent>
  </Card>
))}

// 同じページ内で公開ゲーム表示も同様のコード（80行）
{availableGames.map((game) => (
  <Card key={game.id} className="cursor-pointer hover:bg-muted/50">
    {/* ... 上記と同じ構造 ... */}
  </Card>
))}
```

After（改善版）:

```typescript
// src/components/game/GameInfoCard.tsx
export interface GameInfoCardProps {
  game: PublicGameInfo;
  onClick: (game: PublicGameInfo) => void;
  locale: string;
  className?: string;
}

export function GameInfoCard({ game, onClick, locale, className }: GameInfoCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${className || ""}`}
      onClick={() => onClick(game)}
    >
      <CardContent className="p-4">
        {/* 統一されたゲーム情報表示ロジック */}
      </CardContent>
    </Card>
  );
}

// join/page.tsx - 参加中ゲーム（3行に削減）
{participatingGames.map((game) => (
  <GameInfoCard
    key={game.id}
    game={game}
    locale={locale}
    onClick={(game) => router.push(`/game/${game.id}`)}
  />
))}

// join/page.tsx - 公開ゲーム（5行に削減）
{availableGames.map((game) => (
  <GameInfoCard
    key={game.id}
    game={game}
    locale={locale}
    onClick={async (game) => {
      const result = await joinGame(game.id);
      if (result.success) router.push(`/game/${game.id}/share`);
    }}
  />
))}
```

**改善結果**:

- ✅ 重複コード160行 → 3+5行（95%削減）
- ✅ GameInfoCardコンポーネント: 80行で再利用可能
- ✅ Storybookストーリー追加（6パターン）
- ✅ ブラウザテスト追加（12テストケース）
- ✅ 統一されたUI/UX

### ファイル構造

```plain
src/components/
├── ui/           # shadcn/uiコンポーネント
├── magicui/      # Magic UIアニメーション
├── auth/         # 認証コンポーネント
├── layout/       # Header、Footer、Navigation
└── game/         # ゲーム専用コンポーネント（GameInfoCard等）
```

### 命名パターン

- **コンポーネント**: PascalCase（例: `ImageUpload.tsx`, `GameInfoCard.tsx`）
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

## React Hooks最適化

### useEffectの依存配列最適化

**オブジェクトを依存配列に含めない** - 不要な再レンダリングを防ぐため、安定したプリミティブ値を使用

#### 実例: useParticipatingGamesの依存配列最適化

Before（問題あり）:

```typescript
export function useParticipatingGames(user: User | null) {
  const [participatingGames, setParticipatingGames] = useState<PublicGameInfo[]>([]);

  useEffect(() => {
    const fetchGames = async () => {
      if (!user || !user.participatingGames) return;
      // フェッチ処理...
    };
    fetchGames();
  }, [user]); // ❌ userオブジェクト全体を依存配列に含める → 不要な再レンダリング
}
```

After（改善版）:

```typescript
export function useParticipatingGames(user: User | null) {
  const [participatingGames, setParticipatingGames] = useState<PublicGameInfo[]>([]);

  // Extract stable primitive values from user object
  const userId = user?.id;
  const participatingGameIdsKey = user?.participatingGames?.join(",") || "";

  useEffect(() => {
    const fetchGames = async () => {
      if (!userId || !participatingGameIdsKey) return;
      const participatingGameIds = participatingGameIdsKey.split(",");
      // フェッチ処理...
    };
    fetchGames();
  }, [userId, participatingGameIdsKey, fetchDetails]); // ✅ 安定したプリミティブ値のみ
}
```

**改善点**:

- ✅ userオブジェクトの参照変更による不要な再レンダリング防止
- ✅ IDと配列を文字列として安定化
- ✅ パフォーマンス向上

### useEffectのrace condition回避

複数のuseEffectが同時にリダイレクトを試みる場合、適切な条件チェックで優先順位を制御する

#### 実例: ログアウト時のリダイレクトrace condition

Before（問題あり）:

```typescript
// game/[gameId]/page.tsx
export default function GamePage() {
  const { user } = useAuth();
  const { isParticipating } = useGameParticipation(gameId, user);

  // ❌ ログアウト時にもisParticipating=falseになり、シェアページへリダイレクト
  useEffect(() => {
    if (isParticipating === false) {
      router.push(`/game/${gameId}/share`);
    }
  }, [isParticipating, gameId, router]);

  // AuthGuardが"/"へリダイレクトしようとするが、上記が先に実行される
  return <AuthGuard>{/* ... */}</AuthGuard>;
}
```

After（改善版）:

```typescript
// game/[gameId]/page.tsx
export default function GamePage() {
  const { user } = useAuth();
  const { isParticipating } = useGameParticipation(gameId, user);

  // ✅ ログイン済みユーザーのみシェアページへリダイレクト
  // Why: Prevents redirect to share page on logout, allowing AuthGuard to redirect to home
  useEffect(() => {
    if (user && isParticipating === false && isParticipating !== null) {
      router.push(`/game/${gameId}/share`);
    }
  }, [user, isParticipating, gameId, router]);

  return <AuthGuard>{/* ... */}</AuthGuard>;
}
```

**改善点**:

- ✅ `user`チェック追加により、ログアウト時のリダイレクトを防止
- ✅ AuthGuardのリダイレクト（`"/"`）を優先
- ✅ ログイン済み未参加ユーザーのみシェアページへリダイレクト

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
- **注意**: `page.queryByText()`は存在しない。`container.textContent`または`page.getByText()`を使用

### テストデータ

- `@faker-js/faker` を使用
- ULID生成: `faker.string.ulid()`
- 各テスト後にテストデータをクリーンアップ

### テストのベストプラクティス

#### 型定義とテストの整合性

テストは実装の型定義に合わせる

```typescript
// ❌ BAD: 型定義と異なる期待値
// PublicGameInfoではparticipantCountがnumber型（必須）
expect(result.current.participatingGames[0].participantCount).toBeUndefined();

// ✅ GOOD: 型定義に合わせた期待値
// fetchDetails: falseでもデフォルト値0を設定
expect(result.current.participatingGames[0]).toEqual({
  id: "GAME01",
  title: "Summer Adventure",
  theme: "",
  participantCount: 0,
  createdAt: null,
  expiresAt: null,
});
```

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
- DRY原則を遵守
- マジックナンバーを避け、定数を使用

### パフォーマンス

- 画像最適化の実装
- 適切なコード分割
- Reactのベストプラクティスに従う
- 不要な再レンダリングの回避（useEffect依存配列の最適化）
