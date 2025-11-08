# アナリティクスとプライバシー管理パターン

## Google Analytics 4統合

### 基本構成

```typescript
// src/lib/analytics.ts - 中核となるアナリティクスモジュール
// src/components/analytics/GoogleAnalytics.tsx - GAスクリプトロード
// src/components/analytics/CookieConsentBanner.tsx - 同意UI（Drawerコンポーネント使用）
```

### 型安全なイベントトラッキング

#### Union型とジェネリクスで完全な型安全性を実現

```typescript
// 1. すべてのイベントをUnion型で定義
type AnalyticsEvent =
  | { name: "game_created"; params: { game_id: string; board_size: string } }
  | { name: "game_joined"; params: { game_id: string } }
  | { name: "image_uploaded"; params: { game_id: string; cell_id: string } }
  // ... 全11種類のイベント

// 2. ジェネリック関数で型推論を有効化
export function trackEvent<T extends AnalyticsEvent>(
  eventName: T["name"],
  eventParams: T["params"],
): void {
  // Implementation
}

// 3. 使用例 - IDEが自動補完、型チェック
trackEvent("game_created", { 
  game_id: "ABC123", 
  board_size: "5x5" 
}); // ✅ OK

trackEvent("game_created", { 
  game_id: "ABC123" 
}); // ❌ Error: board_size required
```

**Why**: Union型により不正なイベント名・パラメータの組み合わせをコンパイル時に検出

### gtag関数の型定義

#### 関数オーバーロードで各コマンドを正確に型付け

```typescript
declare global {
  interface Window {
    gtag?: {
      (command: "config", targetId: string, config?: GtagEventParams): void;
      (command: "event", eventName: string, params?: GtagEventParams): void;
      (command: "set", params: GtagEventParams): void;
      (command: "consent", action: "update", params: GtagConsentParams): void;
    };
  }
}
```

**Why**: 各コマンドごとに異なるシグネチャを持つため、型安全な使用が可能

## Cookie同意管理（GDPR/CCPA準拠）

### 同意状態の管理

```typescript
// LocalStorage key
const CONSENT_KEY = "pingo_analytics_consent";

// 同意確認（オプトイン方式）
export function hasUserConsent(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent === "granted"; // デフォルトfalse（オプトイン）
  } catch (error) {
    console.error("Failed to check analytics consent:", error);
    return false;
  }
}

// 同意設定
export function setUserConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    
    // GA consent modeを更新
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: granted ? "granted" : "denied",
      });
    }
    
    // 同一タブでの即座反映用カスタムイベント
    window.dispatchEvent(new CustomEvent("pingo:analytics-consent"));
  } catch (error) {
    console.error("Failed to set analytics consent:", error);
  }
}
```

### 同意チェックの一貫性

**重要な設計原則**: 同意チェックは`trackEvent()`関数内で一元管理

```typescript
// ❌ 古いパターン（非推奨）
const canTrack = hasUserConsent();
if (canTrack) {
  trackImageUploaded(gameId, cellId);
  trackCellMatched(gameId, cellId, subject);
}

// ✅ 新しいパターン（推奨）
// trackXxx関数内でhasUserConsent()がチェックされる
trackImageUploaded(gameId, cellId);
trackCellMatched(gameId, cellId, subject);
```

**Why**:

- DRY原則の遵守（重複コード削減）
- 一貫性の確保（すべてのtrackXxx関数が同じパターン）
- メンテナンス性の向上（変更箇所が1箇所）

### 同一タブでの同意状態同期

#### カスタムイベントによるリアルタイム反映

```typescript
// GoogleAnalytics.tsx
useEffect(() => {
  setHasConsent(hasUserConsent());

  // 同一タブでの変更を即座に反映
  const handleConsentChange = () => {
    setHasConsent(hasUserConsent());
  };

  // 別タブでの変更を反映
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "pingo_analytics_consent") {
      setHasConsent(hasUserConsent());
    }
  };

  window.addEventListener("pingo:analytics-consent", handleConsentChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener("pingo:analytics-consent", handleConsentChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}, []);
```

**Why**:

- `pingo:analytics-consent` - 同一タブ内の変更を即座に反映（ページリロード不要）
- `storage` イベント - 別タブでの変更を検知

### Cookie同意バナー実装（Drawerコンポーネント使用）

**重要**: Drawerコンポーネント（vaul）を使用してUIの一貫性とアクセシビリティを確保

