import type { Meta, StoryObj } from "@storybook/nextjs";
import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Basic: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <p>This is a basic card with only content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is a card with a header and content.</p>
      </CardContent>
    </Card>
  ),
};

export const WithHeaderAndFooter: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is a card with a header, content, and footer.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Submit</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Action
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>This is a card with a header action.</p>
      </CardContent>
    </Card>
  ),
};

export const WithMultipleActions: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
        <CardAction>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Mark as Read
            </Button>
            <Button size="sm">View All</Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="border-b pb-4">
            <h3 className="font-medium">New message from John</h3>
            <p className="text-muted-foreground text-sm">
              Hey, how's it going?
            </p>
          </div>
          <div className="border-b pb-4">
            <h3 className="font-medium">New message from Sarah</h3>
            <p className="text-muted-foreground text-sm">
              Did you see the latest update?
            </p>
          </div>
          <div>
            <h3 className="font-medium">New message from Team</h3>
            <p className="text-muted-foreground text-sm">
              Meeting scheduled for tomorrow.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View All Messages
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const ProfileCard: Story = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary" />
          <div>
            <CardTitle>John Doe</CardTitle>
            <CardDescription>Software Engineer</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          Full-stack developer with 5 years of experience in web development.
          Passionate about creating user-friendly interfaces and scalable
          backend systems.
        </p>
        <div className="flex gap-2">
          <div className="h-2 flex-1 rounded bg-muted" />
          <div className="h-2 flex-1 rounded bg-muted" />
          <div className="h-2 flex-1 rounded bg-muted" />
          <div className="h-2 flex-1 rounded bg-muted" />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1">
          Message
        </Button>
        <Button className="flex-1">Follow</Button>
      </CardFooter>
    </Card>
  ),
};
