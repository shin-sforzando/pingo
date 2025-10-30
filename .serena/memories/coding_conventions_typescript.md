# TypeScript規約と型定義

## 設定

- **ターゲット**: ES2017
- **厳格モード**: 有効
- **パスマッピング**: `@/*` → `./src/*`
- **JSX**: preserve（Next.jsがコンパイル）

## 型定義の基本

- バリデーション + TypeScript型にはZodスキーマ使用
- 6文字ゲームID以外は全てULID使用
- ビジネスロジック型とは別のFirestoreドキュメントインターフェース
- TimestampInterfaceで適切なタイムスタンプ処理

## DRYと型の再利用

### 原則

常に既存の基礎型を流用し、一時的な型定義は共有型として定義する

### 型定義の配置ルール

1. **`src/types/schema.ts`** - Zodスキーマとドメインモデル型
   - アプリ全体で使用
   - 例: `Game`, `User`, `Submission`, `PublicGameInfo`, `VerifiedGameInfo`

2. **`src/types/game.ts`** - Firestoreドキュメント型と変換関数
   - Firestore用ドキュメントインターフェース
   - 例: `GameDocument`, `gameFromFirestore()`

3. **`src/types/common.ts`** - 列挙型と共通型
   - プロジェクト全体で使用
   - 例: `GameStatus`, `ProcessingStatus`

## 型の合成パターン

### 1. Pick + 型オーバーライド（推奨）

```typescript
// ❌ BAD: インライン型定義
const [state, setState] = useState<{
  id: string;
  title: string;
  expiresAt: Date | null;
}>(null);

// ✅ GOOD: 共有型として定義
// src/types/schema.ts
export type VerifiedGameInfo = Pick<Game, "id" | "title" | "theme"> & {
  expiresAt: Date | null;
};

// 使用
import type { VerifiedGameInfo } from "@/types/schema";
const [state, setState] = useState<VerifiedGameInfo | null>(null);
```

**メリット**:

- ✅ 基礎型の変更に自動追従
- ✅ 型の意図が明確
- ✅ 複数箇所で再利用可能

### 2. Omit（不要フィールド除外）

```typescript
// createdAt/updatedAtを除外
export type GameCreationInput = Omit<Game, "createdAt" | "updatedAt">;
```

### 3. Partial（全フィールドをオプショナル）

```typescript
// 部分更新用
export type GameUpdateInput = Partial<Pick<Game, "title" | "theme" | "notes">>;
```

## インライン型定義が許容される場合

以下の場合のみ許可:

1. 単一コンポーネント内のローカル状態（他で再利用されない）
2. 非常に単純な型（プリミティブ型のみ）
3. イベントハンドラーの引数型（React固有）

```typescript
// ✅ OK: ローカルなフォーム状態
const [formData, setFormData] = useState<{ name: string; age: number }>({ 
  name: "", age: 0 
});

// ✅ OK: イベントハンドラー
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { };
```

## 型キャストの禁止

**危険な型キャスト（`as Type`）は極力避ける**

```typescript
// ❌ BAD: nullabilityを無視
const game = {
  expiresAt: apiResponse.expiresAt as Date,
};

// ✅ GOOD: 適切な型定義
const game: VerifiedGameInfo = {
  expiresAt: apiResponse.expiresAt,  // Date | null を正しく扱う
};
```

**許容されるキャスト**:

- Zodバリデーション後の型アサーション
- Firestore Timestamp変換後の保証されたDate型
- テストコード内のモックデータ

## Zodスキーマのパターン

### nullable vs optional vs nullish

```typescript
// ❌ BAD: nullable()のみ（undefinedを受け入れない）
z.string().nullable()

// ✅ GOOD: nullable().optional()（既存パターン）
z.string().nullable().optional()
// null → ✅ OK
// undefined → ✅ OK

// 参考: nullish()（プロジェクトでは未使用）
z.string().nullish()  // nullable().optional()のショートハンド
```

**Why**: プロジェクト内では`.nullable().optional()`が標準パターン。一貫性のため`.nullish()`は使用しない。

**実例**: `src/types/schema.ts`

```typescript
export const imageCheckResponseSchema = z.object({
  matchedCellId: z.string().nullable().optional(),  // ← 既存パターン
  acceptanceStatus: z.enum(AcceptanceStatus).optional(),
});
```

## 実装パターン例

**参照先**:

- `src/types/schema.ts` - 共有型定義
- `src/app/game/join/page.tsx` - VerifiedGameInfo使用例
- `src/hooks/useGameJoin.ts` - 型安全なAPI呼び出し