```typescript
// src/components/analytics/CookieConsentBanner.tsx
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export function CookieConsentBanner() {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const consentValue = localStorage.getItem("pingo_analytics_consent");
    
    // 未決定の場合のみ表示
    if (!consentValue) {
      setTimeout(() => setIsOpen(true), 1000); // UX向上のための遅延
    }
  }, []);

  const handleAccept = () => {
    setUserConsent(true);
    setIsOpen(false);
  };

  const handleDecline = () => {
    setUserConsent(false);
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen} direction="bottom">
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader>
            <DrawerTitle>{t("CookieConsent.title")}</DrawerTitle>
            <DrawerDescription>{t("CookieConsent.message")}</DrawerDescription>
            <Link href="/terms">{t("CookieConsent.learnMore")}</Link>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="outline" onClick={handleDecline}>
              {t("CookieConsent.decline")}
            </Button>
            <Button onClick={handleAccept}>
              {t("CookieConsent.accept")}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

#### Drawerコンポーネント使用の重要ポイント

- ✅ **styled-jsx不使用** - Tailwind CSSのみで一貫性確保
- ✅ **vaulライブラリ** - アクセシビリティ対応（ARIA属性、フォーカストラップ自動）
- ✅ **既存UIパターンとの一貫性** - NotificationDrawerと同じパターン
- ✅ **direction="bottom"** - 下からスライドアップアニメーション内蔵
- ✅ **オプトイン方式** - 同意するまでトラッキングしない
- ✅ **利用規約へのリンク提供** - GDPR/CCPA準拠

#### アンチパターン（使用禁止）

```typescript
// ❌ styled-jsx使用（Tailwind CSSプロジェクトで一貫性がない）
<style jsx>{`
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
`}</style>

// ❌ Card/CardContentで独自実装（車輪の再発明）
<Card className="...">
  <CardContent>...</CardContent>
</Card>
```

**Why避けるべきか**:

- styled-jsxはTailwind CSSプロジェクトで一貫性を欠く
- vaulベースのDrawerは既にアクセシビリティ対応済み
- アニメーションロジックの重複を避ける（DRY原則）

## 型安全なエラーハンドリングパターン

### カスタムエラークラスの設計

**問題**: 文字列マッチング（`includes("Failed to...")`）は脆弱

- エラーメッセージ変更時に分類ロジックが破綻
- コンパイル時エラー検出不可
- テストが困難

**解決策**: カスタムエラークラスで型安全性を確保

```typescript
// src/types/errors.ts
export class ImageUploadError extends Error {
  constructor(
    message: string,
    public readonly phase:
      | "url_generation"
      | "storage_upload"
      | "submission_creation",
  ) {
    super(message);
    this.name = "ImageUploadError";
    
    // Proper stack trace (V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImageUploadError);
    }
  }
}

export class GeminiAnalysisError extends Error {
  constructor(
    message: string,
    public readonly errorType: "api_error" | "timeout" | "rate_limit",
  ) {
    super(message);
    this.name = "GeminiAnalysisError";
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GeminiAnalysisError);
    }
  }
}

export class ImageRejectedError extends Error {
  constructor(
    message: string,
    public readonly reason: string,
  ) {
    super(message);
    this.name = "ImageRejectedError";
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ImageRejectedError);
    }
  }
}
```

### エラーのthrowパターン

```typescript
// src/services/image-upload.ts

// ❌ 古いパターン（文字列マッチング依存）
throw new Error("Failed to upload image to storage");

// ✅ 新しいパターン（型安全）
throw new ImageUploadError(
  "Failed to upload image to storage",
  "storage_upload"
);
```

### 型安全なエラーハンドリング

```typescript
// src/components/game/ImageUpload.tsx

// ❌ 古いパターン（文字列マッチング）
try {
  // ...
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Upload failed";
  
  if (errorMessage.includes("Failed to get upload URL")) {
    trackImageUploadFailed(gameId, "url_generation", errorMessage);
  } else if (errorMessage.includes("Failed to upload image to storage")) {
    trackImageUploadFailed(gameId, "storage_upload", errorMessage);
  }
  // ...
}

// ✅ 新しいパターン（型安全）
try {
  // ...
} catch (error) {
  if (error instanceof ImageUploadError) {
    trackImageUploadFailed(gameId, error.phase, error.message);
  } else if (error instanceof GeminiAnalysisError) {
    trackGeminiAnalysisFailed(gameId, error.errorType, error.message);
  } else if (error instanceof ImageRejectedError) {
    trackImageRejected(gameId, error.reason);
    handleRemove(); // Clear preview
  } else {
    trackImageUploadFailed(gameId, "unknown", String(error));
  }
}
```

**メリット**:

- ✅ コンパイル時型チェック（instanceof）
- ✅ エラーメッセージ変更に強い（ロジックが文字列に依存しない）
- ✅ IDEの自動補完とリファクタリング支援
- ✅ テストしやすい（モックが容易）
- ✅ デバッグ情報が構造化（スタックトレース保持）

## エラートラッキングの分類

### エラーの適切な分類

```typescript
// Gemini関連エラー
trackGeminiAnalysisFailed(
  gameId, 
  "api_error" | "timeout" | "rate_limit" | "unknown",
  errorMessage
);

