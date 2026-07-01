import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { MainNavLogo } from "@/components/ui/main-nav-logo";
import { MainNavButton } from "@/components/ui/main-nav-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AppSwitcher } from "@/components/ui/app-switcher";

// Storybook-compatible version of TopNav
function TopNavStorybook() {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/people') {
      return location.pathname.startsWith('/people');
    }
    if (path === '/stats') {
      return location.pathname.startsWith('/stats');
    }
    if (path === '/deals') {
      return location.pathname.startsWith('/deals');
    }
    if (path === '/accounts') {
      return location.pathname.startsWith('/accounts');
    }
    return location.pathname === path;
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Deals', path: '/deals' },
    { label: 'People', path: '/people' },
    { label: 'Accounts', path: '/accounts' },
    { label: 'Stats', path: '/stats' },
  ];

  return (
    <header className="w-full bg-sidebar border-b border-border">
      <div className="w-full px-5 py-3 flex items-center justify-between">
        {/* Left side - Brand */}
        <div className="flex items-center w-[180px]">
          <MainNavLogo />
        </div>

        {/* Center - Navigation Menu */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <MainNavButton
              key={item.path}
              label={item.label}
              href={item.path}
              isActive={isActive(item.path)}
            />
          ))}
        </nav>

        {/* Right side - Tools */}
        <div className="flex items-center justify-end gap-4 w-[180px]">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* App Switcher */}
          <AppSwitcher />

          {/* Avatar + Dropdown */}
          <div className="flex items-center gap-1.5">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                alt="User avatar"
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* Dropdown button */}
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

const meta: Meta<typeof TopNavStorybook> = {
  title: "Layout/TopNav",
  component: TopNavStorybook,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof TopNavStorybook>;

/**
 * The default top navigation bar with Dashboard active.
 */
export const Default: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

/**
 * TopNav with Dashboard active (explicit).
 */
export const DashboardActive: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

/**
 * TopNav with People section active.
 */
export const PeopleActive: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/people"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

/**
 * TopNav with nested People route active (e.g., /people/123).
 */
export const PeopleNestedActive: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/people/123"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

/**
 * Visual comparison of different active states (non-interactive).
 */
export const AllStates: Story = {
  decorators: [], // No router decorator for this story
  render: () => (
    <div className="space-y-1">
      <MemoryRouter initialEntries={["/dashboard"]}>
        <TopNavStorybook />
      </MemoryRouter>
      <MemoryRouter initialEntries={["/people"]}>
        <TopNavStorybook />
      </MemoryRouter>
      <MemoryRouter initialEntries={["/accounts"]}>
        <TopNavStorybook />
      </MemoryRouter>
    </div>
  ),
};
