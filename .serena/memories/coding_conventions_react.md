# Reactコンポーネントとフック

## DRY原則の適用

### 原則

重複コードを発見したら、即座に再利用可能なコンポーネントに抽出する

### 実例: GameInfoCard

**問題**: join/page.tsxで同じゲーム情報表示が160行重複

**解決**: `src/components/game/GameInfoCard.tsx`として抽出

- ✅ 重複コード160行 → 8行（95%削減）
- ✅ Storybookストーリー追加（6パターン）
- ✅ ブラウザテスト追加（12ケース）
- ✅ 統一されたUI/UX

```typescript
// GameInfoCard.tsx
export interface GameInfoCardProps {
  game: PublicGameInfo;
  onClick: (game: PublicGameInfo) => void;
  locale: string;
}

export function GameInfoCard({ game, onClick, locale }: GameInfoCardProps) {
  return (
    <Card onClick={() => onClick(game)}>
      {/* 統一されたゲーム情報表示 */}
    </Card>
  );
}

// 使用
{games.map((game) => (
  <GameInfoCard
    key={game.id}
    game={game}
    locale={locale}
    onClick={(game) => router.push(`/game/${game.id}`)}
  />
))}
```

## React Hooks最適化

### useEffectの依存配列最適化

**原則**: オブジェクトを依存配列に含めない。安定したプリミティブ値を使用

```typescript
// ❌ BAD: userオブジェクト全体
useEffect(() => {
  fetchGames(user);
}, [user]); // 不要な再レンダリング

// ✅ GOOD: 安定したプリミティブ値
const userId = user?.id;
const participatingGameIdsKey = user?.participatingGames?.join(",") || "";

useEffect(() => {
  fetchGames(userId, participatingGameIdsKey.split(","));
}, [userId, participatingGameIdsKey]);
```

**改善点**:

- ✅ 参照変更による不要な再レンダリング防止
- ✅ IDと配列を文字列として安定化
- ✅ パフォーマンス向上

### useEffectのrace condition回避

**問題**: 複数のuseEffectが同時にリダイレクトを試みる

```typescript
// ❌ BAD: ログアウト時にもリダイレクト
useEffect(() => {
  if (isParticipating === false) {
    router.push(`/game/${gameId}/share`);
  }
}, [isParticipating, gameId, router]);

// ✅ GOOD: ログイン済みユーザーのみリダイレクト
// Why: AuthGuardのリダイレクトを優先
useEffect(() => {
  if (user && isParticipating === false) {
    router.push(`/game/${gameId}/share`);
  }
}, [user, isParticipating, gameId, router]);
```

**実例**: `src/app/game/[gameId]/page.tsx`

## ビジネスロジックの分離

### 原則

複雑なビジネスロジックは`src/lib/`に独立した純粋関数として配置

**理由**:

- ✅ テスト容易性（純粋関数は単体テストが簡単）
- ✅ 再利用性（複数箇所で共有可能）
- ✅ 保守性（ビジネスロジックとインフラ層を分離）
- ✅ 型安全性（入出力が明確）

### 実例: ビンゴライン判定

**Before**: APIルート内にプライベート関数（テスト不可）

**After**: `src/lib/bingo-logic.ts`にエクスポート

```typescript
/**
 * Detect completed bingo lines on a player's board
 * Why: Supports shuffle feature with position-independent logic
 */
export function detectCompletedLines(playerBoard: PlayerBoard): CompletedLine[] {
  // Algorithm:
  // 1. Create 5x5 grid from cells and states
  // 2. Mark cells as open (FREE or isOpen: true)
  // 3. Check rows, columns, diagonals
  // 4. Return completed lines
}
```

**改善結果**:

- ✅ 27テストケース（100%カバレッジ）
- ✅ シャッフル対応検証済み
- ✅ 再利用可能

### 配置場所ガイドライン

| ロジック種類 | 配置場所 | 例 |
|------------|---------|------|
| ゲームルール | `src/lib/bingo-logic.ts` | `detectCompletedLines()` |
| ボード操作 | `src/lib/board-utils.ts` | `shuffleBoardCells()` |
| セル解決 | `src/lib/cell-utils.ts` | `resolveCellId()` |
| 画像処理 | `src/lib/image-utils.ts` | `validateImageFile()` |
| 日付計算 | `src/lib/date-utils.ts` | `calculateExpirationDate()` |

### 純粋関数の設計指針

1. **入出力を明確に** - 引数で全情報受取、副作用なし
2. **型定義を厳密に** - 引数と戻り値の型を明示
3. **エラーハンドリングを明確に** - 無効入力時は適切にエラースロー
4. **テストしやすく** - 小さな関数に分割、テストヘルパー提供

### テストパターン

```typescript
// テストヘルパー
function createTestPlayerBoard(): PlayerBoard { }
function openCellsAtPositions(board: PlayerBoard, positions: Array<{x, y}>): void { }

describe("detectCompletedLines", () => {
  describe("Empty board", () => {
    it("should return empty array", () => { });
  });

  describe("Row completion", () => {
    it.each([0, 1, 2, 3, 4])("should detect row %i", (rowIndex) => { });
  });

  describe("Shuffle support", () => {
    it("should work on shuffled board", () => { });
  });
});
```

**ベストプラクティス**:

- ✅ テストヘルパー関数提供
- ✅ パラメタライズドテスト（`it.each()`）
- ✅ `describe()`でグループ化
- ✅ エッジケース網羅
- ✅ 実装詳細でなく動作を検証

**参照先**:

- `src/lib/bingo-logic.ts` / `.test.ts` - 実装とテスト例
- `src/components/game/GameInfoCard.tsx` - DRY原則適用例
- `src/hooks/useParticipatingGames.ts` - useEffect最適化例
