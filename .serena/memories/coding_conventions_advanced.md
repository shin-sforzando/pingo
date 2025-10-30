# 高度なパターンとベストプラクティス

## React Context キャッシュ無効化

### 原則

外部データ変更後は`refresh()`で明示的にキャッシュ無効化

### パターン

1. **Contextに`refresh()`メソッド追加**（`useCallback`使用）
2. **外部データ更新後に`await refresh()`呼び出し**
3. **エラー時も主要操作は成功として扱う**

```typescript
// src/contexts/AuthContext.tsx
export interface AuthContextType {
  refreshUser: () => Promise<void>; // キャッシュ無効化
}

const refreshUser = useCallback(async () => {
  if (!user) return;
  // Firestoreから最新データ取得
  const response = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  setUser(response.data.user);
}, [user]);
```

```typescript
// src/hooks/useGameJoin.ts
const joinGame = async (gameId: string) => {
  // ゲーム参加API呼び出し
  const response = await authenticatedFetch(`/api/game/${gameId}/join`, {
    method: "POST",
  });

  // Why: Firestoreの参加ゲームリスト更新されたがContextは古いまま
  try {
    await refreshUser();
  } catch (err) {
    // Log but don't fail - 主要操作は成功
    console.error("Failed to refresh user:", err);
  }
};
```

### 適用箇所

| ユースケース | 更新データ | refreshメソッド | 実装箇所 |
|------------|-----------|----------------|---------|
| ゲーム参加 | `participatingGames` | `refreshUser()` | `useGameJoin.ts` |
| ゲーム作成 | `participatingGames` | `refreshUser()` | `game/create/page.tsx` |
| プロフィール更新 | `users/{userId}` | `refreshUser()` | `updateUser()`内 |

### 設計上の重要ポイント

1. **エラー処理の粒度**: refresh失敗時も主要操作は成功
   - Why: UXの観点から「主要操作」と「付随操作」を分離

2. **テストの包括性**: Contextメソッド追加時、全モックファイル更新必須
   - Why: モック不完全だとテスト失敗
   - 対象: `*.test.ts`, `*.browser.test.tsx`全て

3. **依存配列**: `refresh`を`useCallback`でラップし依存配列に含める
   - Why: 安定した参照でuseEffectが適切に動作

**実例**: `src/contexts/AuthContext.tsx`, `src/hooks/useGameJoin.ts`, `src/hooks/useGameJoin.test.ts`

## LLM出力処理

### 原則

LLMの出力は不完全であることを前提とし、フォールバック処理を実装

### 実例: セルID vs 件名混同

**問題**: Gemini APIに「セルIDを返して」と指示しても件名を返す場合がある

```typescript
// Gemini APIレスポンス例
{
  matchedCellId: "牛乳",  // ❌ セルID（"cell-xxx"）を期待したが件名
  confidence: 0.85
}
```

**解決**: `src/lib/cell-utils.ts`にフォールバック処理

```typescript
export function resolveCellId(
  matchedCellId: string | null,
  availableCells: Cell[],
): string | null {
  if (!matchedCellId) return null;

  // Already looks like cell ID
  if (matchedCellId.startsWith("cell")) {
    return matchedCellId;
  }

  // Treat as subject name and search
  const matchedCell = availableCells.find(
    (cell) => cell.subject === matchedCellId || cell.id === matchedCellId,
  );

  return matchedCell?.id || null;
}
```

**改善点**:

- ✅ LLM不整合出力に対応
- ✅ 共有ユーティリティとして再利用
- ✅ UX損なわない（正しいセル開ける）

### Zodスキーマパターン

```typescript
// ✅ GOOD: nullable().optional()（既存パターン）
export const analysisResultSchema = z.object({
  matchedCellId: z.string().nullable().optional(),  // undefinedも許容
  confidence: z.number().min(0).max(1),
});
```

**Why**: プロジェクト標準は`.nullable().optional()`。`.nullish()`は使用しない

### LLM統合パターン

1. **スキーマ定義 + フォールバック**
   - Gemini APIに`responseSchema`渡す
   - Zodで`.nullable().optional()`使用
   - フォールバック処理実装

2. **テストでフォールバックカバー**
   - LLMが件名返すケース
   - LLMが存在しない値返すケース
   - LLMがフィールド省略するケース

**実例**: `src/lib/cell-utils.ts`, `src/types/schema.ts`

## その他の重要パターン

### テストヘルパー関数作成

```typescript
// src/test/helpers/auth-test-helpers.ts
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: ulid(),
    username: "testuser",
    createdAt: new Date(),
    isTestUser: true,
    ...overrides,
  };
}

export function mockAuthenticatedUser(
  userOverrides: Partial<User> = {},
): AuthContextType {
  return {
    user: createMockUser(userOverrides),
    loading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };
}
```

**Why**:

- テストデータ生成を再利用可能に
- DRY原則
- 型安全なモック

**実例**: `src/test/helpers/auth-test-helpers.ts`

### 重要な参照先

- `src/contexts/AuthContext.tsx` - Contextキャッシュ無効化
- `src/hooks/useGameJoin.ts` - refresh呼び出し例
- `src/lib/cell-utils.ts` - LLMフォールバック処理
- `src/lib/bingo-logic.ts` - ビジネスロジック分離
- `src/test/helpers/auth-test-helpers.ts` - テストヘルパー
