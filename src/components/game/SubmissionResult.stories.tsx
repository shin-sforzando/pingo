import type { Meta, StoryObj } from "@storybook/nextjs";
import { SubmissionResult } from "./SubmissionResult";

const meta: Meta<typeof SubmissionResult> = {
  title: "Game/SubmissionResult",
  component: SubmissionResult,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    confidence: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description: "AI confidence score (0-1)",
    },
    confidenceThreshold: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description: "Game confidence threshold (0-1)",
    },
    acceptanceStatus: {
      control: { type: "select" },
      options: ["accepted", "no_match", "inappropriate_content"],
      description: "Final acceptance status",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Accepted: Story = {
  args: {
    confidence: 0.85,
    critique_ja:
      "画像には木製のテーブルの上に赤いリンゴがはっきりと写っています。リンゴが写真の主な被写体であり、「リンゴ」のセルに完璧にマッチしています。画質も良好で、被写体が容易に識別できます。",
    critique_en:
      "The image clearly shows a red apple on a wooden table. The apple is the main subject of the photo and matches the 'apple' cell perfectly. The image quality is good and the subject is easily identifiable.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-1",
    matchedCellSubject: "Apple",
    confidenceThreshold: 0.7,
  },
};

export const NoMatch: Story = {
  args: {
    confidence: 0.45,
    critique_ja:
      "画像にはバナナが写っていますが、現在のビンゴボードには「バナナ」のセルがありません。画質は良好で被写体も明確ですが、利用可能な被写体のいずれにもマッチしません。",
    critique_en:
      "The image shows a banana, but there is no 'banana' cell available in the current bingo board. While the image quality is good and the subject is clear, it doesn't match any of the available subjects.",
    acceptanceStatus: "no_match",
    matchedCellId: null,
    matchedCellSubject: null,
    confidenceThreshold: 0.7,
  },
};

export const InappropriateContent: Story = {
  args: {
    confidence: 0.0,
    critique_ja:
      "画像には全年齢に適さないコンテンツが含まれています。ゲームのガイドラインに従った別の画像をアップロードしてください。",
    critique_en:
      "The image contains content that is not appropriate for all ages. Please upload a different image that follows the game guidelines.",
    acceptanceStatus: "inappropriate_content",
    matchedCellId: null,
    matchedCellSubject: null,
    confidenceThreshold: 0.7,
  },
};

export const LowConfidence: Story = {
  args: {
    confidence: 0.35,
    critique_ja:
      "画像には「車」に関連すると思われるものが写っているようですが、画像がぼやけており被写体がはっきりと見えません。確信度が必要な閾値を下回っています。",
    critique_en:
      "The image appears to show something that might be related to 'car', but the image is blurry and the subject is not clearly visible. The confidence level is below the required threshold.",
    acceptanceStatus: "no_match",
    matchedCellId: "cell-5",
    matchedCellSubject: "Car",
    confidenceThreshold: 0.7,
  },
};

export const HighConfidenceAccepted: Story = {
  args: {
    confidence: 0.95,
    critique_ja:
      "完璧なマッチです！画像には公園の中で美しいゴールデンレトリバー犬が写っています。犬が明らかに主な被写体であり、「犬」のセルに完璧にマッチしています。このマッチには高い確信度があります。",
    critique_en:
      "Excellent match! The image shows a beautiful golden retriever dog in a park setting. The dog is clearly the main subject and perfectly matches the 'dog' cell. High confidence in this match.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-3",
    matchedCellSubject: "Dog",
    confidenceThreshold: 0.7,
  },
};

export const EdgeCaseAccepted: Story = {
  args: {
    confidence: 0.71,
    critique_ja:
      "画像にはソファで眠っている猫が写っています。照明がやや暗いですが、猫ははっきりと見え、識別可能です。これは承認のための最小確信度の閾値を満たしています。",
    critique_en:
      "The image shows a cat sleeping on a couch. While the lighting is somewhat dim, the cat is clearly visible and identifiable. This meets the minimum confidence threshold for acceptance.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-7",
    matchedCellSubject: "Cat",
    confidenceThreshold: 0.7,
  },
};

export const LongCritique: Story = {
  args: {
    confidence: 0.82,
    critique_ja:
      "これは投稿された画像の非常に詳細な分析です。写真には白い机の表面に置かれた現代的なスマートフォンが写っています。デバイスは黒いケースのiPhoneのようで、画面にはさまざまなアプリアイコンが表示されたホーム画面がはっきりと見えます。画質は優れており、良好な照明とシャープな焦点があります。スマートフォンはわずかに角度をつけて配置されており、携帯電話デバイスとして容易に識別できます。これは高い確信度でビンゴボードの「スマートフォン」セルに明確にマッチします。背景はきれいで整理されており、主な被写体を強調するのに役立っています。全体として、これは要求された被写体を明確に示す優れた投稿です。",
    critique_en:
      "This is a very detailed analysis of the submitted image. The photograph shows a modern smartphone placed on a white desk surface. The device appears to be an iPhone with a black case, and the screen is clearly visible showing the home screen with various app icons. The image quality is excellent with good lighting and sharp focus. The smartphone is positioned at a slight angle, making it easy to identify as a mobile phone device. This clearly matches the 'smartphone' cell in the bingo board with high confidence. The background is clean and uncluttered, which helps emphasize the main subject. Overall, this is an excellent submission that clearly demonstrates the requested subject matter.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-12",
    matchedCellSubject: "Smartphone",
    confidenceThreshold: 0.6,
  },
};

export const WithCustomClassName: Story = {
  args: {
    confidence: 0.78,
    critique_ja:
      "画像には、空に鮮やかなオレンジ色とピンク色を伴う海に沈む美しい夕日が写っています。",
    critique_en:
      "The image shows a beautiful sunset over the ocean with vibrant orange and pink colors in the sky.",
    acceptanceStatus: "accepted",
    matchedCellId: "cell-9",
    matchedCellSubject: "Sunset",
    confidenceThreshold: 0.5,
    className: "max-w-md",
  },
};
