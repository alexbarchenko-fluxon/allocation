import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
import { Button } from "./button";

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

/**
 * A complete card with all sections.
 */
export const Default: Story = {
  render: () => (
    <Card className="w-[380px]">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Choose a name and deploy your project.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
};

/**
 * Various card configurations.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Card className="w-[300px]">
        <CardHeader>
          <CardTitle>Card with Header</CardTitle>
          <CardDescription>This card has a header and content.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Some content goes here.</p>
        </CardContent>
      </Card>

      <Card className="w-[300px]">
        <CardContent className="pt-6">
          <p className="text-sm">Simple card with content only.</p>
        </CardContent>
      </Card>

      <Card className="w-[300px]">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>You have 3 unread messages.</p>
            <p>2 items require your attention.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">View All</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};