// インフラ関連エラー
trackImageUploadFailed(
  gameId,
  "url_generation" | "storage_upload" | "submission_creation" | "unknown",
  errorMessage
);

// コンテンツ安全性
trackImageRejected(gameId, reason);
```

**Why**: エラーの原因を正確に分類し、デバッグとモニタリングを容易に

## テスト戦略

### エラークラスのテスト（src/types/errors.test.ts）

```typescript
describe("Custom Error Classes", () => {
  describe("ImageUploadError", () => {
    it("should create error with correct properties", () => {
      const error = new ImageUploadError("Test", "storage_upload");
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ImageUploadError);
      expect(error.name).toBe("ImageUploadError");
      expect(error.phase).toBe("storage_upload");
      expect(error.stack).toBeDefined();
    });
  });

  describe("Type discrimination with instanceof", () => {
    it("should correctly discriminate between error types", () => {
      const uploadError = new ImageUploadError("Upload failed", "storage_upload");
      const geminiError = new GeminiAnalysisError("Analysis failed", "api_error");
      
      expect(uploadError instanceof ImageUploadError).toBe(true);
      expect(uploadError instanceof GeminiAnalysisError).toBe(false);
      
      expect(geminiError instanceof GeminiAnalysisError).toBe(true);
      expect(geminiError instanceof ImageUploadError).toBe(false);
    });
  });
});
```

### アナリティクスのテスト（src/lib/analytics.test.ts）

**重要**: テストでは実際に定義されたイベント型を使用

```typescript
// ❌ 型安全性を損なうパターン
trackEvent("test_event", { test: "data" }); // コンパイルエラー

// ✅ 正しいパターン
trackEvent("game_created", { game_id: "test-game", board_size: "3x3" });
trackEvent("game_joined", { game_id: "test-game" });
```

**Why**: 型システムの利点を活かし、リファクタリング時の安全性を確保

- 同意管理のテスト（hasUserConsent, setUserConsent）
- イベント送信のテスト（trackXxx関数）
- エラーハンドリングのテスト
- カバレッジ: 94.11%

## 実装チェックリスト

新しいアナリティクスイベントを追加する場合：

- [ ] `AnalyticsEvent` Union型に新イベント定義を追加
- [ ] `trackXxx()` ヘルパー関数を作成（JSDocコメント付き）
- [ ] **同意チェックは不要**（`trackEvent()`内で自動的に行われる）
- [ ] エラーハンドリングを実装（try-catchで囲む）
- [ ] テストを作成（`lib/analytics.test.ts`）- 実際のイベント型を使用

新しいエラー種別を追加する場合：

- [ ] カスタムエラークラスを作成（`src/types/errors.ts`）
- [ ] `Error.captureStackTrace()`でスタックトレース保持
- [ ] `readonly`プロパティで分類情報を保持
- [ ] throw箇所を修正（該当サービス/API）
- [ ] catch箇所で`instanceof`チェック
- [ ] テストを作成（`src/types/errors.test.ts`）

UIコンポーネント実装時：

- [ ] **既存のshadcn/uiコンポーネントを優先**（車輪の再発明を避ける）
- [ ] **styled-jsx使用禁止** - Tailwind CSSのみ使用
- [ ] Drawerが適切な場合は必ず使用（モーダル的UI）
- [ ] NotificationDrawer等の既存パターンを参考に

## 参考実装

- `src/lib/analytics.ts` - アナリティクス中核機能
- `src/types/errors.ts` - カスタムエラークラス
- `src/services/image-upload.ts` - エラーthrowの実装例
- `src/components/game/ImageUpload.tsx` - エラーハンドリングの実装例
- `src/components/analytics/GoogleAnalytics.tsx` - GAスクリプトロード
- `src/components/analytics/CookieConsentBanner.tsx` - 同意UI（Drawer使用）
- `src/components/layout/NotificationDrawer.tsx` - Drawerコンポーネント使用例
- `src/lib/analytics.test.ts` - アナリティクステスト
- `src/types/errors.test.ts` - エラークラステスト
