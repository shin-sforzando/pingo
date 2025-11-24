# テスト規約とベストプラクティス

## テストファイル命名

- **単体テスト（jsdom）**: `*.test.tsx` / `*.test.ts`
- **ブラウザテスト**: `*.browser.test.tsx`
- **Storybookファイル**: `*.stories.tsx`

## テストタイプ

### 1. 単体テスト（Vitest jsdom）

- APIルート、カスタムフック、サービス層
- jsdom環境で高速実行
- ファイルパターン: `src/**/*.test.{ts,tsx}`

### 2. ブラウザテスト（Vitest Browser Mode）

- 実ブラウザ（webkit + Playwright）でコンポーネント/ページテスト
- DOM操作、ユーザーインタラクションの統合テスト
- ファイルパターン: `src/**/*.browser.test.{ts,tsx}`
- 設定: `vitest.config.mts` のbrowserプロジェクト
- **注意**: `page.queryByText()` は存在しない → `container.textContent` または `page.getByText()` 使用

## テストデータ

- `@faker-js/faker`使用
- ULID生成: `faker.string.ulid()`
- 各テスト後にクリーンアップ

## ベストプラクティス

### 1. 型定義とテストの整合性

テストは実装の型定義に合わせる

```typescript
// ❌ BAD: 型定義と異なる期待値
expect(result.current.participatingGames[0].participantCount).toBeUndefined();

// ✅ GOOD: 型定義に合わせた期待値（デフォルト値0）
expect(result.current.participatingGames[0]).toEqual({
  id: "GAME01",
  title: "Summer Adventure",
  theme: "",
  participantCount: 0,  // number型（必須）
  createdAt: null,
  expiresAt: null,
});
```

### 2. モックデータの完全性

テストモックは実際のデータ構造に合わせる

```typescript
// ❌ BAD: 不完全なモックデータ
const mockPlayerBoard = {
  userId: mockUserId,
  cellStates: {},
  // cells配列が欠落 → エラー
};

// ✅ GOOD: 完全なモックデータ
const mockPlayerBoard = {
  userId: mockUserId,
  cells: [  // 必須フィールド
    {
      id: "cell_1",
      subject: "赤い自転車",
      position: { x: 0, y: 0 },
      isFree: false,
    },
  ],
  cellStates: {},
  completedLines: [],
};
```

**Why**: 機能追加でデータ構造変更時、テストモックも更新必須

### 3. Contextモックの更新

Contextにメソッド追加時、**全テストファイル**でモック更新

```typescript
// Context定義
export interface AuthContextType {
  user: User | null;
  // ... 既存メソッド
  refreshUser: () => Promise<void>; // NEW
}

// 全テストファイルで更新
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
    refreshUser: vi.fn(), // 追加忘れずに
  }),
}));
```

**Why**: モック不完全だと「Cannot read properties of undefined」エラー

**対象ファイル**: `*.test.ts`, `*.browser.test.tsx` 全て
**実例**: `src/hooks/useGameJoin.test.ts` 参照

## テストパターン

### パラメタライズドテスト

```typescript
describe("Row completion", () => {
  it.each([0, 1, 2, 3, 4])("should detect row %i", (rowIndex) => {
    // 各行をテスト
  });
});
```

### テストヘルパー関数

```typescript
// テストデータ生成を再利用可能に
function createTestPlayerBoard(): PlayerBoard { }
function openCellsAtPositions(board: PlayerBoard, positions: Array<{x, y}>): void { }
```

### カテゴリ分け

```typescript
describe("detectCompletedLines", () => {
  describe("Empty board", () => { });
  describe("Row completion", () => { });
  describe("Shuffle support", () => { });
  describe("Edge cases", () => { });
});
```

## Storybookの使用

- 新コンポーネントには必ずストーリー作成
- `npm run storybook` でローカル確認
- 各バリエーション（状態、Props）をカバー

**例**: `src/components/game/GameInfoCard.stories.tsx`

```typescript
const meta = {
  title: "Game/GameInfoCard",
  component: GameInfoCard,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof GameInfoCard>;

export const Default: Story = {
  args: { game: mockGame, onClick: fn() },
};

export const Expired: Story = {
  args: { game: expiredGame, onClick: fn() },
};
```

**参照先**:

- `src/lib/bingo-logic.test.ts` - 包括的なテスト例
- `src/hooks/useGameJoin.test.ts` - モック更新例
- `src/components/game/GameInfoCard.stories.tsx` - Storybook例
- `vitest.config.mts` - テスト設定の完全な例
