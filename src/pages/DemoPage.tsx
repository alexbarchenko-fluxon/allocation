import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, CheckCircle2, Info, XCircle, Moon, Sun } from 'lucide-react'

/**
 * shadcn/ui Component Demo
 * 
 * This page showcases default shadcn/ui components before Fluxon branding is applied.
 * 
 * CUSTOMIZATION NOTES:
 * - Colors, typography, and spacing will be customized via CSS variables in src/index.css
 * - Design tokens will be injected in tailwind.config.js
 * - Component variants can be adjusted in individual component files
 */

export default function DemoPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="h-full overflow-y-auto bg-sidebar">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">shadcn/ui Component Demo</h1>
              <p className="text-muted-foreground mt-2">
                Fluxon brand tokens applied from Figma
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => document.documentElement.classList.toggle('dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        
        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
          <p className="text-sm text-muted-foreground mb-4">
            → Fluxon brand colors will replace default variants
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        {/* Form Controls Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Form Controls</h2>
          <p className="text-sm text-muted-foreground mb-4">
            → Typography and input styling will match Fluxon design system
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="select">Select Option</Label>
              <Select>
                <SelectTrigger id="select">
                  <SelectValue placeholder="Choose an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Enter your message..." />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms" className="text-sm font-normal">
                Accept terms and conditions
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Radio Group</Label>
              <RadioGroup defaultValue="option1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option1" id="r1" />
                  <Label htmlFor="r1" className="font-normal">Option 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option2" id="r2" />
                  <Label htmlFor="r2" className="font-normal">Option 2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option3" id="r3" />
                  <Label htmlFor="r3" className="font-normal">Option 3</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Tabs</h2>
          <p className="text-sm text-muted-foreground mb-4">
            → Tab styling will inherit Fluxon active states and transitions
          </p>
          <Tabs defaultValue="overview" className="max-w-2xl">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <h3 className="text-lg font-medium">Overview Content</h3>
              <p className="text-muted-foreground">
                This is the overview tab with sample content. Tabs provide an easy way to organize content.
              </p>
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
              <h3 className="text-lg font-medium">Analytics Content</h3>
              <p className="text-muted-foreground">
                Analytics data and metrics would be displayed here.
              </p>
            </TabsContent>
            <TabsContent value="reports" className="space-y-4">
              <h3 className="text-lg font-medium">Reports Content</h3>
              <p className="text-muted-foreground">
                Generate and view reports in this section.
              </p>
            </TabsContent>
          </Tabs>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Cards</h2>
          <p className="text-sm text-muted-foreground mb-4">
            → Card borders, shadows, and backgrounds will use Fluxon tokens
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card description goes here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">This is the card content area with some example text.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Action</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Another Card</CardTitle>
                <CardDescription>With different content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Item 1</span>
                    <span className="text-sm font-medium">$99</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Item 2</span>
                    <span className="text-sm font-medium">$149</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Purchase</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stats Card</CardTitle>
                <CardDescription>Performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12,543</div>
                <p className="text-xs text-muted-foreground mt-1">+20.1% from last month</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Alerts Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            → Alert colors will map to Fluxon semantic color palette
          </p>
          <div className="space-y-4 max-w-2xl">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>
                This is an informational alert with default styling.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                This is an error alert indicating something went wrong.
              </AlertDescription>
            </Alert>

            <Alert className="border-green-500 text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Operation completed successfully. Custom success variant.
              </AlertDescription>
            </Alert>

            <Alert className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Please review this warning before proceeding.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Dialog/Modal Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Dialog / Modal</h2>
          <p className="text-sm text-muted-foreground mb-4">
            → Modal overlays and animations will follow Fluxon interaction patterns
          </p>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is a dialog description. Dialogs are used for important interactions that require user attention.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm">Dialog content goes here. You can include forms, information, or any other content.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setDialogOpen(false)}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {/* Table Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Table</h2>
          <p className="text-sm text-muted-foreground mb-4">
            → Table styling (borders, row hover, headers) will use Fluxon design tokens
          </p>
          <div className="max-w-3xl">
            <Table>
              <TableCaption>Sample data table</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">001</TableCell>
                  <TableCell>John Doe</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">002</TableCell>
                  <TableCell>Jane Smith</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell className="text-right">$150.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">003</TableCell>
                  <TableCell>Bob Johnson</TableCell>
                  <TableCell>Active</TableCell>
                  <TableCell className="text-right">$350.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">004</TableCell>
                  <TableCell>Alice Williams</TableCell>
                  <TableCell>Inactive</TableCell>
                  <TableCell className="text-right">$50.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>shadcn/ui baseline demo • Ready for Fluxon brand token injection</p>
        </div>
      </footer>
    </div>
  )
}
