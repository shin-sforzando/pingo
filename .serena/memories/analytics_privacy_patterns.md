# アナリティクスとプライバシー管理パターン

## Google Analytics 4統合

### 基本構成

```typescript
// src/lib/analytics.ts - 中核となるアナリティクスモジュール
// src/components/analytics/GoogleAnalytics.tsx - GAスクリプトロード
// src/components/analytics/CookieConsentBanner.tsx - 同意UI
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

### Cookie同意バナー実装

```typescript
// src/components/analytics/CookieConsentBanner.tsx
export function CookieConsentBanner() {
  const t = useTranslations(); // 名前空間省略（規約準拠）
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const consentValue = localStorage.getItem("pingo_analytics_consent");
    
    // 未決定の場合のみ表示
    if (!consentValue) {
      setTimeout(() => setIsVisible(true), 1000); // UX向上のための遅延
    }
  }, []);

  const handleAccept = () => {
    setUserConsent(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    setUserConsent(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <Card>
        <CardContent>
          <h3>{t("CookieConsent.title")}</h3>
          <p>{t("CookieConsent.message")}</p>
          <Link href="/terms">{t("CookieConsent.learnMore")}</Link>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleDecline}>
            {t("CookieConsent.decline")}
          </Button>
          <Button onClick={handleAccept}>
            {t("CookieConsent.accept")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

#### 重要ポイント

- ✅ 未決定の場合のみ表示（accept/declineどちらかを選択後は非表示）
- ✅ オプトイン方式（同意するまでトラッキングしない）
- ✅ 利用規約へのリンク提供
- ✅ スライドアップアニメーション（UX向上）

## パフォーマンス最適化

### 同意確認の呼び出し削減

#### Before（非効率）

```typescript
// 複数回hasUserConsent()を呼び出し（5-6回）
if (hasUserConsent()) trackImageUploaded(gameId, cellId);
if (hasUserConsent()) trackCellMatched(gameId, cellId, subject);
if (hasUserConsent()) trackBingoAchieved(gameId, pattern);
```

#### After（最適化）

```typescript
// 1回のチェックで全イベントトラッキング
const canTrack = hasUserConsent();

if (canTrack) {
  try {
    trackImageUploaded(gameId, cellId);
    trackCellMatched(gameId, cellId, subject);
    if (newlyCompletedLines > 0) {
      trackBingoAchieved(gameId, `${newlyCompletedLines} line(s)`);
    }
  } catch (error) {
    console.error("Failed to track analytics events:", error);
  }
}
```

**Why**: localStorageアクセスを削減し、パフォーマンス向上

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

## 実装チェックリスト

新しいアナリティクスイベントを追加する場合：

- [ ] `AnalyticsEvent` Union型に新イベント定義を追加
- [ ] `trackXxx()` ヘルパー関数を作成（JSDocコメント付き）
- [ ] イベント送信前に `hasUserConsent()` チェック
- [ ] エラーハンドリングを実装（try-catchで囲む）
- [ ] テストを作成（`lib/analytics.test.ts`）

## 参考実装

- `src/lib/analytics.ts` - アナリティクス中核機能
- `src/components/analytics/GoogleAnalytics.tsx` - GAスクリプトロード
- `src/components/analytics/CookieConsentBanner.tsx` - 同意UI
- `src/components/game/ImageUpload.tsx` - 最適化された使用例
